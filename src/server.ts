import Koa from 'koa';
import Router from 'koa-router';
import db from './utils/database';

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

app.use(router.routes()).use(router.allowedMethods());

const port = 3000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});


