"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
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
import { queryKeys } from "@/lib/query-keys";
import { createOrganizationSchema } from "@/lib/validations";
import { createOrganization } from "@/server/organizations";

const formSchema = createOrganizationSchema;

interface CreateOrganizationFormProps {
  onSuccess?: () => void;
}

export function CreateOrganizationForm({
  onSuccess,
}: CreateOrganizationFormProps) {
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof formSchema>) =>
      createOrganization(values.name, values.slug),
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Organization created successfully");
        queryClient.invalidateQueries({
          queryKey: queryKeys.organizations.all(),
        });
        onSuccess?.();
      } else {
        toast.error(result.error);
      }
    },
    onError: () => {
      toast.error("Failed to create organization");
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    mutation.mutate(values);
  }

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="My Organization" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug</FormLabel>
              <FormControl>
                <Input placeholder="my-org" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button disabled={mutation.isPending} type="submit">
          {mutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            "Create Organization"
          )}
        </Button>
      </form>
    </Form>
  );
}
