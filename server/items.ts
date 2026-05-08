"use server";

import { and, desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db/drizzle";
import { claim, type ItemStatus, item, itemImage } from "@/db/schema";
import { auth } from "@/lib/auth";
import { deleteFile, uploadFile } from "@/lib/r2";
import { claimItemSchema, createItemSchema } from "@/lib/validations";
import { isOrgMember } from "./permissions";

export async function getItems(organizationId: string, status?: ItemStatus) {
  const member = await isOrgMember(organizationId);

  if (!member) {
    return [];
  }

  const conditions = [eq(item.organizationId, organizationId)];

  if (status) {
    conditions.push(eq(item.status, status));
  }

  const items = await db.query.item.findMany({
    where: and(...conditions),
    with: {
      images: true,
      user: true,
    },
    orderBy: desc(item.createdAt),
  });

  return items;
}

export async function getItem(itemId: string) {
  const itemRecord = await db.query.item.findFirst({
    where: eq(item.id, itemId),
    with: {
      images: true,
      user: true,
      claim: true,
      organization: true,
    },
  });

  if (!itemRecord) {
    return null;
  }

  const member = await isOrgMember(itemRecord.organizationId);

  if (!member) {
    return null;
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const isViewerPosterOrAdmin =
    session?.user.id === itemRecord.userId ||
    (itemRecord.claim && (await isOrgMember(itemRecord.organizationId)));

  if (!isViewerPosterOrAdmin && itemRecord.claim) {
    const { claim: _, ...rest } = itemRecord;
    return rest;
  }

  return itemRecord;
}

export async function createItem(formData: FormData) {
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const status = formData.get("status") as ItemStatus;
  const organizationId = formData.get("organizationId") as string;
  const imageFiles = formData.getAll("images") as File[];

  const parsed = createItemSchema.safeParse({ title, description, status });

  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.flatten().fieldErrors,
    };
  }

  if (imageFiles.length > 5) {
    return {
      success: false as const,
      error: "Maximum 5 images allowed.",
    };
  }

  const member = await isOrgMember(organizationId);

  if (!member) {
    redirect("/login");
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  try {
    const [newItem] = await db
      .insert(item)
      .values({
        organizationId,
        userId: session.user.id,
        title: parsed.data.title,
        description: parsed.data.description,
        status: parsed.data.status,
      })
      .returning();

    const uploadedImages: { url: string; key: string }[] = [];

    for (const file of imageFiles) {
      if (file instanceof File && file.size > 0) {
        const result = await uploadFile(file, `items/${newItem.id}`);
        uploadedImages.push(result);
      }
    }

    if (uploadedImages.length > 0) {
      await db.insert(itemImage).values(
        uploadedImages.map((img) => ({
          itemId: newItem.id,
          url: img.url,
          key: img.key,
        }))
      );
    }

    return {
      success: true as const,
      data: newItem,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: "Failed to create item. Please try again.",
    };
  }
}

export async function updateItemStatus(itemId: string, newStatus: ItemStatus) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const itemRecord = await db.query.item.findFirst({
    where: eq(item.id, itemId),
  });

  if (!itemRecord) {
    return {
      success: false as const,
      error: "Item not found.",
    };
  }

  if (itemRecord.userId !== session.user.id) {
    const admin = await import("./permissions").then((m) =>
      m.isItemOwnerOrAdmin(itemId)
    );

    if (!admin) {
      return {
        success: false as const,
        error: "You are not authorized to update this item.",
      };
    }
  }

  try {
    await db
      .update(item)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(item.id, itemId));

    return {
      success: true as const,
      error: null,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: "Failed to update item.",
    };
  }
}

export async function claimItem(
  itemId: string,
  data: { claimantName: string; claimantEmail: string; message?: string }
) {
  const parsed = claimItemSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.flatten().fieldErrors,
    };
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const itemRecord = await db.query.item.findFirst({
    where: eq(item.id, itemId),
  });

  if (!itemRecord) {
    return {
      success: false as const,
      error: "Item not found.",
    };
  }

  if (itemRecord.status !== "found") {
    return {
      success: false as const,
      error: "This item is not available for claiming.",
    };
  }

  if (itemRecord.userId === session.user.id) {
    return {
      success: false as const,
      error: "You cannot claim your own item.",
    };
  }

  const member = await isOrgMember(itemRecord.organizationId);

  if (!member) {
    return {
      success: false as const,
      error: "You are not a member of this organization.",
    };
  }

  try {
    await db.insert(claim).values({
      itemId,
      claimantName: parsed.data.claimantName,
      claimantEmail: parsed.data.claimantEmail,
      message: parsed.data.message ?? null,
    });

    await db
      .update(item)
      .set({ status: "claimed", updatedAt: new Date() })
      .where(eq(item.id, itemId));

    return {
      success: true as const,
      error: null,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: "Failed to claim item.",
    };
  }
}

export async function deleteItem(itemId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const itemRecord = await db.query.item.findFirst({
    where: eq(item.id, itemId),
    with: {
      images: true,
    },
  });

  if (!itemRecord) {
    return {
      success: false as const,
      error: "Item not found.",
    };
  }

  if (itemRecord.userId !== session.user.id) {
    const admin = await import("./permissions").then((m) =>
      m.isItemOwnerOrAdmin(itemId)
    );

    if (!admin) {
      return {
        success: false as const,
        error: "You are not authorized to delete this item.",
      };
    }
  }

  try {
    await Promise.all(itemRecord.images.map((img) => deleteFile(img.key)));

    await db.delete(item).where(eq(item.id, itemId));

    return {
      success: true as const,
      error: null,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: "Failed to delete item.",
    };
  }
}
