import * as dotenv from "dotenv";
dotenv.config();

import { buildServer } from "./server.js";

const PORT = parseInt(process.env.PORT || "4000", 10);
const HOST = process.env.HOST || "0.0.0.0";

async function start() {
  const app = await buildServer();

  try {
    await app.listen({ port: PORT, host: HOST });
    console.log(`🚀 Fastify server listening at http://localhost:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
