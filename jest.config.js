const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.tsx'],
  testEnvironment: 'jest-environment-jsdom',
  // Prevent cross-suite state bleed (esp. under --runInBand): reset mock call
  // state AND restore spied/overridden implementations between every test.
  clearMocks: true,
  restoreMocks: true,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/', '<rootDir>/e2e/'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};

// next-auth@5 beta + its deps (@auth/core, jose, oauth4webapi, @panva, preact)
// ship ESM with bare `import` statements. Jest ignores all of node_modules by
// default, so these are never transformed and fail with
// "Cannot use import statement outside a module".
//
// next/jest builds its OWN transformIgnorePatterns and merges ours by APPENDING.
// transformIgnorePatterns is an OR — a file is skipped if it matches ANY entry —
// so next/jest's default entry still ignores next-auth before ours is consulted.
// The reliable fix is to OVERRIDE the final array after next/jest has built it:
// keep next/jest's own allowlist (geist, next/dist…) and add the auth ESM packages
// into a single negative-lookahead, plus the css-module passthrough.
const ESM_PACKAGES = [
  'geist',
  'next/dist/client',
  'next/dist/shared/lib',
  'next/src/client',
  'next/src/shared/lib',
  'next-auth',
  '@auth/core',
  'jose',
  'oauth4webapi',
  'preact-render-to-string',
  'preact',
  '@panva',
];

module.exports = async () => {
  const config = await createJestConfig(customJestConfig)();
  config.transformIgnorePatterns = [
    `/node_modules/(?!\\.pnpm)(?!(${ESM_PACKAGES.join('|')})/)`,
    '^.+\\.module\\.(css|sass|scss)$',
  ];
  return config;
};
