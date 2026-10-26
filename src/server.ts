import { buildApp } from './app.ts';

const port = Number(process.env.PORT ?? 4000);
const host = process.env.IP ?? '::';

const windowEnv = process.env.RATE_LIMIT_WINDOW || undefined;
const app = await buildApp({
  rateLimit: {
    max: process.env.RATE_LIMIT_MAX ? Number(process.env.RATE_LIMIT_MAX) : undefined,
    timeWindow: windowEnv && /^\d+$/.test(windowEnv) ? Number(windowEnv) : windowEnv,
  },
});
try {
  await app.listen({ port, host });
} catch (err) {
  console.error(err);
  process.exit(1);
}
console.log(`app is listening on port ${String(port)}`);
