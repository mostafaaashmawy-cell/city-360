const fs = require('fs');
const path = require('path');

const workerPath = path.join(__dirname, '..', 'worker.ts');
const key = process.env.GEMINI_API_KEY;

if (key && fs.existsSync(workerPath)) {
  let content = fs.readFileSync(workerPath, 'utf8');
  content = content.replace('__GEMINI_KEY_PLACEHOLDER__', key);
  fs.writeFileSync(workerPath, content, 'utf8');
  console.log('✓ Injected GEMINI_API_KEY from build environment into worker.');
} else {
  console.log('ℹ No build-time GEMINI_API_KEY found or worker.ts missing, skipping injection.');
}
