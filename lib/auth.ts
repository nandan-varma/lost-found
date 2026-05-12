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
            logger.info("auth.user.create.after: no domain in email", {
              userId: user.id,
            });
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
            logger.info("auth.user.create.after: auto-joined org", {
              userId: user.id,
              email: user.email,
              domain,
              organizationId: org.id,
              organizationName: org.name,
            });
          } else {
            logger.info("auth.user.create.after: no org found for domain", {
              userId: user.id,
              email: user.email,
              domain,
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
          logger.info("auth.session.create.before: setting active org", {
            sessionId: session.id,
            userId: session.userId,
            activeOrganizationId: activeOrganization?.id,
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
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  plugins: [
    organization({
      sendInvitationEmail: async (data) => {
        const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invitation/${data.id}`;

        logger.info("auth.org.invitation: sending email", {
          invitationId: data.id,
          email: data.email,
          organizationId: data.organization.id,
          organizationName: data.organization.name,
          inviterId: data.inviter.user.id,
          inviterName: data.inviter.user.name,
        });

        const { data: emailData, error } = await resend.emails.send({
          from: `${process.env.EMAIL_SENDER_NAME} <${process.env.EMAIL_SENDER_ADDRESS}>`,
          to: data.email,
          subject: `You've been invited to join ${data.organization.name}`,
          react: OrganizationInvitationEmail({
            email: data.email,
            invitedByUsername: data.inviter.user.name,
            invitedByEmail: data.inviter.user.email,
            teamName: data.organization.name,
            inviteLink,
          }),
        });

        if (error) {
          logger.error("auth.org.invitation: email send failed", {
            invitationId: data.id,
            email: data.email,
            error,
          });
          throw error;
        }

        logger.info("auth.org.invitation: email sent", {
          invitationId: data.id,
          emailId: emailData?.id,
          email: data.email,
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
