import { useEffect, useState } from "react";
import { getCookie } from "@/lib/utils";

export function useUserRole(user?: { role?: string }) {
  const [mounted, setMounted] = useState(false);
  const [lsRole, setLsRole] = useState<string | undefined>(undefined);
  const [tokenRole, setTokenRole] = useState<string | undefined>(undefined);

  useEffect(() => {
    setMounted(true);
    
    try {
      if (typeof window !== "undefined") {
        // Get role from localStorage
        const lsUser = JSON.parse(localStorage.getItem("user") || "{}");
        if (lsUser?.role) {
          const normalizedRole = normalizeRole(lsUser.role);
          setLsRole(normalizedRole);
        }

        // Get role from JWT token
        const token = getCookie("token");
        if (token) {
          const payload = parseJwtPayload(token);
          if (payload?.role) {
            setTokenRole(String(payload.role));
          }
        }
      }
    } catch (error) {
      // Silently handle errors
    }
  }, []);

  const currentRole = user?.role || (mounted ? lsRole : undefined) || tokenRole;
  const isOwner = currentRole === "Owner";
  const isAdmin = currentRole === "Admin";
  const isMember = currentRole === "Member";

  return {
    currentRole,
    isOwner,
    isAdmin,
    isMember,
    mounted,
  };
}

function normalizeRole(role: string): string {
  const lowerRole = role.toLowerCase();
  switch (lowerRole) {
    case "owner":
      return "Owner";
    case "admin":
      return "Admin";
    case "member":
      return "Member";
    default:
      return role || "Member";
  }
}

function parseJwtPayload(token: string) {
  try {
    const parts = token.split(".");
    if (parts.length === 3) {
      const payload = JSON.parse(
        atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
      );
      return payload;
    }
  } catch (error) {
    // Silently handle parsing errors
  }
  return null;
}
