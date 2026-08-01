import { useState, useEffect } from 'react';
import { fetchFutureSelf } from '../lib/api';

function FutureSelf({ day }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    loadFutureSelf();
  }, [day]);

  async function loadFutureSelf() {
    const d = await fetchFutureSelf();
    setData(d);
  }

  if (!data) return <div>Loading...</div>;

  const reachedCount = data.markers ? data.markers.filter(m => m.status !== 'not_yet').length : 0;
  const totalCount = data.markers ? data.markers.length : 0;

  return (
    <div className="fade-enter-active">
      <h1 style={{ marginBottom: '40px' }}>Future Self</h1>
      
      <div style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', lineHeight: 1.3, marginBottom: '60px', maxWidth: '800px' }}>
        "{data.portrait}"
      </div>

      <div style={{ maxWidth: '800px' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '24px' }}>Markers</h2>
        
        {data.markers && data.markers.map((marker, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', padding: '16px', border: '1px solid var(--rule)', borderRadius: '2px', background: marker.status !== 'not_yet' ? 'rgba(15, 92, 74, 0.05)' : 'transparent' }}>
            <div style={{ width: '120px', fontSize: '0.875rem', fontWeight: 600, color: marker.status !== 'not_yet' ? 'var(--growth)' : 'var(--dim)' }}>
              {marker.status.replace('_', ' ').toUpperCase()}
            </div>
            <div style={{ flex: 1, fontSize: '1.125rem' }}>
              {marker.marker}
            </div>
          </div>
        ))}

        <div style={{ marginTop: '40px', color: 'var(--dim)', fontStyle: 'italic' }}>
          Distance from here: {reachedCount} of {totalCount} markers.
        </div>
      </div>
    </div>
  );
}

export default FutureSelf;
