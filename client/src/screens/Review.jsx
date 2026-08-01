import { useState, useEffect } from 'react';
import { fetchReview, acceptReview } from '../lib/api';

function Review({ day }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReview(day);
  }, [day]);

  async function loadReview(d) {
    setLoading(true);
    // For demo purposes, we trigger the review if day >= 14
    if (d >= 14) {
      const reviewData = await fetchReview(14); // Fetch the pre-seeded day 14 review
      setData(reviewData);
    } else {
      setData(null);
    }
    setLoading(false);
  }

  const handleAccept = async (rowId) => {
    await acceptReview([rowId]);
    alert(\`Accepted proposed change for \${rowId}\`);
  };

  const handleReject = (rowId) => {
    alert(\`Rejected proposed change for \${rowId}\`);
  };

  if (loading) return <div>Loading...</div>;

  if (!data || !data.proposed_json) {
    return (
      <div className="fade-enter-active">
        <h1 style={{ marginBottom: '40px' }}>Weekly Review</h1>
        <div style={{ color: 'var(--dim)', fontStyle: 'italic', fontSize: '1.125rem' }}>
          No review is due today. The next review occurs on day 14.
        </div>
      </div>
    );
  }

  const proposals = JSON.parse(data.proposed_json);

  return (
    <div className="fade-enter-active">
      <h1 style={{ marginBottom: '40px' }}>Weekly Review</h1>
      <p style={{ fontSize: '1.125rem', marginBottom: '40px' }}>
        Based on your actions over the last 7 days, I propose the following updates to your Identity Ledger.
      </p>

      {proposals.map((prop, idx) => (
        <div key={idx} className="card" style={{ borderLeft: '3px solid var(--ink)' }}>
          <div className="card-meta">
            <span className="mono" style={{ fontWeight: 600, color: 'var(--ink)' }}>{prop.op}</span>
            <span style={{ textTransform: 'uppercase' }}>{prop.kind}</span>
          </div>
          
          <div style={{ fontSize: '1.25rem', marginBottom: '16px', background: 'rgba(15, 92, 74, 0.1)', padding: '8px', borderLeft: '2px solid var(--growth)' }}>
            {prop.claim}
          </div>
          
          <div style={{ fontSize: '0.875rem', color: 'var(--dim)', marginBottom: '24px' }}>
            <strong>Evidence:</strong> {prop.evidence}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn" style={{ borderColor: 'var(--growth)', color: 'var(--growth)' }} onClick={() => handleAccept(prop.row_id || 'L09')}>Accept</button>
            <button className="btn" style={{ borderColor: 'var(--attention)', color: 'var(--attention)' }} onClick={() => handleReject(prop.row_id || 'L09')}>Reject</button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Review;
