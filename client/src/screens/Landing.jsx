import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, ChevronDown, Zap, BookOpen, Activity, UserCircle, Brain, Shield, Cpu, Mic, Compass, Lock, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import FlowingMenu from '../components/FlowingMenu';
import FallingText from '../components/FallingText';
import BorderGlow from '../components/BorderGlow';
import CircularGallery from '../components/CircularGallery';
import RotatingText from '../components/RotatingText';
import ScrollVelocity from '../components/ScrollVelocity';
import TrueFocus from '../components/TrueFocus';
import PlasmaWave from '../components/PlasmaWave';
import StaggeredMenu from '../components/StaggeredMenu';
import Aurora from '../components/Aurora';
import Beams from '../components/Beams';
import LogoLoop from '../components/LogoLoop';
import { SiReact, SiNextdotjs, SiTypescript, SiTailwindcss, SiVite, SiNodedotjs, SiGraphql } from 'react-icons/si';

/* ─── Live stats from backend ─── */
async function fetchStats() {
  try {
    const res = await fetch('/api/potential?day=21');
    const data = await res.json();
    return data.index || 847;
} catch { return 847; }
}

const demoItems = [
  { link: '#', text: 'Identity Ledger', image: 'https://picsum.photos/600/400?random=1' },
  { link: '#', text: 'Attention Twin', image: 'https://picsum.photos/600/400?random=2' },
  { link: '#', text: 'Future Self', image: 'https://picsum.photos/600/400?random=3' },
  { link: '#', text: 'Agentic Curation', image: 'https://picsum.photos/600/400?random=4' }
];

const galleryItems = [
  { image: 'https://picsum.photos/seed/11/800/600?grayscale', text: 'Daily Artifacts' },
  { image: 'https://picsum.photos/seed/22/800/600?grayscale', text: 'Deep Reflections' },
  { image: 'https://picsum.photos/seed/33/800/600?grayscale', text: 'Identity Fragments' },
  { image: 'https://picsum.photos/seed/44/800/600?grayscale', text: 'Core Competencies' },
  { image: 'https://picsum.photos/seed/55/800/600?grayscale', text: 'Attention Span' },
  { image: 'https://picsum.photos/seed/66/800/600?grayscale', text: 'Weekly Review' }
];

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
export default function Landing() {
  const navigate = useNavigate();
  const onEnterApp = () => navigate('/login');
  const [liveScore, setLiveScore] = useState(0);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, -80]);

  const smoothTransition = { duration: 0.8, ease: [0.16, 1, 0.3, 1] };

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
    {
      icon: <Cpu size={28} style={{ color: 'var(--accent-cyan)' }} />,
      label: 'Supreme Master Agent',
      desc: 'Consolidates all sub-agents into a unified Master Alignment Score, executive status tracking, and strategic directives.',
      tag: 'AI Orchestrator',
    },
    {
      icon: <Mic size={28} />,
      label: 'Voice Onboarding',
      desc: 'Talk to the assistant via Web Speech API; it compiles your spoken career goals into structured ledger claims.',
      tag: 'Interface',
    },
    {
      icon: <Compass size={28} />,
      label: '60-Day Projections',
      desc: 'Side-by-side counterfactual predictions demonstrating your growth potential compared to the default algorithm trap.',
      tag: 'Projections',
    },
    {
      icon: <Lock size={28} />,
      label: 'Zero-Item Day Shield',
      desc: 'Automatically locks the platform when focus is already optimal, saving your mind from dopamine decay.',
      tag: 'Defense',
    },
    {
      icon: <FileText size={28} />,
      label: 'Portable Passport',
      desc: 'One-click export of your verified identity as JSON. Portable parameters to boot-seed external AI agents.',
      tag: 'Sovereignty',
    }
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
  return (
    <div style={{ background: '#000', color: '#fff', fontFamily: "'Onest', 'Inter', sans-serif", overflowX: 'hidden' }}>

      {/* ─── NAVBAR ─── */}
      <StaggeredMenu
        isFixed={true}
        items={[
          { label: 'Enter The Shelf', onClick: onEnterApp },
          { label: 'Features', link: '#features' },
          { label: 'How It Works', link: '#how-it-works' },
          { label: 'Philosophy', link: '#philosophy' }
        ]}
        displaySocials={false}
        menuButtonColor="#fff"
        openMenuButtonColor="#000"
        colors={['#333333', '#111111']}
        accentColor="#21d2ed"
      />

      {/* ─── HERO ─── */}
      <section ref={heroRef} style={{ position: 'relative', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', paddingBottom: '90px' }}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
          <Beams
            beamWidth={2}
            beamHeight={15}
            beamNumber={12}
            lightColor="#21d2ed"
            speed={2}
            noiseIntensity={1.75}
            scale={0.2}
            rotation={0}
          />
        </div>

        <motion.div style={{ opacity: heroOpacity, y: heroY, position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: '860px', padding: '0 24px' }}>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ ...smoothTransition, delay: 0.2 }}
            style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.04em', margin: '0 0 28px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          >
            <span>Growth that you</span>
            <RotatingText
              texts={['actually deserve', 'actively forge', 'deliberately build', 'truly want']}
              style={{ color: '#21d2ed' }}
              staggerFrom="last"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-120%" }}
              staggerDuration={0.025}
              splitLevelClassName="overflow-hidden pb-1"
              transition={{ type: "spring", damping: 30, stiffness: 400 }}
              rotationInterval={3000}
            />
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...smoothTransition, delay: 0.3 }}
            style={{ fontSize: '1.15rem', color: 'rgba(255,255,255,0.55)', maxWidth: '520px', margin: '0 auto 48px', lineHeight: 1.6 }}
          >
            An agentic curator that models who you are trying to become and delivers exactly what you need to get there — or nothing at all.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...smoothTransition, delay: 0.4 }}
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
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...smoothTransition, delay: 1 }}
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
        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={smoothTransition}
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

      {/* ─── SCROLL VELOCITY BANNER ─── */}
      <div style={{ padding: '30px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
        <ScrollVelocity
          texts={['NO INFINITE SCROLL •', 'REGRET OPTIMIZED •', 'AGENTIC CURATION •']} 
          velocity={50} 
        />
      </div>

      {/* ─── TECH STACK LOOP ─── */}
      <section style={{ padding: '60px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)', overflow: 'hidden' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 48px', marginBottom: '32px' }}>
          <h3 style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>
            Powered By
          </h3>
        </div>
        <div style={{ position: 'relative', width: '100%', color: 'rgba(255,255,255,0.4)' }}>
          <LogoLoop
            logos={[
              { node: <SiReact />, title: "React", href: "https://react.dev" },
              { node: <SiNextdotjs />, title: "Next.js", href: "https://nextjs.org" },
              { node: <SiTypescript />, title: "TypeScript", href: "https://www.typescriptlang.org" },
              { node: <SiTailwindcss />, title: "Tailwind CSS", href: "https://tailwindcss.com" },
              { node: <SiVite />, title: "Vite", href: "https://vitejs.dev" },
              { node: <SiNodedotjs />, title: "Node.js", href: "https://nodejs.org" },
              { node: <SiGraphql />, title: "GraphQL", href: "https://graphql.org" },
            ]}
            speed={80}
            direction="left"
            logoHeight={48}
            gap={64}
            hoverSpeed={10}
            scaleOnHover
            fadeOut
            fadeOutColor="#000000"
          />
        </div>
      </section>

      {/* ─── FEATURES BENTO GRID ─── */}
      <section id="features" style={{ padding: '120px 48px', maxWidth: '1200px', margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={smoothTransition}>
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
              viewport={{ once: true }} transition={{ ...smoothTransition, delay: i * 0.06 }}
              whileHover={{ y: -4, transition: { duration: 0.3 } }}
              style={{ cursor: 'default' }}
            >
              <BorderGlow
                edgeSensitivity={30}
                glowColor="40 80 80"
                backgroundColor="#111113"
                borderRadius={20}
                glowRadius={20}
                glowIntensity={0.8}
                coneSpread={25}
                animated={false}
                colors={['#21d2ed', '#f97316', '#21d2ed']}
              >
                <div style={{ padding: '36px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                    <div style={{ color: 'rgba(255,255,255,0.7)' }}>{f.icon}</div>
                    <span style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '100px', padding: '4px 10px', fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>{f.tag}</span>
                  </div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 12px' }}>{f.label}</h3>
                  <p style={{ color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, margin: 0, fontSize: '0.95rem' }}>{f.desc}</p>
                </div>
              </BorderGlow>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── FLOWING MENU ─── */}
      <section style={{ height: '600px', position: 'relative', width: '100%', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <FlowingMenu items={demoItems} bgColor="#000" />
      </section>

      {/* ─── ABOUT / WHAT IS The Shelf ─── */}
      <section id="the-philosophy" style={{ padding: '120px 48px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
          <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={smoothTransition}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '100px', padding: '6px 16px', fontSize: '0.8rem', marginBottom: '24px' }}>
              ✦ The Philosophy
            </div>
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'flex-start' }}>
              <TrueFocus 
                sentence="What is The Shelf?"
                manualMode={false}
                blurAmount={4}
                borderColor="#21d2ed"
                glowColor="rgba(33, 210, 237, 0.6)"
                animationDuration={0.6}
                pauseBetweenAnimations={0.2}
              />
            </div>
            <div style={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.8, fontSize: '1.05rem', marginBottom: '32px', minHeight: '120px' }}>
              <FallingText
                text="The Shelf is a radical departure from the dopamine-driven engagement loops of modern algorithms. Instead of a passive feed designed to hijack attention, it is an agentic curator built to actively forge your potential."
                highlightWords={["radical", "departure", "agentic", "curator", "potential"]}
                highlightClass="highlighted"
                trigger="hover"
                backgroundColor="transparent"
                wireframes={false}
                gravity={0.56}
                fontSize="1.05rem"
                mouseConstraintStiffness={0.9}
              />
            </div>
            <p style={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.8, fontSize: '1.05rem', marginBottom: '40px' }}>
              It wraps a transparent, human-readable <strong style={{ color: '#fff' }}>Identity Ledger</strong> around your aspirations and habits. Every day, AI agents analyze this ledger to serve you what you actually need — or withhold everything if that is the correct call.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {['No infinite scroll', '3-item daily cap', 'Human-readable model', 'Regret-optimized', 'Groq Llama 3', 'Auditable AI'].map(tag => (
                <span key={tag} style={{ border: '1px solid rgba(255,255,255,0.15)', borderRadius: '100px', padding: '6px 16px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>{tag}</span>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={smoothTransition}>
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
                  viewport={{ once: true }} transition={{ ...smoothTransition, delay: i * 0.1 }}
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
                      viewport={{ once: true }} transition={{ ...smoothTransition, duration: 1.2, delay: 0.2 + i * 0.1 }}
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
      <section id="how-it-works" style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, opacity: 0.5 }}>
          <Aurora
            colorStops={["#000000", "#111111", "#21d2ed"]}
            blend={0.5}
            amplitude={1.0}
            speed={0.5}
          />
        </div>
        <div style={{ position: 'relative', zIndex: 2, padding: '120px 48px', maxWidth: '1200px', margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={smoothTransition} style={{ marginBottom: '80px' }}>
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
              viewport={{ once: true }} transition={{ ...smoothTransition, delay: i * 0.1 }}
              style={{ padding: '48px 36px', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
            >
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace', marginBottom: '24px', letterSpacing: '0.1em' }}>{s.n}</div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 16px' }}>{s.title}</h3>
              <p style={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, margin: 0, fontSize: '0.9rem' }}>{s.desc}</p>
            </motion.div>
          ))}
          </div>
        </div>
      </section>

      {/* ─── GALLERY ─── */}
      <section style={{ height: '600px', position: 'relative', width: '100%', overflow: 'hidden' }}>
        <CircularGallery
          bend={3}
          textColor="#ffffff"
          borderRadius={0.05}
          scrollEase={0.02}
          items={galleryItems}
        />
      </section>

      {/* ─── FINAL CTA ─── */}
      <section style={{ position: 'relative', padding: '160px 48px', textAlign: 'center', overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, opacity: 0.8 }}>
          <PlasmaWave
            colors={["#000000", "#21d2ed"]}
            speed1={0.05}
            speed2={0.05}
            focalLength={0.8}
            bend1={1}
            bend2={0.5}
            dir2={1.0}
            rotationDeg={0}
          />
        </div>
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
      <footer style={{ position: 'relative', overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.01)' }}>
        <div style={{ padding: '80px 48px 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '40px', color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '320px' }}>
             <div style={{ fontWeight: 600, color: '#fff', fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                ⚡ The Shelf
             </div>
             <p style={{ margin: 0, lineHeight: 1.6 }}>An agentic curator that models who you are trying to become. Design for those who want to become a better version of themselves.</p>
          </div>
          
          <div style={{ display: 'flex', gap: '80px', flexWrap: 'wrap' }}>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
               <span style={{ fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>Explore</span>
               <a href="#" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color = '#fff'} onMouseOut={e => e.target.style.color = 'rgba(255,255,255,0.4)'}>Home</a>
               <a href="#how-it-works" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color = '#fff'} onMouseOut={e => e.target.style.color = 'rgba(255,255,255,0.4)'}>How we work</a>
               <a href="#features" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color = '#fff'} onMouseOut={e => e.target.style.color = 'rgba(255,255,255,0.4)'}>Features</a>
             </div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
               <span style={{ fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>Socials</span>
               <a href="#" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color = '#fff'} onMouseOut={e => e.target.style.color = 'rgba(255,255,255,0.4)'}>GitHub</a>
               <a href="#" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color = '#fff'} onMouseOut={e => e.target.style.color = 'rgba(255,255,255,0.4)'}>LinkedIn</a>
               <a href="#" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color = '#fff'} onMouseOut={e => e.target.style.color = 'rgba(255,255,255,0.4)'}>X (Twitter)</a>
             </div>
          </div>
        </div>

        {/* Sub-footer metadata */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 48px', color: 'rgba(255,255,255,0.2)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', position: 'relative', zIndex: 2, marginBottom: '2vw' }}>
          <div>© 2026 The Shelf STUDIO,<br/>ALL RIGHTS RESERVED</div>
          <div style={{ textAlign: 'right' }}>TERMS<br/>PRIVACY POLICY</div>
        </div>

        {/* Giant Text */}
        <div style={{ 
          width: '100%', 
          display: 'flex', 
          justifyContent: 'center',
          alignItems: 'flex-end',
          overflow: 'hidden'
        }}>
          <h1 style={{
            margin: 0,
            fontSize: 'clamp(8rem, 24vw, 30rem)',
            fontWeight: 800,
            lineHeight: 0.75,
            letterSpacing: '-0.04em',
            textTransform: 'uppercase',
            background: 'linear-gradient(180deg, rgba(33,210,237,0) 0%, rgba(33,210,237,1) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            userSelect: 'none',
            whiteSpace: 'nowrap',
            transform: 'translateY(8%)'
          }}>
            SHELF
          </h1>
        </div>
      </footer>
    </div>
  );
}
