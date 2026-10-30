'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
const KEY = 'hn-books:reading-list:v1';
const ReadingList = createContext({ saved: [] as string[], ready: false, toggle: (_slug: string) => {}, error: '' });
export function ReadingListProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    try { const value: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]'); if (Array.isArray(value)) setSaved(value.filter((s): s is string => typeof s === 'string')); }
    catch { setError('Browser storage is unavailable. Your reading list will last for this session.'); }
    setReady(true);
    const sync = (event: StorageEvent) => { if (event.key === KEY) { try { const value: unknown = JSON.parse(event.newValue ?? '[]'); if (Array.isArray(value)) setSaved(value.filter((s): s is string => typeof s === 'string')); } catch { /* Preserve current list on malformed external data. */ } } };
    window.addEventListener('storage', sync); return () => window.removeEventListener('storage', sync);
  }, []);
  function toggle(slug: string) {
    const next = saved.includes(slug) ? saved.filter(s => s !== slug) : [...saved, slug];
    setSaved(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { setError('Browser storage is unavailable. Your reading list will last for this session.'); }
  }
  return <ReadingList.Provider value={{ saved, ready, toggle, error }}>{children}</ReadingList.Provider>;
}
export const useReadingList = () => useContext(ReadingList);
export function SaveButton({ slug, compact = false }: { slug: string; compact?: boolean }) {
  const { saved, ready, toggle } = useReadingList();
  const active = saved.includes(slug);
  return <button className={`save-button ${active ? 'active' : ''}`} disabled={!ready} aria-pressed={active} aria-label={`${active ? 'Remove from' : 'Save to'} reading list`} onClick={() => toggle(slug)}><span aria-hidden="true">{active ? '✓' : '+'}</span>{compact ? (active ? 'Saved' : 'Save') : (active ? 'In your reading list' : 'Save to reading list')}</button>;
}
