import { execSync } from 'child_process';

/**
 * Puppeteer v25 is ESM-only. This project compiles to CommonJS, where
 * TypeScript would turn `import puppeteer from 'puppeteer'` (and even a plain
 * `import('puppeteer')`) into `require()`, which throws ERR_REQUIRE_ESM on
 * Node < 22.12 (Railway runs Node 20). The `Function` wrapper keeps a genuine
 * dynamic `import()` in the emitted JS so the ES module loads correctly.
 */
const dynamicImport = new Function('m', 'return import(m)') as (
  m: string,
) => Promise<any>;

/**
 * Resolve the Chromium executable.
 * - Local dev: returns undefined so Puppeteer uses the browser it downloaded on install.
 * - Railway (PUPPETEER_SKIP_DOWNLOAD=true): no browser was downloaded, so locate the
 *   nix-provided `chromium` on PATH instead.
 */
let cachedExecPath: string | null | undefined;

function resolveChromePath(): string | undefined {
  if (cachedExecPath !== undefined) {
    return cachedExecPath ?? undefined;
  }
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    cachedExecPath = process.env.PUPPETEER_EXECUTABLE_PATH;
    return cachedExecPath;
  }
  const downloadSkipped =
    process.env.PUPPETEER_SKIP_DOWNLOAD === 'true' ||
    process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD === 'true';
  if (downloadSkipped) {
    for (const bin of ['chromium', 'chromium-browser', 'google-chrome-stable']) {
      try {
        const found = execSync(`command -v ${bin}`, {
          stdio: ['ignore', 'pipe', 'ignore'],
        })
          .toString()
          .trim();
        if (found) {
          cachedExecPath = found;
          return found;
        }
      } catch {
        // not on PATH — try the next candidate
      }
    }
  }
  cachedExecPath = null; // resolved: fall back to Puppeteer's bundled browser
  return undefined;
}

export async function htmlToPdfBuffer(html: string): Promise<Buffer> {
  const puppeteerModule = await dynamicImport('puppeteer');
  const puppeteer = puppeteerModule.default ?? puppeteerModule;

  const executablePath = resolveChromePath();
  const browser = await puppeteer.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--no-zygote',
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
