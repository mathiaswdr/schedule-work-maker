import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Socials from "./socials";
import { BackButton } from "./back-button";

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
    return(
        <Card className="w-full maxW">
            <CardHeader className="w-full flex flex-col gap-y-5 items-center">
                <CardTitle>{cardTitle}</CardTitle>
                <h1 className="text-center">Welcome on Pokedy<br/> Sign in with your account</h1>
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