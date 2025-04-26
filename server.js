const WebSocket = require('ws');

const server = new WebSocket.Server({ port: 8080 }); // WebSocket server on port 8080
const clients = new Map(); // Map to store connected clients and their states

server.on('connection', (ws) => {
    const playerId = generateUniqueId();
    clients.set(ws, { id: playerId, state: null });

    // Send the player's unique ID
    ws.send(JSON.stringify({ type: 'init', playerId }));

    // Broadcast new connection to all other players
    broadcast({ type: 'playerJoined', playerId });

    ws.on('message', (message) => {
        const data = JSON.parse(message);

        if (data.type === 'updateState') {
            // Update the player's state
            const client = clients.get(ws);
            client.state = data.state;

            // Broadcast the updated state to all other players
            broadcast({ type: 'updateState', playerId: client.id, state: client.state }, ws);
        }
    });

    ws.on('close', () => {
        // Remove the client and broadcast the disconnection
        const client = clients.get(ws);
        clients.delete(ws);
        broadcast({ type: 'playerLeft', playerId: client.id });
    });
});

function broadcast(message, excludeClient) {
    const msgString = JSON.stringify(message);
    for (const client of clients.keys()) {
        if (client !== excludeClient) {
            client.send(msgString);
        }
    }
}

function generateUniqueId() {
    return Math.random().toString(36).substr(2, 9); // Generate a random unique ID
}

console.log('WebSocket server is running on ws://localhost:8080');