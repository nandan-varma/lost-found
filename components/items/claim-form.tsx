"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { claimItemSchema } from "@/lib/validations";
import { claimItem } from "@/server/items";

interface ClaimFormProps {
  itemId: string;
  organizationSlug: string;
}

export function ClaimForm({ itemId, organizationSlug }: ClaimFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof claimItemSchema>>({
    resolver: zodResolver(claimItemSchema),
    defaultValues: {
      claimantName: "",
      claimantEmail: "",
      message: "",
    },
  });

  async function onSubmit(values: z.infer<typeof claimItemSchema>) {
    setIsLoading(true);

    const result = await claimItem(itemId, values);

    if (result.success) {
      toast.success("Item claimed successfully");
      router.push(
        `/dashboard/organization/${organizationSlug}/items/${itemId}`
      );
      router.refresh();
    } else {
      toast.error(result.error as string);
    }

    setIsLoading(false);
  }

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="claimantName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="claimantEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Email</FormLabel>
              <FormControl>
                <Input placeholder="john@example.com" type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message (optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe how this item belongs to you..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button disabled={isLoading} type="submit">
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            "Submit Claim"
          )}
        </Button>
      </form>
    </Form>
  );
}
