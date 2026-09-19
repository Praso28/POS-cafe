import { Suspense } from "react";
import { LoginForm } from "./login-form";

function LoginSkeleton() {
    return (
        <div className="w-full max-w-md mx-4 h-96 bg-white rounded-xl shadow-xl animate-pulse">
            <div className="p-8 space-y-4">
                <div className="mx-auto w-16 h-16 bg-gray-200 rounded-xl" />
                <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto" />
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
                <div className="space-y-3 pt-4">
                    <div className="h-12 bg-gray-200 rounded" />
                    <div className="h-12 bg-gray-200 rounded" />
                    <div className="h-12 bg-gray-200 rounded" />
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            <Suspense fallback={<LoginSkeleton />}>
                <LoginForm />
            </Suspense>
        </div>
    );
}
