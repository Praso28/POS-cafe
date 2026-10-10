import { getOrdersForReports } from "@/lib/actions/orders";
import { OrdersClient } from "./orders-client";

export default async function OrdersPage() {
    const orders = await getOrdersForReports();
    return <OrdersClient initialOrders={orders} />;
}

