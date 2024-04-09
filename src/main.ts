import Koa from "koa";
import Router from "koa-router";
import { prisma } from "utils/prisma";
import packageJson from "../package.json";
import cron from "node-cron";
import { updateDevices } from "./puppeteer";

const PORT = 3000;

const app = new Koa();
const router = new Router();

router.get("/devices", async (ctx) => {
  try {
    ctx.body = await prisma.devices.findMany();
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: "Internal Server Error" };
  }
});

router.get("/devices/:device", async (ctx) => {
  const { device } = ctx.params;

  try {
    ctx.body = await prisma.devices.findMany({
      where: {
        device,
      },
    });
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: "Internal Server Error" };
  }
});

router.get("/info", async (ctx) => {
  ctx.body = {
    version: packageJson.version,
  };
});

app.use(router.routes()).use(router.allowedMethods());

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

cron.schedule("*/5 * * * *", () => {
  console.log("cron: updateDevices");

  updateDevices();
});
