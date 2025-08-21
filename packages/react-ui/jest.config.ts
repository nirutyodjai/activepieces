/* eslint-disable */
export default {
  displayName: 'react-ui',
  preset: '../../jest.preset.js',
  moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/src/$1',
  '^next/image$': '<rootDir>/src/__mocks__/next-image-mock.tsx',
  '^@testing-library/jest-dom$': '<rootDir>/src/__mocks__/@testing-library__jest-dom.ts',
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
    '^.+\\.[tj]sx?$': ['babel-jest', { presets: ['@nx/react/babel'] }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../coverage/packages/react-ui',
};
