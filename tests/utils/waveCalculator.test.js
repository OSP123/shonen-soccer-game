import { describe, it, expect } from 'vitest';
import {
    calculateWaveEnemies,
    calculateSpawnInterval,
    selectEnemyType,
    calculateWaveBonus,
    calculateBlockScore,
} from '../../src/utils/waveCalculator.js';

describe('calculateWaveEnemies', () => {
    it('returns 5 enemies for wave 1', () => {
        expect(calculateWaveEnemies(1)).toBe(5);
    });

    it('returns 8 enemies for wave 2', () => {
        expect(calculateWaveEnemies(2)).toBe(8);
    });

    it('returns 11 enemies for wave 3', () => {
        expect(calculateWaveEnemies(3)).toBe(11);
    });

    it('scales correctly for high waves', () => {
        expect(calculateWaveEnemies(10)).toBe(32);
    });
});

describe('calculateSpawnInterval', () => {
    it('returns 1900ms for wave 1', () => {
        expect(calculateSpawnInterval(1)).toBe(1900);
    });

    it('returns 1800ms for wave 2', () => {
        expect(calculateSpawnInterval(2)).toBe(1800);
    });

    it('clamps to minimum 800ms for high waves', () => {
        expect(calculateSpawnInterval(20)).toBe(800);
        expect(calculateSpawnInterval(100)).toBe(800);
    });
});

describe('selectEnemyType', () => {
    it('always returns shadow for wave 1', () => {
        expect(selectEnemyType(1, 0.0)).toBe('shadow');
        expect(selectEnemyType(1, 0.5)).toBe('shadow');
        expect(selectEnemyType(1, 0.99)).toBe('shadow');
    });

    it('returns shadow or chaos for wave 2', () => {
        expect(selectEnemyType(2, 0.3)).toBe('shadow');
        expect(selectEnemyType(2, 0.8)).toBe('chaos');
    });

    it('returns shadow, chaos, or void for wave 3+', () => {
        expect(selectEnemyType(3, 0.2)).toBe('shadow');
        expect(selectEnemyType(3, 0.6)).toBe('chaos');
        expect(selectEnemyType(3, 0.9)).toBe('void');
    });

    it('uses 0.7 threshold for wave 2 shadow/chaos split', () => {
        expect(selectEnemyType(2, 0.69)).toBe('shadow');
        expect(selectEnemyType(2, 0.71)).toBe('chaos');
    });
});

describe('calculateWaveBonus', () => {
    it('returns wave * 50', () => {
        expect(calculateWaveBonus(1)).toBe(50);
        expect(calculateWaveBonus(3)).toBe(150);
        expect(calculateWaveBonus(10)).toBe(500);
    });
});

describe('calculateBlockScore', () => {
    it('returns 1.5x the base points', () => {
        expect(calculateBlockScore(10)).toBe(15);
        expect(calculateBlockScore(25)).toBe(37.5);
        expect(calculateBlockScore(40)).toBe(60);
    });
});
