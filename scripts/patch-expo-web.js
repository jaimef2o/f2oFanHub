/**
 * Patches Expo CLI to use type="module" for web script tags.
 * Required because Expo SDK 54 + Hermes outputs import.meta in the bundle,
 * which fails when loaded as a regular (non-module) script.
 */
const fs = require('fs');
const path = require('path');

const files = [
  {
    path: path.join(__dirname, '..', 'node_modules', 'expo', 'node_modules', '@expo', 'cli', 'build', 'src', 'export', 'html.js'),
    find: '<script src="${script}" defer></script>',
    replace: '<script type="module" src="${script}"></script>',
  },
  {
    path: path.join(__dirname, '..', 'node_modules', 'expo', 'node_modules', '@expo', 'cli', 'build', 'src', 'start', 'server', 'metro', 'serializeHtml.js'),
    find: '<script src="${bundleUrl}" defer>',
    replace: '<script type="module" src="${bundleUrl}">',
  },
];

let patched = 0;

for (const { path: filePath, find, replace } of files) {
  try {
    if (!fs.existsSync(filePath)) continue;
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(replace)) continue;
    if (!content.includes(find)) continue;
    content = content.replace(find, replace);
    fs.writeFileSync(filePath, content, 'utf8');
    patched++;
  } catch (err) {
    // Non-fatal
  }
}

console.log(`patch-expo-web: ${patched} file(s) patched`);
