"use server";

import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { claim, type ItemStatus, item, itemImage } from "@/db/schema";
import type { ActionResult } from "@/lib/action-response";
import { MAX_ITEM_IMAGES } from "@/lib/constants";
import { getSession } from "@/lib/get-session";
import { deleteFile, uploadFile } from "@/lib/r2";
import { claimItemSchema, createItemSchema } from "@/lib/validations";
import { isItemOwnerOrAdmin, isOrgMember } from "./permissions";

type ItemsResult = Awaited<ReturnType<typeof db.query.item.findMany>>;
type ItemResult = Awaited<ReturnType<typeof db.query.item.findFirst>>;

export async function getItems(
  organizationId: string,
  status?: ItemStatus,
  userId?: string
): Promise<ItemsResult> {
  const member = await isOrgMember(organizationId, userId);

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

export async function getItem(
  itemId: string,
  userId?: string
): Promise<ItemResult> {
  const itemRecord = await db.query.item.findFirst({
    where: eq(item.id, itemId),
    with: {
      images: true,
      user: true,
      claim: true,
    },
  });

  if (!itemRecord) {
    return null;
  }

  const member = await isOrgMember(itemRecord.organizationId, userId);

  if (!member) {
    return null;
  }

  return itemRecord;
}

export async function createItem(
  formData: FormData
): Promise<ActionResult<typeof item.$inferSelect, string>> {
  const title = formData.get("title");
  const description = formData.get("description");
  const status = formData.get("status");
  const organizationId = formData.get("organizationId");
  const imageEntries = formData.getAll("images");

  const parsed = createItemSchema.safeParse({
    title,
    description,
    status,
    organizationId,
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const messages = Object.entries(fieldErrors)
      .map(([field, errors]) => `${field}: ${errors?.join(", ")}`)
      .join("; ");
    return {
      success: false,
      error: messages || "Invalid item data",
    };
  }

  const imageFiles = imageEntries.filter(
    (entry): entry is File => entry instanceof File && entry.size > 0
  );

  if (imageFiles.length > MAX_ITEM_IMAGES) {
    return {
      success: false,
      error: `Maximum ${MAX_ITEM_IMAGES} images allowed.`,
    };
  }

  const session = await getSession();

  if (!session) {
    return { success: false, error: "Not authenticated" };
  }

  const member = await isOrgMember(parsed.data.organizationId, session.user.id);

  if (!member) {
    return { success: false, error: "Not a member of this organization" };
  }

  const uploadedKeys: string[] = [];

  try {
    const newItemId = randomUUID();
    const uploadedImages: { url: string; key: string }[] = [];

    for (const file of imageFiles) {
      const result = await uploadFile(file, `items/${newItemId}`);
      uploadedKeys.push(result.key);
      uploadedImages.push(result);
    }

    const created = await db.transaction(async (tx) => {
      const [newItem] = await tx
        .insert(item)
        .values({
          id: newItemId,
          organizationId: parsed.data.organizationId,
          userId: session.user.id,
          title: parsed.data.title,
          description: parsed.data.description,
          status: parsed.data.status,
        })
        .returning();

      if (uploadedImages.length > 0) {
        await tx.insert(itemImage).values(
          uploadedImages.map((img) => ({
            itemId: newItem.id,
            url: img.url,
            key: img.key,
          }))
        );
      }

      return newItem;
    });

    return {
      success: true,
      data: created,
    };
  } catch {
    for (const key of uploadedKeys) {
      try {
        await deleteFile(key);
      } catch {
        // Ignore cleanup errors for failed uploads.
      }
    }

    return {
      success: false,
      error: "Failed to create item. Please try again.",
    };
  }
}

export async function updateItemStatus(
  itemId: string,
  newStatus: ItemStatus
): Promise<ActionResult<null>> {
  const session = await getSession();

  if (!session) {
    return { success: false, error: "Not authenticated" };
  }

  const itemRecord = await db.query.item.findFirst({
    where: eq(item.id, itemId),
  });

  if (!itemRecord) {
    return { success: false, error: "Item not found." };
  }

  const authorized = await isItemOwnerOrAdmin(
    itemId,
    session.user.id,
    itemRecord
  );

  if (!authorized) {
    return {
      success: false,
      error: "You are not authorized to update this item.",
    };
  }

  try {
    await db
      .update(item)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(item.id, itemId));

    return { success: true, data: null };
  } catch {
    return { success: false, error: "Failed to update item." };
  }
}

export async function claimItem(
  itemId: string,
  data: { claimantName: string; claimantEmail: string; message?: string }
): Promise<ActionResult<null>> {
  const parsed = claimItemSchema.safeParse(data);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const messages = Object.entries(fieldErrors)
      .map(([field, errors]) => `${field}: ${errors?.join(", ")}`)
      .join("; ");
    return {
      success: false,
      error: messages || "Invalid claim data",
    };
  }

  const session = await getSession();

  if (!session) {
    return { success: false, error: "Not authenticated" };
  }

  const itemRecord = await db.query.item.findFirst({
    where: eq(item.id, itemId),
  });

  if (!itemRecord) {
    return { success: false, error: "Item not found." };
  }

  if (itemRecord.status !== "found") {
    return {
      success: false,
      error: "This item is not available for claiming.",
    };
  }

  if (itemRecord.userId === session.user.id) {
    return {
      success: false,
      error: "You cannot claim your own item.",
    };
  }

  const member = await isOrgMember(itemRecord.organizationId, session.user.id);

  if (!member) {
    return {
      success: false,
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

    return { success: true, data: null };
  } catch {
    return { success: false, error: "Failed to claim item." };
  }
}

export async function deleteItem(itemId: string): Promise<ActionResult<null>> {
  const session = await getSession();

  if (!session) {
    return { success: false, error: "Not authenticated" };
  }

  const itemRecord = await db.query.item.findFirst({
    where: eq(item.id, itemId),
    with: {
      images: true,
    },
  });

  if (!itemRecord) {
    return { success: false, error: "Item not found." };
  }

  const authorized = await isItemOwnerOrAdmin(
    itemId,
    session.user.id,
    itemRecord
  );

  if (!authorized) {
    return {
      success: false,
      error: "You are not authorized to delete this item.",
    };
  }

  try {
    await db.delete(item).where(eq(item.id, itemId));

    await Promise.all(
      itemRecord.images.map(async (img) => {
        try {
          await deleteFile(img.key);
        } catch {
          // Ignore cleanup errors after deletion.
        }
      })
    );

    return { success: true, data: null };
  } catch {
    return { success: false, error: "Failed to delete item." };
  }
}
