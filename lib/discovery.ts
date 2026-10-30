export type Mention = { id: number; author: string; text: string; date: string; threadId: number; threadTitle: string };
export type Discovery = { mentions: Mention[]; page: number; pages: number; total: number; exhaustive: boolean };
export function plainText(value: string) {
 return value.replace(/<[^>]*>/g, ' ').replace(/&(?:#(\d+)|#x([\da-f]+)|([a-z]+));/gi, (match, dec, hex, name) => {
  if (dec || hex) { const n = parseInt(dec || hex, dec ? 10 : 16); return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : ''; }
  return ({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '} as Record<string,string>)[name] ?? match;
 }).replace(/\s+/g,' ').trim();
}
export function normalizeDiscovery(data: unknown, page: number): Discovery {
 if (!data || typeof data !== 'object' || !('hits' in data) || !Array.isArray(data.hits)) throw new Error('Invalid search response');
 const source = data as Record<string,unknown>;
 const mentions: Mention[] = [];
 for (const hit of source.hits as Record<string,unknown>[]) {
  const id=Number(hit.objectID), threadId=Number(hit.story_id);
  if (!Number.isSafeInteger(id) || id<=0 || !Number.isSafeInteger(threadId) || threadId<=0 || typeof hit.comment_text !== 'string') continue;
  const text=plainText(hit.comment_text); if (!text) continue;
  mentions.push({id,threadId,text,author:typeof hit.author==='string'?hit.author:'unknown',date:typeof hit.created_at==='string' && !Number.isNaN(Date.parse(hit.created_at))?hit.created_at.slice(0,10):'',threadTitle:typeof hit.story_title==='string'?plainText(hit.story_title):'HN discussion'});
 }
 return {mentions,page,pages:Math.min(50,Math.max(0,Number(source.nbPages)||0)),total:Math.max(0,Number(source.nbHits)||0),exhaustive:source.exhaustiveNbHits===true};
}
