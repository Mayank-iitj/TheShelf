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
  hidden: { opacity: 0, x: -16 },
  show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 320, damping: 26 } }
};

const METER_SEGMENTS = 20;

function StrengthMeter({ strength, dormant }) {
  const filledCount = Math.round(strength * METER_SEGMENTS);
  return (
    <div className="meter">
      {Array.from({ length: METER_SEGMENTS }).map((_, i) => (
        <div key={i} className={`meter-seg ${i < filledCount ? `filled ${dormant ? 'dormant' : ''}` : ''}`} />
      ))}
    </div>
  );
}

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
      <h1 className="screen-title">Identity Ledger</h1>

      {tensions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="card card--flagged"
          style={{ marginBottom: '32px', padding: '28px' }}
        >
          <h2 style={{ fontSize: '1.0625rem', marginBottom: '18px', color: 'var(--attention)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} /> Tensions
          </h2>
          {tensions.map((t, idx) => {
            const row = rows.find(r => r.id === t.contradicts_row);
            if (!row) return null;
            return (
              <div key={t.id} style={{ padding: '16px 0', borderTop: idx > 0 ? '1px solid var(--border-hairline)' : 'none' }}>
                <div style={{ marginBottom: '8px', fontSize: '0.9375rem' }}>
                  <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: '8px' }}>You said</span>
                  {row.claim} <span className="mono" style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>({row.id})</span>
                </div>
                <div style={{ marginBottom: '14px', fontSize: '0.9375rem' }}>
                  <span style={{ color: 'var(--attention)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: '8px' }}>You did</span>
                  {t.pattern} <span className="mono" style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>({t.id})</span>
                </div>
                <button className="btn" style={{ borderColor: 'var(--attention-line)', color: 'var(--attention)' }}>Which one is true?</button>
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
                  <span className="mono"><Fingerprint size={13} /> {row.id}</span>
                  <span>{row.kind}</span>
                  <span>Strength: {(row.strength * 100).toFixed(0)}%</span>
                  <span>Day {row.updated_day}</span>
                </div>

                {editingId === row.id ? (
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                    <input
                      value={editClaim}
                      onChange={e => setEditClaim(e.target.value)}
                      autoFocus
                      style={{ flex: 1, padding: '10px 12px', fontSize: '1.0625rem', fontFamily: 'var(--font-body)', background: 'var(--bg-surface-sunken)', border: '1px solid var(--growth)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)', outline: 'none' }}
                    />
                    <button className="btn btn-primary" onClick={() => saveEdit(row.id)} title="Save"><Check size={16} /></button>
                    <button className="btn" onClick={() => setEditingId(null)} title="Cancel"><X size={16} /></button>
                  </div>
                ) : (
                  <div
                    className="card-title"
                    style={{ marginBottom: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                    onClick={() => startEdit(row)}
                  >
                    {row.claim} <Edit2 size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                  </div>
                )}

                <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                  {row.provenance}
                </div>
              </div>

              <button
                className="btn btn-danger"
                style={{ fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
                onClick={() => handlePurge(row.id)}
              >
                <Trash2 size={14} /> I'm not that person anymore
              </button>
            </div>

            <StrengthMeter strength={row.strength} dormant={row.status === 'dormant'} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

export default Ledger;
