import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, ExternalLink } from 'lucide-react';
import { fetchMasterplan, toggleMasterplanStage } from '../lib/api';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 320, damping: 26 } }
};

function Masterplan() {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchMasterplan();
      setPlan(data);
    } catch (err) {
      console.error('Masterplan fetch error:', err);
    }
    setLoading(false);
  }

  async function handleToggle(stage) {
    const nextDone = stage.done ? 0 : 1;
    setPlan(prev => ({
      ...prev,
      stages: prev.stages.map(s => s.id === stage.id ? { ...s, done: nextDone } : s)
    }));
    try {
      await toggleMasterplanStage(stage.id, !!nextDone);
    } catch (err) {
      console.error('Toggle failed, reverting:', err);
      load();
    }
  }

  if (loading) {
    return (
      <div>
        <h1 className="screen-title">Masterplan</h1>
        <div className="skeleton" style={{ height: '120px', marginBottom: '16px', maxWidth: '800px' }} />
        <div className="skeleton" style={{ height: '120px', marginBottom: '16px', maxWidth: '800px' }} />
        <div className="skeleton" style={{ height: '120px', maxWidth: '800px' }} />
      </div>
    );
  }

  if (!plan || !plan.stages || plan.stages.length === 0) {
    return (
      <div>
        <h1 className="screen-title">Masterplan</h1>
        <p style={{ color: 'var(--text-tertiary)' }}>No roadmap yet — complete onboarding to generate one.</p>
      </div>
    );
  }

  const doneCount = plan.stages.filter(s => s.done).length;

  return (
    <div>
      <h1 className="screen-title" style={{ marginBottom: '8px' }}>Masterplan</h1>
      <div style={{ color: 'var(--text-tertiary)', marginBottom: '32px', maxWidth: '800px' }}>
        Roadmap for: <strong style={{ color: 'var(--text-primary)' }}>{plan.goal}</strong>
        {' '}&middot; {doneCount} of {plan.stages.length} stages complete
      </div>

      <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ maxWidth: '800px' }}>
        {plan.stages.map((stage, idx) => (
          <motion.div
            key={stage.id}
            variants={itemVariants}
            whileHover={{ x: 3 }}
            className={`card ${stage.done ? 'card--proposed' : ''}`}
            style={{ marginBottom: '16px', padding: '20px 24px', cursor: 'pointer' }}
            onClick={() => handleToggle(stage)}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              {stage.done
                ? <CheckCircle2 size={22} style={{ color: 'var(--growth)', flexShrink: 0, marginTop: '2px' }} />
                : <Circle size={22} style={{ color: 'var(--text-tertiary)', flexShrink: 0, marginTop: '2px' }} />}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', textDecoration: stage.done ? 'line-through' : 'none', color: stage.done ? 'var(--text-tertiary)' : 'var(--text-primary)' }}>
                  {idx + 1}. {stage.title}
                </div>
                {stage.description && (
                  <div style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', marginTop: '6px' }}>
                    {stage.description}
                  </div>
                )}
                {stage.resources && stage.resources.length > 0 && (
                  <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {stage.resources.map((r, i) => (
                      <a
                        key={i}
                        href={r.url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--accent-cyan)', width: 'fit-content' }}
                      >
                        <ExternalLink size={12} /> {r.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

export default Masterplan;
