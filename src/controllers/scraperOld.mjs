import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import readline from 'readline-sync';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function buildDriver() {
  const options = new chrome.Options();
  options.addArguments('--disable-blink-features=AutomationControlled');
  options.addArguments('--headless'); // Comment this line to see the browser window
  options.addArguments('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/89.0 Safari/537.36');
  return await new Builder().forBrowser('chrome').setChromeOptions(options).build();
}

function isValidLink(link) {
  return link &&
    link.startsWith('http') &&
    !/\.(jpg|jpeg|png|gif|svg|webp|bmp|ico|pdf|js|css|mp4|avi|mkv|mp3)$/i.test(link);
}

// ✅ Google Scraper
async function scrapeGoogle(query) {
  const driver = await buildDriver();
  const results = [];
  try {
    await driver.get(`https://www.google.com/search?q=${encodeURIComponent(query)}&num=20`);
    await sleep(3000);

    // Accept consent popup
    try {
      const agreeBtn = await driver.findElement(By.css('form[action*="consent"] button'));
      await agreeBtn.click();
      await sleep(1000);
    } catch (err) {
      console.log("No consent button found or already accepted.");
    }

    while (results.length < 50) {
      await driver.wait(until.elementsLocated(By.css('a')), 5000);

      const links = await driver.findElements(By.css('a'));
      for (let el of links) {
        const link = await el.getAttribute('href');
        const title = await el.getText();

        const isValid = link?.startsWith("http") &&
                        !results.find(r => r.link === link) &&
                        title?.trim();

        if (isValid) {
          results.push({ title: title.trim(), link });
        }

        if (results.length >= 50) break;
      }

      // Go to next page
      try {
        const nextBtn = await driver.findElement(By.id('pnnext'));
        await nextBtn.click();
        await sleep(3000);
      } catch {
        break;
      }
    }
  } catch (err) {
    console.error("Google scraping error:", err);
  } finally {
    await driver.quit();
  }
  return results;
}


// ✅ Bing Scraper
async function scrapeBing(query) {
  const driver = await buildDriver();
  const results = [];
  try {
    await driver.get(`https://www.bing.com/search?q=${encodeURIComponent(query)}`);
    await sleep(3000);

    while (results.length < 50) {
      await driver.wait(until.elementsLocated(By.css('li.b_algo h2 a')), 5000);
      const links = await driver.findElements(By.css('li.b_algo h2 a'));

      for (let el of links) {
        const link = await el.getAttribute('href');
        const title = await el.getText();
        if (isValidLink(link) && title && !results.find(r => r.link === link)) {
          results.push({ title, link });
        }
        if (results.length >= 50) break;
      }

      try {
        const nextBtn = await driver.findElement(By.css('a.sb_pagN'));
        await nextBtn.click();
        await sleep(3000);
      } catch {
        break;
      }
    }
  } catch (err) {
    console.error("Bing scraping error:", err);
  } finally {
    await driver.quit();
  }
  return results;
}

// ✅ Yahoo Scraper
async function scrapeYahoo(query) {
  const driver = await buildDriver();
  const results = [];
  try {
    await driver.get(`https://search.yahoo.com/search?p=${encodeURIComponent(query)}`);
    await sleep(3000);

    while (results.length < 50) {
      await driver.wait(until.elementsLocated(By.css('div.compTitle h3.title > a')), 5000);
      const links = await driver.findElements(By.css('div.compTitle h3.title > a'));

      for (let el of links) {
        const link = await el.getAttribute('href');
        const title = await el.getText();
        if (isValidLink(link) && title && !results.find(r => r.link === link)) {
          results.push({ title, link });
        }
        if (results.length >= 50) break;
      }

      try {
        const nextBtn = await driver.findElement(By.css('a.next'));
        await nextBtn.click();
        await sleep(3000);
      } catch {
        break;
      }
    }
  } catch (err) {
    console.error("Yahoo scraping error:", err);
  } finally {
    await driver.quit();
  }
  return results;
}

// ✅ DuckDuckGo Scraper
async function scrapeDuckDuckGo(query) {
  const driver = await buildDriver();
  const results = [];

  try {
    await driver.get(`https://duckduckgo.com/?q=${encodeURIComponent(query)}&ia=web`);
    await sleep(3000);

    let retries = 0;
    while (results.length < 50 && retries < 10) {
      const links = await driver.findElements(By.css('a[data-testid="result-title-a"]'));

      for (let el of links) {
        const link = await el.getAttribute('href');
        const title = await el.getText();
        if (isValidLink(link) && title && !results.find(r => r.link === link)) {
          results.push({ title, link });
        }
      }

      // Scroll to try to load more
      await driver.executeScript("window.scrollTo(0, document.body.scrollHeight);");
      await sleep(2000);
      retries++;
    }

  } catch (err) {
    console.error("DuckDuckGo scraping error:", err);
  } finally {
    await driver.quit();
  }

  return results;
}


// ✅ Run All Scrapers
export const scrapeEngine = async (query) => {
  const engines = {
    google: scrapeGoogle,
    bing: scrapeBing,
    yahoo: scrapeYahoo,
    duckduckgo: scrapeDuckDuckGo,
  };

  const toRet = [];

  for (const [name, scraperFunc] of Object.entries(engines)) {
    console.log(`\n🔎 Scraping ${name.toUpperCase()}...`);
    const links = await scraperFunc(query);
    console.log(`✅ ${name.toUpperCase()} (${links.length} links):`);
    links.forEach((l, i) => {
      console.log(`${i + 1}. ${l.title}\n   ${l.link}`);
    });
    toRet.push(links);
  }

  console.log("\n🎯 Scraping completed for all search engines!");
  return toRet;
};
