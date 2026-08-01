import { useState, useEffect } from 'react';
import { fetchLedger, purgeLedgerRow, editLedgerRow, fetchHabits } from '../lib/api';

function Ledger({ day }) {
  const [rows, setRows] = useState([]);
  const [habits, setHabits] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editClaim, setEditClaim] = useState('');

  useEffect(() => {
    loadLedger(day);
  }, [day]);

  async function loadLedger(d) {
    const [ledgerData, habitsData] = await Promise.all([
      fetchLedger(d),
      fetchHabits(d)
    ]);
    setRows(ledgerData);
    setHabits(habitsData);
  }

  const handlePurge = async (id) => {
    if (confirm("Are you sure? This cannot be undone.")) {
      await purgeLedgerRow(id);
      loadLedger(day);
      alert(`L${id.replace('L', '')} purged. Items removed from your pool.`);
    }
  };

  const startEdit = (row) => {
    setEditingId(row.id);
    setEditClaim(row.claim);
  };

  const saveEdit = async (id) => {
    await editLedgerRow(id, editClaim);
    setEditingId(null);
    loadLedger(day);
  };

  const tensions = habits.filter(h => h.contradicts_row);

  return (
    <div className="fade-enter-active">
      <h1 style={{ marginBottom: '40px' }}>Identity Ledger</h1>

      {tensions.length > 0 && (
        <div style={{ marginBottom: '48px', padding: '24px', background: 'var(--attention)', color: '#fff', borderRadius: '2px' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', color: '#fff' }}>Tensions</h2>
          {tensions.map(t => {
            const row = rows.find(r => r.id === t.contradicts_row);
            if (!row) return null;
            return (
              <div key={t.id} style={{ marginBottom: '16px', borderLeft: '3px solid rgba(255,255,255,0.5)', paddingLeft: '16px' }}>
                <div style={{ marginBottom: '8px' }}>
                  <strong>You said:</strong> {row.claim} <span className="mono">({row.id})</span>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <strong>You did:</strong> {t.pattern} <span className="mono">({t.id})</span>
                </div>
                <button className="btn" style={{ borderColor: 'rgba(255,255,255,0.5)', color: '#fff' }}>Which one is true?</button>
              </div>
            );
          })}
        </div>
      )}

      <div>
        {rows.map(row => (
          <div key={row.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, marginRight: '24px' }}>
                <div className="card-meta">
                  <span className="mono">{row.id}</span>
                  <span style={{ textTransform: 'uppercase' }}>{row.kind}</span>
                  <span>Strength: {(row.strength * 100).toFixed(0)}%</span>
                  <span>Day {row.updated_day}</span>
                </div>
                
                {editingId === row.id ? (
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <input 
                      value={editClaim} 
                      onChange={e => setEditClaim(e.target.value)} 
                      style={{ flex: 1, padding: '8px', fontSize: '1.125rem', fontFamily: 'var(--font-body)' }}
                    />
                    <button className="btn" onClick={() => saveEdit(row.id)}>Save</button>
                    <button className="btn" onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                ) : (
                  <div style={{ fontSize: '1.25rem', marginBottom: '8px', cursor: 'pointer' }} onClick={() => startEdit(row)}>
                    {row.claim}
                  </div>
                )}
                
                <div style={{ fontSize: '0.875rem', color: 'var(--dim)' }}>
                  {row.provenance}
                </div>
              </div>
              
              <button 
                className="btn" 
                style={{ fontSize: '0.875rem', borderColor: 'var(--attention)', color: 'var(--attention)' }}
                onClick={() => handlePurge(row.id)}
              >
                I'm not that person anymore
              </button>
            </div>
            
            <div style={{ marginTop: '16px', height: '4px', background: 'rgba(0,0,0,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: \`\${row.strength * 100}%\`, background: row.status === 'dormant' ? 'var(--rule)' : 'var(--ink)' }}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Ledger;
