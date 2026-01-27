
import puppeteer from 'puppeteer';

const URL = 'https://fbref.com/en/squads/54582b93/Real-Madrid-Women-Stats';

(async () => {
    console.log(`Navigating to ${URL}...`);
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    try {
        await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
        const title = await page.title();
        console.log(`Page Title: ${title}`);

        const content = await page.content();
        console.log(`Content length: ${content.length}`);

        if (content.includes('403 Forbidden')) {
            console.log('Detected 403 Forbidden');
        }
        if (content.includes('Just a moment...')) {
            console.log('Detected Cloudflare challenge');
        }

        const tables = await page.$$('table.stats_table');
        console.log(`Tables found: ${tables.length}`);

    } catch (e) {
        console.error('Error:', e.message);
    }

    await browser.close();
})();
