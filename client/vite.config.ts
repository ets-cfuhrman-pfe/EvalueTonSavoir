import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import pluginChecker from 'vite-plugin-checker';
import EnvironmentPlugin from 'vite-plugin-environment';
import path from 'path';

console.log("⚡ Vite config is being loaded!");

// Filter out environment variables with invalid identifiers
const filteredEnv = Object.keys(process.env).reduce((acc, key) => {
    // Only include environment variables with valid JavaScript identifiers
    if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
        acc[key] = process.env[key];
    }
    return acc;
}, {});

// https://vitejs.dev/config/
export default defineConfig({
    base: "/",
    plugins: [
        react(),
        pluginChecker({ typescript: true }),
        EnvironmentPlugin(filteredEnv),
    ],
    resolve: {
        alias: {
          'src': '/src',
          '@shared': path.resolve(__dirname, '../server/shared')
        }
      },
    preview: {
        port: 5173,
        strictPort: true,
        allowedHosts: ['frontend', 'localhost'],
    },
    server: {
        port: 5173,
        strictPort: true,
        host: true,
        origin: "http://0.0.0.0:5173",
        allowedHosts: ['frontend', 'localhost'],
    },
    build: {
        sourcemap: true, // Enable source maps
        rollupOptions: {
            output: {
                sourcemapExcludeSources: true, // Exclude sources from source maps
            },
        },
    },
    css: {
        preprocessorOptions: {
            scss: {
                // Suppress deprecation warnings from Bootstrap
                quietDeps: true,
                silenceDeprecations: ['import', 'global-builtin', 'color-functions'],
                api: 'modern-compiler'
            }
        }
    }
});
