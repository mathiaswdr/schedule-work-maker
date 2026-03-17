import { NextResponse } from "next/server";

import { auth } from "@/server/auth";

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export async function requireUserId() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new UnauthorizedError();
  }

  return userId;
}

export async function withAuthenticatedRoute(
  handler: (userId: string) => Promise<NextResponse>
) {
  try {
    const userId = await requireUserId();
    return await handler(userId);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    throw error;
  }
}
