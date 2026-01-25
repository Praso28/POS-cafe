import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
    return (
        <main className="min-h-screen flex flex-col items-center justify-center relative" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
            {/* Wave Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
                {/* Left wave cluster - Blue/Teal/Mint */}
                <svg className="absolute left-0 top-0 h-full" style={{ width: '60%' }} viewBox="0 0 600 800" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="homeWaveLeft" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.6" />
                            <stop offset="35%" stopColor="#22d3ee" stopOpacity="0.45" />
                            <stop offset="65%" stopColor="#5eead4" stopOpacity="0.35" />
                            <stop offset="100%" stopColor="#99f6e4" stopOpacity="0.25" />
                        </linearGradient>
                    </defs>
                    <path d="M0,0 C80,120 120,300 60,480 C0,660 80,780 0,900 L0,0 Z" fill="url(#homeWaveLeft)" />
                    <path d="M40,0 C140,180 180,400 100,600 C20,800 120,900 40,1000 L0,1000 L0,0 Z" fill="url(#homeWaveLeft)" opacity="0.6" />
                    <path d="M80,0 C180,200 220,450 130,650 C40,850 150,920 80,1000 L0,1000 L0,0 Z" fill="url(#homeWaveLeft)" opacity="0.35" />
                </svg>

                {/* Right wave cluster - Pink/Purple/Lavender */}
                <svg className="absolute right-0 top-0 h-full" style={{ width: '60%' }} viewBox="0 0 600 800" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="homeWaveRight" x1="100%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#f0abfc" stopOpacity="0.55" />
                            <stop offset="35%" stopColor="#e879f9" stopOpacity="0.4" />
                            <stop offset="65%" stopColor="#d8b4fe" stopOpacity="0.35" />
                            <stop offset="100%" stopColor="#c4b5fd" stopOpacity="0.25" />
                        </linearGradient>
                    </defs>
                    <path d="M600,0 C520,120 480,300 540,480 C600,660 520,780 600,900 L600,0 Z" fill="url(#homeWaveRight)" />
                    <path d="M560,0 C460,180 420,400 500,600 C580,800 480,900 560,1000 L600,1000 L600,0 Z" fill="url(#homeWaveRight)" opacity="0.6" />
                    <path d="M520,0 C420,200 380,450 470,650 C560,850 450,920 520,1000 L600,1000 L600,0 Z" fill="url(#homeWaveRight)" opacity="0.35" />
                </svg>

                {/* Bottom wave accent */}
                <svg className="absolute bottom-0 left-0 w-full" style={{ height: '45%' }} viewBox="0 0 1200 400" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="homeWaveBottom" x1="0%" y1="100%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.3" />
                            <stop offset="30%" stopColor="#a5f3fc" stopOpacity="0.2" />
                            <stop offset="70%" stopColor="#fae8ff" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#f5d0fe" stopOpacity="0.3" />
                        </linearGradient>
                    </defs>
                    <path d="M0,400 C150,320 350,360 500,300 C650,240 800,280 950,260 C1100,240 1200,320 1200,280 L1200,400 L0,400 Z" fill="url(#homeWaveBottom)" />
                    <path d="M0,400 C200,340 400,380 600,330 C800,280 1000,350 1200,310 L1200,400 L0,400 Z" fill="url(#homeWaveBottom)" opacity="0.5" />
                </svg>
            </div>

            {/* Content */}
            <div className="text-center space-y-8 relative" style={{ zIndex: 1 }}>
                <div className="space-y-4">
                    <h1 className="text-5xl font-bold text-slate-800">
                        Café POS System
                    </h1>
                    <p className="text-xl text-slate-500">
                        Modern point of sale for your café
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/login">
                        <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6">
                            Login
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-4 text-center text-slate-400 text-sm" style={{ zIndex: 1 }}>
                Built with <span className="font-medium text-slate-500">Next.js</span> & <span className="font-medium text-slate-500">Supabase</span>
                <span className="mx-2">|</span>
                <span className="text-green-500">◆</span>
            </div>
        </main>
    );
}
