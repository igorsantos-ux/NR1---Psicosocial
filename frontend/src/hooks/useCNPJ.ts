import { useState } from 'react';

interface DadosCNPJ {
  razaoSocial: string;
  nomeFantasia: string;
  cnae: string;
  cnaeDescricao: string;
  endereco: string;
  complemento: string;
  bairro: string;
  municipio: string;
  estado: string;
  cep: string;
  telefone: string;
  situacao: 'ATIVA' | 'INAPTA' | 'BAIXADA' | 'SUSPENSA' | 'NULA';
}

interface UseCNPJReturn {
  buscarCNPJ: (cnpj: string) => Promise<DadosCNPJ | null>;
  loading: boolean;
  erro: string | null;
}

export function useCNPJ(): UseCNPJReturn {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const buscarCNPJ = async (cnpj: string): Promise<DadosCNPJ | null> => {
    // Limpar formatação
    const cnpjLimpo = cnpj.replace(/[.\-\/]/g, '').trim();
    
    if (cnpjLimpo.length !== 14) {
      setErro('CNPJ deve ter 14 dígitos');
      return null;
    }

    setLoading(true);
    setErro(null);

    try {
      const response = await fetch(
        `https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`,
        { signal: AbortSignal.timeout(10000) }
      );

      if (response.status === 404) {
        setErro('CNPJ não encontrado na Receita Federal');
        return null;
      }
      
      if (!response.ok) {
        setErro('Erro ao consultar CNPJ. Preencha manualmente.');
        return null;
      }

      const data = await response.json();

      // Verificar situação cadastral
      const situacoes: Record<number, string> = {
        1: 'NULA', 2: 'ATIVA', 3: 'SUSPENSA', 4: 'INAPTA', 8: 'BAIXADA'
      };
      const situacao = (situacoes[data.situacao_cadastral] || 'INAPTA') as DadosCNPJ['situacao'];

      if (situacao !== 'ATIVA') {
        setErro(`Empresa com situação ${situacao} na Receita Federal. Verifique.`);
      }

      // Formatar CEP
      const cepFormatado = data.cep 
        ? data.cep.replace(/(\d{5})(\d{3})/, '$1-$2') 
        : '';

      // Formatar telefone
      const telefone = data.ddd_telefone_1 
        ? data.ddd_telefone_1.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3')
        : '';

      // Montar endereço
      const partes = [data.logradouro, data.numero].filter(Boolean);
      const endereco = partes.join(', ');

      return {
        razaoSocial: data.razao_social || '',
        nomeFantasia: data.nome_fantasia || '',
        cnae: data.cnae_fiscal ? String(data.cnae_fiscal) : '',
        cnaeDescricao: data.cnae_fiscal_descricao || '',
        endereco,
        complemento: data.complemento || '',
        bairro: data.bairro || '',
        municipio: data.municipio || '',
        estado: data.uf || '',
        cep: cepFormatado,
        telefone,
        situacao,
      };
    } catch (err: any) {
      if (err.name === 'TimeoutError') {
        setErro('Consulta demorou demais. Preencha manualmente.');
      } else {
        setErro('Falha na conexão com a BrasilAPI.');
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { buscarCNPJ, loading, erro };
}
