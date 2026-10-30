import { NextRequest, NextResponse } from 'next/server';
import { normalizeDiscovery } from '@/lib/discovery';
export async function GET(request: NextRequest) {
 const params=request.nextUrl.searchParams, q=(params.get('q')??'').trim(), page=Number(params.get('page')??'0'), sort=params.get('sort')??'relevance';
 if(q.length<2 || q.length>160 || !Number.isInteger(page) || page<0 || page>49 || !['relevance','recent'].includes(sort)) return NextResponse.json({error:'Enter 2–160 characters and a valid page.'},{status:400});
 const search=new URLSearchParams({query:q,tags:'comment',hitsPerPage:'20',page:String(page)});
 try {
  const response=await fetch(`https://hn.algolia.com/api/v1/${sort==='recent'?'search_by_date':'search'}?${search}`,{signal:AbortSignal.timeout(10000),next:{revalidate:300}});
  if(!response.ok) throw new Error('Search unavailable');
  return NextResponse.json(normalizeDiscovery(await response.json(),page));
 } catch { return NextResponse.json({error:'Hacker News search is temporarily unavailable. Please try again.'},{status:502}); }
}
