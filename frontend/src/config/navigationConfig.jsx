import { lazy } from "react";

// ─── Lazy load views ──────────────────────────────────────────────────────────
const DashboardView     = lazy(() => import("../components/DashboardView"));
const RevenueView       = lazy(() => import("../components/admin/Dashboard/RevenueView"));
const CategoriesView    = lazy(() => import("../components/admin/Category/CategoriesView"));
const SubcategoriesView = lazy(() => import("../components/admin/SubCategory/SubCategoriesView"));
const ProductsView      = lazy(() => import("../components/admin/Product/ProductsView"));
const InventoryView     = lazy(() => import("../components/admin/Inventory/InventoryView"));
const OrdersView        = lazy(() => import("../components/admin/Order/OrdersView"));
const StaffView         = lazy(() => import("../components/admin/stuff/StaffView"));
const BannersView       = lazy(() => import("../components/admin/Banner/BannersView"));
const WarehouseView     = lazy(() => import("../components/admin/Warehouse/WarehouseView"));
const CouponsView       = lazy(() => import("../components/admin/Coupon/CouponsView"));
const ProfileView       = lazy(() => import("../components/admin/Profile/ProfileView"));
const CustomersView     = lazy(() => import("../components/admin/Customer/CustomersView"));
const FaqView           = lazy(() => import("../components/admin/Faq/FaqView"));
const TicketsView       = lazy(() => import("../components/admin/Ticket/TicketsView"));
const PoliciesView      = lazy(() => import("../components/admin/Policy/PoliciesView"));
const NotificationView  = lazy(() => import("../components/admin/Notification/NotificationView"));
const SettingsView      = lazy(() => import("../components/admin/Settings/SettingsView"));

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icons = {
  dashboard: (
    <svg className="menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
    </svg>
  ),
  revenue: (
    <svg className="menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  categories: (
    <svg className="menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  subcategories: (
    <svg className="menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
    </svg>
  ),
  products: (
    <svg className="menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  orders: (
    <svg className="menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
  staff: (
    <svg className="menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  banners: (
    <svg className="menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  warehouses: (
    <svg className="menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  inventory: (
    <svg className="menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  coupons: (
    <svg className="menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
    </svg>
  ),
  profile: (
    <svg className="menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  customers: (
    <svg className="menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  faq: (
    <svg className="menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  tickets: (
    <svg className="menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
    </svg>
  ),
  policies: (
    <svg className="menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  notifications: (
    <svg className="menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  settings: (
    <svg className="menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};

// ─── NAV CONFIG ───────────────────────────────────────────────────────────────
export const NAV_CONFIG = [
  {
    id: "dashboard",
    path: "/dashboard",
    label: "Dashboard",
    section: "Overview",
    icon: Icons.dashboard,
    component: DashboardView,
    roles: ["admin", "sub_admin", "accountant", "warehouse_manager", "agent"],
    defaultFor: ["admin", "sub_admin", "accountant", "warehouse_manager", "agent"],
  },
  {
    id: "revenue",
    path: "/revenue",
    label: "Revenue Analytics",
    section: "Overview",
    icon: Icons.revenue,
    component: RevenueView,
    roles: ["admin", "sub_admin", "accountant"],
    defaultFor: [],
  },
  {
    id: "categories",
    path: "/categories",
    label: "Categories",
    section: "Catalog",
    icon: Icons.categories,
    component: CategoriesView,
    roles: ["admin", "sub_admin", "warehouse_manager"],
    defaultFor: [],
  },
  {
    id: "banners",
    path: "/banners",
    label: "Banners",
    section: "Catalog",
    icon: Icons.banners,
    component: BannersView,
    roles: ["admin", "sub_admin"],
    defaultFor: [],
  },
  {
    id: "coupons",
    path: "/coupons",
    label: "Coupons",
    section: "Catalog",
    icon: Icons.coupons,
    component: CouponsView,
    roles: ["admin", "sub_admin"],
    defaultFor: [],
  },
  {
    id: "subcategories",
    path: "/subcategories",
    label: "Subcategories",
    section: "Catalog",
    icon: Icons.subcategories,
    component: SubcategoriesView,
    roles: ["admin", "sub_admin", "warehouse_manager"],
    defaultFor: [],
  },
  {
    id: "products",
    path: "/products",
    label: "Products",
    section: "Catalog",
    icon: Icons.products,
    component: ProductsView,
    roles: ["admin", "sub_admin", "warehouse_manager"],
    defaultFor: [],
  },
  {
    id: "inventory",
    path: "/inventory",
    label: "Inventory / Stock",
    section: "Catalog",
    icon: Icons.inventory,
    component: InventoryView,
    roles: ["admin", "warehouse_manager", "agent"],
    defaultFor: [],
  },
  {
    id: "orders",
    path: "/orders",
    label: "Orders",
    section: "Operations",
    icon: Icons.orders,
    component: OrdersView,
    roles: ["admin", "sub_admin", "accountant", "agent"],
    defaultFor: [],
  },
  {
    id: "customers",
    path: "/customers",
    label: "Customers",
    section: "Operations",
    icon: Icons.customers,
    component: CustomersView,
    roles: ["admin", "sub_admin"],
    defaultFor: [],
  },
  {
    id: "staff",
    path: "/staff",
    label: "Staff / Members",
    section: "Administration",
    icon: Icons.staff,
    component: StaffView,
    roles: ["admin"],
    defaultFor: [],
  },
  {
    id: "warehouses",
    path: "/warehouses",
    label: "Warehouses",
    section: "Administration",
    icon: Icons.warehouses,
    component: WarehouseView,
    roles: ["admin"],
    defaultFor: [],
  },
  {
    id: "faq",
    path: "/faq",
    label: "FAQs",
    section: "Support",
    icon: Icons.faq,
    component: FaqView,
    roles: ["admin", "sub_admin"],
    defaultFor: [],
  },
  {
    id: "tickets",
    path: "/tickets",
    label: "Support Tickets",
    section: "Support",
    icon: Icons.tickets,
    component: TicketsView,
    roles: ["admin", "sub_admin", "agent"],
    defaultFor: [],
  },
  {
    id: "policies",
    path: "/policies",
    label: "Policies",
    section: "Support",
    icon: Icons.policies,
    component: PoliciesView,
    roles: ["admin"],
    defaultFor: [],
  },
  {
    id: "profile",
    path: "/profile",
    label: "My Profile",
    section: "Administration",
    icon: Icons.profile,
    component: ProfileView,
    roles: ["admin"],
    defaultFor: [],
  },
  {
    id: "notifications",
    path: "/notifications",
    label: "Push Notifications",
    section: "Marketing",
    icon: Icons.notifications,
    component: NotificationView,
    roles: ["admin"],
    defaultFor: [],
  },
  {
    id: "settings",
    path: "/settings",
    label: "General Settings",
    section: "Administration",
    icon: Icons.settings,
    component: SettingsView,
    roles: ["admin"],
    defaultFor: [],
  },
  // ✅ Naya page add karna ho to bas yahan ek object add karo
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const getDefaultPath = (role) => {
  const item = NAV_CONFIG.find((n) => n.defaultFor?.includes(role));
  return item?.path || "/dashboard";
};

export const getAllowedPaths = (role) => {
  return NAV_CONFIG.filter((n) => n.roles.includes(role)).map((n) => n.path);
};
