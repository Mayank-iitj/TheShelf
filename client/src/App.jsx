import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutDashboard, Activity, BookOpen, UserCircle, CalendarClock, CircleUserRound } from 'lucide-react';
import './styles.css';
import { setClock, fetchPotential, fetchStage } from './lib/api';
import Landing from './screens/Landing';
import Shelf from './screens/Shelf';
import Twin from './screens/Twin';
import Ledger from './screens/Ledger';
import FutureSelf from './screens/FutureSelf';
import Review from './screens/Review';
import Profile from './screens/Profile';
import Onboarding from './screens/Onboarding';
import SignInPage from './screens/SignInPage';
import { useAuth, useUser } from '@clerk/clerk-react';
import { Routes, Route, Navigate } from 'react-router-dom';

function DashboardFlow({ day, handleScrubberChange, potential, stage, currentScreen, setCurrentScreen, onboarded, setOnboarded }) {
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();

  if (!isLoaded) return null; // Wait for clerk to initialize

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
            <div className="scrubber">
              <div className="mono scrubber-day-label" style={{ width: '52px' }}>Day {day}</div>
              <div className="scrubber-track">
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
              <div className="mono scrubber-day-label" style={{ width: '52px', textAlign: 'right' }}>Day 21</div>
            </div>

            <header className="header">
              <div className="potential-block">
                <motion.div
                  key={potential}
                  initial={{ scale: 1.15, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="potential-index mono"
                >
                  {potential}
                </motion.div>
                <div className="potential-label">Potential Index</div>
              </div>
              <div className="stage-block">
                <div className="stage-badge"><span className="dot" />{stage.stage}</div>
                <div className="stage-explanation">{stage.explanation}</div>
              </div>
            </header>

            <div className="main-content">
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
                </nav>

                <button
                  className={`sidebar-account ${currentScreen === 'profile' ? 'active' : ''}`}
                  onClick={() => setCurrentScreen('profile')}
                >
                  {user?.imageUrl ? (
                    <img src={user.imageUrl} alt="" className="sidebar-account-avatar" />
                  ) : (
                    <CircleUserRound size={22} />
                  )}
                  <span className="sidebar-account-name">{user?.fullName || user?.username || 'Profile'}</span>
                </button>
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
