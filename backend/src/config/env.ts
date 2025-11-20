import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.env') });

type Env = {
  port: number;
  geminiApiKey: string | undefined;
};

export const env: Env = {
  port: Number(process.env.PORT) || 4000,
  geminiApiKey: process.env.GEMINI_API_KEY,
};

export const requireGeminiKey = (): string => {
  if (!env.geminiApiKey) {
    throw new Error('Missing required env var: GEMINI_API_KEY');
  }

  return env.geminiApiKey;
};
