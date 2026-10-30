import source from '@/data/catalog.json';
export type Recommendation = { commentId: number; author: string; quote: string; context: string; date: string; stance: string; threadId: number; threadTitle: string; threadContext: string; reviewed: boolean };
export type Book = { slug: string; title: string; authors: string[]; year: number; tags: string[]; audience: string; purpose: string; description: string; color: string; aliases: string[]; recommendations: Recommendation[]; caveat: string };
export const catalog = source as { updatedAt: string; coverage: string; books: Book[] };
export const books = catalog.books;
export const tags = [...new Set(books.flatMap(b => b.tags))].sort();
export const hnUrl = (id: number) => `https://news.ycombinator.com/item?id=${id}`;
export function threadCount(book: Book) { return new Set(book.recommendations.map(r => r.threadId)).size; }
export function latestDate(book: Book) { return book.recommendations.map(r => r.date).sort().at(-1) ?? ''; }
export type Filters = { query: string; tag: string; audience: string; sort: string; savedOnly: boolean; saved: string[] };
export function filterBooks(items: Book[], f: Filters): Book[] {
  const words = f.query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  return items.filter(b => {
    const haystack = [b.title, ...b.authors, ...b.aliases, ...b.tags, b.description, b.purpose, b.audience].join(' ').toLocaleLowerCase();
    return words.every(w => haystack.includes(w)) && (!f.tag || b.tags.includes(f.tag)) && (!f.audience || b.audience === f.audience) && (!f.savedOnly || f.saved.includes(b.slug));
  }).sort((a,b) => {
    if (f.sort === 'recent') return latestDate(b).localeCompare(latestDate(a)) || a.title.localeCompare(b.title);
    if (f.sort === 'discussions') return threadCount(b) - threadCount(a) || a.title.localeCompare(b.title);
    return a.title.localeCompare(b.title);
  });
}
export function formatDate(date: string) { return new Intl.DateTimeFormat('en-GB', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(date + 'T00:00:00Z')); }
