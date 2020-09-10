import { join as pathJoin } from 'path';
import { promises as fs } from 'fs';

import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { chromium, Browser, Page } from 'playwright';

import { proxy, AsyncProxy } from './setup/test-helpers';

async function getElementIntersectionStates(page: Page) {
  return page.$$eval('.box', (elements) => elements.map((el) => el.innerHTML));
}

let pageHtmlPromise = fs.readFile(pathJoin(__dirname, 'test.html'), 'utf8');

let browser: Browser;
let page: Page;
let BrowserHelpers: AsyncProxy<typeof import('./setup/browser-helpers')>;

test.before(async () => {
  browser = await chromium.launch();
});

test.after(async () => {
  await browser.close();
});

test.before.each(async () => {
  page = await browser.newPage();
  await page.setContent(await pageHtmlPromise);
  BrowserHelpers = await proxy(
    pathJoin(__dirname, 'setup/browser-helpers.ts'),
    page,
  );
});

test.after.each(async () => {
  await page.close();
});

[
  { func: 'io', direction: 'vertical' },
  { func: 'io', direction: 'horizontal' },
  { func: 'scroll', direction: 'vertical' },
  { func: 'scroll', direction: 'horizontal' },
  { func: 'peekaboo', direction: 'vertical' },
  { func: 'peekaboo', direction: 'horizontal' },
].forEach(({ func, direction }) => {
  test(`${func} - ${direction} calculates which elements are intersecting`, async () => {
    if (direction === 'horizontal') {
      await page.evaluate(() =>
        document.querySelector('main')!.classList.add('horizontal'),
      );
    }

    await BrowserHelpers.setup(func);
    await BrowserHelpers.waitForIdleCallback();

    assert.equal(await getElementIntersectionStates(page), [
      'visible',
      'visible',
      'visible',
      'hidden',
      'hidden',
      'hidden',
      'hidden',
      'hidden',
      'hidden',
      'hidden',
    ]);
  });

  test(`${func} - ${direction} recalculates which elements are intersecting on scroll`, async () => {
    if (direction === 'horizontal') {
      await page.evaluate(() =>
        document.querySelector('main')!.classList.add('horizontal'),
      );
    }

    await BrowserHelpers.setup(func);
    const viewportHeight: number = await page.evaluate('window.innerHeight');
    const viewportWidth: number = await page.evaluate('window.innerWidth');

    let scrollToCoords =
      direction === 'vertical'
        ? { y: viewportHeight * 2 }
        : { x: viewportWidth * 2 };
    await Promise.all([
      BrowserHelpers.waitForScrollStop(),
      BrowserHelpers.scrollWindow(scrollToCoords),
    ]);

    await BrowserHelpers.waitForIdleCallback();
    assert.equal(await getElementIntersectionStates(page), [
      'hidden',
      'visible',
      'visible',
      'visible',
      'hidden',
      'hidden',
      'hidden',
      'hidden',
      'hidden',
      'hidden',
    ]);

    await Promise.all([
      BrowserHelpers.waitForScrollStop(100),
      page.evaluate(() => document.getElementById('box-9')!.scrollIntoView()),
    ]);

    await BrowserHelpers.waitForIdleCallback();
    assert.equal(await getElementIntersectionStates(page), [
      'hidden',
      'hidden',
      'hidden',
      'hidden',
      'hidden',
      'hidden',
      'hidden',
      'visible',
      'visible',
      'visible',
    ]);
  });
});

test.run();
