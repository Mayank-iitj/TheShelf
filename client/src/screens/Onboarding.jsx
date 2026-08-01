import { useState, useEffect, useRef } from 'react';
import { submitOnboarding } from '../lib/api';
import Stepper, { Step } from '../components/Stepper';
import Aurora from '../components/Aurora';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { motion } from 'framer-motion';

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
  const [isListening, setIsListening] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Initialize Web Speech API if supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setAnswers(prev => {
            const next = [...prev];
            next[activeStep] = (next[activeStep] ? next[activeStep] + ' ' : '') + transcript;
            return next;
          });
        }
      };

      recognition.onerror = (e) => {
        console.warn('Speech recognition error:', e);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [activeStep]);

  const toggleVoiceInput = (index) => {
    setActiveStep(index);
    if (!recognitionRef.current) {
      alert('Voice input is not supported in this browser. Please type your answer.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleAnswerChange = (index, value) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const finishOnboarding = async () => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setCommitting(true);
    setError(null);
    try {
      await submitOnboarding(answers);
    } catch (e) {
      console.error("Onboarding failed:", e);
      setError(e.message || "Failed to save responses. Please try again.");
    }
    setCommitting(false);
    onComplete();
  };

  if (committing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '24px' }} className="text-gradient">Drafting your Identity Ledger...</h1>
        <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Translating reflections into verifiable claims.</div>
      </div>
    );
  }

  return (
    <div className="fade-enter-active" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.4 }}>
        <Aurora colorStops={['#21d2ed', '#a78bfa', '#09090b']} speed={0.8} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '800px' }}>
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444', color: '#fca5a5', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>
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
              <div style={{ fontSize: '2.5rem', fontFamily: 'var(--font-display)', marginBottom: '32px', lineHeight: 1.4, fontWeight: 700 }}>
                {question}
              </div>

              <div style={{ position: 'relative', marginBottom: '32px' }}>
                <textarea 
                  autoFocus={index === 0}
                  value={answers[index]}
                  onChange={e => handleAnswerChange(index, e.target.value)}
                  className="onboarding-textarea"
                  placeholder="Type your reflection or click the mic to speak..."
                  style={{ paddingRight: '60px' }}
                />

                {/* Voice Input Mic Button */}
                <button
                  type="button"
                  onClick={() => toggleVoiceInput(index)}
                  title={isListening ? 'Stop listening' : 'Speak your response'}
                  style={{
                    position: 'absolute', right: '16px', top: '16px',
                    width: '44px', height: '44px', borderRadius: '50%',
                    background: isListening && activeStep === index ? 'var(--accent-cyan)' : 'var(--bg-card)',
                    border: isListening && activeStep === index ? 'none' : '1px solid var(--border-rule)',
                    color: isListening && activeStep === index ? '#000' : 'var(--accent-cyan)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'all 0.2s ease',
                    boxShadow: isListening && activeStep === index ? '0 0 16px var(--border-glow)' : 'none'
                  }}
                >
                  {isListening && activeStep === index ? (
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}>
                      <MicOff size={20} />
                    </motion.div>
                  ) : (
                    <Mic size={20} />
                  )}
                </button>
              </div>

              {isListening && activeStep === index && (
                <motion.div 
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-cyan)', fontSize: '0.875rem' }}
                  className="mono"
                >
                  <Volume2 size={16} /> Listening... Speak naturally to populate your answer.
                </motion.div>
              )}
            </Step>
          ))}
        </Stepper>
      </div>
    </div>
  );
}

export default Onboarding;
