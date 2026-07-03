// // // // // // // // server.js (or in your server setup file)
// // // // // // // import { createServer } from 'http';
// // // // // // // import { parse } from 'url';
// // // // // // // import next from 'next';
// // // // // // // import { setupSocketServer } from './lib/socket-server';

// // // // // // // const dev = process.env.NODE_ENV !== 'production';
// // // // // // // const app = next({ dev });
// // // // // // // const handle = app.getRequestHandler();

// // // // // // // app.prepare().then(() => {
// // // // // // //   const server = createServer((req, res) => {
// // // // // // //     const parsedUrl = parse(req.url, true);
// // // // // // //     handle(req, res, parsedUrl);
// // // // // // //   });

// // // // // // //   // Setup Socket.IO
// // // // // // //   const io = setupSocketServer(server);

// // // // // // //   // Make io available globally
// // // // // // //   global.__io = io;

// // // // // // //   const PORT = process.env.PORT || 3000;
// // // // // // //   server.listen(PORT, () => {
// // // // // // //     console.log(`> Ready on http://localhost:${PORT}`);
// // // // // // //   });
// // // // // // // });

// // // // // // import { createServer } from 'http';
// // // // // // import { parse } from 'url';
// // // // // // import next from 'next';
// // // // // // import { setupSocketServer } from './lib/socket-server.js';

// // // // // // const dev = process.env.NODE_ENV !== 'production';

// // // // // // const app = next({ dev });
// // // // // // const handle = app.getRequestHandler();

// // // // // // app.prepare().then(() => {
// // // // // //   const server = createServer((req, res) => {
// // // // // //     const parsedUrl = parse(req.url || '', true);
// // // // // //     handle(req, res, parsedUrl);
// // // // // //   });

// // // // // //   /**
// // // // // //    * ✅ SOCKET.IO ATTACHMENT (THIS IS THE FIX)
// // // // // //    */
// // // // // //   const socketManager = setupSocketServer(server);
// // // // // //   const io = socketManager.getIO();

// // // // // //   global.__io = io;

// // // // // //   /**
// // // // // //    * ✅ CRITICAL: WebSocket upgrade handling
// // // // // //    */
// // // // // //   server.on('upgrade', (req, socket, head) => {
// // // // // //     if (req.url?.startsWith('/socket.io')) {
// // // // // //       io.engine.handleUpgrade(req, socket, head);
// // // // // //     }
// // // // // //   });

// // // // // //   const PORT = process.env.PORT || 3000;

// // // // // //   server.listen(PORT, () => {
// // // // // //     console.log(`🚀 Server running on http://localhost:${PORT}`);
// // // // // //   });
// // // // // // });

// // // // // import { createServer } from "http";
// // // // // import { parse } from "url";
// // // // // import next from "next";
// // // // // import { setupSocketServer } from "./lib/socket-server";

// // // // // const dev = process.env.NODE_ENV !== "production";

// // // // // const app = next({ dev });
// // // // // const handle = app.getRequestHandler();

// // // // // app.prepare().then(() => {
// // // // //   const server = createServer((req, res) => {
// // // // //     const parsedUrl = parse(req.url || "", true);
// // // // //     handle(req, res, parsedUrl);
// // // // //   });

// // // // //   const socketManager = setupSocketServer(server);
// // // // //   const io = socketManager.getIO();

// // // // //   global.__io = io;

// // // // //   const PORT = process.env.PORT || 3000;

// // // // //   server.listen(PORT, () => {
// // // // //     console.log(`🚀 Server running on http://localhost:${PORT}`);
// // // // //   });
// // // // // });

// // // // // server.ts
// // // // import { createServer } from "http";
// // // // import { parse } from "url";
// // // // import next from "next";
// // // // import { setupSocketServer } from "./lib/socket-server";
// // // // import { setSocketInstance } from "./lib/socket-instance";

// // // // const dev = process.env.NODE_ENV !== "production";
// // // // const app = next({ dev });
// // // // const handle = app.getRequestHandler();

// // // // app.prepare().then(() => {
// // // //   const server = createServer((req, res) => {
// // // //     const parsedUrl = parse(req.url || "", true);
// // // //     handle(req, res, parsedUrl);
// // // //   });

// // // //   const socketManager = setupSocketServer(server);
// // // //   const io = socketManager.getIO();

// // // //   // CRITICAL: Store socket instance globally
// // // //   setSocketInstance(socketManager);
// // // //   global.__io = io;

// // // //   // CRITICAL: Handle WebSocket upgrade
// // // //   server.on('upgrade', (req, socket, head) => {
// // // //     if (req.url?.startsWith('/socket.io')) {
// // // //       io.engine.handleUpgrade(req, socket, head);
// // // //     }
// // // //   });

// // // //   const PORT = process.env.PORT || 3000;
// // // //   server.listen(PORT, () => {
// // // //     console.log(`🚀 Server running on http://localhost:${PORT}`);
// // // //   });
// // // // });

// // // // server.ts
// // // import { createServer } from "http";
// // // import { parse } from "url";
// // // import next from "next";
// // // import { setupSocketServer } from "./lib/socket-server";
// // // import { setSocketInstance } from "./lib/socket-instance";

// // // const dev = process.env.NODE_ENV !== "production";
// // // const app = next({ dev });
// // // const handle = app.getRequestHandler();

// // // app.prepare().then(() => {
// // //   const server = createServer((req, res) => {
// // //     const parsedUrl = parse(req.url || "", true);
// // //     handle(req, res, parsedUrl);
// // //   });

// // //   const socketManager = setupSocketServer(server);
// // //   const io = socketManager.getIO();

// // //   // ✅ CRITICAL FIX: Store socket instance globally
// // //   setSocketInstance(socketManager);
// // //   global.__io = io;
// // //   global.__socketManager = socketManager;

// // //   // ✅ Handle WebSocket upgrade
// // //   server.on('upgrade', (req, socket, head) => {
// // //     if (req.url?.startsWith('/socket.io')) {
// // //       io.engine.handleUpgrade(req, socket, head);
// // //     }
// // //   });

// // //   const PORT = process.env.PORT || 3000;
// // //   server.listen(PORT, () => {
// // //     console.log(`🚀 Server running on http://localhost:${PORT}`);
// // //     console.log(`✅ Socket.IO instance stored globally`);
// // //   });
// // // });

// // // server.ts
// // import { createServer } from "http";
// // import { parse } from "url";
// // import next from "next";
// // import { setupSocketServer } from "./lib/socket-server";
// // import { setSocketInstance } from "./lib/socket-instance";

// // const dev = process.env.NODE_ENV !== "production";
// // const app = next({ dev });
// // const handle = app.getRequestHandler();

// // app.prepare().then(() => {
// //   const server = createServer((req, res) => {
// //     const parsedUrl = parse(req.url || "", true);
// //     handle(req, res, parsedUrl);
// //   });

// //   // ✅ CRITICAL FIX: Set up socket server
// //   const socketManager = setupSocketServer(server);
// //   const io = socketManager.getIO();

// //   // ✅ Store socket instance globally BEFORE any requests
// //   setSocketInstance(socketManager);
  
// //   // Also store on global for debugging
// //   (global as any).__io = io;
// //   (global as any).__socketManager = socketManager;

// //   console.log('✅ Socket.IO instance stored globally');

// //   // ✅ Handle WebSocket upgrade
// //   server.on('upgrade', (req, socket, head) => {
// //     if (req.url?.startsWith('/socket.io')) {
// //       io.engine.handleUpgrade(req, socket, head);
// //     }
// //   });

// //   const PORT = process.env.PORT || 3000;
// //   server.listen(PORT, () => {
// //     console.log(`🚀 Server running on http://localhost:${PORT}`);
// //     console.log(`✅ Socket.IO server ready on port ${PORT}`);
// //     console.log(`✅ Socket instance available: ${!!(global as any).__socketManager}`);
// //   });
// // });

// // server.ts
// import { createServer } from "http";
// import { parse } from "url";
// import next from "next";
// import { setupSocketServer } from "./lib/socket-server";
// import { setSocketInstance } from "./lib/socket-instance";

// const dev = process.env.NODE_ENV !== "production";
// const app = next({ dev });
// const handle = app.getRequestHandler();

// app.prepare().then(() => {
//   const server = createServer((req, res) => {
//     const parsedUrl = parse(req.url || "", true);
//     handle(req, res, parsedUrl);
//   });

//   // ✅ Setup socket server
//   const socketManager = setupSocketServer(server);
//   const io = socketManager.getIO();

//   // ✅ Store socket instance globally
//   setSocketInstance(socketManager);
//   (global as any).__io = io;
//   (global as any).__socketManager = socketManager;

//   console.log('✅ Socket.IO instance stored globally');

//   // ✅ FIX: Only handle upgrade if it's socket.io
//   // Socket.IO handles its own upgrades internally
//   // We don't need to manually handle upgrades here

//   const PORT = process.env.PORT || 3000;
//   server.listen(PORT, () => {
//     console.log(`🚀 Server running on http://localhost:${PORT}`);
//     console.log(`✅ Socket.IO server ready on port ${PORT}`);
//     console.log(`✅ Socket instance available: ${!!(global as any).__socketManager}`);
//   });
// });

import "dotenv/config";
import { createServer } from "http";
import { parse } from "url";
import next from "next";
import mongoose from "mongoose";

import { setupSocketServer } from "./lib/socket-server";
import { setSocketInstance } from "./lib/socket-instance";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    console.log("🔌 Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGODB_URI as string, {
      bufferCommands: false,
    });

    console.log("✅ MongoDB connected");

    await app.prepare();

    const server = createServer((req, res) => {
      const parsedUrl = parse(req.url || "", true);
      handle(req, res, parsedUrl);
    });

    const socketManager = setupSocketServer(server);
    const io = socketManager.getIO();

    setSocketInstance(socketManager);
    (global as any).__io = io;
    (global as any).__socketManager = socketManager;

    console.log("✅ Socket.IO instance stored globally");

    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log("✅ Socket.IO ready");
    });

  } catch (err) {
    console.error("❌ Startup error:", err);
    process.exit(1);
  }
}

start();