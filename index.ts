import process from 'process';
import puppeteer, { Page, Puppeteer } from 'puppeteer';
import nodemailer from 'nodemailer';

const mailopt = {
  user: process.env.MAIL_USER,
  pass: process.env.MAIL_PASS,
  from: process.env.MAIL_USER,
  to: process.env.MAIL_TO,
}

async function sendMail(message: string) {
  const transport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: mailopt.user,
      pass: mailopt.pass,
    },
  });

  try {
    await transport.sendMail({
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
      headless: false,
      userDataDir: '/tmp',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
    });
  }

  return puppeteer.launch({
    headless: true,
    userDataDir: '/tmp',
  });
}

async function waitPage(page: Page) {
  try {
    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36');
    await page.goto('https://store.nintendo.co.jp/search.html?sshow=1&category=console_accessory&sub_category=console&sort=release_new&from=shelf&page=1');
    let res = await page.waitFor('.o_c-item-card', {
      timeout: 7500,
    });
    return res;
  } catch(err) {
    console.error(err)
    return false;
  }
}

(async () => {
  const browser = await instanceBrowser();
  try {
    const page = await browser.newPage();
    for (let i = 0 ; i < 3 ; i++) {
      let res = await waitPage(page);
      if (res !== false) {
        break;
      }
    }
    const listHandle = await page.$$('.o_c-item-card');
    const list = await Promise.all(listHandle.map(async handle => {
      const txt = await handle.getProperty('textContext');
      return txt?.toString().trim();
    }));
    //const list = await page.evaluate((els) => els.map(el => el.textContent.trim()), listHandle);
    const notsold = list.filter(str => !str?.includes('品切れ'));

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