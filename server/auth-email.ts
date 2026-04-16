type SupportedLocale = "fr" | "en";

type MagicLinkEmailContent = {
  subject: string;
  html: string;
  text: string;
};

const BRAND = {
  name: "Kronoma",
  accent: "#f97316",
  accentAlt: "#0f766e",
  text: "#171717",
  muted: "#6b7280",
  border: "#e5e7eb",
  surface: "#fff7ed",
  background: "#f7f1e5",
  card: "#ffffff",
} as const;

const EMAIL_COPY: Record<
  SupportedLocale,
  {
    subject: string;
    preview: string;
    eyebrow: string;
    title: string;
    intro: string;
    cta: string;
    requestedFor: string;
    expiry: string;
    fallback: string;
    security: string;
    signature: string;
  }
> = {
  fr: {
    subject: "Votre lien de connexion Kronoma",
    preview: "Connectez-vous à Kronoma en un clic.",
    eyebrow: "Connexion sécurisée",
    title: "Votre espace Kronoma vous attend",
    intro:
      "Voici votre lien personnel pour vous connecter à Kronoma et reprendre votre suivi du temps sans mot de passe.",
    cta: "Se connecter à Kronoma",
    requestedFor: "Demande effectuée pour",
    expiry: "Ce lien sécurisé expire automatiquement dans 24 heures.",
    fallback:
      "Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :",
    security:
      "Si vous n'êtes pas à l'origine de cette demande, vous pouvez simplement ignorer cet email.",
    signature: "À très vite,\nL'équipe Kronoma",
  },
  en: {
    subject: "Your Kronoma sign-in link",
    preview: "Sign in to Kronoma in one click.",
    eyebrow: "Secure sign-in",
    title: "Your Kronoma workspace is ready",
    intro:
      "Here is your personal sign-in link to access Kronoma and get back to time tracking without a password.",
    cta: "Sign in to Kronoma",
    requestedFor: "Requested for",
    expiry: "This secure link expires automatically in 24 hours.",
    fallback: "If the button does not work, copy and paste this link into your browser:",
    security:
      "If you did not request this email, you can safely ignore it.",
    signature: "See you soon,\nThe Kronoma team",
  },
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getCookieValue(cookieHeader: string, key: string) {
  const parts = cookieHeader.split(";");

  for (const part of parts) {
    const [rawKey, ...rest] = part.trim().split("=");
    if (rawKey !== key) continue;
    return decodeURIComponent(rest.join("="));
  }

  return null;
}

export function resolveMagicLinkLocale(request: Request): SupportedLocale {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookieLocale = getCookieValue(cookieHeader, "NEXT_LOCALE");

  if (cookieLocale === "fr" || cookieLocale === "en") {
    return cookieLocale;
  }

  const acceptLanguage = request.headers.get("accept-language") ?? "";
  const acceptedLocales = acceptLanguage
    .split(",")
    .map((part) => part.trim().split(";")[0]?.toLowerCase())
    .filter(Boolean);

  for (const locale of acceptedLocales) {
    const baseLocale = locale.split("-")[0];
    if (baseLocale === "fr" || baseLocale === "en") {
      return baseLocale;
    }
  }

  return "fr";
}

export function buildMagicLinkEmail(params: {
  email: string;
  locale: SupportedLocale;
  url: string;
}): MagicLinkEmailContent {
  const { email, locale, url } = params;
  const copy = EMAIL_COPY[locale];
  const safeEmail = escapeHtml(email);
  const safeUrl = escapeHtml(url);
  const safeSignature = escapeHtml(copy.signature).replaceAll("\n", "<br />");

  const html = `<!DOCTYPE html>
<html lang="${locale}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(copy.subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:${BRAND.background};font-family:Inter,Arial,sans-serif;color:${BRAND.text};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      ${escapeHtml(copy.preview)}
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:${BRAND.background};">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;border-collapse:collapse;">
            <tr>
              <td style="padding-bottom:16px;text-align:left;font-size:28px;font-weight:700;color:${BRAND.text};">
                ${BRAND.name}
              </td>
            </tr>
            <tr>
              <td style="background:${BRAND.card};border:1px solid ${BRAND.border};border-radius:24px;padding:0;overflow:hidden;box-shadow:0 24px 80px rgba(15,23,42,0.08);">
                <div style="padding:32px;background:linear-gradient(135deg, ${BRAND.surface} 0%, #ffffff 72%);border-bottom:1px solid ${BRAND.border};">
                  <div style="display:inline-block;padding:8px 12px;border-radius:999px;background:rgba(15,118,110,0.10);color:${BRAND.accentAlt};font-size:12px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;">
                    ${escapeHtml(copy.eyebrow)}
                  </div>
                  <h1 style="margin:18px 0 12px;font-size:32px;line-height:1.15;color:${BRAND.text};">
                    ${escapeHtml(copy.title)}
                  </h1>
                  <p style="margin:0;font-size:16px;line-height:1.7;color:${BRAND.muted};">
                    ${escapeHtml(copy.intro)}
                  </p>
                </div>

                <div style="padding:32px;">
                  <div style="margin-bottom:24px;padding:14px 16px;border:1px solid ${BRAND.border};border-radius:16px;background:#fafafa;">
                    <div style="font-size:12px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:${BRAND.muted};margin-bottom:8px;">
                      ${escapeHtml(copy.requestedFor)}
                    </div>
                    <div style="font-size:15px;font-weight:600;color:${BRAND.text};word-break:break-word;">
                      ${safeEmail}
                    </div>
                  </div>

                  <div style="margin-bottom:24px;">
                    <a href="${safeUrl}" style="display:inline-block;padding:15px 24px;border-radius:14px;background:${BRAND.accent};color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;">
                      ${escapeHtml(copy.cta)}
                    </a>
                  </div>

                  <p style="margin:0 0 18px;font-size:14px;line-height:1.7;color:${BRAND.muted};">
                    ${escapeHtml(copy.expiry)}
                  </p>

                  <div style="margin-bottom:18px;padding:16px;border-radius:16px;background:${BRAND.surface};border:1px solid #fed7aa;">
                    <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:${BRAND.text};">
                      ${escapeHtml(copy.fallback)}
                    </p>
                    <p style="margin:0;font-size:13px;line-height:1.7;word-break:break-all;color:${BRAND.accentAlt};">
                      <a href="${safeUrl}" style="color:${BRAND.accentAlt};text-decoration:none;">${safeUrl}</a>
                    </p>
                  </div>

                  <p style="margin:0 0 24px;font-size:13px;line-height:1.7;color:${BRAND.muted};">
                    ${escapeHtml(copy.security)}
                  </p>

                  <p style="margin:0;font-size:14px;line-height:1.7;color:${BRAND.text};">
                    ${safeSignature}
                  </p>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    copy.title,
    "",
    copy.intro,
    "",
    `${copy.requestedFor}: ${email}`,
    copy.expiry,
    "",
    `${copy.cta}: ${url}`,
    "",
    copy.security,
    "",
    copy.signature,
  ].join("\n");

  return {
    subject: copy.subject,
    html,
    text,
  };
}

export async function sendMagicLinkEmail(params: {
  email: string;
  url: string;
  apiKey: string;
  from: string;
  request: Request;
}) {
  const locale = resolveMagicLinkLocale(params.request);
  const content = buildMagicLinkEmail({
    email: params.email,
    locale,
    url: params.url,
  });

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: params.from,
      to: params.email,
      subject: content.subject,
      html: content.html,
      text: content.text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend error: ${JSON.stringify(await response.json())}`);
  }
}
