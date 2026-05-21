export type CloudinaryDestroyOutcome = 'ok' | 'not_found' | 'skipped';

export interface CloudinaryDestroyResult {
  publicId: string;
  outcome: CloudinaryDestroyOutcome;
}

export interface CloudinaryRuntimeConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}
