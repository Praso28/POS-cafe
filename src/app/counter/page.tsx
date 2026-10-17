import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { CounterDisplayClient } from "./counter-display-client";

export default async function CounterDisplayPage() {
    const supabase = await createClient();
    const { data: terminal, error } = await supabase
        .from("pos_terminals")
        .select("id")
        .order("created_at", { ascending: true })
        .limit(1)
        .single();

    const terminalId = !error && terminal ? (terminal as any).id : null;

    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        }>
            <CounterDisplayClient defaultTerminalId={terminalId} />
        </Suspense>
    );
}
