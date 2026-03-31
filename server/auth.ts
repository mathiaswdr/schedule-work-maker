import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Email from "next-auth/providers/email";
import Resend from "next-auth/providers/resend";
import type { Provider } from "next-auth/providers";
import { UserPlan } from "@prisma/client";

import { prisma } from "@/server/prisma";
import { stripe } from "./stripe";
import {
  isE2ETestMode,
  isEmailAuthEnabled,
  isMagicLinkCaptureEnabled,
  storeMagicLink,
} from "./e2e-auth";

const providers: Provider[] = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

if (isEmailAuthEnabled) {
  providers.push(
    isMagicLinkCaptureEnabled
      ? Email({
          id: "email",
          name: "Email",
          from: process.env.AUTH_RESEND_FROM ?? "Kronoma <no-reply@kronoma.local>",
          server: { jsonTransport: true },
          async sendVerificationRequest({ identifier, url }) {
            storeMagicLink(identifier, url);
          },
        })
      : Resend({
          from: process.env.AUTH_RESEND_FROM!,
          apiKey: process.env.AUTH_RESEND_KEY!,
        })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: process.env.AUTH_SECRET!,
  session: { strategy: "jwt" },
  providers,
  events: {
    createUser: async (message) => {
      if (isE2ETestMode) {
        await prisma.user.update({
          where: { id: message.user.id },
          data: { plan: UserPlan.STARTER },
        });
        return;
      }

      const userId = message.user.id;
      const email = message.user.email;
      const name = message.user.name;

      if (!userId || !email) {
        return;
      }

      try {
        const stripeCustomer = await stripe.customers.create({
          email,
          name: name ?? undefined,
        });

        await prisma.user.update({
          where: {
            id: userId,
          },
          data: {
            stripeCustomerId: stripeCustomer.id,
          },
        });
      } catch (error) {
        console.error("Stripe customer creation failed:", error);
      }
    },
  },
  callbacks: {
    async session({ session, token }) {
      if (session && token.sub) {
        session.user.id = token.sub;
      }

      if (session.user && token.role) {
        session.user.role = token.role as string;
      }

      if (session.user) {
        session.user.isTwoFactorEnabled = token.isTwoFactorEnabled as boolean;
        session.user.name = token.name;
        session.user.email = token.email as string;
        session.user.isOAuth = token.isOAuth as boolean;
        session.user.image = token.image as string;
        session.user.plan = token.plan as UserPlan;
      }

      return session;
    },

    async jwt({ token }) {
      if (!token.sub) return token;

      try {
        const existingUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isTwoFactorEnabled: true,
            image: true,
            plan: true,
          },
        });

        if (!existingUser) return token;

        const existingAccount = await prisma.account.findFirst({
          where: { userId: existingUser.id },
        });

        token.isOAuth = !!existingAccount;
        token.name = existingUser.name;
        token.email = existingUser.email;
        token.role = existingUser.role;
        token.isTwoFactorEnabled = existingUser.isTwoFactorEnabled;
        token.image = existingUser.image;
        token.plan = existingUser.plan;

        return token;
      } catch (error) {
        console.error("JWT Transaction Error:", error);
        return token;
      }
    },
  },
});
