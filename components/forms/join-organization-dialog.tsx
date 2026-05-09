"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { joinOrganization } from "@/server/organizations";

interface Organization {
  id: string;
  name: string;
}

interface JoinOrganizationDialogProps {
  organizations: Organization[];
}

export function JoinOrganizationDialog({
  organizations,
}: JoinOrganizationDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [isJoining, setIsJoining] = useState(false);

  async function handleJoin() {
    if (!selectedOrgId) {
      return;
    }

    setIsJoining(true);
    const result = await joinOrganization(selectedOrgId);

    if (result.success) {
      toast.success("Joined organization successfully");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }

    setIsJoining(false);
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button variant="outline">Join Organization</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join Organization</DialogTitle>
          <DialogDescription>Select an organization to join.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Select onValueChange={setSelectedOrgId} value={selectedOrgId}>
            <SelectTrigger>
              <SelectValue placeholder="Select an organization" />
            </SelectTrigger>
            <SelectContent>
              {organizations.map((org) => (
                <SelectItem key={org.id} value={org.id}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            className="w-full"
            disabled={!selectedOrgId || isJoining}
            onClick={handleJoin}
          >
            {isJoining ? "Joining..." : "Join"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
