
import {auth} from "@/server/auth"
import { UserButton } from "./user-button";
import { Button } from "../ui/button";
import Link from "next/link";
import { LogIn } from "lucide-react";
import CartDrawer from "../cart/test-drawer";
import { ExistingUserType } from "@/types";
import BuyButton from "../payment/BuyButton";
import BuyButtonClient from "../payment/BuyButtonClient";


export default async function Nav(){

    const session = await auth();

    return(
        <nav className="flex justify-center items-center p-6 w-screen backdrop-blur-sm	bg-white/30 fixed top-0">
            <ul className="flex justify-between items-center w-full maxW">
                <li>
                    <Link href={"/"}>
                        Pokedy
                    </Link>
                </li>
                <li>
                    <div className="flex gap-x-3 items-center">
                        {/* <CartDrawer /> */}
                        {!session ? (
                            <Button  asChild className="gap-4 bg-primary">
                                <Link href={"/auth/login"}><LogIn size={16} /><span>Login</span></Link>
                            </Button>
                        ) : (
                            <>                               
                                <UserButton expires={session?.expires as string} user={session?.user} />
                            </>
                        )}
                    </div>
                </li>  
                
            </ul>
           
        </nav>
    )
}