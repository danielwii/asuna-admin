import 'reflect-metadata';
import { createConnection, getConnectionOptions } from 'typeorm';
import { createExpressServer } from 'routing-controllers';

(async () => {
  const options = await getConnectionOptions();
  console.log('options is', options);
  await createConnection(options);

  // create express app
  const app = createExpressServer({
    controllers: [__dirname + '/controllers/*.ts'],
    // controllers: [AboutController],
  });

  // x-response-time

  app.use(async (ctx, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    ctx.set('X-Response-Time', `${ms}ms`);
    // console.log(`${ctx.method} ${ctx.url} - ${ms}ms`);
  });

  app.on('error', (err, ctx) => {
    console.error('server error', err, ctx);
  });

  // register express routes from defined application routes
  // Routes.forEach(route => {
  //   (app as any)[route.method](route.route, (req: Request, res: Response, next: Function) => {
  //     const result = (new (route.controller as any))[route.action](req, res, next);
  //     if (result instanceof Promise) {
  //       result.then(result => (result !== null && result !== undefined)
  //         ? res.send(result)
  //         : undefined);
  //
  //     } else if (result !== null && result !== undefined) {
  //       res.json(result);
  //     }
  //   });
  // });

  // setup express app here
  // ...

  // start express server
  app.listen(3000);

  console.log('Koa server has started on port 3000.');
})();
