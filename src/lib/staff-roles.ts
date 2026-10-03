export type StaffRole = "admin" | "supervisor";

export const STAFF_ROLES: StaffRole[] = ["admin", "supervisor"];

export const ROLE_LABELS: Record<StaffRole, string> = {
  admin: "管理员",
  supervisor: "主管",
};
