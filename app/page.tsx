'use client';

import { useState, useEffect, useRef } from 'react';

type TimerMode = 'momentum' | 'sprint' | 'flex';
type TimerState = 'idle' | 'running' | 'paused';

export default function Home() {
  const [mode, setMode] = useState<TimerMode>('momentum');
  const [state, setState] = useState<TimerState>('idle');
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [energy, setEnergy] = useState(100);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Momentum Mode: Dynamic intervals that adapt to completion patterns
  const momentumPresets = [
    { duration: 5, label: '5 min Quick Win', energy: 15 },
    { duration: 12, label: '12 min Flow Start', energy: 25 },
    { duration: 18, label: '18 min Deep Dive', energy: 40 },
    { duration: 25, label: '25 min Full Focus', energy: 50 }
  ];

  // Sprint Mode: Micro-burst intervals with instant gratification
  const sprintPresets = [
    { duration: 2, label: '2 min Blitz', energy: 10 },
    { duration: 5, label: '5 min Rush', energy: 15 },
    { duration: 10, label: '10 min Power', energy: 25 }
  ];

  // Flex Mode: Custom time with break suggestions
  const [customMinutes, setCustomMinutes] = useState(15);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio();
    }
  }, []);

  const playChime = () => {
    if (audioRef.current) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    }
  };

  const startTimer = (minutes: number, energyCost: number) => {
    if (state === 'running') {
      stopTimer();
      return;
    }

    const seconds = minutes * 60;
    setTimeLeft(seconds);
    setTotalTime(seconds);
    setState('running');
    setEnergy(Math.max(0, energy - energyCost));

    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          completeSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const completeSession = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setState('idle');
    setSessionCount(prev => prev + 1);
    setEnergy(prev => Math.min(100, prev + 30));
    playChime();

    if (Notification.permission === 'granted') {
      new Notification('Timer Complete! 🎉', {
        body: 'Great job! Time for a break.',
        icon: '/favicon.ico'
      });
    }
  };

  const stopTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setState('idle');
    setTimeLeft(0);
  };

  const pauseTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setState('paused');
  };

  const resumeTimer = () => {
    setState('running');
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          completeSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    if (totalTime === 0) return 0;
    return ((totalTime - timeLeft) / totalTime) * 100;
  };

  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      backgroundColor: '#0a0a0a',
      color: '#e0e0e0',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      overflow: 'hidden'
    }}>
      {/* Left Column - Momentum Mode */}
      <div style={{
        flex: 1,
        padding: '40px',
        borderRight: '1px solid #222',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        backgroundColor: mode === 'momentum' ? '#111' : '#0a0a0a'
      }}>
        <div>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '700',
            margin: '0 0 8px 0',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            ⚡ Momentum
          </h2>
          <p style={{
            margin: 0,
            color: '#888',
            fontSize: '14px',
            lineHeight: '1.5'
          }}>
            Build focus gradually. Each session completed boosts your energy for longer sessions.
          </p>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          flex: 1
        }}>
          {momentumPresets.map((preset) => (
            <button
              key={preset.duration}
              onClick={() => {
                setMode('momentum');
                startTimer(preset.duration, preset.energy);
              }}
              disabled={energy < preset.energy}
              style={{
                padding: '20px',
                backgroundColor: energy >= preset.energy ? '#1a1a2e' : '#151515',
                border: mode === 'momentum' && state === 'running' && totalTime === preset.duration * 60
                  ? '2px solid #667eea'
                  : '1px solid #333',
                borderRadius: '12px',
                color: energy >= preset.energy ? '#e0e0e0' : '#555',
                cursor: energy >= preset.energy ? 'pointer' : 'not-allowed',
                fontSize: '16px',
                fontWeight: '600',
                textAlign: 'left',
                transition: 'all 0.2s',
                opacity: energy >= preset.energy ? 1 : 0.5
              }}
              onMouseEnter={(e) => {
                if (energy >= preset.energy) {
                  e.currentTarget.style.backgroundColor = '#252540';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = energy >= preset.energy ? '#1a1a2e' : '#151515';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{preset.label}</span>
                <span style={{
                  fontSize: '12px',
                  color: '#888',
                  padding: '4px 8px',
                  backgroundColor: '#0a0a0a',
                  borderRadius: '6px'
                }}>
                  -{preset.energy} energy
                </span>
              </div>
            </button>
          ))}
        </div>

        <div style={{
          padding: '16px',
          backgroundColor: '#1a1a2e',
          borderRadius: '12px',
          border: '1px solid #333'
        }}>
          <div style={{
            fontSize: '12px',
            color: '#888',
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            Energy Level
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              flex: 1,
              height: '8px',
              backgroundColor: '#0a0a0a',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${energy}%`,
                height: '100%',
                backgroundColor: energy > 60 ? '#10b981' : energy > 30 ? '#f59e0b' : '#ef4444',
                transition: 'width 0.3s, background-color 0.3s'
              }} />
            </div>
            <span style={{
              fontSize: '18px',
              fontWeight: '700',
              color: '#e0e0e0',
              minWidth: '50px'
            }}>
              {energy}%
            </span>
          </div>
        </div>
      </div>

      {/* Center Column - Timer Display & Sprint Mode */}
      <div style={{
        flex: 1,
        padding: '40px',
        borderRight: '1px solid #222',
        display: 'flex',
        flexDirection: 'column',
        gap: '30px',
        backgroundColor: mode === 'sprint' ? '#111' : '#0a0a0a',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Timer Display */}
        <div style={{
          textAlign: 'center',
          marginBottom: '20px'
        }}>
          <div style={{
            fontSize: '96px',
            fontWeight: '700',
            fontVariantNumeric: 'tabular-nums',
            color: state === 'running' ? '#667eea' : state === 'paused' ? '#f59e0b' : '#444',
            marginBottom: '16px',
            transition: 'color 0.3s'
          }}>
            {timeLeft > 0 ? formatTime(timeLeft) : '--:--'}
          </div>

          {state !== 'idle' && (
            <div style={{
              width: '320px',
              height: '8px',
              backgroundColor: '#1a1a1a',
              borderRadius: '4px',
              overflow: 'hidden',
              margin: '0 auto 20px'
            }}>
              <div style={{
                width: `${getProgress()}%`,
                height: '100%',
                backgroundColor: '#667eea',
                transition: 'width 0.3s'
              }} />
            </div>
          )}

          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center'
          }}>
            {state === 'running' && (
              <>
                <button
                  onClick={pauseTimer}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#f59e0b',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#000',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  ⏸ Pause
                </button>
                <button
                  onClick={stopTimer}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#ef4444',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  ⏹ Stop
                </button>
              </>
            )}
            {state === 'paused' && (
              <>
                <button
                  onClick={resumeTimer}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#10b981',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  ▶ Resume
                </button>
                <button
                  onClick={stopTimer}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#ef4444',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  ⏹ Stop
                </button>
              </>
            )}
          </div>
        </div>

        {/* Sprint Mode */}
        <div style={{
          width: '100%',
          maxWidth: '400px'
        }}>
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              margin: '0 0 8px 0',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              🚀 Sprint
            </h2>
            <p style={{
              margin: 0,
              color: '#888',
              fontSize: '14px',
              lineHeight: '1.5'
            }}>
              Quick bursts for instant wins. No energy cost—start anytime.
            </p>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {sprintPresets.map((preset) => (
              <button
                key={preset.duration}
                onClick={() => {
                  setMode('sprint');
                  startTimer(preset.duration, 0);
                }}
                style={{
                  padding: '16px',
                  backgroundColor: '#1a1a2e',
                  border: mode === 'sprint' && state === 'running' && totalTime === preset.duration * 60
                    ? '2px solid #f5576c'
                    : '1px solid #333',
                  borderRadius: '12px',
                  color: '#e0e0e0',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600',
                  textAlign: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#252540';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#1a1a2e';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div style={{
          padding: '16px',
          backgroundColor: '#1a1a2e',
          borderRadius: '12px',
          border: '1px solid #333',
          width: '100%',
          maxWidth: '400px'
        }}>
          <div style={{
            fontSize: '12px',
            color: '#888',
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            Sessions Completed Today
          </div>
          <div style={{
            fontSize: '36px',
            fontWeight: '700',
            color: '#10b981'
          }}>
            {sessionCount}
          </div>
        </div>
      </div>

      {/* Right Column - Flex Mode */}
      <div style={{
        flex: 1,
        padding: '40px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        backgroundColor: mode === 'flex' ? '#111' : '#0a0a0a'
      }}>
        <div>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '700',
            margin: '0 0 8px 0',
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            🎯 Flex
          </h2>
          <p style={{
            margin: 0,
            color: '#888',
            fontSize: '14px',
            lineHeight: '1.5'
          }}>
            Custom duration. You decide the length. Perfect for unique tasks.
          </p>
        </div>

        <div style={{
          padding: '24px',
          backgroundColor: '#1a1a2e',
          borderRadius: '12px',
          border: '1px solid #333'
        }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            color: '#888',
            marginBottom: '12px',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            Minutes
          </label>
          <input
            type="range"
            min="1"
            max="60"
            value={customMinutes}
            onChange={(e) => setCustomMinutes(parseInt(e.target.value))}
            style={{
              width: '100%',
              height: '8px',
              borderRadius: '4px',
              background: '#0a0a0a',
              outline: 'none',
              marginBottom: '16px'
            }}
          />
          <div style={{
            fontSize: '48px',
            fontWeight: '700',
            textAlign: 'center',
            color: '#4facfe',
            marginBottom: '20px'
          }}>
            {customMinutes} min
          </div>
          <button
            onClick={() => {
              setMode('flex');
              startTimer(customMinutes, 0);
            }}
            style={{
              width: '100%',
              padding: '16px',
              backgroundColor: '#4facfe',
              border: 'none',
              borderRadius: '8px',
              color: '#000',
              fontSize: '18px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#3d9ce0';
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#4facfe';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            Start Custom Timer
          </button>
        </div>

        {/* Break Suggestions */}
        <div style={{
          flex: 1,
          padding: '24px',
          backgroundColor: '#1a1a2e',
          borderRadius: '12px',
          border: '1px solid #333'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '700',
            margin: '0 0 16px 0',
            color: '#e0e0e0'
          }}>
            Break Ideas
          </h3>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            fontSize: '14px',
            color: '#aaa',
            lineHeight: '1.6'
          }}>
            <div style={{
              padding: '12px',
              backgroundColor: '#0a0a0a',
              borderRadius: '8px',
              borderLeft: '3px solid #10b981'
            }}>
              💧 Hydrate - Drink water
            </div>
            <div style={{
              padding: '12px',
              backgroundColor: '#0a0a0a',
              borderRadius: '8px',
              borderLeft: '3px solid #3b82f6'
            }}>
              🚶 Move - Quick walk or stretch
            </div>
            <div style={{
              padding: '12px',
              backgroundColor: '#0a0a0a',
              borderRadius: '8px',
              borderLeft: '3px solid #8b5cf6'
            }}>
              👀 Rest eyes - Look 20ft away
            </div>
            <div style={{
              padding: '12px',
              backgroundColor: '#0a0a0a',
              borderRadius: '8px',
              borderLeft: '3px solid #f59e0b'
            }}>
              🧘 Breathe - 3 deep breaths
            </div>
            <div style={{
              padding: '12px',
              backgroundColor: '#0a0a0a',
              borderRadius: '8px',
              borderLeft: '3px solid #ec4899'
            }}>
              ✨ Celebrate - You did it!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
