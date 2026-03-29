import Phaser from 'phaser';

export default class Striker {
    constructor(scene, x, y, isRemote = false) {
        this.scene = scene;
        this.isRemote = isRemote;

        // Create a container to hold all visual elements
        this.container = scene.add.container(x, y);

        // Create unique texture key for this instance
        const textureKey = `striker-${Date.now()}-${Math.random()}`;

        // Only generate texture if it doesn't exist
        if (!scene.textures.exists(textureKey)) {
            const graphics = scene.add.graphics();
            this.drawCharacter(graphics);
            graphics.generateTexture(textureKey, 50, 70);
            graphics.destroy();
        }

        // Create sprite from the generated texture
        this.sprite = scene.add.sprite(0, 0, textureKey);
        this.container.add(this.sprite);

        // Physics body on the container
        scene.physics.add.existing(this.container);
        this.container.body.setCollideWorldBounds(true);
        this.container.body.setSize(40, 60);
        this.container.body.setOffset(-20, -35);

        // Set depth to be visible
        this.container.setDepth(75);

        // Movement properties
        this.speed = 250;

        // Combat properties
        this.canShoot = true;
        this.shootCooldown = 300; // milliseconds

        // Input setup (WASD + Space) - only for local player
        if (!isRemote) {
            this.cursors = scene.input.keyboard.addKeys({
                up: Phaser.Input.Keyboard.KeyCodes.W,
                down: Phaser.Input.Keyboard.KeyCodes.S,
                left: Phaser.Input.Keyboard.KeyCodes.A,
                right: Phaser.Input.Keyboard.KeyCodes.D,
                shoot: Phaser.Input.Keyboard.KeyCodes.SPACE
            });
        }

        // Projectiles group (regular group - NOT physics group, to avoid resetting ball body config)
        this.projectiles = scene.add.group();

        // Aura effect
        this.aura = scene.add.circle(0, 0, 35, 0xff6b6b, 0.2);
        this.container.add(this.aura);
        scene.tweens.add({
            targets: this.aura,
            scaleX: 1.3,
            scaleY: 1.3,
            alpha: 0.1,
            duration: 1000,
            yoyo: true,
            repeat: -1
        });

        // Health system
        this.health = 100;
        this.maxHealth = 100;
        this.isInvincible = false;

        // Health bar (above label)
        this.healthBarBg = scene.add.graphics();
        this.healthBarBg.fillStyle(0x330000, 0.8);
        this.healthBarBg.fillRect(-20, -65, 40, 5);
        this.container.add(this.healthBarBg);

        this.healthBarFg = scene.add.graphics();
        this.healthBarFg.fillStyle(0x00ff00, 1);
        this.healthBarFg.fillRect(-20, -65, 40, 5);
        this.container.add(this.healthBarFg);

        // Label
        this.label = scene.add.text(0, -50, isRemote ? 'STRIKER P2' : 'STRIKER P1', {
            font: 'bold 14px Arial',
            fill: '#ff6b6b',
            stroke: '#000000',
            strokeThickness: 3
        });
        this.label.setOrigin(0.5);
        this.container.add(this.label);
    }

    drawCharacter(graphics) {
        // Head (skin tone)
        graphics.fillStyle(0xffdbac, 1);
        graphics.fillCircle(25, 15, 15);

        // Body (red jersey - striker colors)
        graphics.fillStyle(0xff1744, 1);
        graphics.fillRect(10, 30, 30, 35);

        // Legs (shorts)
        graphics.fillStyle(0x000000, 1);
        graphics.fillRect(13, 65, 10, 5);
        graphics.fillRect(27, 65, 10, 5);

        // Hair (anime style - spiky)
        graphics.fillStyle(0x2196f3, 1);
        graphics.fillCircle(20, 5, 8);
        graphics.fillCircle(30, 5, 8);
        graphics.fillCircle(25, 3, 8);

        // Eyes (simple anime eyes)
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(20, 15, 3);
        graphics.fillCircle(30, 15, 3);
        graphics.fillStyle(0x000000, 1);
        graphics.fillCircle(20, 15, 2);
        graphics.fillCircle(30, 15, 2);
    }

    update() {
        // Only handle input for local player
        if (!this.isRemote && this.cursors) {
            // Movement
            let velocityX = 0;
            let velocityY = 0;

            if (this.cursors.left.isDown) {
                velocityX = -this.speed;
            } else if (this.cursors.right.isDown) {
                velocityX = this.speed;
            }

            if (this.cursors.up.isDown) {
                velocityY = -this.speed;
            } else if (this.cursors.down.isDown) {
                velocityY = this.speed;
            }

            this.container.body.setVelocity(velocityX, velocityY);

            // Shooting
            if (this.cursors.shoot.isDown && this.canShoot) {
                console.log('🎯 Striker shooting!');
                this.shoot();
            }

            // Emit position to server for multiplayer sync
            if (this.scene.socket) {
                this.scene.socket.emit('playerMovement', {
                    x: this.container.x,
                    y: this.container.y,
                    playerType: 'striker'
                });
            }
        }
    }

    // Update position from network (for remote players)
    setPosition(x, y) {
        this.container.x = x;
        this.container.y = y;
    }

    shoot() {
        this.canShoot = false;

        // Get the current world position of the striker
        const worldX = this.container.x;
        const worldY = this.container.y;

        // Create ball texture if it doesn't exist
        if (!this.scene.textures.exists('ball')) {
            const graphics = this.scene.add.graphics();
            graphics.fillStyle(0xffffff, 1);
            graphics.fillCircle(12, 12, 12);
            graphics.lineStyle(2, 0xff6b6b, 1);
            graphics.strokeCircle(12, 12, 12);
            graphics.generateTexture('ball', 24, 24);
            graphics.destroy();
        }

        // Create ball as a physics sprite
        const ball = this.scene.physics.add.sprite(worldX, worldY - 20, 'ball');
        ball.setDepth(100);
        ball.body.setAllowGravity(false);
        ball.body.setCollideWorldBounds(false);
        ball.body.setVelocity(0, -500);
        this.projectiles.add(ball);

        // Auto-destroy ball after it travels off screen
        this.scene.time.delayedCall(2000, () => {
            if (ball && ball.active) {
                ball.destroy();
                console.log('⚽ Ball destroyed');
            }
        });

        // Cooldown
        this.scene.time.delayedCall(this.shootCooldown, () => {
            this.canShoot = true;
        });

        // Emit shoot event for multiplayer sync
        if (this.scene.socket) {
            this.scene.socket.emit('playerShoot', { x: worldX, y: worldY });
        }

        // Visual feedback
        this.aura.setAlpha(0.5);
        this.scene.tweens.add({
            targets: this.aura,
            alpha: 0.2,
            duration: 200
        });
    }

    // Create a visual-only ball for remote player's shoot (seen by other players)
    shootRemote(x, y) {
        if (!this.scene.textures.exists('ball')) {
            const graphics = this.scene.add.graphics();
            graphics.fillStyle(0xffffff, 1);
            graphics.fillCircle(12, 12, 12);
            graphics.lineStyle(2, 0xff6b6b, 1);
            graphics.strokeCircle(12, 12, 12);
            graphics.generateTexture('ball', 24, 24);
            graphics.destroy();
        }

        const ball = this.scene.physics.add.sprite(x, y - 20, 'ball');
        ball.setDepth(100);
        this.projectiles.add(ball);
        ball.body.setAllowGravity(false);
        ball.body.setCollideWorldBounds(false);
        ball.body.setVelocity(0, -500);

        this.scene.time.delayedCall(2000, () => {
            if (ball && ball.active) { ball.destroy(); }
        });
    }

    takeDamage(amount) {
        if (this.isInvincible) return false;

        this.health = Math.max(0, this.health - amount);
        this.updateHealthBar();

        // Flash effect
        this.isInvincible = true;
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0.3,
            duration: 100,
            yoyo: true,
            repeat: 5,
            onComplete: () => {
                if (this.sprite && this.sprite.active) this.sprite.setAlpha(1);
            }
        });

        // End invincibility after 1 second
        this.scene.time.delayedCall(1000, () => {
            this.isInvincible = false;
        });

        return this.health <= 0;
    }

    setHealth(value) {
        this.health = Math.max(0, value);
        this.updateHealthBar();
    }

    updateHealthBar() {
        this.healthBarFg.clear();
        const ratio = this.health / this.maxHealth;
        let color = 0x00ff00;
        if (ratio < 0.3) color = 0xff0000;
        else if (ratio < 0.6) color = 0xffaa00;
        this.healthBarFg.fillStyle(color, 1);
        this.healthBarFg.fillRect(-20, -65, 40 * ratio, 5);
    }

    respawn(x, y) {
        this.health = this.maxHealth;
        this.updateHealthBar();
        this.container.x = x;
        this.container.y = y;
        this.isInvincible = false;
        this.sprite.setAlpha(1);
    }

    destroy() {
        this.container.destroy();
        this.projectiles.clear(true, true);
    }
}
