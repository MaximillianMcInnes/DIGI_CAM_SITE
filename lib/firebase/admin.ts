import { cert, getApp, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

function normalisePrivateKey(key?: string) {
  return key?.replace(/\\n/g, "\n");
}

function serviceAccountFromJson() {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!json) return null;

  const parsed = JSON.parse(json) as {
    project_id?: string;
    client_email?: string;
    private_key?: string;
  };

  if (!parsed.project_id || !parsed.client_email || !parsed.private_key) return null;

  return {
    projectId: parsed.project_id,
    clientEmail: parsed.client_email,
    privateKey: normalisePrivateKey(parsed.private_key),
  };
}

export function getFirebaseAdminApp(): App | null {
  const serviceAccount = serviceAccountFromJson();
  const projectId =
    serviceAccount?.projectId ?? process.env.FIREBASE_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = normalisePrivateKey(process.env.FIREBASE_PRIVATE_KEY);
  const storageBucket =
    process.env.FIREBASE_STORAGE_BUCKET ?? process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

  if (!projectId) return null;
  if (getApps().length) return getApp();

  if (serviceAccount) {
    return initializeApp({
      credential: cert(serviceAccount),
      projectId,
      storageBucket,
    });
  }

  if (clientEmail && privateKey) {
    return initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      projectId,
      storageBucket,
    });
  }

  return initializeApp({ projectId, storageBucket });
}

export function getAdminDb() {
  const app = getFirebaseAdminApp();
  return app ? getFirestore(app) : null;
}

export function getAdminStorage() {
  const app = getFirebaseAdminApp();
  return app ? getStorage(app) : null;
}

export async function verifyBearerToken(header: string | null) {
  const app = getFirebaseAdminApp();
  if (!app || !header?.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length);
  return getAuth(app).verifyIdToken(token);
}

export function isAdminEmail(email?: string | null) {
  if (!email) return false;
  const allowed = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  if (allowed.length === 0) return false;
  return allowed.includes(email.toLowerCase());
}
