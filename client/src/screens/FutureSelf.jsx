import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Target } from 'lucide-react';
import { fetchFutureSelf } from '../lib/api';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: 20 },
  show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
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

  if (!data) return <div style={{ color: 'var(--text-muted)' }}>Loading...</div>;

  const reachedCount = data.markers ? data.markers.filter(m => m.status !== 'not_yet').length : 0;
  const totalCount = data.markers ? data.markers.length : 0;

  return (
    <div>
      <h1 style={{ marginBottom: '40px' }} className="text-gradient">Future Self</h1>
      
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', lineHeight: 1.3, marginBottom: '60px', maxWidth: '800px', fontStyle: 'italic' }}
      >
        "{data.portrait}"
      </motion.div>

      <div style={{ maxWidth: '800px' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Target size={20} style={{ color: 'var(--accent-cyan)' }} /> Markers
        </h2>
        
        <motion.div variants={containerVariants} initial="hidden" animate="show">
          {data.markers && data.markers.map((marker, idx) => (
            <motion.div key={idx} variants={itemVariants} whileHover={{ scale: 1.01, x: 4 }} style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', padding: '24px', border: '1px solid var(--border-rule)', borderRadius: 'var(--radius-md)', background: marker.status !== 'not_yet' ? 'var(--bg-card-hover)' : 'var(--bg-card)', boxShadow: marker.status !== 'not_yet' ? '0 0 16px var(--border-glow)' : 'none' }}>
              <div style={{ width: '120px', fontSize: '0.875rem', fontWeight: 600, color: marker.status !== 'not_yet' ? 'var(--accent-cyan)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={14} /> {marker.status.replace('_', ' ').toUpperCase()}
              </div>
              <div style={{ flex: 1, fontSize: '1.125rem' }}>
                {marker.marker}
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} style={{ marginTop: '40px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          Distance from here: {reachedCount} of {totalCount} markers.
        </motion.div>
      </div>
    </div>
  );
}

export default FutureSelf;
