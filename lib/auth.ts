import { randomUUID } from "node:crypto";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth } from "better-auth/minimal";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";
import { Resend } from "resend";
import OrganizationInvitationEmail from "@/components/emails/organization-invitation";
import { db } from "@/db/drizzle";
import { schema } from "@/db/schema";
import { findOrgByDomain, getActiveOrganization } from "@/server/organizations";
import { admin, member, owner } from "./auth/permissions";
import { getEnv } from "./env";

const resend = new Resend(getEnv("RESEND_API_KEY"));

export const auth = betterAuth({
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  socialProviders: {
    microsoft: {
      clientId: getEnv("MICROSOFT_CLIENT_ID"),
      clientSecret: getEnv("MICROSOFT_CLIENT_SECRET"),
      tenantId: getEnv("MICROSOFT_TENANT_ID"),
      prompt: "select_account",
      scopes: ["openid", "profile", "email"],
      mapProfileToUser: (profile) => ({
        email: profile.email || `${profile.oid}@microsoft-entra`,
        name: profile.name || "Microsoft User",
        emailVerified: false,
      }),
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          const domain = user.email.split("@")[1]?.toLowerCase();
          if (!domain) {
            return;
          }

          const org = await findOrgByDomain(domain);
          if (org) {
            await db.insert(schema.member).values({
              id: randomUUID(),
              organizationId: org.id,
              userId: user.id,
              role: "member",
              createdAt: new Date(),
            });
          }
        },
      },
    },
    session: {
      create: {
        before: async (session) => {
          const activeOrganization = await getActiveOrganization(
            session.userId
          );
          return {
            data: {
              ...session,
              activeOrganizationId: activeOrganization?.id,
            },
          };
        },
      },
    },
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  plugins: [
    organization({
      sendInvitationEmail: async (data) => {
        const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invitation/${data.id}`;

        await resend.emails.send({
          from: `${process.env.EMAIL_SENDER_NAME} <${process.env.EMAIL_SENDER_ADDRESS}>`,
          to: data.email,
          subject: "You've been invited to join our organization",
          react: OrganizationInvitationEmail({
            email: data.email,
            invitedByUsername: data.inviter.user.name,
            invitedByEmail: data.inviter.user.email,
            teamName: data.organization.name,
            inviteLink,
          }),
        });
      },
      roles: {
        owner,
        admin,
        member,
      },
    }),
    nextCookies(),
  ],
});
