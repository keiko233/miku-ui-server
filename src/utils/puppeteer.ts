import puppeteer from 'puppeteer';
import db from './database';
import { config } from "./config";

const removeNbsp = (obj: Object): Object => {
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      obj[key] = obj[key].replace(/&nbsp;/g, '');
    } else if (Array.isArray(obj[key])) {
      obj[key] = obj[key].map(function(item) {
        if (typeof item === 'string') {
          return item.replace(/&nbsp;/g, '');
        }
        return item;
      });
    }
  }
  return obj;
};

const regexInfo = (text: any) => {
  return removeNbsp({
    device: text.match(/<div[^>]*>([^<]*)\s*\(([^)]+)\)/)[2].trim(),
    name: text.match(/<div[^>]*>([^<]*)\s*\(([^)]+)\)/)[1].trim(),
    version: text.match(/Miku UI ([A-Za-z]+\s+v\d+\.\d+\.\d+(?:_\d+)?)/)[1],
    android: text.match(/Android:\s*(\d+)\s*\([A-Za-z]\)/)[1],
    status: text.match(/Status: ([^<]*)/)[1].trim(),
    selinux: text.match(/SELinux:([^<]*)/)[1].trim(),
    kernelsu: text.match(/KernelSU:\s+(\d+)/)[1].trim(),
    data: text.match(/Updated: ([^<]*)/)[1].trim(),
    sourcforge_url: text.match(/<a href="(https:\/\/sourceforge\.net\/[^"]+)"/)[1],
    changelog: (text.match(/Changelog:(.*?)<br>\s*<br>/s) || [, ''])[1].trim().split('<br>').map(line => line.replace(/^- /, '').trim()).filter(line => line !== ''),
    note: (text.match(/Notes:(.*?)<br>\s*<br>/s) || [, ''])[1].trim().split('<br>').map(line => line.replace(/^-/, '').trim()).filter(line => line !== '')
  });
};

export const refreshDB = () => {
  puppeteer.launch({
    // @ts-ignore
    headless: config.puppeteer.headless,
    devtools: config.puppeteer.devtools,
    args: config.puppeteer.args,
    executablePath: config.puppeteer.executablePath,
    protocolTimeout: config.puppeteer.protocolTimeout
  }).then(async browser => {
    const page = await browser.newPage();
    await page.goto('https://t.me/s/mikuuirelease');
    const result = await page.evaluate(async () => {
      const content = document.getElementsByClassName('tgme_widget_message_text');
      console.log(content);
      return [...content].map(div => div.outerHTML);
    });

    const jsonData = [];

    for (let i = result.length; i > 0; i--) {
      if (result[i] && /\([A-Za-z]+\)/.test(result[i])) jsonData.push(regexInfo(result[i]));
    }

    jsonData.forEach((item) => {
      db.insertData(item);
    });

    await browser.close();
  });
};
