"use client";

import { ArrowLeft, Plus } from "lucide-react";
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
import { CreateOrganizationForm } from "./create-organization-form";

const CREATE_ORG_VALUE = "__create__";

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
  const [selectedOrgId, setSelectedOrgId] = useState<string>();
  const [showCreate, setShowCreate] = useState(false);
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

  function handleValueChange(value: string) {
    if (value === CREATE_ORG_VALUE) {
      setShowCreate(true);
      return;
    }
    setSelectedOrgId(value);
  }

  function handleBackToJoin() {
    setShowCreate(false);
    setSelectedOrgId(undefined);
  }

  function handleCreateSuccess() {
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          setShowCreate(false);
          setSelectedOrgId(undefined);
        }
      }}
      open={open}
    >
      <DialogTrigger asChild>
        <Button variant="outline">Join Organization</Button>
      </DialogTrigger>
      <DialogContent>
        {showCreate ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Button
                  className="-ml-2 size-8"
                  onClick={handleBackToJoin}
                  size="icon"
                  variant="ghost"
                >
                  <ArrowLeft className="size-4" />
                </Button>
                <div>
                  <DialogTitle>Create Organization</DialogTitle>
                  <DialogDescription>
                    Create a new organization to get started.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <CreateOrganizationForm onSuccess={handleCreateSuccess} />
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Join Organization</DialogTitle>
              <DialogDescription>
                Select an organization to join.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <Select onValueChange={handleValueChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an organization" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                  <SelectItem value={CREATE_ORG_VALUE}>
                    <div className="flex items-center gap-2">
                      <Plus className="size-4" />
                      Create Organization
                    </div>
                  </SelectItem>
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
