const BaseAgent = require('./base-agent');

class CommercialAgent extends BaseAgent {
  constructor(config = {}) {
    super('KAYADE Pro', 'commercial', config);
    this.products = [];
    this.stock = {};
    this.prices = {};
    this.orders = [];
    this.clients = [];
  }

  async initialize(data) {
    this.products = data.products || [];
    this.stock = data.stock || {};
    this.prices = data.prices || {};
    console.log(`✅ Agent ${this.name} initialisé avec ${this.products.length} produits`);
  }

  async checkStock(productId) {
    return this.stock[productId] || 0;
  }

  async getPrice(productId, clientType = 'normal') {
    let price = this.prices[productId] || 0;
    
    // Réductions selon le type de client (adapté au contexte africain)
    if (clientType === 'revendeur') {
      price *= 0.8; // 20% de réduction
    } else if (clientType === 'grossiste') {
      price *= 0.7; // 30% de réduction
    } else if (clientType === 'coopérative') {
      price *= 0.75; // 25% de réduction
    }
    
    // Adaptation aux devises locales
    const currencies = {
      'xof': price * 655.957, // F CFA
      'cdf': price * 2500,    // Franc congolais
      'gnf': price * 8600,    // Franc guinéen
      'usd': price,
      'eur': price * 0.92
    };
    
    return currencies;
  }

  async createOrder(client, products, paymentMethod = 'mobile_money') {
    const order = {
      id: Date.now(),
      client,
      products,
      total: this.calculateTotal(products),
      paymentMethod,
      status: 'pending',
      date: new Date(),
      deliveryEstimate: this.estimateDelivery(client.location)
    };
    
    this.orders.push(order);
    await this.updateStock(products);
    
    return order;
  }

  calculateTotal(products) {
    return products.reduce((total, p) => total + (p.quantity * this.prices[p.id]), 0);
  }

  estimateDelivery(location) {
    // Estimation réaliste pour l'Afrique
    const zones = {
      'capitale': '24h',
      'ville': '48h',
      'region': '72h',
      'rural': '5 jours'
    };
    return zones[location] || '3-5 jours';
  }

  async updateStock(products) {
    for (let p of products) {
      this.stock[p.id] -= p.quantity;
    }
  }

  async getSalesReport(startDate, endDate) {
    const filtered = this.orders.filter(o => 
      o.date >= startDate && o.date <= endDate
    );
    
    return {
      totalOrders: filtered.length,
      totalRevenue: filtered.reduce((sum, o) => sum + o.total, 0),
      averageOrderValue: filtered.length ? 
        filtered.reduce((sum, o) => sum + o.total, 0) / filtered.length : 0,
      topProducts: this.getTopProducts(filtered),
      paymentMethods: this.getPaymentStats(filtered)
    };
  }

  getTopProducts(orders) {
    const productCount = {};
    orders.forEach(o => {
      o.products.forEach(p => {
        productCount[p.id] = (productCount[p.id] || 0) + p.quantity;
      });
    });
    
    return Object.entries(productCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, count]) => ({ id, count }));
  }

  getPaymentStats(orders) {
    const stats = {};
    orders.forEach(o => {
      stats[o.paymentMethod] = (stats[o.paymentMethod] || 0) + 1;
    });
    return stats;
  }

  async generateCommercialResponse(input) {
    const processed = await this.process(input);
    
    if (processed.tokens.includes('stock') || processed.tokens.includes('disponible')) {
      const product = processed.tokens.find(t => this.products.includes(t));
      if (product) {
        const stock = await this.checkStock(product);
        return `📦 Stock de ${product}: ${stock} unités disponibles`;
      }
    }
    
    if (processed.tokens.includes('prix') || processed.tokens.includes('tarif')) {
      const product = processed.tokens.find(t => this.products.includes(t));
      if (product) {
        const prices = await this.getPrice(product);
        return `💰 Prix de ${product}:\n` +
               `- XOF: ${prices.xof.toFixed(0)} F CFA\n` +
               `- CDF: ${prices.cdf.toFixed(0)} FC\n` +
               `- USD: $${prices.usd}`;
      }
    }
    
    if (processed.tokens.includes('commande')) {
      return "🛒 Je vais vous aider à passer commande. Veuillez me donner vos articles et quantités.";
    }
    
    return super.generateCommercialResponse(processed);
  }
}

module.exports = CommercialAgent;