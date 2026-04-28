import fs from 'fs/promises';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class DocumentService {
    /**
     * Preenche o template DOCX com os dados do PGR.
     */
    static async preencherTemplatePGR(
        jsonConsolidado: any,
        templatePath: string = path.resolve(process.cwd(), 'templates/PGR-MODELO.docx')
    ): Promise<Buffer> {
        try {
            const content = await fs.readFile(templatePath, 'binary');
            const zip = new PizZip(content);
            const doc = new Docxtemplater(zip, {
                paragraphLoop: true,
                linebreaks: true,
            });

            doc.render(jsonConsolidado);

            const buffer = doc.getZip().generate({
                type: 'nodebuffer',
                compression: 'DEFLATE',
            });

            return buffer;
        } catch (error: any) {
            console.error('Erro ao preencher template DOCX:', error);
            throw new Error(`Falha na geração do DOCX: ${error.message}`);
        }
    }

    /**
     * Converte DOCX para PDF usando LibreOffice Headless.
     */
    static async converterDocxParaPdf(docxBuffer: Buffer): Promise<Buffer> {
        const timestamp = Date.now();
        const tmpDir = path.join(process.cwd(), 'tmp', `pgr-${timestamp}`);

        try {
            await fs.mkdir(tmpDir, { recursive: true });
            const docxPath = path.join(tmpDir, 'input.docx');
            await fs.writeFile(docxPath, docxBuffer);

            const timeout = process.env.LIBREOFFICE_TIMEOUT_MS ? parseInt(process.env.LIBREOFFICE_TIMEOUT_MS) : 60000;

            // No Windows o comando pode ser diferente (soffice.exe), 
            // mas o usuário especificou 'libreoffice' headless e o Dockerfile tbm.
            // Vou usar 'libreoffice' como padrão.
            const command = `libreoffice --headless --convert-to pdf --outdir "${tmpDir}" "${docxPath}"`;

            await execAsync(command, { timeout });

            const pdfPath = path.join(tmpDir, 'input.pdf');
            const pdfBuffer = await fs.readFile(pdfPath);

            return pdfBuffer;
        } catch (error: any) {
            console.error('Erro na conversão DOCX para PDF:', error);
            throw new Error(`Falha na conversão para PDF: ${error.message}`);
        } finally {
            // Limpeza
            await fs.rm(tmpDir, { recursive: true, force: true }).catch(err => {
                console.warn(`Erro ao limpar diretório temporário ${tmpDir}:`, err.message);
            });
        }
    }
}
