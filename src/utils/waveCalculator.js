export function calculateWaveEnemies(waveNumber) {
    return 5 + (waveNumber - 1) * 3;
}

export function calculateSpawnInterval(waveNumber) {
    return Math.max(800, 2000 - waveNumber * 100);
}

export function selectEnemyType(waveNumber, rand = Math.random()) {
    if (waveNumber >= 3) {
        if (rand < 0.5) return 'shadow';
        if (rand < 0.8) return 'chaos';
        return 'void';
    }
    if (waveNumber >= 2) {
        return rand < 0.7 ? 'shadow' : 'chaos';
    }
    return 'shadow';
}

export function calculateWaveBonus(waveNumber) {
    return waveNumber * 50;
}

export function calculateBlockScore(basePoints) {
    return basePoints * 1.5;
}
