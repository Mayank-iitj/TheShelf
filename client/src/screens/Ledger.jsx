import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Fingerprint, Trash2, Edit2, Check, X } from 'lucide-react';
import { fetchLedger, purgeLedgerRow, editLedgerRow, fetchHabits } from '../lib/api';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

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
    <div>
      <h1 style={{ marginBottom: '40px' }} className="text-gradient">Identity Ledger</h1>

      {tensions.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ marginBottom: '48px', padding: '32px', background: 'rgba(249, 115, 22, 0.1)', border: '1px solid var(--accent-orange)', borderRadius: 'var(--radius-md)' }}
        >
          <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', color: 'var(--accent-orange)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={20} /> Tensions
          </h2>
          {tensions.map(t => {
            const row = rows.find(r => r.id === t.contradicts_row);
            if (!row) return null;
            return (
              <div key={t.id} style={{ marginBottom: '16px', borderLeft: '3px solid var(--accent-orange)', paddingLeft: '16px' }}>
                <div style={{ marginBottom: '8px' }}>
                  <strong style={{ color: 'var(--accent-orange)' }}>You said:</strong> {row.claim} <span className="mono text-muted">({row.id})</span>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <strong style={{ color: 'var(--accent-orange)' }}>You did:</strong> {t.pattern} <span className="mono text-muted">({t.id})</span>
                </div>
                <button className="btn" style={{ borderColor: 'var(--accent-orange)', color: 'var(--accent-orange)' }}>Which one is true?</button>
              </div>
            );
          })}
        </motion.div>
      )}

      <motion.div variants={containerVariants} initial="hidden" animate="show">
        {rows.map(row => (
          <motion.div key={row.id} variants={itemVariants} className="card" whileHover={{ y: -2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, marginRight: '24px' }}>
                <div className="card-meta">
                  <span className="mono" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Fingerprint size={14} /> {row.id}</span>
                  <span style={{ textTransform: 'uppercase' }}>{row.kind}</span>
                  <span>Strength: {(row.strength * 100).toFixed(0)}%</span>
                  <span>Day {row.updated_day}</span>
                </div>
                
                {editingId === row.id ? (
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <input 
                      value={editClaim} 
                      onChange={e => setEditClaim(e.target.value)} 
                      style={{ flex: 1, padding: '12px', fontSize: '1.125rem', fontFamily: 'var(--font-body)', background: 'var(--bg-main)', border: '1px solid var(--border-rule)', color: 'var(--text-main)', borderRadius: 'var(--radius-sm)' }}
                    />
                    <button className="btn" onClick={() => saveEdit(row.id)} title="Save"><Check size={16} /></button>
                    <button className="btn" onClick={() => setEditingId(null)} title="Cancel"><X size={16} /></button>
                  </div>
                ) : (
                  <div style={{ fontSize: '1.25rem', marginBottom: '8px', cursor: 'pointer', transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => startEdit(row)}>
                    {row.claim} <Edit2 size={16} style={{ color: 'var(--text-muted)' }} />
                  </div>
                )}
                
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  {row.provenance}
                </div>
              </div>
              
              <button 
                className="btn" 
                style={{ fontSize: '0.875rem', borderColor: 'var(--accent-orange)', color: 'var(--accent-orange)', display: 'flex', alignItems: 'center', gap: '8px' }}
                onClick={() => handlePurge(row.id)}
              >
                <Trash2 size={16} /> I'm not that person anymore
              </button>
            </div>
            
            <div style={{ marginTop: '24px', height: '6px', background: 'var(--bg-main)', borderRadius: '3px', overflow: 'hidden', border: '1px solid var(--border-rule)' }}>
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${row.strength * 100}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                style={{ height: '100%', background: row.status === 'dormant' ? 'var(--text-muted)' : 'var(--accent-cyan)', boxShadow: row.status === 'dormant' ? 'none' : '0 0 8px var(--accent-cyan)' }}
              ></motion.div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

export default Ledger;
