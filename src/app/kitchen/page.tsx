import { getKitchenOrders } from "@/lib/actions/orders";
import { KitchenClient } from "./kitchen-client";

export default async function KitchenPage() {
    const orders = await getKitchenOrders();
    return <KitchenClient initialOrders={orders} />;
}
