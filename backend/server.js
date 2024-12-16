const { WebSocketServer, WebSocket } = require("ws");
const Y = require("yjs");

// A map to store Yjs documents by room name
const docs = new Map();

// Function to get or create a Y.Doc for a room
const getOrCreateDoc = (roomName) => {
  if (!docs.has(roomName)) {
    console.log(`Creating new Yjs document for room: ${roomName}`);
    const ydoc = new Y.Doc();
    docs.set(roomName, ydoc);
  }
  return docs.get(roomName);
};

// Create the WebSocket server
const wss = new WebSocketServer({ port: 1234 });

wss.on("connection", (ws, req) => {
  const roomName = req.url.slice(1).split("?")[0] || "default-room";
  console.log(`New connection for room: ${roomName}`);

  const ydoc = getOrCreateDoc(roomName);

  ws.on("message", (message) => {
    try {
      // Broadcast received updates to all clients in the room
      const roomClients = Array.from(wss.clients).filter(
        (client) => client.readyState === WebSocket.OPEN && client !== ws
      );
      roomClients.forEach((client) => client.send(message));
    } catch (err) {
      console.error("Error broadcasting message:", err);
    }
  });

  ws.on("close", () => {
    console.log(`Connection closed for room: ${roomName}`);
  });
});

console.log("WebSocket server is running on ws://localhost:1234");
