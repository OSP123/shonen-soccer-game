export default {
    Scene: class Scene {
        constructor(config) { this.config = config; }
    },
    Input: {
        Keyboard: {
            KeyCodes: {
                W: 87, S: 83, A: 65, D: 68,
                SPACE: 32, SHIFT: 16,
                UP: 38, DOWN: 40, LEFT: 37, RIGHT: 39,
            },
        },
    },
    Math: {
        Between: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
        Clamp: (val, min, max) => Math.min(Math.max(val, min), max),
    },
    AUTO: 0,
    Game: class Game { constructor() {} },
};
