export const SIDEBAR_WIDTHS = {
  COLLAPSED: "w-[64px]",
  EXPANDED: "w-[240px]",
} as const;

export const NAVIGATION_ITEMS = [
  {
    href: "/dashboard",
    iconName: "LayoutDashboard",
    label: "Dashboard",
  },
  {
    href: "/extract",
    iconName: "FileText",
    label: "Smart Extract",
  },
  {
    href: "/research",
    iconName: "Brain",
    label: "AI Research",
  },
  {
    href: "/drafting",
    iconName: "PenTool",
    label: "AutoDraft",
  },
  {
    href: "/documents",
    iconName: "Folder",
    label: "Documents",
  },
] as const;

export const OWNER_ONLY_ITEMS = [
  {
    href: "/user/members",
    iconName: "Users",
    label: "Members",
  },
  {
    href: "/user/invites",
    iconName: "Mail",
    label: "Invites",
  },
] as const;
