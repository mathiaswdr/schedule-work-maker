import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

function getSecret() {
  const secret =
    process.env.EMAIL_TOKEN_ENCRYPTION_KEY ||
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET;

  if (!secret) {
    throw new Error("Missing token encryption secret");
  }

  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptToken(value: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getSecret(), iv);
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [iv, tag, encrypted]
    .map((part) => part.toString("base64url"))
    .join(".");
}

export function decryptToken(value: string) {
  const [ivValue, tagValue, encryptedValue] = value.split(".");

  if (!ivValue || !tagValue || !encryptedValue) {
    throw new Error("Invalid encrypted token");
  }

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    getSecret(),
    Buffer.from(ivValue, "base64url")
  );
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function signEmailOAuthState(payload: {
  userId: string;
  provider: "GMAIL" | "OUTLOOK";
  nonce: string;
  createdAt: number;
}) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", getSecret())
    .update(body)
    .digest("base64url");

  return `${body}.${signature}`;
}

export function verifyEmailOAuthState(value: string) {
  const [body, signature] = value.split(".");

  if (!body || !signature) return null;

  const expected = crypto
    .createHmac("sha256", getSecret())
    .update(body)
    .digest("base64url");

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as {
    userId: string;
    provider: "GMAIL" | "OUTLOOK";
    nonce: string;
    createdAt: number;
  };

  const fifteenMinutes = 15 * 60 * 1000;
  if (Date.now() - payload.createdAt > fifteenMinutes) return null;

  return payload;
}
