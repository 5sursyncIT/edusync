// Script de diagnostic pour identifier les erreurs JavaScript
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Capturer les erreurs console
  page.on('console', msg => {
    console.log('CONSOLE:', msg.type().toUpperCase(), msg.text());
  });
  
  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
  });
  
  page.on('response', response => {
    if (!response.ok()) {
      console.log('HTTP ERROR:', response.status(), response.url());
    }
  });
  
  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 10000 });
    
    // Attendre que React soit monté
    await page.waitForSelector('#root', { timeout: 5000 });
    
    const content = await page.$eval('#root', el => el.innerHTML);
    console.log('ROOT CONTENT:', content);
    
  } catch (error) {
    console.log('NAVIGATION ERROR:', error.message);
  } finally {
    await browser.close();
  }
})(); 