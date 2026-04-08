import autoprefixer from 'autoprefixer'
import postcssPresetEnv from 'postcss-preset-env'

export default {
  plugins: [
    postcssPresetEnv({
      stage: 3,
      autoprefixer: false,
      features: {
        'cascade-layers': true,
        'oklab-function': true,
      },
      browsers: 'iOS >= 15.1, Safari >= 15.1',
    }),
    autoprefixer(),
  ],
}
