import { promises } from 'fs';
import { defineConfig, loadEnv } from 'vite';
import { VitePluginNode } from 'vite-plugin-node';
import tsconfigPaths from 'vite-tsconfig-paths';

// used to load fonts server side for thumbnail generation
function loadTTFAsArrayBuffer() {
   return {
      name: 'load-ttf-as-array-buffer',
      async transform(_src: any, id: any) {
         if (id.endsWith('.ttf')) {
            return `export default new Uint8Array([
			${new Uint8Array(await promises.readFile(id))}
		  ]).buffer`;
         }
      },
   };
}

export default defineConfig(({ mode }) => {
   // Load env file based on `mode` in the current working directory.
   // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
   const env = loadEnv(mode, process.cwd(), '');

   return {
      build: {
         target: 'esnext',
         outDir: './dist',
         sourcemap: true,
         minify: false,
      },
      plugins: [
         loadTTFAsArrayBuffer(),
         tsconfigPaths(),
         ...VitePluginNode({
            adapter: 'express',
            appPath: './src/server.ts',
            exportName: 'zods-llm-web-scrapper',
            tsCompiler: 'esbuild',
         }),
      ],
      optimizeDeps: {
         include: [
            'browser-image-resizer',
            'uuid',
            '@huggingface/transformers',
            'sharp',
            '@gradio/client',
         ],
      },
      define: {
         ...Object.keys(env).reduce((prev, key) => {
            const sanitizedKey = key.replace(/[^a-zA-Z0-9_]/g, '_');

            prev[`process.env.${sanitizedKey}`] = JSON.stringify(env[key]);

            return prev;
         }, {}),
      },
   };
});
