import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import pkg from './package.json';

export default {
  input: 'src/index.js',
  plugins: [
    resolve({
      extensions: ['.js'],
      customResolveOptions: {
        moduleDirectory: 'node_modules',
      },
    }),
    commonjs({
      include: [
        'node_modules/reduce-reducers/**',
        'node_modules/react/**',
        'node_modules/lodash.pick/**',
        'node_modules/lodash.mapvalues/**',
      ]
    }),
    babel({
      exclude: 'node_modules/**',
      plugins: [
        'external-helpers',
      ],
    }),
  ],
  external: [...Object.keys(pkg.dependencies)],
  sourcemap: process.env.NODE_ENV !== 'production',
  output: [{
    file: pkg.module,
    format: 'es',
  },
  {
    file: pkg.main,
    format: 'cjs',
  }],
};
