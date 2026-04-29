import PizZip from 'pizzip';
import * as fs from 'fs';
import * as path from 'path';

const templatePath = path.resolve(process.cwd(), 'backend/templates/PGR-MODELO.docx');
const content = fs.readFileSync(templatePath);
const zip = new PizZip(content);
const xml = zip.file('word/document.xml')?.asText() || '';

const index = xml.indexOf('MARAVILHA');
if (index !== -1) {
    console.log('--- CONTEXTO ENCONTRADO ---');
    console.log(xml.substring(index - 100, index + 300));
    console.log('---------------------------');
} else {
    console.log('Palavra MARAVILHA não encontrada no document.xml');
}

const index2 = xml.indexOf('ABRIL/2026');
if (index2 !== -1) {
    console.log('--- CONTEXTO DATA ENCONTRADO ---');
    console.log(xml.substring(index2 - 100, index2 + 300));
    console.log('--------------------------------');
}
