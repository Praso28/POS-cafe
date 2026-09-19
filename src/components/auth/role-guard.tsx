"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUserRole, hasPermission, switchMyRole } from "@/lib/actions/roles";
import { signOut } from "@/lib/actions/auth";
import type { RoleType, UserRole } from "@/lib/types/database";

interface RoleGuardProps {
    children: React.ReactNode;
    requiredRoles?: RoleType[];
    requiredPermission?: "admin" | "pos" | "kitchen" | "reports";
    fallback?: React.ReactNode;
}

export function RoleGuard({ 
    children, 
    requiredRoles, 
    requiredPermission,
    fallback 
}: RoleGuardProps) {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
    const [userRole, setUserRole] = useState<RoleType | null>(null);
    const [isSwitching, setIsSwitching] = useState(false);

    useEffect(() => {
        async function checkAccess() {
            try {
                const roleData = await getCurrentUserRole();
                const role = roleData?.role || null;
                setUserRole(role);

                // SECURITY: Deny access if no role assigned
                if (!role) {
                    console.error("❌ No role assigned to user. Access denied.");
                    setIsAuthorized(false);
                    return;
                }

                if (requiredPermission) {
                    const hasAccess = await hasPermission(requiredPermission);
                    setIsAuthorized(hasAccess);
                } else if (requiredRoles && requiredRoles.length > 0) {
                    setIsAuthorized(requiredRoles.includes(role));
                } else {
                    // No specific requirements, allow access
                    setIsAuthorized(true);
                }
            } catch (error) {
                console.error("Role check failed:", error);
                setIsAuthorized(false);
            }
        }

        checkAccess();
    }, [requiredRoles, requiredPermission]);

    async function handleSwitchToAdmin() {
        setIsSwitching(true);
        try {
            const res = await switchMyRole("admin");
            if (res.success) {
                window.location.reload();
            } else {
                alert(res.error || "Failed to update role");
                setIsSwitching(false);
            }
        } catch (err) {
            console.error("Error switching role:", err);
            setIsSwitching(false);
        }
    }

    if (isAuthorized === null) {
        // Loading state
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!isAuthorized) {
        if (fallback) {
            return <>{fallback}</>;
        }

        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="bg-white p-8 rounded-xl shadow-xl text-center max-w-md w-full mx-4">
                    <div className="text-6xl mb-4">🚫</div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h1>
                    <p className="text-gray-600 mb-2">
                        {userRole 
                            ? `Your account is currently set to: `
                            : "You don't have a role assigned."}
                        {userRole && <span className="font-semibold capitalize text-amber-600">{userRole}</span>}
                    </p>
                    {userRole && (
                        <p className="text-xs text-gray-400 mb-6">
                            Page requires: {requiredRoles?.join(" or ") || requiredPermission}
                        </p>
                    )}

                    <div className="space-y-3">
                        <button
                            onClick={handleSwitchToAdmin}
                            disabled={isSwitching}
                            className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow transition duration-150 disabled:opacity-50"
                        >
                            {isSwitching ? "Updating role..." : "🔑 Switch to Admin Role"}
                        </button>
                        
                        <div className="flex gap-2">
                            <button
                                onClick={() => router.push("/pos")}
                                className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium rounded-lg transition"
                            >
                                Go to POS
                            </button>
                            <button
                                onClick={async () => {
                                    await signOut();
                                    router.push("/login");
                                }}
                                className="flex-1 py-2 px-4 border border-gray-300 text-gray-600 hover:bg-gray-50 font-medium rounded-lg transition"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}

// Simple hook for checking permissions
export function useHasPermission(permission: "admin" | "pos" | "kitchen" | "reports") {
    const [hasAccess, setHasAccess] = useState<boolean | null>(null);

    useEffect(() => {
        hasPermission(permission).then(setHasAccess);
    }, [permission]);

    return hasAccess;
}

// Simple hook for getting current user role
export function useUserRole() {
    const [role, setRole] = useState<RoleType | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getCurrentUserRole()
            .then(roleData => setRole(roleData?.role || null))
            .finally(() => setLoading(false));
    }, []);

    return { role, loading };
}
