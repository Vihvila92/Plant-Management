import { createServer } from "./server.js";

const port = Number(process.env.PORT ?? 4000);
const host = process.env.HOST ?? "0.0.0.0";

const server = createServer();

server.listen(port, host, () => {
  console.log(`plant-management backend listening on http://${host}:${port}`);
});

