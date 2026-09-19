"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { signIn, signUp } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { RoleType } from "@/lib/types/database";

export function LoginForm() {
    const searchParams = useSearchParams();
    const [isSignUp, setIsSignUp] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedRole, setSelectedRole] = useState<RoleType>("admin");
    const redirectTo = searchParams.get("redirectTo") || "/pos";
    const { toast } = useToast();

    // Initialize signup mode from URL parameter
    useEffect(() => {
        if (searchParams.get("mode") === "signup") {
            setIsSignUp(true);
        }
    }, [searchParams]);

    async function handleSubmit(formData: FormData) {
        setIsLoading(true);
        formData.append("redirectTo", redirectTo);
        
        // Add role to formData for signup (will be stored in user_metadata)
        if (isSignUp) {
            formData.append("role", selectedRole);
        }

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
                    // Role is already stored in user_metadata during signup
                    toast({
                        title: "Success",
                        description: `Account created as ${selectedRole}! ${result.success}`,
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
                    
                    {isSignUp && (
                        <div className="space-y-2">
                            <Label htmlFor="role">Select Your Role</Label>
                            <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as RoleType)}>
                                <SelectTrigger className="h-12">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">🔑 Admin - Full System Access (Default)</SelectItem>
                                    <SelectItem value="manager">👔 Manager - Reports & Management</SelectItem>
                                    <SelectItem value="cashier">💰 Cashier - POS & Payments</SelectItem>
                                    <SelectItem value="kitchen">👨‍🍳 Kitchen - Order Preparation</SelectItem>
                                    <SelectItem value="viewer">👁️ Viewer - Read Only Access</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500 mt-1">⚠️ Choose carefully - determines your system access level</p>
                        </div>
                    )}
                    
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
    );
}
