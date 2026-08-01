import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, ShieldCheck, Sparkles, Zap, Activity, RefreshCw, Compass, Layers, CheckCircle2, ArrowRight } from 'lucide-react';
import { fetchMaster } from '../lib/api';

export default function MasterAgent({ day }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMasterData(day);
  }, [day]);

  async function loadMasterData(d) {
    setLoading(true);
    try {
      const res = await fetchMaster(d);
      setData(res);
    } catch (err) {
      console.error('Master agent error:', err);
    }
    setLoading(false);
  }

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetchMaster(day);
      setData(res);
    } catch (err) {
      console.error(err);
    }
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }} style={{ display: 'inline-block', marginBottom: '16px' }}>
          <Cpu size={40} style={{ color: 'var(--accent-cyan)' }} />
        </motion.div>
        <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Connecting to Master Orchestrator Agent...</div>
      </div>
    );
  }

  const { master_verdict, alignment_score, velocity_status, sub_agent_reports, master_synthesis, strategic_directive } = data || {};

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Header Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
        style={{
          padding: '36px',
          background: 'radial-gradient(circle at 80% 20%, rgba(33, 210, 237, 0.12) 0%, rgba(139, 92, 246, 0.08) 50%, rgba(9, 9, 11, 0.98) 100%)',
          borderColor: 'rgba(33, 210, 237, 0.4)',
          borderRadius: '24px',
          marginBottom: '32px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span className="chip" style={{ background: 'rgba(33, 210, 237, 0.2)', color: 'var(--accent-cyan)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Cpu size={14} /> Master Orchestrator Active
              </span>
              <span className="chip" style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80' }}>
                3 Sub-Agents Synced
              </span>
            </div>

            <h1 style={{ margin: '0 0 12px 0', fontSize: '2.25rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="text-gradient">Master Agent Command Center</span>
            </h1>

            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', margin: 0, maxWidth: '600px', lineHeight: 1.6 }}>
              {master_verdict || `Orchestrating Sub-Agent Intelligence for Day ${day}.`}
            </p>
          </div>

          {/* Alignment Score Meter */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(0,0,0,0.5)', padding: '20px 28px', borderRadius: '20px', border: '1px solid rgba(33, 210, 237, 0.3)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
              Master Alignment
            </div>
            <div className="mono text-gradient" style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1 }}>
              {alignment_score || 88}%
            </div>
            <div className="chip" style={{ background: 'rgba(33, 210, 237, 0.15)', color: 'var(--accent-cyan)', marginTop: '8px', fontSize: '0.8rem' }}>
              {velocity_status || 'Optimal Momentum'}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Strategic Directive Banner */}
      {strategic_directive && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
          style={{
            background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.15) 0%, rgba(33, 210, 237, 0.1) 100%)',
            borderLeft: '4px solid #a78bfa',
            marginBottom: '32px',
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}
        >
          <Compass size={28} style={{ color: '#a78bfa', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a78bfa', fontWeight: 700, marginBottom: '4px' }}>
              Master Strategic Directive
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>
              {strategic_directive}
            </div>
          </div>
        </motion.div>
      )}

      {/* Sub-Agents Live Status Grid */}
      <h2 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.35rem' }}>
        <Layers size={22} style={{ color: 'var(--accent-cyan)' }} /> Sub-Agent Execution Matrix
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {/* Onboarding Agent */}
        <motion.div whileHover={{ y: -4 }} className="card" style={{ margin: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} style={{ color: 'var(--accent-cyan)' }} />
              Onboarding Agent
            </div>
            <span className="chip" style={{ background: 'rgba(33, 210, 237, 0.15)', color: 'var(--accent-cyan)', fontSize: '0.75rem' }}>
              {sub_agent_reports?.onboarding_agent?.status || 'Active'}
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
            {sub_agent_reports?.onboarding_agent?.summary || 'Structured interview responses mapped to identity ledger.'}
          </p>
        </motion.div>

        {/* Daily Curator Agent */}
        <motion.div whileHover={{ y: -4 }} className="card" style={{ margin: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={18} style={{ color: '#f97316' }} />
              Daily Curator Agent
            </div>
            <span className="chip" style={{ background: 'rgba(249, 115, 22, 0.15)', color: '#f97316', fontSize: '0.75rem' }}>
              {sub_agent_reports?.daily_agent?.status || 'Intervening'}
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
            {sub_agent_reports?.daily_agent?.summary || 'Curates daily 3-item cap or enforces Zero-Item Day withhold.'}
          </p>
        </motion.div>

        {/* Weekly Review Agent */}
        <motion.div whileHover={{ y: -4 }} className="card" style={{ margin: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} style={{ color: '#a78bfa' }} />
              Weekly Review Agent
            </div>
            <span className="chip" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa', fontSize: '0.75rem' }}>
              {sub_agent_reports?.review_agent?.status || 'Synced'}
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
            {sub_agent_reports?.review_agent?.summary || 'Monitors dropoff patterns and proposes ledger diff proposals.'}
          </p>
        </motion.div>
      </div>

      {/* Master Executive Synthesis */}
      <div className="card" style={{ padding: '28px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={20} style={{ color: 'var(--accent-cyan)' }} /> Master Executive Synthesis
        </h3>
        <p style={{ color: 'var(--text-main)', fontSize: '1.05rem', lineHeight: 1.7, margin: '0 0 20px 0' }}>
          {master_synthesis}
        </p>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--accent-cyan)', color: '#000', fontWeight: 700 }}
          >
            <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
            {refreshing ? 'Synthesizing...' : 'Run Master Synthesis'}
          </button>
        </div>
      </div>
    </div>
  );
}
