const BaseAgent = require('./base-agent');
const moment = require('moment');

class FinancialAgent extends BaseAgent {
  constructor(config = {}) {
    super('AFRIK-Finance', 'financial', config);
    this.transactions = [];
    this.accounts = {};
    this.budgets = {};
    this.savings = {};
    this.loans = {};
  }

  async createAccount(owner, type, initialBalance = 0) {
    const account = {
      id: `ACC${Date.now()}`,
      owner,
      type, // 'perso', 'business', 'cooperative', 'tontine'
      balance: initialBalance,
      currency: this.detectCurrency(owner.location),
      createdAt: new Date(),
      transactions: []
    };
    
    this.accounts[account.id] = account;
    return account;
  }

  detectCurrency(location) {
    const currencyMap = {
      'senegal': 'xof',
      'mali': 'xof',
      'cote d\'ivoire': 'xof',
      'burkina': 'xof',
      'benin': 'xof',
      'guinee': 'gnf',
      'rdc': 'cdf',
      'cameroun': 'xaf',
      'autre': 'usd'
    };
    return currencyMap[location?.toLowerCase()] || 'usd';
  }

  async recordTransaction(accountId, type, amount, description, metadata = {}) {
    const account = this.accounts[accountId];
    if (!account) throw new Error('Compte non trouvé');
    
    const transaction = {
      id: `TRX${Date.now()}${Math.random()}`,
      type, // 'deposit', 'withdrawal', 'transfer', 'payment', 'saving'
      amount,
      balanceBefore: account.balance,
      balanceAfter: type === 'deposit' || type === 'saving' ? 
        account.balance + amount : account.balance - amount,
      description,
      metadata,
      date: new Date()
    };
    
    account.balance = transaction.balanceAfter;
    account.transactions.push(transaction);
    this.transactions.push(transaction);
    
    return transaction;
  }

  async createBudget(accountId, name, period, categories) {
    const budget = {
      id: `BUD${Date.now()}`,
      accountId,
      name,
      period, // 'monthly', 'quarterly', 'yearly'
      categories, // { 'alimentation': 100000, 'transport': 50000, ... }
      spent: {},
      startDate: new Date(),
      endDate: this.calculateEndDate(period)
    };
    
    this.budgets[budget.id] = budget;
    return budget;
  }

  calculateEndDate(period) {
    const now = moment();
    switch(period) {
      case 'monthly': return now.add(1, 'month').toDate();
      case 'quarterly': return now.add(3, 'month').toDate();
      case 'yearly': return now.add(1, 'year').toDate();
      default: return now.add(1, 'month').toDate();
    }
  }

  async trackExpense(budgetId, category, amount, description) {
    const budget = this.budgets[budgetId];
    if (!budget) throw new Error('Budget non trouvé');
    
    if (!budget.spent[category]) {
      budget.spent[category] = 0;
    }
    
    budget.spent[category] += amount;
    
    // Alerte si dépassement
    if (budget.spent[category] > budget.categories[category]) {
      await this.sendAlert(`⚠️ Dépassement budget ${category}: ${budget.spent[category]} / ${budget.categories[category]}`);
    }
    
    return budget;
  }

  async createSavingsGoal(accountId, name, targetAmount, targetDate) {
    const goal = {
      id: `SAV${Date.now()}`,
      accountId,
      name,
      targetAmount,
      saved: 0,
      targetDate,
      progress: 0,
      contributions: []
    };
    
    this.savings[goal.id] = goal;
    return goal;
  }

  async contributeToSavings(goalId, amount, source) {
    const goal = this.savings[goalId];
    if (!goal) throw new Error('Objectif non trouvé');
    
    goal.saved += amount;
    goal.progress = (goal.saved / goal.targetAmount) * 100;
    goal.contributions.push({
      amount,
      source,
      date: new Date()
    });
    
    if (goal.saved >= goal.targetAmount) {
      await this.sendAlert(`🎉 Félicitations! Objectif "${goal.name}" atteint!`);
    }
    
    return goal;
  }

  async createLoan(accountId, amount, purpose, duration, interestRate = 0.05) {
    const loan = {
      id: `LOAN${Date.now()}`,
      accountId,
      amount,
      remaining: amount,
      purpose,
      interestRate,
      duration, // en mois
      monthlyPayment: this.calculateMonthlyPayment(amount, interestRate, duration),
      status: 'active',
      payments: [],
      createdAt: new Date(),
      dueDate: moment().add(duration, 'months').toDate()
    };
    
    this.loans[loan.id] = loan;
    return loan;
  }

  calculateMonthlyPayment(principal, rate, months) {
    const monthlyRate = rate / 12;
    return principal * monthlyRate * Math.pow(1 + monthlyRate, months) / 
           (Math.pow(1 + monthlyRate, months) - 1);
  }

  async processLoanPayment(loanId, amount) {
    const loan = this.loans[loanId];
    if (!loan) throw new Error('Prêt non trouvé');
    
    loan.remaining -= amount;
    loan.payments.push({
      amount,
      date: new Date()
    });
    
    if (loan.remaining <= 0) {
      loan.status = 'completed';
      await this.sendAlert(`✅ Prêt ${loanId} entièrement remboursé!`);
    }
    
    return loan;
  }

  async sendAlert(message) {
    // Intégration avec système de notification
    console.log(`🔔 ALERTE: ${message}`);
    // TODO: Ajouter notifications email/SMS
  }

  async generateFinancialReport(accountId, period = 'month') {
    const account = this.accounts[accountId];
    if (!account) throw new Error('Compte non trouvé');
    
    const startDate = moment().subtract(1, period).toDate();
    const transactions = account.transactions.filter(t => t.date >= startDate);
    
    const income = transactions.filter(t => t.type === 'deposit' || t.type === 'saving')
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions.filter(t => t.type === 'withdrawal' || t.type === 'payment')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      accountId,
      period,
      startDate,
      endDate: new Date(),
      balance: account.balance,
      totalIncome: income,
      totalExpenses: expenses,
      netChange: income - expenses,
      transactionCount: transactions.length,
      categoryBreakdown: this.categorizeExpenses(transactions),
      savingsProgress: await this.getSavingsProgress(accountId)
    };
  }

  categorizeExpenses(transactions) {
    const categories = {};
    transactions.forEach(t => {
      if (t.type === 'withdrawal' || t.type === 'payment') {
        const cat = t.metadata.category || 'autres';
        categories[cat] = (categories[cat] || 0) + t.amount;
      }
    });
    return categories;
  }

  async getSavingsProgress(accountId) {
    const goals = Object.values(this.savings).filter(g => g.accountId === accountId);
    return goals.map(g => ({
      name: g.name,
      progress: g.progress,
      saved: g.saved,
      target: g.targetAmount
    }));
  }
}

module.exports = FinancialAgent;