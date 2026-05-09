import { randomUUID } from "node:crypto";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";
import { Resend } from "resend";
import OrganizationInvitationEmail from "@/components/emails/organization-invitation";
import { db } from "@/db/drizzle";
import { schema } from "@/db/schema";
import { findOrgByDomain, getActiveOrganization } from "@/server/organizations";
import { admin, member, owner } from "./auth/permissions";

const resend = new Resend(process.env.RESEND_API_KEY as string);

export const auth = betterAuth({
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  socialProviders: {
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID as string,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET as string,
      tenantId: process.env.MICROSOFT_TENANT_ID as string,
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
          const domain = user.email.split("@")[1];
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
        const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/api/accept-invitation/${data.id}`;

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
