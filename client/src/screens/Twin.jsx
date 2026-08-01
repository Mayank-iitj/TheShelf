import { useState, useEffect } from 'react';
import { fetchShelf, fetchTwin } from '../lib/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { Sprout, Flame, GitCompare } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 320, damping: 26 } }
};

function RankedCard({ item, tone }) {
  return (
    <motion.div variants={itemVariants} className={`card ${tone === 'attention' ? 'card--flagged' : ''}`} style={{ padding: '18px 20px', marginBottom: '10px' }} whileHover={{ y: -2 }}>
      <div className="card-title" style={{ fontSize: '1rem', marginBottom: '10px' }}>{item.title}</div>
      <div className="card-meta" style={{ marginBottom: 0 }}>
        {tone === 'attention' ? (
          <span style={{ color: 'var(--attention)' }}><Flame size={12} /> heat {item.thumbnail_heat}</span>
        ) : (
          <span>{item.type}</span>
        )}
        <span>{item.minutes}m</span>
        <span className="mono" style={{ color: 'var(--growth)' }}>{item.difficulty}●</span>
      </div>
    </motion.div>
  );
}

function ColumnEmpty({ label }) {
  return (
    <div className="empty-state" style={{ padding: '20px' }}>
      <div className="empty-state-body" style={{ fontSize: '0.875rem' }}>{label}</div>
    </div>
  );
}

function ColumnSkeleton() {
  return (
    <>
      <div className="skeleton" style={{ height: '64px', marginBottom: '10px' }} />
      <div className="skeleton" style={{ height: '64px', marginBottom: '10px' }} />
      <div className="skeleton" style={{ height: '64px' }} />
    </>
  );
}

function Twin({ day }) {
  const [growthData, setGrowthData] = useState([]);
  const [attentionData, setAttentionData] = useState([]);
  const [series, setSeries] = useState([]);
  const [minutesReclaimed, setMinutesReclaimed] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTwinData(day);
  }, [day]);

  async function loadTwinData(d) {
    setLoading(true);
    const [growth, attention, chart] = await Promise.all([
      fetchShelf(d, 'growth'),
      fetchShelf(d, 'attention'),
      fetchTwin(d)
    ]);

    setGrowthData(growth.items || []);
    setAttentionData(attention.items || []);
    setSeries(chart.series || []);
    setMinutesReclaimed(chart.minutes_reclaimed || 0);
    setLoading(false);
  }

  const artifactsReclaimed = series.length > 0 ? series[series.length - 1].artifacts : 0;
  const hasChartData = series.length >= 2;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <h1 className="screen-title">The Attention Twin</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '48px' }}>
        <div>
          <h2 style={{ fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, color: 'var(--growth)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sprout size={14} /> Growth Ranker
          </h2>
          {loading ? (
            <ColumnSkeleton />
          ) : growthData.length === 0 ? (
            <ColumnEmpty label="No growth items ranked yet." />
          ) : (
            <motion.div variants={containerVariants} initial="hidden" animate="show">
              {growthData.map(item => <RankedCard key={item.id} item={item} tone="growth" />)}
            </motion.div>
          )}
        </div>

        <div>
          <h2 style={{ fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, color: 'var(--attention)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Flame size={14} /> Attention Ranker
          </h2>
          {loading ? (
            <ColumnSkeleton />
          ) : attentionData.length === 0 ? (
            <ColumnEmpty label="No attention-content logged yet." />
          ) : (
            <motion.div variants={containerVariants} initial="hidden" animate="show">
              {attentionData.map(item => <RankedCard key={item.id} item={item} tone="attention" />)}
              <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.8125rem', marginTop: '12px' }}>
                &hellip; and 20 more items below the fold.
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--border-hairline)', paddingTop: '36px' }}>
        <h2 style={{ fontSize: '1.125rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <GitCompare size={17} style={{ color: 'var(--text-tertiary)' }} /> Divergence
        </h2>

        <div style={{ display: 'flex', gap: '20px', alignItems: 'stretch' }}>
          <div style={{ height: '240px', flex: 1, background: 'var(--bg-surface)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-hairline)' }}>
            {hasChartData ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series} margin={{ top: 5, right: 8, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-hairline)" vertical={false} />
                  <XAxis dataKey="day" stroke="var(--text-tertiary)" fontSize={12} tickLine={false} axisLine={{ stroke: 'var(--border-hairline-strong)' }} />
                  <YAxis domain={['auto', 'auto']} stroke="var(--text-tertiary)" fontSize={12} tickLine={false} axisLine={false} width={28} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface-hover)', border: '1px solid var(--border-hairline-strong)', borderRadius: '8px', fontSize: '0.8125rem' }} labelStyle={{ color: 'var(--text-secondary)' }} />
                  <Line type="monotone" dataKey="potential" name="Growth potential" stroke="var(--growth)" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="attention_potential" name="Attention potential" stroke="var(--attention)" strokeWidth={2.5} dot={false} strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--text-tertiary)' }}>
                <GitCompare size={20} />
                <div style={{ fontSize: '0.875rem' }}>Not enough days logged yet to chart divergence.</div>
              </div>
            )}
          </div>

          <div style={{ width: '210px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-md)', padding: '18px', flex: 1 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Attention Reclaimed</div>
              <div className="mono" style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--growth)' }}>{minutesReclaimed}m</div>
            </div>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-md)', padding: '18px', flex: 1 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Artifacts Created</div>
              <div className="mono" style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{artifactsReclaimed}</div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default Twin;
