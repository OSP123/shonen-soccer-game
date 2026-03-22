import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        port: 5555,
        strictPort: true
    },
    test: {
        globals: true,
        environment: 'node',
        include: ['tests/**/*.test.js'],
        coverage: {
            provider: 'v8',
            include: ['src/**/*.js', 'server.js'],
        },
        setupFiles: ['tests/setup.js'],
    }
});
