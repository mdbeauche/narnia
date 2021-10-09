module.exports = {
  parser: 'babel-eslint',
  env: {
    browser: true,
    node: true,
    jest: false,
  },
  parserOptions: {
    babelOptions: {
      configFile: './babel.config.json',
    },
  },
  extends: ['airbnb-base', 'prettier'],
  globals: { fetch: false },
  plugins: ['prettier'],
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        moduleDirectory: ['./node_modules', './src'],
      },
    },
  },
  rules: {
    'no-console': 'off',
    'max-len': [2, 100, 2],
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: false,
        optionalDependencies: false,
        peerDependencies: false,
        packageDir: __dirname,
      },
    ],
    'function-paren-newline': 0,
    'import/prefer-default-export': 0,
    'no-trailing-spaces': ['error', { skipBlankLines: true }],
    'no-underscore-dangle': 0,
    'class-methods-use-this': 'off',
    'arrow-parens': 'off',
    'no-param-reassign': 0,
    'no-use-before-define': ['error', { functions: false, classes: false }],
    'no-restricted-syntax': 0,
    'prettier/prettier': 'error',
    'no-unused-expressions': 'error',
    'import/no-unresolved': [2, { caseSensitive: false }],
  },
};
