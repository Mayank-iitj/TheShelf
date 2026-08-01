import { useState } from 'react';
import { motion } from 'framer-motion';
import { useUser, useClerk } from '@clerk/clerk-react';
import { LogOut, Settings, RotateCcw, ShieldCheck, Calendar } from 'lucide-react';
import { resetSimulation } from '../lib/api';

function Profile({ day, potential, stage }) {
  const { user } = useUser();
  const { signOut, openUserProfile } = useClerk();
  const [resetting, setResetting] = useState(false);

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

  if (!user) {
    return (
      <div>
        <h1 className="screen-title">Profile</h1>
        <div className="skeleton" style={{ height: '140px' }} />
      </div>
    );
  }

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : null;

  return (
    <div>
      <h1 className="screen-title">Profile</h1>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
        <img
          src={user.imageUrl}
          alt={user.fullName || 'Profile'}
          style={{ width: '64px', height: '64px', borderRadius: '50%', border: '1px solid var(--border-hairline-strong)', flexShrink: 0 }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
            {user.fullName || user.username || 'Unnamed'}
          </div>
          <div style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
            {user.primaryEmailAddress?.emailAddress}
          </div>
          {memberSince && (
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Calendar size={12} /> Member since {memberSince}
            </div>
          )}
        </div>
        <div className="stage-badge"><span className="dot" />{stage?.stage}</div>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Potential Index</div>
          <div className="mono" style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--growth)' }}>{potential}</div>
        </div>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Program Day</div>
          <div className="mono" style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>{day} <span style={{ fontSize: '1rem', color: 'var(--text-tertiary)' }}>/ 21</span></div>
        </div>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Stage</div>
          <div style={{ fontSize: '1.0625rem', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize', marginTop: '4px' }}>{stage?.stage}</div>
        </div>
      </div>

      <div className="card" style={{ padding: '8px' }}>
        <button
          className="btn btn-ghost"
          style={{ width: '100%', justifyContent: 'flex-start', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: 'var(--radius-sm)' }}
          onClick={() => openUserProfile()}
        >
          <Settings size={17} /> Manage account
        </button>
        <button
          className="btn btn-ghost"
          style={{ width: '100%', justifyContent: 'flex-start', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: 'var(--radius-sm)', marginTop: '4px' }}
          onClick={handleReset}
          disabled={resetting}
        >
          <RotateCcw size={17} /> {resetting ? 'Resetting…' : 'Reset simulation to Day 1'}
        </button>
        <div style={{ height: '1px', background: 'var(--border-hairline)', margin: '4px 0' }} />
        <button
          className="btn btn-ghost btn-danger"
          style={{ width: '100%', justifyContent: 'flex-start', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: 'var(--radius-sm)' }}
          onClick={handleSignOut}
        >
          <LogOut size={17} /> Log out
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '20px', color: 'var(--text-tertiary)', fontSize: '0.8125rem' }}>
        <ShieldCheck size={13} /> Authentication handled by Clerk.
      </div>
    </div>
  );
}

export default Profile;
