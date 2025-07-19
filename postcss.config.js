module.exports = {
  plugins: [
    require('postcss-import'),
    require('postcss-preset-env')({
      stage: 3,
      features: {
        'nesting-rules': true,
        'custom-media-queries': true,
        'custom-properties': {
          preserve: false,
        },
      },
    }),
    require('autoprefixer'),
    ...(process.env.NODE_ENV === 'production'
      ? [
          require('cssnano')({
            preset: [
              'default',
              {
                discardComments: {
                  removeAll: true,
                },
                normalizeWhitespace: true,
              },
            ],
          }),
        ]
      : []),
  ],
}; 