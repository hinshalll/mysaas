"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ALL_TOOLS } from '../app/config';
import { Search, ArrowRight } from 'lucide-react';
import { Icon, useKeydown, useBodyLock, tint, tintFg, tintBorder } from './LucideIcons';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onPick: (id: string) => void;
}

function fuzzyMatch(query: string, target: string) {
  if (!query) return { score: 1, matched: false };
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  if (t.includes(q)) return { score: 100 - t.indexOf(q), matched: true };
  
  let qi = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) qi++;
  }
  if (qi === q.length) return { score: 1, matched: true };
  return { score: 0, matched: false };
}

function searchTools(query: string) {
  if (!query.trim()) return ALL_TOOLS;
  return ALL_TOOLS
    .map(t => {
      const a = fuzzyMatch(query, t.name);
      const b = fuzzyMatch(query, t.tagline);
      const c = fuzzyMatch(query, t.categoryLabel);
      const score = Math.max(a.score, b.score * 0.7, c.score * 0.5);
      return { ...t, _score: score };
    })
    .filter(t => t._score > 0)
    .sort((a, b) => b._score - a._score);
}

export default function CommandPalette({ open, onClose, onPick }: CommandPaletteProps) {
  const [q, setQ] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => searchTools(q).slice(0, 12), [q]);

  useKeydown(useCallback((e: KeyboardEvent) => {
    if (open && e.key === 'Escape') onClose();
  }, [open, onClose]));

  useEffect(() => {
    if (open) {
      setQ('');
      setCursor(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => { setCursor(0); }, [q]);

  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector(`[data-row="${cursor}"]`);
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  useBodyLock(open);

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor(c => Math.min(c + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor(c => Math.max(c - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[cursor]) onPick(results[cursor].id);
    }
  }

  if (!open) return null;

  return (
    <div className="fade-in" onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'var(--bg-overlay-modal)',
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      paddingTop: 'min(15vh, 120px)',
    }}>
      <div onClick={e => e.stopPropagation()} className="scale-in" style={{
        width: 'min(640px, calc(100vw - 32px))',
        background: 'var(--bg-modal)',
        border: '1px solid var(--border-strong)',
        borderRadius: 14,
        boxShadow: 'var(--shadow-modal)',
        overflow: 'hidden',
      }}>
        {/* Input */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '14px 18px',
          borderBottom: '1px solid var(--border)',
        }}>
          <Search size={16} style={{ color: 'var(--fg-subtle)' }} />
          <input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder="Jump to a tool, search by what it does…"
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--fg)', fontSize: 15,
              fontFamily: 'inherit',
            }}
          />
          {q && (
            <button onClick={() => setQ('')} className="reset" style={{
              fontSize: 11, color: 'var(--fg-muted)',
              padding: '3px 7px', borderRadius: 4,
              background: 'var(--bg-elev-2)', cursor: 'pointer',
            }}>clear</button>
          )}
          <kbd
            onClick={onClose}
            className="kbd"
            style={{
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'background 0.15s, border-color 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--bg-hover)';
              e.currentTarget.style.borderColor = 'var(--border-strong)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '';
              e.currentTarget.style.borderColor = '';
            }}
            title="Close Search (Esc)"
          >
            esc
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} style={{
          maxHeight: '50vh',
          overflowY: 'auto',
          padding: 6,
        }}>
          {results.length === 0 ? (
            <div style={{
              padding: '40px 20px', textAlign: 'center',
              color: 'var(--fg-subtle)', fontSize: 13,
            }}>
              No tools match <span className="mono" style={{ color: 'var(--fg-muted)' }}>"{q}"</span>
            </div>
          ) : results.map((t: any, i: number) => {
            const Ico = Icon[t.icon] || Search;
            const active = i === cursor;
            return (
              <button key={t.id} data-row={i}
                onClick={() => onPick(t.id)}
                onMouseEnter={() => setCursor(i)}
                className="reset"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: active ? 'var(--bg-hover)' : 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}>
                <span style={{
                  width: 30, height: 30, borderRadius: 7,
                  background: tint(t.hue),
                  border: `1px solid ${tintBorder(t.hue)}`,
                  color: tintFg(t.hue),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Ico size={14} strokeWidth={1.8} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--fg)' }}>{t.name}</span>
                    {t.pro && <span className="pro-badge" style={{ fontSize: 9 }}>PRO</span>}
                  </div>
                  <div style={{
                    fontSize: 11.5, color: 'var(--fg-subtle)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{t.tagline}</div>
                </div>
                <span style={{ fontSize: 10.5, color: 'var(--fg-dim)', letterSpacing: '0.04em' }} className="mono">
                  {t.categoryLabel}
                </span>
                {active && <ArrowRight size={13} style={{ color: 'var(--fg-muted)' }} />}
              </button>
            );
          })}
        </div>

        {/* Footer hints */}
        <div style={{
          padding: '8px 14px',
          borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 14,
          fontSize: 11, color: 'var(--fg-dim)',
          background: 'var(--bg-elev-1)',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <kbd className="kbd-sm">↑↓</kbd> navigate
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <kbd className="kbd-sm">↵</kbd> open
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <kbd className="kbd-sm">esc</kbd> close
          </span>
          <span style={{ flex: 1 }} />
          <span>{results.length} result{results.length === 1 ? '' : 's'}</span>
        </div>
      </div>
    </div>
  );
}
