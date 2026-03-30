import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const booksDir = path.join(__dirname, 'public', 'books');
if (!fs.existsSync(booksDir)) {
  fs.mkdirSync(booksDir, { recursive: true });
}

const files = fs.readdirSync(booksDir).filter(f => f.endsWith('.epub'));
const library = files.map(f => ({
  filename: f,
  title: f.replace('.epub', '').replace(/[-_]/g, ' '),
  url: `/books/${f}`
}));

fs.writeFileSync(path.join(__dirname, 'src', 'library.json'), JSON.stringify(library, null, 2));
console.log(`Generated library.json with ${library.length} books.`);
