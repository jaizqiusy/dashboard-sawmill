import { readFileSync, writeFileSync } from 'fs';
const file = 'src/main.tsx';
let content = readFileSync(file, 'utf-8');

const override = `
// Suppress expected offline warnings from Firebase SDK
const originalConsoleError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('Could not reach Cloud Firestore backend')) {
    console.warn('Firebase offline mode active (suppressed error).');
    return;
  }
  originalConsoleError(...args);
};
`;

if (!content.includes('originalConsoleError')) {
  content = content.replace("import App from './App.tsx';", "import App from './App.tsx';\n" + override);
  writeFileSync(file, content);
}
