export interface FaqItem {
  q: string;
  a: string[];
}

/** Respostas informativas, sem promessas comerciais. Revisar com a administradora parceira. */
export const FAQ: FaqItem[] = [
  {
    q: 'O que é um consórcio?',
    a: [
      'É uma modalidade de compra planejada: um grupo de pessoas contribui mensalmente para formar um fundo comum e, ao longo do prazo, os participantes são contemplados com uma carta de crédito para adquirir o bem.',
      'Os grupos são organizados por administradoras autorizadas e fiscalizadas pelo Banco Central do Brasil, conforme a Lei nº 11.795/2008.',
    ],
  },
  {
    q: 'Como funciona a contemplação?',
    a: [
      'A contemplação acontece nas assembleias do grupo, por sorteio ou por lance, conforme as regras do contrato.',
      'Não é possível garantir uma data: cada participante pode ser contemplado em qualquer momento do prazo do grupo, inclusive nas últimas assembleias.',
    ],
  },
  {
    q: 'Posso utilizar lance?',
    a: [
      'Na maioria dos grupos, sim. O lance é a oferta de antecipação de parcelas para aumentar as chances de contemplação.',
      'As modalidades (como lance livre, fixo ou embutido) e seus limites variam conforme a administradora e o regulamento do grupo. Oferecer um lance não garante a contemplação.',
    ],
  },
  {
    q: 'Existe taxa de administração?',
    a: [
      'Sim. A taxa de administração remunera a administradora pela gestão do grupo e é diluída ao longo do prazo. Também podem existir fundo de reserva, seguro e outros encargos previstos em contrato.',
      'No consórcio não há cobrança de juros como em um financiamento, mas todos esses custos devem ser apresentados de forma clara antes da adesão.',
    ],
  },
  {
    q: 'As parcelas podem sofrer reajustes?',
    a: [
      'Sim. O valor do crédito e das parcelas costuma ser atualizado periodicamente para acompanhar o preço do bem, por um índice ou critério definido em contrato — por exemplo, INCC ou IPCA em planos de imóveis, ou a variação de preço de referência em planos de veículos.',
    ],
  },
  {
    q: 'Como funciona a contratação?',
    a: [
      'Depois de escolher o plano, você recebe as condições detalhadas e, se decidir seguir, assina a proposta de adesão a um grupo de uma administradora autorizada.',
      'Documentos e análise de crédito são solicitados pela administradora conforme suas regras — normalmente no momento de utilizar a carta de crédito. Este site oferece orientação comercial e não é uma administradora de consórcios.',
    ],
  },
  {
    q: 'Qual a diferença entre consórcio de imóvel e de veículo?',
    a: [
      'Os principais pontos são prazo, faixa de crédito e utilização. Planos de imóveis costumam ter prazos mais longos, e o crédito pode ser usado para compra de imóvel residencial ou comercial, terreno ou construção, conforme o contrato.',
      'Planos de veículos têm prazos menores, e o crédito é destinado à compra de automóveis ou motocicletas, novos ou usados, de acordo com as regras do grupo.',
    ],
  },
  {
    q: 'A simulação do site é a parcela final?',
    a: [
      'Não. A simulação é ilustrativa e serve como referência inicial. O valor definitivo depende do grupo escolhido, da composição da parcela e das regras da administradora, apresentadas antes da contratação.',
    ],
  },
];
