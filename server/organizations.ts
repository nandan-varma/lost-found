"use server";

import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { cache } from "react";
import { db } from "@/db/drizzle";
import type { Member, Organization, User } from "@/db/schema";
import { member, organization } from "@/db/schema";
import type { ActionResult } from "@/lib/action-response";
import { auth } from "@/lib/auth";
import { getSession } from "@/lib/get-session";
import { createOrganizationSchema, domainSchema } from "@/lib/validations";
import { isOrgAdmin } from "./permissions";
import { getCurrentUser } from "./users";

type OrganizationWithMembers = Organization & {
  members: Array<Member & { user: User }>;
};
type OrganizationBySlugResult = OrganizationWithMembers & { isAdmin: boolean };

export async function getOrganizations(
  userId?: string
): Promise<Organization[]> {
  let resolvedUserId = userId;

  if (!resolvedUserId) {
    const sessionData = await getCurrentUser();

    if (!sessionData) {
      return [];
    }

    resolvedUserId = sessionData.currentUser.id;
  }

  const members = await db.query.member.findMany({
    where: eq(member.userId, resolvedUserId),
  });

  const organizations = await db.query.organization.findMany({
    where: inArray(
      organization.id,
      members.map((m) => m.organizationId)
    ),
  });

  return organizations;
}

export async function getActiveOrganization(
  userId: string
): Promise<Organization | null> {
  try {
    const memberUser = await db.query.member.findFirst({
      where: eq(member.userId, userId),
    });

    if (!memberUser) {
      return null;
    }

    const activeOrganization = await db.query.organization.findFirst({
      where: eq(organization.id, memberUser.organizationId),
    });

    return activeOrganization ?? null;
  } catch {
    return null;
  }
}

export async function getAllOrganizations(): Promise<Organization[]> {
  try {
    const session = await getSession();

    if (!session) {
      return [];
    }

    const organizations = await db.query.organization.findMany();
    return organizations;
  } catch {
    return [];
  }
}

export async function joinOrganization(
  orgId: string
): Promise<ActionResult<null>> {
  try {
    const sessionData = await getCurrentUser();

    if (!sessionData) {
      return { success: false, error: "Not authenticated" };
    }

    const { currentUser } = sessionData;

    const existing = await db.query.member.findFirst({
      where: (fields, { eq, and }) =>
        and(
          eq(fields.userId, currentUser.id),
          eq(fields.organizationId, orgId)
        ),
    });

    if (existing) {
      return {
        success: false,
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

    return { success: true, data: null };
  } catch {
    return { success: false, error: "Failed to join organization" };
  }
}

export async function createOrganization(
  name: string,
  slug: string
): Promise<ActionResult<null>> {
  try {
    if (process.env.FEATURE_FLAG_CREATE_ORGANIZATION !== "true") {
      return {
        success: false,
        error: "Organization creation is disabled",
      };
    }

    const session = await getSession();

    if (!session) {
      return { success: false, error: "Not authenticated" };
    }

    const parsed = createOrganizationSchema.safeParse({ name, slug });

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const messages = Object.entries(fieldErrors)
        .map(([field, errors]) => `${field}: ${errors?.join(", ")}`)
        .join("; ");
      return {
        success: false,
        error: messages || "Invalid organization data",
      };
    }

    const domain = session.user.email.split("@")[1]?.toLowerCase();

    const org = await auth.api.createOrganization({
      body: { name: parsed.data.name, slug: parsed.data.slug },
      headers: await headers(),
    });

    await db
      .update(organization)
      .set({ domain })
      .where(eq(organization.id, org.id));

    return { success: true, data: null };
  } catch {
    return { success: false, error: "Failed to create organization" };
  }
}

export async function findOrgByDomain(
  domain: string
): Promise<Organization | null> {
  try {
    const normalizedDomain = domain.toLowerCase();
    const org = await db.query.organization.findFirst({
      where: eq(organization.domain, normalizedDomain),
    });

    return org ?? null;
  } catch {
    return null;
  }
}

export async function updateOrganizationDomain(
  orgId: string,
  domain: string
): Promise<ActionResult<null>> {
  try {
    const admin = await isOrgAdmin(orgId);

    if (!admin) {
      return {
        success: false,
        error: "Only admins can update organization settings",
      };
    }

    const parsedDomain = domainSchema.safeParse(domain.trim());

    if (!parsedDomain.success) {
      return {
        success: false,
        error: "Invalid domain format",
      };
    }

    const cleanDomain = parsedDomain.data
      ? parsedDomain.data.toLowerCase()
      : null;

    if (cleanDomain) {
      const existing = await db.query.organization.findFirst({
        where: eq(organization.domain, cleanDomain),
      });

      if (existing && existing.id !== orgId) {
        return {
          success: false,
          error: "This domain is already in use by another organization",
        };
      }
    }

    await db
      .update(organization)
      .set({ domain: cleanDomain })
      .where(eq(organization.id, orgId));

    return { success: true, data: null };
  } catch {
    return { success: false, error: "Failed to update domain" };
  }
}

export const getOrganizationBySlug = cache(
  async (
    slug: string,
    userId?: string
  ): Promise<OrganizationBySlugResult | null> => {
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

      if (!organizationBySlug) {
        return null;
      }

      let resolvedUserId = userId;

      if (!resolvedUserId) {
        const session = await getSession();

        if (!session) {
          return {
            ...(organizationBySlug as OrganizationWithMembers),
            members: [],
            isAdmin: false,
          };
        }

        resolvedUserId = session.user.id;
      }

      const isAdmin = organizationBySlug.members.some(
        (m) =>
          m.userId === resolvedUserId &&
          ["admin", "owner" as const].includes(m.role)
      );

      if (!isAdmin) {
        return {
          ...(organizationBySlug as OrganizationWithMembers),
          members: [],
          isAdmin: false,
        };
      }

      return {
        ...(organizationBySlug as OrganizationWithMembers),
        isAdmin: true,
      };
    } catch {
      return null;
    }
  }
);
