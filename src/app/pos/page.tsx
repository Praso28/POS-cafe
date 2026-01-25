import { getProducts } from "@/lib/actions/products";
import { getTables } from "@/lib/actions/tables";
import { getActiveSession, getLastSessionSales } from "@/lib/actions/sessions";
import { getEnabledPaymentMethods } from "@/lib/actions/payment-methods";
import { POSClient } from "./pos-client";

export default async function POSPage() {
    const [products, tables, session, paymentMethods, lastSessionData] = await Promise.all([
        getProducts(),
        getTables(),
        getActiveSession(),
        getEnabledPaymentMethods(),
        getLastSessionSales(),
    ]);

    return (
        <POSClient
            products={products}
            tables={tables}
            initialSession={session}
            paymentMethods={paymentMethods}
            lastSessionData={lastSessionData}
        />
    );
}
