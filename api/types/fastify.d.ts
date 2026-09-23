import { FastifyRequest } from 'fastify';

export interface UserContext {
  id: number;
  email: string;
  nombre: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    userContext?: UserContext;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      id: number;
      email: string;
      nombre: string;
    };
    user: {
      id: number;
      email: string;
      nombre: string;
    };
  }
}
