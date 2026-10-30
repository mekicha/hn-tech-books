import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeDiscovery, plainText } from '../lib/discovery';
test('external comments remain plain text and retain source identity',()=>{
 const result=normalizeDiscovery({hits:[{objectID:'123',story_id:456,comment_text:'<p>I would <b>not</b> recommend &quot;Book&quot;.</p>',author:'reader',created_at:'2026-10-30T00:00:00Z',story_title:'Books &amp; code'}],nbPages:100,nbHits:2000,exhaustiveNbHits:false},0);
 assert.equal(result.mentions[0].text,'I would not recommend "Book".');
 assert.equal(result.mentions[0].threadId,456); assert.equal(result.pages,50);assert.equal(result.exhaustive,false);
 assert.equal(plainText('&#x110000; &#39;'),'\'');
});
test('unusable comments cannot generate fabricated source links',()=>{
 assert.equal(normalizeDiscovery({hits:[{objectID:'no',story_id:456,comment_text:'x'},{objectID:'123',comment_text:'x'}]},0).mentions.length,0);
 assert.throws(()=>normalizeDiscovery({error:'upstream failure'},0));
});
