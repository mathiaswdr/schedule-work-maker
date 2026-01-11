
import { UserPlan } from "@prisma/client";
import NextAuth, {type DefaultSession} from "next-auth";

export type ExtendUser = DefaultSession['user'] & {
    id: string,
    role: string,
    isTwoFactorEnabled: boolean,
    image: string,
    isOAuth: boolean,
    plan: UserPlan,
}

declare module 'next-auth'{
    interface Session {
        user: ExtendUser,
    }
}