import { FinancialCategoryConfig } from '../types';

export const DEFAULT_FINANCIAL_CATEGORIES: FinancialCategoryConfig[] = [
  {
    id: 'fcat_1',
    code: 1,
    type: 'CAPEX',
    category: 'Dev. de Software',
    description: 'Horas de desenvolvedores na criação de novos sistemas',
    practicalExample: 'Salários e bônus do time de tecnologia focados em criar novas funcionalidades.'
  },
  {
    id: 'fcat_2',
    code: 2,
    type: 'CAPEX',
    category: 'Hardware e TI',
    description: 'Equipamentos físicos de tecnologia',
    practicalExample: 'Compra de notebooks, servidores físicos e roteadores de rede.'
  },
  {
    id: 'fcat_3',
    code: 3,
    type: 'CAPEX',
    category: 'Máquinas e Equipamentos',
    description: 'Maquinário pesado e ferramentas de produção',
    practicalExample: 'Compra de robôs industriais, tornos ou esteiras automáticas.'
  },
  {
    id: 'fcat_4',
    code: 4,
    type: 'CAPEX',
    category: 'Terrenos e Imóveis',
    description: 'Aquisição de patrimônio imobiliário',
    practicalExample: 'Compra de um galpão logístico ou prédio para escritórios.'
  },
  {
    id: 'fcat_5',
    code: 5,
    type: 'CAPEX',
    category: 'Licenças Perpétuas',
    description: 'Compra de softwares de uso vitalício',
    practicalExample: 'Pagamento único por um sistema de banco de dados sem mensalidade.'
  },
  {
    id: 'fcat_6',
    code: 6,
    type: 'CAPEX',
    category: 'Reformas e Obras',
    description: 'Melhorias estruturais em imóveis',
    practicalExample: 'Obras de infraestrutura elétrica ou divisórias em um novo escritório.'
  },
  {
    id: 'fcat_7',
    code: 7,
    type: 'CAPEX',
    category: 'Frota de Veículos',
    description: 'Meios de transporte próprios da empresa',
    practicalExample: 'Compra de caminhões de entrega ou carros para a equipe de vendas.'
  },
  {
    id: 'fcat_8',
    code: 8,
    type: 'CAPEX',
    category: 'Pesquisa e Inovação',
    description: 'Criação de novos produtos patenteáveis',
    practicalExample: 'Investimento na construção de um protótipo físico ou nova fórmula.'
  },
  {
    id: 'fcat_9',
    code: 9,
    type: 'CAPEX',
    category: 'Móveis e Utensílios',
    description: 'Mobiliário para a infraestrutura do projeto',
    practicalExample: 'Compra de cadeiras ergonômicas, mesas e aparelhos de ar-condicionado.'
  },
  {
    id: 'fcat_10',
    code: 10,
    type: 'CAPEX',
    category: 'M&A e Patentes',
    description: 'Compra de marcas, patentes ou outras empresas',
    practicalExample: 'Aquisição de uma startup concorrente ou registro de propriedade intelectual.'
  },
  {
    id: 'fcat_11',
    code: 11,
    type: 'OPEX',
    category: 'Salários e Encargos',
    description: 'Folha de pagamento do time de sustentação',
    practicalExample: 'Salários da equipe administrativa, suporte técnico e impostos trabalhistas.'
  },
  {
    id: 'fcat_12',
    code: 12,
    type: 'OPEX',
    category: 'Aluguéis',
    description: 'Locação de espaços físicos ou equipamentos',
    practicalExample: 'Mensalidade do escritório ou aluguel de impressoras e carros.'
  },
  {
    id: 'fcat_13',
    code: 13,
    type: 'OPEX',
    category: 'Assinaturas de Software',
    description: 'Softwares contratados como serviço (SaaS)',
    practicalExample: 'Mensalidades de nuvem (AWS/Azure), CRMs (Salesforce) ou e-mails.'
  },
  {
    id: 'fcat_14',
    code: 14,
    type: 'OPEX',
    category: 'Manutenção e Suporte',
    description: 'Consertos e suporte de rotina',
    practicalExample: 'Correção de bugs de softwares existentes e revisão de máquinas.'
  },
  {
    id: 'fcat_15',
    code: 15,
    type: 'OPEX',
    category: 'Utilidades Públicas',
    description: 'Consumos básicos de infraestrutura',
    practicalExample: 'Contas de energia elétrica, água, internet e serviços de limpeza.'
  },
  {
    id: 'fcat_16',
    code: 16,
    type: 'OPEX',
    category: 'Serviços de Terceiros',
    description: 'Consultorias e prestadores de serviço',
    practicalExample: 'Pagamento de assessoria jurídica, contabilidade externa ou freelancers.'
  },
  {
    id: 'fcat_17',
    code: 17,
    type: 'OPEX',
    category: 'Material de Consumo',
    description: 'Itens que acabam rapidamente no dia a dia',
    practicalExample: 'Papel sulfite, copos descartáveis, café e material de escritório.'
  },
  {
    id: 'fcat_18',
    code: 18,
    type: 'OPEX',
    category: 'Viagens e Deslocamentos',
    description: 'Custos com viagens corporativas',
    practicalExample: 'Passagens aéreas, reembolso de combustível, hotéis e alimentação.'
  },
  {
    id: 'fcat_19',
    code: 19,
    type: 'OPEX',
    category: 'Seguros',
    description: 'Proteção financeira de ativos e pessoas',
    practicalExample: 'Seguro contra incêndio do galpão ou seguro de vida dos funcionários.'
  },
  {
    id: 'fcat_20',
    code: 20,
    type: 'OPEX',
    category: 'Marketing e Vendas',
    description: 'Custos para atrair e converter clientes',
    practicalExample: 'Anúncios no Google/Meta, agência de publicidade e eventos de captação.'
  }
];
