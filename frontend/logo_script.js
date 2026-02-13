import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logoPath = path.join(__dirname, 'public', 'logo.png');

try {
    const image = fs.readFileSync(logoPath);
    const base64Image = Buffer.from(image).toString('base64');
    console.log(`data:image/png;base64,${base64Image}`);
} catch (err) {
    console.error('Error reading file:', err);
}
