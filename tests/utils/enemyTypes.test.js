import { describe, it, expect } from 'vitest';
import { ENEMY_TYPES, getEnemyStats } from '../../src/utils/enemyTypes.js';

describe('ENEMY_TYPES', () => {
    it('has three enemy types defined', () => {
        expect(Object.keys(ENEMY_TYPES)).toEqual(['shadow', 'chaos', 'void']);
    });
});

describe('getEnemyStats', () => {
    it('returns shadow stats for "shadow" type', () => {
        const stats = getEnemyStats('shadow');
        expect(stats.health).toBe(1);
        expect(stats.speed).toBe(80);
        expect(stats.damage).toBe(5);
        expect(stats.points).toBe(10);
        expect(stats.size).toBe(30);
        expect(stats.name).toBe('Shadow Demon');
    });

    it('returns chaos stats for "chaos" type', () => {
        const stats = getEnemyStats('chaos');
        expect(stats.health).toBe(2);
        expect(stats.speed).toBe(120);
        expect(stats.damage).toBe(10);
        expect(stats.points).toBe(25);
        expect(stats.size).toBe(35);
        expect(stats.name).toBe('Chaos Striker');
    });

    it('returns void stats for "void" type', () => {
        const stats = getEnemyStats('void');
        expect(stats.health).toBe(3);
        expect(stats.speed).toBe(60);
        expect(stats.damage).toBe(15);
        expect(stats.points).toBe(40);
        expect(stats.size).toBe(45);
        expect(stats.name).toBe('Void Keeper');
    });

    it('falls back to shadow stats for unknown type', () => {
        const stats = getEnemyStats('nonexistent');
        expect(stats).toEqual(ENEMY_TYPES.shadow);
    });

    it('falls back to shadow stats for undefined type', () => {
        const stats = getEnemyStats(undefined);
        expect(stats).toEqual(ENEMY_TYPES.shadow);
    });
});
