import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User 
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  orderBy, 
  deleteDoc,
  Timestamp 
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import { DevLogDocument, DevLogTranscript, StructuredDevLog, ChatMessage } from "../types";

// Initialize Firebase App singleton
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// Firestore instance targeting the specific database if configured
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Zero-crash Undefined Stripping Utility
export function sanitizePayload<T extends Record<string, any>>(obj: T): T {
  return JSON.parse(JSON.stringify(obj, (key, value) => {
    return value === undefined ? null : value;
  }));
}

// Authentication Helpers
export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error("Google Sign-In Error:", error);
    throw error;
  }
}

export async function logOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// User-scoped Database Paths & Repositories
// All paths are owner-bound: /users/{userId}/devlogs/{logId} and /users/{userId}/transcripts/{transcriptId}

/**
 * Saves a completed DevLog and its full original transcript atomically.
 */
export async function saveDevLogWithTranscript(
  userId: string,
  structuredLog: StructuredDevLog,
  messages: ChatMessage[]
): Promise<{ logId: string; transcriptId: string }> {
  if (!userId) {
    throw new Error("Cannot save DevLog: unauthenticated user.");
  }

  const timestamp = Date.now();
  const logId = "log_" + timestamp + "_" + Math.random().toString(36).substring(2, 7);
  const transcriptId = "tr_" + timestamp + "_" + Math.random().toString(36).substring(2, 7);

  // 1. Transcript payload
  const transcriptDoc: DevLogTranscript = {
    id: transcriptId,
    userId,
    devLogId: logId,
    messages,
    createdAt: timestamp,
  };

  // 2. Structured DevLog Document payload
  const devLogDoc: DevLogDocument = {
    ...structuredLog,
    id: logId,
    userId,
    createdAt: timestamp,
    updatedAt: timestamp,
    transcriptId,
  };

  const safeTranscript = sanitizePayload(transcriptDoc);
  const safeLog = sanitizePayload(devLogDoc);

  // Save to /users/{userId}/transcripts/{transcriptId}
  const transcriptRef = doc(db, "users", userId, "transcripts", transcriptId);
  await setDoc(transcriptRef, safeTranscript);

  // Save to /users/{userId}/devlogs/{logId}
  const logRef = doc(db, "users", userId, "devlogs", logId);
  await setDoc(logRef, safeLog);

  return { logId, transcriptId };
}

/**
 * Fetches all DevLogs strictly for the current authenticated user.
 */
export async function fetchUserDevLogs(userId: string): Promise<DevLogDocument[]> {
  if (!userId) return [];
  const logsRef = collection(db, "users", userId, "devlogs");
  const q = query(logsRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  const logs: DevLogDocument[] = [];
  snapshot.forEach((docSnap) => {
    logs.push(docSnap.data() as DevLogDocument);
  });
  return logs;
}

/**
 * Fetches the raw chat transcript for a specific log.
 */
export async function fetchLogTranscript(userId: string, transcriptId: string): Promise<DevLogTranscript | null> {
  if (!userId || !transcriptId) return null;
  const transcriptRef = doc(db, "users", userId, "transcripts", transcriptId);
  const snap = await getDoc(transcriptRef);
  if (!snap.exists()) return null;
  return snap.data() as DevLogTranscript;
}

/**
 * Deletes a DevLog and its corresponding transcript.
 */
export async function deleteUserDevLog(userId: string, logId: string, transcriptId?: string): Promise<void> {
  if (!userId || !logId) return;
  const logRef = doc(db, "users", userId, "devlogs", logId);
  await deleteDoc(logRef);

  if (transcriptId) {
    const transcriptRef = doc(db, "users", userId, "transcripts", transcriptId);
    await deleteDoc(transcriptRef).catch((e) => console.warn("Failed to delete transcript doc:", e));
  }
}
