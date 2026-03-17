'use client'

// import { Link } from "lucide-react"
import { Button } from "../ui/button"
import Link from "next/link"


export const BackButton = ({href, label}: {href: string, label: string}) => {
    return(
        <Button  className="font-medium  bg-primary w-1/2 mx-auto">
            <Link href={href} >
                {label}
            </Link>
        </Button>
    )
} 
