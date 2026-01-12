"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Socials from "./socials";
import { BackButton } from "./back-button";
import { useTranslations } from "next-intl";

type CardWrapperProps = {
    children: React.ReactNode;
    cardTitle: string;
    backButtonHref: string;
    backButtonLabel: string;
    showSocial: boolean;
}

export const AuthCard = ({
    children,
    cardTitle,
    backButtonHref,
    backButtonLabel,
    showSocial,
}: CardWrapperProps) => {
    const t = useTranslations("auth");

    return(
        <Card className="w-full max-w-md">
            <CardHeader className="w-full flex flex-col gap-y-5 items-center">
                <CardTitle>{cardTitle}</CardTitle>
                <p className="text-center text-sm text-neutral-600">
                    {t("subtitle")}
                </p>
            </CardHeader>
            <CardContent>{children}</CardContent>

            {showSocial && (
                <CardFooter>
                    <Socials />
                </CardFooter>
            )}

            <CardFooter>
                <BackButton href={backButtonHref} label={backButtonLabel}/>
            </CardFooter>
        </Card>
    )
}
