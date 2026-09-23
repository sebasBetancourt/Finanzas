import { FastifyReply } from 'fastify';

export function successResponse(data: any, code = 200) {
  return {
    isError: false,
    data,
    code,
    timestamp: new Date().toISOString(),
  };
}

export function errorResponse({
  message,
  code = 500,
  error = undefined,
}: {
  message: string;
  code?: number;
  error?: any;
}) {
  return {
    isError: true,
    data: null,
    code,
    message,
    error,
    timestamp: new Date().toISOString(),
  };
}

export const responseHelper = {
  success: (reply: FastifyReply, data: any, message?: string, statusCode = 200) => {
    return reply.status(statusCode).send({
      success: true,
      data,
      message: message || 'Operación exitosa',
      timestamp: new Date().toISOString(),
    });
  },

  error: (reply: FastifyReply, message: string, statusCode = 500, details?: any) => {
    return reply.status(statusCode).send({
      success: false,
      error: {
        message,
        details,
        code: statusCode,
      },
      timestamp: new Date().toISOString(),
    });
  },
};
