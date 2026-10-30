import test from 'node:test';
import assert from 'node:assert/strict';
import { books, filterBooks, threadCount, type Filters } from '../lib/catalog';
const defaults: Filters = { query:'',tag:'',audience:'',sort:'title',savedOnly:false,saved:[] };
test('aliases and case-insensitive multiword author searches find canonical books', () => {
 assert.deepEqual(filterBooks(books,{...defaults,query:'aima'}).map(b=>b.slug),['artificial-intelligence-a-modern-approach']);
 assert.deepEqual(filterBooks(books,{...defaults,query:'SUTTON barto'}).map(b=>b.slug),['reinforcement-learning']);
});
test('combined filters intersect rather than losing saved or level constraints', () => {
 assert.deepEqual(filterBooks(books,{...defaults,tag:'Software',audience:'Advanced'}),[]);
 assert.deepEqual(filterBooks(books,{...defaults,savedOnly:true,saved:['deep-learning'],tag:'AI'}).map(b=>b.slug),['deep-learning']);
 assert.equal(filterBooks(books,{...defaults,savedOnly:true}).length,0);
});
test('counts unique discussions and latest comment sorts first', () => {
 const book = {...books[0], recommendations:[books[0].recommendations[0], {...books[0].recommendations[0],commentId:99}]};
 assert.equal(threadCount(book),1);
 assert.equal(filterBooks(books,{...defaults,sort:'recent'})[0].slug,'reinforcement-learning');
});
test('seed catalog is internally consistent and has source evidence', () => {
 assert.equal(new Set(books.map(b=>b.slug)).size,books.length);
 for(const book of books) {
  assert.ok(book.title && book.authors.length && book.tags.length && book.recommendations.length);
  assert.equal(new Set(book.recommendations.map(r=>r.commentId)).size,book.recommendations.length);
  for(const r of book.recommendations) { assert.ok(r.reviewed && r.quote && r.context && r.threadContext); assert.ok(r.commentId>0 && r.threadId>0); assert.match(r.date,/^\d{4}-\d{2}-\d{2}$/); }
 }
});
