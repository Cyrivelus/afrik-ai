// Agent de base pour tous les agents IA
const natural = require('natural');
const franc = require('franc');
const translate = require('translate');

class BaseAgent {
  constructor(name, type, config = {}) {
    this.name = name;
    this.type = type;
    this.config = config;
    this.context = [];
    this.languages = ['fra', 'eng', 'ara', 'wol', 'ful', 'hau', 'yor', 'ibo'];
    this.tokenizer = new natural.WordTokenizer();
    this.stemmer = natural.PorterStemmerFr;
  }

  async detectLanguage(text) {
    const lang = franc(text);
    return this.languages.includes(lang) ? lang : 'fra';
  }

  async translateToFrench(text) {
    if (await this.detectLanguage(text) !== 'fra') {
      return await translate(text, { from: 'auto', to: 'fr' });
    }
    return text;
  }

  async translateToLocal(text, targetLang) {
    return await translate(text, { from: 'fr', to: targetLang });
  }

  async process(input) {
    const lang = await this.detectLanguage(input);
    const text = lang !== 'fra' ? await translate(input, { to: 'fr' }) : input;
    
    const tokens = this.tokenizer.tokenize(text.toLowerCase());
    const stems = tokens.map(t => this.stemmer.stem(t));
    
    return {
      original: input,
      language: lang,
      translated: text,
      tokens,
      stems
    };
  }

  async learn(context) {
    this.context.push(context);
    if (this.context.length > 100) {
      this.context.shift();
    }
  }

  async recall() {
    return this.context;
  }

  async generateResponse(input, type) {
    const processed = await this.process(input);
    
    // Logique de génération de réponse selon le type d'agent
    let response = '';
    
    switch(type) {
      case 'commercial':
        response = this.generateCommercialResponse(processed);
        break;
      case 'financial':
        response = this.generateFinancialResponse(processed);
        break;
      case 'support':
        response = this.generateSupportResponse(processed);
        break;
      case 'training':
        response = this.generateTrainingResponse(processed);
        break;
      default:
        response = this.generateDefaultResponse(processed);
    }
    
    return response;
  }

  generateCommercialResponse(processed) {
    const responses = {
      'prix': 'Je peux vous aider avec nos tarifs. Quel produit vous intéresse ?',
      'stock': 'Laissez-moi vérifier nos stocks en temps réel.',
      'commande': 'Je vais vous guider pour passer commande.',
      'livraison': 'Nous livrons dans toute l\'Afrique sous 48h.',
      'default': 'Comment puis-je vous aider avec vos besoins commerciaux ?'
    };
    
    for (let token of processed.tokens) {
      if (responses[token]) return responses[token];
    }
    return responses.default;
  }

  generateFinancialResponse(processed) {
    return 'Je peux vous aider avec la gestion financière. Souhaitez-vous :\n' +
           '💰 Vérifier votre solde\n' +
           '📊 Analyser vos dépenses\n' +
           '💳 Planifier votre budget\n' +
           '📈 Obtenir des conseils d\'investissement';
  }

  generateSupportResponse(processed) {
    return 'Notre support technique est disponible 24/7. Quel est votre problème ?';
  }

  generateTrainingResponse(processed) {
    return 'Je peux vous former sur nos produits. Quel sujet vous intéresse ?';
  }

  generateDefaultResponse(processed) {
    return `Je comprends que vous parlez de "${processed.tokens.slice(0, 3).join(' ')}...". Pouvez-vous préciser votre demande ?`;
  }
}

module.exports = BaseAgent;