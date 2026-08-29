const { initializeApp, cert, getApps } = require("firebase-admin/app");
const serviceAccount = require("./mygroceryapp-709d6-firebase-adminsdk-fbsvc-0c276df458.json");

// Initialize Firebase Admin SDK
if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

module.exports = {};
