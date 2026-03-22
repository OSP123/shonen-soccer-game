import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockScene } from '../__mocks__/createMockScene.js';
import Enemy from '../../src/entities/Enemy.js';

describe('Enemy', () => {
    let scene;

    beforeEach(() => {
        scene = createMockScene();
    });

    describe('constructor', () => {
        it('defaults to shadow type with correct stats', () => {
            const enemy = new Enemy(scene, 100, 50);
            expect(enemy.type).toBe('shadow');
            expect(enemy.health).toBe(1);
            expect(enemy.stats.speed).toBe(80);
            expect(enemy.stats.damage).toBe(5);
            expect(enemy.stats.points).toBe(10);
        });

        it('creates chaos type with correct stats', () => {
            const enemy = new Enemy(scene, 100, 50, 'chaos');
            expect(enemy.type).toBe('chaos');
            expect(enemy.health).toBe(2);
            expect(enemy.stats.speed).toBe(120);
            expect(enemy.stats.damage).toBe(10);
            expect(enemy.stats.points).toBe(25);
        });

        it('creates void type with correct stats', () => {
            const enemy = new Enemy(scene, 100, 50, 'void');
            expect(enemy.type).toBe('void');
            expect(enemy.health).toBe(3);
            expect(enemy.stats.speed).toBe(60);
            expect(enemy.stats.damage).toBe(15);
            expect(enemy.stats.points).toBe(40);
        });

        it('falls back to shadow for unknown type', () => {
            const enemy = new Enemy(scene, 100, 50, 'bogus');
            expect(enemy.stats.speed).toBe(80);
            expect(enemy.stats.name).toBe('Shadow Demon');
        });

        it('creates container at given position', () => {
            new Enemy(scene, 200, 300);
            expect(scene.add.container).toHaveBeenCalledWith(200, 300);
        });

        it('sets downward velocity equal to type speed', () => {
            const enemy = new Enemy(scene, 100, 50, 'chaos');
            expect(enemy.container.body.setVelocity).toHaveBeenCalledWith(0, 120);
        });

        it('sets container depth to 50', () => {
            const enemy = new Enemy(scene, 100, 50);
            expect(enemy.container.setDepth).toHaveBeenCalledWith(50);
        });

        it('adds physics to container', () => {
            const enemy = new Enemy(scene, 100, 50);
            expect(scene.physics.add.existing).toHaveBeenCalledWith(enemy.container);
        });
    });

    describe('takeDamage', () => {
        it('reduces health by specified amount', () => {
            const enemy = new Enemy(scene, 100, 50, 'void');
            enemy.takeDamage(1);
            expect(enemy.health).toBe(2);
        });

        it('returns false when enemy survives', () => {
            const enemy = new Enemy(scene, 100, 50, 'chaos');
            const result = enemy.takeDamage(1);
            expect(result).toBe(false);
        });

        it('returns true when health reaches 0', () => {
            const enemy = new Enemy(scene, 100, 50, 'shadow');
            const result = enemy.takeDamage(1);
            expect(result).toBe(true);
        });

        it('calls die() when health reaches 0', () => {
            const enemy = new Enemy(scene, 100, 50, 'shadow');
            const dieSpy = vi.spyOn(enemy, 'die');
            enemy.takeDamage(1);
            expect(dieSpy).toHaveBeenCalled();
        });

        it('creates flash tween animation', () => {
            const enemy = new Enemy(scene, 100, 50, 'void');
            scene.tweens.add.mockClear();
            enemy.takeDamage(1);
            expect(scene.tweens.add).toHaveBeenCalled();
        });
    });

    describe('update', () => {
        it('calls damageShrine when enemy passes bottom threshold', () => {
            const enemy = new Enemy(scene, 100, 50, 'shadow');
            scene.damageShrine = vi.fn();
            enemy.container.y = 621; // > 720 - 100
            enemy.update();
            expect(scene.damageShrine).toHaveBeenCalledWith(5);
        });

        it('destroys itself when reaching shrine', () => {
            const enemy = new Enemy(scene, 100, 50, 'shadow');
            scene.damageShrine = vi.fn();
            enemy.container.y = 700;
            const destroySpy = vi.spyOn(enemy, 'destroy');
            enemy.update();
            expect(destroySpy).toHaveBeenCalled();
        });

        it('does not damage shrine when above threshold', () => {
            const enemy = new Enemy(scene, 100, 50);
            scene.damageShrine = vi.fn();
            enemy.container.y = 300;
            enemy.update();
            expect(scene.damageShrine).not.toHaveBeenCalled();
        });
    });

    describe('getContainer', () => {
        it('returns the container reference', () => {
            const enemy = new Enemy(scene, 100, 50);
            expect(enemy.getContainer()).toBe(enemy.container);
        });
    });

    describe('destroy', () => {
        it('destroys the container when active', () => {
            const enemy = new Enemy(scene, 100, 50);
            enemy.container.active = true;
            enemy.destroy();
            expect(enemy.container.destroy).toHaveBeenCalled();
        });

        it('does not destroy when container is inactive', () => {
            const enemy = new Enemy(scene, 100, 50);
            enemy.container.active = false;
            enemy.container.destroy.mockClear();
            enemy.destroy();
            expect(enemy.container.destroy).not.toHaveBeenCalled();
        });
    });
});
