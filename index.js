const puppeteer = require('puppeteer');
const process = require('process');

async function instanceBrowser() {
  if (process.env.RUNAS === "WSL") {
    // for using this instance, please add Chromium binary path of Windows to runtime path
    return puppeteer.launch({
      executablePath: 'chrome.exe',
      headless: false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
    });
  }

  return puppeteer.launch({
    headless: true,
  });
}

(async () => {
  const browser = await instanceBrowser();
  const page = await browser.newPage();
  await page.goto('https://store.nintendo.co.jp/search.html?sshow=1&category=console_accessory&sub_category=console&sort=release_new&from=shelf&page=1');
  await page.waitFor('.o_c-item-card');
  const list = await page.$$eval('.o_c-item-card', els => els.map(el => el.textContent.trim()));
  const soldoutList = list.map(str => str.includes('品切れ'));

  await browser.close();
})();