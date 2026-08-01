import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Info } from 'lucide-react';
import { fetchReview, acceptReview } from '../lib/api';

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

function Review({ day }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReview(day);
  }, [day]);

  async function loadReview(d) {
    setLoading(true);
    const reviewData = await fetchReview(d);
    setData(reviewData && Object.keys(reviewData).length > 0 ? reviewData : null);
    setLoading(false);
  }

  const handleAccept = async (rowId) => {
    await acceptReview([rowId]);
    alert(`Accepted proposed change for ${rowId}`);
  };

  const handleReject = (rowId) => {
    alert(`Rejected proposed change for ${rowId}`);
  };

  if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading...</div>;

  if (!data || !data.proposed_json) {
    return (
      <div>
        <h1 style={{ marginBottom: '40px' }} className="text-gradient">Weekly Review</h1>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Info size={18} /> No review is due today. The next review occurs on day 14.
        </motion.div>
      </div>
    );
  }

  const proposals = JSON.parse(data.proposed_json);

  return (
    <div>
      <h1 style={{ marginBottom: '40px' }} className="text-gradient">Weekly Review</h1>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontSize: '1.125rem', marginBottom: '40px', color: 'var(--text-muted)' }}>
        Based on your actions over the last 7 days, I propose the following updates to your Identity Ledger.
      </motion.p>

      <motion.div variants={containerVariants} initial="hidden" animate="show">
        {proposals.map((prop, idx) => (
          <motion.div key={idx} variants={itemVariants} whileHover={{ scale: 1.01 }} className="card" style={{ borderLeft: '3px solid var(--accent-cyan)' }}>
            <div className="card-meta">
              <span className="mono" style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>{prop.op}</span>
              <span style={{ textTransform: 'uppercase' }}>{prop.kind}</span>
            </div>
            
            <div style={{ fontSize: '1.25rem', marginBottom: '16px', background: 'var(--bg-main)', padding: '16px', borderLeft: '2px solid var(--accent-cyan)', borderRadius: '0 var(--radius-sm) var(--radius-sm) 0' }}>
              {prop.claim}
            </div>
            
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
              <strong style={{ color: 'var(--text-main)' }}>Evidence:</strong> {prop.evidence}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn" style={{ borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => handleAccept(prop.row_id || 'L09')}><Check size={16} /> Accept</button>
              <button className="btn" style={{ borderColor: 'var(--accent-orange)', color: 'var(--accent-orange)', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => handleReject(prop.row_id || 'L09')}><X size={16} /> Reject</button>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

export default Review;
