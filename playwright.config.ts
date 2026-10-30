import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';
const executablePath = process.env.CHROMIUM_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
export default defineConfig({
 testDir:'./tests/e2e', fullyParallel:false, workers:1,
 reporter:'list', outputDir:'work/test-results',
 use:{baseURL:'http://127.0.0.1:3000', launchOptions:{executablePath,args:['--no-sandbox']}, trace:'retain-on-failure'},
 projects:[{name:'desktop',use:{...devices['Desktop Chrome']}},{name:'mobile',use:{...devices['iPhone 13'],defaultBrowserType:'chromium'}}],
 webServer:{command:'npm run dev -- --port 3000',url:'http://127.0.0.1:3000',reuseExistingServer:!process.env.CI,timeout:60000}
});
