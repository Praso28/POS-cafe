import { getOrderToken } from "@/lib/actions/order-tokens";
import { getProducts } from "@/lib/actions/products";
import { redirect } from "next/navigation";
import { OrderClient } from "./order-client";

interface PageProps {
    params: {
        token: string;
    };
}

export default async function SelfOrderPage({ params }: PageProps) {
    const { token } = params;
    
    // Validate token
    const tokenData = await getOrderToken(token);
    
    if (!tokenData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
                    <div className="text-6xl mb-4">❌</div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid or Expired Token</h1>
                    <p className="text-gray-600">
                        This ordering link is no longer valid. Please request a new one from the staff.
                    </p>
                </div>
            </div>
        );
    }

    // Get active products
    const products = await getProducts();
    const activeProducts = products.filter(p => p.active);

    return (
        <OrderClient
            token={token}
            tokenData={tokenData}
            products={activeProducts}
        />
    );
}

