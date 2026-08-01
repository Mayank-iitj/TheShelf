import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Tag, Zap, Coffee, TerminalSquare, ShieldAlert, CheckCircle2, Upload, Lock, Sparkles, Send, Moon } from 'lucide-react';
import { fetchShelf, submitProof } from '../lib/api';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

function Shelf({ day }) {
  const [data, setData] = useState({ items: [], action: null });
  const [loading, setLoading] = useState(true);
  const [expandedTrace, setExpandedTrace] = useState(false);
  const [expandedScore, setExpandedScore] = useState({});
  const [activeProofItem, setActiveProofItem] = useState(null);
  const [proofText, setProofText] = useState('');
  const [proofType, setProofType] = useState('text');
  const [submittingProof, setSubmittingProof] = useState(false);
  const [completedItems, setCompletedItems] = useState({});

  useEffect(() => {
    loadShelf(day);
  }, [day]);

  async function loadShelf(d) {
    setLoading(true);
    const shelfData = await fetchShelf(d, 'growth');
    setData(shelfData);
    setLoading(false);
  }

  const toggleScore = (id) => {
    setExpandedScore(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleProofSubmit = async () => {
    if (!proofText.trim()) return;
    setSubmittingProof(true);
    try {
      await submitProof(activeProofItem?.id, proofType, proofText);
      setCompletedItems(prev => ({ ...prev, [activeProofItem.id]: true }));
      setActiveProofItem(null);
      setProofText('');
    } catch (err) {
      console.error('Failed to submit proof:', err);
    }
    setSubmittingProof(false);
  };

  if (loading) {
    return (
      <div>
        <h1 className="screen-title">Today's Shelf</h1>
        <div className="skeleton" style={{ height: '80px', marginBottom: '32px', borderRadius: 'var(--radius-md)' }} />
        <div className="skeleton" style={{ height: '220px', borderRadius: 'var(--radius-md)' }} />
      </div>
    );
  }

  const { items, action } = data;

  const renderBreakdown = (jsonStr, score) => {
    if (!jsonStr) return <div className="mono" style={{ fontSize: '0.875rem' }}>Score: {Number(score).toFixed(2)}</div>;
    try {
      const breakdown = JSON.parse(jsonStr);
      return (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid var(--border-hairline-strong)' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Total Score</span>
            <span className="mono" style={{ fontWeight: 600, color: 'var(--growth)' }}>{Number(score).toFixed(2)}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
            {Object.entries(breakdown).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{k.replace(/_/g, ' ')}</span>
                <span className="mono" style={{ color: 'var(--text-primary)' }}>{Number(v).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      );
    } catch (e) {
      return <div className="mono" style={{ fontSize: '0.875rem' }}>Score: {Number(score).toFixed(2)}</div>;
    }
  };

  return (
    <div>
      <h1 className="screen-title">Today's Shelf</h1>

      {action && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          style={{ marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid var(--border-hairline)', overflow: 'hidden' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '1.0625rem' }} onClick={() => setExpandedTrace(!expandedTrace)}>
            <span>Today I chose to <em style={{ color: 'var(--growth)', fontStyle: 'normal', fontWeight: 600 }}>{action.intervention}</em>.</span>
            <span className="chip" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              {expandedTrace ? <ChevronDown size={13} /> : <ChevronRight size={13} />} why
            </span>
          </div>
          {expandedTrace && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ marginTop: '16px', color: 'var(--text-secondary)', background: 'var(--bg-surface-sunken)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-md)', padding: '20px', fontSize: '0.9375rem' }}
            >
              <p style={{ margin: 0 }}><strong style={{ color: 'var(--text-primary)' }}>Rationale:</strong> {action.rationale}</p>
              {action.considered && action.considered.length > 0 && (
                <div style={{ marginTop: '14px' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Considered alternatives</strong>
                  <ul style={{ paddingLeft: '20px', marginTop: '8px', marginBottom: 0 }}>
                    {action.considered.map((alt, idx) => (
                      <li key={idx} style={{ marginBottom: '4px' }}><em style={{ fontStyle: 'normal', color: 'var(--text-primary)' }}>{alt.intervention}</em>: {alt.rejected_because}</li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Feature 2: Zero-Item Day State */}
      {action && action.intervention === 'withhold' ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          className="card"
          style={{
            textAlign: 'center',
            padding: '80px 40px',
            background: 'radial-gradient(circle at 50% 30%, rgba(33, 210, 237, 0.05) 0%, rgba(9, 9, 11, 0.95) 70%)',
            border: '1px solid rgba(33, 210, 237, 0.2)',
            borderRadius: '24px',
            maxWidth: '640px',
            margin: '40px auto'
          }}
        >
          <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto 24px' }}>
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              border: '2px solid var(--accent-cyan)',
              animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
              opacity: 0.3
            }} />
            <div style={{
              width: '100%', height: '100%', borderRadius: '50%',
              background: 'rgba(33, 210, 237, 0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Lock size={36} style={{ color: 'var(--accent-cyan)' }} />
            </div>
          </div>

          <span className="chip" style={{ background: 'rgba(33, 210, 237, 0.15)', color: 'var(--accent-cyan)', marginBottom: '16px' }}>
            Audacious Anti-Dopamine Design
          </span>

          <h2 style={{ fontSize: '2rem', marginTop: '12px', marginBottom: '16px' }}>Zero-Item Day Enforced</h2>
          
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: 1.6, maxWidth: '480px', margin: '0 auto 24px' }}>
            "{action.rationale || 'Your focus and cognitive load are already optimal today. The Shelf is intentionally locked to protect your execution velocity. Go build.'}"
          </p>

          <div style={{ color: 'var(--accent-cyan)', fontSize: '0.875rem', fontFamily: 'var(--font-mono)' }}>
            ✓ Potential Index protected • No low-yield distractions served
          </div>
        </motion.div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <Moon size={22} />
          <div>
            <div className="empty-state-title">No shelf items yet</div>
            <div className="empty-state-body">Check back once today's curation has run, or scrub to a later day.</div>
          </div>
        </div>
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="cards-container">
          {items.map((item) => {
            const isRest = item.type === 'rest';
            const citedRows = item.cited_rows ? JSON.parse(item.cited_rows) : [];
            const isCompleted = completedItems[item.id] || item.completed;

            return (
              <motion.div
                key={item.id}
                variants={itemVariants}
                whileHover={{ y: -4, scale: 1.01 }}
                className="card" 
                style={{ 
                  background: isRest ? 'var(--bg-main)' : 'var(--bg-card)', 
                  border: isCompleted ? '1px solid var(--accent-cyan)' : isRest ? '1px dashed var(--text-muted)' : '1px solid var(--border-rule)',
                  opacity: isCompleted ? 0.85 : 1
                }}
              >
                <div className="card-meta">
                  <span className="mono">
                    <TerminalSquare size={13} /> {item.id}
                  </span>
                  <span>{item.source}</span>
                  <span style={{ color: isRest ? 'var(--text-tertiary)' : 'var(--accent-orange)' }}>
                    {isRest ? <Coffee size={13} /> : <Zap size={13} />} {item.type}
                  </span>
                  <span>{item.minutes}m</span>
                  <span style={{ color: 'var(--accent-cyan)' }}>{Array.from({length: item.difficulty || 1}).map(() => '●').join('')}</span>
                  {isCompleted && (
                    <span className="chip" style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', marginLeft: 'auto' }}>
                      <CheckCircle2 size={12} /> Verified Proof Submitted
                    </span>
                  )}
                </div>
                
                <h2 className="card-title" style={{ marginTop: '16px' }}>{item.title}</h2>
                
                <div style={{ margin: '16px 0', fontSize: '1.125rem', color: 'var(--text-main)' }}>
                  {item.why_now} 
                  {citedRows.map(rowId => (
                    <span key={rowId} className="chip" style={{ marginLeft: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Tag size={12} /> {rowId}
                    </span>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px', flexWrap: 'wrap', gap: '12px' }}>
                  <button className="btn mono" style={{ fontSize: '0.75rem', border: 'none', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-main)' }} onClick={() => toggleScore(item.id)}>
                    {expandedScore[item.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />} score breakdown
                  </button>

                  <button 
                    onClick={() => setActiveProofItem(item)}
                    className="btn"
                    style={{
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: isCompleted ? 'transparent' : 'rgba(33, 210, 237, 0.1)',
                      borderColor: 'var(--accent-cyan)',
                      color: 'var(--accent-cyan)'
                    }}
                  >
                    <Upload size={14} />
                    {isCompleted ? 'Update Proof' : 'Submit Proof of Action'}
                  </button>
                </div>

                {expandedScore[item.id] && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    style={{ marginTop: '16px', fontSize: '0.875rem', background: 'var(--bg-surface-sunken)', border: '1px solid var(--border-hairline)', padding: '16px', borderRadius: 'var(--radius-sm)' }}
                  >
                    {renderBreakdown(item.score_breakdown, item.score)}
                  </motion.div>
                )}
              </motion.div>
            );
          })}

          {items.length > 0 && (
            <motion.div variants={itemVariants} style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', marginTop: '32px', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
              <CircleCheck size={15} /> That's everything for today.
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Proof Submission Modal */}
      <AnimatePresence>
        {activeProofItem && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px'
          }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="card"
              style={{ width: '100%', maxWidth: '540px', background: 'var(--bg-card)', borderRadius: '20px' }}
            >
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.5rem' }}>
                <Sparkles style={{ color: 'var(--accent-cyan)' }} size={24} /> Submit Proof of Action
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                Provide evidence for <strong>"{activeProofItem.title}"</strong>. The AI Agent will verify your execution and update your Identity Ledger claims.
              </p>

              <div style={{ margin: '20px 0' }}>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  <button 
                    type="button"
                    onClick={() => setProofType('text')}
                    className="chip"
                    style={{ background: proofType === 'text' ? 'var(--accent-cyan)' : 'var(--border-rule)', color: proofType === 'text' ? '#000' : '#fff' }}
                  >
                    Reflection / Summary
                  </button>
                  <button 
                    type="button"
                    onClick={() => setProofType('url')}
                    className="chip"
                    style={{ background: proofType === 'url' ? 'var(--accent-cyan)' : 'var(--border-rule)', color: proofType === 'url' ? '#000' : '#fff' }}
                  >
                    GitHub PR / Project URL
                  </button>
                </div>

                <textarea
                  value={proofText}
                  onChange={(e) => setProofText(e.target.value)}
                  placeholder={proofType === 'url' ? 'https://github.com/your-username/your-repo/pull/12...' : 'Detail what you completed, built, or learned...'}
                  rows={4}
                  className="onboarding-textarea"
                  style={{ height: '120px', marginBottom: '16px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button className="btn" onClick={() => setActiveProofItem(null)}>Cancel</button>
                <button 
                  className="btn" 
                  disabled={submittingProof || !proofText.trim()}
                  onClick={handleProofSubmit}
                  style={{ background: 'var(--accent-cyan)', color: '#000', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Send size={14} /> {submittingProof ? 'Verifying...' : 'Submit to Agent'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Shelf;
