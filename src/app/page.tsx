import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
    return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="text-center space-y-8">
                <div className="space-y-4">
                    <h1 className="text-5xl font-bold text-gray-900">
                        Café POS System
                    </h1>
                    <p className="text-xl text-gray-600">
                        Modern point of sale for your café
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/login">
                        <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6">
                            Login
                        </Button>
                    </Link>
                    <Link href="/pos">
                        <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-6">
                            POS Terminal
                        </Button>
                    </Link>
                </div>

                <div className="flex flex-wrap gap-4 justify-center pt-8">
                    <Link href="/admin" className="text-blue-600 hover:underline">
                        Admin Panel
                    </Link>
                    <span className="text-gray-400">|</span>
                    <Link href="/kitchen" className="text-blue-600 hover:underline">
                        Kitchen Display
                    </Link>
                    <span className="text-gray-400">|</span>
                    <Link href="/customer" className="text-blue-600 hover:underline">
                        Customer Display
                    </Link>
                </div>
            </div>
        </main>
    );
}
