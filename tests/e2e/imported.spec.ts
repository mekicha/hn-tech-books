import {test,expect} from '@playwright/test';
test('stored bulk collection can be searched and paginated without live API access',async({page})=>{
 await page.route('https://hn.algolia.com/**',r=>r.abort());
 await page.goto('/imported');
 await expect(page.getByRole('heading',{name:'The imported collection.'})).toBeVisible();
 await expect(page.locator('article.recommendation')).toHaveCount(24);
 const isbn=await page.locator('article.recommendation .eyebrow').first().textContent();
 const value=isbn!.match(/\d{13}/)![0];
 await page.getByRole('navigation',{name:'Imported collection pages top'}).getByRole('link',{name:'Next page',exact:true}).click();await expect(page.getByRole('navigation',{name:'Imported collection pages top'}).getByText('Page 2 of',{exact:false})).toBeVisible();
 await page.getByRole('searchbox',{name:'Search imported books'}).fill(value);await page.getByRole('button',{name:'Search imported books'}).click();
 await expect(page.locator('article.recommendation')).toHaveCount(1);
 await expect(page.getByRole('link',{name:'Read HN source'})).toHaveAttribute('href',/^https:\/\/news.ycombinator.com\/item\?id=\d+$/);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
});

test('numbered pages preserve search and clamp out-of-range pages',async({page})=>{
 await page.goto('/imported?q=software');
 const nav=page.getByRole('navigation',{name:'Imported collection pages top'});
 await nav.getByRole('link',{name:'Page 2',exact:true}).click();
 await expect(page).toHaveURL(/q=software&page=2/);
 await expect(nav.getByRole('link',{name:'Page 2',exact:true})).toHaveAttribute('aria-current','page');
 await page.goto('/imported?page=99999');
 await expect(nav.getByText('Page 43 of 43',{exact:true})).toBeVisible();
 await expect(page.locator('article.recommendation')).toHaveCount(2);
 await expect(nav.getByRole('link',{name:'Next page'})).toHaveCount(0);
 await page.goto('/imported?q=unfindable-isbn-xyz');
 await expect(page.getByText('No matching imports.',{exact:false})).toBeVisible();
 await expect(page.getByRole('navigation',{name:'Imported collection pages top'})).toHaveCount(0);
});

test('home displays the full imported collection and preserves root pagination',async({page})=>{
 await page.goto('/');
 await expect(page.getByRole('heading',{name:'The imported collection.'})).toBeVisible();
 await expect(page.getByRole('heading',{name:'1,010 matches'})).toBeVisible();
 await expect(page.getByLabel('Collection totals')).toContainText('1,010 imported book editions');
 await expect(page.getByLabel('Collection totals')).toContainText('30 reviewed books');
 await expect(page.getByLabel('Collection totals')).toContainText('1,272 HN source mentions');
 const nav=page.getByRole('navigation',{name:'Imported collection pages top'});
 await nav.getByRole('link',{name:'Page 2',exact:true}).click();
 await expect(page).toHaveURL(/\/\?q=&page=2$/);
 await expect(page.locator('article.recommendation')).toHaveCount(24);
 await page.getByRole('link',{name:'Reviewed books',exact:true}).click();
 await expect(page.locator('.book-card')).toHaveCount(30);
});
