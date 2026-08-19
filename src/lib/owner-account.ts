import type { CurrentUser, UserRole } from "@/types/auth";

function roleValue(role: CurrentUser["role"]): string {
  if (typeof role === "string") return role.toLowerCase();
  if (!role) return "";
  return String(role.slug ?? role.code ?? role.name ?? "").toLowerCase();
}

export function isOwnerAccount(user: CurrentUser): boolean {
  if (roleValue(user.role) === "owner") return true;
  return (user.roles ?? []).some((role) => {
    if (typeof role === "string") return role.toLowerCase() === "owner";
    return String(role.slug ?? role.code ?? role.name ?? "").toLowerCase() === "owner";
  });
}
