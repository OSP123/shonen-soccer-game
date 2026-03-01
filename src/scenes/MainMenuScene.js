import Phaser from 'phaser';

export default class MainMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenuScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Background effect - animated stars
        this.createStarfield();

        // Title
        const title = this.add.text(width / 2, 120, 'SPIRIT STADIUM', {
            font: 'bold 72px Arial',
            fill: '#ffffff',
            stroke: '#764ba2',
            strokeThickness: 8
        });
        title.setOrigin(0.5);

        const subtitle = this.add.text(width / 2, 200, 'CHAMPIONSHIP', {
            font: 'bold 48px Arial',
            fill: '#ffeb3b',
            stroke: '#ff6f00',
            strokeThickness: 6
        });
        subtitle.setOrigin(0.5);

        // Story text
        const storyText = this.add.text(width / 2, 300,
            'You have been chosen by the Spirit Realm...\n' +
            'Defend the Sacred Shrine for 7 Celestial Nights\n' +
            'and become legendary Spirit Champions!',
            {
                font: '20px Arial',
                fill: '#ffffff',
                align: 'center',
                lineSpacing: 10
            }
        );
        storyText.setOrigin(0.5);

        // Start button
        const startButton = this.add.text(width / 2, 480, '▶ START CHAMPIONSHIP', {
            font: 'bold 32px Arial',
            fill: '#00ff00',
            stroke: '#003300',
            strokeThickness: 4
        });
        startButton.setOrigin(0.5);
        startButton.setInteractive({ useHandCursor: true });

        // Button hover effect
        startButton.on('pointerover', () => {
            startButton.setScale(1.1);
            startButton.setFill('#00ffff');
        });

        startButton.on('pointerout', () => {
            startButton.setScale(1);
            startButton.setFill('#00ff00');
        });

        startButton.on('pointerdown', () => {
            this.cameras.main.fade(500, 0, 0, 0);
            this.time.delayedCall(500, () => {
                this.scene.start('GameScene', { night: 1 });
            });
        });

        // Controls info
        const controlsText = this.add.text(width / 2, 580,
            '🌐 MULTIPLAYER: Player 1 = Striker (WASD + SPACE) | Player 2 = Keeper (ARROWS + SHIFT)',
            {
                font: '16px Arial',
                fill: '#aaaaaa',
                align: 'center'
            }
        );
        controlsText.setOrigin(0.5);

        // Multiplayer tip
        const multiplayerTip = this.add.text(width / 2, 620,
            'Open in TWO browser windows to play together!',
            {
                font: 'bold 14px Arial',
                fill: '#00ffff',
                align: 'center'
            }
        );
        multiplayerTip.setOrigin(0.5);

        // Pulsing animation for title
        this.tweens.add({
            targets: title,
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Glowing effect for start button
        this.tweens.add({
            targets: startButton,
            alpha: 0.7,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    createStarfield() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Create multiple layers of stars for parallax effect
        for (let i = 0; i < 100; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height);
            const star = this.add.circle(x, y, Phaser.Math.Between(1, 3), 0xffffff, 0.8);

            // Twinkling animation
            this.tweens.add({
                targets: star,
                alpha: 0.2,
                duration: Phaser.Math.Between(1000, 3000),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }
}
