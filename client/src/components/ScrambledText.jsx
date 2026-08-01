import { useEffect, useRef, useState } from 'react';
import './ScrambledText.css';

const ScrambledText = ({
  radius = 100,
  duration = 1.2,
  speed = 0.5,
  scrambleChars = '.:',
  className = '',
  style = {},
  children
}) => {
  const rootRef = useRef(null);
  const [chars, setChars] = useState([]);

  useEffect(() => {
    if (typeof children === 'string') {
      // Split text into characters manually to avoid requiring Club GSAP SplitText
      setChars(children.split('').map((char, index) => ({
        id: index,
        original: char,
        current: char,
        scrambling: false
      })));
    }
  }, [children]);

  useEffect(() => {
    if (!rootRef.current || chars.length === 0) return;

    const charElements = rootRef.current.querySelectorAll('.char');
    
    const handleMove = (e) => {
      charElements.forEach((el, idx) => {
        const rect = el.getBoundingClientRect();
        const left = rect.left;
        const top = rect.top;
        const width = rect.width;
        const height = rect.height;
        const dx = e.clientX - (left + width / 2);
        const dy = e.clientY - (top + height / 2);
        const dist = Math.hypot(dx, dy);

        if (dist < radius && !el.dataset.scrambling) {
          el.dataset.scrambling = 'true';
          const originalText = el.dataset.content || '';
          let elapsed = 0;
          const totalSteps = Math.max(5, Math.round((duration * (1 - dist / radius) * 1000) / (speed * 100)));
          
          const interval = setInterval(() => {
            elapsed++;
            if (elapsed >= totalSteps) {
              el.innerText = originalText;
              el.style.opacity = '1';
              clearInterval(interval);
              delete el.dataset.scrambling;
            } else {
              // Pick random scramble character
              if (originalText.trim() === '') {
                el.innerText = ' ';
              } else {
                const randomChar = scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
                el.innerText = randomChar;
                el.style.opacity = '0.7';
              }
            }
          }, speed * 100);
        }
      });
    };

    const el = rootRef.current;
    el.addEventListener('pointermove', handleMove);

    return () => {
      el.removeEventListener('pointermove', handleMove);
    };
  }, [radius, duration, speed, scrambleChars, chars]);

  return (
    <div ref={rootRef} className={`text-block ${className}`} style={style}>
      <p style={{ margin: 0 }}>
        {chars.map(c => (
          <span 
            className="char" 
            key={c.id} 
            data-content={c.original}
            style={{ display: 'inline-block', whiteSpace: c.original === ' ' ? 'pre' : 'normal' }}
          >
            {c.original}
          </span>
        ))}
      </p>
    </div>
  );
};

export default ScrambledText;
