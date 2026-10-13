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
      orderBy: desc(item.createdAt),
      where: and(...conditions),
      with: {
        images: true,
        user: true,
      },
    });

    logger.info("getItems: success", {
      itemCount: items.length,
      organizationId,
      status,
      userId: session.user.id,
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
        claim: true,
        images: true,
        user: true,
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
      description,
      imageCount: imageEntries.length,
      organizationId,
      status,
      title,
    });

    const parsed = createItemSchema.safeParse({
      description,
      organizationId,
      status,
      title,
    });

    if (!parsed.success) {
      const { fieldErrors } = parsed.error.flatten();
      logger.warn("createItem: validation failed", {
        fieldErrors,
        organizationId,
      });
      const messages = Object.entries(fieldErrors)
        .map(([field, errors]) => `${field}: ${errors?.join(", ")}`)
        .join("; ");
      return {
        error: messages || "Invalid item data",
        success: false,
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
        error: `Maximum ${MAX_ITEM_IMAGES} images allowed.`,
        success: false,
      };
    }

    const session = await getSession();

    if (!session) {
      logger.warn("createItem: not authenticated");
      return { error: "Not authenticated", success: false };
    }

    const member = await isOrgMember(parsed.data.organizationId);

    if (!member) {
      logger.warn("createItem: not a member", {
        organizationId: parsed.data.organizationId,
        userId: session.user.id,
      });
      return { error: "Not a member of this organization", success: false };
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
          description: parsed.data.description,
          id: newItemId,
          organizationId: parsed.data.organizationId,
          status: parsed.data.status,
          title: parsed.data.title,
          userId: session.user.id,
        })
        .returning();

      if (uploadedImages.length > 0) {
        await tx.insert(itemImage).values(
          uploadedImages.map((img) => ({
            itemId: newItem.id,
            key: img.key,
            url: img.url,
          }))
        );
      }

      return newItem;
    });

    logger.info("createItem: success", {
      imageCount: uploadedImages.length,
      itemId: created.id,
      organizationId: parsed.data.organizationId,
      userId: session.user.id,
    });

    return {
      data: created,
      success: true,
    };
  } catch (error) {
    logger.error("createItem: failed", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return {
      error: "Failed to create item. Please try again.",
      success: false,
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
      return { error: "Not authenticated", success: false };
    }

    const itemRecord = await db.query.item.findFirst({
      where: eq(item.id, itemId),
    });

    if (!itemRecord) {
      logger.info("updateItemStatus: item not found", { itemId });
      return { error: "Item not found.", success: false };
    }

    const authorized = await isItemOwnerOrAdmin(itemId, undefined, itemRecord);

    if (!authorized) {
      logger.warn("updateItemStatus: unauthorized", {
        itemId,
        userId: session.user.id,
      });
      return {
        error: "You are not authorized to update this item.",
        success: false,
      };
    }

    const validStatuses: ItemStatus[] = ["lost", "found", "claimed", "closed"];

    const transitions: Record<ItemStatus, ItemStatus[]> = {
      claimed: ["closed"],
      closed: [],
      found: ["claimed", "closed"],
      lost: ["found", "closed"],
    };

    if (!validStatuses.includes(newStatus)) {
      logger.warn("updateItemStatus: invalid status", {
        itemId,
        newStatus,
      });
      return {
        error: "Invalid item status.",
        success: false,
      };
    }

    if (!transitions[itemRecord.status]?.includes(newStatus)) {
      logger.warn("updateItemStatus: invalid transition", {
        currentStatus: itemRecord.status,
        itemId,
        newStatus,
      });
      return {
        error: `Cannot transition from "${itemRecord.status}" to "${newStatus}".`,
        success: false,
      };
    }

    await db
      .update(item)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(item.id, itemId));

    logger.info("updateItemStatus: success", {
      itemId,
      newStatus,
      userId: session.user.id,
    });

    return { data: null, success: true };
  } catch (error) {
    logger.error("updateItemStatus: failed", { error, itemId, newStatus });
    return { error: "Failed to update item.", success: false };
  }
}

export async function claimItem(
  itemId: string,
  data: { claimantName: string; claimantEmail: string; message?: string }
): Promise<ActionResult<null>> {
  try {
    const parsed = claimItemSchema.safeParse(data);

    if (!parsed.success) {
      const { fieldErrors } = parsed.error.flatten();
      logger.warn("claimItem: validation failed", {
        fieldErrors,
        itemId,
      });
      const messages = Object.entries(fieldErrors)
        .map(([field, errors]) => `${field}: ${errors?.join(", ")}`)
        .join("; ");
      return {
        error: messages || "Invalid claim data",
        success: false,
      };
    }

    const session = await getSession();

    if (!session) {
      logger.warn("claimItem: not authenticated", { itemId });
      return { error: "Not authenticated", success: false };
    }

    const itemRecord = await db.query.item.findFirst({
      where: eq(item.id, itemId),
    });

    if (!itemRecord) {
      logger.info("claimItem: item not found", { itemId });
      return { error: "Item not found.", success: false };
    }

    if (itemRecord.status !== "found") {
      logger.warn("claimItem: item not available", {
        itemId,
        status: itemRecord.status,
      });
      return {
        error: "This item is not available for claiming.",
        success: false,
      };
    }

    if (itemRecord.userId === session.user.id) {
      logger.warn("claimItem: cannot claim own item", {
        itemId,
        userId: session.user.id,
      });
      return {
        error: "You cannot claim your own item.",
        success: false,
      };
    }

    const member = await isOrgMember(itemRecord.organizationId);

    if (!member) {
      logger.warn("claimItem: not a member", {
        itemId,
        userId: session.user.id,
      });
      return {
        error: "You are not a member of this organization.",
        success: false,
      };
    }

    await db.transaction(async (tx) => {
      await tx.insert(claim).values({
        claimantEmail: parsed.data.claimantEmail,
        claimantName: parsed.data.claimantName,
        itemId,
        message: parsed.data.message ?? null,
      });

      await tx
        .update(item)
        .set({ status: "claimed", updatedAt: new Date() })
        .where(eq(item.id, itemId));
    });

    logger.info("claimItem: success", {
      claimantEmail: parsed.data.claimantEmail,
      itemId,
      userId: session.user.id,
    });

    return { data: null, success: true };
  } catch (error) {
    logger.error("claimItem: failed", { error, itemId });
    return { error: "Failed to claim item.", success: false };
  }
}

export async function deleteItem(itemId: string): Promise<ActionResult<null>> {
  try {
    const session = await getSession();

    if (!session) {
      logger.warn("deleteItem: not authenticated", { itemId });
      return { error: "Not authenticated", success: false };
    }

    const itemRecord = await db.query.item.findFirst({
      where: eq(item.id, itemId),
      with: {
        images: true,
      },
    });

    if (!itemRecord) {
      logger.info("deleteItem: item not found", { itemId });
      return { error: "Item not found.", success: false };
    }

    const authorized = await isItemOwnerOrAdmin(itemId, undefined, itemRecord);

    if (!authorized) {
      logger.warn("deleteItem: unauthorized", {
        itemId,
        userId: session.user.id,
      });
      return {
        error: "You are not authorized to delete this item.",
        success: false,
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
      imagesDeleted: itemRecord.images.length,
      itemId,
      userId: session.user.id,
    });

    return { data: null, success: true };
  } catch (error) {
    logger.error("deleteItem: failed", { error, itemId });
    return { error: "Failed to delete item.", success: false };
  }
}
