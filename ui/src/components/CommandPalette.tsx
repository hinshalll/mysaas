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
    <div className="fade-in fixed inset-0 z-[100] bg-[var(--bg-overlay-modal)] backdrop-blur-[8px] flex items-start justify-center pt-[min(15vh,120px)]" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="scale-in w-[min(640px,calc(100vw-32px))] bg-[var(--bg-modal)] border border-[var(--border-strong)] rounded-[14px] shadow-[var(--shadow-modal)] overflow-hidden">
        {/* Input */}
        <div className="flex items-center gap-2.5 px-[18px] py-[14px] border-b border-[var(--border)]">
          <Search size={16} className="text-[var(--fg-subtle)]" />
          <input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder="Jump to a tool, search by what it does…"
            className="flex-1 bg-transparent border-none outline-none text-[var(--fg)] text-[15px] font-[inherit]"
          />
          {q && (
            <button onClick={() => setQ('')} className="reset text-[11px] text-[var(--fg-muted)] px-[7px] py-[3px] rounded-[4px] bg-[var(--bg-elev-2)] cursor-pointer">clear</button>
          )}
          <kbd
            onClick={onClose}
            className="kbd cursor-pointer select-none transition-colors duration-150 hover:bg-[var(--bg-hover)] hover:border-[var(--border-strong)]"
            title="Close Search (Esc)"
          >
            esc
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[50vh] overflow-y-auto p-1.5">
          {results.length === 0 ? (
            <div className="py-10 px-5 text-center text-[var(--fg-subtle)] text-[13px]">
              No tools match <span className="mono text-[var(--fg-muted)]">"{q}"</span>
            </div>
          ) : results.map((t: any, i: number) => {
            const Ico = Icon[t.icon] || Search;
            const active = i === cursor;
            return (
              <button key={t.id} data-row={i}
                onClick={() => onPick(t.id)}
                onMouseEnter={() => setCursor(i)}
                className={`reset w-full box-border flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-left ${active ? 'bg-[var(--bg-hover)]' : 'bg-transparent'}`}
              >
                <span className="w-[30px] h-[30px] rounded-[7px] flex items-center justify-center shrink-0" style={{
                  background: tint(t.hue),
                  border: `1px solid ${tintBorder(t.hue)}`,
                  color: tintFg(t.hue),
                }}>
                  <Ico size={14} strokeWidth={1.8} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[13.5px] font-medium text-[var(--fg)]">{t.name}</span>
                    {t.pro && <span className="pro-badge text-[9px]">PRO</span>}
                  </div>
                  <div className="text-[11.5px] text-[var(--fg-subtle)] overflow-hidden text-ellipsis whitespace-nowrap">{t.tagline}</div>
                </div>
                <span className="text-[10.5px] text-[var(--fg-dim)] tracking-[0.04em] mono">
                  {t.categoryLabel}
                </span>
                {active && <ArrowRight size={13} className="text-[var(--fg-muted)]" />}
              </button>
            );
          })}
        </div>

        {/* Footer hints */}
        <div className="px-3.5 py-2 border-t border-[var(--border)] flex items-center gap-3.5 text-[11px] text-[var(--fg-dim)] bg-[var(--bg-elev-1)]">
          <span className="flex items-center gap-1.25">
            <kbd className="kbd-sm">↑↓</kbd> navigate
          </span>
          <span className="flex items-center gap-1.25">
            <kbd className="kbd-sm">↵</kbd> open
          </span>
          <span className="flex items-center gap-1.25">
            <kbd className="kbd-sm">esc</kbd> close
          </span>
          <span className="flex-1" />
          <span>{results.length} result{results.length === 1 ? '' : 's'}</span>
        </div>
      </div>
    </div>
  );
}
