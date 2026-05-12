"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CreateOrganizationForm } from "./create-organization-form";

interface CreateOrganizationDialogProps {
  defaultOpen?: boolean;
  variant?: "default" | "outline";
}

export function CreateOrganizationDialog({
  variant = "default",
}: CreateOrganizationDialogProps) {
  const { refresh } = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button variant={variant}>
          <Plus className="mr-1 size-4" />
          Create Organization
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Organization</DialogTitle>
          <DialogDescription>
            Create a new organization to get started.
          </DialogDescription>
        </DialogHeader>
        <CreateOrganizationForm
          onSuccess={() => {
            setOpen(false);
            refresh();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
