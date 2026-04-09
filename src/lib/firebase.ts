import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromCache, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

console.log('Initializing Firebase with Database ID:', firebaseConfig.firestoreDatabaseId);

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Test connection
async function testConnection() {
  try {
    // Try to fetch a non-existent doc just to check connectivity and permissions
    await getDocFromServer(doc(db, '_connection_test_', 'ping'));
    console.log('Firestore connection test successful');
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Firestore connection failed: The client is offline or configuration is incorrect.");
    } else {
      console.warn("Firestore connection test finished (expected if rules deny access to this path):", error);
    }
  }
}
testConnection();
