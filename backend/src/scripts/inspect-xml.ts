import PizZip from 'pizzip';
import * as fs from 'fs';
import * as path from 'path';

const templatePath = path.resolve(process.cwd(), 'backend/templates/PGR-MODELO.docx');
const content = fs.readFileSync(templatePath);
const zip = new PizZip(content);
const xml = zip.file('word/document.xml')?.asText() || '';

console.log(xml.substring(0, 10000));
