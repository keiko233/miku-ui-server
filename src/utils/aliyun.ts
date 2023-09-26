import puppeteer from "puppeteer";
import * as fs from "fs";
import { config } from "./config";

const token = JSON.parse(
  fs.readFileSync(`${config.data_path}/${config.aliyun.token}`, "utf8")
);

const cookie = JSON.parse(
  fs.readFileSync(`${config.data_path}/${config.aliyun.cookie}`, "utf8")
);

export const uploadFile = async (
  filePaths: string[],
  folderName: string,
  callback: Function
) => {
  await puppeteer
    .launch({
      // @ts-igno
      headless: config.puppeteer.headless,
      devtools: config.puppeteer.devtools,
      args: config.puppeteer.args,
      executablePath: config.puppeteer.executablePath,
      protocolTimeout: config.puppeteer.protocolTimeout,
    })
    .then(async (browser) => {
      const page = await browser.newPage();

      await page.evaluateOnNewDocument((token) => {
        localStorage.clear();
        localStorage.setItem("token", token);
      }, JSON.stringify(token));

      await page.setCookie(...cookie);

      await page.goto("https://www.aliyundrive.com/drive", {
        waitUntil: "load",
      });

      const folder = await page.waitForSelector(
        `[title="${config.quark.folder}"] > div > div:nth-child(3)`
      );
      await folder.click();

      const createButton = await page.waitForSelector(
        "div.adrive-create-button"
      );
      await createButton.click();

      const createFolder = await page.waitForSelector(
        "div.ant-dropdown > ul.ant-dropdown-menu > li:nth-child(1) > div > div"
      );
      await createFolder.click();

      await page.evaluate(async (folderName: string) => {
        // Special thanks to https://github.com/facebook/react/issues/10135#issuecomment-314441175
        function setNativeValue(element: HTMLElement, value: string) {
          const valueSetter = Object.getOwnPropertyDescriptor(
            element,
            "value"
          ).set;
          const prototype = Object.getPrototypeOf(element);
          const prototypeValueSetter = Object.getOwnPropertyDescriptor(
            prototype,
            "value"
          ).set;

          if (valueSetter && valueSetter !== prototypeValueSetter) {
            prototypeValueSetter.call(element, value);
          } else {
            valueSetter.call(element, value);
          }
        }

        const input: HTMLInputElement = document.querySelector(
          'input[value="新建文件夹"]'
        );
        setNativeValue(input, folderName);
        input.dispatchEvent(new Event("input", { bubbles: true }));

        const button: HTMLButtonElement = document.querySelector(
          "div.ant-modal-content > div.ant-modal-footer > div > button"
        );
        button.click();
      }, folderName);

      const newFolder = await page.waitForSelector(
        `[title="${folderName}"] > div > div:nth-child(3)`
      );
      await newFolder.click();

      await createButton.click();

      const uploadFile = await page.waitForSelector(
        "div.ant-dropdown > ul.ant-dropdown-menu > li:nth-child(3) > div > div"
      );

      const [fileChooser] = await Promise.all([
        page.waitForFileChooser(),
        await uploadFile.click(),
      ]);
      await fileChooser.accept(filePaths);

      const showStatus = await page.waitForSelector(
        '#adrive-container-upload-list > div > div > div[class^="status-bar"] > div[class^="status-bar-wrapper"]'
      );

      await showStatus.click();

      const interval = setInterval(async () => {
        const result = await page.evaluate(async () => {
          const completed =
            document.querySelector(
              '#adrive-container-upload-list > div > div > div[class^="status-bar"] > div[class^="status-bar-wrapper"] > span[class^="status-bar-title"'
            ).textContent == "上传完成"
              ? true
              : false;

          const tasks = [];

          const tasksElements = document.querySelectorAll(
            `#adrive-container-upload-list > div > div > div[class^="task-list"] > div > div[class^="task"]`
          );

          tasksElements.forEach((task) => {
            const info = task.querySelector('div[class^="task-info"]');

            const fileName = info.querySelector(
              'span[class^="task-file-name"]'
            ).textContent;

            const taskDesc = info.querySelector(
              'div[class^="task-desc-wrapper"]'
            );

            const sizeElement = taskDesc.querySelector("span:nth-child(1)");
            const sizeDesc =
              sizeElement == null ? null : sizeElement.textContent;

            const progressDescElement =
              taskDesc.querySelector("span:nth-child(3)");
            const desc =
              progressDescElement == null
                ? null
                : progressDescElement.textContent;

            const progressRateElement: HTMLElement = task.querySelector(
              'div[class^="task-progress"]'
            );
            const progress =
              progressRateElement == null
                ? null
                : progressRateElement.style.width;

            tasks.push({
              fileName,
              sizeDesc,
              desc,
              progress,
            });
          });

          return {
            tasks,
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
