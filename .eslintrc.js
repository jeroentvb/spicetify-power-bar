module.exports = {
   'extends': [
      'plugin:react/recommended',
      '@jeroentvb/eslint-config-typescript'
   ],
   'parserOptions': {
      'ecmaFeatures': {
         'jsx': true
      },
   },
   'settings': {
      'react': {
         'version': 'detect'
      }
   }
};
