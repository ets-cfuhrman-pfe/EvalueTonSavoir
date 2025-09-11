 
/** @type {import('ts-jest').JestConfigWithTsJest} */

module.exports = {
    roots: ['<rootDir>/src'],
    transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
        '^.+\\.(js|jsx)$': 'babel-jest'
    },
    testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
    testEnvironment: 'jsdom',
    //moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    setupFiles: ['./jest.setup.cjs'],
    moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        // Permet de mocker les constantes pour les tests avec un chemin absolue (ex: import { ENV_VARIABLES } from 'src/constants';). Voir les "paths" dans tsconfig.json.
        '^src/constants$': '<rootDir>/src/__mocks__/constantsMock.tsx',
        // Dû au fait que tous les imports de "src/" sont normalisés, Jest doit comprendre le chemin réel. TODO: Trouver une solution pour que Jest se fie à tsconfig.json.
        '^src/(.*)$': '<rootDir>/src/$1',
        // Add mapping for @shared path to match tsconfig.json
        '^@shared/(.*)$': '<rootDir>/../server/shared/$1',
    },
    transformIgnorePatterns: ['node_modules/(?!nanoid/)'],
};
