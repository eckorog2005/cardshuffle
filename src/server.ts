import { buildApp } from './app.ts';

const envInteger = (name: string): number | undefined => {
  const value = process.env[name];
  if (value === undefined || value === '') {
    return undefined;
  }
  if (!/^[1-9]\d*$/.test(value)) {
    throw new Error(`${name} must be a positive integer`);
  }
  return Number(value);
};

const port = envInteger('PORT') ?? 4000;
if (port > 65535) {
  throw new Error('PORT must be at most 65535');
}
const host = process.env.IP ?? '::';

const windowEnv = process.env.RATE_LIMIT_WINDOW || undefined;
const app = await buildApp({
  logger: true,
  rateLimit: {
    max: envInteger('RATE_LIMIT_MAX'),
    timeWindow: windowEnv && /^\d+$/.test(windowEnv) ? Number(windowEnv) : windowEnv,
  },
});

for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.once(signal, () => {
    app.log.info({ signal }, 'shutting down');
    app.close().then(
      () => process.exit(0),
      (err: unknown) => {
        app.log.error(err);
        process.exit(1);
      },
    );
  });
}

try {
  await app.listen({ port, host });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
