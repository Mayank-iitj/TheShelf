import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Target, CircleDot } from 'lucide-react';
import { fetchFutureSelf } from '../lib/api';
import FutureSelfChat from '../components/FutureSelfChat';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: 16 },
  show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 320, damping: 26 } }
};

function FutureSelf({ day }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    loadFutureSelf();
  }, [day]);

  async function loadFutureSelf() {
    const d = await fetchFutureSelf();
    setData(d);
  }

  if (!data) {
    return (
      <div>
        <h1 className="screen-title">Future Self</h1>
        <div className="skeleton" style={{ height: '100px', marginBottom: '48px', maxWidth: '800px' }} />
        <div className="skeleton" style={{ height: '64px', marginBottom: '12px', maxWidth: '800px' }} />
        <div className="skeleton" style={{ height: '64px', maxWidth: '800px' }} />
      </div>
    );
  }

  const reachedCount = data.markers ? data.markers.filter(m => m.status !== 'not_yet').length : 0;
  const totalCount = data.markers ? data.markers.length : 0;

  return (
    <div>
      <h1 className="screen-title">Future Self</h1>

      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          fontSize: '1.75rem',
          fontFamily: 'var(--font-display)',
          fontWeight: 600,
          lineHeight: 1.35,
          marginBottom: '52px',
          maxWidth: '760px',
          color: 'var(--text-primary)',
          letterSpacing: '-0.01em'
        }}
      >
        &ldquo;{data.portrait}&rdquo;
      </motion.div>

      <div style={{ maxWidth: '800px' }}>
        <h2 style={{ fontSize: '1rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
          <Target size={17} style={{ color: 'var(--growth)' }} /> Markers
        </h2>

        <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ position: 'relative' }}>
          {data.markers && data.markers.map((marker, idx) => {
            const reached = marker.status !== 'not_yet';
            const isLast = idx === data.markers.length - 1;
            return (
              <motion.div key={idx} variants={itemVariants} style={{ display: 'flex', gap: '18px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{
                    width: '10px', height: '10px', borderRadius: '50%',
                    background: reached ? 'var(--growth)' : 'var(--bg-surface-sunken)',
                    border: `2px solid ${reached ? 'var(--growth)' : 'var(--border-hairline-strong)'}`,
                    marginTop: '22px', flexShrink: 0
                  }} />
                  {!isLast && <div style={{ width: '1px', flex: 1, background: 'var(--border-hairline-strong)', minHeight: '20px' }} />}
                </div>
                <motion.div
                  whileHover={{ x: 3 }}
                  className={`card ${reached ? 'card--proposed' : ''}`}
                  style={{ flex: 1, marginBottom: '16px', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}
                >
                  <div style={{ width: '108px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: reached ? 'var(--growth)' : 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    {reached ? <CircleDot size={13} /> : <MapPin size={13} />} {marker.status.replace(/_/g, ' ')}
                  </div>
                  <div style={{ flex: 1, fontSize: '1rem', color: 'var(--text-primary)' }}>
                    {marker.marker}
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} style={{ marginTop: '8px', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
          Distance from here: {reachedCount} of {totalCount} markers.
        </motion.div>

        <FutureSelfChat />
      </div>
    </div>
  );
}

export default FutureSelf;
