import { getPaymentMethods } from "@/lib/actions/payment-methods";
import { PaymentsClient } from "./payments-client";

export default async function PaymentsPage() {
    const methods = await getPaymentMethods();
    return <PaymentsClient initialMethods={methods} />;
}
