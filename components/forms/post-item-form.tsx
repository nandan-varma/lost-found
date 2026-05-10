"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Loader2, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
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
import { createItem } from "@/server/items";

const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(2000),
  status: z.enum(["lost", "found"]),
});

interface PostItemFormProps {
  organizationId: string;
  organizationSlug: string;
}

export function PostItemForm({
  organizationId,
  organizationSlug,
}: PostItemFormProps) {
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const previewUrlsRef = useRef(imagePreviews);
  previewUrlsRef.current = imagePreviews;
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(
    () => () => {
      for (const url of previewUrlsRef.current) {
        URL.revokeObjectURL(url);
      }
    },
    []
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "lost",
    },
  });

  const mutation = useMutation({
    mutationFn: (formData: FormData) => createItem(formData),
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Item posted successfully");
        queryClient.invalidateQueries({
          queryKey: queryKeys.items.all(organizationId),
        });
        router.push(
          `/dashboard/organization/${organizationSlug}/items/${result.data.id}`
        );
      } else {
        toast.error(result.error as string);
      }
    },
  });

  const handleImageSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      const validFiles = files.filter(
        (f) => f.type.startsWith("image/") && f.size <= 10 * 1024 * 1024
      );

      if (validFiles.length !== files.length) {
        toast.error("Some files were skipped (must be images under 10 MB)");
      }

      const remaining = 5 - selectedImages.length;
      const toAdd = validFiles.slice(0, remaining);

      if (toAdd.length !== validFiles.length) {
        toast.error(
          `Maximum 5 images allowed. ${validFiles.length - remaining} skipped.`
        );
      }

      setSelectedImages((prev) => [...prev, ...toAdd]);

      for (const file of toAdd) {
        const url = URL.createObjectURL(file);
        setImagePreviews((prev) => [...prev, url]);
      }
    },
    [selectedImages.length]
  );

  const removeImage = useCallback((index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  function onSubmit(values: z.infer<typeof formSchema>) {
    const formData = new FormData();
    formData.append("title", values.title);
    formData.append("description", values.description);
    formData.append("status", values.status);
    formData.append("organizationId", organizationId);

    for (const file of selectedImages) {
      formData.append("images", file);
    }

    mutation.mutate(formData);
  }

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <FormControl>
                <div className="flex gap-2">
                  <button
                    className={`flex-1 rounded-md px-4 py-2 font-medium text-sm transition-colors ${
                      field.value === "lost"
                        ? "bg-destructive text-white"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                    onClick={() => field.onChange("lost")}
                    type="button"
                  >
                    Lost
                  </button>
                  <button
                    className={`flex-1 rounded-md px-4 py-2 font-medium text-sm transition-colors ${
                      field.value === "found"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                    onClick={() => field.onChange("found")}
                    type="button"
                  >
                    Found
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="What did you lose or find?" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  className="min-h-[120px]"
                  placeholder="Describe the item in detail — color, brand, location, date..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem>
          <FormLabel>Photos (max 5)</FormLabel>
          <FormControl>
            <div className="space-y-3">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed p-6 text-muted-foreground text-sm transition-colors hover:border-primary hover:text-primary">
                <ImagePlus className="size-5" />
                <span>Upload images</span>
                <input
                  accept="image/*"
                  className="hidden"
                  disabled={selectedImages.length >= 5}
                  multiple
                  onChange={handleImageSelect}
                  type="file"
                />
              </label>

              {imagePreviews.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {imagePreviews.map((preview, index) => (
                    <div
                      className="relative h-24 w-24 overflow-hidden rounded-md bg-muted"
                      key={preview}
                    >
                      <Image
                        alt={`Preview ${index + 1}`}
                        className="object-cover"
                        fill
                        sizes="96px"
                        src={preview}
                      />
                      <button
                        className="absolute top-1 right-1 rounded-full bg-background/80 p-0.5 text-foreground transition-colors hover:bg-background"
                        onClick={() => removeImage(index)}
                        type="button"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>

        <Button disabled={mutation.isPending} type="submit">
          {mutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            "Post Item"
          )}
        </Button>
      </form>
    </Form>
  );
}
