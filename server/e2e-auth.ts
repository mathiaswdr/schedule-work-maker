const EMAIL_ENV_KEYS = [
  "EMAIL_SERVER_HOST",
  "EMAIL_SERVER_PORT",
  "EMAIL_FROM",
] as const;

type MagicLinkStore = Map<string, string>;

const globalForMagicLinks = globalThis as unknown as {
  e2eMagicLinks?: MagicLinkStore;
};

const magicLinks =
  globalForMagicLinks.e2eMagicLinks ?? new Map<string, string>();

if (process.env.NODE_ENV !== "production") {
  globalForMagicLinks.e2eMagicLinks = magicLinks;
}

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const isE2ETestMode = process.env.E2E_TEST_MODE === "1";

export const isEmailAuthEnabled =
  isE2ETestMode ||
  EMAIL_ENV_KEYS.every((key) => {
    const value = process.env[key];
    return typeof value === "string" && value.length > 0;
  });

export function storeMagicLink(email: string, url: string) {
  magicLinks.set(normalizeEmail(email), url);
}

export function getMagicLink(email: string) {
  return magicLinks.get(normalizeEmail(email)) ?? null;
}
