const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 3001 });

wss.on('connection', (socket) => {
  console.log('Cliente conectado');

  socket.on('message', (message) => {
    const data = JSON.parse(message);
    console.log('Mensaje recibido:', data.type);

    // Reenvía mensaje a los demás clientes
    wss.clients.forEach((client) => {
      if (client !== socket && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  });
});