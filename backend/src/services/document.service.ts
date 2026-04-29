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
        empresa: any,
        engenheiro: any,
        templatePath: string = ''
    ): Promise<Buffer> {
        try {
            // Tenta encontrar o template em diferentes locais possíveis (Docker vs Local)
            const possiblePaths = [
                templatePath,
                path.resolve(process.cwd(), 'templates/PGR-MODELO-V2.docx'),
                path.resolve(process.cwd(), 'backend/templates/PGR-MODELO-V2.docx')
            ].filter(p => p);

            let finalPath = '';
            for (const p of possiblePaths) {
                try {
                    await fs.access(p!);
                    finalPath = p!;
                    break;
                } catch {}
            }

            if (!finalPath) throw new Error('Template PGR-MODELO-V2.docx não encontrado em nenhum dos caminhos previstos.');
            
            const content = await fs.readFile(finalPath);
            const zip = new PizZip(content);
            
            const doc = new Docxtemplater(zip, {
                paragraphLoop: true,
                linebreaks: true,
                nullGetter() { return ''; } // Substitui placeholder não encontrado por string vazia
            });

            const dataAtual = new Date();
            const dataValidade = new Date(dataAtual);
            dataValidade.setFullYear(dataValidade.getFullYear() + 2);
            
            const meses = ['JANEIRO','FEVEREIRO','MARÇO','ABRIL','MAIO','JUNHO',
                           'JULHO','AGOSTO','SETEMBRO','OUTUBRO','NOVEMBRO','DEZEMBRO'];

            // Preparar objeto de dados unificado para o Template
            const dadosTemplate = {
                empresa: {
                    razao_social: empresa.razaoSocial || '',
                    nome_fantasia: empresa.nomeFantasia || '',
                    cnpj: empresa.cnpj || '',
                    endereco: empresa.endereco || '',
                    complemento: empresa.complemento || '',
                    telefone: empresa.telefone || '',
                    cep: empresa.cep || '',
                    bairro: empresa.bairro || '',
                    municipio: empresa.municipio || '',
                    estado: empresa.estado || '',
                    cnae: empresa.cnae || '',
                    cnae_descricao: empresa.cnaeDescricao || '',
                    grau_risco: empresa.grauRiscoNr4 || '',
                    cnaes_secundarios: empresa.cnaesSecundarios || '',
                    total_funcionarios: empresa.totalFuncionarios || 0,
                    horario_trabalho: empresa.horarioTrabalho || ''
                },
                
                documento: {
                    data_emissao_formatada: `${meses[dataAtual.getMonth()]}/${dataAtual.getFullYear()}`,
                    data_validade_formatada: `${meses[dataValidade.getMonth()]}/${dataValidade.getFullYear()}`,
                    data_emissao_extenso: `${dataAtual.getDate()} de ${meses[dataAtual.getMonth()].toLowerCase()} de ${dataAtual.getFullYear()}`,
                    vigencia: `${meses[dataAtual.getMonth()]} DE ${dataAtual.getFullYear()} À ${meses[dataValidade.getMonth()]} DE ${dataValidade.getFullYear()}`
                },
                
                engenheiro: {
                    nome: engenheiro.nome || '',
                    cargo: engenheiro.cargo || 'ENGENHEIRO SEGURANÇA DO TRABALHO',
                    contato: engenheiro.contato || '',
                    endereco: engenheiro.endereco || '',
                    crea: engenheiro.crea || ''
                },
                
                elaboradora: {
                    razao_social: 'CLINICFY ATENDIMENTOS MEDICOS E AMBULATORIAIS LTDA',
                    cnpj: '41.591.715/0001-43',
                    endereco: 'Rua das Orquídeas Nº 758 – Portais II - Polvilho - Cajamar-SP',
                    contato: '(11) 5197-0422',
                    site: 'www.clinicfy.com.br'
                },
                
                revisoes: [
                    {
                        data: dataAtual.toLocaleDateString('pt-BR'),
                        elaborador: engenheiro.nome,
                        responsavel: engenheiro.nome,
                        descricao: 'Emissão Inicial'
                    }
                ],
                
                // Mapeamento dos dados vindos do Gemini para os placeholders do template
                ghes: jsonConsolidado.secao_10_por_ghe?.map((ghe: any) => ({
                    setor: ghe.ghe_nome,
                    codigo: ghe.ghe_codigo,
                    ambiente: ghe.ambiente || {
                        descricao: '',
                        cobertura: '',
                        estrutura: '',
                        piso: '',
                        pe_direito: '',
                        ventilacao: '',
                        iluminacao: ''
                    },
                    cargos: ghe.cargos || [],
                    riscos: ghe.riscos_psicossociais || []
                })) || [],
                
                cronograma_acoes: jsonConsolidado.secao_11?.cronograma_acoes || [],
                responsabilidades: jsonConsolidado.secao_11?.responsabilidades || [],
                prioridades: jsonConsolidado.secao_11?.prioridades || [],
                
                secao_13_recomendacoes: jsonConsolidado.secao_13_recomendacoes || '',
                secao_14_consideracoes_finais: jsonConsolidado.secao_14_consideracoes_finais || ''
            };

            console.log('[Document Service] Renderizando template com dados:', {
                empresa: dadosTemplate.empresa.razao_social,
                cnpj: dadosTemplate.empresa.cnpj,
                total_ghes: dadosTemplate.ghes.length
            });

            doc.render(dadosTemplate);

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

            // No Easypanel (Linux), usamos o comando 'libreoffice' ou 'soffice'
            const command = `libreoffice --headless --convert-to pdf --outdir "${tmpDir}" "${docxPath}"`;

            await execAsync(command, { timeout });

            const pdfPath = path.join(tmpDir, 'input.pdf');
            const pdfBuffer = await fs.readFile(pdfPath);

            return pdfBuffer;
        } catch (error: any) {
            console.error('Erro na conversão DOCX para PDF:', error);
            throw new Error(`Falha na conversão para PDF: ${error.message}`);
        } finally {
            await fs.rm(tmpDir, { recursive: true, force: true }).catch(err => {
                console.warn(`Erro ao limpar diretório temporário ${tmpDir}:`, err.message);
            });
        }
    }
}
