import { lazy } from "react";

// ─── Lazy load views ──────────────────────────────────────────────────────────
const DashboardView     = lazy(() => import("../components/DashboardView"));
const CategoriesView    = lazy(() => import("../components/admin/Category/CategoriesView"));
const SubcategoriesView = lazy(() => import("../components/admin/SubCategory/SubCategoriesView"));
const ProductsView      = lazy(() => import("../components/admin/Product/ProductsView"));
const OrdersView        = lazy(() => import("../components/admin/Order/OrdersView"));
const StaffView         = lazy(() => import("../components/admin/stuff/StaffView"));

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icons = {
  dashboard: (
    <svg className="menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
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
  manageCategory: (
    <svg className="menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
    </svg>
  ),
};

// ─── NAV CONFIG ───────────────────────────────────────────────────────────────
// Ek jagah sab kuch define karo:
// id, label, section, icon, component, defaultFor (konsa role yahan land kare)
// ─────────────────────────────────────────────────────────────────────────────
export const NAV_CONFIG = [
  {
    id: "dashboard",
    label: "Dashboard",
    section: "Overview",
    icon: Icons.dashboard,
    component: DashboardView,
    roles: ["admin", "sub_admin", "accountant"],
    defaultFor: ["admin", "sub_admin", "accountant"],
  },
  {
    id: "categories",
    label: "Categories",
    section: "Catalog",
    icon: Icons.categories,
    component: CategoriesView,
    roles: ["admin", "sub_admin", "warehouse_manager"],
    defaultFor: ["warehouse_manager"],
  },
  {
    id: "subcategories",
    label: "Subcategories",
    section: "Catalog",
    icon: Icons.subcategories,
    component: SubcategoriesView,
    roles: ["admin", "sub_admin", "warehouse_manager"],
    defaultFor: [],
  },
  {
    id: "products",
    label: "Products",
    section: "Catalog",
    icon: Icons.products,
    component: ProductsView,
    roles: ["admin", "sub_admin", "warehouse_manager"],
    defaultFor: [],
  },
  {
    id: "orders",
    label: "Orders",
    section: "Operations",
    icon: Icons.orders,
    component: OrdersView,
    roles: ["admin", "sub_admin", "accountant", "agent"],
    defaultFor: ["agent"],
  },
  {
    id: "staff",
    label: "Staff / Members",
    section: "Administration",
    icon: Icons.staff,
    component: StaffView,
    roles: ["admin"],
    defaultFor: [],
  },
  // ✅ Kal 500 naye options aaye to bas yahan ek object add karo — bas!
];

// ─── Helper: Role ka default landing view ─────────────────────────────────────
export const getDefaultView = (role) => {
  const item = NAV_CONFIG.find((n) => n.defaultFor?.includes(role));
  return item?.id || "dashboard";
};

// ─── Helper: Role ke liye allowed views ───────────────────────────────────────
export const getAllowedViews = (role) => {
  return NAV_CONFIG.filter((n) => n.roles.includes(role)).map((n) => n.id);
};

// ─── Helper: id se component nikalo ──────────────────────────────────────────
export const getComponentById = (id) => {
  return NAV_CONFIG.find((n) => n.id === id)?.component || null;
};
