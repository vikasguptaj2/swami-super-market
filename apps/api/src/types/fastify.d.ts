import "fastify";
import "@fastify/session";
import "@fastify/cookie";
import "@fastify/multipart";

export interface SessionAdminUser {
  id: number;
  email: string;
  name: string;
}

declare module "fastify" {
  interface Session {
    adminUser?: SessionAdminUser;
  }
}
