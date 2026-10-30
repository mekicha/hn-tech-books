import Link from 'next/link';
import { ImportedSort } from './imported-sort';
import { books } from '@/lib/catalog';
import { publishedImports, importCounts } from '@/lib/imported-books';
export async function ImportedCatalog({searchParams,basePath='/imported'}:{searchParams:Promise<{q?:string;page?:string;sort?:string}>,basePath?:string}) {
 const params=await searchParams;const q=typeof params.q==='string'?params.q.trim().slice(0,160):'';
 const sort=params.sort==='title'?'title':'mentions';
 const words=q.toLowerCase().split(/\s+/).filter(Boolean);
 const results=publishedImports.filter(b=>words.every(w=>[b.title,b.topic,b.isbn13].join(' ').toLowerCase().includes(w))).sort((a,b)=>(sort==='mentions'?b.mentions.length-a.mentions.length:0)||a.title.localeCompare(b.title)||a.isbn13.localeCompare(b.isbn13));
 const pages=Math.max(1,Math.ceil(results.length/24));const page=Math.min(pages,Math.max(1,Math.floor(Number(params.page))||1));
 const start=(page-1)*24, end=Math.min(start+24,results.length);
 const visiblePages=[...new Set([1,...Array.from({length:5},(_,i)=>page+i-2).filter(p=>p>1&&p<pages),pages])].sort((a,b)=>a-b);
 const url=(p:number)=>`${basePath}?${new URLSearchParams({q,page:String(p),...(sort==='title'?{sort}: {})})}`;
 function pagination(position:string) {
  if(results.length===0)return null;
  return <nav className="import-pagination" aria-label={`Imported collection pages ${position}`}>
   <span className="page-summary">Showing {start+1}–{end} of {results.length.toLocaleString()}</span>
   <div className="page-links">
    {page>1?<Link href={url(page-1)} aria-label="Previous page">← Previous</Link>:<span aria-disabled="true">← Previous</span>}
    {visiblePages.map((p,i)=><span className="page-number-group" key={p}>{i>0&&p-visiblePages[i-1]>1&&<span className="page-ellipsis" aria-hidden="true">…</span>}<Link href={url(p)} aria-label={`Page ${p}`} aria-current={p===page?'page':undefined}>{p}</Link></span>)}
    {page<pages?<Link href={url(page+1)} aria-label="Next page">Next →</Link>:<span aria-disabled="true">Next →</span>}
   </div>
   <span className="page-summary">Page {page} of {pages}</span>
  </nav>;
 }
 return <main className="page imported-shelf"><section className="hero"><div className="eyebrow">THE HACKER’S BOOKSHELF</div><h1>The technical bookshelf.</h1><p>{importCounts.published.toLocaleString()} technical book editions found in HN comments.<br/>Explore programming, systems, mathematics, and engineering through the conversations behind the books.</p><div className="collection-stats" aria-label="Collection totals"><span><strong>{importCounts.published.toLocaleString()}</strong> published technical editions</span><span><strong>{books.length.toLocaleString()}</strong> reviewed books</span><span><strong>{importCounts.mentions.toLocaleString()}</strong> HN source mentions</span></div></section><form className="search-wrap" action={basePath}><input aria-label="Search imported books" type="search" name="q" defaultValue={q} placeholder="Search a title, ISBN, or topic…" maxLength={160}/><ImportedSort value={sort}/><button className="primary-button">Search imported books</button></form><h2>{results.length.toLocaleString()} matches</h2>{pagination("top")}{results.length===0&&<p>No matching imports. Try a title, an ISBN, or a broader topic.</p>}<div className="imported-grid">{results.slice((page-1)*24,page*24).map(book=><article className="recommendation imported-card" data-book-isbn={book.isbn13} key={book.isbn13}>
 <div className="imported-card-heading"><div className="mini-book" aria-hidden="true"><span>{book.title.replace(/[^a-zA-Z]/g,'').slice(0,2).toUpperCase()}</span></div><div className="imported-card-identity"><span className="book-category">{book.topic}</span><h3 className="imported-book-title">{book.title}</h3>{book.authors.length>0&&<p className="authors">{book.authors.join(' · ')}</p>}</div></div>
 <div className="imported-card-footer"><span>{book.mentions.length} HN {book.mentions.length===1?'mention':'mentions'}</span><a href={book.mentions[0].sourceUrl} target="_blank" rel="noreferrer">Read HN source ↗</a></div>
 <details className="book-discussion"><summary>Discussion &amp; book details <span aria-hidden="true">+</span></summary><div className="book-discussion-content"><p className="book-isbn">ISBN {book.isbn13}</p><small>{book.metadataVerified?'ISBN metadata checked against Open Library':'Title reviewed from source links'}</small><a className="book-metadata-link" href={book.metadataUrl} target="_blank" rel="noreferrer">Check book metadata ↗</a><p className="mention-disclaimer">HN mentions may include criticism or incidental references.</p>{book.mentions.map(mention=><div className="source-mention" key={mention.commentId}><a href={mention.sourceUrl} target="_blank" rel="noreferrer">@{mention.author||'HN reader'} · View comment ↗</a><p>{mention.text}</p></div>)}</div></details>
 </article>)}</div>{pagination("bottom")}<details className="collection-method"><summary>About this collection</summary><p className="coverage-note">{importCounts.total.toLocaleString()} imported records audited: {importCounts.excluded} off-topic records excluded and {importCounts.pending} records held for metadata review. {importCounts.metadataVerified} published titles have Open Library ISBN metadata; other titles retain source-based editorial review. HN mentions may include criticism and are not automatically recommendations. <Link href="/?reviewed=1">Browse reviewed recommendations →</Link></p></details></main>;
}
