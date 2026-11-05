import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const targetPath = path.join(rootDir, 'firebase-applet-config.json');
const examplePath = path.join(rootDir, 'firebase-applet-config.example.json');

if (fs.existsSync(targetPath)) {
  console.log('[ensure-firebase-config] firebase-applet-config.json already present.');
  process.exit(0);
}

const fromEnv = {
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'YOUR_FIREBASE_PROJECT_ID',
  appId: process.env.VITE_FIREBASE_APP_ID || 'YOUR_FIREBASE_APP_ID',
  apiKey: process.env.VITE_FIREBASE_API_KEY || 'YOUR_FIREBASE_WEB_API_KEY',
  authDomain:
    process.env.VITE_FIREBASE_AUTH_DOMAIN ||
    `${process.env.VITE_FIREBASE_PROJECT_ID || 'YOUR_FIREBASE_PROJECT_ID'}.firebaseapp.com`,
  firestoreDatabaseId:
    process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || 'YOUR_FIRESTORE_DATABASE_ID',
  storageBucket:
    process.env.VITE_FIREBASE_STORAGE_BUCKET ||
    `${process.env.VITE_FIREBASE_PROJECT_ID || 'YOUR_FIREBASE_PROJECT_ID'}.firebasestorage.app`,
  messagingSenderId:
    process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || 'YOUR_MESSAGING_SENDER_ID',
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || '',
};

if (process.env.VITE_FIREBASE_PROJECT_ID && process.env.VITE_FIREBASE_API_KEY) {
  fs.writeFileSync(targetPath, JSON.stringify(fromEnv, null, 2) + '\n', 'utf8');
  console.log(
    '[ensure-firebase-config] Generated firebase-applet-config.json from VITE_FIREBASE_* environment variables.'
  );
} else if (fs.existsSync(examplePath)) {
  fs.copyFileSync(examplePath, targetPath);
  console.log(
    '[ensure-firebase-config] Copied firebase-applet-config.example.json to firebase-applet-config.json for build.'
  );
} else {
  fs.writeFileSync(targetPath, JSON.stringify(fromEnv, null, 2) + '\n', 'utf8');
  console.log('[ensure-firebase-config] Created fallback firebase-applet-config.json.');
}
