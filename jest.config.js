module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/__tests__/**/*.test.js'],
    collectCoverageFrom: [
        'services/**/*.js',
        '!**/node_modules/**'
    ],
    coverageDirectory: 'coverage',
    verbose: true,
    testTimeout: 30000,
    setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
};
