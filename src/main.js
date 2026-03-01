import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import MainMenuScene from './scenes/MainMenuScene.js';
import GameScene from './scenes/GameScene.js';

const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    parent: 'game-container',
    backgroundColor: '#1a0033',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false // Set to true for development
        }
    },
    scene: [BootScene, MainMenuScene, GameScene]
};

const game = new Phaser.Game(config);

// Make game globally accessible for debugging
window.game = game;
