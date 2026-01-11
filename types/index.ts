import { UserPlan } from "@prisma/client"


export type ExistingUserType = {
    id: string;
    name: string | null;
    email: string | null;
    emailVerified: Date | null;
    image: string | null;
    role: string;
    isTwoFactorEnabled: boolean;
    plan: UserPlan;
  };
  