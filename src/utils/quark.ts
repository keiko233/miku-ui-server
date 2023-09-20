import puppeteer from "puppeteer";
import * as fs from "fs";
import * as config from "../config.json";

const cookie = JSON.parse(
  fs.readFileSync(`${config.data_path}/${config.quark.cookie}`, "utf8")
);

export const uploadFile = (filePath: string, callback: Function) => {
  puppeteer
    .launch({
      // @ts-ignore
      headless: config.puppeteer.headless,
      devtools: config.puppeteer.devtools,
      args: config.puppeteer.args,
      executablePath: config.puppeteer.executablePath
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
            
          if (completed) return {
            progress: null,
            speed: null,
            completed
          };

          const progressElement: HTMLImageElement = document
            .querySelector(".task-row")
            .querySelector(".widget-progress-inner");
          const progress = parseFloat(progressElement.style.width);

          const speed = document
            .querySelector(".status")
            .querySelector(".speed-icon-wrap")
            .querySelector("span").textContent;

          return {
            progress,
            speed,
            completed
          };
        });

        callback(result);

        if (result.completed == true) {
          console.log("Upload completed.");
          clearInterval(interval);
        }
      }, 1000);
    });
};
