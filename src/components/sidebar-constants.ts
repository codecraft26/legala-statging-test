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
    href: "/drafting",
    iconName: "PenTool",
    label: "AutoDraft",
  },
  {
    href: "/ai-assistant",
    iconName: "Bot",
    label: "AI Assistant",
    badge: "New",
  },
  {
    href: "/extract",
    iconName: "FileText",
    label: "Smart Extract",
    badge: "Legacy",
  },
  {
    href: "/documents",
    iconName: "Folder",
    label: "Documents",
  },
  {
    href: "/ai-court-search",
    iconName: "Gavel",
    label: "AI Court Search",
    badge: "New",
  },
  {
    href: "/research",
    iconName: "Brain",
    label: "AI Research",
    badge: "Legacy",
  },
  {
    href: "/news",
    iconName: "Newspaper",
    label: "Legal News",
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
