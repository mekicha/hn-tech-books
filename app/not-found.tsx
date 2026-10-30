import Link from 'next/link';
export default function NotFound() { return <main className="page empty-state"><h1>This book isn’t on the shelf.</h1><p>The link may be incorrect, or the book hasn’t been added yet.</p><Link className="primary-button" href="/">Back to the bookshelf</Link></main>; }
