import { getAllCategories } from "@/lib/actions/categories";
import { CategoryClient } from "./category-client";

export default async function CategoryPage() {
    const categories = await getAllCategories();

    return <CategoryClient initialCategories={categories} />;
}
