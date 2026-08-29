const { initializeApp, cert, getApps } = require("firebase-admin/app");

let serviceAccount;
try {
  // Local development: Read from the local .json file
  serviceAccount = require("./mygroceryapp-709d6-firebase-adminsdk-fbsvc-0c276df458.json");
} catch (error) {
  // Render / Production: Fallback to Environment Variables since file is gitignored
  serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
  };
}

// Initialize Firebase Admin SDK
if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

module.exports = {};
