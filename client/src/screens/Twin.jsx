import { useState, useEffect } from 'react';
import { fetchShelf, fetchTwin } from '../lib/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function Twin({ day }) {
  const [growthData, setGrowthData] = useState([]);
  const [attentionData, setAttentionData] = useState([]);
  const [series, setSeries] = useState([]);

  useEffect(() => {
    loadTwinData(day);
  }, [day]);

  async function loadTwinData(d) {
    const [growth, attention, chart] = await Promise.all([
      fetchShelf(d, 'growth'),
      fetchShelf(d, 'attention'),
      fetchTwin(d)
    ]);
    
    setGrowthData(growth.items || []);
    setAttentionData(attention.items || []);
    setSeries(chart.series || []);
  }

  const artifactsReclaimed = series.length > 0 ? series[series.length - 1].artifacts : 0;
  // Stub for reclaimed minutes calculation
  const minutesReclaimed = 21 * 45; 

  return (
    <div className="fade-enter-active">
      <h1 style={{ marginBottom: '40px' }}>The Attention Twin</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', marginBottom: '60px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--growth)', marginBottom: '24px' }}>Growth Ranker</h2>
          {growthData.map(item => (
            <div key={item.id} className="card" style={{ padding: '16px', marginBottom: '16px' }}>
              <div className="card-title" style={{ fontSize: '1.125rem' }}>{item.title}</div>
              <div className="card-meta" style={{ marginBottom: 0 }}>
                <span>{item.type}</span>
                <span>{item.minutes}m</span>
                <span className="mono">{item.difficulty}●</span>
              </div>
            </div>
          ))}
        </div>
        
        <div>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--attention)', marginBottom: '24px' }}>Attention Ranker</h2>
          {attentionData.map(item => (
            <div key={item.id} className="card" style={{ padding: '16px', marginBottom: '16px', borderLeft: '3px solid var(--attention)' }}>
              <div className="card-title" style={{ fontSize: '1.125rem' }}>{item.title}</div>
              <div className="card-meta" style={{ marginBottom: 0 }}>
                <span style={{ color: 'var(--attention)' }}>Heat: {item.thumbnail_heat}</span>
                <span>{item.minutes}m</span>
                <span className="mono">{item.difficulty}●</span>
              </div>
            </div>
          ))}
          <div style={{ textAlign: 'center', color: 'var(--dim)', fontStyle: 'italic', marginTop: '16px' }}>
            ... and 20 more items below the fold.
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--rule)', paddingTop: '40px' }}>
        <h2>Divergence</h2>
        <div style={{ display: 'flex', gap: '48px', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ height: '250px', flex: 1 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <XAxis dataKey="day" />
                <YAxis domain={['auto', 'auto']} />
                <Tooltip />
                <Line type="monotone" dataKey="potential" stroke="var(--growth)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="attention_potential" stroke="var(--attention)" strokeWidth={2} dot={false} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ width: '250px' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--dim)', marginBottom: '8px' }}>Attention Reclaimed</div>
            <div className="mono" style={{ fontSize: '2rem', marginBottom: '16px' }}>{minutesReclaimed}m</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--dim)', marginBottom: '8px' }}>Artifacts Created</div>
            <div className="mono" style={{ fontSize: '2rem' }}>{artifactsReclaimed}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Twin;
