export const ENEMY_TYPES = {
    shadow: {
        color: 0x6a1b9a,
        health: 1,
        speed: 80,
        damage: 5,
        points: 10,
        size: 30,
        name: 'Shadow Demon'
    },
    chaos: {
        color: 0xff3d00,
        health: 2,
        speed: 120,
        damage: 10,
        points: 25,
        size: 35,
        name: 'Chaos Striker'
    },
    void: {
        color: 0x1a237e,
        health: 3,
        speed: 60,
        damage: 15,
        points: 40,
        size: 45,
        name: 'Void Keeper'
    }
};

export function getEnemyStats(type) {
    return ENEMY_TYPES[type] || ENEMY_TYPES.shadow;
}
