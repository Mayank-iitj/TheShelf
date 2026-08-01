import { useState } from 'react';
import { submitOnboarding } from '../lib/api';

const QUESTIONS = [
  "What are you trying to become good at, and why that?",
  "What have you actually finished in the last month? Not started — finished.",
  "When you sit down to learn, what usually happens?",
  "What do you tell people you're into that you never actually spend time on?",
  "How much time do you really have on a normal weekday?",
  "What's something you believe about this field that most people around you don't?",
  "What would make you say, a year from now, that this year worked?"
];

function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState('');
  const [answers, setAnswers] = useState([]);
  const [committing, setCommitting] = useState(false);

  const handleNext = () => {
    if (!answer.trim()) return;
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);
    setAnswer('');
    
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      finishOnboarding(newAnswers);
    }
  };

  const finishOnboarding = async (finalAnswers) => {
    setCommitting(true);
    try {
      await submitOnboarding(finalAnswers);
    } catch (e) {
      console.error("Onboarding failed:", e);
    }
    setCommitting(false);
    onComplete();
  };

  if (committing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '24px' }} className="text-gradient">Drafting your Ledger...</h1>
        <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Translating answers into measurable claims.</div>
      </div>
    );
  }

  return (
    <div className="fade-enter-active" style={{ maxWidth: '600px', margin: '100px auto' }}>
      <div style={{ fontSize: '2.5rem', fontFamily: 'var(--font-display)', marginBottom: '40px', lineHeight: 1.4, fontWeight: 700 }}>
        {QUESTIONS[step]}
      </div>
      
      <textarea 
        autoFocus
        value={answer}
        onChange={e => setAnswer(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleNext(); } }}
        style={{ 
          width: '100%', height: '150px', padding: '24px', fontSize: '1.25rem', 
          fontFamily: 'var(--font-body)', border: '1px solid var(--border-rule)', 
          background: 'var(--bg-card)', color: 'var(--text-main)', resize: 'none',
          marginBottom: '32px', borderRadius: 'var(--radius-md)', outline: 'none',
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.2)'
        }}
        placeholder="Type your answer..."
      />
      
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn" onClick={handleNext} style={{ fontSize: '1.125rem', padding: '12px 32px', background: 'var(--accent-cyan)', color: 'var(--bg-main)', border: 'none', borderRadius: 'var(--radius-sm)' }}>
          {step === QUESTIONS.length - 1 ? 'Commit' : 'Next'}
        </button>
      </div>
    </div>
  );
}

export default Onboarding;
