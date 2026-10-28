import { readFileSync } from 'node:fs';
import type { FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { deckDocsSchema } from './params.ts';

type Schema = Record<string, unknown>;

const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { version: string };

// The validation schemas work around Ajv coercion (see params.ts); show clients the types they should send instead.
function documented(property: Schema): Schema {
  const { allOf, ...rest } = property as Schema & { allOf?: Schema[] };
  return allOf ? { ...allOf[allOf.length - 1], ...rest } : property;
}

function documentedProperties(schema: unknown, overrides: Schema = {}): unknown {
  if (typeof schema !== 'object' || schema === null || !('properties' in schema)) {
    return schema;
  }
  const properties = Object.fromEntries(
    Object.entries(schema.properties as Record<string, Schema>).map(([name, property]) => [
      name,
      { ...documented(property), ...(overrides[name] as Schema | undefined) },
    ]),
  );
  return { ...schema, properties };
}

export async function registerDocs(app: FastifyInstance) {
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'cardshuffle',
        description: 'Shuffle standard or custom decks of cards and deal hands.',
        version,
      },
    },
    transform: ({ schema, url }) => {
      const { querystring, body, ...rest } = schema as Schema;
      return {
        schema: {
          ...rest,
          ...(querystring === undefined ? {} : { querystring: documentedProperties(querystring) }),
          ...(body === undefined ? {} : { body: documentedProperties(body, { deck: deckDocsSchema }) }),
        },
        url,
      };
    },
    // @fastify/swagger marks every request body as required, but /customDeck falls back to a standard deck without one.
    transformObject: (documentObject) => {
      const spec = 'openapiObject' in documentObject ? documentObject.openapiObject : documentObject.swaggerObject;
      const body = (spec as { paths?: Record<string, { post?: { requestBody?: { required?: boolean } } }> }).paths?.[
        '/customDeck'
      ]?.post?.requestBody;
      if (body) {
        body.required = false;
      }
      return spec;
    },
  });
  await app.register(swaggerUi, { routePrefix: '/docs' });
}
