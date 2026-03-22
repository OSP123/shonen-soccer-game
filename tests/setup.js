import { vi } from 'vitest';

vi.mock('phaser', async () => {
    const mock = await import('./__mocks__/phaser.js');
    return { default: mock.default, ...mock.default };
});

vi.mock('socket.io-client', () => ({
    default: vi.fn(() => ({
        on: vi.fn(),
        emit: vi.fn(),
        disconnect: vi.fn(),
    })),
}));
