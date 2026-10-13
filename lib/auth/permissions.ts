import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from "better-auth/plugins/organization/access";

const statement = {
  ...defaultStatements,
  item: ["create", "read", "update", "delete", "claim"],
  project: ["create", "share", "update", "delete"],
} as const;

const ac = createAccessControl(statement);

const member = ac.newRole({
  item: ["create", "read", "claim"],
  project: ["create"],
});

const admin = ac.newRole({
  item: ["create", "read", "update", "delete", "claim"],
  project: ["create", "update"],
});

const owner = ac.newRole({
  item: ["create", "read", "update", "delete", "claim"],
  organization: ["update", "delete"],
  project: ["create", "update", "delete"],
});

export { ac, admin, member, owner, statement };
