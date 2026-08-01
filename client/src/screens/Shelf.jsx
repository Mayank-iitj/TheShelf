import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronRight, Tag, Zap, Coffee, TerminalSquare, Moon, CircleCheck } from 'lucide-react';
import { fetchShelf } from '../lib/api';

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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
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

      {action && action.intervention === 'withhold' ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="empty-state"
        >
          <Moon size={22} />
          <div>
            <div className="empty-state-title">Nothing prescribed today</div>
            <div className="empty-state-body">{action.rationale}</div>
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

            return (
              <motion.div
                key={item.id}
                variants={itemVariants}
                whileHover={{ y: -2 }}
                className={`card ${isRest ? 'card--rest' : ''}`}
              >
                <div className="card-meta">
                  <span className="mono">
                    <TerminalSquare size={13} /> {item.id}
                  </span>
                  <span>{item.source}</span>
                  <span style={{ color: isRest ? 'var(--text-tertiary)' : 'var(--attention)' }}>
                    {isRest ? <Coffee size={13} /> : <Zap size={13} />} {item.type}
                  </span>
                  <span>{item.minutes}m</span>
                  <span style={{ color: 'var(--growth)' }}>{Array.from({length: item.difficulty || 1}).map(() => '●').join('')}</span>
                </div>

                <h2 className="card-title">{item.title}</h2>

                <div style={{ margin: '12px 0 20px', fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {item.why_now}
                  {citedRows.length > 0 && (
                    <div style={{ marginTop: '10px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {citedRows.map(rowId => (
                        <span key={rowId} className="chip" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Tag size={11} /> {rowId}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid var(--border-hairline)' }}>
                  <button className="btn btn-ghost mono" style={{ fontSize: '0.75rem', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => toggleScore(item.id)}>
                    {expandedScore[item.id] ? <ChevronDown size={13} /> : <ChevronRight size={13} />} score breakdown
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
    </div>
  );
}

export default Shelf;
