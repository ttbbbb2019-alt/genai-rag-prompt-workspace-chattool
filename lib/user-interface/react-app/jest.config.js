export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setupTests.ts'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@cloudscape-design/components$': '<rootDir>/src/__mocks__/cloudscape-components.ts',
    '^@cloudscape-design/global-styles$': '<rootDir>/src/__mocks__/cloudscape-global-styles.ts',
    '^react-speech-recognition$': '<rootDir>/src/__mocks__/react-speech-recognition.ts',
    '^aws-amplify$': '<rootDir>/src/__mocks__/aws-amplify.ts',
    '^\\.\\/result-items$': '<rootDir>/src/pages/rag/semantic-search/__mocks__/result-items.tsx',
    '^\\.\\/semantic-search-details$': '<rootDir>/src/pages/rag/semantic-search/__mocks__/semantic-search-details.tsx',
  },
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@cloudscape-design|uuid)/)',
  ],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(ts|tsx)',
    '<rootDir>/src/**/*.(test|spec).(ts|tsx)',
  ],
  collectCoverageFrom: [
    'src/**/*.(ts|tsx)',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/vite-env.d.ts',
  ],
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react-jsx',
      },
    },
  },
};
