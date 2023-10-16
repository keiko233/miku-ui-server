import puppeteer from "puppeteer";
import * as fs from "fs";
import { config } from "./config";

const cookie = JSON.parse(
  fs.readFileSync(`${config.data_path}/${config.quark.cookie}`, "utf8")
);

export const uploadFile = async (
  filePaths: string[],
  folderName: string,
  callback: Function
) => {
  await puppeteer
    .launch({
      // @ts-ignore
      headless: config.puppeteer.headless,
      devtools: config.puppeteer.devtools,
      args: config.puppeteer.args,
      executablePath: config.puppeteer.executablePath,
      protocolTimeout: config.puppeteer.protocolTimeout,
    })
    .then(async (browser) => {
      const page = await browser.newPage();

      console.log("Set Page Cookie.");
      await page.setCookie(...cookie);

      console.log("Loading Page.");
      await page.goto("https://pan.quark.cn/list");

      console.log("Click Folder: " + config.quark.folder);
      const folder = await page.waitForSelector(
        `[title="${config.quark.folder}"]`
      );
      await folder.click();

      console.log("Create folder.");
      const createFolder = await page.waitForSelector(
        "button.btn-create-folder"
      );
      await createFolder.click();

      console.log("Set Floder Name to: " + folderName);
      await page.evaluate(async (folderName: string) => {
        const interval = setInterval(() => {
          const input: HTMLInputElement = document.querySelector(
            'input[value^="新建文件夹"]'
          );

          if (input) {
            input.value = folderName;

            input.dispatchEvent(
              new KeyboardEvent("keydown", {
                key: "Enter",
                code: "Enter",
                which: 13,
                keyCode: 13,
                bubbles: true,
              })
            );

            clearInterval(interval);
          }
        }, 100);
      }, folderName);

      console.log("Enter to new floder.");
      const newFolder = await page.waitForSelector(`[title="${folderName}"]`);
      await newFolder.click();

      const upload = await page.waitForSelector("button.upload-btn");

      console.log("Choose Files.");
      const [fileChooser] = await Promise.all([
        page.waitForFileChooser(),
        await upload.click(),
      ]);
      await fileChooser.accept(filePaths);

      console.log("Started upload.");

      const interval = setInterval(async () => {
        const result = await page.evaluate(async (filePaths: string[]) => {
          const completed =
            Number(document.querySelector(
              "div.static-bar > div.left-area > div:nth-child(2) > span.progress"
            ).textContent) == filePaths.length
              ? true
              : false;

          const tasks = [];

          const tasksElements = document.querySelectorAll(
            'div.task-list-container > div > div.task-row'
          );

          tasksElements.forEach((task) => {
            if (!task.querySelector('p.row-text')) {
              const content = task.querySelector('div.task-row-content');

              const fileName = content.querySelector(
                'span.name'
              ).textContent;
  
              const fileSize = content.querySelector(
                'span.size'
              ).textContent;
  
              const speedElement: HTMLImageElement = content.querySelector(
                "span.status > div > span"
              );
              const speed = speedElement == null ? null : speedElement.textContent;
  
              const progressElement: HTMLImageElement = document.querySelector(
                "div.widget-wide-progress.progress > div"
              );
              const progress = parseFloat(
                progressElement == null ? null : progressElement.style.width
              );

              tasks.push({
                fileName,
                fileSize,
                speed,
                progress,
              });
            };
          });

          return {
            tasks,
            completed,
          };
        }, filePaths);

        callback(result);

        if (result.completed == true) {
          console.log("Upload completed.");
          clearInterval(interval);
          await browser.close();
        }
      }, 1000);
    });
};
