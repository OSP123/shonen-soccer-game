import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockScene } from '../__mocks__/createMockScene.js';
import MainMenuScene from '../../src/scenes/MainMenuScene.js';

describe('MainMenuScene', () => {
    let menuScene;

    beforeEach(() => {
        menuScene = new MainMenuScene();
        const mockScene = createMockScene();
        Object.assign(menuScene, mockScene);
    });

    describe('create', () => {
        it('creates title text with correct content', () => {
            menuScene.create();
            const titleCall = menuScene.add.text.mock.calls.find(
                c => c[2] === 'SPIRIT STADIUM'
            );
            expect(titleCall).toBeDefined();
        });

        it('creates subtitle text', () => {
            menuScene.create();
            const subtitleCall = menuScene.add.text.mock.calls.find(
                c => c[2] === 'CHAMPIONSHIP'
            );
            expect(subtitleCall).toBeDefined();
        });

        it('creates interactive start button', () => {
            menuScene.create();
            const buttonCall = menuScene.add.text.mock.calls.find(
                c => typeof c[2] === 'string' && c[2].includes('START CHAMPIONSHIP')
            );
            expect(buttonCall).toBeDefined();
        });

        it('creates starfield with 100 stars', () => {
            menuScene.create();
            expect(menuScene.add.circle).toHaveBeenCalledTimes(100);
        });
    });

    describe('createStarfield', () => {
        it('creates 100 stars with twinkling animations', () => {
            menuScene.createStarfield();
            expect(menuScene.add.circle).toHaveBeenCalledTimes(100);
            expect(menuScene.tweens.add).toHaveBeenCalledTimes(100);
        });
    });
});
