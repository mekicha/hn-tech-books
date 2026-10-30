import Link from 'next/link';
import imported from '@/data/hn-book-candidates.json';
export const metadata={title:'Locally imported HN books'};
export default async function Imported({searchParams}:{searchParams:Promise<{q?:string;page?:string}>}) {
 const params=await searchParams;const q=typeof params.q==='string'?params.q.trim().slice(0,160):'';
 const words=q.toLowerCase().split(/\s+/).filter(Boolean);
 const results=imported.books.filter(b=>words.every(w=>[b.sourceTitle,b.isbn13,...b.mentions.map(m=>m.text)].join(' ').toLowerCase().includes(w)));
 const pages=Math.max(1,Math.ceil(results.length/24));const page=Math.min(pages,Math.max(1,Math.floor(Number(params.page))||1));
 const start=(page-1)*24, end=Math.min(start+24,results.length);
 const visiblePages=[...new Set([1,...Array.from({length:5},(_,i)=>page+i-2).filter(p=>p>1&&p<pages),pages])].sort((a,b)=>a-b);
 const url=(p:number)=>`/imported?${new URLSearchParams({q,page:String(p)})}`;
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
 return <main className="page"><section className="hero"><div className="eyebrow">STORED LOCALLY · SOURCED FROM HACKER NEWS</div><h1>The imported collection.</h1><p>{imported.books.length.toLocaleString()} distinct ISBN editions found in HN comments.<br/>These are unreviewed book candidates; different editions can refer to the same work.</p></section><form className="search-wrap" action="/imported"><input aria-label="Search imported books" type="search" name="q" defaultValue={q} placeholder="Search a title, ISBN, or topic…" maxLength={160}/><button className="primary-button">Search imported books</button></form><p className="coverage-note">Titles come from source links and may be incomplete. Matches may include criticism or incidental references. <Link href="/">Browse reviewed recommendations →</Link></p><h2>{results.length.toLocaleString()} matches</h2>{pagination("top")}{results.length===0&&<p>No matching imports. Try a title, an ISBN, or a broader topic.</p>}<div className="book-grid">{results.slice((page-1)*24,page*24).map(book=><article className="recommendation" key={book.isbn13}><span className="eyebrow">UNREVIEWED · ISBN {book.isbn13}</span><h3>{book.sourceTitle}</h3><p className="mention-text">{book.mentions[0].text.slice(0,650)}{book.mentions[0].text.length>650?'…':''}</p><p>{book.mentions.length} source {book.mentions.length===1?'comment':'comments'}</p><div className="recommendation-links"><a href={book.mentions[0].sourceUrl} target="_blank" rel="noreferrer">Read HN source ↗</a><a href={`https://openlibrary.org/isbn/${book.isbn13}`} target="_blank" rel="noreferrer">Check book metadata ↗</a></div></article>)}</div>{pagination("bottom")}</main>;
}
