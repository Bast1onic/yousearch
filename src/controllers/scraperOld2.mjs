// test1.js
// Usage:
//   npm install puppeteer readline-sync selenium-webdriver chromedriver
//   node test1.js

import fs from 'fs';

import puppeteer from 'puppeteer';
import readline from 'readline-sync';

// Selenium imports
import 'chromedriver';

import { Builder, By, until } from 'selenium-webdriver';
import { Options as chromeOptions } from 'selenium-webdriver/chrome.js';

// General constants
const MAX_PER_ENGINE = 10; // 250 for non-Google engines
const GOOGLE_PAGES   = 2;  // number of Google pages to fetch, 25
const BATCH_SIZE     = 10;  // links per Google page, 10
const DELAY_MS       = 500; // ms delay between operations

// Delay helper for Puppeteer
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Optional proxies (one per line in proxies.txt)
const proxies = fs.existsSync('proxies.txt')
  ? fs.readFileSync('proxies.txt', 'utf8').split(/\r?\n/).filter(Boolean)
  : [];

// Rotate user-agents
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/115.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/15.1 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/114.0.0.0 Safari/537.36'
];
function randomChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// Build Selenium driver
async function buildDriver() {
  const ua = randomChoice(userAgents);
  const options = new chromeOptions()
    .addArguments('--headless=new')
    .addArguments('--disable-blink-features=AutomationControlled')
    .addArguments('--disable-infobars')
    .addArguments(`--user-agent=${ua}`);
  if (proxies.length) {
    const proxy = randomChoice(proxies);
    console.log('Selenium proxy:', proxy);
    options.addArguments(`--proxy-server=${proxy}`);
  }
  return new Builder().forBrowser('chrome').setChromeOptions(options).build();
}

// Build Puppeteer browser & page
async function buildPuppeteer() {
  const ua = randomChoice(userAgents);
  const args = [];
  if (proxies.length) {
    const proxy = randomChoice(proxies);
    console.log('Puppeteer proxy:', proxy);
    args.push(`--proxy-server=${proxy}`);
  }
  const browser = await puppeteer.launch({ headless: true, args });
  const page = await browser.newPage();
  await page.setUserAgent(ua);
  return { browser, page };
}

// —————————————————————————————————————————
// 1) scrapeGoogle ‣ SELENIUM (50 pages × 50 links = 2500)
// —————————————————————————————————————————
async function scrapeGoogle(driver, query) {
  const links = new Set();
  // Loop through Google pages without quitting driver
  for (let pageIndex = 0; pageIndex < GOOGLE_PAGES; pageIndex++) {
    const start = pageIndex * BATCH_SIZE;
    console.log(`→ Google page ${pageIndex + 1}/${GOOGLE_PAGES}, start=${start}`);
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}` +
                `&num=${BATCH_SIZE}&start=${start}&hl=en&gl=us`;

    await driver.get(url);
    // Accept any consent popup
    try {
      const btn = await driver.findElement(
        By.xpath("//button[contains(text(),'I agree') or contains(text(),'Accept all')]")
      );
      await btn.click();
      await driver.sleep(1000);
    } catch {}

    // Scroll to load results
    await driver.executeScript('window.scrollBy(0, window.innerHeight);');
    await driver.wait(until.elementsLocated(By.css('h3')), 8000).catch(() => {});

    // Collect result links
    let elems = await driver.findElements(By.xpath("//a[.//h3]"));
    if (!elems.length) {
      const titles = await driver.findElements(By.css('h3'));
      elems = [];
      for (const t of titles) {
        try { elems.push(await t.findElement(By.xpath('./ancestor::a'))); } catch {}
      }
    }

    const before = links.size;
    for (const el of elems) {
      const href = await el.getAttribute('href').catch(() => null);
      if (href) links.add(href);
    }
    console.log(`  got ${links.size - before} new, total ${links.size}`);
    if (!elems.length) break;
    await driver.sleep(DELAY_MS + Math.random() * 200);
  }
  return [...links].slice(0, GOOGLE_PAGES * BATCH_SIZE);
}

// —————————————————————————————————————————
// 2) scrapeBing ‣ PUPPETEER (unchanged)
// —————————————————————————————————————————
async function scrapeBing(page, query) {
  const links = new Set();
  for (let first = 1; links.size < MAX_PER_ENGINE; first += 50) {
    const count = Math.min(50, MAX_PER_ENGINE - links.size);
    console.log(`→ Bing: first=${first}, count=${count}`);
    const url = `https://www.bing.com/search?q=${encodeURIComponent(query)}` +
                `&first=${first}&count=${count}`;
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
    } catch (error) {
      if (error.message.includes("PHONE_REGISTRATION_ERROR")) {
          console.log("Error detected: PHONE_REGISTRATION_ERROR. Exiting gracefully.");
          break;
      }
    }
    
    const newLinks = await page.$$eval('#b_results li.b_algo h2 a', els => els.map(a => a.href));
    const before = links.size;
    newLinks.forEach(h => h && links.add(h));
    console.log(`  got ${links.size - before} new, total ${links.size}`);
    if (!newLinks.length) break;
    await delay(DELAY_MS + Math.random() * 300);
  }
  return [...links];
}

// —————————————————————————————————————————
// 3) scrapeDuckDuckGo ‣ PUPPETEER (unchanged)
// —————————————————————————————————————————
async function scrapeDuckDuckGo(page, query) {
  const links = new Set();
  for (let s = 0; links.size < MAX_PER_ENGINE; s += 20) {
    const count = Math.min(20, MAX_PER_ENGINE - links.size);
    console.log(`→ DuckDuckGo: s=${s}, count=${count}`);
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}&s=${s}`;
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    const newLinks = await page.$$eval('a.result__a', els => els.map(a => a.href));
    const before = links.size;
    newLinks.forEach(h => h && links.add(h));
    console.log(`  got ${links.size - before} new, total ${links.size}`);
    if (!newLinks.length) break;
    await delay(DELAY_MS + Math.random() * 300);
  }
  return [...links];
}

// —————————————————————————————————————————
// 4) scrapeYahoo ‣ SELENIUM (unchanged)
// —————————————————————————————————————————
async function scrapeYahoo(driver, query) {
  const links = new Set();
  for (let b = 1; links.size < MAX_PER_ENGINE; b += 20) {
    console.log(`→ Yahoo: b=${b}`);
    const url = `https://search.yahoo.com/search?p=${encodeURIComponent(query)}&b=${b}`;
    await driver.get(url);
    await driver.wait(until.elementsLocated(By.css('div#web ol li div.algo h3.title a')), 5000).catch(() => {});
    const elems = await driver.findElements(By.css('div#web ol li div.algo h3.title a'));
    if (!elems.length) break;
    const before = links.size;
    for (const el of elems) {
      const href = await el.getAttribute('href').catch(() => null);
      if (href) links.add(href);
    }
    console.log(`  got ${links.size - before} new, total ${links.size}`);
    await driver.sleep(DELAY_MS + Math.random() * 300);
  }
  return [...links];
}

// Main
export const scrapeEngine = async (query) => {
  //const query = readline.question('🔍 Enter your search query: ').trim();
  if (!query) return;

  const { browser, page } = await buildPuppeteer();
  const driver = await buildDriver();

  console.log('\n🔍 Scraping Google…');
  const g = await scrapeGoogle(driver, query);
  console.log(`✅ Google: ${g.length}`);

  console.log('\n🔍 Scraping Yahoo…');
  const y = await scrapeYahoo(driver, query);
  console.log(`✅ Yahoo: ${y.length}`);

  console.log('\n🔍 Scraping Bing…');
  const b = await scrapeBing(page, query);
  console.log(`✅ Bing: ${b.length}`);

  console.log('\n🔍 Scraping DuckDuckGo…');
  const d = await scrapeDuckDuckGo(page, query);
  console.log(`✅ DDG: ${d.length}`);

  fs.writeFileSync('results.json', JSON.stringify({ google: g, yahoo: y, bing: b, ddg: d }, null, 2));
  console.log('\n🎉 Done! Results saved to results.json');

  await driver.quit();
  await browser.close();
  return [...g, ...y, ...b, ...d];
};
