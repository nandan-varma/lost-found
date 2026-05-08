import { Badge } from "@/components/ui/badge";
import type { ItemStatus } from "@/db/schema";

const statusConfig: Record<
  ItemStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  lost: { label: "Lost", variant: "destructive" },
  found: { label: "Found", variant: "default" },
  claimed: { label: "Claimed", variant: "outline" },
  closed: { label: "Closed", variant: "secondary" },
};

export function StatusBadge({ status }: { status: ItemStatus }) {
  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
