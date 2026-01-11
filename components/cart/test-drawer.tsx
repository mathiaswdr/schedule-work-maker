'use client'
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
  } from "@/components/ui/drawer"
  
import { useCartStore } from "@/lib/client-store"
import { Button } from "../ui/button"
import { Book, BookMarked } from "lucide-react"
import Payment from "./payment"
export default function CartDrawer(){

    const {cart, checkoutProgress, setCheckoutProgress} = useCartStore()


    return (
        <Drawer>
            <DrawerTrigger asChild className="relative px-2" onClick={(e) => e.stopPropagation()}>
                <Book className="cursor-pointer" size={40} />
            </DrawerTrigger>


            {checkoutProgress === "payment-page" ? (
                <DrawerContent className="focus:outline-none flex justify-center items-center pb-20">
                    <DrawerHeader className="mt-10 my-10">
                        <h1 className="text-3xl font-medium">Payment Section</h1>
                    </DrawerHeader>
    
                    <div className="overflow-auto p-4">
                        {checkoutProgress === 'payment-page' && <Payment />}
                    </div>
    
                </DrawerContent>
            ) : (
                <DrawerContent className="focus:outline-none flex justify-center items-center pb-20">
                    <DrawerHeader className="mt-10 my-10">
                        <h1 className="text-3xl font-medium">Hello</h1>
                    </DrawerHeader>

                    <Button className={`bg-primary w-64`} onClick={() => setCheckoutProgress("payment-page")}>
                        Checkoout
                    </Button>
                </DrawerContent>
            )}

        </Drawer>


    )
}