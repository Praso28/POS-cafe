import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProducts } from "@/lib/actions/products";
import { getTablesWithFloors } from "@/lib/actions/tables";
import { getFloors } from "@/lib/actions/floors";
import { getActiveSession } from "@/lib/actions/sessions";
import { getEnabledPaymentMethods } from "@/lib/actions/payment-methods";
import { getPosTerminals } from "@/lib/actions/terminals";
import { POSClient } from "./pos-client";

export default async function POSPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect("/login?redirectTo=/pos");
    }

    const [products, tables, floorsResult, session, paymentMethods, terminals] = await Promise.all([
        getProducts(),
        getTablesWithFloors(),
        getFloors(),
        getActiveSession(),
        getEnabledPaymentMethods(),
        getPosTerminals(),
    ]);

    const floors = floorsResult.success ? floorsResult.data || [] : [];
    const defaultTerminalId = terminals.length > 0 ? terminals[0].id : null;

    return (
        <POSClient
            products={products}
            tables={tables}
            floors={floors}
            initialSession={session}
            paymentMethods={paymentMethods}
            defaultTerminalId={defaultTerminalId}
        />
    );
}
