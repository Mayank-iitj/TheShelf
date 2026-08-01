import { useState, useEffect } from 'react';
import { useUser, useClerk, UserProfile } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { Download, ShieldCheck, Zap, BookOpen, Clock, Sparkles, Settings, RotateCcw, LogOut, Calendar } from 'lucide-react';
import { fetchPassport, fetchPotential, fetchLedger, fetchTwin, resetSimulation } from '../lib/api';

export default function Profile({ day, potential, stage, setOnboarded }) {
  const { user } = useUser();
  const { signOut, openUserProfile } = useClerk();
  const [downloading, setDownloading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [stats, setStats] = useState({ potential: potential || 0, claims: 0, minutes: 0 });

  useEffect(() => {
    async function loadStats() {
      try {
        const [pot, ledger, twin] = await Promise.all([
          fetchPotential(day),
          fetchLedger(day),
          fetchTwin(day)
        ]);
        setStats({
          potential: pot.index || potential || 840,
          claims: (ledger || []).length,
          minutes: twin.minutes_reclaimed || 0
        });
      } catch (err) {
        console.error('Failed to load profile stats:', err);
      }
    }
    loadStats();
  }, [day, potential]);

  const handleExportPassport = async () => {
    setDownloading(true);
    try {
      await fetchPassport();
    } catch (e) {
      console.error(e);
    }
    setDownloading(false);
  };

  const handleSignOut = () => {
    signOut({ redirectUrl: '/' });
  };

  const handleReset = async () => {
    if (!confirm('Reset the simulation back to Day 1? This clears your Shelf, Ledger, and Twin progress.')) return;
    setResetting(true);
    try {
      await resetSimulation();
      window.location.href = '/app';
    } catch (e) {
      console.error('Reset failed:', e);
      setResetting(false);
    }
  };

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : null;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Profile Header */}
      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          flexWrap: 'wrap',
          gap: '24px',
          background: 'linear-gradient(135deg, rgba(33,210,237,0.08) 0%, rgba(139,92,246,0.08) 100%)',
          borderColor: 'rgba(33,210,237,0.3)',
          marginBottom: '32px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <img 
            src={user?.imageUrl || 'https://picsum.photos/100/100'} 
            alt={user?.fullName || 'User Avatar'} 
            style={{ width: '72px', height: '72px', borderRadius: '50%', border: '2px solid var(--accent-cyan)' }}
          />
          <div>
            <h1 style={{ margin: 0, fontSize: '1.75rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {user?.fullName || user?.username || 'Architect of Self'}
              <ShieldCheck style={{ color: 'var(--accent-cyan)' }} size={22} />
            </h1>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '4px' }}>
              {user?.primaryEmailAddress?.emailAddress}
            </div>
            {memberSince && (
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Calendar size={12} /> Member since {memberSince}
              </div>
            )}
          </div>
        </div>

        <button 
          onClick={handleExportPassport}
          disabled={downloading}
          className="btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'var(--accent-cyan)',
            color: '#000',
            fontWeight: 700,
            padding: '12px 24px',
            borderRadius: '12px'
          }}
        >
          <Download size={18} />
          {downloading ? 'Generating Passport...' : 'Export Agentic Passport (.json)'}
        </button>
      </motion.div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: 0 }}>
          <Zap size={32} style={{ color: 'var(--accent-cyan)' }} />
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700 }} className="mono">{stats.potential}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Potential Index</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: 0 }}>
          <BookOpen size={32} style={{ color: '#a78bfa' }} />
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700 }} className="mono">{stats.claims}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Active Ledger Claims</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: 0 }}>
          <Clock size={32} style={{ color: '#f97316' }} />
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700 }} className="mono">{stats.minutes}m</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Focus Reclaimed</div>
          </div>
        </div>
      </div>

      {/* Controls Card */}
      <div className="card" style={{ padding: '8px', marginBottom: '32px' }}>
        <button
          className="btn"
          style={{ width: '100%', justifyContent: 'flex-start', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', border: 'none' }}
          onClick={() => openUserProfile()}
        >
          <Settings size={17} /> Account Settings
        </button>
        <button
          className="btn"
          style={{ width: '100%', justifyContent: 'flex-start', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', border: 'none', marginTop: '4px' }}
          onClick={handleReset}
          disabled={resetting}
        >
          <RotateCcw size={17} /> {resetting ? 'Resetting…' : 'Reset simulation to Day 1'}
        </button>
        <button
          className="btn"
          style={{ width: '100%', justifyContent: 'flex-start', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', border: 'none', marginTop: '4px', color: 'var(--accent-cyan)' }}
          onClick={async () => {
            if (!confirm('Re-onboard? This will clear all current settings and start the interview questionnaire again.')) return;
            try {
              // Call API to wipe DB tables
              await fetch('/api/onboarding/reset', { method: 'POST' });
              // Direct state change to force onboarding screen
              setOnboarded(false);
              window.location.href = '/app';
            } catch (err) {
              console.error(err);
            }
          }}
        >
          <Sparkles size={17} /> Re-Onboard & Restart Interview
        </button>
        <div style={{ height: '1px', background: 'var(--border-rule)', margin: '4px 0' }} />
        <button
          className="btn"
          style={{ width: '100%', justifyContent: 'flex-start', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', border: 'none', color: '#ef4444' }}
          onClick={handleSignOut}
        >
          <LogOut size={17} /> Log out
        </button>
      </div>

      {/* Embedded Clerk User Profile */}
      <div className="card" style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '16px' }}>
        <h2 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Sparkles size={20} style={{ color: 'var(--accent-cyan)' }} /> Full Clerk Profile & Security
        </h2>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <UserProfile 
            appearance={{
              elements: {
                rootBox: { width: '100%' },
                card: { background: 'transparent', boxShadow: 'none', width: '100%' }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
