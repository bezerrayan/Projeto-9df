const { createLogger } = require('../../../lib/logger');
const { getEmailConfig } = require('../../../config/email');

const ROUTING_RULES = [
  {
    name: 'financeiro',
    destination: 'Financeiro',
    terms: ['pagamento'],
  },
  {
    name: 'atendimento',
    destination: 'Atendimento',
    terms: ['inscrição', 'inscricao', 'cadastro', 'matrícula', 'matricula', 'aluno'],
  },
  {
    name: 'comercial',
    destination: 'Comercial',
    terms: ['fornecedor', 'parceria', 'orçamento', 'orcamento'],
  },
];

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

class MailRoutingService {
  constructor(options = {}) {
    this.logger = options.logger || createLogger('MAIL:ROUTER');
    this.config = options.config || getEmailConfig();
    this.rules = options.rules || ROUTING_RULES;
  }

  classify(mail) {
    const haystack = normalizeText([mail.subject, mail.text, mail.html].filter(Boolean).join('\n'));

    for (const rule of this.rules) {
      if (rule.terms.some(term => haystack.includes(normalizeText(term)))) {
        this.logger.info('Mensagem classificada', {
          uid: mail.uid,
          destination: rule.destination,
          rule: rule.name,
        });

        return {
          destination: rule.destination,
          rule: rule.name,
        };
      }
    }

    const destination = this.config.processing.defaultDestination || this.config.folders.triagem;

    this.logger.info('Mensagem direcionada para rota padrão', {
      uid: mail.uid,
      destination,
      rule: 'default',
    });

    return {
      destination,
      rule: 'default',
    };
  }
}

module.exports = {
  MailRoutingService,
  ROUTING_RULES,
};
