import { Suspense } from 'react';
import { Catalog } from '@/components/catalog';
export default function Home() { return <Suspense fallback={<main className="page"><p>Opening the bookshelf…</p></main>}><Catalog/></Suspense>; }
