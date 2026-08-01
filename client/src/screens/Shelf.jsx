import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronRight, Tag, Zap, Coffee, TerminalSquare } from 'lucide-react';
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

  if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading the Shelf...</div>;

  const { items, action } = data;

  const renderBreakdown = (jsonStr, score) => {
    if (!jsonStr) return <div>Score: {Number(score).toFixed(2)}</div>;
    try {
      const breakdown = JSON.parse(jsonStr);
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px solid var(--border-rule)', paddingBottom: '4px' }}>
            <strong style={{ color: 'var(--text-main)' }}>Total Score</strong>
            <strong style={{ color: 'var(--accent-cyan)' }}>{Number(score).toFixed(2)}</strong>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'x 16px' }}>
            {Object.entries(breakdown).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ textTransform: 'capitalize', color: 'var(--text-muted)' }}>{k.replace('_', ' ')}</span>
                <span style={{ color: 'var(--text-main)' }}>{Number(v).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      );
    } catch (e) {
      return <div>Score: {Number(score).toFixed(2)}</div>;
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '40px' }} className="text-gradient">Today's Shelf</h1>

      {action && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }} 
          animate={{ opacity: 1, height: 'auto' }} 
          style={{ marginBottom: '40px', paddingBottom: '24px', borderBottom: '1px solid var(--border-rule)', overflow: 'hidden' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }} onClick={() => setExpandedTrace(!expandedTrace)}>
            Today I chose to <em style={{ color: 'var(--accent-cyan)' }}>{action.intervention}</em>. 
            <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
              {expandedTrace ? <ChevronDown size={16} /> : <ChevronRight size={16} />} why
            </span>
          </div>
          {expandedTrace && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              style={{ marginTop: '16px', color: 'var(--text-muted)' }}
            >
              <p><strong>Rationale:</strong> {action.rationale}</p>
              {action.considered && action.considered.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <strong>Considered Alternatives:</strong>
                  <ul style={{ paddingLeft: '20px', marginTop: '8px', listStyleType: 'square' }}>
                    {action.considered.map((alt, idx) => (
                      <li key={idx} style={{ marginBottom: '4px' }}><em>{alt.intervention}</em>: {alt.rejected_because}</li>
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
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '1.25rem' }}
        >
          {action.rationale}
        </motion.div>
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="cards-container">
          {items.map((item) => {
            const isRest = item.type === 'rest';
            const citedRows = item.cited_rows ? JSON.parse(item.cited_rows) : [];

            return (
              <motion.div 
                key={item.id} 
                variants={itemVariants}
                whileHover={{ y: -4, scale: 1.01 }}
                className="card" 
                style={{ background: isRest ? 'var(--bg-main)' : 'var(--bg-card)', border: isRest ? '1px dashed var(--text-muted)' : '1px solid var(--border-rule)' }}
              >
                <div className="card-meta">
                  <span className="mono" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <TerminalSquare size={14} /> {item.id}
                  </span>
                  <span>{item.source}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: isRest ? 'var(--text-muted)' : 'var(--accent-orange)' }}>
                    {isRest ? <Coffee size={14} /> : <Zap size={14} />} {item.type}
                  </span>
                  <span>{item.minutes}m</span>
                  <span style={{ color: 'var(--accent-cyan)' }}>{Array.from({length: item.difficulty || 1}).map(() => '●').join('')}</span>
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

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px' }}>
                  <button className="btn mono" style={{ fontSize: '0.75rem', border: 'none', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-main)' }} onClick={() => toggleScore(item.id)}>
                    {expandedScore[item.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />} score breakdown
                  </button>
                </div>
                
                {expandedScore[item.id] && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }} 
                    style={{ marginTop: '16px', fontSize: '0.875rem', background: 'var(--bg-main)', padding: '16px', borderRadius: 'var(--radius-sm)' }} 
                    className="mono"
                  >
                    {renderBreakdown(item.score_breakdown, item.score)}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
          
          {items.length > 0 && (
            <motion.div variants={itemVariants} style={{ textAlign: 'center', marginTop: '40px', color: 'var(--text-muted)' }}>
              That's everything for today.
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}

export default Shelf;
