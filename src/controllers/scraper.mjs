// test1.js
// Usage:
//   npm install puppeteer readline-sync selenium-webdriver chromedriver
//   node test1.js

import fs from 'fs';

import readline from 'readline-sync';
import puppeteer from 'puppeteer';
import 'chromedriver';
import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';

// —————————————————————————————————————————
// CONFIGURATION
// —————————————————————————————————————————
const MAX_PER_ENGINE = 25;    // for Bing, DuckDuckGo, Yahoo
const GOOGLE_PAGES   = 2;     // Google: 25 pages × 10 = 250
const BATCH_SIZE     = 10;     // Google results per page
const DELAY_MS       = 500;    // base delay between actions

const adsCount = {
  google: 0,
  bing: 0,
  yahoo: 0,
  ddg: 0
}

const filterAds = (items, adsCount, engineName) => {
    const filteredItems = items.filter(item => !item.sponsored);
    adsCount[engineName] = items.length - filteredItems.length;
    console.log(`${adsCount[engineName]} ads filtered for ${engineName} from ${items.length} results`);
    return filteredItems;
};



// Optional proxies.txt (one per line)
const proxies = fs.existsSync('proxies.txt')
  ? fs.readFileSync('proxies.txt','utf8')
      .trim()
      .split(/\r?\n/)
      .filter(Boolean)
  : [];

// Rotate user-agents
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/115.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/15.1 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/114.0.0.0 Safari/537.36'
];

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// —————————————————————————————————————————
// Build Selenium driver (Google & Yahoo)
// —————————————————————————————————————————
async function buildDriver() {
  const ua = randomChoice(userAgents);
  const opts = new chrome.Options()
    .addArguments('--headless=new')
    .addArguments('--disable-blink-features=AutomationControlled')
    .addArguments(`--user-agent=${ua}`);

  if (proxies.length) {
    const proxy = randomChoice(proxies);
    opts.addArguments(`--proxy-server=${proxy}`);
    console.log('Selenium proxy:', proxy);
  }

  return new Builder()
    .forBrowser('chrome')
    .setChromeOptions(opts)
    .build();
}

// —————————————————————————————————————————
// Build Puppeteer browser & page (Bing & DuckDuckGo)
// —————————————————————————————————————————
async function buildPuppeteer() {
  const ua   = randomChoice(userAgents);
  const args = proxies.length ? [`--proxy-server=${randomChoice(proxies)}`] : [];
  if (args.length) console.log('Puppeteer proxy:', args[0]);

  const browser = await puppeteer.launch({ headless: true, args });
  const page    = await browser.newPage();
  await page.setUserAgent(ua);
  return { browser, page };
}

// —————————————————————————————————————————
// 1) scrapeGoogle → SELENIUM
//    • Container: div.tF2Cxc (fallback div.g)
//    • Link+title: div.yuRUbf > a   (or a:has(h3))
//    • Description: .IsZvec .VwiC3b  (or span.aCOpRe)
//    • Sponsored badge: span.uEierd (text "Ad")
// —————————————————————————————————————————
async function scrapeGoogle(driver, query) {
  const results = [];

  for (let page = 0; page < GOOGLE_PAGES; page++) {
    const start = page * BATCH_SIZE;
    const url = `https://www.google.com/search` +
                `?q=${encodeURIComponent(query)}` +
                `&num=${BATCH_SIZE}&start=${start}` +
                `&hl=en&gl=us`;

    console.log(`\n→ Google page ${page+1}/${GOOGLE_PAGES}`);
    await driver.get(url);
    await delay(DELAY_MS);

    // Dismiss consent popup if present
    try {
      const btn = await driver.findElement(By.xpath(
        "//button[contains(text(),'I agree') or contains(text(),'Accept all')]"
      ));
      await btn.click();
      await delay(500);
    } catch {}

    // Wait for results containers
    await driver.wait(until.elementsLocated(By.css('div.tF2Cxc, div.g')), 5000)
      .catch(() => {});

    // Prefer new layout
    let boxes = await driver.findElements(By.css('div.tF2Cxc'));
    if (!boxes.length) {
      boxes = await driver.findElements(By.css('div.g'));
    }

    for (const box of boxes) {
      try {
        // link + title
        const linkEl  = await box.findElement(By.css('div.yuRUbf > a, a:has(h3)'));
        const titleEl = await linkEl.findElement(By.css('h3'));
        const title   = await titleEl.getText();
        const href    = await linkEl.getAttribute('href');

        // description
        const descEl = await box.findElement(
          By.css('.IsZvec .VwiC3b, span.aCOpRe')
        ).catch(() => null);
        const description = descEl ? await descEl.getText() : '';

        // sponsored?
        const adEl = await box.findElement(By.css('.U3A9Ac.qV8iec'))
                          .catch(() => null);
        const sponsored = adEl ? 'Sponsored' : 'Organic';

        results.push({ title, url: href, description, sponsored });
      } catch {
        // skip incomplete
      }
    }

    console.log(`  Collected so far: ${results.length}`);
    await delay(DELAY_MS + Math.random()*300);
  }

  return results.slice(0, GOOGLE_PAGES * BATCH_SIZE);
}

// —————————————————————————————————————————
// 2) scrapeBing → PUPPETEER
//    • Container: li.b_algo
//    • Description: .b_caption p
//    • Sponsored badge: span.b_adSlug.b_opttxt.b_divdef
// —————————————————————————————————————————
const BING_PAGES = 2;
const BING_BATCH = 10;

async function scrapeBing(page, query) {
  let results = [];

  for (let i = 0; i < BING_PAGES; i++) {
    const first = i * BING_BATCH + 1;
    const url   = `https://www.bing.com/search` +
                  `?q=${encodeURIComponent(query)}` +
                  `&first=${first}&count=${BING_BATCH}`;

    console.log(`\n→ Bing page ${i+1}/${BING_PAGES}`);
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    } catch (e) {
      console.warn(`⚠️ Bing page ${i+1} load failed: ${e.message}`);
      continue;
    }
    await delay(1000);

    const pageResults = await page.$$eval('li.b_algo', nodes =>
      nodes.map(node => {
        const linkNode = node.querySelector('h2 a');
        const title     = linkNode ? linkNode.innerText : '';
        const url       = linkNode ? linkNode.href      : '';
        const descNode  = node.querySelector('.b_caption p');
        const description = descNode ? descNode.innerText : '';
        const adBadge   = node.querySelector('span.b_adSlug.b_opttxt.b_divdef');
        const sponsored = adBadge ? true : false;
        return { title, url, description, sponsored };
      })
    );

    if (!pageResults.length) {
      console.log('  ⚠️ No more Bing results, stopping.');
      break;
    }

    results.push(...pageResults);
    console.log(`  Got ${pageResults.length}, total ${results.length}`);
    await delay(DELAY_MS + Math.random()*300);
  }
  results = filterAds(results, adsCount, 'bing');
  return results.slice(0, MAX_PER_ENGINE);
}

function extractOriginalUrl(redirectUrl) {
    try {
        const url = new URL(redirectUrl);
        const originalUrl = url.searchParams.get("uddg");
        return originalUrl ? decodeURIComponent(originalUrl) : redirectUrl;
    } catch (error) {
        console.error("Invalid URL:", error);
        return null;
    }
}

// —————————————————————————————————————————
// 3) scrapeDuckDuckGo → PUPPETEER
//    • Container: .result
//    • Description: .result__snippet
//    • Sponsored badge: .badge--ad.js-badge--ad
// —————————————————————————————————————————
async function scrapeDuckDuckGo(page, query) {
  let results = [];

  for (let s = 0; results.length < MAX_PER_ENGINE; s += 20) {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}&s=${s}`;
    console.log(`\n→ DuckDuckGo s=${s}`);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await delay(500);

    const pageResults = await page.$$eval('.result', nodes =>
      nodes.map(node => {
        const linkNode = node.querySelector('a.result__a');
        const title     = linkNode ? linkNode.innerText : '';
        const url       = linkNode ? linkNode.href      : '';
        const descNode  = node.querySelector('.result__snippet');
        const description = descNode ? descNode.innerText : '';
        const adBadge   = node.querySelector('.badge--ad, .js-badge--ad');
        const sponsored = adBadge ? true : false;
        return { title, url, description, sponsored };
      })
    );

    if (!pageResults.length) {
      console.log('  ⚠️ No more DDG results, stopping.');
      break;
    }

    results.push(...pageResults);
    console.log(`  Got ${pageResults.length}, total ${results.length}`);
    await delay(DELAY_MS + Math.random()*300);
  }
  results = filterAds(results, adsCount, 'ddg');
  results.forEach(ele => {ele.url = extractOriginalUrl(ele.url)});
  return results.slice(0, MAX_PER_ENGINE);
}

// —————————————————————————————————————————
// 4) scrapeYahoo → SELENIUM
//    • Container: div#web ol li
//    • Description: .compText p
//    • Sponsored if class includes
//      “searchCenterTopAds” or “searchCenterBottomAds”
// —————————————————————————————————————————
async function scrapeYahoo(driver, query) {
  const results = [];

  for (let b = 1; results.length < MAX_PER_ENGINE; b += 20) {
    const url = `https://search.yahoo.com/search?p=${encodeURIComponent(query)}&b=${b}`;
    console.log(`\n→ Yahoo b=${b}`);
    await driver.get(url);
    await delay(500);

    const boxes = await driver.findElements(By.css('div#web ol li'));
    if (!boxes.length) {
      console.log('  ⚠️ No more Yahoo results, stopping.');
      break;
    }

    for (const box of boxes) {
      try {
        const linkEl      = await box.findElement(By.css('h3.title a'));
        const title       = await linkEl.getText();
        const href        = await linkEl.getAttribute('href');
        const descEl      = await box.findElement(By.css('.compText p'))
                                    .catch(() => null);
        const description = descEl ? await descEl.getText() : '';
        const classAttr   = await box.getAttribute('class');
     const sponsored = /\bsearchCenterTopAds\b/.test(classAttr)
                    || /\bsearchCenterBottomAds\b/.test(classAttr)
                    ? 'Sponsored'
                    : 'Organic';

        results.push({ title, url: href, description, sponsored });
      } catch {
        /* skip */
      }
    }

    console.log(`  Collected so far: ${results.length}`);
    await delay(DELAY_MS + Math.random()*300);
  }

  return results.slice(0, MAX_PER_ENGINE);
}

// —————————————————————————————————————————
// MAIN
// —————————————————————————————————————————
export const scrapeEngine = async (query) => {
  //const query = readline.question('🔍 Enter your search query: ').trim();
  if (!query) {
    console.log('No query entered.');
    return;
  }

  // Launch
  const { browser, page } = await buildPuppeteer();
  const driver            = await buildDriver();

  console.log('\n🔍 Scraping Google…');
  const google = await scrapeGoogle(driver, query);

  console.log('\n🔍 Scraping Bing…');
  const bing   = await scrapeBing(page, query);

  console.log('\n🔍 Scraping DuckDuckGo…');
  const ddg    = await scrapeDuckDuckGo(page, query);

  console.log('\n🔍 Scraping Yahoo…');
  const yahoo  = await scrapeYahoo(driver, query);

  // Teardown
  await driver.quit();
  await browser.close();

  // Save
  fs.writeFileSync(
    'results.json',
    JSON.stringify({ ddg, bing, yahoo, google }, null, 2)
  );
  console.log('\n🎉 Done! Results written to results.json');
  return [...ddg, ...bing, ...yahoo, ...google];
};
