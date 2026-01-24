import { getAllPaymentsGrouped } from "@/lib/actions/admin-orders";
import { PaymentsListClient } from "./payments-list-client";

export default async function PaymentsListPage() {
    const paymentsGrouped = await getAllPaymentsGrouped();

    return <PaymentsListClient paymentsGrouped={paymentsGrouped} />;
}
