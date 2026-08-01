import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutDashboard, Activity, BookOpen, UserCircle, CalendarClock, User, ShieldCheck } from 'lucide-react';
import './styles.css';
import { setClock, fetchPotential, fetchStage } from './lib/api';
import Landing from './screens/Landing';
import Shelf from './screens/Shelf';
import Twin from './screens/Twin';
import Ledger from './screens/Ledger';
import FutureSelf from './screens/FutureSelf';
import Review from './screens/Review';
import Onboarding from './screens/Onboarding';
import SignInPage from './screens/SignInPage';
import Profile from './screens/Profile';
import { useAuth, UserButton } from '@clerk/react';
import { Routes, Route, Navigate } from 'react-router-dom';

function DashboardFlow({ day, handleScrubberChange, potential, stage, currentScreen, setCurrentScreen, onboarded, setOnboarded }) {
  const { isLoaded, userId } = useAuth();

  if (!isLoaded) return null;

  if (!userId) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      {!onboarded ? (
        <AnimatePresence mode="wait">
          <motion.div key="onboarding" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <Onboarding onComplete={() => setOnboarded(true)} />
          </motion.div>
        </AnimatePresence>
      ) : (
        <div className="app-container">
          {/* Top Glassmorphic Navigation Bar */}
          <header className="scrubber" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em', cursor: 'pointer' }} onClick={() => setCurrentScreen('shelf')}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
                <ShieldCheck size={20} />
              </div>
              <span className="text-gradient">The Shelf</span>
            </div>

            {/* Day Scrubber */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, maxWidth: '480px', margin: '0 32px' }}>
              <div className="mono scrubber-day-label" style={{ width: '50px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Day {day}</div>
              <div className="scrubber-track" style={{ flex: 1 }}>
                <div className="scrubber-ticks">
                  {Array.from({ length: 21 }).map((_, i) => <span key={i} />)}
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="21" 
                  value={day} 
                  onChange={handleScrubberChange} 
                />
              </div>
              <div className="mono scrubber-day-label" style={{ width: '50px', textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Day 21</div>
            </div>

            {/* User Profile & Potential Index Pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="mono" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>{potential}</span>
                  <span className="stage-badge">{stage.stage}</span>
                </div>
              </div>

              {/* Clerk User Account Button */}
              <div style={{ borderLeft: '1px solid var(--border-rule)', paddingLeft: '16px' }}>
                <UserButton 
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      userButtonAvatarBox: { width: '36px', height: '36px', border: '2px solid var(--accent-cyan)' }
                    }
                  }}
                />
              </div>
            </div>
          </header>

          {/* Main Content Layout */}
          <div className="main-content" style={{ marginTop: '64px' }}>
            <aside className="sidebar">
              <nav>
                <a href="#shelf" className={currentScreen === 'shelf' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setCurrentScreen('shelf'); }}>
                  <LayoutDashboard size={20} /> Today's Shelf
                </a>
                <a href="#twin" className={currentScreen === 'twin' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setCurrentScreen('twin'); }}>
                  <Activity size={20} /> Attention Twin
                </a>
                <a href="#ledger" className={currentScreen === 'ledger' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setCurrentScreen('ledger'); }}>
                  <BookOpen size={20} /> Identity Ledger
                </a>
                <a href="#futureself" className={currentScreen === 'futureself' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setCurrentScreen('futureself'); }}>
                  <UserCircle size={20} /> Future Self
                </a>
                <a href="#review" className={currentScreen === 'review' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setCurrentScreen('review'); }}>
                  <CalendarClock size={20} /> Weekly Review
                </a>

                <div style={{ height: '1px', background: 'var(--border-rule)', margin: '16px 0' }} />

                <a href="#profile" className={currentScreen === 'profile' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setCurrentScreen('profile'); }}>
                  <User size={20} /> Profile & Settings
                </a>
              </nav>
            </aside>
            
            <main className="content-area">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentScreen}
                  initial={{ opacity: 0, y: 10, filter: 'blur(5px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -10, filter: 'blur(5px)' }}
                  transition={{ duration: 0.2 }}
                  style={{ width: '100%', height: '100%' }}
                >
                  {currentScreen === 'shelf' && <Shelf day={day} />}
                  {currentScreen === 'twin' && <Twin day={day} />}
                  {currentScreen === 'ledger' && <Ledger day={day} />}
                  {currentScreen === 'futureself' && <FutureSelf day={day} />}
                  {currentScreen === 'review' && <Review day={day} />}
                  {currentScreen === 'profile' && <Profile day={day} potential={potential} stage={stage} />}
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>
      )}
    </>
  );
}

function App() {
  const [day, setDayState] = useState(1);
  const [potential, setPotential] = useState(0);
  const [stage, setStage] = useState({ stage: 'orienting', explanation: '' });
  const [currentScreen, setCurrentScreen] = useState('shelf');
  const [onboarded, setOnboarded] = useState(false);

  useEffect(() => {
    if (onboarded) {
      loadGlobalState(day);
    }
  }, [day, onboarded]);

  async function loadGlobalState(d) {
    const p = await fetchPotential(d);
    setPotential(p.index);
    const s = await fetchStage(d);
    setStage(s);
  }

  function handleScrubberChange(e) {
    const newDay = parseInt(e.target.value, 10);
    setDayState(newDay);
    setClock(newDay);
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login/*" element={<SignInPage />} />
      <Route 
        path="/app" 
        element={
          <DashboardFlow 
            day={day} 
            handleScrubberChange={handleScrubberChange} 
            potential={potential} 
            stage={stage} 
            currentScreen={currentScreen} 
            setCurrentScreen={setCurrentScreen} 
            onboarded={onboarded} 
            setOnboarded={setOnboarded} 
          />
        } 
      />
    </Routes>
  );
}

export default App;
