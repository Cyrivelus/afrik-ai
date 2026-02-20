const { ipcRenderer } = require('electron');

// Gestionnaire de vues
let currentView = 'dashboard';
let currentAgent = 'commercial';

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
    initializeNavigation();
    initializeChat();
    initializeSuggestions();
    await loadStats();
    initializeCharts();
    loadRecentActivity();
    loadProducts();
});

// Navigation
function initializeNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const view = item.dataset.view;
            switchView(view);
            
            navItems.forEach(ni => ni.classList.remove('active'));
            item.classList.add('active');
            
            document.getElementById('page-title').textContent = 
                item.querySelector('span:last-child').textContent;
        });
    });
}

function switchView(view) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(`${view}-view`).classList.add('active');
    currentView = view;
}

// Chat
function initializeChat() {
    const sendBtn = document.getElementById('send-btn');
    const messageInput = document.getElementById('message-input');
    const agentSelector = document.getElementById('agent-selector');
    
    sendBtn.addEventListener('click', sendMessage);
    
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    agentSelector.addEventListener('change', (e) => {
        currentAgent = e.target.value;
        updateAgentStatus();
    });
}

async function sendMessage() {
    const input = document.getElementById('message-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Afficher message utilisateur
    addMessageToChat('user', message);
    input.value = '';
    
    // Indicateur de frappe
    showTypingIndicator();
    
    try {
        // Envoyer à l'agent
        const response = await ipcRenderer.invoke('process-message', {
            agentType: currentAgent,
            message
        });
        
        // Retirer indicateur et afficher réponse
        hideTypingIndicator();
        addMessageToChat('agent', response);
        
    } catch (error) {
        console.error('Erreur:', error);
        hideTypingIndicator();
        addMessageToChat('agent', 'Désolé, une erreur est survenue.');
    }
}

function addMessageToChat(role, content) {
    const messagesContainer = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    
    const avatar = role === 'user' ? '👤' : '🤖';
    const time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    
    messageDiv.innerHTML = `
        <div class="avatar">${avatar}</div>
        <div class="content">
            <p>${content}</p>
            <span class="time">${time}</span>
        </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function showTypingIndicator() {
    const messagesContainer = document.getElementById('chat-messages');
    const indicator = document.createElement('div');
    indicator.className = 'message agent typing-indicator';
    indicator.id = 'typing-indicator';
    indicator.innerHTML = `
        <div class="avatar">🤖</div>
        <div class="content">
            <p>...</p>
        </div>
    `;
    messagesContainer.appendChild(indicator);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function hideTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) indicator.remove();
}

function updateAgentStatus() {
    const statusEl = document.getElementById('agent-status');
    statusEl.innerHTML = '🟢 En ligne';
}

function initializeSuggestions() {
    document.querySelectorAll('.suggestion-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.getElementById('message-input').value = chip.textContent;
        });
    });
}

// Statistiques
async function loadStats() {
    try {
        const stats = await ipcRenderer.invoke('get-stats');
        document.getElementById('user-count').textContent = stats.users;
        document.getElementById('conv-count').textContent = stats.conversations;
        document.getElementById('tx-count').textContent = stats.transactions;
        document.getElementById('revenue').textContent = 
            `${(stats.transactions * 25000).toLocaleString()} FCFA`;
    } catch (error) {
        console.error('Erreur chargement stats:', error);
    }
}

// Charts
function initializeCharts() {
    // Agent Activity Chart
    const agentCtx = document.getElementById('agent-chart').getContext('2d');
    new Chart(agentCtx, {
        type: 'line',
        data: {
            labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
            datasets: [{
                label: 'Agent Commercial',
                data: [65, 78, 90, 85, 95, 110, 120],
                borderColor: '#2563EB',
                tension: 0.4
            }, {
                label: 'Agent Financier',
                data: [45, 52, 48, 70, 65, 80, 85],
                borderColor: '#10B981',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
    
    // Transaction Chart
    const txCtx = document.getElementById('transaction-chart').getContext('2d');
    new Chart(txCtx, {
        type: 'doughnut',
        data: {
            labels: ['Mobile Money', 'Carte', 'Espèces'],
            datasets: [{
                data: [65, 20, 15],
                backgroundColor: ['#2563EB', '#10B981', '#FFB347']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Activité récente
function loadRecentActivity() {
    const activities = [
        { type: 'user', content: 'Nouvel utilisateur inscrit', time: '2 min', name: 'Fatou Diop' },
        { type: 'transaction', content: 'Transaction effectuée', time: '15 min', amount: '25000 FCFA' },
        { type: 'conversation', content: 'Conversation avec agent', time: '1 h', agent: 'Commercial' },
        { type: 'user', content: 'Nouvel utilisateur inscrit', time: '2 h', name: 'Amadou Diallo' },
        { type: 'transaction', content: 'Transaction effectuée', time: '3 h', amount: '50000 FCFA' }
    ];
    
    const listEl = document.getElementById('activity-list');
    
    activities.forEach(act => {
        const item = document.createElement('div');
        item.className = 'activity-item';
        
        let icon = '';
        let details = '';
        
        switch(act.type) {
            case 'user':
                icon = '👤';
                details = `<strong>${act.name}</strong> - ${act.content}`;
                break;
            case 'transaction':
                icon = '💰';
                details = `<strong>${act.amount}</strong> - ${act.content}`;
                break;
            case 'conversation':
                icon = '💬';
                details = `<strong>Agent ${act.agent}</strong> - ${act.content}`;
                break;
        }
        
        item.innerHTML = `
            <div class="activity-icon ${act.type}">${icon}</div>
            <div class="activity-content">
                <p>${details}</p>
                <span class="activity-time">Il y a ${act.time}</span>
            </div>
        `;
        
        listEl.appendChild(item);
    });
}

// Produits
function loadProducts() {
    const products = [
        { name: 'Smartphone Samsung', price: 150000, stock: 45, sales: 128 },
        { name: 'Ordinateur HP', price: 350000, stock: 23, sales: 56 },
        { name: 'Casque Bluetooth', price: 25000, stock: 78, sales: 203 },
        { name: 'Chargeur rapide', price: 8000, stock: 150, sales: 312 },
        { name: 'Câble USB-C', price: 5000, stock: 200, sales: 450 }
    ];
    
    const tbody = document.querySelector('#products-table tbody');
    
    products.forEach(prod => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${prod.name}</td>
            <td>${prod.price.toLocaleString()} FCFA</td>
            <td>${prod.stock}</td>
            <td>${prod.sales}</td>
        `;
        tbody.appendChild(row);
    });
    
    document.getElementById('product-count').textContent = products.length;
    document.getElementById('order-count').textContent = 
        products.reduce((sum, p) => sum + p.sales, 0);
    document.getElementById('revenue-commercial').textContent = 
        `${products.reduce((sum, p) => sum + (p.price * p.sales), 0).toLocaleString()} FCFA`;
}

// Modals
const modal = document.getElementById('about-modal');
const aboutBtn = document.getElementById('profile-btn');
const closeBtn = document.querySelector('.close');

aboutBtn.addEventListener('click', () => {
    modal.classList.add('show');
});

closeBtn.addEventListener('click', () => {
    modal.classList.remove('show');
});

window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.remove('show');
    }
});

// Notifications
document.getElementById('notification-btn').addEventListener('click', () => {
    ipcRenderer.invoke('show-notification', {
        title: 'Afrik-AI',
        body: 'Vous avez 3 nouvelles notifications'
    });
});

// Refresh
document.getElementById('refresh-btn').addEventListener('click', () => {
    location.reload();
});

// IPC Listeners
ipcRenderer.on('new-conversation', () => {
    switchView('chat');
    document.getElementById('message-input').value = '';
    document.getElementById('chat-messages').innerHTML = `
        <div class="message agent">
            <div class="avatar">🤖</div>
            <div class="content">
                <p>Bonjour ! Je suis votre assistant Afrik-AI. Comment puis-je vous aider aujourd'hui ?</p>
                <span class="time">Maintenant</span>
            </div>
        </div>
    `;
});

ipcRenderer.on('export-data', () => {
    alert('Export des données démarré...');
});

ipcRenderer.on('switch-agent', (event, agentType) => {
    currentAgent = agentType;
    document.getElementById('agent-selector').value = agentType;
    updateAgentStatus();
    switchView('chat');
});

ipcRenderer.on('configure-agents', () => {
    alert('Configuration des agents (bientôt disponible)');
});

ipcRenderer.on('show-about', () => {
    modal.classList.add('show');
});