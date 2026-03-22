import Phaser from 'phaser';
import Striker from '../entities/Striker.js';
import Keeper from '../entities/Keeper.js';
import Enemy from '../entities/Enemy.js';
import { calculateWaveEnemies, calculateSpawnInterval, selectEnemyType, calculateWaveBonus, calculateBlockScore } from '../utils/waveCalculator.js';
import io from 'socket.io-client';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init(data) {
        this.currentNight = data.night || 1;
        this.remotePlayers = {};
        this.myRole = null;
        this.myPlayer = null;
        this.playersConnected = 0;
        this.gameStarted = false;
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Connect to multiplayer server (this will assign our role)
        this.setupMultiplayer();

        // Create starfield background
        this.createStarfield();

        // Draw the playing field
        this.createField();

        // Create the Sacred Shrine (goal)
        this.createShrine();

        // Create UI
        this.createUI();

        // Game state
        this.shrineHealth = 100;
        this.score = 0;
        this.harmonyMeter = 0;

        // Enemies group
        this.enemies = this.physics.add.group();
        this.enemyList = []; // Track individual enemy instances

        // Wave system
        this.currentWave = 0;
        this.waveInProgress = false;
        this.waveTimer = null;
        this.enemiesSpawned = 0;
        this.enemiesKilled = 0;

        // Debug indicator
        this.debugText = this.add.text(width / 2, height / 2, 'Waiting for players...', {
            font: 'bold 24px Arial',
            fill: '#ffff00',
            stroke: '#000000',
            strokeThickness: 4
        });
        this.debugText.setOrigin(0.5);

        console.log(`🌙 Night ${this.currentNight} begins!`);
    }

    setupMultiplayer() {
        // Connect to Socket.IO server
        const isDev = window.location.port === '5555';
        this.socket = isDev ? io('http://localhost:3000') : io();

        this.socket.on('connect', () => {
            console.log('🌐 Connected to multiplayer server!');
        });

        // Handle current players (when joining)
        this.socket.on('currentPlayers', (data) => {
            console.log('📥 Received player data:', data);

            try {
                // Validate data structure
                if (!data || !data.players || !data.yourId || !data.yourRole) {
                    throw new Error('Invalid player data received from server');
                }

                // Create our local player based on assigned role
                this.myRole = data.yourRole;
                const myInfo = data.players[data.yourId];

                if (!myInfo) {
                    throw new Error(`Player info not found for ID: ${data.yourId}`);
                }

                console.log(`Creating ${this.myRole} at position (${myInfo.x}, ${myInfo.y})`);

                if (this.myRole === 'striker') {
                    this.myPlayer = new Striker(this, myInfo.x, myInfo.y, false);
                    console.log('⚽ You are the STRIKER! Player created:', this.myPlayer);
                } else if (this.myRole === 'keeper') {
                    this.myPlayer = new Keeper(this, myInfo.x, myInfo.y, false);
                    console.log('🛡️ You are the KEEPER! Player created:', this.myPlayer);
                } else {
                    throw new Error(`Unknown role: ${this.myRole}`);
                }

                if (this.myPlayer && this.myPlayer.container) {
                    console.log('✅ Player container exists at:', this.myPlayer.container.x, this.myPlayer.container.y);

                    // Count players
                    this.playersConnected = Object.keys(data.players).length;
                    console.log(`Players connected: ${this.playersConnected}/2`);

                    // Remove debug text once player is created
                    if (this.debugText) {
                        if (this.playersConnected >= 2) {
                            this.debugText.setText('BOTH PLAYERS READY!');
                            this.time.delayedCall(2000, () => {
                                if (this.debugText) {
                                    this.debugText.destroy();
                                }
                                this.checkStartGame();
                            });
                        } else {
                            this.debugText.setText(`Waiting for ${this.myRole === 'striker' ? 'Keeper' : 'Striker'}...`);
                        }
                    }
                }

                // Create remote players for all other connected players
                if (data.players) {
                    Object.keys(data.players).forEach((id) => {
                        if (id !== data.yourId && data.players[id]) {
                            this.addRemotePlayer(data.players[id]);
                        }
                    });
                }
            } catch (error) {
                console.error('❌ Error creating player:', error);
                console.error('Full error stack:', error.stack);
                if (this.debugText) {
                    this.debugText.setText(`ERROR: ${error.message}`);
                    this.debugText.setFill('#ff0000');
                }
            }
        });

        // Handle new player joining
        this.socket.on('newPlayer', (playerInfo) => {
            this.addRemotePlayer(playerInfo);
            this.playersConnected++;
            console.log(`New player joined! Total: ${this.playersConnected}/2`);

            // Update debug text and check if we can start
            if (this.debugText && this.playersConnected >= 2) {
                this.debugText.setText('BOTH PLAYERS READY!');
                this.time.delayedCall(2000, () => {
                    if (this.debugText) {
                        this.debugText.destroy();
                    }
                    this.checkStartGame();
                });
            }
        });

        // Handle player movement
        this.socket.on('playerMoved', (playerData) => {
            if (this.remotePlayers[playerData.id]) {
                const remotePlayer = this.remotePlayers[playerData.id];
                if (remotePlayer.player) {
                    remotePlayer.player.setPosition(playerData.x, playerData.y);
                }
            }
        });

        // Handle player disconnect
        this.socket.on('playerDisconnected', (playerId) => {
            if (this.remotePlayers[playerId]) {
                this.remotePlayers[playerId].player.destroy();
                delete this.remotePlayers[playerId];
                this.playersConnected = Math.max(1, this.playersConnected - 1);
                console.log(`Player ${playerId} disconnected. Players: ${this.playersConnected}/2`);
            }
        });
    }

    addRemotePlayer(playerInfo) {
        console.log('Adding remote player:', playerInfo);

        try {
            if (!playerInfo || !playerInfo.id || !playerInfo.playerType) {
                console.error('Invalid remote player info:', playerInfo);
                return;
            }

            // Don't add if already exists
            if (this.remotePlayers[playerInfo.id]) {
                console.log('Remote player already exists:', playerInfo.id);
                return;
            }

            // Create appropriate player type based on their selection
            let player;
            if (playerInfo.playerType === 'striker') {
                player = new Striker(this, playerInfo.x || 540, playerInfo.y || 600, true);
            } else if (playerInfo.playerType === 'keeper') {
                player = new Keeper(this, playerInfo.x || 740, playerInfo.y || 600, true);
            }

            if (player) {
                this.remotePlayers[playerInfo.id] = {
                    player: player,
                    playerType: playerInfo.playerType
                };
                console.log('✅ Remote player added successfully:', playerInfo.id);
            }
        } catch (error) {
            console.error('❌ Error adding remote player:', error);
        }
    }

    update(time, delta) {
        // Update our local player
        if (this.myPlayer) {
            this.myPlayer.update();
        }

        // Update all enemies
        this.enemyList.forEach(enemy => {
            if (enemy && enemy.container && enemy.container.active) {
                enemy.update();
            }
        });

        // Clean up destroyed enemies from the list
        this.enemyList = this.enemyList.filter(enemy =>
            enemy && enemy.container && enemy.container.active
        );

        // Setup collision detection if striker exists
        if (this.myPlayer && this.myRole === 'striker' && this.myPlayer.projectiles) {
            this.physics.overlap(
                this.myPlayer.projectiles,
                this.enemies,
                this.hitEnemy,
                null,
                this
            );
        }

        // Check if keeper is blocking and hitting enemies
        if (this.myPlayer && this.myRole === 'keeper' && this.myPlayer.isBlocking) {
            this.physics.overlap(
                this.myPlayer.container,
                this.enemies,
                this.blockEnemy,
                null,
                this
            );
        }

        // Check if wave is complete
        if (this.waveInProgress && this.enemyList.length === 0 && this.enemiesSpawned > 0) {
            this.completeWave();
        }
    }

    createStarfield() {
        for (let i = 0; i < 150; i++) {
            const x = Phaser.Math.Between(0, this.cameras.main.width);
            const y = Phaser.Math.Between(0, this.cameras.main.height);
            const star = this.add.circle(x, y, Phaser.Math.Between(1, 2), 0xffffff, 0.6);

            this.tweens.add({
                targets: star,
                alpha: 0.1,
                duration: Phaser.Math.Between(2000, 4000),
                yoyo: true,
                repeat: -1
            });
        }
    }

    createField() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Draw field outline
        const graphics = this.add.graphics();
        graphics.lineStyle(3, 0x00ff00, 0.5);
        graphics.strokeRect(50, 50, width - 100, height - 100);

        // Center circle
        graphics.lineStyle(2, 0x00ff00, 0.3);
        graphics.strokeCircle(width / 2, height / 2, 80);

        // Center line
        graphics.lineBetween(50, height / 2, width - 50, height / 2);
    }

    createShrine() {
        const width = this.cameras.main.width;

        // Shrine base (large glowing crystal at TOP of screen)
        this.shrine = this.add.container(width / 2, 100);

        // Outer glow - MUCH BIGGER and more visible
        const glow = this.add.circle(0, 0, 80, 0x9c27b0, 0.5);
        this.shrine.add(glow);

        // Main crystal - BIGGER
        const crystal = this.add.star(0, 0, 5, 40, 70, 0xe91e63);
        this.shrine.add(crystal);

        // Inner light - BIGGER
        const light = this.add.circle(0, 0, 30, 0xffffff, 0.9);
        this.shrine.add(light);

        // Shrine label
        const shrineLabel = this.add.text(0, -100, '⛩️ SACRED SHRINE ⛩️', {
            font: 'bold 20px Arial',
            fill: '#ff4081',
            stroke: '#000000',
            strokeThickness: 4
        });
        shrineLabel.setOrigin(0.5);
        this.shrine.add(shrineLabel);

        // Pulsing animation
        this.tweens.add({
            targets: [glow, crystal],
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Rotating animation for crystal
        this.tweens.add({
            targets: crystal,
            angle: 360,
            duration: 8000,
            repeat: -1,
            ease: 'Linear'
        });

        // Make sure shrine is on top layer
        this.shrine.setDepth(1000);
    }

    createUI() {
        const width = this.cameras.main.width;

        // Night indicator
        this.add.text(20, 20, `NIGHT ${this.currentNight}`, {
            font: 'bold 24px Arial',
            fill: '#ffeb3b',
            stroke: '#000000',
            strokeThickness: 4
        });

        // Shrine health
        this.shrineHealthText = this.add.text(width - 20, 20, 'SHRINE: 100%', {
            font: 'bold 20px Arial',
            fill: '#ff4081',
            stroke: '#000000',
            strokeThickness: 3
        });
        this.shrineHealthText.setOrigin(1, 0);

        // Score
        this.scoreText = this.add.text(width / 2, 20, 'SCORE: 0', {
            font: 'bold 20px Arial',
            fill: '#00ff00',
            stroke: '#000000',
            strokeThickness: 3
        });
        this.scoreText.setOrigin(0.5, 0);

        // Harmony meter background
        const harmonyBg = this.add.graphics();
        harmonyBg.fillStyle(0x333333, 0.8);
        harmonyBg.fillRect(width / 2 - 150, 60, 300, 20);

        // Harmony meter fill (will update this)
        this.harmonyBar = this.add.graphics();

        // Harmony label
        this.add.text(width / 2, 90, 'HARMONY', {
            font: 'bold 12px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5, 0);
    }

    updateHarmonyMeter(value) {
        this.harmonyMeter = Phaser.Math.Clamp(value, 0, 100);

        this.harmonyBar.clear();
        const gradient = this.harmonyMeter < 50 ? 0x00bcd4 : 0xff9800;
        this.harmonyBar.fillStyle(gradient, 0.9);
        this.harmonyBar.fillRect(
            this.cameras.main.width / 2 - 150,
            60,
            (300 * this.harmonyMeter) / 100,
            20
        );
    }

    damageShrine(amount) {
        this.shrineHealth -= amount;
        this.shrineHealth = Math.max(0, this.shrineHealth);
        this.shrineHealthText.setText(`SHRINE: ${this.shrineHealth}%`);

        // Screen shake on damage
        this.cameras.main.shake(200, 0.01);

        if (this.shrineHealth <= 0) {
            this.gameOver();
        }
    }

    addScore(points) {
        this.score += points;
        this.scoreText.setText(`SCORE: ${this.score}`);
    }

    checkStartGame() {
        if (this.playersConnected >= 2 && !this.gameStarted) {
            this.gameStarted = true;
            console.log('🎮 Both players ready! Starting game in 2 seconds...');

            this.time.delayedCall(2000, () => {
                this.startNextWave();
            });
        }
    }

    gameOver() {
        console.log('💔 Game Over!');
        // TODO: Implement game over screen
    }

    startNextWave() {
        this.currentWave++;
        this.waveInProgress = true;
        this.enemiesSpawned = 0;
        this.enemiesKilled = 0;

        // Wave announcement
        const waveText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            `WAVE ${this.currentWave}`,
            {
                font: 'bold 48px Arial',
                fill: '#ff0000',
                stroke: '#000000',
                strokeThickness: 6
            }
        );
        waveText.setOrigin(0.5);

        this.tweens.add({
            targets: waveText,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 0,
            duration: 2000,
            onComplete: () => waveText.destroy()
        });

        // Calculate wave difficulty
        const enemiesToSpawn = calculateWaveEnemies(this.currentWave);
        const spawnInterval = calculateSpawnInterval(this.currentWave);

        // Spawn enemies over time
        let spawned = 0;
        this.waveTimer = this.time.addEvent({
            delay: spawnInterval,
            callback: () => {
                if (spawned < enemiesToSpawn) {
                    this.spawnEnemy();
                    spawned++;
                    this.enemiesSpawned++;
                }
            },
            loop: true
        });

        console.log(`🌊 Wave ${this.currentWave} started! ${enemiesToSpawn} enemies incoming!`);
    }

    spawnEnemy() {
        const width = this.cameras.main.width;
        const x = Phaser.Math.Between(100, width - 100);
        const y = 150; // Spawn ON screen for visibility testing

        // Determine enemy type based on wave
        const type = selectEnemyType(this.currentWave);

        console.log(`👾 Spawning ${type} enemy at (${x}, ${y})`);
        const enemy = new Enemy(this, x, y, type);
        this.enemyList.push(enemy);
        this.enemies.add(enemy.getContainer());
        console.log(`👾 Enemy spawned! Total enemies: ${this.enemyList.length}`);
    }

    completeWave() {
        if (this.waveTimer) {
            this.waveTimer.remove();
        }

        this.waveInProgress = false;

        // Wave complete bonus
        const bonus = calculateWaveBonus(this.currentWave);
        this.addScore(bonus);

        // Show wave complete message
        const completeText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            `WAVE ${this.currentWave} COMPLETE!\n+${bonus} BONUS`,
            {
                font: 'bold 36px Arial',
                fill: '#00ff00',
                stroke: '#000000',
                strokeThickness: 5,
                align: 'center'
            }
        );
        completeText.setOrigin(0.5);

        this.tweens.add({
            targets: completeText,
            alpha: 0,
            y: completeText.y - 50,
            duration: 3000,
            onComplete: () => completeText.destroy()
        });

        // Start next wave after delay
        this.time.delayedCall(4000, () => {
            this.startNextWave();
        });

        console.log(`✅ Wave ${this.currentWave} complete! Starting next wave soon...`);
    }

    hitEnemy(projectile, enemyContainer) {
        // Find the enemy instance
        const enemy = this.enemyList.find(e => e.container === enemyContainer);

        if (enemy) {
            const destroyed = enemy.takeDamage(1);

            if (destroyed) {
                this.addScore(enemy.stats.points);
                this.enemiesKilled++;
                this.updateHarmonyMeter(this.harmonyMeter + 5);

                // Remove from enemies list
                this.enemyList = this.enemyList.filter(e => e !== enemy);
            }

            // Destroy the projectile
            projectile.destroy();
        }
    }

    blockEnemy(keeperContainer, enemyContainer) {
        // Find the enemy instance
        const enemy = this.enemyList.find(e => e.container === enemyContainer);

        if (enemy) {
            const destroyed = enemy.takeDamage(1);

            if (destroyed) {
                this.addScore(calculateBlockScore(enemy.stats.points)); // Bonus for blocking
                this.enemiesKilled++;
                this.updateHarmonyMeter(this.harmonyMeter + 10);

                // Remove from enemies list
                this.enemyList = this.enemyList.filter(e => e !== enemy);

                // Visual feedback
                const blockText = this.add.text(
                    keeperContainer.x,
                    keeperContainer.y - 30,
                    'BLOCKED!',
                    {
                        font: 'bold 16px Arial',
                        fill: '#00bcd4'
                    }
                );
                blockText.setOrigin(0.5);

                this.tweens.add({
                    targets: blockText,
                    y: blockText.y - 30,
                    alpha: 0,
                    duration: 1000,
                    onComplete: () => blockText.destroy()
                });
            }
        }
    }
}
