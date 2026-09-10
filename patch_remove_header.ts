import { readFileSync, writeFileSync } from 'fs';
const file = 'src/components/Pages/OrderPage.tsx';
let content = readFileSync(file, 'utf-8');

const startMarker = "{/* Header matching the image */}";
const endMarker = "<div className=\"px-3 sm:px-5 mt-4 space-y-4\">";

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + content.substring(endIndex);
  writeFileSync(file, content);
  console.log("Header removed successfully.");
} else {
  console.log("Could not find markers.");
}
