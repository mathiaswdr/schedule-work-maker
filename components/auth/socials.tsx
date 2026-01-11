'use client'

import { signIn } from "next-auth/react"
import { Button } from "../ui/button"
import {FcGoogle} from "react-icons/fc";

export default function Socials(){

    return(
        <div className="flex flex-col items-center w-full">
            <Button 
                onClick={() => signIn('google', {callbackUrl: "/", redirect: false})}
                className="flex gap-4 w-1/2"
                variant={"outline"}
            >
                <p>
                    Sign in with Google
                </p>
                <FcGoogle  className={`w-5 h-5`}/>
            </Button>
            {/* <Button>Sign in with Github</Button> */}
        </div>
    )
}