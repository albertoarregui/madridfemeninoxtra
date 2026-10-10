#!/usr/bin/env node
/**
 * Reproducible website screenshots for the README.
 * Captures real pages only; never synthesizes screenshots or alters production.
 * Needs a locally available Chrome/Chromium for Puppeteer.
 * Optional MATCH_URL and PLAYER_URL enable individual profile screenshots.
 */
import puppeteer from 'puppeteer';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const base = (process.env.SITE_URL || 'https://www.madridfemeninoxtra.com').replace(/\/$/, '');
const directory = join(process.cwd(), 'docs/screenshots');
await mkdir(directory, { recursive: true });
const executablePath = process.env.CHROME_PATH || undefined;
const browser = await puppeteer.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const pages = [
  ['portada', '/'],
  ['estadisticas', '/estadisticas-real-madrid-femenino'],
  ['comparador', '/comparador'],
  ['la-fabrica', '/la-fabrica'],
  ['partido', process.env.MATCH_URL],
  ['jugadora', process.env.PLAYER_URL],
];
try {
  for (const [name, url] of [...pages, ['movil', '/']]) {
    if (!url) { console.log(`[SKIP] ${name}: provide URL in MATCH_URL or PLAYER_URL`); continue; }
    const mobile = name === 'movil';
    const page = await browser.newPage();
    await page.setViewport(mobile
      ? { width: 390, height: 844, deviceScaleFactor: 1 }
      : { width: 1440, height: 900, deviceScaleFactor: 1 });
    try {
      const target = new URL(url, base);
      if (target.origin !== new URL(base).origin) throw Error('Only site pages may be captured');
      const response = await page.goto(target.href, { waitUntil: 'domcontentloaded', timeout: 30000 });
      if (!response?.ok()) throw Error(`HTTP ${response?.status()}`);
      await page.evaluate(() => document.fonts.ready);
      await page.waitForNetworkIdle({ idleTime: 800, timeout: 10000 }).catch(() => {});
      const broken = await page.evaluate(() => [...document.images].filter(img => img.complete && !img.naturalWidth && img.getBoundingClientRect().width > 0).length);
      if (broken) { console.warn(`[SKIP] ${name}: ${broken} visible images did not load; not saving an incomplete screenshot`); continue; }
      // Hide a consent notice in documentation screenshots without saving or changing consent.
      await page.addStyleTag({ content: '#mfx-consent,#mfx-manage-consent{display:none!important}' });
      const file = join(directory, `${name}.webp`);
      await page.screenshot({ path: file, type: 'webp', quality: 86, fullPage: false });
      console.log(`[OK] ${file}`);
    } catch (error) {
      console.error(`[FAILED] ${name}: ${error.message}`);
    } finally {
      await page.close();
    }
  }
} finally {
  await browser.close();
}
