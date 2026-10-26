import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

function clientMessage(error: FastifyError, request: FastifyRequest): string {
  switch (error.code) {
    case 'FST_ERR_CTP_INVALID_MEDIA_TYPE':
      return `unsupported content type "${request.headers['content-type'] ?? ''}", use application/json`;
    case 'FST_ERR_CTP_INVALID_JSON_BODY':
      return 'request body is not valid JSON';
    case 'FST_ERR_CTP_EMPTY_JSON_BODY':
      return 'request body cannot be empty when the content type is application/json';
    default:
      return error.message;
  }
}

export function errorHandler(error: FastifyError, request: FastifyRequest, reply: FastifyReply) {
  const statusCode = error.statusCode !== undefined && error.statusCode >= 400 ? error.statusCode : 500;
  if (statusCode >= 500) {
    request.log.error(error);
    return reply.code(statusCode).send({ error: 'internal server error' });
  }
  return reply.code(statusCode).send({ error: clientMessage(error, request) });
}

export function notFoundHandler(request: FastifyRequest, reply: FastifyReply) {
  const [path] = request.url.split('?');
  return reply.code(404).send({ error: `route ${request.method} ${path} not found` });
}
