'use client'


import { redirect } from "next/navigation"
import { useEffect } from "react"

export default function SuccessComponent(){


    useEffect(() => {
        setTimeout(() => {
            redirect(`${process.env.NEXT_PUBLIC_URL!}/profile`)
        }, 2000)
    }, [])

    return(
        <div className="w-full min-h-screen flex justify-center items-center">
            <h1 className="text-5xl font-medium">Thank's for purchasing the Pro version of Pokedy</h1>
        </div>
    )
}