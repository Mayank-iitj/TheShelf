import { useState } from 'react';
import { submitOnboarding } from '../lib/api';
import Stepper, { Step } from '../components/Stepper';

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
  const [answers, setAnswers] = useState(Array(QUESTIONS.length).fill(''));
  const [committing, setCommitting] = useState(false);

  const handleAnswerChange = (index, value) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const finishOnboarding = async () => {
    setCommitting(true);
    try {
      await submitOnboarding(answers);
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
    <div className="fade-enter-active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '800px' }}>
        <Stepper
          initialStep={1}
          onFinalStepCompleted={finishOnboarding}
          backButtonText="Previous"
          nextButtonText="Next"
        >
          {QUESTIONS.map((question, index) => (
            <Step key={index}>
              <div style={{ fontSize: '2.5rem', fontFamily: 'var(--font-display)', marginBottom: '40px', lineHeight: 1.4, fontWeight: 700 }}>
                {question}
              </div>
              <textarea 
                autoFocus={index === 0}
                value={answers[index]}
                onChange={e => handleAnswerChange(index, e.target.value)}
                className="onboarding-textarea"
                placeholder="Type your answer..."
              />
            </Step>
          ))}
        </Stepper>
      </div>
    </div>
  );
}

export default Onboarding;
