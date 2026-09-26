import { getFloors } from "@/lib/actions/floors";
import FloorsClient from "./floors-client";

export default async function FloorsPage() {
  const result = await getFloors();
  const floors = result.success ? result.data || [] : [];

  return <FloorsClient floors={floors} />;
}
