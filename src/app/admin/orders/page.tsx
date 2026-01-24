import { getAllOrders } from "@/lib/actions/admin-orders";
import { OrdersClient } from "./orders-client";

export default async function OrdersPage() {
    const orders = await getAllOrders();

    return <OrdersClient orders={orders} />;
}
