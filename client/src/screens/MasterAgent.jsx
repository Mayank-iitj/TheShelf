import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cpu, ShieldCheck, Zap, Activity, RefreshCw, Compass, Gauge } from 'lucide-react';
import { fetchMaster } from '../lib/api';

const SCORE_SEGMENTS = 20;

function ScoreMeter({ score }) {
  const filledCount = Math.round((score / 100) * SCORE_SEGMENTS);
  return (
    <div className="meter" style={{ marginTop: '14px' }}>
      {Array.from({ length: SCORE_SEGMENTS }).map((_, i) => (
        <div key={i} className={`meter-seg ${i < filledCount ? 'filled' : ''}`} />
      ))}
    </div>
  );
}

const SUB_AGENTS = [
  { key: 'onboarding_agent', label: 'Onboarding Agent', icon: ShieldCheck, fallbackStatus: 'Active', fallbackSummary: 'Structured interview responses mapped to identity ledger.' },
  { key: 'daily_agent', label: 'Daily Curator Agent', icon: Zap, fallbackStatus: 'Active', fallbackSummary: 'Curates the daily 3-item cap or enforces a Zero-Item Day withhold.' },
  { key: 'review_agent', label: 'Weekly Review Agent', icon: Activity, fallbackStatus: 'Synced', fallbackSummary: 'Monitors behavior patterns and proposes ledger diffs.' }
];

function MasterAgent({ day }) {
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
      <div>
        <h1 className="screen-title">Master Orchestrator</h1>
        <div className="skeleton" style={{ height: '140px', marginBottom: '24px', borderRadius: 'var(--radius-md)' }} />
        <div className="skeleton" style={{ height: '90px', marginBottom: '24px', borderRadius: 'var(--radius-md)' }} />
        <div className="skeleton" style={{ height: '180px', borderRadius: 'var(--radius-md)' }} />
      </div>
    );
  }

  const { master_verdict, alignment_score = 0, velocity_status, sub_agent_reports, master_synthesis, strategic_directive } = data || {};

  return (
    <div style={{ maxWidth: '840px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px', gap: '20px' }}>
        <div>
          <h1 className="screen-title" style={{ marginBottom: '8px' }}>Master Orchestrator</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
            <Cpu size={14} /> Synthesizing 3 sub-agents for Day {day}
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleRefresh}
          disabled={refreshing}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}
        >
          <motion.span
            animate={refreshing ? { rotate: 360 } : { rotate: 0 }}
            transition={refreshing ? { repeat: Infinity, duration: 0.8, ease: 'linear' } : { duration: 0.2 }}
            style={{ display: 'inline-flex' }}
          >
            <RefreshCw size={15} />
          </motion.span>
          {refreshing ? 'Synthesizing…' : 'Run Master Synthesis'}
        </button>
      </div>

      {/* Verdict + Alignment Score */}
      <motion.div
        key={alignment_score}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
        style={{ padding: '32px', marginBottom: '20px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '260px' }}>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Gauge size={13} /> Master Verdict
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>
              {master_verdict || `Orchestrating sub-agent intelligence for Day ${day}.`}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div className="mono" style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--growth)', lineHeight: 1 }}>
              {alignment_score}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>Alignment Score</div>
          </div>
        </div>
        <ScoreMeter score={alignment_score} />
        {velocity_status && (
          <div style={{ marginTop: '14px' }}>
            <span className="stage-badge"><span className="dot" />{velocity_status}</span>
          </div>
        )}
      </motion.div>

      {/* Master Synthesis */}
      {master_synthesis && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid var(--border-hairline)' }}
        >
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: '10px' }}>
            Executive Synthesis
          </div>
          <p style={{ fontSize: '1.0625rem', lineHeight: 1.7, color: 'var(--text-primary)', margin: 0 }}>
            {master_synthesis}
          </p>
        </motion.div>
      )}

      {/* Strategic Directive */}
      {strategic_directive && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card card--flagged"
          style={{ padding: '22px 24px', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '16px' }}
        >
          <Compass size={22} style={{ color: 'var(--attention)', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--attention)', fontWeight: 600, marginBottom: '4px' }}>
              Strategic Directive
            </div>
            <div style={{ fontSize: '1.0625rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {strategic_directive}
            </div>
          </div>
        </motion.div>
      )}

      {/* Sub-Agent Signals */}
      <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: '14px' }}>
        Sub-Agent Signals
      </div>
      <div className="card" style={{ padding: '4px' }}>
        {SUB_AGENTS.map((agent, idx) => {
          const report = sub_agent_reports?.[agent.key];
          const status = report?.status || agent.fallbackStatus;
          const isActive = status.toLowerCase() !== 'inactive';
          const Icon = agent.icon;
          return (
            <div
              key={agent.key}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                padding: '18px 20px',
                borderTop: idx > 0 ? '1px solid var(--border-hairline)' : 'none'
              }}
            >
              <Icon size={17} style={{ color: isActive ? 'var(--growth)' : 'var(--text-tertiary)', marginTop: '2px', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>{agent.label}</span>
                  <span
                    className="mono"
                    style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: isActive ? 'var(--growth)' : 'var(--text-tertiary)' }}
                  >
                    {status}
                  </span>
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {report?.summary || agent.fallbackSummary}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MasterAgent;
