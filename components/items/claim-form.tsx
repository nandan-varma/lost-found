"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
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
import { queryKeys } from "@/lib/query-keys";
import { claimItemSchema } from "@/lib/validations";
import { claimItem } from "@/server/items";

interface ClaimFormProps {
  itemId: string;
  organizationSlug: string;
}

export function ClaimForm({ itemId, organizationSlug }: ClaimFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof claimItemSchema>>({
    resolver: zodResolver(claimItemSchema),
    defaultValues: {
      claimantName: "",
      claimantEmail: "",
      message: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof claimItemSchema>) =>
      claimItem(itemId, values),
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Item claimed successfully");
        queryClient.invalidateQueries({
          queryKey: queryKeys.items.detail(itemId),
        });
        router.push(`/app/${organizationSlug}/items/${itemId}`);
      } else {
        toast.error(result.error);
      }
    },
  });

  function onSubmit(values: z.infer<typeof claimItemSchema>) {
    mutation.mutate(values);
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
        <Button disabled={mutation.isPending} type="submit">
          {mutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            "Submit Claim"
          )}
        </Button>
      </form>
    </Form>
  );
}
