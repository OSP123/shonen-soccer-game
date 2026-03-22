import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockScene } from '../__mocks__/createMockScene.js';
import GameScene from '../../src/scenes/GameScene.js';

describe('GameScene', () => {
    let gameScene;

    beforeEach(() => {
        gameScene = new GameScene();
        // Assign mock scene properties
        const mockScene = createMockScene();
        Object.assign(gameScene, mockScene);
    });

    describe('init', () => {
        it('initializes game state with provided night number', () => {
            gameScene.init({ night: 3 });
            expect(gameScene.currentNight).toBe(3);
            expect(gameScene.remotePlayers).toEqual({});
            expect(gameScene.myRole).toBeNull();
            expect(gameScene.myPlayer).toBeNull();
            expect(gameScene.playersConnected).toBe(0);
            expect(gameScene.gameStarted).toBe(false);
        });

        it('defaults to night 1 when no data provided', () => {
            gameScene.init({});
            expect(gameScene.currentNight).toBe(1);
        });
    });

    describe('damageShrine', () => {
        beforeEach(() => {
            gameScene.init({ night: 1 });
            gameScene.shrineHealth = 100;
            gameScene.shrineHealthText = { setText: vi.fn() };
        });

        it('reduces shrine health by damage amount', () => {
            gameScene.damageShrine(15);
            expect(gameScene.shrineHealth).toBe(85);
            expect(gameScene.shrineHealthText.setText).toHaveBeenCalledWith('SHRINE: 85%');
        });

        it('clamps shrine health to minimum 0', () => {
            gameScene.damageShrine(150);
            expect(gameScene.shrineHealth).toBe(0);
        });

        it('triggers camera shake on damage', () => {
            gameScene.damageShrine(5);
            expect(gameScene.cameras.main.shake).toHaveBeenCalledWith(200, 0.01);
        });

        it('calls gameOver when shrine health reaches 0', () => {
            gameScene.gameOver = vi.fn();
            gameScene.damageShrine(100);
            expect(gameScene.gameOver).toHaveBeenCalled();
        });

        it('does NOT call gameOver when shrine survives', () => {
            gameScene.gameOver = vi.fn();
            gameScene.damageShrine(10);
            expect(gameScene.gameOver).not.toHaveBeenCalled();
        });
    });

    describe('addScore', () => {
        beforeEach(() => {
            gameScene.score = 0;
            gameScene.scoreText = { setText: vi.fn() };
        });

        it('increments score and updates display', () => {
            gameScene.addScore(25);
            expect(gameScene.score).toBe(25);
            expect(gameScene.scoreText.setText).toHaveBeenCalledWith('SCORE: 25');
        });

        it('accumulates across multiple calls', () => {
            gameScene.addScore(10);
            gameScene.addScore(20);
            gameScene.addScore(30);
            expect(gameScene.score).toBe(60);
        });
    });

    describe('checkStartGame', () => {
        beforeEach(() => {
            gameScene.init({ night: 1 });
        });

        it('starts game when 2 players connected and not yet started', () => {
            gameScene.playersConnected = 2;
            gameScene.gameStarted = false;
            gameScene.checkStartGame();
            expect(gameScene.gameStarted).toBe(true);
            expect(gameScene.time.delayedCall).toHaveBeenCalled();
        });

        it('does nothing when fewer than 2 players', () => {
            gameScene.playersConnected = 1;
            gameScene.checkStartGame();
            expect(gameScene.gameStarted).toBe(false);
        });

        it('does nothing when game already started', () => {
            gameScene.playersConnected = 2;
            gameScene.gameStarted = true;
            gameScene.time.delayedCall.mockClear();
            gameScene.checkStartGame();
            expect(gameScene.time.delayedCall).not.toHaveBeenCalled();
        });
    });

    describe('updateHarmonyMeter', () => {
        beforeEach(() => {
            gameScene.harmonyMeter = 0;
            gameScene.harmonyBar = {
                clear: vi.fn(),
                fillStyle: vi.fn(),
                fillRect: vi.fn(),
            };
        });

        it('clamps value to max 100', () => {
            gameScene.updateHarmonyMeter(150);
            expect(gameScene.harmonyMeter).toBe(100);
        });

        it('clamps value to min 0', () => {
            gameScene.updateHarmonyMeter(-20);
            expect(gameScene.harmonyMeter).toBe(0);
        });

        it('uses cyan color when value < 50', () => {
            gameScene.updateHarmonyMeter(30);
            expect(gameScene.harmonyBar.fillStyle).toHaveBeenCalledWith(0x00bcd4, 0.9);
        });

        it('uses orange color when value >= 50', () => {
            gameScene.updateHarmonyMeter(75);
            expect(gameScene.harmonyBar.fillStyle).toHaveBeenCalledWith(0xff9800, 0.9);
        });
    });

    describe('startNextWave', () => {
        beforeEach(() => {
            gameScene.currentWave = 0;
            gameScene.waveInProgress = false;
            gameScene.enemiesSpawned = 5;
            gameScene.enemiesKilled = 3;
        });

        it('increments wave counter and sets flags', () => {
            gameScene.startNextWave();
            expect(gameScene.currentWave).toBe(1);
            expect(gameScene.waveInProgress).toBe(true);
            expect(gameScene.enemiesSpawned).toBe(0);
            expect(gameScene.enemiesKilled).toBe(0);
        });

        it('creates wave announcement text', () => {
            gameScene.startNextWave();
            expect(gameScene.add.text).toHaveBeenCalledWith(
                expect.any(Number),
                expect.any(Number),
                'WAVE 1',
                expect.any(Object)
            );
        });

        it('sets up spawn timer', () => {
            gameScene.startNextWave();
            expect(gameScene.time.addEvent).toHaveBeenCalled();
        });
    });

    describe('completeWave', () => {
        beforeEach(() => {
            gameScene.currentWave = 2;
            gameScene.waveInProgress = true;
            gameScene.waveTimer = { remove: vi.fn() };
            gameScene.score = 0;
            gameScene.scoreText = { setText: vi.fn() };
        });

        it('resets wave state', () => {
            gameScene.completeWave();
            expect(gameScene.waveInProgress).toBe(false);
        });

        it('removes wave timer', () => {
            gameScene.completeWave();
            expect(gameScene.waveTimer.remove).toHaveBeenCalled();
        });

        it('awards wave bonus (wave * 50)', () => {
            gameScene.completeWave();
            expect(gameScene.score).toBe(100); // wave 2 * 50
        });

        it('schedules next wave after delay', () => {
            gameScene.completeWave();
            const calls = gameScene.time.delayedCall.mock.calls;
            const nextWaveCall = calls.find(c => c[0] === 4000);
            expect(nextWaveCall).toBeDefined();
        });
    });

    describe('hitEnemy', () => {
        beforeEach(() => {
            gameScene.score = 0;
            gameScene.scoreText = { setText: vi.fn() };
            gameScene.harmonyMeter = 0;
            gameScene.harmonyBar = { clear: vi.fn(), fillStyle: vi.fn(), fillRect: vi.fn() };
            gameScene.enemiesKilled = 0;
        });

        it('awards points and destroys projectile on kill', () => {
            const mockContainer = { id: 'test' };
            const mockEnemy = {
                container: mockContainer,
                stats: { points: 25 },
                takeDamage: vi.fn(() => true),
            };
            gameScene.enemyList = [mockEnemy];

            const projectile = { destroy: vi.fn() };
            gameScene.hitEnemy(projectile, mockContainer);

            expect(gameScene.score).toBe(25);
            expect(gameScene.enemiesKilled).toBe(1);
            expect(projectile.destroy).toHaveBeenCalled();
        });

        it('updates harmony meter by 5 on kill', () => {
            const mockContainer = { id: 'test' };
            const mockEnemy = {
                container: mockContainer,
                stats: { points: 10 },
                takeDamage: vi.fn(() => true),
            };
            gameScene.enemyList = [mockEnemy];

            gameScene.hitEnemy({ destroy: vi.fn() }, mockContainer);
            expect(gameScene.harmonyMeter).toBe(5);
        });

        it('removes enemy from enemyList on kill', () => {
            const mockContainer = { id: 'test' };
            const mockEnemy = {
                container: mockContainer,
                stats: { points: 10 },
                takeDamage: vi.fn(() => true),
            };
            gameScene.enemyList = [mockEnemy];

            gameScene.hitEnemy({ destroy: vi.fn() }, mockContainer);
            expect(gameScene.enemyList).not.toContain(mockEnemy);
        });
    });

    describe('blockEnemy', () => {
        beforeEach(() => {
            gameScene.score = 0;
            gameScene.scoreText = { setText: vi.fn() };
            gameScene.harmonyMeter = 0;
            gameScene.harmonyBar = { clear: vi.fn(), fillStyle: vi.fn(), fillRect: vi.fn() };
            gameScene.enemiesKilled = 0;
        });

        it('awards 1.5x points on block kill', () => {
            const mockContainer = { id: 'test' };
            const mockEnemy = {
                container: mockContainer,
                stats: { points: 10 },
                takeDamage: vi.fn(() => true),
            };
            gameScene.enemyList = [mockEnemy];

            const keeperContainer = { x: 100, y: 200 };
            gameScene.blockEnemy(keeperContainer, mockContainer);

            expect(gameScene.score).toBe(15); // 10 * 1.5
        });

        it('updates harmony meter by 10 on block kill', () => {
            const mockContainer = { id: 'test' };
            const mockEnemy = {
                container: mockContainer,
                stats: { points: 10 },
                takeDamage: vi.fn(() => true),
            };
            gameScene.enemyList = [mockEnemy];

            gameScene.blockEnemy({ x: 0, y: 0 }, mockContainer);
            expect(gameScene.harmonyMeter).toBe(10);
        });
    });

    describe('addRemotePlayer', () => {
        beforeEach(() => {
            gameScene.init({ night: 1 });
        });

        it('rejects null player info', () => {
            gameScene.addRemotePlayer(null);
            expect(Object.keys(gameScene.remotePlayers)).toHaveLength(0);
        });

        it('rejects player info without id', () => {
            gameScene.addRemotePlayer({ playerType: 'striker' });
            expect(Object.keys(gameScene.remotePlayers)).toHaveLength(0);
        });

        it('does not duplicate existing remote player', () => {
            gameScene.remotePlayers['abc'] = { player: {}, playerType: 'striker' };
            gameScene.addRemotePlayer({ id: 'abc', playerType: 'striker', x: 100, y: 200 });
            // Should still be the original, not overwritten
            expect(gameScene.remotePlayers['abc'].player).toEqual({});
        });
    });
});
