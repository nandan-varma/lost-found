import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

interface OrganizationInvitationEmailProps {
  email: string;
  invitedByEmail: string;
  invitedByUsername: string;
  inviteLink: string;
  teamName: string;
}

const OrganizationInvitationEmail = (
  props: OrganizationInvitationEmailProps
) => {
  return (
    <Html dir="ltr" lang="en">
      <Tailwind>
        <Head />
        <Preview>
          You&apos;ve been invited to join {props.teamName} on Lost and Found
        </Preview>
        <Body className="bg-zinc-50 py-[40px] font-sans">
          <Container className="mx-auto max-w-[600px] rounded-lg bg-white p-8 shadow-sm">
            {/* Logo/Brand */}
            <Section className="mb-6">
              <Text className="font-bold text-xl text-zinc-900 tracking-tight">
                Lost and Found
              </Text>
            </Section>

            {/* Main Heading */}
            <Section className="mb-6">
              <Heading className="m-0 mb-2 font-bold text-2xl text-zinc-900">
                You&apos;re invited! 🎉
              </Heading>
              <Text className="m-0 text-base text-zinc-600">
                Join {props.teamName} on Lost and Found
              </Text>
            </Section>

            {/* Main Content */}
            <Section className="mb-6">
              <Text className="m-0 mb-3 text-base text-zinc-700">Hi,</Text>
              <Text className="m-0 mb-3 text-base text-zinc-700">
                <strong>{props.invitedByUsername}</strong> (
                {props.invitedByEmail}) has invited you to join the &quot;
                {props.teamName}&quot; organization on our Lost and Found
                platform.
              </Text>
              <Text className="m-0 text-base text-zinc-700">
                Accept this invitation to start managing lost and found items
                with your organization.
              </Text>
            </Section>

            {/* CTA Button */}
            <Section className="mb-6 text-center">
              <Button
                className="box-border inline-block rounded-md bg-zinc-900 px-6 py-3 font-medium text-base text-white no-underline"
                href={props.inviteLink}
              >
                Accept Invitation
              </Button>
            </Section>

            {/* Alternative Link */}
            <Section className="mb-6 rounded-md bg-zinc-50 p-4">
              <Text className="m-0 mb-2 text-sm text-zinc-600">
                If the button doesn&apos;t work, copy and paste this link:
              </Text>
              <Text className="m-0 break-all text-sm">
                <Link
                  className="text-zinc-900 underline"
                  href={props.inviteLink}
                >
                  {props.inviteLink}
                </Link>
              </Text>
            </Section>

            {/* Footer */}
            <Section className="border-zinc-200 border-t pt-4">
              <Text className="m-0 text-xs text-zinc-500">
                This invitation was sent to {props.email}. If you weren&apos;t
                expecting this, you can safely ignore this email.
              </Text>
              <Text className="m-0 mt-2 text-xs text-zinc-400">
                © {new Date().getFullYear()} Lost and Found. All rights
                reserved.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default OrganizationInvitationEmail;
