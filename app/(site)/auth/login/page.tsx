import { LoginForm } from "@/components/auth/login-form";
import { isEmailAuthEnabled } from "@/server/e2e-auth";


export default function Login(){
    return (
        <section className="min-h-screen w-full flex items-center justify-center px-4 py-10">
            <LoginForm showEmailLogin={isEmailAuthEnabled} />
        </section>
    );
}
