import { getAllTokens } from "@/lib/actions/order-tokens";
import TokensClient from "./tokens-client";

export default async function TokensPage() {
    const tokens = await getAllTokens();

    return <TokensClient tokens={tokens} />;
}

