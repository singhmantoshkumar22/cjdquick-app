import { redirect } from "next/navigation";

// Redirect to the legacy WMS picklist page for now
// This allows gradual migration while keeping the new URL structure
export default function PicklistPage() {
  // TODO: Implement dedicated picklist page or copy from WMS
  redirect("/wms/picklist");
}
