import "server-only";

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
import { logger } from "./logger";

const resend = new Resend(getEnv("RESEND_API_KEY"));

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const activeOrganization = await getActiveOrganization(
            session.userId
          );
          logger.info("auth.session.create.before: setting active org", {
            activeOrganizationId: activeOrganization?.id,
            sessionId: session.id,
            userId: session.userId,
          });
          return {
            data: {
              ...session,
              activeOrganizationId: activeOrganization?.id,
            },
          };
        },
      },
    },
    user: {
      create: {
        after: async (user) => {
          const domain = user.email.split("@")[1]?.toLowerCase();
          if (!domain) {
            logger.info("auth.user.create.after: no domain in email", {
              userId: user.id,
            });
            return;
          }

          const org = await findOrgByDomain(domain);
          if (org) {
            await db.insert(schema.member).values({
              createdAt: new Date(),
              id: randomUUID(),
              organizationId: org.id,
              role: "member",
              userId: user.id,
            });
            logger.info("auth.user.create.after: auto-joined org", {
              domain,
              email: user.email,
              organizationId: org.id,
              organizationName: org.name,
              userId: user.id,
            });
          } else {
            logger.info("auth.user.create.after: no org found for domain", {
              domain,
              email: user.email,
              userId: user.id,
            });
          }
        },
      },
    },
  },
  plugins: [
    organization({
      allowUserToCreateOrganization: () =>
        process.env.FEATURE_FLAG_CREATE_ORGANIZATION === "true",
      roles: {
        admin,
        member,
        owner,
      },
      sendInvitationEmail: async (data) => {
        const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invitation/${data.id}`;

        logger.info("auth.org.invitation: sending email", {
          email: data.email,
          invitationId: data.id,
          inviterId: data.inviter.user.id,
          inviterName: data.inviter.user.name,
          organizationId: data.organization.id,
          organizationName: data.organization.name,
        });

        const { data: emailData, error } = await resend.emails.send({
          from: `${process.env.EMAIL_SENDER_NAME} <${process.env.EMAIL_SENDER_ADDRESS}>`,
          react: OrganizationInvitationEmail({
            email: data.email,
            invitedByEmail: data.inviter.user.email,
            invitedByUsername: data.inviter.user.name,
            inviteLink,
            teamName: data.organization.name,
          }),
          subject: `You've been invited to join ${data.organization.name}`,
          to: data.email,
        });

        if (error) {
          logger.error("auth.org.invitation: email send failed", {
            email: data.email,
            error,
            invitationId: data.id,
          });
          throw error;
        }

        logger.info("auth.org.invitation: email sent", {
          email: data.email,
          emailId: emailData?.id,
          invitationId: data.id,
        });
      },
    }),
    nextCookies(),
  ],
  rateLimit: {
    enabled: true,
    max: 100,
    window: 60,
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
      mapProfileToUser: (profile) => ({
        email: profile.email || `${profile.oid}@microsoft-entra`,
        emailVerified: false,
        name: profile.name || "Microsoft User",
      }),
      prompt: "select_account",
      scopes: ["openid", "profile", "email"],
      tenantId: getEnv("MICROSOFT_TENANT_ID"),
    },
  },
});
