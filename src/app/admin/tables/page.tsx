import { getTablesWithFloors } from "@/lib/actions/tables";
import { getFloors } from "@/lib/actions/floors";
import { TablesClient } from "./tables-client";

export default async function TablesPage() {
    const tables = await getTablesWithFloors();
    const floorsResult = await getFloors();
    const floors = floorsResult.success ? floorsResult.data || [] : [];
    return <TablesClient initialTables={tables} floors={floors} />;
}
