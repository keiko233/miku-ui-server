import puppeteer from "puppeteer";
import * as fs from "fs";
import { config } from "./config";

const cookie = JSON.parse(
  fs.readFileSync(`${config.data_path}/${config.quark.cookie}`, "utf8")
);

export const uploadFile = async (filePath: string, callback: Function) => {
  await puppeteer
    .launch({
      // @ts-ignore
      headless: config.puppeteer.headless,
      devtools: config.puppeteer.devtools,
      args: config.puppeteer.args,
      executablePath: config.puppeteer.executablePath,
      protocolTimeout: config.puppeteer.protocolTimeout
    })
    .then(async (browser) => {
      const page = await browser.newPage();

      await page.setCookie(...cookie);
      await page.goto("https://pan.quark.cn/list");

      const folder = await page.waitForSelector(
        `[title="${config.quark.folder}"]`
      );
      await folder.click();

      const upload = await page.waitForSelector('input[type="file"]');
      await upload.uploadFile(filePath);

      console.log("Started upload.");

      const interval = setInterval(async () => {
        const result = await page.evaluate(async () => {
          const completed =
            document.querySelector(
              "div.static-bar > div.left-area > div:nth-child(2) > span.progress"
            ).textContent != "0"
              ? true
              : false;

          const progressElement: HTMLImageElement = document.querySelector(
            "div.widget-wide-progress.progress > div"
          );

          const progress = parseFloat(
            progressElement == null ? null : progressElement.style.width
          );

          const speedElement: HTMLImageElement = document.querySelector(
            "div.task-row-content > span.status > div > span"
          );

          const speed = speedElement == null ? null : speedElement.textContent;

          return {
            progress,
            speed,
            completed,
          };
        });

        callback(result);

        if (result.completed == true) {
          console.log("Upload completed.");
          clearInterval(interval);
          await browser.close();
        }
      }, 1000);
    });
};
