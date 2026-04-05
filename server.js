// Multiplayer server for Spirit Stadium Championship
const express = require('express');
const http = require('http');
const path = require('path');
const socketIo = require('socket.io');

function createServer() {
    const app = express();
    const server = http.createServer(app);

    // Serve the built Vite client from dist/
    app.use(express.static(path.join(__dirname, 'dist')));
    const io = socketIo(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    // Game state
    const players = {};
    let playerCount = 0;

    io.on('connection', (socket) => {
    console.log(`✅ Player connected: ${socket.id}`);

    // Reject if server is full (max 2 players)
    const currentPlayerCount = Object.keys(players).length;
    if (currentPlayerCount >= 2) {
        console.log(`❌ Server full, rejecting: ${socket.id}`);
        socket.emit('serverFull', { message: 'Game is full. Only 2 players allowed.' });
        socket.disconnect(true);
        return;
    }

    // Assign role based on what's available
    const existingRoles = Object.values(players).map(p => p.playerType);
    const playerRole = existingRoles.includes('striker') ? 'keeper' : 'striker';
    const startX = playerRole === 'striker' ? 300 : 200;
    const startY = 360;

    playerCount++;

    // Initialize new player
    players[socket.id] = {
        id: socket.id,
        x: startX,
        y: startY,
        playerType: playerRole,
        room: null
    };

    console.log(`🎮 Player ${playerCount} assigned role: ${playerRole}`);

    // Send this player's info and all current players
    socket.emit('currentPlayers', {
        players: players,
        yourId: socket.id,
        yourRole: playerRole
    });

    // Notify all other players about the new player
    socket.broadcast.emit('newPlayer', players[socket.id]);

    // Handle player movement
    socket.on('playerMovement', (movementData) => {
        if (players[socket.id]) {
            players[socket.id].x = movementData.x;
            players[socket.id].y = movementData.y;
            players[socket.id].playerType = movementData.playerType;

            // Broadcast to all other players
            socket.broadcast.emit('playerMoved', {
                id: socket.id,
                x: movementData.x,
                y: movementData.y,
                playerType: movementData.playerType
            });
        }
    });

    // Handle player shooting
    socket.on('playerShoot', (shootData) => {
        socket.broadcast.emit('remotePlayerShoot', {
            id: socket.id,
            ...shootData
        });
    });

    // Handle player blocking
    socket.on('playerBlock', (blockData) => {
        socket.broadcast.emit('remotePlayerBlock', {
            id: socket.id,
            ...blockData
        });
    });

    // Handle enemy spawn (host broadcasts to other players)
    socket.on('spawnEnemy', (enemyData) => {
        socket.broadcast.emit('remoteSpawnEnemy', enemyData);
    });

    // Handle enemy killed (sync kill across players)
    socket.on('enemyKilled', (killData) => {
        socket.broadcast.emit('remoteEnemyKilled', killData);
    });

    // Handle shrine damage (sync across players)
    socket.on('shrineDamaged', (damageData) => {
        socket.broadcast.emit('remoteShrineDamaged', damageData);
    });

    // Handle score update (sync across players)
    socket.on('scoreUpdate', (scoreData) => {
        socket.broadcast.emit('remoteScoreUpdate', scoreData);
    });

    // Handle player damage (sync health bars across players)
    socket.on('playerDamaged', (data) => {
        socket.broadcast.emit('remotePlayerDamaged', { id: socket.id, ...data });
    });

    // Handle wave sync (host tells other players about wave changes)
    socket.on('waveSync', (waveData) => {
        socket.broadcast.emit('remoteWaveSync', waveData);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        console.log(`❌ Player disconnected: ${socket.id}`);
        delete players[socket.id];
        playerCount--;
        io.emit('playerDisconnected', socket.id);
    });
});

    return { app, server, io, getState: () => ({ players, playerCount }) };
}

// Only start listening if this file is run directly
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    const { server } = createServer();
    server.listen(PORT, () => {
        console.log(`🎮 Spirit Stadium Championship Server running on port ${PORT}`);
        console.log(`🌐 Multiplayer ready! Players can connect from multiple browsers.`);
    });
}

module.exports = { createServer };
