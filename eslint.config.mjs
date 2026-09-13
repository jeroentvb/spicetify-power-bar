import { defineConfig, globalIgnores } from 'eslint/config';
import jeroentvb from '@jeroentvb/eslint-config-typescript';
import eslintReact from '@eslint-react/eslint-plugin';

export default defineConfig(
   globalIgnores([
      'dist/',
      // Vendored from Spicetify upstream — keep byte-identical for easy re-syncs.
      'src/types/spicetify.d.ts',
   ]),

   jeroentvb,

   // Flat config only lints js/mjs/cjs by default; opt the TypeScript sources in.
   {
      files: ['**/*.ts', '**/*.tsx'],
   },

   {
      files: ['**/*.tsx'],

      extends: [eslintReact.configs['recommended-typescript']],
   }
);
