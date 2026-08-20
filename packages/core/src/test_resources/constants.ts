import type { UUID } from "../types.ts";

export const SERVER_URL = "http://localhost:7998";
export const SUPABASE_URL = process.env.SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
export const TEST_EMAIL = process.env.TEST_SUPABASE_EMAIL;
export const TEST_PASSWORD = process.env.TEST_SUPABASE_PASSWORD;
export const TEST_EMAIL_2 = process.env.TEST_SUPABASE_EMAIL_2;
export const TEST_PASSWORD_2 = process.env.TEST_SUPABASE_PASSWORD_2;

export const zeroUuid = "00000000-0000-0000-0000-000000000000" as UUID;
