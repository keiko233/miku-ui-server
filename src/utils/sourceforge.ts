import puppeteer from 'puppeteer';
import { config } from "./config";

export const getSourceforgeFilesUrls = async (filesUrl: string) => {
  const browser = await puppeteer.launch({
    // @ts-ignore
    headless: config.puppeteer.headless,
    devtools: config.puppeteer.devtools,
    args: config.puppeteer.args,
    executablePath: config.puppeteer.executablePath,
    protocolTimeout: config.puppeteer.protocolTimeout
  });
  
  const page = await browser.newPage();
  await page.goto(filesUrl);

  const result = await page.evaluate(async () => {
    // @ts-ignore
    const content = [...document.querySelectorAll('tr.file > th[headers="files_name_h"] > a')].map(a => a.href)
    return content.map(url => url.replace('/download', ''));
  });

  await browser.close();

  return result;
};
