module.exports = {
  'extends': 'eslint:recommended',
  'rules': {
    'no-unused-vars': [2, {'vars': 'all', 'args': 'none'}],
    'no-empty': 0,
    'consistent-this': [2, 'that'],
    'comma-spacing': [2, {'before': false, 'after': true}],
    'key-spacing': [2, {'beforeColon': false, 'afterColon': true, 'mode': 'minimum'}],
    'space-before-function-paren': [2, {'anonymous': 'always', 'named': 'never'}],
    'space-unary-ops': [2, {'words': false, 'nonwords': false}],
    'space-in-parens': [2, 'never'],
    'space-before-blocks': 2,
    'keyword-spacing': 2,

    'array-bracket-spacing': [2, 'never'],
    'block-spacing': [2, 'always'],
    'brace-style': [2, '1tbs', {'allowSingleLine': true}],
    'camelcase': [2, {'properties': 'always'}],
    'comma-style': [2, 'last'],
    'computed-property-spacing': [2, 'never'],
    'eol-last': 2,
    'indent': [2, 2, {"SwitchCase": 1}],
    'linebreak-style': [2, 'unix'],
    'max-depth': [2, 5],
    'max-len': [2, 120, 4, {'ignoreUrls': true}],
    'max-nested-callbacks': [2, 4],
    'max-params': [2, 8],
    'max-statements': [2, 80],
    'new-cap': [2, {
      'newIsCap': true,
      'capIsNew': false,
      'newIsCapExceptions': ['gg', 'ctor'],
    }],
    'new-parens': 2,
    'no-array-constructor': 2,
    'no-mixed-spaces-and-tabs': 2,
    'no-new-object': 2,
    'no-trailing-spaces': [2],
    'one-var': [2, 'never'],
    'operator-linebreak': [2, 'after'],
    'quotes': [2, 'single', 'avoid-escape'],
    'semi-spacing': [2, {'before': false, 'after': true}],
    'space-infix-ops': 2,
    'spaced-comment': 2
  },
  'env': {
    'es6': true,
    'node': true,
    'browser': true,
    'jasmine': true,
    'jquery': true
  },
  'globals': {
    'Promise': false
  },
  "parser": "babel-eslint",
  'parserOptions': {
    'sourceType': 'module'
  }
};
