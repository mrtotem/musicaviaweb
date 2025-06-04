const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 3001 });

// Estructura: roomName -> Set<WebSocket>
const rooms = new Map();

wss.on('connection', (socket) => {
  let currentRoom = null;

  socket.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === 'join') {
        const { room } = data;
        currentRoom = room;

        // Crear la sala si no existe
        if (!rooms.has(room)) {
          rooms.set(room, new Set());
        }

        // Añadir este socket a la sala
        rooms.get(room).add(socket);
      } else if (currentRoom && rooms.has(currentRoom)) {
        // Reenviar mensaje a todos los demás de la sala
        for (const peer of rooms.get(currentRoom)) {
          if (peer !== socket && peer.readyState === WebSocket.OPEN) {
            peer.send(JSON.stringify(data));
          }
        }
      }
    } catch (e) {
      console.error('Error procesando mensaje:', e);
    }
  });

  socket.on('close', () => {
    if (currentRoom && rooms.has(currentRoom)) {
      rooms.get(currentRoom).delete(socket);

      // Eliminar sala si está vacía
      if (rooms.get(currentRoom).size === 0) {
        rooms.delete(currentRoom);
      }
    }
  });
});

console.log('Servidor WebSocket corriendo en ws://localhost:3001');