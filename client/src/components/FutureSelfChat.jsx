import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageCircle } from 'lucide-react';
import { chatWithFutureSelf } from '../lib/api';

const STARTERS = [
  'What should I be doing right now?',
  'Am I on track?',
  'What would disappoint you about today?'
];

export default function FutureSelfChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  const send = async (text) => {
    const trimmed = (text ?? input).trim();
    if (!trimmed || sending) return;

    const history = messages.map(m => ({ role: m.role, content: m.content }));
    setMessages(prev => [...prev, { role: 'user', content: trimmed }]);
    setInput('');
    setSending(true);

    try {
      const res = await chatWithFutureSelf(trimmed, history);
      setMessages(prev => [...prev, { role: 'assistant', content: res.reply }]);
    } catch (err) {
      console.error('Future Self chat failed:', err);
      setMessages(prev => [...prev, { role: 'assistant', content: "I couldn't quite hear that — ask me again?" }]);
    }
    setSending(false);
  };

  return (
    <div className="card" style={{ marginTop: '48px', maxWidth: '800px', padding: '28px' }}>
      <h2 style={{ fontSize: '1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
        <MessageCircle size={17} style={{ color: 'var(--growth)' }} /> Ask Your Future Self
      </h2>

      <div
        ref={scrollRef}
        style={{
          maxHeight: messages.length ? '320px' : 0,
          overflowY: 'auto',
          marginBottom: messages.length ? '16px' : 0,
          transition: 'max-height 0.3s ease, margin-bottom 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}
      >
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.9375rem',
                lineHeight: 1.5,
                background: m.role === 'user' ? 'var(--growth-dim)' : 'var(--bg-surface-sunken)',
                border: `1px solid ${m.role === 'user' ? 'var(--growth-line)' : 'var(--border-hairline)'}`,
                color: 'var(--text-primary)'
              }}
            >
              {m.content}
            </motion.div>
          ))}
        </AnimatePresence>
        {sending && (
          <div style={{ alignSelf: 'flex-start', color: 'var(--text-tertiary)', fontSize: '0.875rem', fontStyle: 'italic' }}>
            thinking…
          </div>
        )}
      </div>

      {messages.length === 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
          {STARTERS.map(s => (
            <button key={s} className="chip" onClick={() => send(s)} style={{ cursor: 'pointer' }}>
              {s}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') send(); }}
          placeholder="Ask them anything…"
          disabled={sending}
          style={{
            flex: 1,
            padding: '10px 14px',
            fontSize: '0.9375rem',
            fontFamily: 'var(--font-body)',
            background: 'var(--bg-surface-sunken)',
            border: '1px solid var(--border-hairline-strong)',
            color: 'var(--text-primary)',
            borderRadius: 'var(--radius-sm)',
            outline: 'none'
          }}
        />
        <button className="btn btn-primary" onClick={() => send()} disabled={sending || !input.trim()} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}
