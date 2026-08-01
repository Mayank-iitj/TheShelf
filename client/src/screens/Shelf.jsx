import { useState, useEffect } from 'react';
import { fetchShelf } from '../lib/api';

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

  if (loading) return <div>Loading...</div>;

  const { items, action } = data;

  return (
    <div className="fade-enter-active">
      <h1 style={{ marginBottom: '40px' }}>Today's Shelf</h1>

      {action && (
        <div style={{ marginBottom: '40px', paddingBottom: '24px', borderBottom: '1px solid var(--rule)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }} onClick={() => setExpandedTrace(!expandedTrace)}>
            Today I chose to <em>{action.intervention}</em>. 
            <span style={{ color: 'var(--dim)', fontSize: '0.875rem' }}>
              {expandedTrace ? '▾' : '▸'} why
            </span>
          </div>
          {expandedTrace && (
            <div style={{ marginTop: '16px', color: 'var(--dim)' }}>
              <p><strong>Rationale:</strong> {action.rationale}</p>
              {action.considered && action.considered.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <strong>Considered Alternatives:</strong>
                  <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                    {action.considered.map((alt, idx) => (
                      <li key={idx}><em>{alt.intervention}</em>: {alt.rejected_because}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {action && action.intervention === 'withhold' ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--dim)', fontStyle: 'italic', fontSize: '1.25rem' }}>
          {action.rationale}
        </div>
      ) : (
        <div className="cards-container">
          {items.map((item, idx) => {
            const isRest = item.type === 'rest';
            const citedRows = item.cited_rows ? JSON.parse(item.cited_rows) : [];

            return (
              <div key={item.id} className="card" style={{ background: isRest ? 'rgba(0,0,0,0.02)' : 'var(--paper)', border: isRest ? '1px dashed var(--dim)' : '1px solid var(--rule)' }}>
                <div className="card-meta">
                  <span className="mono">{item.id}</span>
                  <span>{item.source}</span>
                  <span>{item.type}</span>
                  <span>{item.minutes}m</span>
                  <span>{Array.from({length: item.difficulty || 1}).map(() => '●').join('')}</span>
                </div>
                
                <h2 className="card-title">{item.title}</h2>
                
                <div style={{ margin: '16px 0', fontSize: '1.125rem' }}>
                  {item.why_now} 
                  {citedRows.map(rowId => (
                    <span key={rowId} className="chip" style={{ marginLeft: '8px' }}>[{rowId}]</span>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
                  <button className="btn mono" style={{ fontSize: '0.75rem', border: 'none', padding: 0 }} onClick={() => toggleScore(item.id)}>
                    {expandedScore[item.id] ? '▾' : '▸'} score
                  </button>
                </div>
                
                {expandedScore[item.id] && (
                  <div style={{ marginTop: '16px', fontSize: '0.875rem', color: 'var(--dim)', background: 'rgba(0,0,0,0.03)', padding: '12px' }} className="mono">
                    Score Breakdown: {item.score_breakdown ? item.score_breakdown : JSON.stringify({ score: item.score })}
                  </div>
                )}
              </div>
            );
          })}
          
          {items.length > 0 && (
            <div style={{ textAlign: 'center', marginTop: '40px', color: 'var(--dim)' }}>
              That's everything for today.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Shelf;
