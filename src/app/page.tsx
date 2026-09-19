import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
    // Check if user is already authenticated
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    // If authenticated, redirect to POS
    if (user) {
        redirect("/pos");
    }

    return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="text-center space-y-8">
                <div className="space-y-4">
                    <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                        <span className="text-5xl">☕</span>
                    </div>
                    <h1 className="text-5xl font-bold text-gray-900">
                        Café POS System
                    </h1>
                    <p className="text-xl text-gray-600 max-w-md mx-auto">
                        Modern point of sale for your café. Streamline orders, manage inventory, and grow your business.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/login">
                        <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6">
                            Login
                        </Button>
                    </Link>
                    <Link href="/login?mode=signup">
                        <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-6">
                            Sign Up
                        </Button>
                    </Link>
                </div>

                <div className="pt-8 text-sm text-gray-500">
                    <p>Secure access for authorized personnel only</p>
                </div>
            </div>
        </main>
    );
}
