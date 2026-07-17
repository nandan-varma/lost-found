export const queryKeys = {
  items: {
    all: (orgId: string) => ["items", orgId] as const,
    filtered: (orgId: string, status?: string) =>
      status
        ? (["items", orgId, "status", status] as const)
        : (["items", orgId] as const),
    detail: (itemId: string) => ["items", "detail", itemId] as const,
  },
  organizations: {
    all: () => ["organizations"] as const,
    bySlug: (slug: string) => ["organizations", slug] as const,
    byId: (orgId: string) => ["organizations", "id", orgId] as const,
  },
  members: {
    all: (orgId: string) => ["members", orgId] as const,
  },
  users: {
    nonMembers: (orgId: string) => ["users", orgId, "non-members"] as const,
    search: (orgId: string, query: string) =>
      ["users", "search", orgId, query] as const,
    searchResults: (orgId: string) => ["users", "search", orgId] as const,
  },
};
