import { useState } from 'react';

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
      finishOnboarding();
    }
  };

  const finishOnboarding = () => {
    setCommitting(true);
    // Simulate LLM delay in deriving ledger rows
    setTimeout(() => {
      setCommitting(false);
      onComplete();
    }, 2000);
  };

  if (committing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '24px' }}>Drafting your Ledger...</h1>
        <div style={{ color: 'var(--dim)', fontFamily: 'var(--font-mono)' }}>Translating answers into measurable claims.</div>
      </div>
    );
  }

  return (
    <div className="fade-enter-active" style={{ maxWidth: '600px', margin: '100px auto' }}>
      <div style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', marginBottom: '40px', lineHeight: 1.4 }}>
        {QUESTIONS[step]}
      </div>
      
      <textarea 
        autoFocus
        value={answer}
        onChange={e => setAnswer(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleNext(); } }}
        style={{ 
          width: '100%', height: '150px', padding: '16px', fontSize: '1.125rem', 
          fontFamily: 'var(--font-body)', border: '1px solid var(--rule)', 
          background: 'var(--paper)', color: 'var(--ink)', resize: 'none',
          marginBottom: '24px'
        }}
        placeholder="Type your answer..."
      />
      
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn" onClick={handleNext} style={{ fontSize: '1.125rem', padding: '12px 24px', background: 'var(--ink)', color: 'var(--paper)' }}>
          {step === QUESTIONS.length - 1 ? 'Commit' : 'Next'}
        </button>
      </div>
    </div>
  );
}

export default Onboarding;
