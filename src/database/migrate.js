const { sequelize } = require('./database');

async function migrate() {
    try {
        console.log('🔄 Début des migrations...');
        
        await sequelize.sync({ force: true });
        
        console.log('✅ Migrations terminées avec succès');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur migrations:', error);
        process.exit(1);
    }
}

migrate();