"use server";

import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db/drizzle";
import { member, organization } from "@/db/schema";
import { auth } from "@/lib/auth";
import { getCurrentUser } from "./users";

export async function getOrganizations() {
  const { currentUser } = await getCurrentUser();

  const members = await db.query.member.findMany({
    where: eq(member.userId, currentUser.id),
  });

  const organizations = await db.query.organization.findMany({
    where: inArray(
      organization.id,
      members.map((m) => m.organizationId)
    ),
  });

  return organizations;
}

export async function getActiveOrganization(userId: string) {
  const memberUser = await db.query.member.findFirst({
    where: eq(member.userId, userId),
  });

  if (!memberUser) {
    return null;
  }

  const activeOrganization = await db.query.organization.findFirst({
    where: eq(organization.id, memberUser.organizationId),
  });

  return activeOrganization;
}

export async function getAllOrganizations() {
  try {
    const organizations = await db.query.organization.findMany();
    return organizations;
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function joinOrganization(orgId: string) {
  try {
    const { currentUser } = await getCurrentUser();

    const existing = await db.query.member.findFirst({
      where: (fields, { eq, and }) =>
        and(
          eq(fields.userId, currentUser.id),
          eq(fields.organizationId, orgId)
        ),
    });

    if (existing) {
      return {
        success: false as const,
        error: "You are already a member of this organization",
      };
    }

    await db.insert(member).values({
      id: randomUUID(),
      organizationId: orgId,
      userId: currentUser.id,
      role: "member",
      createdAt: new Date(),
    });

    return { success: true as const, error: null };
  } catch (error) {
    console.error(error);
    return { success: false as const, error: "Failed to join organization" };
  }
}

export async function findOrgByDomain(domain: string) {
  try {
    const org = await db.query.organization.findFirst({
      where: eq(organization.domain, domain),
    });

    return org;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function updateOrganizationDomain(orgId: string, domain: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return { success: false as const, error: "Not authenticated" };
    }

    const { success } = await auth.api.hasPermission({
      headers: await headers(),
      body: {
        permissions: {
          organization: ["update", "delete"],
        },
      },
    });

    if (!success) {
      return {
        success: false as const,
        error: "Only admins can update organization settings",
      };
    }

    const existing = await db.query.organization.findFirst({
      where: eq(organization.domain, domain),
    });

    if (existing && existing.id !== orgId) {
      return {
        success: false as const,
        error: "This domain is already in use by another organization",
      };
    }

    await db
      .update(organization)
      .set({ domain: domain || null })
      .where(eq(organization.id, orgId));

    return { success: true as const, error: null };
  } catch (error) {
    console.error(error);
    return { success: false as const, error: "Failed to update domain" };
  }
}

export async function getOrganizationBySlug(slug: string) {
  try {
    const organizationBySlug = await db.query.organization.findFirst({
      where: eq(organization.slug, slug),
      with: {
        members: {
          with: {
            user: true,
          },
        },
      },
    });

    return organizationBySlug;
  } catch (error) {
    console.error(error);
    return null;
  }
}
