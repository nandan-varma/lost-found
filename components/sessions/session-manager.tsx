"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

const RE_BRAVE = /\bBrave\b/i;
const RE_EDGE = /\bEdg(?:e|A|iOS)?\b/i;
const RE_OPERA = /\bOPR\b|\bOpera\b/i;
const RE_FIREFOX = /\bFirefox\b|\bFxiOS\b/i;
const RE_CHROME = /\bChrome\b|\bCriOS\b/i;
const RE_SAFARI = /\bSafari\b/i;
const RE_ANDROID = /\bAndroid\b/i;
const RE_APPLE_DEVICE = /\b(iPhone|iPad|iPod)\b/i;
const RE_MAC = /\bMacintosh\b|\bMac OS X\b/i;
const RE_WINDOWS = /\bWindows\b/i;
const RE_LINUX = /\bLinux\b/i;
const DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

interface SessionEntry {
  createdAt: Date | string;
  expiresAt: Date | string;
  id: string;
  token: string;
  userAgent?: string | null;
}

export function SessionManager() {
  const { replace, refresh } = useRouter();
  const [sessions, setSessions] = useState<SessionEntry[]>([]);
  const [currentToken, setCurrentToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);

  const loadSessions = useCallback(async () => {
    setLoading(true);

    try {
      const [currentSession, activeSessions] = await Promise.all([
        authClient.getSession(),
        authClient.listSessions(),
      ]);

      setCurrentToken(currentSession.data?.session.token ?? null);
      setSessions(
        Array.isArray(activeSessions.data) ? activeSessions.data : []
      );
    } catch {
      toast.error("Unable to load sessions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  async function revokeSession(token: string) {
    setMutating(true);

    try {
      await authClient.revokeSession({ token });
      toast.success("Session revoked");
      await loadSessions();
    } catch {
      toast.error("Unable to revoke session");
    } finally {
      setMutating(false);
    }
  }

  async function revokeOtherSessions() {
    setMutating(true);

    try {
      await authClient.revokeOtherSessions();
      const session = await authClient.getSession();
      if (!session.data?.session) {
        await authClient.signOut();
        return;
      }
      toast.success("Other sessions revoked");
      await loadSessions();
    } catch {
      toast.error("Unable to revoke other sessions");
    } finally {
      setMutating(false);
    }
  }

  async function revokeAllSessions() {
    setMutating(true);

    try {
      await authClient.revokeSessions();
      setSessions([]);
      setCurrentToken(null);
      toast.success("All sessions revoked. Signing you out...");

      await authClient.signOut().catch(() => undefined);
      replace("/login");
      refresh();
    } catch {
      toast.error("Unable to revoke sessions");
    } finally {
      setMutating(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Active Sessions</CardTitle>
            <CardDescription>
              Review the devices signed into your account and remove any that
              you no longer recognize.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-dashed p-6 text-muted-foreground text-sm">
              Loading sessions…
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Active Sessions</CardTitle>
            <CardDescription>
              Review the devices signed into your account and remove any that
              you no longer recognize.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-dashed p-6 text-muted-foreground text-sm">
              No active sessions found.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>
            Review the devices signed into your account and remove any that you
            no longer recognize.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={mutating || sessions.length === 0}
              onClick={revokeOtherSessions}
              size="sm"
              variant="secondary"
            >
              Revoke other sessions
            </Button>
            <Button
              disabled={mutating || sessions.length === 0}
              onClick={revokeAllSessions}
              size="sm"
              variant="destructive"
            >
              Revoke all sessions
            </Button>
          </div>

          <div className="space-y-3">
            {sessions.map((entry) => {
              const isCurrent = entry.token === currentToken;

              return (
                <div
                  className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                  key={entry.id}
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {isCurrent && (
                        <Badge variant="secondary">This device</Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {formatDeviceLabel(entry.userAgent)}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Started {formatDate(entry.createdAt)} · Expires{" "}
                      {formatDate(entry.expiresAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {isCurrent ? (
                      <Badge variant="outline">Current session</Badge>
                    ) : (
                      <Button
                        disabled={mutating}
                        onClick={() => revokeSession(entry.token)}
                        size="sm"
                        variant="outline"
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function formatDate(date: Date | string): string {
  return DATE_FORMATTER.format(new Date(date));
}

function formatDeviceLabel(userAgent?: string | null): string {
  if (!userAgent) {
    return "Unknown device";
  }

  const browser = detectBrowser(userAgent);
  const platform = detectPlatform(userAgent);

  if (!(browser || platform)) {
    return "Signed-in device";
  }

  if (!platform) {
    return browser ?? "Signed-in device";
  }

  if (!browser) {
    return platform;
  }

  return `${browser} on ${platform}`;
}

function detectBrowser(userAgent: string): string | null {
  if (RE_BRAVE.test(userAgent)) {
    return "Brave";
  }

  if (RE_EDGE.test(userAgent)) {
    return "Edge";
  }

  if (RE_OPERA.test(userAgent)) {
    return "Opera";
  }

  if (RE_FIREFOX.test(userAgent)) {
    return "Firefox";
  }

  if (
    RE_CHROME.test(userAgent) &&
    !RE_EDGE.test(userAgent) &&
    !RE_OPERA.test(userAgent)
  ) {
    return "Chrome";
  }

  if (RE_SAFARI.test(userAgent) && !RE_CHROME.test(userAgent)) {
    return "Safari";
  }

  return null;
}

function detectPlatform(userAgent: string): string | null {
  if (RE_ANDROID.test(userAgent)) {
    return "Android";
  }

  const appleDeviceMatch = userAgent.match(RE_APPLE_DEVICE);

  if (appleDeviceMatch) {
    return appleDeviceMatch[1];
  }

  if (RE_MAC.test(userAgent)) {
    return "macOS";
  }

  if (RE_WINDOWS.test(userAgent)) {
    return "Windows";
  }

  if (RE_LINUX.test(userAgent)) {
    return "Linux";
  }

  return null;
}
