import Koa from 'koa';
import Router from 'koa-router';
import cron from 'node-cron';
import db from './utils/database';
import { refreshDB } from './utils/puppeteer';
import { config } from './utils/config';
import packageJson from '../package.json';

const app = new Koa();
const router = new Router();

router.get('/devices', async (ctx) => {
  try {
    const data = await db.getData();
    ctx.body = data;
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: 'Internal Server Error' };
  }
});

router.get('/devices/:device', async (ctx) => {
  const { device } = ctx.params;

  try {
    const data = await db.getData(device);
    ctx.body = data;
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: 'Internal Server Error' };
  }
});

router.get('/info', async (ctx) => {
  const data = {
    mirrors: [
      {
        type: 'quark',
        url: config.quark.share_url
      },
      {
        type: 'aliyun',
        url: config.aliyun.share_url
      }
    ],
    version: packageJson.version
  };
  ctx.body = data;
});

app.use(router.routes()).use(router.allowedMethods());

const port = 3000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

cron.schedule('*/5 * * * *', () => {
  console.log('refresh Database');
  refreshDB();
});
