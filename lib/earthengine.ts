import ee from '@google/earthengine';

let isInitialized = false;
let initPromise: Promise<void> | null = null;

export interface EarthEngineCredentials {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

/**
 * Parses and sanitizes Earth Engine credentials from environment variables.
 * Handles escaped newlines often found in .env files for PEM private keys.
 */
export function getEarthEngineCredentials(): EarthEngineCredentials | null {
  const projectId = process.env.EARTH_ENGINE_PROJECT_ID?.trim();
  const clientEmail = process.env.EARTH_ENGINE_CLIENT_EMAIL?.trim();
  let rawPrivateKey = process.env.EARTH_ENGINE_PRIVATE_KEY?.trim();

  if (!projectId || !clientEmail || !rawPrivateKey) {
    return null;
  }

  // Handle case where user passes the entire JSON service account key
  if (rawPrivateKey.startsWith('{') && rawPrivateKey.endsWith('}')) {
    try {
      const parsed = JSON.parse(rawPrivateKey);
      return {
        projectId: parsed.project_id || projectId,
        clientEmail: parsed.client_email || clientEmail,
        privateKey: parsed.private_key,
      };
    } catch {
      // Continue with normal string handling if JSON parsing fails
    }
  }

  // Strip wrapping quotes if present
  if ((rawPrivateKey.startsWith('"') && rawPrivateKey.endsWith('"')) ||
      (rawPrivateKey.startsWith("'") && rawPrivateKey.endsWith("'"))) {
    rawPrivateKey = rawPrivateKey.slice(1, -1);
  }

  // Convert literal \n strings to real newlines
  const privateKey = rawPrivateKey.replace(/\\n/g, '\n');

  return {
    projectId,
    clientEmail,
    privateKey,
  };
}

export function isEarthEngineConfigured(): boolean {
  return getEarthEngineCredentials() !== null;
}

/**
 * Initializes and authenticates with Google Earth Engine using the service account credentials.
 * Ensures single initialization across concurrent requests.
 */
export async function initializeEarthEngine(): Promise<void> {
  if (isInitialized) {
    return;
  }

  if (initPromise) {
    return initPromise;
  }

  const creds = getEarthEngineCredentials();
  if (!creds) {
    throw new Error(
      'Google Earth Engine credentials are missing. Please configure EARTH_ENGINE_PROJECT_ID, EARTH_ENGINE_CLIENT_EMAIL, and EARTH_ENGINE_PRIVATE_KEY in .env.local.'
    );
  }

  initPromise = new Promise<void>((resolve, reject) => {
    const privateKeyObj = {
      client_email: creds.clientEmail,
      private_key: creds.privateKey,
    };

    ee.data.authenticateViaPrivateKey(
      privateKeyObj,
      () => {
        ee.initialize(
          null,
          null,
          () => {
            isInitialized = true;
            resolve();
          },
          (initErr: unknown) => {
            initPromise = null;
            const msg = typeof initErr === 'string' 
              ? initErr 
              : (initErr as Error)?.message || 'Failed to initialize Earth Engine API client';
            reject(new Error(`Earth Engine initialize error: ${msg}`));
          },
          null,
          creds.projectId
        );
      },
      (authErr: unknown) => {
        initPromise = null;
        const msg = typeof authErr === 'string'
          ? authErr
          : (authErr as Error)?.message || 'Failed to authenticate service account with Earth Engine';
        reject(new Error(`Earth Engine auth error: ${msg}`));
      }
    );
  });

  return initPromise;
}

/**
 * Evaluates any Earth Engine server object (Image, Geometry, FeatureCollection, Number, Dictionary)
 * into a standard JavaScript Promise.
 */
export function evaluateEE<T = unknown>(eeObject: any): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    if (!eeObject || typeof eeObject.evaluate !== 'function') {
      return reject(new Error('Invalid Earth Engine object provided to evaluateEE'));
    }

    eeObject.evaluate((result: T, error: unknown) => {
      if (error) {
        const msg = typeof error === 'string' 
          ? error 
          : (error as Error)?.message || 'Earth Engine evaluation failed';
        return reject(new Error(msg));
      }
      resolve(result);
    });
  });
}

/**
 * Diagnostic check for API and credential health
 */
export async function getEarthEngineStatus(): Promise<{
  configured: boolean;
  authenticated: boolean;
  projectId?: string;
  clientEmail?: string;
  error?: string;
}> {
  const creds = getEarthEngineCredentials();
  if (!creds) {
    return {
      configured: false,
      authenticated: false,
      error: 'Environment variables EARTH_ENGINE_PROJECT_ID, EARTH_ENGINE_CLIENT_EMAIL, or EARTH_ENGINE_PRIVATE_KEY not set.',
    };
  }

  try {
    await initializeEarthEngine();
    return {
      configured: true,
      authenticated: true,
      projectId: creds.projectId,
      clientEmail: creds.clientEmail,
    };
  } catch (err) {
    return {
      configured: true,
      authenticated: false,
      projectId: creds.projectId,
      clientEmail: creds.clientEmail,
      error: (err as Error).message,
    };
  }
}

export { ee };
