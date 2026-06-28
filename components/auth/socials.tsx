'use client'

import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation";
import { Button } from "../ui/button"
import {FcGoogle} from "react-icons/fc";
import { useTranslations } from "next-intl";
import type { AuthMode } from "./auth-card";

type SocialsProps = {
    mode?: AuthMode;
};

export default function Socials({ mode = "login" }: SocialsProps){
    const t = useTranslations("auth");
    const searchParams = useSearchParams();
    const rawCallbackUrl = searchParams.get("callbackUrl");
    const callbackUrl =
        rawCallbackUrl?.startsWith("/") && !rawCallbackUrl.startsWith("//")
            ? rawCallbackUrl
            : "/dashboard";

    return(
        <div className="flex flex-col items-center w-full">
            <Button 
                onClick={() => signIn("google", { callbackUrl })}
                className="flex h-11 w-full items-center justify-center gap-3 rounded-full border-line bg-white text-ink hover:bg-panel"
                variant={"outline"}
            >
                <FcGoogle  className={`w-5 h-5`}/>
                <span>
                    {t(mode === "signup" ? "signupGoogle" : "loginGoogle")}
                </span>
            </Button>
            {/* <Button>Sign in with Github</Button> */}
        </div>
    )
}
