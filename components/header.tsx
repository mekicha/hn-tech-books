'use client';
import Link from 'next/link';
import { useReadingList } from './reading-list';
export function Header() {
 const { saved, error } = useReadingList();
 return <><header className="site-header"><Link href="/" className="brand"><span className="brand-mark">h<span>/</span></span>the hacker’s bookshelf<span className="beta">BETA</span></Link><nav aria-label="Main navigation"><Link href="/">Bookshelf</Link><Link href="/imported">Imported books</Link><Link href="/discover">Search HN</Link><Link href="/?saved=1">Reading list <span className="count">{saved.length}</span></Link><Link href="/about">About</Link></nav></header>{error && <p className="storage-error" role="status">{error}</p>}</>;
}
