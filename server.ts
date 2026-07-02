// // // server.js (or in your server setup file)
// // import { createServer } from 'http';
// // import { parse } from 'url';
// // import next from 'next';
// // import { setupSocketServer } from './lib/socket-server';

// // const dev = process.env.NODE_ENV !== 'production';
// // const app = next({ dev });
// // const handle = app.getRequestHandler();

// // app.prepare().then(() => {
// //   const server = createServer((req, res) => {
// //     const parsedUrl = parse(req.url, true);
// //     handle(req, res, parsedUrl);
// //   });

// //   // Setup Socket.IO
// //   const io = setupSocketServer(server);

// //   // Make io available globally
// //   global.__io = io;

// //   const PORT = process.env.PORT || 3000;
// //   server.listen(PORT, () => {
// //     console.log(`> Ready on http://localhost:${PORT}`);
// //   });
// // });

// import { createServer } from 'http';
// import { parse } from 'url';
// import next from 'next';
// import { setupSocketServer } from './lib/socket-server.js';

// const dev = process.env.NODE_ENV !== 'production';

// const app = next({ dev });
// const handle = app.getRequestHandler();

// app.prepare().then(() => {
//   const server = createServer((req, res) => {
//     const parsedUrl = parse(req.url || '', true);
//     handle(req, res, parsedUrl);
//   });

//   /**
//    * ✅ SOCKET.IO ATTACHMENT (THIS IS THE FIX)
//    */
//   const socketManager = setupSocketServer(server);
//   const io = socketManager.getIO();

//   global.__io = io;

//   /**
//    * ✅ CRITICAL: WebSocket upgrade handling
//    */
//   server.on('upgrade', (req, socket, head) => {
//     if (req.url?.startsWith('/socket.io')) {
//       io.engine.handleUpgrade(req, socket, head);
//     }
//   });

//   const PORT = process.env.PORT || 3000;

//   server.listen(PORT, () => {
//     console.log(`🚀 Server running on http://localhost:${PORT}`);
//   });
// });

import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { setupSocketServer } from "./lib/socket-server";

const dev = process.env.NODE_ENV !== "production";

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url || "", true);
    handle(req, res, parsedUrl);
  });

  const socketManager = setupSocketServer(server);
  const io = socketManager.getIO();

  global.__io = io;

  const PORT = process.env.PORT || 3000;

  server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});