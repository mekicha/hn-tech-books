import imported from '@/data/hn-book-candidates.json';
import audit from '@/data/reviews/imported-books.json';
const reviews = new Map(audit.reviews.map(review => [review.isbn13, review]));
// Missing or unresolved decisions must never become public by default.
export const publishedImports = imported.books.flatMap(book => {
 const review = reviews.get(book.isbn13);
 if (review?.decision !== 'include' || !review.title?.trim() || !review.topic?.trim()) return [];
 return [{...book, title: review.title, topic: review.topic, metadataVerified: review.metadataLookup==='found', authors: review.authors??[], metadataUrl: review.metadataUrl?.startsWith('https://openlibrary.org/')?review.metadataUrl:`https://openlibrary.org/isbn/${book.isbn13}`}];
}).sort((a,b)=>a.title.localeCompare(b.title)||a.isbn13.localeCompare(b.isbn13));
export const importCounts = {
 total: imported.books.length,
 published: publishedImports.length,
 metadataVerified: publishedImports.filter(book=>book.metadataVerified).length,
 excluded: imported.books.filter(book=>reviews.get(book.isbn13)?.decision==='exclude').length,
 pending: imported.books.filter(book=>!reviews.has(book.isbn13)||reviews.get(book.isbn13)?.decision==='needs_metadata').length,
 mentions: publishedImports.reduce((n,book)=>n+book.mentions.length,0),
};
