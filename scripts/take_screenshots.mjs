import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const page = await browser.newPage();
  
  // Set viewport to a nice desktop resolution
  await page.setViewport({ width: 1280, height: 800 });
  
  // 1. Screenshot the Buy page
  await page.goto('http://localhost:3000/buy', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: join(__dirname, '../successful_buy.png') });
  console.log('Saved successful_buy.png');
  
  // 2. Screenshot the Covers page
  await page.goto('http://localhost:3000/covers', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: join(__dirname, '../successful_cancel.png') });
  console.log('Saved successful_cancel.png');
  
  await browser.close();
})();
