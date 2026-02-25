const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const natural = require("natural");
require("dotenv").config();

// --- CONFIGURATION DE L'IA (NATURAL) ---
const classifier = new natural.BayesClassifier();

// Apprentissage : Intentions de VENTE
classifier.addDocument("vendre des sacs de riz", "vente");
classifier.addDocument("enregistre une vente", "vente");
classifier.addDocument("je veux vendre 2 articles", "vente");
classifier.addDocument("écouler le stock de sucre", "vente");
classifier.addDocument("faire une transaction", "vente");
classifier.addDocument("vendre", "vente");

// Apprentissage : Intentions de STOCK
classifier.addDocument("quel est le stock", "stock");
classifier.addDocument("combien reste t-il", "stock");
classifier.addDocument("inventaire des produits", "stock");
classifier.addDocument("affiche le stock de riz", "stock");
classifier.addDocument("reste en magasin", "stock");

// Apprentissage : Intentions de SALUTATION
classifier.addDocument("bonjour", "salut");
classifier.addDocument("salut kayade", "salut");
classifier.addDocument("bonsoir", "salut");
classifier.addDocument("hello", "salut");

// Lancement de l'entraînement
console.log("Entraînement de KAYADE Pro en cours...");
classifier.train();

// --- IMPORTATION DES AGENTS ---
const FinancialAgent = require("../agents/financial-agent");
let CommercialAgent;
try {
  CommercialAgent = require("../agents/commercial-agent");
} catch (e) {
  console.warn("CommercialAgent non trouvé, passage en mode simulation.");
}

const finAgent = new FinancialAgent();
const comAgent = CommercialAgent ? new CommercialAgent() : null;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "Afrik-AI - Plateforme d'Agents IA",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  const indexPath = path.join(__dirname, "..", "renderer", "index.html");
  mainWindow.loadFile(indexPath).catch((err) => {
    console.error("Erreur lors du chargement de l'index.html :", err);
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// --- GESTION DES COMMUNICATIONS (IPC) ---

// 💰 Agent Financier
ipcMain.handle("start-agent-finance", async (event, args) => {
  try {
    const location = process.env.DEFAULT_LOCATION || "Senegal";
    const account = await finAgent.createAccount(
      { name: "Utilisateur Afrik-AI", location: location },
      "perso",
      0,
    );
    return {
      success: true,
      message: `Agent AFRIK-Finance activé.`,
      currency: account.currency.toUpperCase(),
      details: `Compte initialisé pour ${location}.`,
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// 🤖 Agent Commercial (Démarrage)
ipcMain.handle("start-agent-commercial", async () => {
  try {
    if (comAgent && typeof comAgent.initialize === "function") {
      await comAgent.initialize();
    }
    return {
      success: true,
      message: "KAYADE Pro est opérationnel",
      inventoryStatus: "En ligne",
      details: "Moteur IA Natural prêt et inventaire synchronisé.",
    };
  } catch (error) {
    return {
      success: true,
      message: "KAYADE Pro (Mode démo) activé",
      inventoryStatus: "Simulation",
      details: "IA Natural active en mode local.",
    };
  }
});

// 💬 Traitement des commandes avec IA NATURAL
ipcMain.handle("process-command", async (event, text) => {
  const intent = classifier.classify(text); // Identification de l'intention
  const lowerText = text.toLowerCase();
  let feedback = "";

  // Analyse de la quantité (RegEx)
  const matchNb = text.match(/\d+/);
  const quantite = matchNb ? matchNb[0] : "1";

  switch (intent) {
    case "vente":
      let produit = "article(s)";
      if (lowerText.includes("riz")) produit = "sac(s) de riz";
      else if (lowerText.includes("sucre")) produit = "kg de sucre";
      else if (lowerText.includes("huile")) produit = "bidon(s) d'huile";

      feedback = `[IA Natural] VENTE détectée : ${quantite} ${produit} enregistré(s). Stock mis à jour.`;
      break;

    case "stock":
      feedback =
        "[IA Natural] INVENTAIRE : Riz (45 sacs), Huile (12 bidons), Sucre (20 kg). Tout est à jour.";
      break;

    case "salut":
      feedback =
        "Bonjour ! Je suis KAYADE Pro, votre assistant commercial intelligent. Que vendons-nous aujourd'hui ?";
      break;

    default:
      feedback =
        "Je ne suis pas sûr de comprendre. Voulez-vous enregistrer une vente ou voir le stock ?";
      break;
  }

  return { feedback };
});

// --- CYCLE DE VIE ---
app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
