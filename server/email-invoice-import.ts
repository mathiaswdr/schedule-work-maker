import crypto from "crypto";
import { Prisma } from "@prisma/client";

import { cloudinary } from "@/server/cloudinary";
import { prisma } from "@/server/prisma";
import {
  decryptToken,
  encryptToken,
  signEmailOAuthState,
} from "@/lib/email-token-crypto";

const GMAIL_SCOPE = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
].join(" ");

const INVOICE_KEYWORDS = [
  "facture",
  "invoice",
  "receipt",
  "recu",
  "reçu",
  "payment",
  "paiement",
];

type GmailMessagePart = {
  partId?: string;
  mimeType?: string;
  filename?: string;
  headers?: Array<{ name: string; value: string }>;
  body?: {
    attachmentId?: string;
    data?: string;
    size?: number;
  };
  parts?: GmailMessagePart[];
};

type GmailMessage = {
  id: string;
  internalDate?: string;
  snippet?: string;
  payload?: GmailMessagePart;
};

type GmailConnection = {
  id: string;
  userId: string;
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date | null;
};

function getGmailClientConfig(origin?: string) {
  const clientId =
    process.env.GMAIL_INVOICE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret =
    process.env.GMAIL_INVOICE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  const appUrl =
    origin ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.AUTH_URL ||
    "http://localhost:3000";

  if (!clientId || !clientSecret) {
    throw new Error("Missing Gmail OAuth client configuration");
  }

  return {
    clientId,
    clientSecret,
    redirectUri: `${appUrl.replace(/\/$/, "")}/api/email-invoices/oauth/gmail/callback`,
  };
}

export function buildGmailOAuthUrl(userId: string, origin?: string) {
  const { clientId, redirectUri } = getGmailClientConfig(origin);
  const state = signEmailOAuthState({
    userId,
    provider: "GMAIL",
    nonce: crypto.randomBytes(16).toString("base64url"),
    createdAt: Date.now(),
  });
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");

  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GMAIL_SCOPE);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", state);

  return url.toString();
}

export async function exchangeGmailCode(code: string, origin?: string) {
  const { clientId, clientSecret, redirectUri } = getGmailClientConfig(origin);
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    throw new Error("Unable to exchange Gmail OAuth code");
  }

  return (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
  };
}

export async function getGmailProfile(accessToken: string) {
  const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error("Unable to read Gmail profile");
  }

  return (await response.json()) as { email: string };
}

export async function refreshGmailAccessToken(connection: GmailConnection) {
  if (
    connection.expiresAt &&
    connection.expiresAt.getTime() > Date.now() + 60_000
  ) {
    return decryptToken(connection.accessToken);
  }

  if (!connection.refreshToken) {
    return decryptToken(connection.accessToken);
  }

  const { clientId, clientSecret } = getGmailClientConfig();
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: decryptToken(connection.refreshToken),
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new Error("Unable to refresh Gmail token");
  }

  const payload = (await response.json()) as {
    access_token: string;
    expires_in?: number;
  };
  const expiresAt = payload.expires_in
    ? new Date(Date.now() + payload.expires_in * 1000)
    : null;

  await prisma.emailConnection.update({
    where: { id: connection.id },
    data: {
      accessToken: encryptToken(payload.access_token),
      expiresAt,
    },
  });

  return payload.access_token;
}

function flattenParts(part?: GmailMessagePart): GmailMessagePart[] {
  if (!part) return [];
  return [part, ...(part.parts ?? []).flatMap(flattenParts)];
}

function headerValue(message: GmailMessage, name: string) {
  const headers = message.payload?.headers ?? [];
  return headers.find((header) => header.name.toLowerCase() === name)?.value;
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url");
}

function normalizeMoneyValue(value: string) {
  const normalized = value
    .replace(/\s/g, "")
    .replace(/'/g, "")
    .replace(",", ".");

  return Number.parseFloat(normalized);
}

function detectCurrency(text: string) {
  if (/\bCHF\b/i.test(text)) return "CHF";
  if (/\bEUR\b|€/i.test(text)) return "EUR";
  if (/\bUSD\b|\$/i.test(text)) return "USD";
  return null;
}

function detectAmount(text: string) {
  const totalMatch = text.match(
    /(?:total|amount due|montant|ttc|paid|payment)[^\d]{0,30}(?:CHF|EUR|USD|€|\$)?\s*([0-9][0-9\s'.]*(?:[,.][0-9]{2})?)/i
  );
  const genericMatch = text.match(
    /(?:CHF|EUR|USD|€|\$)\s*([0-9][0-9\s'.]*(?:[,.][0-9]{2})?)/i
  );
  const value = totalMatch?.[1] ?? genericMatch?.[1];

  if (!value) return null;

  const amount = normalizeMoneyValue(value);
  return Number.isFinite(amount) ? amount : null;
}

function detectDate(text: string) {
  const iso = text.match(/\b(20\d{2})[-/.](0?[1-9]|1[0-2])[-/.](0?[1-9]|[12]\d|3[01])\b/);
  if (iso) return new Date(`${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`);

  const european = text.match(/\b(0?[1-9]|[12]\d|3[01])[-/.](0?[1-9]|1[0-2])[-/.](20\d{2})\b/);
  if (european) return new Date(`${european[3]}-${european[2].padStart(2, "0")}-${european[1].padStart(2, "0")}`);

  return null;
}

function detectVendor(sender: string | undefined, subject: string | undefined) {
  const senderName = sender?.match(/^"?([^"<]+)"?\s*</)?.[1]?.trim();
  if (senderName) return senderName;

  const senderDomain = sender?.match(/@([^>]+)/)?.[1]?.split(".")?.[0];
  if (senderDomain) {
    return senderDomain.charAt(0).toUpperCase() + senderDomain.slice(1);
  }

  return subject?.split(/[-:|]/)[0]?.trim() || null;
}

function extractInvoiceFields(input: {
  sender?: string;
  subject?: string;
  snippet?: string;
  attachmentFileName: string;
}) {
  const text = [
    input.sender,
    input.subject,
    input.snippet,
    input.attachmentFileName,
  ]
    .filter(Boolean)
    .join("\n");
  const totalAmount = detectAmount(text);
  const invoiceDate = detectDate(text);
  const vendorName = detectVendor(input.sender, input.subject);
  const currency = detectCurrency(text);
  const hasKeyword = INVOICE_KEYWORDS.some((keyword) =>
    text.toLowerCase().includes(keyword)
  );

  const confidenceScore =
    (vendorName ? 0.25 : 0) +
    (invoiceDate ? 0.2 : 0) +
    (totalAmount ? 0.25 : 0) +
    (currency ? 0.1 : 0) +
    (hasKeyword ? 0.2 : 0);

  return {
    extractedText: text.slice(0, 4000),
    vendorName,
    invoiceDate,
    currency,
    totalAmount,
    confidenceScore: Math.min(confidenceScore, 1),
  };
}

async function gmailFetch<T>(url: string, accessToken: string) {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error("Gmail API request failed");
  }

  return (await response.json()) as T;
}

async function uploadDetectedAttachment(input: {
  userId: string;
  fileName: string;
  buffer: Buffer;
}) {
  const result = await new Promise<{ secure_url: string; public_id: string }>(
    (resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: "auto",
          folder: `kronoma/${input.userId}/email-invoices`,
          filename_override: input.fileName,
        },
        (error, result) => {
          if (error || !result) reject(error || new Error("Upload failed"));
          else {
            resolve({
              secure_url: result.secure_url,
              public_id: result.public_id,
            });
          }
        }
      );

      stream.end(input.buffer);
    }
  );

  return { url: result.secure_url, storageKey: result.public_id };
}

export async function scanGmailInvoices(userId: string) {
  const connections = await prisma.emailConnection.findMany({
    where: { userId, provider: "GMAIL" },
    orderBy: { createdAt: "desc" },
  });

  let created = 0;

  for (const connection of connections) {
    const accessToken = await refreshGmailAccessToken(connection);
    const query = encodeURIComponent(
      'newer_than:12m has:attachment filename:pdf (facture OR invoice OR receipt OR recu OR payment)'
    );
    const list = await gmailFetch<{
      messages?: Array<{ id: string }>;
    }>(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}&maxResults=25`,
      accessToken
    );

    for (const item of list.messages ?? []) {
      const message = await gmailFetch<GmailMessage>(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${item.id}?format=full`,
        accessToken
      );
      const sender = headerValue(message, "from");
      const subject = headerValue(message, "subject");
      const receivedAt = message.internalDate
        ? new Date(Number(message.internalDate))
        : null;
      const attachments = flattenParts(message.payload).filter((part) => {
        const fileName = part.filename?.trim() ?? "";
        return (
          fileName.toLowerCase().endsWith(".pdf") &&
          !!part.body?.attachmentId
        );
      });

      for (const attachment of attachments) {
        const fileName = attachment.filename?.trim();
        const attachmentId = attachment.body?.attachmentId;
        if (!fileName || !attachmentId) continue;

        const existing = await prisma.detectedInvoice.findUnique({
          where: {
            emailConnectionId_providerMessageId_attachmentFileName: {
              emailConnectionId: connection.id,
              providerMessageId: message.id,
              attachmentFileName: fileName,
            },
          },
          select: { id: true },
        });

        if (existing) continue;

        const attachmentPayload = await gmailFetch<{ data?: string }>(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}/attachments/${attachmentId}`,
          accessToken
        );

        if (!attachmentPayload.data) continue;

        const upload = await uploadDetectedAttachment({
          userId,
          fileName,
          buffer: decodeBase64Url(attachmentPayload.data),
        });
        const extracted = extractInvoiceFields({
          sender,
          subject,
          snippet: message.snippet,
          attachmentFileName: fileName,
        });

        try {
          await prisma.detectedInvoice.create({
            data: {
              userId,
              emailConnectionId: connection.id,
              providerMessageId: message.id,
              sender,
              subject,
              receivedAt,
              attachmentFileName: fileName,
              attachmentMimeType: attachment.mimeType ?? "application/pdf",
              attachmentStorageUrl: upload.url,
              storageKey: upload.storageKey,
              ...extracted,
            },
          });
          created += 1;
        } catch (error) {
          if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
          ) {
            continue;
          }
          throw error;
        }
      }
    }
  }

  return { created, connectionCount: connections.length };
}
