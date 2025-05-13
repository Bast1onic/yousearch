import puppeteer from 'puppeteer';

const countKeywords = async (page, url, keywords) => {
    try {
        await page.goto(url, { waitUntil: 'networkidle2' });

        // Handle JavaScript dialogs
        page.on('dialog', async (dialog) => {
            console.log(`Auto-accepting dialog: ${dialog.message()}`);
            await dialog.accept();
        });

        // Try to click buttons with "I agree" or "Accept"
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"]'));
            const targetTexts = ['I agree', 'Accept', 'Close'];

            buttons.forEach(button => {
                const text = button.innerText.trim() || button.value.trim();
                if (targetTexts.some(target => text.includes(target))) {
                    console.log(`Clicking button: ${text}`);
                    button.click();
                }
            });
        });

        // Extract all visible text from the page
        const pageText = await page.evaluate(() => document.body.innerText.toLowerCase());

        // Count total occurrences of all keywords
        return keywords.reduce((total, keyword) => {
            const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'g');
            return total + (pageText.match(regex) || []).length;
        }, 0);
    } catch (error) {
        console.error(`Error occurred while processing the page: ${error.message}`);
        return 0; // Return a default value in case of an error
    }
};

export const rankUrls = async (urlObjects, keywords) => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    console.log("Ranking URLs...");

    let ct = 1;
    for (const urlObj of urlObjects) {
        console.log(`Ranking ${ct}/${urlObjects.length}...`)
        ct = ct + 1;
        urlObj.termCount = await countKeywords(page, urlObj.url, keywords);
    }

    await browser.close();
    return urlObjects;
};
