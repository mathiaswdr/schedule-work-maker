import { auth } from "@/server/auth";
import NavClient from "./nav-client";

export default async function Nav() {
  const session = await auth();

  return (
    <NavClient user={session?.user ?? null} />
  );
}
