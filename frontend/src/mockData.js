// ─── MOCK DATA STORAGE FOR ADMIN PANEL UI ───────────────────────────────────

export const MOCK_STATS = [
  { label: "TOTAL SALES (INR)", value: "₹1,54,820.00", trend: "↑ 12% vs last week", type: "positive" },
  { label: "ACTIVE PRODUCTS", value: "1,482", trend: "98% in stock", type: "neutral" },
  { label: "PENDING ORDERS", value: "28", trend: "Requires attention", type: "warning" },
  { label: "TOTAL CUSTOMERS", value: "3,129", trend: "↑ 48 new today", type: "positive" }
];

export const MOCK_ACTIVITY_LOGS = [
  { time: "16:24:10", module: "Orders", action: "Order ORD-000481 placed (Wallet)", operator: "Guest Session", status: "Success", badge: "success" },
  { time: "16:15:32", module: "Products", action: 'Updated stock of "Fresh Apple (Fuji)"', operator: "Admin Ankit", status: "Updated", badge: "success" },
  { time: "16:02:00", module: "Scheduler", action: "Auto-cancelled order ORD-000479 (Timeout)", operator: "System Daemon", status: "Cancelled", badge: "error" },
  { time: "15:58:12", module: "Categories", action: 'Created Category "Dairy & Bakery"', operator: "Staff Rahul", status: "Success", badge: "success" }
];

export const MOCK_CATEGORIES = [
  { id: "CAT-001", icon: "🥦", name: "Vegetables & Fruits", slug: "vegetables-fruits", count: 145, status: "Active" },
  { id: "CAT-002", icon: "🥛", name: "Dairy & Eggs", slug: "dairy-eggs", count: 89, status: "Active" },
  { id: "CAT-003", icon: "🍞", name: "Bakery & Bread", slug: "bakery-bread", count: 74, status: "Active" },
  { id: "CAT-004", icon: "🥤", name: "Cold Drinks & Juices", slug: "cold-drinks-juices", count: 112, status: "Inactive" }
];

export const MOCK_SUBCATEGORIES = [
  { id: "SUB-001", icon: "🍎", name: "Fresh Fruits", parent: "Vegetables & Fruits", slug: "fresh-fruits", status: "Active" },
  { id: "SUB-002", icon: "🥕", name: "Fresh Vegetables", parent: "Vegetables & Fruits", slug: "fresh-vegetables", status: "Active" },
  { id: "SUB-003", icon: "🧈", name: "Butter & Cheese", parent: "Dairy & Eggs", slug: "butter-cheese", status: "Active" }
];

export const MOCK_PRODUCTS = [
  { id: "PROD-001", icon: "🥛", name: "Amul Gold Milk (1L)", category: "Dairy & Eggs", mrp: 68.00, price: 66.00, stock: "184 bags", status: "Active" },
  { id: "PROD-002", icon: "🍌", name: "Fresh Robusta Banana (1 Dozen)", category: "Vegetables & Fruits", mrp: 60.00, price: 49.00, stock: "45 units", status: "Active" },
  { id: "PROD-003", icon: "🍞", name: "English Oven White Bread (400g)", category: "Bakery & Bread", mrp: 45.00, price: 42.00, stock: "0 units", status: "Active" }
];

export const MOCK_STAFF = [
  { id: "ADM-000001", name: "Ankit Prajapati", email: "ankit@admin.com", role: "Super Admin", mobile: "9876543210", city: "Mumbai", status: "Active" },
  { id: "STF-000001", name: "Rahul Sharma", email: "rahul@company.com", role: "agent", mobile: "9123456789", city: "Delhi", status: "Active" },
  { id: "STF-000002", name: "Vikram Singh", email: "vikram@company.com", role: "warehouse_manager", mobile: "9988776655", city: "Bengaluru", status: "Suspended" },
  { id: "STF-000003", name: "Priya Mehta", email: "priya@company.com", role: "accountant", mobile: "9871234560", city: "Pune", status: "Active" },
  { id: "STF-000004", name: "Suresh Kumar", email: "suresh@company.com", role: "agent", mobile: "8765432109", city: "Hyderabad", status: "Active" },
  { id: "STF-000005", name: "Neha Gupta", email: "neha@company.com", role: "sub_admin", mobile: "7654321098", city: "Jaipur", status: "Active" },
  { id: "STF-000006", name: "Amit Patel", email: "amit@company.com", role: "warehouse_manager", mobile: "6543210987", city: "Ahmedabad", status: "Active" },
  { id: "STF-000007", name: "Kavita Reddy", email: "kavita@company.com", role: "agent", mobile: "9432109876", city: "Chennai", status: "Suspended" },
  { id: "STF-000008", name: "Rohan Das", email: "rohan@company.com", role: "accountant", mobile: "8321098765", city: "Kolkata", status: "Active" },
  { id: "STF-000009", name: "Sneha Iyer", email: "sneha@company.com", role: "agent", mobile: "7210987654", city: "Kochi", status: "Active" },
  { id: "STF-000010", name: "Manoj Tiwari", email: "manoj@company.com", role: "sub_admin", mobile: "6109876543", city: "Lucknow", status: "Suspended" },
  { id: "STF-000011", name: "Deepa Nair", email: "deepa@company.com", role: "warehouse_manager", mobile: "9098765432", city: "Thiruvananthapuram", status: "Active" },
];

export const MOCK_ORDERS = {
  "ORD-000481": {
    order_id: "ORD-000481",
    date: "Today, 16:24",
    status: "Placed",
    customer: {
      name: "Ankit Prajapati",
      mobile: "+91 9876543210",
      email: "ankit@example.com"
    },
    address: {
      line1: "Flat 402, Sunshine Apartment",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400053",
      type: "Home"
    },
    items: [
      { name: "Amul Gold Milk (1L)", price: 66, quantity: 2 },
      { name: "English Oven White Bread (400g)", price: 42, quantity: 1 }
    ],
    pricing: {
      subtotal: 174,
      gst: 0,
      delivery: 0,
      total: 174
    },
    payment: {
      method: "Wallet",
      status: "Paid"
    }
  },
  "ORD-000480": {
    order_id: "ORD-000480",
    date: "Today, 16:10",
    status: "Placed",
    customer: {
      name: "Rahul Sharma",
      mobile: "+91 9123456789",
      email: "rahul@example.com"
    },
    address: {
      line1: "Sector 15, Vasundhara",
      city: "Ghaziabad",
      state: "Uttar Pradesh",
      pincode: "201012",
      type: "Office"
    },
    items: [
      { name: "Fresh Robusta Banana (1 Dozen)", price: 49, quantity: 1 }
    ],
    pricing: {
      subtotal: 49,
      gst: 0,
      delivery: 0,
      total: 49
    },
    payment: {
      method: "Online (Razorpay)",
      status: "Paid"
    }
  },
  "ORD-000479": {
    order_id: "ORD-000479",
    date: "Today, 15:52",
    status: "Cancelled",
    customer: {
      name: "Rohan Verma",
      mobile: "+91 9999888877",
      email: "rohan@example.com"
    },
    address: {
      line1: "Block C, Indirapuram",
      city: "Noida",
      state: "Uttar Pradesh",
      pincode: "201301",
      type: "Home"
    },
    items: [
      { name: "Dairy Milk Silk (60g)", price: 90, quantity: 3 }
    ],
    pricing: {
      subtotal: 270,
      gst: 0,
      delivery: 0,
      total: 270
    },
    payment: {
      method: "Online (Razorpay)",
      status: "Failed"
    }
  },
  "ORD-000478": {
    order_id: "ORD-000478",
    date: "Yesterday, 14:02",
    status: "Delivered",
    customer: {
      name: "Karan Gupta",
      mobile: "+91 8888777766",
      email: "karan@example.com"
    },
    address: {
      line1: "Gali No 4, Preet Vihar",
      city: "Delhi",
      state: "Delhi",
      pincode: "110092",
      type: "Home"
    },
    items: [
      { name: "Fresh Tomato (1kg)", price: 40, quantity: 2 }
    ],
    pricing: {
      subtotal: 80,
      gst: 0,
      delivery: 0,
      total: 80
    },
    payment: {
      method: "COD",
      status: "Paid"
    }
  }
};
