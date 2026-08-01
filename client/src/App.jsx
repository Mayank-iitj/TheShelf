import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutDashboard, Activity, BookOpen, UserCircle, CalendarClock } from 'lucide-react';
import './styles.css';
import { fetchClock, setClock, fetchPotential, fetchStage } from './lib/api';
import Landing from './screens/Landing';
import Shelf from './screens/Shelf';
import Twin from './screens/Twin';
import Ledger from './screens/Ledger';
import FutureSelf from './screens/FutureSelf';
import Review from './screens/Review';
import Onboarding from './screens/Onboarding';

function App() {
  const [day, setDayState] = useState(1);
  const [potential, setPotential] = useState(0);
  const [stage, setStage] = useState({ stage: 'orienting', explanation: '' });
  const [currentScreen, setCurrentScreen] = useState('shelf');
  const [landed, setLanded] = useState(false);   // has user left the landing page?
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

  // Step 1: Show landing page
  if (!landed) {
    return (
      <AnimatePresence mode="wait">
        <motion.div key="landing" initial={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.4 }}>
          <Landing onEnterApp={() => setLanded(true)} />
        </motion.div>
      </AnimatePresence>
    );
  }

  // Step 2: Show onboarding
  if (!onboarded) {
    return (
      <AnimatePresence mode="wait">
        <motion.div key="onboarding" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Onboarding onComplete={() => setOnboarded(true)} />
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div className="app-container">
      <div className="scrubber">
        <div className="mono" style={{ width: '60px' }}>Day {day}</div>
        <div className="scrubber-track">
          <input 
            type="range" 
            min="1" 
            max="21" 
            value={day} 
            onChange={handleScrubberChange} 
          />
        </div>
        <div className="mono" style={{ width: '60px', textAlign: 'right' }}>Day 21</div>
      </div>

      <header className="header">
        <div>
          <motion.div 
            key={potential}
            initial={{ scale: 1.5, opacity: 0, filter: 'blur(10px)' }}
            animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
            className="potential-index mono"
          >
            {potential}
          </motion.div>
          <div style={{fontSize: '0.875rem', color: 'var(--text-muted)'}}>Potential Index</div>
        </div>
        <div style={{textAlign: 'right'}}>
          <div className="mono" style={{fontSize: '1.25rem'}}>{stage.stage}</div>
          <div className="stage-badge">{stage.explanation}</div>
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
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default App;
