import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';

// Unmock socket.io-client for server integration tests
vi.unmock('socket.io-client');

import { io as ioClient } from 'socket.io-client';

// Import server factory (CJS module)
const { createServer } = require('../../server.js');

describe('Multiplayer Server', () => {
    let serverInstance;
    let port;
    let clients = [];

    // Connects a client and captures the currentPlayers event atomically.
    // Returns { client, data } where data is the currentPlayers payload.
    function connectClient() {
        return new Promise((resolve) => {
            const client = ioClient(`http://localhost:${port}`, {
                transports: ['websocket'],
                forceNew: true,
            });
            clients.push(client);
            // Listen for currentPlayers BEFORE connect resolves to avoid race condition
            client.once('currentPlayers', (data) => resolve({ client, data }));
        });
    }

    function waitForEvent(client, event) {
        return new Promise((resolve) => {
            client.once(event, (data) => resolve(data));
        });
    }

    beforeAll(async () => {
        const { server } = createServer();
        serverInstance = server;
        await new Promise((resolve) => {
            serverInstance.listen(0, () => {
                port = serverInstance.address().port;
                resolve();
            });
        });
    });

    afterAll(async () => {
        clients.forEach(c => c.disconnect());
        clients = [];
        await new Promise((resolve) => {
            serverInstance.close(() => resolve());
        });
    });

    beforeEach(() => {
        // Disconnect any leftover clients from previous tests
        clients.forEach(c => c.disconnect());
        clients = [];
    });

    describe('connection and role assignment', () => {
        it('assigns striker to first connecting player', async () => {
            const { client: client1, data } = await connectClient();
            expect(data.yourRole).toBe('striker');
            client1.disconnect();
        });

        it('assigns keeper to second connecting player', async () => {
            const { client: client1 } = await connectClient();

            const { client: client2, data } = await connectClient();
            expect(data.yourRole).toBe('keeper');

            client1.disconnect();
            client2.disconnect();
        });

        it('sets correct start positions per role', async () => {
            const { client: client1, data: data1 } = await connectClient();

            const myInfo = data1.players[data1.yourId];
            if (data1.yourRole === 'striker') {
                expect(myInfo.x).toBe(540);
            } else {
                expect(myInfo.x).toBe(740);
            }
            expect(myInfo.y).toBe(600);

            client1.disconnect();
        });

        it('includes player info in currentPlayers payload', async () => {
            const { client: client1, data } = await connectClient();

            expect(data.yourId).toBe(client1.id);
            expect(data.players).toBeDefined();
            expect(data.players[data.yourId]).toBeDefined();
            expect(data.players[data.yourId].playerType).toBeDefined();

            client1.disconnect();
        });

        it('notifies existing players about new player', async () => {
            const { client: client1 } = await connectClient();

            const newPlayerPromise = waitForEvent(client1, 'newPlayer');
            const { client: client2 } = await connectClient();

            const newPlayerData = await newPlayerPromise;
            expect(newPlayerData.id).toBe(client2.id);

            client1.disconnect();
            client2.disconnect();
        });
    });

    describe('player movement', () => {
        it('broadcasts movement to other players', async () => {
            const { client: client1 } = await connectClient();
            const { client: client2 } = await connectClient();

            const movedPromise = waitForEvent(client2, 'playerMoved');
            client1.emit('playerMovement', { x: 200, y: 300, playerType: 'striker' });

            const moveData = await movedPromise;
            expect(moveData.id).toBe(client1.id);
            expect(moveData.x).toBe(200);
            expect(moveData.y).toBe(300);

            client1.disconnect();
            client2.disconnect();
        });
    });

    describe('player actions', () => {
        it('broadcasts shoot event to other players', async () => {
            const { client: client1 } = await connectClient();
            const { client: client2 } = await connectClient();

            const shootPromise = waitForEvent(client2, 'remotePlayerShoot');
            client1.emit('playerShoot', { x: 100, y: 200 });

            const shootData = await shootPromise;
            expect(shootData.id).toBe(client1.id);
            expect(shootData.x).toBe(100);

            client1.disconnect();
            client2.disconnect();
        });

        it('broadcasts block event to other players', async () => {
            const { client: client1 } = await connectClient();
            const { client: client2 } = await connectClient();

            const blockPromise = waitForEvent(client2, 'remotePlayerBlock');
            client1.emit('playerBlock', { blocking: true });

            const blockData = await blockPromise;
            expect(blockData.id).toBe(client1.id);
            expect(blockData.blocking).toBe(true);

            client1.disconnect();
            client2.disconnect();
        });
    });

    describe('disconnection', () => {
        it('notifies other players when a player disconnects', async () => {
            const { client: client1 } = await connectClient();
            const { client: client2 } = await connectClient();

            const disconnectPromise = waitForEvent(client1, 'playerDisconnected');
            const client2Id = client2.id;
            client2.disconnect();

            const disconnectedId = await disconnectPromise;
            expect(disconnectedId).toBe(client2Id);

            client1.disconnect();
        });
    });
});
