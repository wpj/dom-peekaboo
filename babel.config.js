const plugins = ['@babel/plugin-proposal-class-properties'];

const presets = [
  [
    '@babel/preset-env',
    {
      targets: {
        node: 'current',
      },
    },
  ],

  '@babel/preset-typescript',
];

const config = {
  plugins,
  presets,
};

module.exports = config;
