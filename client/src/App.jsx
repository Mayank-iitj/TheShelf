import { useState, useEffect } from 'react';
import './styles.css';
import { fetchClock, setClock, fetchPotential, fetchStage } from './lib/api';
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

  if (!onboarded) {
    return <Onboarding onComplete={() => setOnboarded(true)} />;
  }

  function renderScreen() {
    switch (currentScreen) {
      case 'shelf': return <Shelf day={day} />;
      case 'twin': return <Twin day={day} />;
      case 'ledger': return <Ledger day={day} />;
      case 'futureself': return <FutureSelf day={day} />;
      case 'review': return <Review day={day} />;
      default: return <Shelf day={day} />;
    }
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
          <div className="potential-index mono">{potential}</div>
          <div style={{fontSize: '0.875rem', color: 'var(--dim)'}}>Potential Index</div>
        </div>
        <div style={{textAlign: 'right'}}>
          <div className="mono" style={{fontSize: '1.25rem'}}>{stage.stage}</div>
          <div className="stage-badge">{stage.explanation}</div>
        </div>
      </header>

      <div className="main-content">
        <aside className="sidebar">
          <nav>
            <a href="#shelf" className={currentScreen === 'shelf' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setCurrentScreen('shelf'); }}>Today's Shelf</a>
            <a href="#twin" className={currentScreen === 'twin' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setCurrentScreen('twin'); }}>Attention Twin</a>
            <a href="#ledger" className={currentScreen === 'ledger' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setCurrentScreen('ledger'); }}>Identity Ledger</a>
            <a href="#futureself" className={currentScreen === 'futureself' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setCurrentScreen('futureself'); }}>Future Self</a>
            <a href="#review" className={currentScreen === 'review' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setCurrentScreen('review'); }}>Weekly Review</a>
          </nav>
        </aside>
        
        <main className="content-area">
          {renderScreen()}
        </main>
      </div>
    </div>
  );
}

export default App;
