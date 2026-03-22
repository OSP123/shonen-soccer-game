import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockScene } from '../__mocks__/createMockScene.js';
import BootScene from '../../src/scenes/BootScene.js';

describe('BootScene', () => {
    let bootScene;

    beforeEach(() => {
        bootScene = new BootScene();
        const mockScene = createMockScene();
        Object.assign(bootScene, mockScene);
        // BootScene.preload uses this.make.text
        bootScene.make = {
            text: vi.fn(() => ({
                setOrigin: vi.fn(),
            })),
        };
    });

    describe('preload', () => {
        it('sets up loading progress handler', () => {
            bootScene.preload();
            expect(bootScene.load.on).toHaveBeenCalledWith('progress', expect.any(Function));
        });

        it('loads placeholder image asset', () => {
            bootScene.preload();
            expect(bootScene.load.image).toHaveBeenCalledWith('temp-player', expect.any(String));
        });

        it('creates progress bar graphics', () => {
            bootScene.preload();
            expect(bootScene.add.graphics).toHaveBeenCalled();
        });
    });

    describe('create', () => {
        it('transitions to MainMenuScene', () => {
            bootScene.create();
            expect(bootScene.scene.start).toHaveBeenCalledWith('MainMenuScene');
        });
    });
});
