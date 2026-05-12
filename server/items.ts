"use server";

import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/drizzle";
import {
  type Claim,
  claim,
  type Item,
  type ItemImage,
  type ItemStatus,
  item,
  itemImage,
  type User,
} from "@/db/schema";
import type { ActionResult } from "@/lib/action-response";
import { MAX_ITEM_IMAGES } from "@/lib/constants";
import { getSession } from "@/lib/get-session";
import { logger } from "@/lib/logger";
import { deleteFile, uploadFile } from "@/lib/r2";
import { claimItemSchema, createItemSchema } from "@/lib/validations";
import { isItemOwnerOrAdmin, isOrgMember } from "./permissions";

type ItemListResult = Item & { images: ItemImage[]; user: Pick<User, "name"> };
type ItemDetailResult =
  | (Item & {
      images: ItemImage[];
      user: User;
      claim: Claim | null;
    })
  | null;

export async function getItems(
  organizationId: string,
  status?: ItemStatus
): Promise<ItemListResult[]> {
  try {
    const session = await getSession();

    if (!session) {
      logger.info("getItems: no session", { organizationId });
      return [];
    }

    const member = await isOrgMember(organizationId);

    if (!member) {
      logger.info("getItems: not a member", {
        organizationId,
        userId: session.user.id,
      });
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

    logger.info("getItems: success", {
      organizationId,
      userId: session.user.id,
      itemCount: items.length,
      status,
    });

    return items;
  } catch (error) {
    logger.error("getItems: failed", { error, organizationId, status });
    return [];
  }
}

export async function getItem(itemId: string): Promise<ItemDetailResult> {
  try {
    const session = await getSession();

    if (!session) {
      logger.info("getItem: no session", { itemId });
      return null;
    }

    const itemRecord = await db.query.item.findFirst({
      where: eq(item.id, itemId),
      with: {
        images: true,
        user: true,
        claim: true,
      },
    });

    if (!itemRecord) {
      logger.info("getItem: item not found", { itemId });
      return null;
    }

    const member = await isOrgMember(itemRecord.organizationId);

    if (!member) {
      logger.info("getItem: not a member", {
        itemId,
        userId: session.user.id,
      });
      return null;
    }

    logger.info("getItem: success", {
      itemId,
      userId: session.user.id,
    });

    return itemRecord;
  } catch (error) {
    logger.error("getItem: failed", { error, itemId });
    return null;
  }
}

export async function createItem(
  formData: FormData
): Promise<ActionResult<typeof item.$inferSelect, string>> {
  try {
    const title = formData.get("title");
    const description = formData.get("description");
    const status = formData.get("status");
    const organizationId = formData.get("organizationId");
    const imageEntries = formData.getAll("images");

    logger.info("createItem: start", {
      title,
      description,
      status,
      organizationId,
      imageCount: imageEntries.length,
    });

    const parsed = createItemSchema.safeParse({
      title,
      description,
      status,
      organizationId,
    });

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      logger.warn("createItem: validation failed", {
        fieldErrors,
        organizationId,
      });
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
      logger.warn("createItem: too many images", {
        imageCount: imageFiles.length,
        max: MAX_ITEM_IMAGES,
      });
      return {
        success: false,
        error: `Maximum ${MAX_ITEM_IMAGES} images allowed.`,
      };
    }

    const session = await getSession();

    if (!session) {
      logger.warn("createItem: not authenticated");
      return { success: false, error: "Not authenticated" };
    }

    const member = await isOrgMember(parsed.data.organizationId);

    if (!member) {
      logger.warn("createItem: not a member", {
        organizationId: parsed.data.organizationId,
        userId: session.user.id,
      });
      return { success: false, error: "Not a member of this organization" };
    }

    const uploadedKeys: string[] = [];

    const newItemId = randomUUID();
    const uploadedImages = await Promise.all(
      imageFiles.map((file) => uploadFile(file, `items/${newItemId}`))
    );
    uploadedKeys.push(...uploadedImages.map((image) => image.key));

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

    logger.info("createItem: success", {
      itemId: created.id,
      organizationId: parsed.data.organizationId,
      userId: session.user.id,
      imageCount: uploadedImages.length,
    });

    return {
      success: true,
      data: created,
    };
  } catch (error) {
    logger.error("createItem: failed", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
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
  try {
    const session = await getSession();

    if (!session) {
      logger.warn("updateItemStatus: not authenticated", { itemId });
      return { success: false, error: "Not authenticated" };
    }

    const itemRecord = await db.query.item.findFirst({
      where: eq(item.id, itemId),
    });

    if (!itemRecord) {
      logger.info("updateItemStatus: item not found", { itemId });
      return { success: false, error: "Item not found." };
    }

    const authorized = await isItemOwnerOrAdmin(itemId, undefined, itemRecord);

    if (!authorized) {
      logger.warn("updateItemStatus: unauthorized", {
        itemId,
        userId: session.user.id,
      });
      return {
        success: false,
        error: "You are not authorized to update this item.",
      };
    }

    const validStatuses: ItemStatus[] = ["lost", "found", "claimed", "closed"];

    const transitions: Record<ItemStatus, ItemStatus[]> = {
      lost: ["found", "closed"],
      found: ["claimed", "closed"],
      claimed: ["closed"],
      closed: [],
    };

    if (!validStatuses.includes(newStatus)) {
      logger.warn("updateItemStatus: invalid status", {
        itemId,
        newStatus,
      });
      return {
        success: false,
        error: "Invalid item status.",
      };
    }

    if (!transitions[itemRecord.status]?.includes(newStatus)) {
      logger.warn("updateItemStatus: invalid transition", {
        itemId,
        currentStatus: itemRecord.status,
        newStatus,
      });
      return {
        success: false,
        error: `Cannot transition from "${itemRecord.status}" to "${newStatus}".`,
      };
    }

    await db
      .update(item)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(item.id, itemId));

    logger.info("updateItemStatus: success", {
      itemId,
      userId: session.user.id,
      newStatus,
    });

    return { success: true, data: null };
  } catch (error) {
    logger.error("updateItemStatus: failed", { error, itemId, newStatus });
    return { success: false, error: "Failed to update item." };
  }
}

export async function claimItem(
  itemId: string,
  data: { claimantName: string; claimantEmail: string; message?: string }
): Promise<ActionResult<null>> {
  try {
    const parsed = claimItemSchema.safeParse(data);

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      logger.warn("claimItem: validation failed", {
        fieldErrors,
        itemId,
      });
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
      logger.warn("claimItem: not authenticated", { itemId });
      return { success: false, error: "Not authenticated" };
    }

    const itemRecord = await db.query.item.findFirst({
      where: eq(item.id, itemId),
    });

    if (!itemRecord) {
      logger.info("claimItem: item not found", { itemId });
      return { success: false, error: "Item not found." };
    }

    if (itemRecord.status !== "found") {
      logger.warn("claimItem: item not available", {
        itemId,
        status: itemRecord.status,
      });
      return {
        success: false,
        error: "This item is not available for claiming.",
      };
    }

    if (itemRecord.userId === session.user.id) {
      logger.warn("claimItem: cannot claim own item", {
        itemId,
        userId: session.user.id,
      });
      return {
        success: false,
        error: "You cannot claim your own item.",
      };
    }

    const member = await isOrgMember(itemRecord.organizationId);

    if (!member) {
      logger.warn("claimItem: not a member", {
        itemId,
        userId: session.user.id,
      });
      return {
        success: false,
        error: "You are not a member of this organization.",
      };
    }

    await db.transaction(async (tx) => {
      await tx.insert(claim).values({
        itemId,
        claimantName: parsed.data.claimantName,
        claimantEmail: parsed.data.claimantEmail,
        message: parsed.data.message ?? null,
      });

      await tx
        .update(item)
        .set({ status: "claimed", updatedAt: new Date() })
        .where(eq(item.id, itemId));
    });

    logger.info("claimItem: success", {
      itemId,
      userId: session.user.id,
      claimantEmail: parsed.data.claimantEmail,
    });

    return { success: true, data: null };
  } catch (error) {
    logger.error("claimItem: failed", { error, itemId });
    return { success: false, error: "Failed to claim item." };
  }
}

export async function deleteItem(itemId: string): Promise<ActionResult<null>> {
  try {
    const session = await getSession();

    if (!session) {
      logger.warn("deleteItem: not authenticated", { itemId });
      return { success: false, error: "Not authenticated" };
    }

    const itemRecord = await db.query.item.findFirst({
      where: eq(item.id, itemId),
      with: {
        images: true,
      },
    });

    if (!itemRecord) {
      logger.info("deleteItem: item not found", { itemId });
      return { success: false, error: "Item not found." };
    }

    const authorized = await isItemOwnerOrAdmin(itemId, undefined, itemRecord);

    if (!authorized) {
      logger.warn("deleteItem: unauthorized", {
        itemId,
        userId: session.user.id,
      });
      return {
        success: false,
        error: "You are not authorized to delete this item.",
      };
    }

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

    logger.info("deleteItem: success", {
      itemId,
      userId: session.user.id,
      imagesDeleted: itemRecord.images.length,
    });

    return { success: true, data: null };
  } catch (error) {
    logger.error("deleteItem: failed", { error, itemId });
    return { success: false, error: "Failed to delete item." };
  }
}
