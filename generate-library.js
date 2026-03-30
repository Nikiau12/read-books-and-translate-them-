import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const booksDir = path.join(__dirname, 'public', 'books');
if (!fs.existsSync(booksDir)) {
  fs.mkdirSync(booksDir, { recursive: true });
}

const allFiles = fs.readdirSync(booksDir);
const epubs = allFiles.filter(f => f.endsWith('.epub'));

const library = epubs.map(f => {
  const baseName = f.replace('.epub', '');
  const coverJpg = allFiles.find(file => file === `${baseName}.jpg`);
  const coverPng = allFiles.find(file => file === `${baseName}.png`);
  
  return {
    filename: f,
    title: baseName.replace(/[-_]/g, ' '),
    url: `/books/${f}`,
    cover: coverJpg ? `/books/${coverJpg}` : (coverPng ? `/books/${coverPng}` : null)
  };
});

fs.writeFileSync(path.join(__dirname, 'src', 'library.json'), JSON.stringify(library, null, 2));
console.log(`Generated library.json with ${library.length} books.`);
