"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Brain,
  PenTool,
  Newspaper,
  Users,
  Mail,
  Folder,
  ChevronLeft,
  ChevronRight,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  Settings,
  Bell,
  User as UserIcon,
  Building2Icon,
  PlusIcon,
  CheckIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getCookie, deleteCookie, setCookie } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Api } from "@/lib/api-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const NavItem = ({
  href,
  icon,
  label,
  description,
  collapsed,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  description?: string;
  collapsed: boolean;
}) => {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={`group flex items-center rounded-xl border px-3 py-2 transition-colors ${
        active
          ? "bg-zinc-100 dark:bg-zinc-900/40 border-zinc-300 dark:border-zinc-800"
          : "border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-900/40 hover:border-zinc-200 dark:hover:border-zinc-800"
      } ${collapsed ? "justify-center" : "gap-3 min-w-0"}`}
    >
      <span className="text-muted-foreground group-hover:text-foreground">
        {icon}
      </span>
      {!collapsed && <span className="text-sm">{label}</span>}
    </Link>
  );
};

type Workspace = {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
};

function RoleBadge({ role }: { role?: string }) {
  if (!role) return null;
  let cls = "text-gray-700 bg-gray-50 border-gray-200";
  if (role === "Owner") cls = "text-amber-700 bg-amber-50 border-amber-200";
  else if (role === "Admin") cls = "text-blue-700 bg-blue-50 border-blue-200";
  else if (role === "Member")
    cls = "text-green-700 bg-green-50 border-green-200";
  return (
    <span
      className={`px-2 py-0.5 text-xs font-medium rounded-full border ${cls}`}
    >
      {role}
    </span>
  );
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { signOut, user } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [lsRole, setLsRole] = useState<string | undefined>(undefined);
  const [tokenRole, setTokenRole] = useState<string | undefined>(undefined);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const workspacesQuery = useQuery<Workspace[]>({
    queryKey: ["workspaces"],
    queryFn: async () => {
      const res = await Api.get<any>("/workspace", "no-store");
      const list: Workspace[] = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      return list;
    },
  });

  const workspaces = workspacesQuery.data || [];
  const currentWorkspaceId = typeof window !== "undefined" ? getCookie("workspaceId") : null;
  const currentWorkspace = workspaces.find((w) => w.id === currentWorkspaceId);

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      return await Api.post<Workspace>("/workspace", { name });
    },
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      setCookie("workspaceId", (created as any).id, 30, { sameSite: "lax", secure: true });
      setNewWorkspaceName("");
      setIsDialogOpen(false);
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    },
  });

  const handleWorkspaceChange = (workspaceId: string) => {
    const workspace = workspaces.find((w) => w.id === workspaceId);
    if (!workspace) return;
    try {
      if (typeof window !== "undefined") {
        setCookie("workspaceId", workspaceId, 30, { sameSite: "lax", secure: true });
      }
    } catch {}
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;
    setIsCreating(true);
    try {
      await createMutation.mutateAsync(newWorkspaceName.trim());
    } catch (err) {
      // noop
    } finally {
      setIsCreating(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    try {
      if (typeof window !== "undefined") {
        const u = JSON.parse(localStorage.getItem("user") || "{}");
        if (u?.role) {
          // Normalize role from localStorage
          const normalizedRole =
            u.role?.toLowerCase() === "owner"
              ? "Owner"
              : u.role?.toLowerCase() === "admin"
                ? "Admin"
                : u.role?.toLowerCase() === "member"
                  ? "Member"
                  : u.role || "Member";
          setLsRole(normalizedRole);
        }
        const token = getCookie("token");
        if (token) {
          const parts = token.split(".");
          if (parts.length === 3) {
            try {
              const payload = JSON.parse(
                atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
              );
              if (payload?.role) setTokenRole(String(payload.role));
            } catch {}
          }
        }
      }
    } catch {}
  }, []);

  const initials = (user?.email || "U").charAt(0).toUpperCase();
  const isAuthed = Boolean(
    user || (typeof window !== "undefined" && getCookie("token"))
  );

  // Debug logging
  useEffect(() => {
    // console.log("Sidebar role debug:", {
    //   userRole: user?.role,
    //   lsRole,
    //   tokenRole,
    //   mounted,
    //   finalRole: user?.role || (mounted ? lsRole : undefined) || tokenRole,
    //   isOwner:
    //     (user?.role || (mounted ? lsRole : undefined) || tokenRole) === "Owner",
    // });
  }, [user?.role, lsRole, tokenRole, mounted]);

  return (
    <aside
      className={`sticky top-0 h-svh shrink-0 border-r bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-3 transition-[width] shadow-lg ${
        collapsed ? "w-[64px]" : "w-[200px]"
      }`}
    >
      <div className="mb-4 flex items-center justify-between">
        {!collapsed ? (
          <Link href="/dashboard" className="flex items-center gap-2">
            <img src="/logo.png" alt="logo" className="h-7 w-7" />
            <span className="text-sm font-bold tracking-wide">InfraHive</span>
          </Link>
        ) : (
          <Link href="/dashboard">
            <img src="/logo.png" alt="logo" className="h-7 w-7" />
          </Link>
        )}
        <button
          type="button"
          aria-label="Toggle sidebar"
          onClick={() => setCollapsed((v) => !v)}
          className="rounded-md border p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      {/* Organization Selector */}
      {!collapsed && (
        <div className="mb-4">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between bg-white hover:bg-gray-50 border-gray-200"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Building2Icon className="h-4 w-4 text-gray-500 shrink-0" />
                    <span className="truncate text-left">
                      {currentWorkspace?.name || "Select workspace"}
                    </span>
                  </div>
                  <ChevronDown size={16} className="shrink-0 text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full bg-white border-gray-200 shadow-lg">
                {workspaces.map((workspace) => (
                  <DropdownMenuItem
                    key={workspace.id}
                    onClick={() => handleWorkspaceChange(workspace.id)}
                    className="flex items-center justify-between cursor-pointer hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Building2Icon className="h-4 w-4 text-gray-500 shrink-0" />
                      <span className="truncate">{workspace.name}</span>
                    </div>
                    {currentWorkspace?.id === workspace.id && (
                      <CheckIcon className="h-4 w-4 text-blue-600" />
                    )}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator className="bg-gray-100" />
                <DialogTrigger asChild>
                  <DropdownMenuItem className="cursor-pointer hover:bg-gray-50">
                    <PlusIcon className="h-4 w-4 mr-2 text-gray-500" />
                    <span>Create new workspace</span>
                  </DropdownMenuItem>
                </DialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>

            <DialogContent className="sm:max-w-md bg-white">
              <DialogHeader>
                <DialogTitle className="text-gray-900">Create New Workspace</DialogTitle>
                <DialogDescription className="text-gray-600">
                  Create a new workspace to organize your projects and collaborate with your team.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="workspace-name" className="text-sm font-medium">
                    Workspace Name
                  </Label>
                  <Input
                    id="workspace-name"
                    placeholder="Enter workspace name"
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    className="bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !isCreating) {
                        handleCreateWorkspace();
                      }
                    }}
                  />
                </div>
              </div>
              <DialogFooter className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setNewWorkspaceName("");
                  }}
                  className="bg-white hover:bg-gray-50 border-gray-200"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateWorkspace}
                  disabled={!newWorkspaceName.trim() || isCreating}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isCreating ? "Creating..." : "Create Workspace"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <nav className="space-y-1">
        <NavItem
          collapsed={collapsed}
          href="/dashboard"
          icon={<LayoutDashboard size={16} />}
          label="Dashboard"
        />
        <NavItem
          collapsed={collapsed}
          href="/extract"
          icon={<FileText size={16} />}
          label="Smart Extract"
        />
        <NavItem
          collapsed={collapsed}
          href="/research"
          icon={<Brain size={16} />}
          label="AI Research"
        />
        <NavItem
          collapsed={collapsed}
          href="/drafting"
          icon={<PenTool size={16} />}
          label="AutoDraft"
        />
        {(() => {
          const currentRole = user?.role || lsRole || tokenRole;
          return currentRole === "Owner";
        })() ? (
          <>
            <NavItem
              collapsed={collapsed}
              href="/user/members"
              icon={<Users size={16} />}
              label="Members"
            />
            <NavItem
              collapsed={collapsed}
              href="/user/invites"
              icon={<Mail size={16} />}
              label="Invites"
            />
          </>
        ) : null}
        <NavItem
          collapsed={collapsed}
          href="/documents"
          icon={<Folder size={16} />}
          label="Documents"
        />
        <NavItem
          collapsed={collapsed}
          href="/settings"
          icon={<Settings size={16} />}
          label="Settings"
        />
      </nav>

      <div className="mt-auto pt-4">
        {/* User Profile */}
        {mounted && isAuthed ? (
          <div className="relative">
            {!collapsed ? (
              <DropdownMenu open={userDropdownOpen} onOpenChange={setUserDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <button
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-600 text-white text-sm">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">
                          {user?.name ||
                            (user?.email as string)?.split("@")?.[0] ||
                            (mounted && typeof window !== "undefined"
                              ? JSON.parse(localStorage.getItem("user") || "{}")
                                  .name ||
                                JSON.parse(
                                  localStorage.getItem("user") || "{}"
                                ).email?.split("@")?.[0]
                              : undefined) ||
                            "User"}
                        </p>
                        <RoleBadge
                          role={
                            user
                              ? String(user.role || "")
                              : mounted && typeof window !== "undefined"
                                ? (() => {
                                    const lsUser = JSON.parse(
                                      localStorage.getItem("user") || "{}"
                                    );
                                    return lsUser.role?.toLowerCase() === "owner"
                                      ? "Owner"
                                      : lsUser.role?.toLowerCase() === "admin"
                                        ? "Admin"
                                        : lsUser.role?.toLowerCase() === "member"
                                          ? "Member"
                                          : lsUser.role || "Member";
                                  })()
                                : undefined
                          }
                        />
                      </div>
                      {user?.email ? (
                        <p className="text-xs text-muted-foreground truncate">
                          {String(user.email || "")}
                        </p>
                      ) : mounted &&
                        typeof window !== "undefined" &&
                        JSON.parse(localStorage.getItem("user") || "{}").email ? (
                        <p className="text-xs text-muted-foreground truncate">
                          {JSON.parse(localStorage.getItem("user") || "{}").email}
                        </p>
                      ) : null}
                    </div>
                    <ChevronDown
                      size={14}
                      className={`text-muted-foreground transition ${userDropdownOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 rounded-md border bg-background p-1 shadow-md">
                  <DropdownMenuItem asChild>
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 rounded px-3 py-2 text-sm hover:bg-accent"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <UserIcon size={14} /> Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/settings"
                      className="flex items-center gap-2 rounded px-3 py-2 text-sm hover:bg-accent"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <Settings size={14} /> Workspace
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      signOut();
                      router.push("/login");
                    }}
                  >
                    <LogOut size={14} /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <button
                className="w-full flex justify-center p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-600 text-white text-sm">
                  {initials}
                </div>
              </button>
            )}
            {collapsed && userDropdownOpen && (
              <div className="absolute bottom-0 left-full ml-2 w-56 rounded-md border bg-background p-1 shadow-md z-50">
                <DropdownMenuItem asChild>
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 rounded px-3 py-2 text-sm hover:bg-accent"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <UserIcon size={14} /> Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 rounded px-3 py-2 text-sm hover:bg-accent"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <Settings size={14} /> Workspace
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                  onClick={() => {
                    setUserDropdownOpen(false);
                    signOut();
                    router.push("/login");
                  }}
                >
                  <LogOut size={14} /> Sign out
                </DropdownMenuItem>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="w-full rounded-md border px-3 py-2 text-sm hover:bg-accent text-center"
            >
              Login
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
