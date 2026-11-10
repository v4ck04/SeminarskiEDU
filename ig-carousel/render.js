// Renders each <section> of carousel.html to slides/NN.jpg (1080x1350) and a contact sheet.
// usage: node render.js
const path = require("path");
const fs = require("fs");
const { chromium } = require("playwright");

(async () => {
  const out = path.join(__dirname, "slides");
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
  await page.goto("file://" + path.join(__dirname, "carousel.html"));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  const slides = await page.$$("section.s");
  for (let i = 0; i < slides.length; i++) {
    const file = path.join(out, String(i + 1).padStart(2, "0") + ".jpg");
    await slides[i].screenshot({ path: file, type: "jpeg", quality: 92 });
    console.log(file);
  }
  await browser.close();
})();
