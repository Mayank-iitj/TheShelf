import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, X, CalendarClock } from 'lucide-react';
import { fetchReview, acceptReview } from '../lib/api';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 320, damping: 26 } }
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

  const handleAccept = async (idx) => {
    await acceptReview([idx]);
    alert(`Accepted proposed change.`);
    loadReview(day);
  };

  const handleReject = (idx) => {
    alert(`Rejected proposed change.`);
  };

  if (loading) {
    return (
      <div>
        <h1 className="screen-title">Weekly Review</h1>
        <div className="skeleton" style={{ height: '140px' }} />
      </div>
    );
  }

  if (!data || !data.proposed_json) {
    return (
      <div>
        <h1 className="screen-title">Weekly Review</h1>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="empty-state">
          <CalendarClock size={22} />
          <div>
            <div className="empty-state-title">No review is due today</div>
            <div className="empty-state-body">The next review occurs on day 14.</div>
          </div>
        </motion.div>
      </div>
    );
  }

  const proposals = JSON.parse(data.proposed_json);

  return (
    <div>
      <h1 className="screen-title">Weekly Review</h1>
      <p className="screen-sub" style={{ marginTop: 0 }}>
        Based on your actions over the last 7 days, I propose the following updates to your Identity Ledger.
      </p>

      <motion.div variants={containerVariants} initial="hidden" animate="show">
        {proposals.map((prop, idx) => (
          <motion.div key={idx} variants={itemVariants} whileHover={{ y: -2 }} className="card card--proposed">
            <div className="card-meta">
              <span className="mono" style={{ fontWeight: 600, color: 'var(--growth)' }}>{prop.op}</span>
              <span>{prop.kind}</span>
            </div>

            <div style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '14px', color: 'var(--text-primary)' }}>
              {prop.claim}
            </div>

            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '22px', background: 'var(--bg-surface-sunken)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-sm)', padding: '12px 14px' }}>
              <strong style={{ color: 'var(--text-primary)' }}>Evidence: </strong>{prop.evidence}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => handleAccept(idx)}><Check size={15} /> Accept</button>
              <button className="btn btn-danger" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => handleReject(idx)}><X size={15} /> Reject</button>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

export default Review;
