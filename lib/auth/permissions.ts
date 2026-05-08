import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from "better-auth/plugins/organization/access";

const statement = {
  ...defaultStatements,
  project: ["create", "share", "update", "delete"],
  item: ["create", "read", "update", "delete", "claim"],
} as const;

const ac = createAccessControl(statement);

const member = ac.newRole({
  project: ["create"],
  item: ["create", "read", "claim"],
});

const admin = ac.newRole({
  project: ["create", "update"],
  item: ["create", "read", "update", "delete", "claim"],
});

const owner = ac.newRole({
  project: ["create", "update", "delete"],
  organization: ["update", "delete"],
  item: ["create", "read", "update", "delete", "claim"],
});

export { ac, admin, member, owner, statement };
