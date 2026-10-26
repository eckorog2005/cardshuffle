import { buildApp } from './app.ts';

const port = Number(process.env.PORT ?? 4000);
const host = process.env.IP ?? '::';

const app = await buildApp();
try {
  await app.listen({ port, host });
} catch (err) {
  console.error(err);
  process.exit(1);
}
console.log(`app is listening on port ${String(port)}`);
