"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn, signUp } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get("redirectTo") || "/pos";
    const { toast } = useToast();

    async function handleSubmit(formData: FormData) {
        setIsLoading(true);
        formData.append("redirectTo", redirectTo);

        try {
            if (isSignUp) {
                const result = await signUp(formData);
                if (result?.error) {
                    toast({
                        variant: "destructive",
                        title: "Sign up failed",
                        description: result.error,
                    });
                } else if (result?.success) {
                    toast({
                        title: "Success",
                        description: result.success,
                    });
                    setIsSignUp(false);
                }
            } else {
                const result = await signIn(formData);
                if (result?.error) {
                    toast({
                        variant: "destructive",
                        title: "Login failed",
                        description: result.error,
                    });
                }
            }
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            <Card className="w-full max-w-md mx-4 shadow-xl">
                <CardHeader className="text-center space-y-2">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4">
                        <span className="text-2xl text-white font-bold">☕</span>
                    </div>
                    <CardTitle className="text-2xl font-bold">
                        {isSignUp ? "Create Account" : "Welcome Back"}
                    </CardTitle>
                    <CardDescription>
                        {isSignUp
                            ? "Sign up to access the POS system"
                            : "Sign in to your café POS account"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="staff@cafe.com"
                                required
                                className="h-12"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                required
                                minLength={6}
                                className="h-12"
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full h-12 text-lg font-semibold"
                            disabled={isLoading}
                        >
                            {isLoading
                                ? "Please wait..."
                                : isSignUp
                                    ? "Create Account"
                                    : "Sign In"}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            type="button"
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-sm text-blue-600 hover:underline"
                        >
                            {isSignUp
                                ? "Already have an account? Sign in"
                                : "Don't have an account? Sign up"}
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
