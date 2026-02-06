const WebSocket = require('ws');

class WebSocketService {
    constructor() {
        this.wss = null;
        this.clients = new Map(); // Map<clientId, {ws, warehouseId, userId}>
    }

    initialize(server) {
        this.wss = new WebSocket.Server({ server });

        this.wss.on('connection', (ws, req) => {
            console.log('New WebSocket connection');

            const clientId = this.generateClientId();
            this.clients.set(clientId, { ws, warehouseId: null, userId: null });

            // Handle incoming messages from client
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleClientMessage(clientId, data);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            });

            // Handle client disconnect
            ws.on('close', () => {
                console.log(`Client ${clientId} disconnected`);
                this.clients.delete(clientId);
            });

            // Handle errors
            ws.on('error', (error) => {
                console.error(`WebSocket error for client ${clientId}:`, error);
            });

            // Send connection acknowledgment
            this.sendToClient(clientId, {
                type: 'connection:established',
                clientId
            });
        });

        console.log('WebSocket server initialized');
    }

    handleClientMessage(clientId, data) {
        const client = this.clients.get(clientId);
        if (!client) return;

        switch (data.type) {
            case 'auth':
                // Store warehouse and user info for filtering
                client.warehouseId = data.warehouseId;
                client.userId = data.userId;
                console.log(`Client ${clientId} authenticated: warehouse=${data.warehouseId}, user=${data.userId}`);
                break;

            default:
                console.log(`Unknown message type: ${data.type}`);
        }
    }

    // Broadcast event to all clients watching a specific warehouse
    broadcast(event) {
        const { type, warehouseId, data } = event;

        this.clients.forEach((client, clientId) => {
            // Send to clients watching this warehouse or to all if no warehouse specified
            if (!warehouseId || client.warehouseId === warehouseId || client.warehouseId === null) {
                this.sendToClient(clientId, { type, data });
            }
        });
    }

    // Send message to specific client
    sendToClient(clientId, message) {
        const client = this.clients.get(clientId);
        if (client && client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(JSON.stringify(message));
        }
    }

    // Generate unique client ID
    generateClientId() {
        return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Emit truck events
    emitTruckAdded(warehouseId, truckData) {
        this.broadcast({
            type: 'truck:added',
            warehouseId,
            data: truckData
        });
    }

    emitTruckUpdated(warehouseId, truckData) {
        this.broadcast({
            type: 'truck:updated',
            warehouseId,
            data: truckData
        });
    }

    emitTruckDeleted(warehouseId, truckId) {
        this.broadcast({
            type: 'truck:deleted',
            warehouseId,
            data: { id: truckId }
        });
    }

    emitTruckFinished(warehouseId, truckData) {
        this.broadcast({
            type: 'truck:finished',
            warehouseId,
            data: truckData
        });
    }

    emitLoadingStarted(warehouseId, truckData) {
        this.broadcast({
            type: 'truck:loading_started',
            warehouseId,
            data: truckData
        });
    }

    // Send specific message to a user (by userId) - for chat
    sendToUser(userId, event) {
        this.clients.forEach((client) => {
            // Check if client is authenticated and userId matches
            // Note: userId coming from database is usually number, from client msg might be string/number
            if (client.userId && String(client.userId) === String(userId)) {
                if (client.ws.readyState === WebSocket.OPEN) {
                    client.ws.send(JSON.stringify(event));
                }
            }
        });
    }

    emitQueueUpdated(warehouseId) {
        this.broadcast({
            type: 'queue:updated',
            warehouseId,
            data: {}
        });
    }
}

// Export singleton instance
module.exports = new WebSocketService();
