import {test,expect} from '@playwright/test';
test('live discovery preserves criticism, context links, pagination and empty states',async({page})=>{
 await page.route('**/api/discover?*',async route=>{
  const url=new URL(route.request().url());
  await route.fulfill({json:{mentions:url.searchParams.get('page')==='1'?[]:[{id:123,threadId:456,author:'reader',date:'2026-10-30',threadTitle:'Database books',text:'I would not recommend this book. <script>alert(1)</script>'}],page:Number(url.searchParams.get('page')),pages:2,total:21,exhaustive:false}});
 });
 await page.goto('/discover');await page.getByLabel('Book, author, or topic').fill('database books');await page.getByRole('button',{name:'Search HN'}).click();
 await expect(page.getByText('Unreviewed mention',{exact:true})).toBeVisible();
 await expect(page.getByText('I would not recommend this book.',{exact:false})).toBeVisible();
 await expect(page.getByRole('link',{name:'Read original comment'})).toHaveAttribute('href','https://news.ycombinator.com/item?id=123');
 await page.getByRole('button',{name:'Next',exact:true}).click();await expect(page.getByText('No matching comments.',{exact:false})).toBeVisible();
});
test('live discovery offers a recoverable upstream failure',async({page})=>{
 await page.route('**/api/discover?*',r=>r.fulfill({status:502,json:{error:'Search temporarily unavailable'}}));
 await page.goto('/discover');await page.getByLabel('Book, author, or topic').fill('systems');await page.getByRole('button',{name:'Search HN'}).click();await expect(page.getByRole('alert').filter({hasText:'Search temporarily unavailable'})).toHaveText('Search temporarily unavailable');
});
