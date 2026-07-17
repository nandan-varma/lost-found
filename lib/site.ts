import "server-only";

const DEFAULT_SITE_URL = "http://localhost:3000";

export function getSiteUrl() {
  const url = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (!url) {
    return DEFAULT_SITE_URL;
  }

  return url.endsWith("/") ? url.slice(0, -1) : url;
}
