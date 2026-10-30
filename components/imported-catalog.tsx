import Link from 'next/link';
import { books } from '@/lib/catalog';
import { publishedImports, importCounts } from '@/lib/imported-books';
export async function ImportedCatalog({searchParams,basePath='/imported'}:{searchParams:Promise<{q?:string;page?:string}>,basePath?:string}) {
 const params=await searchParams;const q=typeof params.q==='string'?params.q.trim().slice(0,160):'';
 const words=q.toLowerCase().split(/\s+/).filter(Boolean);
 const results=publishedImports.filter(b=>words.every(w=>[b.title,b.topic,b.isbn13].join(' ').toLowerCase().includes(w)));
 const pages=Math.max(1,Math.ceil(results.length/24));const page=Math.min(pages,Math.max(1,Math.floor(Number(params.page))||1));
 const start=(page-1)*24, end=Math.min(start+24,results.length);
 const visiblePages=[...new Set([1,...Array.from({length:5},(_,i)=>page+i-2).filter(p=>p>1&&p<pages),pages])].sort((a,b)=>a-b);
 const url=(p:number)=>`${basePath}?${new URLSearchParams({q,page:String(p)})}`;
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
 return <main className="page"><section className="hero"><div className="eyebrow">STORED LOCALLY · SOURCED FROM HACKER NEWS</div><h1>The technical bookshelf.</h1><p>{importCounts.published.toLocaleString()} technical book editions found in HN comments.<br/>Titles and relevance have been reviewed from source links. Different editions can refer to the same work.</p><div className="collection-stats" aria-label="Collection totals"><span><strong>{importCounts.published.toLocaleString()}</strong> published technical editions</span><span><strong>{books.length.toLocaleString()}</strong> reviewed books</span><span><strong>{importCounts.mentions.toLocaleString()}</strong> HN source mentions</span></div></section><form className="search-wrap" action={basePath}><input aria-label="Search imported books" type="search" name="q" defaultValue={q} placeholder="Search a title, ISBN, or topic…" maxLength={160}/><button className="primary-button">Search imported books</button></form><p className="coverage-note">{importCounts.total.toLocaleString()} imported records audited: {importCounts.excluded} off-topic records excluded and {importCounts.pending} records held for metadata review. {importCounts.metadataVerified} published titles have Open Library ISBN metadata; other titles retain source-based editorial review. HN mentions may include criticism and are not automatically recommendations. <Link href="/?reviewed=1">Browse reviewed recommendations →</Link></p><h2>{results.length.toLocaleString()} matches</h2>{pagination("top")}{results.length===0&&<p>No matching imports. Try a title, an ISBN, or a broader topic.</p>}<div className="book-grid">{results.slice((page-1)*24,page*24).map(book=><article className="recommendation" key={book.isbn13}><span className="eyebrow">{book.topic} · ISBN {book.isbn13}</span><h3 className="imported-book-title">{book.title}</h3>{book.authors.length>0&&<p className="authors">{book.authors.join(' · ')}</p>}<small>{book.metadataVerified?'ISBN metadata checked against Open Library':'Title reviewed from source links'}</small><p className="mention-text">{book.mentions[0].text.slice(0,650)}{book.mentions[0].text.length>650?'…':''}</p><p>{book.mentions.length} source {book.mentions.length===1?'comment':'comments'}</p><div className="recommendation-links"><a href={book.mentions[0].sourceUrl} target="_blank" rel="noreferrer">Read HN source ↗</a><a href={book.metadataUrl} target="_blank" rel="noreferrer">Check book metadata ↗</a></div></article>)}</div>{pagination("bottom")}</main>;
}
