import { test as base, expect } from '../../src/fixtures/test';
import type { Locator, Page } from '@playwright/test';
import path from 'node:path';

/**
 * Fixtures for the "demo" recordings that become the GIFs in the README.
 * They run the same page objects as the real suite, slowed down, with a visible
 * cursor and a caption bar so a viewer can follow each step.
 */

const CURSOR_AND_CAPTION = `
  (() => {
    if (window.__demoInstalled) return;
    window.__demoInstalled = true;
    const install = () => {
      const style = document.createElement('style');
      style.textContent = \`
        #demo-cursor { position: fixed; z-index: 99999; width: 22px; height: 22px; margin: -11px 0 0 -11px;
          border-radius: 50%; background: rgba(200,117,78,.35); border: 2px solid #c8754e;
          pointer-events: none; transition: transform .12s ease; left: -40px; top: -40px; }
        #demo-cursor.down { transform: scale(.6); background: rgba(200,117,78,.7); }
        #demo-caption { position: fixed; z-index: 99998; left: 50%; bottom: 22px; transform: translateX(-50%);
          max-width: 90vw; padding: 10px 18px; border-radius: 999px; background: rgba(31,42,36,.92); color: #f6f3ee;
          font: 600 15px Inter, sans-serif; box-shadow: 0 6px 24px rgba(0,0,0,.18); pointer-events: none;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        #demo-caption:empty { display: none; }
      \`;
      document.head.appendChild(style);
      const cursor = document.createElement('div');
      cursor.id = 'demo-cursor';
      const caption = document.createElement('div');
      caption.id = 'demo-caption';
      caption.textContent = sessionStorage.getItem('demo.caption') || '';
      document.body.append(cursor, caption);
      const pos = JSON.parse(sessionStorage.getItem('demo.cursor') || 'null');
      if (pos) { cursor.style.left = pos.x + 'px'; cursor.style.top = pos.y + 'px'; }
      addEventListener('mousemove', (e) => {
        cursor.style.left = e.clientX + 'px'; cursor.style.top = e.clientY + 'px';
        sessionStorage.setItem('demo.cursor', JSON.stringify({ x: e.clientX, y: e.clientY }));
      }, true);
      addEventListener('mousedown', () => cursor.classList.add('down'), true);
      addEventListener('mouseup', () => cursor.classList.remove('down'), true);
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
    else install();
  })();
`;

export class Director {
  private mouse = { x: 640, y: 400 };

  constructor(private readonly page: Page) {}

  /** Shows a caption at the bottom of the screen. It survives page navigation. */
  async caption(text: string, holdMs = 700) {
    await this.page.evaluate((t) => {
      sessionStorage.setItem('demo.caption', t);
      const el = document.getElementById('demo-caption');
      if (el) el.textContent = t;
    }, text);
    await this.page.waitForTimeout(holdMs);
  }

  /** Glides the cursor to the element, then clicks it. */
  async click(locator: Locator) {
    await locator.scrollIntoViewIfNeeded();
    const box = await locator.boundingBox();
    if (!box) throw new Error('Element has no bounding box');
    const target = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    await this.page.mouse.move(target.x, target.y, { steps: 18 });
    this.mouse = target;
    await this.page.waitForTimeout(150);
    await locator.click();
    await this.page.waitForTimeout(250);
  }

  /** Clicks into a field and types like a person would. */
  async type(locator: Locator, text: string) {
    await this.click(locator);
    await locator.fill('');
    await locator.pressSequentially(text, { delay: 55 });
    await this.page.waitForTimeout(150);
  }

  async select(locator: Locator, value: string) {
    await this.click(locator);
    await locator.selectOption(value);
    await this.page.waitForTimeout(400);
  }

  async pause(ms = 900) {
    await this.page.waitForTimeout(ms);
  }
}

type DemoFixtures = { director: Director };

export const test = base.extend<DemoFixtures>({
  director: async ({ page }, use, testInfo) => {
    await page.addInitScript(CURSOR_AND_CAPTION);
    await use(new Director(page));

    // Save the recording under a stable name, for example docs/media/videos/checkout-flow.webm
    const video = page.video();
    await page.waitForTimeout(1200); // hold the last frame for a moment
    await page.context().close();
    if (video) {
      const name = testInfo.title.split(':')[0];
      await video.saveAs(path.join('docs', 'media', 'videos', `${name}.webm`));
    }
  },
});

export { expect };
