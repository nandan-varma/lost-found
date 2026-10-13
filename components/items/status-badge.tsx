import { Badge } from "@/components/ui/badge";
import type { ItemStatus } from "@/db/schema";

const statusConfig: Record<
  ItemStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  claimed: { label: "Claimed", variant: "outline" },
  closed: { label: "Closed", variant: "secondary" },
  found: { label: "Found", variant: "default" },
  lost: { label: "Lost", variant: "destructive" },
};

export function StatusBadge({ status }: { status: ItemStatus }) {
  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
