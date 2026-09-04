import { createServer } from "node:http";
import next from "next";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT || 3000);
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

await app.prepare();

createServer((request, response) => handle(request, response)).listen(
  port,
  hostname,
  () => {
    console.log(`Peaches Hair is listening on ${hostname}:${port}`);
  },
);
