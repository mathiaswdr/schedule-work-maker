'use client'

import { signIn } from "next-auth/react"
import { Button } from "../ui/button"
import {FcGoogle} from "react-icons/fc";
import { useTranslations } from "next-intl";

export default function Socials(){
    const t = useTranslations("auth");

    return(
        <div className="flex flex-col items-center w-full">
            <Button 
                onClick={() => signIn("google", { callbackUrl: "/" })}
                className="flex w-full max-w-sm items-center justify-center gap-4"
                variant={"outline"}
            >
                <p>
                    {t("google")}
                </p>
                <FcGoogle  className={`w-5 h-5`}/>
            </Button>
            {/* <Button>Sign in with Github</Button> */}
        </div>
    )
}
