import PizZip from 'pizzip';
import * as fs from 'fs';
import * as path from 'path';

function auditTemplate() {
    const templatePath = path.resolve(process.cwd(), 'backend/templates/PGR-MODELO-V2.docx');
    
    if (!fs.existsSync(templatePath)) {
        console.error('Template não encontrado em:', templatePath);
        return;
    }

    const content = fs.readFileSync(templatePath);
    const zip = new PizZip(content);
    const xml = zip.file('word/document.xml')?.asText() || '';

    // Regex para encontrar {placeholder} ou {#loop} ou {/loop} ou {^nested}
    const placeholdersEncontrados = [...new Set(
        [...xml.matchAll(/\{([#/^]?[^}]+)\}/g)].map(m => m[1].trim())
    )].sort();

    console.log('--- PLACEHOLDERS ENCONTRADOS NO TEMPLATE ---');
    placeholdersEncontrados.forEach(p => console.log(`- ${p}`));
    console.log('--------------------------------------------');
    console.log(`Total: ${placeholdersEncontrados.length}`);
}

auditTemplate();
