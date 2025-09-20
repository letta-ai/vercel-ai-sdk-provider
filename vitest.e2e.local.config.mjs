import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
    test: {
        environment: 'node',
        globals: true,
        include: ['**/*.e2e.local.ts', '**/*.e2e.local.tsx'],
    },
});
