import { useState } from 'react';
import { submitOnboarding } from '../lib/api';
import Stepper, { Step } from '../components/Stepper';
import Aurora from '../components/Aurora';

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
  const [error, setError] = useState(null);

  const handleAnswerChange = (index, value) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const finishOnboarding = async () => {
    setCommitting(true);
    setError(null);
    try {
      await submitOnboarding(answers);
      setCommitting(false);
      onComplete();
    } catch (e) {
      console.error("Onboarding failed:", e);
      setCommitting(false);
      setError("Something went wrong saving your answers. Please try again.");
    }
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <Aurora colorStops={['#2dd4bf', '#f0913f', '#2dd4bf']} amplitude={0.9} blend={0.55} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 60% at 50% 40%, transparent 0%, var(--bg-base) 85%)' }} />
      </div>

      {committing ? (
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '16px', fontWeight: 700 }}>Drafting your Ledger&hellip;</h1>
          <div style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}>Translating answers into measurable claims.</div>
        </div>
      ) : (
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px' }}>
          <div style={{ width: '100%', maxWidth: '800px' }}>
            {error && (
              <div style={{ marginBottom: '24px', padding: '16px 20px', background: 'var(--attention-dim)', border: '1px solid var(--attention-line)', borderRadius: '8px', color: 'var(--attention)' }}>
                {error}
              </div>
            )}
            <Stepper
              initialStep={1}
              onFinalStepCompleted={finishOnboarding}
              backButtonText="Previous"
              nextButtonText="Next"
            >
              {QUESTIONS.map((question, index) => (
                <Step key={index}>
                  <div style={{ fontSize: '2.25rem', fontFamily: 'var(--font-display)', marginBottom: '36px', lineHeight: 1.4, fontWeight: 700, letterSpacing: '-0.01em' }}>
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
      )}
    </div>
  );
}

export default Onboarding;
