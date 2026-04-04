import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Save, Activity, ShieldAlert, Terminal, Fingerprint, Keyboard } from 'lucide-react';
import api from '../utils/api';

interface Keystroke {
  key: string;
  pressTime: number;
  releaseTime: number;
  duration: number;
  gap: number;
  timestamp: string;
}

interface PasteEvent {
  timestamp: number;
  length: number;
  timeString: string;
}

const Editor: React.FC = () => {
  const [content, setContent] = useState('');
  const [keystrokes, setKeystrokes] = useState<Keystroke[]>([]);
  const [pasteEvents, setPasteEvents] = useState<PasteEvent[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [lastRelease, setLastRelease] = useState<number>(Date.now());
  const [isTyping, setIsTyping] = useState(false);
  
  const activeKeys = useRef<Map<string, number>>(new Map());
  const typingTimer = useRef<NodeJS.Timeout | null>(null);
  const eventLogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (eventLogRef.current) {
      eventLogRef.current.scrollTop = eventLogRef.current.scrollHeight;
    }
  }, [keystrokes, pasteEvents]);

  // Reset logic when content is cleared
  useEffect(() => {
    if (content.length === 0) {
      setKeystrokes([]);
      setPasteEvents([]);
      setLastRelease(Date.now());
    }
  }, [content]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!activeKeys.current.has(e.key)) {
      activeKeys.current.set(e.key, Date.now());
    }
    setIsTyping(true);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => setIsTyping(false), 1000);
  };

  const handleKeyUp = (e: React.KeyboardEvent) => {
    const pressTime = activeKeys.current.get(e.key);
    if (pressTime) {
      const releaseTime = Date.now();
      const duration = releaseTime - pressTime;
      const gap = pressTime - lastRelease;

      const newKeystroke: Keystroke = {
        key: e.key,
        pressTime,
        releaseTime,
        duration,
        gap,
        timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };

      setKeystrokes(prev => [...prev.slice(-99), newKeystroke]); // Keep more for scoring but log only high-level
      setLastRelease(releaseTime);
      activeKeys.current.delete(e.key);
    }
  };

  const internalClipboard = useRef<string>('');

  const handleCopy = () => {
    const selectedText = window.getSelection()?.toString();
    if (selectedText) {
      internalClipboard.current = selectedText;
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pastedText = e.clipboardData.getData('text');
    
    // Check if it was copied from inside the editor
    if (pastedText === internalClipboard.current && pastedText !== '') {
      // Internal paste - ignore or log as non-event
      return;
    }

    const newPaste: PasteEvent = {
      timestamp: Date.now(),
      timeString: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      length: pastedText.length
    };
    setPasteEvents(prev => [...prev, newPaste]);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.post('/sessions/save', {
        content,
        keystrokes,
        pasteEvents
      });
      alert('Behavioral signature finalized and submitted.');
    } catch (err) {
      alert('Verification server unreachable. Please check your connection.');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset logic when content is cleared
  useEffect(() => {
    if (content.length === 0) {
      setKeystrokes([]);
      setPasteEvents([]);
      setLastRelease(Date.now());
    }
  }, [content]);

  const wordCount = content.trim() === '' ? 0 : content.trim().split(/\s+/).length;
  
  const authenticityScore = useMemo(() => {
    // Default to 100% confidence
    let score = 100;
    
    // Penalties from pastes
    score -= pasteEvents.length * 30;
    const largePastes = pasteEvents.filter(p => p.length > 50).length;
    score -= largePastes * 20;

    // Recovery Mechanic: Every 10 keystrokes recovers 5% of the penalty
    // This allows the user to 'prove' their humanity by typing after a paste
    if (score < 100 && keystrokes.length > 0) {
      const recoveryBonus = Math.floor(keystrokes.length / 10) * 5;
      score += recoveryBonus;
    }

    return Math.min(100, Math.max(0, Math.round(score)));
  }, [pasteEvents, keystrokes.length]);

  // High-level log events
  const displayEvents = useMemo(() => {
    const logs: any[] = [];
    
    // Group keystrokes into 5-key chunks for cleaner logging
    for (let i = 0; i < keystrokes.length; i += 5) {
      const chunk = keystrokes.slice(i, i + 5);
      logs.push({
        type: 'activity',
        message: 'Keyboard response detected',
        time: chunk[0].timestamp,
        id: `key-${i}`
      });
    }

    // Always log pastes clearly as they are critical security events
    pasteEvents.forEach((p, idx) => {
      logs.push({
        type: 'alert',
        message: `Anomalous Paste (${p.length} chars)`,
        time: p.timeString,
        id: `paste-${idx}`
      });
    });

    return logs.sort((a, b) => a.time.localeCompare(b.time)).slice(-20);
  }, [keystrokes, pasteEvents]);

  return (
    <div className="editor-wrapper-layout">
      <div className="editor-container">
        <header className="editor-header">
          <div className="editor-title">
            <h2>Immersive Writer</h2>
            <p>Signature capturing in progress</p>
          </div>
          {/* <div className="status-pills">
            <div className={`pill ${isTyping ? 'active' : ''}`}>
              <span className="pulse-dot"></span>
              {isTyping ? 'Verifying Rhythm' : 'Standby'}
            </div>
          </div> */}
        </header>

        <div className="writing-surface">
          <textarea
            className="writing-area"
            placeholder="Vi-Notes: Authenticating the human signature within every written word. Start composing to verify..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            onPaste={handlePaste}
            onCopy={handleCopy}
          />
          
          <div className="live-metrics">
            <div className="metric-item">
              <span className="metric-value">{wordCount}</span>
              <span className="metric-label">Words</span>
            </div>
            <div className="metric-item">
              <span className="metric-value">{keystrokes.length}</span>
              <span className="metric-label">Keys</span>
            </div>
          </div>
        </div>

        {/* <div className="action-bar">
          <button 
            className="primary-btn" 
            onClick={handleSave}
            disabled={isSaving || content.length < 5}
          >
            {isSaving ? 'Finalizing...' : (
              <>
                <Save size={20} />
                Submit 
              </>
            )}
          </button>
        </div> */}
      </div>

      <aside className="analysis-sidebar">
        <div className="analysis-header">
          <h3>System Analysis</h3>
          <Terminal size={18} className="text-secondary" />
        </div>
        
        <div className="event-log" ref={eventLogRef}>
          {displayEvents.length === 0 ? (
            <div className="text-secondary text-sm p-4 opacity-50 italic">
              Awaiting human behavioral input...
            </div>
          ) : (
            displayEvents.map((log) => (
              <div key={log.id} className={`event-item ${log.type === 'alert' ? 'border-red-500/20 bg-red-500/5' : ''}`}>
                <div className="flex items-center gap-2">
                  {log.type === 'activity' ? (
                    <Keyboard size={12} className="text-accent-primary" />
                  ) : (
                    <ShieldAlert size={12} className="text-red-400" />
                  )}
                  <span className={`event-type ${log.type === 'activity' ? 'key' : 'paste'}`}>
                    {log.message}
                  </span>
                </div>
                <span className="text-[10px] opacity-30">{log.time}</span>
              </div>
            ))
          )}
        </div>

        <div className="security-panel">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Human Confidence</span>
            <span className={`text-xs font-bold ${authenticityScore > 70 ? 'text-green-400' : 'text-red-400'}`}>
              {authenticityScore}%
            </span>
          </div>
          <div className="authenticity-meter">
            <div 
              className="meter-fill" 
              style={{ 
                width: `${authenticityScore}%`,
                background: authenticityScore < 40 ? '#f43f5e' : (authenticityScore < 70 ? '#f59e0b' : '#22c55e')
              }}
            ></div>
          </div>
          
          <div className="signature-badge">
            <span className="signature-label">Verified Cognitive Fingerprint</span>
            <span className="signature-id">VN-{Math.random().toString(36).substring(2, 10).toUpperCase()}</span>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <Fingerprint size={20} className="text-accent-primary" />
              <span className="font-bold text-sm tracking-tight text-white/90">Cognitive Signature</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
              Real-time behavioral analytics are verifying your unique typing dynamics to ensure total content authenticity and human origin.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default Editor;
