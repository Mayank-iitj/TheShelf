import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronDown, Zap, BookOpen, Activity, UserCircle, Brain, Shield, ExternalLink } from 'lucide-react';

/* ─── Live stats from backend ─── */
async function fetchStats() {
  try {
    const res = await fetch('/api/potential?day=21');
    const data = await res.json();
    return data.index || 847;
  } catch { return 847; }
}

/* ─── Animated smoke canvas ─── */
function SmokeCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;
    let t = 0;

    const particles = Array.from({ length: 120 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.15,
      radius: 60 + Math.random() * 180,
      alpha: 0.015 + Math.random() * 0.04,
      phase: Math.random() * Math.PI * 2,
    }));

    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      t += 0.003;
      for (const p of particles) {
        p.x += p.vx + Math.sin(t + p.phase) * 0.4;
        p.y += p.vy + Math.cos(t * 0.7 + p.phase) * 0.25;
        if (p.x < -p.radius) p.x = w + p.radius;
        if (p.x > w + p.radius) p.x = -p.radius;
        if (p.y < -p.radius) p.y = h + p.radius;
        if (p.y > h + p.radius) p.y = -p.radius;

        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
        grd.addColorStop(0, `rgba(255,255,255,${p.alpha})`);
        grd.addColorStop(0.5, `rgba(200,200,220,${p.alpha * 0.5})`);
        grd.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  );
}

/* ─── Counter animation ─── */
function Counter({ target, suffix = '' }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / 60;
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 20);
    return () => clearInterval(timer);
  }, [target]);
  return <span>{count.toLocaleString()}{suffix}</span>;
}

/* ─── Main Landing Component ─── */
export default function Landing({ onEnterApp }) {
  const [liveScore, setLiveScore] = useState(847);
  const [menuOpen, setMenuOpen] = useState(false);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, -80]);

  useEffect(() => {
    fetchStats().then(setLiveScore);
  }, []);

  const features = [
    {
      icon: <Brain size={28} />,
      label: 'Identity Ledger',
      desc: 'Your aspirations, competencies, and preferences — transparent, editable, and human-readable.',
      tag: 'Core',
    },
    {
      icon: <Activity size={28} />,
      label: 'Attention Twin',
      desc: 'A real-time divergence chart showing the gap between who you are becoming and where the algorithm would drag you.',
      tag: 'Analytics',
    },
    {
      icon: <Zap size={28} />,
      label: 'Daily Curation',
      desc: 'Three items. No more. The AI chooses from 7 intervention types — including knowing when to withhold everything.',
      tag: 'AI',
    },
    {
      icon: <UserCircle size={28} />,
      label: 'Future Self Portrait',
      desc: 'A visceral, evolving description of who you are trying to become — updated weekly by AI reflection.',
      tag: 'Identity',
    },
    {
      icon: <BookOpen size={28} />,
      label: 'Weekly Review',
      desc: 'Your AI agent surfaces contradictions in your ledger and proposes evidence-backed course corrections.',
      tag: 'Review',
    },
    {
      icon: <Shield size={28} />,
      label: 'Regret Optimized',
      desc: 'Built around long-term fulfillment. No infinite scroll. No engagement traps. An empty day is a valid output.',
      tag: 'Philosophy',
    },
  ];

  const steps = [
    {
      n: '01',
      title: 'Define Your Identity',
      desc: 'Answer a structured interview. The Onboarding Agent translates your answers into a rich Identity Ledger — your aspirations, competencies, and preferences in plain English.',
    },
    {
      n: '02',
      title: 'Receive Your Daily Shelf',
      desc: 'Every day, the AI analyzes your Ledger and habits to select exactly what you need — or decides you need nothing at all. Maximum 3 items.',
    },
    {
      n: '03',
      title: 'Watch Your Twin Diverge',
      desc: 'Your Attention Twin shows exactly how far your Potential Index has outpaced where the algorithm would have taken you. The gap is the point.',
    },
    {
      n: '04',
      title: 'Refine Every Week',
      desc: 'The Weekly Review Agent surfaces habit patterns, calls out contradictions, and proposes precise updates to your Ledger. You accept or reject each one.',
    },
  ];

  const navLinks = ['Features', 'How It Works', 'The Philosophy', 'Enter App'];

  return (
    <div style={{ background: '#000', color: '#fff', fontFamily: "'Onest', 'Inter', sans-serif", overflowX: 'hidden' }}>

      {/* ─── NAVBAR ─── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 48px', height: '64px',
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>
          <div style={{ width: 28, height: 28, background: '#fff', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#000', fontSize: '0.75rem', fontWeight: 900 }}>⚡</span>
          </div>
          TheSmith
        </div>
        <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
          {['Features', 'How It Works', 'The Philosophy'].map(link => (
            <a key={link} href={`#${link.toLowerCase().replace(/ /g, '-')}`}
              style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = '#fff'}
              onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.6)'}
            >{link}</a>
          ))}
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={onEnterApp}
          style={{
            background: '#fff', color: '#000', border: 'none',
            padding: '10px 22px', borderRadius: '100px',
            fontFamily: 'inherit', fontWeight: 600, fontSize: '0.9rem',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
          }}
        >
          ✦ Enter The Shelf
        </motion.button>
      </nav>

      {/* ─── HERO ─── */}
      <section ref={heroRef} style={{ position: 'relative', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <SmokeCanvas />

        <motion.div style={{ opacity: heroOpacity, y: heroY, position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: '860px', padding: '0 24px' }}>
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '100px', padding: '6px 16px 6px 10px',
              fontSize: '0.85rem', marginBottom: '40px',
            }}
          >
            <span style={{ width: 8, height: 8, background: '#21d2ed', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 8px #21d2ed' }} />
            AI-Powered Growth Curation · Not a Feed
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.04em', margin: '0 0 28px 0' }}
          >
            Growth that you<br />actually deserve
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            style={{ fontSize: '1.15rem', color: 'rgba(255,255,255,0.55)', maxWidth: '520px', margin: '0 auto 48px', lineHeight: 1.6 }}
          >
            An agentic curator that models who you are trying to become and delivers exactly what you need to get there — or nothing at all.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}
          >
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(255,255,255,0.15)' }}
              whileTap={{ scale: 0.97 }}
              onClick={onEnterApp}
              style={{
                background: '#fff', color: '#000',
                border: 'none', padding: '16px 32px', borderRadius: '100px',
                fontFamily: 'inherit', fontWeight: 700, fontSize: '1rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
              }}
            >
              Start Your Journey <ArrowRight size={18} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.1)' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })}
              style={{
                background: 'transparent', color: '#fff',
                border: '1px solid rgba(255,255,255,0.25)', padding: '16px 32px', borderRadius: '100px',
                fontFamily: 'inherit', fontWeight: 600, fontSize: '1rem',
                cursor: 'pointer', transition: 'background 0.2s',
              }}
            >
              See How It Works
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
          style={{ position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', zIndex: 2 }}
        >
          <span>Scroll down</span>
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <ChevronDown size={20} />
          </motion.div>
        </motion.div>
      </section>

      {/* ─── LIVE STATS BAR ─── */}
      <motion.section
        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
        style={{ background: 'rgba(255,255,255,0.04)', borderTop: '1px solid rgba(255,255,255,0.08)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '32px 48px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '24px', maxWidth: '900px', margin: '0 auto' }}>
          {[
            { value: 250, suffix: '+', label: 'Curated Content Items' },
            { value: 7, suffix: ' types', label: 'Intervention Types' },
            { value: 3, suffix: ' max', label: 'Daily Items Cap' },
            { value: liveScore, suffix: '', label: 'Max Potential Index (Live)' },
          ].map(({ value, suffix, label }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums' }}>
                <Counter target={value} suffix={suffix} />
              </div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginTop: '4px' }}>{label}</div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ─── FEATURES BENTO GRID ─── */}
      <section id="features" style={{ padding: '120px 48px', maxWidth: '1200px', margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '100px', padding: '6px 16px', fontSize: '0.8rem', marginBottom: '24px' }}>
            ✦ Features
          </div>
          <h2 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 700, letterSpacing: '-0.04em', margin: '0 0 16px 0' }}>
            Everything built to<br />forge your potential
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1.1rem', maxWidth: '480px', marginBottom: '64px', lineHeight: 1.6 }}>
            Not a feed. Not a recommendation engine. An agentic system with a single mandate: make you better.
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
          {features.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.06 }}
              whileHover={{ y: -4, borderColor: 'rgba(255,255,255,0.2)' }}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '20px', padding: '36px',
                transition: 'border-color 0.3s',
                cursor: 'default',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div style={{ color: 'rgba(255,255,255,0.7)' }}>{f.icon}</div>
                <span style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '100px', padding: '4px 10px', fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>{f.tag}</span>
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 12px' }}>{f.label}</h3>
              <p style={{ color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, margin: 0, fontSize: '0.95rem' }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── ABOUT / WHAT IS THESMITH ─── */}
      <section id="the-philosophy" style={{ padding: '120px 48px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
          <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '100px', padding: '6px 16px', fontSize: '0.8rem', marginBottom: '24px' }}>
              ✦ The Philosophy
            </div>
            <h2 style={{ fontSize: 'clamp(2.5rem, 4vw, 3.5rem)', fontWeight: 700, letterSpacing: '-0.04em', margin: '0 0 24px', lineHeight: 1.1 }}>
              What is<br />TheSmith?
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.8, fontSize: '1.05rem', marginBottom: '32px' }}>
              TheSmith is a radical departure from the dopamine-driven engagement loops of modern algorithms. Instead of a passive feed designed to hijack attention, it is an <strong style={{ color: '#fff' }}>agentic curator</strong> built to actively forge your potential.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.8, fontSize: '1.05rem', marginBottom: '40px' }}>
              It wraps a transparent, human-readable <strong style={{ color: '#fff' }}>Identity Ledger</strong> around your aspirations and habits. Every day, AI agents analyze this ledger to serve you what you actually need — or withhold everything if that is the correct call.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {['No infinite scroll', '3-item daily cap', 'Human-readable model', 'Regret-optimized', 'Groq Llama 3', 'Auditable AI'].map(tag => (
                <span key={tag} style={{ border: '1px solid rgba(255,255,255,0.15)', borderRadius: '100px', padding: '6px 16px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>{tag}</span>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', overflow: 'hidden', background: 'rgba(255,255,255,0.02)' }}>
              {/* Fake ledger preview */}
              <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Identity Ledger · Day 14</span>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>5 active rows</span>
              </div>
              {[
                { id: 'L01', kind: 'aspiration', claim: 'I want to ship a product people pay for', strength: 0.88 },
                { id: 'L02', kind: 'competence', claim: 'I understand distributed systems deeply', strength: 0.72 },
                { id: 'L03', kind: 'preference', claim: 'I learn by building, not by reading', strength: 0.95 },
                { id: 'L04', kind: 'aspiration', claim: 'I want to write one clear, honest essay per month', strength: 0.61 },
              ].map((row, i) => (
                <motion.div
                  key={row.id}
                  initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                >
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '8px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    <span>{row.id}</span>
                    <span>{row.kind}</span>
                    <span>{(row.strength * 100).toFixed(0)}%</span>
                  </div>
                  <div style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.8)', marginBottom: '10px' }}>{row.claim}</div>
                  <div style={{ height: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }} whileInView={{ width: `${row.strength * 100}%` }}
                      viewport={{ once: true }} transition={{ duration: 1, delay: 0.2 + i * 0.1 }}
                      style={{ height: '100%', background: '#21d2ed', borderRadius: '2px', boxShadow: '0 0 6px #21d2ed' }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" style={{ padding: '120px 48px', maxWidth: '1200px', margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ marginBottom: '80px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '100px', padding: '6px 16px', fontSize: '0.8rem', marginBottom: '24px' }}>
            ✦ How It Works
          </div>
          <h2 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 700, letterSpacing: '-0.04em', margin: 0 }}>
            The process of<br />becoming
          </h2>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '2px' }}>
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              style={{ padding: '48px 36px', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
            >
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace', marginBottom: '24px', letterSpacing: '0.1em' }}>{s.n}</div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 16px' }}>{s.title}</h3>
              <p style={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, margin: 0, fontSize: '0.9rem' }}>{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section style={{ position: 'relative', padding: '160px 48px', textAlign: 'center', overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <SmokeCanvas />
        <div style={{ position: 'relative', zIndex: 2 }}>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
            <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', marginBottom: '24px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Ready to begin?</div>
            <h2 style={{ fontSize: 'clamp(3rem, 7vw, 6rem)', fontWeight: 700, letterSpacing: '-0.04em', margin: '0 0 24px', lineHeight: 1.05 }}>
              The Shelf is<br />waiting for you
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1.1rem', marginBottom: '48px', maxWidth: '480px', margin: '0 auto 48px' }}>
              "You are what you repeatedly do. Excellence, then, is not an act, but a habit."
            </p>
            <motion.button
              whileHover={{ scale: 1.06, boxShadow: '0 0 60px rgba(255,255,255,0.2)' }}
              whileTap={{ scale: 0.97 }}
              onClick={onEnterApp}
              style={{
                background: '#fff', color: '#000',
                border: 'none', padding: '20px 48px', borderRadius: '100px',
                fontFamily: 'inherit', fontWeight: 700, fontSize: '1.1rem',
                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '10px',
              }}
            >
              Enter The Shelf <ArrowRight size={20} />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ padding: '32px 48px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'rgba(255,255,255,0.25)', fontSize: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>
          <span>⚡ TheSmith</span>
        </div>
        <div>Built with Groq · Llama 3 70B · React · Node.js</div>
        <div>An anvil, not a feed.</div>
      </footer>
    </div>
  );
}
