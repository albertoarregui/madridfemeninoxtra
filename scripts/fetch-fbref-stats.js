
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

puppeteer.use(StealthPlugin());

const TEAM_ID = '54582b93';
const TEAM_NAME = 'Real-Madrid-Women-Stats';
const BASE_URL = 'https://fbref.com';

const SEASONS = [
  { id: '2025-2026', label: '2025-2026', isCurrent: true },
  { id: '2024-2025', label: '2024-2025', isCurrent: false },
  { id: '2023-2024', label: '2023-2024', isCurrent: false },
  { id: '2022-2023', label: '2022-2023', isCurrent: false },
  { id: '2021-2022', label: '2021-2022', isCurrent: false },
];

const OUTPUT_FILE = path.join(__dirname, '../src/consts/fbref-data.json');

async function fetchStats() {
  console.log('🚀 Starting FBref scrape with Puppeteer (Stealth Mode)...');
  const allData = {};

  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  for (const season of SEASONS) {
    const urls = [
      {
        url: season.isCurrent
          ? `${BASE_URL}/en/squads/${TEAM_ID}/${TEAM_NAME}`
          : `${BASE_URL}/en/squads/${TEAM_ID}/${season.id}/${TEAM_NAME}`,
        type: 'Main'
      },
      {
        url: season.isCurrent
          ? `${BASE_URL}/en/squads/${TEAM_ID}/c181/${TEAM_NAME}-Champions-League`
          : `${BASE_URL}/en/squads/${TEAM_ID}/${season.id}/c181/${TEAM_NAME}-Champions-League`,
        type: 'UWCL'
      }
    ];

    for (const { url, type } of urls) {
      console.log(`\n📅 Processing Season: ${season.label} [${type}]`);
      console.log(`   🔗 URL: ${url}`);

      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

        await new Promise(r => setTimeout(r, 4000));

        await page.evaluate(() => {
          const comments = document.evaluate('//comment()', document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
          for (let i = 0; i < comments.snapshotLength; i++) {
            const comment = comments.snapshotItem(i);
            if (comment.textContent.includes('<table')) {
              const div = document.createElement('div');
              div.innerHTML = comment.textContent;
              comment.parentNode.replaceChild(div, comment);
            }
          }
        });

        await new Promise(r => setTimeout(r, 5000));

        const seasonData = await page.evaluate(() => {
          const data = {};
          const tables = document.querySelectorAll('table.stats_table');
          console.log(`Found ${tables.length} tables on page`);


          tables.forEach(table => {
            const tableId = table.id;
            if (!tableId) return;

            const rows = [];
            const headerRow = table.querySelector('thead tr:last-child');
            if (!headerRow) return;

            const headers = Array.from(headerRow.querySelectorAll('th')).map(th => th.dataset.stat || th.innerText.trim());

            const trs = table.querySelectorAll('tbody tr');
            trs.forEach(tr => {
              if (tr.classList.contains('thead')) return;

              const rowData = {};
              const cells = tr.querySelectorAll('th, td');

              cells.forEach((cell, index) => {
                const statName = headers[index];
                if (statName) {
                  let val = cell.innerText.trim();
                  if (!isNaN(Number(val)) && val !== '') {
                    rowData[statName] = Number(val);
                  } else {
                    rowData[statName] = val;
                  }
                }
              });

              const link = tr.querySelector('th a');
              if (link) {
                const href = link.getAttribute('href');
                if (href) {
                  const parts = href.split('/');
                  if (parts.length > 3) {
                    rowData.fbref_id = parts[3];
                  }
                }
              }

              if (Object.keys(rowData).length > 0) {
                rows.push(rowData);
              }
            });

            data[tableId] = rows;
          });

          return data;
        });

        console.log(`      ✅ Scraped ${Object.keys(seasonData).length} tables: ${Object.keys(seasonData).join(', ')}`);

        if (!allData[season.id]) allData[season.id] = {};
        Object.assign(allData[season.id], seasonData);

      } catch (error) {
        console.error(`   ❌ Error scraping ${url}:`, error.message);
      }

      await new Promise(r => setTimeout(r, 4000));
    }
  }

  await browser.close();

  if (Object.keys(allData).length > 0) {
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(allData, null, 2));
    console.log(`\n✅ Done! Saved data to ${OUTPUT_FILE}`);
  } else {
    console.error('\n❌ No data was scraped.');
  }
}

fetchStats();
