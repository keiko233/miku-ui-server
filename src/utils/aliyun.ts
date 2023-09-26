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

      console.log("Set Page LocalStorage.");
      await page.evaluateOnNewDocument((token) => {
        localStorage.clear();
        localStorage.setItem("token", token);
      }, JSON.stringify(token));

      console.log("Set Page Cookie.");
      await page.setCookie(...cookie);

      console.log("Loading Page.");
      await page.goto("https://www.aliyundrive.com/drive", {
        waitUntil: "load",
      });

      if (config.aliyun.drive_type == "resource") {
        console.log("Drive type is resource.");
        const resource = await page.waitForSelector(
          "#adrive-nav-sub-tab-container > ul > li:nth-child(2)"
        );

        await resource.click();
      } else {
        console.log("Drive type is default.");
      }

      console.log("Click Folder: " + config.aliyun.folder);
      const folder = await page.waitForSelector(
        `[title="${config.aliyun.folder}"] > div > div:nth-child(3)`
      );
      await folder.click();

      const createButton = await page.waitForSelector(
        "div.adrive-create-button"
      );

      try {
        console.log("Check if the folder exists.");
        await page.waitForSelector(
          `[title="${folderName}"] > div > div:nth-child(3)`
        );
      } catch {
        console.log("The folder does not exist and will be created.");

        await createButton.click();

        console.log("Click dropdown menu createFolder.");
        const createFolder = await page.waitForSelector(
          "div.ant-dropdown > ul.ant-dropdown-menu > li:nth-child(1) > div > div"
        );
        await createFolder.click();

        console.log("Set Floder Name to: " + folderName);
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
      }

      console.log("Enter to new floder.");
      const newFolder = await page.waitForSelector(
        `[title="${folderName}"] > div > div:nth-child(3)`
      );
      await newFolder.click();

      await createButton.click();

      console.log("Click dropdown menu uploadFile.");
      const uploadFile = await page.waitForSelector(
        "div.ant-dropdown > ul.ant-dropdown-menu > li:nth-child(3) > div > div"
      );

      console.log("Choose Files.");
      const [fileChooser] = await Promise.all([
        page.waitForFileChooser(),
        await uploadFile.click(),
      ]);
      await fileChooser.accept(filePaths);

      console.log("Click showStatus.");
      const showStatus = await page.waitForSelector(
        '#adrive-container-upload-list > div > div > div[class^="status-bar"] > div[class^="status-bar-wrapper"]'
      );
      await showStatus.click();

      console.log("Start progress interval.");
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
