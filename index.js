const puppeteer = require('puppeteer');
const process = require('process');
const nodemailer = require('nodemailer');

const mailopt = {
  user: process.env.MAIL_USER,
  pass: process.env.MAIL_PASS,
  from: process.env.MAIL_USER,
  to: process.env.MAIL_TO,
}

async function sendMail(message) {
  const transport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: mailopt.user,
      pass: mailopt.pass,
    },
  });

  try {
    const res = await transport.sendMail({
      from: mailopt.from,
      to: mailopt.to,
      subject: "Go Buy Switch!!!!!",
      text: message,
    });

    console.info("mail ok!");
  } catch {
    console.error("mail fail");
  }
}

async function instanceBrowser() {
  if (process.env.RUNAS === "WSL") {
    // for using this instance, please add Chromium binary path of Windows to runtime path
    return puppeteer.launch({
      executablePath: 'chrome.exe',
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
    });
  }

  return puppeteer.launch({
    executablePath: 'google-chrome-stable',
    headless: true,
  });
}

(async () => {
  const browser = await instanceBrowser();
  try {
    const page = await browser.newPage();
    await page.goto('https://store.nintendo.co.jp/search.html?sshow=1&category=console_accessory&sub_category=console&sort=release_new&from=shelf&page=1');
    await page.waitFor('.o_c-item-card', {
      timeout: 30000,
    });
    const list = await page.$$eval('.o_c-item-card', els => els.map(el => el.textContent.trim()));
    const notsold = list.filter(str => !str.includes('品切れ'));

    if (notsold.length > 0) {
      await sendMail(notsold.join("\n"));
    }
    console.info("program end");
  } catch (e) {
    console.error(e);
  } finally {
    await browser.close();
    process.exit();
  }
})();