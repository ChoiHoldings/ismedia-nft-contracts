module.exports = {
  root: true,
  env: {
    node: true,
    mocha: true,
    es2020: true,
  },
  parserOptions: { ecmaVersion: 2020 },
  extends: 'airbnb-base',
  globals: {
    contract: true,
    artifacts: true,
    assert: true,
    ethers: true,
  },
  rules: {
    'arrow-body-style': 0,
    'space-before-function-paren': 'off',
    semi: ['error', 'always', { omitLastInOneLineBlock: true }],
    'object-curly-newline': ['error', { minProperties: 6, consistent: true }],
    'keyword-spacing': ['error', {
      after: false,
      overrides: {
        return: { after: true },
        else: { after: true },
        do: { after: true },
        from: { after: true },
        import: { after: true },
        export: { after: true },
        try: { after: true },
        const: { after: true },
      },
    }],
    'max-len': ['error', { code: 150, ignorePattern: '^\\s*<path' }],
    'no-param-reassign': 0,
    'no-unused-vars': ['error', { varsIgnorePattern: 'ignore' }],
    'no-unused-expressions': 'off',
    'no-console': 'off',
    'no-await-in-loop': 'off',
  },
};
