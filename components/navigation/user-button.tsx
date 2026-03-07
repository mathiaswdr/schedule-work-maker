'use client'

import { Session } from "next-auth"
import { signOut } from "next-auth/react"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"
  
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Image from "next/image"
import { LogOut, Moon, Settings, Sun, TruckIcon, User, Captions, ChartNoAxesGantt } from "lucide-react"
import { useTheme } from "next-themes"
import { useState } from "react"
import { Switch } from "../ui/switch"
import { useRouter } from "next/navigation"

import BuyButtonClient from "../payment/BuyButtonClient"
import PaymentDashboardClient from "../payment/PaymentDashboardClient"

export const UserButton = ({user}: Session) => {

    const {setTheme, theme} = useTheme()
    const [checked, setChecked] = useState(false)
    const router = useRouter()


    function setSwitchState(){
        switch(theme){
            case "dark": return setChecked(true);
            case "light": return setChecked(false);
            case "system": return setChecked(false);
        }
    }

    return(
        <DropdownMenu modal={false}>
        <DropdownMenuTrigger>
            <Avatar>
                {user?.image && (
                    <Image src={user.image} alt={user.name!} fill={true} />
                )}

                {!user?.image && 
                    <AvatarFallback className="bg-primary/25">
                        <div className="font-bold">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                    </AvatarFallback>
                }
            </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64 p-4" align="end">
            {/* <DropdownMenuLabel>My Account</DropdownMenuLabel> */}

            <div className="mb-4 p-4 flex flex-col gap-1 items-center bg-primary/25 rounded-lg overflow-hidden">
                {user?.image && (
                    <Image src={user.image} alt={user.name!} width={36} height={36} className="rounded-full w-12 h-12 object-cover" />
                )}
                <p className="font-bold text-xs">{user?.name}</p>
                <span className="font-medium text-secondary-foreground text-xs">{user?.email}</span>
            </div>
            <DropdownMenuSeparator />
            {/* <DropdownMenuItem onClick={() => router.push("/dashboard/orders")} className="py-2 cursor-pointer font-medium transition-all duration-500 group ease-in-out">
                <TruckIcon size={14 } className="mr-3 group-hover:scale-110 transition-all duration-300 ease-in-out"/> 
                Orders
            </DropdownMenuItem> */}
            <DropdownMenuItem onClick={() => router.push("/profile")} className="py-2 cursor-pointer font-medium transition-all duration-500 group ease-in-out">
                <User size={14 } className="mr-3 group-hover:scale-110 transition-all duration-300 ease-in-out"/> 
                Profile
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => router.push("/dashboard/settings")} className="py-2 cursor-pointer font-medium transition-all duration-500 group ease-in-out">
                <Settings size={14} className="mr-3 group-hover:rotate-180 transition-all duration-300 ease-in-out"/> 
                Settings
            </DropdownMenuItem>

            {user.plan === "FREE" ? (
                <DropdownMenuItem className="py-2 cursor-pointer font-medium transition-all duration-500 group ease-in-out">
                    <Captions size={14} className="mr-3 group-hover:scale-105 transition-all duration-300 ease-in-out" />
                    <BuyButtonClient plan="STARTER" />
                </DropdownMenuItem>
            ) : user.plan === "STARTER" ? (
                <DropdownMenuItem onClick={() => router.push("/dashboard/subscription")} className="py-2 cursor-pointer font-medium transition-all duration-500 group ease-in-out">
                    <ChartNoAxesGantt size={14} className="mr-3 group-hover:scale-105 transition-all duration-300 ease-in-out" />
                    Upgrade to Pro
                </DropdownMenuItem>
            ) : (
                <DropdownMenuItem className="py-2 cursor-pointer font-medium transition-all duration-500 group ease-in-out">
                    <ChartNoAxesGantt size={14} className="mr-3 group-hover:scale-105 transition-all duration-300 ease-in-out" />
                    <PaymentDashboardClient />
                </DropdownMenuItem>
            )}

            {theme && (
                <DropdownMenuItem className="py-2 cursor-pointer font-medium transition-all duration-500 group ease-in-out">
                    <div onClick={(e) => e.stopPropagation()} className="flex items-center ">

                        <div className="relative flex mr-3">
                            <Sun size={14} className="dark:scale-0 dark:-rotate-90 absolute group-hover:text-yellow-500 group-hover:rotate-180 transition-all duration-500 ease-in-out" />
                            <Moon size={14} className="scale-0 rotate-90 dark:scale-100 dark:rotate-0 group-hover:text-blue-400 transition-all duration-500 ease-in-out" />
                        </div>
         
                        <p className="dark:text-blue-400 text-secondary-foreground/75 text-yellow-600">
                            {theme[0].toUpperCase() + theme?.slice(1)} Mode
                        </p>
                        <Switch className="scale-75 ml-2" checked={checked} onCheckedChange={(e) => {
                            setChecked((prev) => !prev)
                            if(e) setTheme("dark")
                            if(!e) setTheme("light")
                        }} />
                    </div>
                </DropdownMenuItem>
            )}



  


            <DropdownMenuItem onClick={() => signOut()} className="py-2 focus:bg-destructive/70 cursor-pointer font-medium transition-all duration-500 group">
                <LogOut size={14} className="mr-3 group-hover:translate-x-1 transition-all duration-300 ease-in-out"/>
                Sign out
            </DropdownMenuItem>

        </DropdownMenuContent>
        </DropdownMenu>
    )
}  