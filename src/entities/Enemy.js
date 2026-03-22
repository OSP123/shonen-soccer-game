import Phaser from 'phaser';
import { getEnemyStats } from '../utils/enemyTypes.js';

export default class Enemy {
    constructor(scene, x, y, type = 'shadow') {
        this.scene = scene;
        this.type = type;
        this.container = scene.add.container(x, y);

        this.stats = getEnemyStats(type);
        this.health = this.stats.health;

        // Create unique texture key
        const textureKey = `enemy-${type}-${Date.now()}-${Math.random()}`;

        if (!scene.textures.exists(textureKey)) {
            const graphics = scene.add.graphics();
            this.drawEnemy(graphics, this.stats.color, this.stats.size);
            graphics.generateTexture(textureKey, this.stats.size * 2, this.stats.size * 2);
            graphics.destroy();
        }

        // Create sprite
        this.sprite = scene.add.sprite(0, 0, textureKey);
        this.container.add(this.sprite);

        // Set depth to be visible above field but below UI
        this.container.setDepth(50);

        // Physics
        scene.physics.add.existing(this.container);
        this.container.body.setSize(this.stats.size, this.stats.size);
        this.container.body.setVelocity(0, this.stats.speed);

        // Dark aura effect
        this.aura = scene.add.circle(0, 0, this.stats.size + 10, this.stats.color, 0.3);
        this.container.add(this.aura);
        this.container.sendToBack(this.aura);

        scene.tweens.add({
            targets: this.aura,
            scaleX: 1.4,
            scaleY: 1.4,
            alpha: 0.1,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Floating animation
        scene.tweens.add({
            targets: this.sprite,
            y: -5,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    drawEnemy(graphics, color, size) {
        // Main body (menacing shape)
        graphics.fillStyle(color, 1);
        graphics.fillCircle(size, size, size * 0.8);

        // Eyes (glowing)
        graphics.fillStyle(0xff0000, 1);
        graphics.fillCircle(size - 8, size - 5, 4);
        graphics.fillCircle(size + 8, size - 5, 4);

        // Dark energy wisps
        graphics.fillStyle(0x000000, 0.5);
        graphics.fillCircle(size - 15, size + 10, 6);
        graphics.fillCircle(size + 15, size + 10, 6);
        graphics.fillCircle(size, size + 15, 8);
    }

    takeDamage(amount = 1) {
        this.health -= amount;

        // Flash effect
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0.3,
            duration: 100,
            yoyo: true
        });

        if (this.health <= 0) {
            this.die();
            return true; // Enemy destroyed
        }
        return false; // Enemy still alive
    }

    die() {
        // Death animation
        this.scene.tweens.add({
            targets: this.container,
            scaleX: 0,
            scaleY: 0,
            alpha: 0,
            angle: 360,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                this.destroy();
            }
        });

        // Particle burst effect
        for (let i = 0; i < 8; i++) {
            const particle = this.scene.add.circle(
                this.container.x,
                this.container.y,
                3,
                this.stats.color,
                0.8
            );

            const angle = (Math.PI * 2 * i) / 8;
            const speed = 150;

            this.scene.tweens.add({
                targets: particle,
                x: particle.x + Math.cos(angle) * 50,
                y: particle.y + Math.sin(angle) * 50,
                alpha: 0,
                duration: 500,
                onComplete: () => particle.destroy()
            });
        }
    }

    update() {
        // Check if enemy reached the shrine (bottom of screen)
        if (this.container.y > this.scene.cameras.main.height - 100) {
            this.scene.damageShrine(this.stats.damage);
            this.destroy();
        }
    }

    destroy() {
        if (this.container && this.container.active) {
            this.container.destroy();
        }
    }

    getContainer() {
        return this.container;
    }
}
