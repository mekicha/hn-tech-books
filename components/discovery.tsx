'use client';
import { useRef, useState, type FormEvent } from 'react';
import type { Discovery } from '@/lib/discovery';
import { hnUrl } from '@/lib/catalog';
export function LiveDiscovery() {
 const [query,setQuery]=useState(''), [sort,setSort]=useState('relevance'), [data,setData]=useState<Discovery|null>(null), [busy,setBusy]=useState(false), [error,setError]=useState(''), [searched,setSearched]=useState(''), [searchedSort,setSearchedSort]=useState('relevance');
 const controller=useRef<AbortController|null>(null);
 async function search(page=0, paginate=false) {
  controller.current?.abort(); const current=new AbortController(); controller.current=current;
  setBusy(true); setError(''); setData(null); const q=paginate?searched:query.trim(), order=paginate?searchedSort:sort; setSearched(q); setSearchedSort(order);
  try { const response=await fetch(`/api/discover?${new URLSearchParams({q,page:String(page),sort:order})}`,{signal:current.signal}); const body=await response.json(); if(!response.ok) throw new Error(body.error||'Search failed'); if(controller.current===current)setData(body); }
  catch(e) {if(controller.current===current && !current.signal.aborted)setError(e instanceof Error?e.message:'Search failed');}
  finally {if(controller.current===current)setBusy(false);}
 }
 function submit(e:FormEvent){e.preventDefault();void search();}
 return <main className="page"><section className="hero"><div className="eyebrow">BEYOND THE CURATED SHELF</div><h1>Find the conversation.</h1><p>Search Hacker News for a technical book, author, or topic across discussions.<br/>Mentions are source material, and may include criticism or unrelated matches.</p></section>
 <form onSubmit={submit} className="discovery-form"><label htmlFor="live-query">Book, author, or topic</label><div className="search-wrap"><input id="live-query" type="search" minLength={2} maxLength={160} required placeholder="Designing Data-Intensive Applications, databases…" value={query} onChange={e=>setQuery(e.target.value)}/><button className="primary-button" disabled={busy}>Search HN</button></div><label>Order <select value={sort} onChange={e=>setSort(e.target.value)}><option value="relevance">Relevance</option><option value="recent">Most recent</option></select></label></form>
 <div aria-live="polite" aria-busy={busy}>{busy&&<p>Searching Hacker News…</p>}{error&&<p role="alert">{error}</p>}{data&&<><h2 className="discovery-heading">{data.total} search matches for “{searched}”</h2><p>Unreviewed mentions · Search coverage is limited; these are not verified recommendations.{!data.exhaustive&&' The total is approximate.'}</p>{data.mentions.length===0?<p className="empty-state">No matching comments. Try the full book title, an author, or another topic.</p>:data.mentions.map(m=><article className="recommendation" key={m.id}><div className="recommendation-meta"><strong>@{m.author}</strong>{m.date&&<time dateTime={m.date}>{m.date}</time>}<span>Unreviewed mention</span></div><p className="mention-text">{m.text}</p><h3>{m.threadTitle}</h3><div className="recommendation-links"><a href={hnUrl(m.id)} target="_blank" rel="noreferrer">Read original comment ↗</a><a href={`${hnUrl(m.id)}&context=3`} target="_blank" rel="noreferrer">View parent conversation ↗</a><a href={hnUrl(m.threadId)} target="_blank" rel="noreferrer">Open discussion ↗</a></div></article>)}{data.pages>1&&<div className="discovery-pagination"><button disabled={busy||data.page===0} onClick={()=>void search(data.page-1,true)}>Previous</button><span>Page {data.page+1} of {data.pages}</span><button disabled={busy||data.page+1>=data.pages} onClick={()=>void search(data.page+1,true)}>Next</button></div>}</>}</div></main>;
}
