import Koa from 'koa';
import Router from '@koa/router';
import { getArtistWorks } from './bili.js';

const app = new Koa();
const router = new Router();

app.use(router.routes());
app.use(router.allowedMethods());

router.get('/', async ctx => {
    ctx.body = {
        status: true,
        message: 'deployed successfully',
    };
});

router.get("/bili/:id", async (ctx) => {
    const artistItem = {
        id: ctx.params.id
    };

    try {
        const result = await getArtistWorks(artistItem, 1, "main");
        ctx.body = result;
    } catch (error) {
        ctx.status = 500;
        ctx.body = { error: "Internal Server Error" };
    }
});

app.listen(3000, () => {
    console.log(`Deploy successfully!`);
});
export default app;
