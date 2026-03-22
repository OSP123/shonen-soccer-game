import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockScene } from '../__mocks__/createMockScene.js';
import Keeper from '../../src/entities/Keeper.js';

describe('Keeper', () => {
    let scene;

    beforeEach(() => {
        scene = createMockScene();
    });

    describe('constructor', () => {
        it('initializes with correct default properties', () => {
            const keeper = new Keeper(scene, 100, 200);
            expect(keeper.speed).toBe(220);
            expect(keeper.isBlocking).toBe(false);
            expect(keeper.canBlock).toBe(true);
            expect(keeper.blockDuration).toBe(500);
            expect(keeper.blockCooldown).toBe(1000);
        });

        it('creates container at given position', () => {
            new Keeper(scene, 300, 400);
            expect(scene.add.container).toHaveBeenCalledWith(300, 400);
        });

        it('sets up cursor keys and block key for local player', () => {
            const keeper = new Keeper(scene, 100, 200, false);
            expect(scene.input.keyboard.createCursorKeys).toHaveBeenCalled();
            expect(scene.input.keyboard.addKey).toHaveBeenCalled();
            expect(keeper.cursors).toBeDefined();
            expect(keeper.blockKey).toBeDefined();
        });

        it('does NOT set up input for remote player', () => {
            const keeper = new Keeper(scene, 100, 200, true);
            expect(scene.input.keyboard.createCursorKeys).not.toHaveBeenCalled();
            expect(keeper.cursors).toBeUndefined();
        });

        it('creates physics body with correct dimensions', () => {
            const keeper = new Keeper(scene, 100, 200);
            expect(scene.physics.add.existing).toHaveBeenCalledWith(keeper.container);
            expect(keeper.container.body.setSize).toHaveBeenCalledWith(40, 60);
            expect(keeper.container.body.setOffset).toHaveBeenCalledWith(-20, -35);
        });

        it('sets depth to 75', () => {
            const keeper = new Keeper(scene, 100, 200);
            expect(keeper.container.setDepth).toHaveBeenCalledWith(75);
        });
    });

    describe('update', () => {
        it('sets velocity from left key', () => {
            const keeper = new Keeper(scene, 100, 200);
            keeper.cursors.left.isDown = true;
            keeper.update();
            expect(keeper.container.body.setVelocity).toHaveBeenCalledWith(-220, 0);
        });

        it('sets velocity from right+down keys', () => {
            const keeper = new Keeper(scene, 100, 200);
            keeper.cursors.right.isDown = true;
            keeper.cursors.down.isDown = true;
            keeper.update();
            expect(keeper.container.body.setVelocity).toHaveBeenCalledWith(220, 220);
        });

        it('sets zero velocity when no keys pressed', () => {
            const keeper = new Keeper(scene, 100, 200);
            keeper.update();
            expect(keeper.container.body.setVelocity).toHaveBeenCalledWith(0, 0);
        });

        it('does nothing for remote players', () => {
            const keeper = new Keeper(scene, 100, 200, true);
            keeper.update();
            expect(keeper.container.body.setVelocity).not.toHaveBeenCalled();
        });

        it('calls startBlock when blockKey is down and canBlock', () => {
            const keeper = new Keeper(scene, 100, 200);
            const startBlockSpy = vi.spyOn(keeper, 'startBlock');
            keeper.blockKey.isDown = true;
            keeper.canBlock = true;
            keeper.isBlocking = false;
            keeper.update();
            expect(startBlockSpy).toHaveBeenCalled();
        });

        it('does NOT block when already blocking', () => {
            const keeper = new Keeper(scene, 100, 200);
            const startBlockSpy = vi.spyOn(keeper, 'startBlock');
            keeper.blockKey.isDown = true;
            keeper.isBlocking = true;
            keeper.update();
            expect(startBlockSpy).not.toHaveBeenCalled();
        });

        it('emits position to socket when connected', () => {
            const keeper = new Keeper(scene, 100, 200);
            scene.socket = { emit: vi.fn() };
            keeper.update();
            expect(scene.socket.emit).toHaveBeenCalledWith('playerMovement', {
                x: keeper.container.x,
                y: keeper.container.y,
                playerType: 'keeper'
            });
        });
    });

    describe('startBlock', () => {
        it('sets blocking state and reduces speed', () => {
            const keeper = new Keeper(scene, 100, 200);
            keeper.startBlock();
            expect(keeper.isBlocking).toBe(true);
            expect(keeper.canBlock).toBe(false);
            expect(keeper.speed).toBe(100);
        });

        it('creates shield animation tween', () => {
            const keeper = new Keeper(scene, 100, 200);
            scene.tweens.add.mockClear();
            keeper.startBlock();
            expect(scene.tweens.add).toHaveBeenCalled();
        });

        it('schedules endBlock after blockDuration', () => {
            const keeper = new Keeper(scene, 100, 200);
            scene.time.delayedCall.mockClear();
            keeper.startBlock();
            expect(scene.time.delayedCall).toHaveBeenCalledWith(500, expect.any(Function));
        });
    });

    describe('endBlock', () => {
        it('restores state after blocking', () => {
            const keeper = new Keeper(scene, 100, 200);
            keeper.isBlocking = true;
            keeper.speed = 100;
            keeper.endBlock();
            expect(keeper.isBlocking).toBe(false);
            expect(keeper.speed).toBe(220);
        });

        it('creates shield hide animation', () => {
            const keeper = new Keeper(scene, 100, 200);
            scene.tweens.add.mockClear();
            keeper.endBlock();
            expect(scene.tweens.add).toHaveBeenCalled();
        });

        it('schedules cooldown timer', () => {
            const keeper = new Keeper(scene, 100, 200);
            scene.time.delayedCall.mockClear();
            keeper.endBlock();
            expect(scene.time.delayedCall).toHaveBeenCalledWith(1000, expect.any(Function));
        });
    });

    describe('setPosition', () => {
        it('updates container coordinates', () => {
            const keeper = new Keeper(scene, 100, 200);
            keeper.setPosition(500, 300);
            expect(keeper.container.x).toBe(500);
            expect(keeper.container.y).toBe(300);
        });
    });

    describe('destroy', () => {
        it('destroys the container', () => {
            const keeper = new Keeper(scene, 100, 200);
            keeper.destroy();
            expect(keeper.container.destroy).toHaveBeenCalled();
        });
    });
});
