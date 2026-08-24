# API Documentation

Base URL: `http://localhost:5000/api/v1`

---

## Auth Header (Protected Routes)

```
Authorization: Bearer <accessToken>
```

---

## 🌟 CUSTOMER APP PUBLIC ENDPOINTS

Clean, RESTful endpoints for Customer Mobile App / Web App storefront:

- **Categories**: `GET /api/v1/categories?page=1&limit=10&search=fruit&status=active`
- **Single Category**: `GET /api/v1/categories/:id`
- **Sub-Categories**: `GET /api/v1/sub-categories?category_id=CAT-1001&page=1&limit=10&search=milk`
- **Single Sub-Category**: `GET /api/v1/sub-categories/:id`
- **Products**: `GET /api/v1/products?search=milk&category=...&subCategory=...&page=1&limit=10`
- **Single Product**: `GET /api/v1/products/:id` (by Mongo ID or SKU)
- **Home Banners**: `GET /api/v1/banners?page=1&limit=20`

---

## 1. AUTH APIs

### 1.1 Admin Register

**POST** `/auth/register`

**Request Body:**

```json
{
  "fullName": "Ankit Prajapati",
  "email": "ankit@example.com",
  "mobile": "9876543210",
  "password": "Admin@123"
}
```

**Success Response** `201`:

```json
{
  "success": true,
  "message": "Admin registered successfully",
  "data": {
    "admin_id": "ADM-000001",
    "fullName": "Ankit Prajapati",
    "email": "ankit@example.com",
    "mobile": "9876543210",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
| Status | Message |
|--------|---------|
| 400 | All fields are required |
| 409 | Email already registered |
| 409 | Mobile number already registered |
| 500 | Internal server error |

---

### 1.2 Login (Admin + Staff)

**POST** `/auth/login`

**Request Body:**

```json
{
  "email": "ankit@example.com",
  "password": "Admin@123"
}
```

**Success Response** `200` (Admin):

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "ADM-000001",
      "name": "Ankit Prajapati",
      "email": "ankit@example.com",
      "mobile": "9876543210",
      "role": "admin"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Success Response** `200` (Staff):

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "STF-000001",
      "name": "Rahul Sharma",
      "email": "rahul@example.com",
      "mobile": "9123456789",
      "role": "sub_admin",
      "address": {
        "street": "123 Main St",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400001",
        "landmark": "Near Station"
      }
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**
| Status | Message |
|--------|---------|
| 400 | Email and password are required |
| 401 | Invalid email or password |
| 403 | Your account is deactivated. Please contact admin. |
| 500 | Internal server error |

---

### 1.3 Refresh Access Token

**POST** `/auth/refresh-token`

**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response** `200`:

```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

> **Note:** Every refresh issues a new token pair (rotation). Store both tokens on frontend.

**Error Responses:**
| Status | Message |
|--------|---------|
| 400 | Refresh token is required |
| 401 | Invalid or expired refresh token |
| 401 | Refresh token mismatch or user not found |
| 403 | Your account is deactivated. Please contact admin. |
| 500 | Internal server error |

---

### 1.4 Customer — Send OTP

**POST** `/auth/customer/send-otp`

**Request Body (Existing Customer):**

```json
{
  "mobile": "9876543210"
}
```

**Request Body (New Customer):**

```json
{
  "mobile": "9876543210",
  "name": "Ravi Kumar"
}
```

**Success Response** `200`:

```json
{
  "success": true,
  "message": "OTP sent successfully",
  "otp": "482910"
}
```

> `otp` field only visible in `development` mode. Hidden in production.

**Error Responses:**
| Status | Message |
|--------|---------|
| 400 | Mobile number is required |
| 400 | Name is required for registration (new user without name) |
| 500 | Internal server error |

---

### 1.5 Customer — Verify OTP

**POST** `/auth/customer/verify-otp`

**Request Body:**

```json
{
  "mobile": "9876543210",
  "otp": "482910"
}
```

**Success Response** `200`:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "68abc123...",
      "customer_id": "CUS-000001",
      "name": "Ravi Kumar",
      "mobile": "9876543210",
      "role": "customer"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**
| Status | Message |
|--------|---------|
| 400 | Mobile number and OTP are required |
| 400 | Invalid OTP |
| 400 | OTP expired |
| 400 | Name required |
| 403 | Account inactive |
| 500 | Internal server error |

---

## 2. ADMIN APIs

> All routes below require: `Authorization: Bearer <accessToken>` (Admin only)

---

### 2.1 Create Staff

**POST** `/admin/create-staff`

**Request Body:**

```json
{
  "name": "Rahul Sharma",
  "email": "rahul@example.com",
  "phone": "9123456789",
  "password": "Staff@123",
  "role": "sub_admin",
  "address": {
    "street": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "landmark": "Near Station"
  }
}
```

> **Allowed roles:** `sub_admin` | `agent` | `warehouse_manager` | `accountant`

**Success Response** `201`:

```json
{
  "success": true,
  "message": "sub admin created successfully",
  "data": {
    "staff_id": "STF-000001",
    "name": "Rahul Sharma",
    "email": "rahul@example.com",
    "phone": "9123456789",
    "role": "sub_admin",
    "address": {
      "street": "123 Main Street",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001",
      "landmark": "Near Station"
    },
    "createdBy": "68abc123...",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
| Status | Message |
|--------|---------|
| 400 | All fields are required |
| 400 | Address must contain street, city, state, and pincode |
| 400 | ValidationError (invalid role etc.) |
| 409 | Email already registered for a staff member |
| 500 | Internal server error |

---

## 3. CATEGORY APIs

> All routes require: `Authorization: Bearer <accessToken>` (Admin only)

---

### 3.1 Create Category

**POST** `/admin/categories`

**Content-Type:** `multipart/form-data`

| Field | Type   | Required | Notes                      |
| ----- | ------ | -------- | -------------------------- |
| name  | string | ✅       | Unique, case-insensitive   |
| image | file   | ❌       | jpg/jpeg/png/webp, max 2MB |

**Example (with image):**

```
POST /api/v1/admin/categories
Content-Type: multipart/form-data

name: Electronics
image: [file]
```

**Success Response** `201`:

```json
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "_id": "68abc123...",
    "category_id": "CAT-000001",
    "name": "Electronics",
    "slug": "electronics",
    "image": {
      "url": "https://res.cloudinary.com/your_cloud/image/upload/v123/categories/abc.jpg",
      "public_id": "categories/abc"
    },
    "isActive": true,
    "createdBy": "68xyz...",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
| Status | Message |
|--------|---------|
| 400 | Category name is required |
| 400 | Only jpg, jpeg, png, webp images are allowed |
| 400 | File too large (max 2MB) |
| 409 | Category with this name already exists |
| 500 | Internal server error |

---

### 3.2 Get All Categories

**GET** `/admin/categories`

**Query Params:**
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| page | number | 1 | Page number |
| limit | number | 10 | Max 50 |
| search | string | - | Search by name |
| status | string | - | `active` or `inactive` |

**Example:**

```
GET /api/v1/admin/categories?page=1&limit=10&search=elec&status=active
```

**Success Response** `200`:

```json
{
  "success": true,
  "data": [
    {
      "_id": "68abc123...",
      "category_id": "CAT-000001",
      "name": "Electronics",
      "slug": "electronics",
      "image": {
        "url": "https://res.cloudinary.com/...",
        "public_id": "categories/abc"
      },
      "isActive": true,
      "createdBy": "68xyz...",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

---

### 3.3 Get Single Category

**GET** `/admin/categories/:id`

> `:id` can be `category_id` (e.g. `CAT-000001`) or `slug` (e.g. `electronics`)

**Success Response** `200`:

```json
{
  "success": true,
  "data": {
    "_id": "68abc123...",
    "category_id": "CAT-000001",
    "name": "Electronics",
    "slug": "electronics",
    "image": {
      "url": "https://res.cloudinary.com/...",
      "public_id": "categories/abc"
    },
    "isActive": true,
    "createdBy": "68xyz...",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
| Status | Message |
|--------|---------|
| 404 | Category not found |
| 500 | Internal server error |

---

### 3.4 Update Category

**PUT** `/admin/categories/:id`

**Content-Type:** `multipart/form-data`

> `:id` must be `category_id` (e.g. `CAT-000001`)

| Field    | Type    | Required | Notes                   |
| -------- | ------- | -------- | ----------------------- |
| name     | string  | ❌       | New name                |
| isActive | boolean | ❌       | `true` or `false`       |
| image    | file    | ❌       | Replaces existing image |

> If new image is uploaded, old image is automatically deleted from Cloudinary.

**Success Response** `200`:

```json
{
  "success": true,
  "message": "Category updated successfully",
  "data": {
    "_id": "68abc123...",
    "category_id": "CAT-000001",
    "name": "Electronics & Gadgets",
    "slug": "electronics-gadgets",
    "image": {
      "url": "https://res.cloudinary.com/.../new_image.jpg",
      "public_id": "categories/new_abc"
    },
    "isActive": true,
    "createdBy": "68xyz...",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

**Error Responses:**
| Status | Message |
|--------|---------|
| 404 | Category not found |
| 409 | Category with this name already exists |
| 500 | Internal server error |

---

### 3.5 Delete Category

**DELETE** `/admin/categories/:id`

> `:id` must be `category_id` (e.g. `CAT-000001`)
> Also permanently deletes image from Cloudinary.

**Success Response** `200`:

```json
{
  "success": true,
  "message": "Category deleted successfully"
}
```

**Error Responses:**
| Status | Message |
|--------|---------|
| 404 | Category not found |
| 500 | Internal server error |

---

### 3.6 Toggle Category Status

**PATCH** `/admin/categories/:id/toggle-status`

> `:id` must be `category_id` (e.g. `CAT-000001`)
> Switches `isActive` between `true` and `false`.

**Success Response** `200`:

```json
{
  "success": true,
  "message": "Category deactivated successfully",
  "data": {
    "category_id": "CAT-000001",
    "isActive": false
  }
}
```

**Error Responses:**
| Status | Message |
|--------|---------|
| 404 | Category not found |
| 500 | Internal server error |

---

## Common Error Responses

### 401 — No Token / Invalid Token

```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

### 403 — Wrong Role

```json
{
  "success": false,
  "message": "Forbidden. Admin access required."
}
```

### 429 — Rate Limit Exceeded

```json
{
  "success": false,
  "message": "Too many requests from this IP, please try again after a minute."
}
```

### 404 — Route Not Found

```json
{
  "success": false,
  "message": "API Route Not Found"
}
```

---

## 4. SUB-CATEGORY APIs

> All routes require: `Authorization: Bearer <accessToken>` (Admin only)

---

### 4.1 Create Sub-Category
**POST** `/admin/sub-categories`

**Content-Type:** `multipart/form-data`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | ✅ | Unique within same category |
| category_id | string | ✅ | e.g. `CAT-000001` (must be active) |
| image | file | ❌ | jpg/jpeg/png/webp, max 2MB |

**Example:**
```
POST /api/v1/admin/sub-categories
Content-Type: multipart/form-data

name: Mobiles
category_id: CAT-000001
image: [file]
```

**Success Response** `201`:
```json
{
  "success": true,
  "message": "Sub-category created successfully",
  "data": {
    "_id": "68abc123...",
    "sub_category_id": "SUB-000001",
    "name": "Mobiles",
    "slug": "mobiles",
    "category": {
      "category_id": "CAT-000001",
      "name": "Electronics",
      "slug": "electronics"
    },
    "image": {
      "url": "https://res.cloudinary.com/your_cloud/image/upload/v123/categories/abc.jpg",
      "public_id": "categories/abc"
    },
    "isActive": true,
    "createdBy": "68xyz...",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
| Status | Message |
|--------|---------|
| 400 | name and category_id are required |
| 404 | Parent category not found or inactive |
| 409 | Sub-category with this name already exists in this category |
| 500 | Internal server error |

---

### 4.2 Get All Sub-Categories
**GET** `/admin/get-sub-categories`

**Query Params:**
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| page | number | 1 | Page number |
| limit | number | 10 | Max 50 |
| search | string | - | Search by name |
| status | string | - | `active` or `inactive` |
| category_id | string | - | Filter by parent e.g. `CAT-000001` |

**Example:**
```
GET /api/v1/admin/get-sub-categories?page=1&limit=10&category_id=CAT-000001&status=active
```

**Success Response** `200`:
```json
{
  "success": true,
  "data": [
    {
      "_id": "68abc123...",
      "sub_category_id": "SUB-000001",
      "name": "Mobiles",
      "slug": "mobiles",
      "category": {
        "category_id": "CAT-000001",
        "name": "Electronics",
        "slug": "electronics"
      },
      "image": {
        "url": "https://res.cloudinary.com/...",
        "public_id": "categories/abc"
      },
      "isActive": true,
      "createdBy": "68xyz...",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 15,
    "page": 1,
    "limit": 10,
    "totalPages": 2
  }
}
```

**Error Responses:**
| Status | Message |
|--------|---------|
| 404 | Category not found (if invalid category_id passed in query) |
| 500 | Internal server error |

---

### 4.3 Get Single Sub-Category
**GET** `/admin/single-sub-categories/:id`

> `:id` can be `sub_category_id` (e.g. `SUB-000001`) or `slug` (e.g. `mobiles`)

**Success Response** `200`:
```json
{
  "success": true,
  "data": {
    "_id": "68abc123...",
    "sub_category_id": "SUB-000001",
    "name": "Mobiles",
    "slug": "mobiles",
    "category": {
      "category_id": "CAT-000001",
      "name": "Electronics",
      "slug": "electronics"
    },
    "image": {
      "url": "https://res.cloudinary.com/...",
      "public_id": "categories/abc"
    },
    "isActive": true,
    "createdBy": "68xyz...",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
| Status | Message |
|--------|---------|
| 404 | Sub-category not found |
| 500 | Internal server error |

---

### 4.4 Update Sub-Category
**PUT** `/admin/update-sub-categories/:id`

**Content-Type:** `multipart/form-data`

> `:id` must be `sub_category_id` (e.g. `SUB-000001`)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | ❌ | New name |
| category_id | string | ❌ | Move to different parent category |
| isActive | boolean | ❌ | `true` or `false` |
| image | file | ❌ | Replaces existing image on Cloudinary |

**Success Response** `200`:
```json
{
  "success": true,
  "message": "Sub-category updated successfully",
  "data": {
    "_id": "68abc123...",
    "sub_category_id": "SUB-000001",
    "name": "Smartphones",
    "slug": "smartphones",
    "category": {
      "category_id": "CAT-000001",
      "name": "Electronics",
      "slug": "electronics"
    },
    "image": {
      "url": "https://res.cloudinary.com/.../new_image.jpg",
      "public_id": "categories/new_abc"
    },
    "isActive": true,
    "createdBy": "68xyz...",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

**Error Responses:**
| Status | Message |
|--------|---------|
| 404 | Sub-category not found |
| 404 | Parent category not found or inactive |
| 409 | Sub-category with this name already exists in this category |
| 500 | Internal server error |

---

### 4.5 Delete Sub-Category
**DELETE** `/admin/delete-sub-categories/:id`

> `:id` must be `sub_category_id` (e.g. `SUB-000001`)
> Also permanently deletes image from Cloudinary.

**Success Response** `200`:
```json
{
  "success": true,
  "message": "Sub-category deleted successfully"
}
```

**Error Responses:**
| Status | Message |
|--------|---------|
| 404 | Sub-category not found |
| 500 | Internal server error |

---

### 4.6 Toggle Sub-Category Status
**PATCH** `/admin/sub-categories/:id/toggle-status`

> `:id` must be `sub_category_id` (e.g. `SUB-000001`)

**Success Response** `200`:
```json
{
  "success": true,
  "message": "Sub-category deactivated successfully",
  "data": {
    "sub_category_id": "SUB-000001",
    "isActive": false
  }
}
```

**Error Responses:**
| Status | Message |
|--------|---------|
| 404 | Sub-category not found |
| 500 | Internal server error |

---

## 5. PRODUCT APIs

### 5.1 Create Product
**POST** `/admin/products`

**Request Body (multipart/form-data):**
- `name` (text, required)
- `category` (text, required, Category ObjectId)
- `subCategory` (text, required, SubCategory ObjectId)
- `mrp` (text/number, required)
- `sellPrice` (text/number, required)
- `stockQuantity` (text/number, optional)
- `gstRate` (text/number, optional, default: 0)
- `description` (text, optional)
- `variants` (text, optional, JSON array string e.g. `[{"key":"Size","value":"XL"}]`)
- `image` (file, required, max 1MB main image)
- `images` (file, optional, multiple images up to 10 files, max 1MB each)
- `video` (file, optional, max 3MB video)

**Success Response** `201`:
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "_id": "603d7c588e14cb2a5c4e9766",
    "name": "Classic Denim Jacket",
    "slug": "classic-denim-jacket",
    "category": "603d79f08e14cb2a5c4e9754",
    "subCategory": "603d7a8d8e14cb2a5c4e975c",
    "description": "Premium quality classic denim jacket.",
    "mrp": 1500,
    "sellPrice": 1200,
    "stockQuantity": 100,
    "gstRate": 18,
    "sku": "SKU-000001",
    "image": {
      "url": "https://res.cloudinary.com/thpt8esv/image/upload/v1614634072/products/main_image.png",
      "public_id": "products/main_image"
    },
    "images": [],
    "video": {
      "url": "",
      "public_id": ""
    },
    "variants": [],
    "isActive": true,
    "createdBy": "603d75f28e14cb2a5c4e974e",
    "createdAt": "2026-08-07T14:42:00.000Z",
    "updatedAt": "2026-08-07T14:42:00.000Z"
  }
}
```

**Error Responses:**
| Status | Message |
|--------|---------|
| 400 | Name, Category, Sub-category, MRP, and Selling Price are required |
| 400 | Product main image is required |
| 400 | Selling price cannot be greater than MRP |
| 400 | Sub-category not found or does not belong to the selected Category |
| 404 | Category not found |
| 500 | Failed to upload product media files to Cloudinary / Internal server error |

---

### 5.2 Get All Products
**GET** `/admin/get-products`

> Public endpoint. Page pagination and filtering enabled.
> Prevents N+1 queries by pre-populating `category` and `subCategory` fields in batch queries.

**Query Parameters (optional):**
- `page` (default `1`)
- `limit` (default `10`)
- `search` (searches name, SKU, or description)
- `category` (filter by Category ObjectId)
- `subCategory` (filter by SubCategory ObjectId)
- `status` (`active` or `inactive`)

**Success Response** `200`:
```json
{
  "success": true,
  "data": [
    {
      "_id": "603d7c588e14cb2a5c4e9766",
      "name": "Classic Denim Jacket",
      "slug": "classic-denim-jacket",
      "category": {
        "_id": "603d79f08e14cb2a5c4e9754",
        "category_id": "CAT-000001",
        "name": "Apparel",
        "slug": "apparel",
        "image": {
          "url": "https://res.cloudinary.com/thpt8esv/image/upload/v1614634000/categories/apparel.jpg",
          "public_id": "categories/apparel"
        }
      },
      "subCategory": {
        "_id": "603d7a8d8e14cb2a5c4e975c",
        "sub_category_id": "SUB-000001",
        "name": "Jackets",
        "slug": "jackets",
        "image": {
          "url": "https://res.cloudinary.com/thpt8esv/image/upload/v1614634010/subcategories/jackets.jpg",
          "public_id": "subcategories/jackets"
        }
      },
      "description": "Premium quality classic denim jacket.",
      "mrp": 1500,
      "sellPrice": 1200,
      "stockQuantity": 100,
      "sku": "SKU-000001",
      "image": {
        "url": "https://res.cloudinary.com/thpt8esv/image/upload/v1614634072/products/main_image.png",
        "public_id": "products/main_image"
      },
      "images": [],
      "video": {
        "url": "",
        "public_id": ""
      },
      "variants": [],
      "isActive": true,
      "createdAt": "2026-08-07T14:42:00.000Z",
      "updatedAt": "2026-08-07T14:42:00.000Z"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

### 5.3 Get Single Product
**GET** `/admin/single-products/:id`

> `:id` can be either the product's MongoDB `_id` or `sku` (e.g. `SKU-000001`).

**Success Response** `200`:
```json
{
  "success": true,
  "data": {
    "_id": "603d7c588e14cb2a5c4e9766",
    "name": "Classic Denim Jacket",
    "slug": "classic-denim-jacket",
    "category": {
      "_id": "603d79f08e14cb2a5c4e9754",
      "category_id": "CAT-000001",
      "name": "Apparel",
      "slug": "apparel"
    },
    "subCategory": {
      "_id": "603d7a8d8e14cb2a5c4e975c",
      "sub_category_id": "SUB-000001",
      "name": "Jackets",
      "slug": "jackets"
    },
    "description": "Premium quality classic denim jacket.",
    "mrp": 1500,
    "sellPrice": 1200,
    "stockQuantity": 100,
    "sku": "SKU-000001",
    "image": {
      "url": "https://res.cloudinary.com/thpt8esv/image/upload/v1614634072/products/main_image.png",
      "public_id": "products/main_image"
    },
    "images": [],
    "video": {
      "url": "",
      "public_id": ""
    },
    "variants": [],
    "isActive": true,
    "createdBy": {
      "_id": "603d75f28e14cb2a5c4e974e",
      "fullName": "System Admin",
      "email": "admin@example.com",
      "mobile": "9876543210"
    },
    "createdAt": "2026-08-07T14:42:00.000Z",
    "updatedAt": "2026-08-07T14:42:00.000Z"
  }
}
```

**Error Responses:**
| Status | Message |
|--------|---------|
| 404 | Product not found |
| 500 | Internal server error |

---

### 5.4 Update Product
**PUT** `/admin/update-products/:id`

> `:id` can be either the product's MongoDB `_id` or `sku` (e.g. `SKU-000001`).
> Replaces old media files in Cloudinary automatically if new files are uploaded.

**Request Body (multipart/form-data, all optional):**
- `name` (text)
- `category` (text, Category ObjectId)
- `subCategory` (text, SubCategory ObjectId)
- `mrp` (text/number)
- `sellPrice` (text/number)
- `stockQuantity` (text/number)
- `gstRate` (text/number)
- `description` (text)
- `variants` (text, JSON array string)
- `isActive` (text, `"true"` or `"false"`)
- `image` (file, max 1MB main image)
- `images` (file, multiple images up to 10 files, max 1MB each)
- `video` (file, max 3MB video)

**Success Response** `200`:
```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": {
    "_id": "603d7c588e14cb2a5c4e9766",
    "name": "Classic Denim Jacket (Updated)",
    "slug": "classic-denim-jacket-updated",
    "category": "603d79f08e14cb2a5c4e9754",
    "subCategory": "603d7a8d8e14cb2a5c4e975c",
    "mrp": 1600,
    "sellPrice": 1300,
    "stockQuantity": 80,
    "gstRate": 18,
    "sku": "SKU-000001",
    "image": {
      "url": "https://res.cloudinary.com/thpt8esv/image/upload/v1614634072/products/new_main_image.png",
      "public_id": "products/new_main_image"
    },
    "images": [],
    "video": {
      "url": "",
      "public_id": ""
    },
    "variants": [],
    "isActive": true,
    "createdBy": "603d75f28e14cb2a5c4e974e",
    "createdAt": "2026-08-07T14:42:00.000Z",
    "updatedAt": "2026-08-07T14:48:00.000Z"
  }
}
```

**Error Responses:**
| Status | Message |
|--------|---------|
| 400 | Selling price cannot be greater than MRP |
| 400 | Sub-category not found or does not belong to the selected Category |
| 404 | Category not found |
| 404 | Product not found |
| 500 | Failed to upload product media files to Cloudinary during update / Internal server error |

---

### 5.5 Delete Product
**DELETE** `/admin/delete-products/:id`

> `:id` can be either the product's MongoDB `_id` or `sku` (e.g. `SKU-000001`).
> Permanently removes the database record and destroys all associated assets from Cloudinary.

**Success Response** `200`:
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

**Error Responses:**
| Status | Message |
|--------|---------|
| 404 | Product not found |
| 500 | Internal server error |

---

### 5.6 Toggle Product Status
**PATCH** `/admin/products/:id/toggle-status`

> `:id` can be either the product's MongoDB `_id` or `sku` (e.g. `SKU-000001`).

**Success Response** `200`:
```json
{
  "success": true,
  "message": "Product deactivated successfully",
  "data": {
    "sku": "SKU-000001",
    "isActive": false
  }
}
```

**Error Responses:**
| Status | Message |
|--------|---------|
| 404 | Product not found |
| 500 | Internal server error |

---

## 6. CART APIs

Base URL for cart operations: `/api/v1/cart`

- **Guest vs Customer Session Identification:**
  - If authenticated, send `Authorization: Bearer <accessToken>` header.
  - If a guest (not logged in), send `guestId` in request bodies/queries, or in the header as `x-guest-id`.

---

### 6.1 Add To Cart
**POST** `/api/v1/cart/add`

**Request Body (JSON):**
```json
{
  "productId": "603d7c588e14cb2a5c4e9766",
  "quantity": 2,
  "guestId": "guest_session_uuid_123" // required only if not logged in
}
```

**Success Response** `200`:
```json
{
  "success": true,
  "message": "Product added to cart successfully",
  "data": {
    "_id": "603d7e598e14cb2a5c4e9790",
    "customer": "603d75f28e14cb2a5c4e974e",
    "guestId": null,
    "items": [
      {
        "product": {
          "_id": "603d7c588e14cb2a5c4e9766",
          "name": "Classic Denim Jacket",
          "slug": "classic-denim-jacket",
          "mrp": 1500,
          "sellPrice": 1200,
          "image": {
            "url": "https://res.cloudinary.com/thpt8esv/image/upload/v1614634072/products/main_image.png",
            "public_id": "products/main_image"
          },
          "stockQuantity": 100,
          "sku": "SKU-000001",
          "isActive": true
        },
        "quantity": 2,
        "_id": "603d7e598e14cb2a5c4e9791"
      }
    ],
    "createdAt": "2026-08-07T15:10:00.000Z",
    "updatedAt": "2026-08-07T15:12:00.000Z"
  }
}
```

**Error Responses:**
| Status | Message |
|--------|---------|
| 400 | Authorization token or guestId session identifier is required |
| 400 | productId is required |
| 404 | Product not found or inactive |
| 500 | Internal server error |

---

### 6.2 Increase Quantity
**POST** `/api/v1/cart/increase`

> Increases the quantity of a product in the cart by 1. If it does not exist, adds it with quantity 1.

**Request Body (JSON):**
```json
{
  "productId": "603d7c588e14cb2a5c4e9766",
  "guestId": "guest_session_uuid_123" // required only if not logged in
}
```

**Success Response** `200`:
```json
{
  "success": true,
  "message": "Quantity increased successfully",
  "data": { ... }
}
```

---

### 6.3 Decrease Quantity
**POST** `/api/v1/cart/decrease`

> Decreases the quantity of a product in the cart by 1. If quantity reaches 0, removes the product from the cart completely.

**Request Body (JSON):**
```json
{
  "productId": "603d7c588e14cb2a5c4e9766",
  "guestId": "guest_session_uuid_123" // required only if not logged in
}
```

**Success Response** `200`:
```json
{
  "success": true,
  "message": "Quantity decreased successfully",
  "data": { ... }
}
```

---

### 6.4 Remove From Cart
**POST** `/api/v1/cart/remove`

> Removes a product from the cart completely.

**Request Body (JSON):**
```json
{
  "productId": "603d7c588e14cb2a5c4e9766",
  "guestId": "guest_session_uuid_123" // required only if not logged in
}
```

**Success Response** `200`:
```json
{
  "success": true,
  "message": "Product removed from cart successfully",
  "data": { ... }
}
```

---

### 6.5 Get Cart
**GET** `/api/v1/cart/view-cart`

**Headers:**
- `Authorization: Bearer <accessToken>` (Required if customer is logged in)
- `x-guest-id` (Required for guest session if not logged in)

**Query Parameters:**
- `guestId` (Alternative to `x-guest-id` header)

**Success Response** `200`:
```json
{
  "success": true,
  "data": {
    "_id": "603d7e598e14cb2a5c4e9790",
    "customer": "603d75f28e14cb2a5c4e974e",
    "guestId": null,
    "items": [ ... ],
    "createdAt": "2026-08-07T15:10:00.000Z",
    "updatedAt": "2026-08-07T15:12:00.000Z"
  }
}
```

**Error Responses:**
| Status | Message |
|--------|---------|
| 400 | Authorization token or guestId session identifier is required |
| 500 | Internal server error |

---

### 6.6 Merge Cart (Manual)
**POST** `/api/v1/cart/merge`

> Merges guest cart items into customer cart items. (Requires customer auth).

**Request Body (JSON):**
```json
{
  "guestId": "guest_session_uuid_123"
}
```

**Success Response** `200`:
```json
{
  "success": true,
  "message": "Cart merged successfully",
  "data": { ... }
}
```

---

### 6.7 Automatic Cart Merge during Customer Login
**POST** `/auth/customer/verify-otp` (Existing auth route updated)

> Pass `guestId` along with login payload. The backend will automatically merge the guest cart into the customer's permanent cart during authentication.

**Request Body (JSON):**
```json
{
  "mobile": "9876543210",
  "otp": "123456",
  "guestId": "guest_session_uuid_123" // optional - triggers automatic cart merge
}
```

---

## 7. ADDRESS APIs

> All routes require: `Authorization: Bearer <accessToken>` (Customer only)

---

### 7.1 Add Address
**POST** `/api/v1/addresses/create-address`

> Note: The recipient `name` and `mobile` are automatically retrieved from the logged-in customer's profile. You do not need to pass them in the request body.

**Request Body (JSON):**
```json
{
  "alternateMobile": "9123456789", // optional
  "addressLine1": "Flat 402, Sunshine Apartment",
  "addressLine2": "Link Road, Andheri West", // optional
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400053",
  "landmark": "Near Infinity Mall", // optional
  "addressType": "Home", // optional: Home | Work | Other, default: Home
  "isDefault": true // optional
}
```

**Success Response** `201`:
```json
{
  "success": true,
  "message": "Address added successfully",
  "data": {
    "_id": "603d7c588e14cb2a5c4e9766",
    "customer": "603d75f28e14cb2a5c4e974e",
    "name": "Ankit Prajapati", // Auto-resolved from profile
    "mobile": "9876543210", // Auto-resolved from profile
    "alternateMobile": "9123456789",
    "addressLine1": "Flat 402, Sunshine Apartment",
    "addressLine2": "Link Road, Andheri West",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400053",
    "landmark": "Near Infinity Mall",
    "addressType": "Home",
    "isDefault": true,
    "createdAt": "2026-08-10T11:00:00.000Z",
    "updatedAt": "2026-08-10T11:00:00.000Z"
  }
}
```

**Error Responses:**
| Status | Message |
|--------|---------|
| 400 | addressLine1, city, state, and pincode are required fields |
| 401 | Access denied. No token provided. / Invalid or expired session token. |
| 404 | Customer profile not found |
| 500 | Internal server error |

---

### 7.2 Get All Addresses
**GET** `/api/v1/addresses/view-address`

**Success Response** `200`:
```json
{
  "success": true,
  "data": [
    {
      "_id": "603d7c588e14cb2a5c4e9766",
      "name": "Ankit Prajapati",
      "mobile": "9876543210",
      "addressLine1": "Flat 402, Sunshine Apartment",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400053",
      "addressType": "Home",
      "isDefault": true
    }
  ]
}
```

---

### 7.3 Get Single Address
**GET** `/api/v1/addresses/single-address/:id`

**Success Response** `200`:
```json
{
  "success": true,
  "data": {
    "_id": "603d7c588e14cb2a5c4e9766",
    "customer": "603d75f28e14cb2a5c4e974e",
    "name": "Ankit Prajapati",
    "mobile": "9876543210",
    "addressLine1": "Flat 402, Sunshine Apartment",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400053",
    "addressType": "Home",
    "isDefault": true
  }
}
```

**Error Responses:**
| Status | Message |
|--------|---------|
| 404 | Address not found |

---

### 7.4 Update Address
**PUT** `/api/v1/addresses/update-address/:id`

**Request Body (JSON):**
Any fields of Address can be updated.

**Success Response** `200`:
```json
{
  "success": true,
  "message": "Address updated successfully",
  "data": {
    "_id": "603d7c588e14cb2a5c4e9766",
    "customer": "603d75f28e14cb2a5c4e974e",
    "name": "Ankit Prajapati",
    "mobile": "9876543210",
    "addressLine1": "Flat 402, Sunshine Apartment",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400053",
    "addressType": "Home",
    "isDefault": true
  }
}
```

---

### 7.5 Delete Address
**DELETE** `/api/v1/addresses/delete-address/:id`

**Success Response** `200`:
```json
{
  "success": true,
  "message": "Address deleted successfully"
}
```

---

## 8. CHECKOUT & ORDER APIs

> Note: All routes require `Authorization: Bearer <accessToken>` (Customer only) except the Razorpay Webhook endpoint.

---

### 8.1 Checkout / Place Order
**POST** `/api/v1/orders/checkout`

**Request Body (JSON):**
```json
{
  "addressId": "603d7c588e14cb2a5c4e9766",
  "paymentMethod": "Online", // COD | Online, default: COD
  "couponCode": "SAVE10" // optional
}
```

**Success Response (COD Payment) `201`:**
```json
{
  "success": true,
  "message": "Order placed successfully",
  "data": {
    "_id": "603d7f998e14cb2a5c4e9799",
    "order_id": "ORD-000001",
    "customer": "603d75f28e14cb2a5c4e974e",
    "items": [
      {
        "product": "603d7c588e14cb2a5c4e9766",
        "name": "Classic Denim Jacket",
        "sellPrice": 1200,
        "mrp": 1500,
        "quantity": 2,
        "_id": "603d7f998e14cb2a5c4e979a"
      }
    ],
    "shippingAddress": {
      "name": "Ankit Prajapati",
      "mobile": "9876543210",
      "addressLine1": "Flat 402, Sunshine Apartment",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400053",
      "addressType": "Home"
    },
    "pricing": {
      "itemsPrice": 2400,
      "couponCode": "SAVE10",
      "couponDiscount": 240,
      "gstAmount": 388.8,
      "shippingPrice": 0,
      "totalPrice": 2548.8
    },
    "paymentInfo": {
      "method": "COD",
      "status": "Pending"
    },
    "orderStatus": "Placed",
    "history": [
      {
        "status": "Placed",
        "message": "Order placed successfully (Cash on Delivery)."
      }
    ],
    "createdAt": "2026-08-10T11:05:00.000Z",
    "updatedAt": "2026-08-10T11:05:00.000Z"
  }
}
```

**Success Response (Online Payment) `201`:**
```json
{
  "success": true,
  "message": "Payment order initiated successfully",
  "razorpayOrder": {
    "id": "order_Ebf456Ghi789Jkl",
    "amount": 254880,
    "currency": "INR",
    "key": "rzp_test_..."
  },
  "data": {
    "_id": "603d7f998e14cb2a5c4e9799",
    "order_id": "ORD-000001",
    "customer": "603d75f28e14cb2a5c4e974e",
    "items": [ ... ],
    "shippingAddress": { ... },
    "pricing": {
      "itemsPrice": 2400,
      "couponCode": "SAVE10",
      "couponDiscount": 240,
      "gstAmount": 388.8,
      "shippingPrice": 0,
      "totalPrice": 2548.8
    },
    "paymentInfo": {
      "method": "Online",
      "status": "Pending",
      "razorpayOrderId": "order_Ebf456Ghi789Jkl"
    },
    "orderStatus": "Pending",
    "history": [
      {
        "status": "Pending",
        "message": "Order initiated. Waiting for online payment verification."
      }
    ],
    "createdAt": "2026-08-10T11:05:00.000Z",
    "updatedAt": "2026-08-10T11:05:00.000Z"
  }
}
```

**Error Responses:**
| Status | Message |
|--------|---------|
| 400 | addressId is required for delivery |
| 400 | Invalid payment method. Supported methods: COD, Online |
| 400 | Your cart is empty. Cannot checkout. |
| 400 | Insufficient stock for product: "Classic Denim Jacket" |
| 404 | Delivery address not found |
| 500 | Failed to initialize payment gateway order. Please try again. |

---

### 8.2 Verify Online Payment
**POST** `/api/v1/orders/verify-payment`

> Verifies the Razorpay payment signature. If valid, confirms the order (places order, clears customer cart, registers coupon usage).

**Request Body (JSON):**
```json
{
  "razorpay_order_id": "order_Ebf456Ghi789Jkl",
  "razorpay_payment_id": "pay_Ebf456Ghi789Jkl",
  "razorpay_signature": "abcdef1234567890..."
}
```

**Success Response `200`:**
```json
{
  "success": true,
  "message": "Payment verified and order placed successfully",
  "data": {
    "_id": "603d7f998e14cb2a5c4e9799",
    "order_id": "ORD-000001",
    "orderStatus": "Placed",
    "paymentInfo": {
      "method": "Online",
      "status": "Paid",
      "transactionId": "pay_Ebf456Ghi789Jkl",
      "razorpayOrderId": "order_Ebf456Ghi789Jkl",
      "razorpayPaymentId": "pay_Ebf456Ghi789Jkl",
      "razorpaySignature": "abcdef1234567890..."
    }
  }
}
```

**Error Responses:**
| Status | Message |
|--------|---------|
| 400 | razorpay_order_id, razorpay_payment_id, and razorpay_signature are required fields |
| 400 | Payment verification failed. Invalid signature. |
| 404 | Pending order not found for this payment |

---

### 8.3 Razorpay Webhook Handler
**POST** `/api/v1/orders/razorpay-webhook`

> Public webhook endpoint called directly by Razorpay to verify payment success in case the client browser crashes.

**Headers:**
- `x-razorpay-signature`: (Razorpay signature header)

**Event Handled:**
- `order.paid`: Automatically transitions order from `"Pending"` to `"Placed"` and payment status to `"Paid"`, clears cart.

**Success Response `200`:**
```json
{
  "success": true
}
```

---

---

### 8.2 Get All Orders (Order History)
**GET** `/api/v1/orders`

**Success Response** `200`:
```json
{
  "success": true,
  "data": [
    {
      "_id": "603d7f998e14cb2a5c4e9799",
      "order_id": "ORD-000001",
      "totalPrice": 2400,
      "orderStatus": "Placed",
      "createdAt": "2026-08-10T11:05:00.000Z"
    }
  ]
}
```

---

### 8.3 Get Single Order
**GET** `/api/v1/orders/:id`

> `:id` can be either the order's MongoDB `_id` or `order_id` (e.g. `ORD-000001`).

**Success Response** `200`:
```json
{
  "success": true,
  "data": {
    "_id": "603d7f998e14cb2a5c4e9799",
    "order_id": "ORD-000001",
    "customer": "603d75f28e14cb2a5c4e974e",
    "items": [
      {
        "product": "603d7c588e14cb2a5c4e9766",
        "name": "Classic Denim Jacket",
        "sellPrice": 1200,
        "mrp": 1500,
        "quantity": 2,
        "_id": "603d7f998e14cb2a5c4e979a"
      }
    ],
    "shippingAddress": {
      "name": "Ankit Prajapati",
      "mobile": "9876543210",
      "addressLine1": "Flat 402, Sunshine Apartment",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400053",
      "addressType": "Home"
    },
    "pricing": {
      "itemsPrice": 2400,
      "shippingPrice": 0,
      "totalPrice": 2400
    },
    "paymentInfo": {
      "method": "COD",
      "status": "Pending"
    },
    "orderStatus": "Placed",
    "createdAt": "2026-08-10T11:05:00.000Z"
  }
}

---

## 9. COUPON APIs

Base URL for coupon operations: `/api/v1/coupons`

### 9.1 Create Coupon (Admin Only)
**POST** `/api/v1/coupons/admin`

> Requires `Authorization: Bearer <adminToken>`

**Request Body (JSON):**
```json
{
  "code": "SAVE10",
  "discountType": "Percentage", // Percentage | Flat
  "discountValue": 10,
  "minPurchaseAmount": 500, // optional, default 0
  "maxDiscountAmount": 200, // optional, default null
  "startDate": "2026-08-10T00:00:00.000Z", // optional, default Date.now
  "expiryDate": "2026-08-20T23:59:59.000Z",
  "usageLimit": 100, // optional, default null (unlimited)
  "isActive": true // optional, default true
}
```

**Success Response** `201`:
```json
{
  "success": true,
  "message": "Coupon created successfully",
  "data": {
    "_id": "603d8f118e14cb2a5c4e9801",
    "code": "SAVE10",
    "discountType": "Percentage",
    "discountValue": 10,
    "minPurchaseAmount": 500,
    "maxDiscountAmount": 200,
    "startDate": "2026-08-10T00:00:00.000Z",
    "expiryDate": "2026-08-20T23:59:59.000Z",
    "usageLimit": 100,
    "usedCount": 0,
    "isActive": true,
    "createdAt": "2026-08-10T14:40:00.000Z",
    "updatedAt": "2026-08-10T14:40:00.000Z"
  }
}
```

---

### 9.2 Get All Coupons (Admin Only)
**GET** `/api/v1/coupons/admin`

> Requires `Authorization: Bearer <adminToken>`
> Query Parameters: `page` (default 1), `limit` (default 10), `search` (filter by code)

---

### 9.3 Get Coupon Details (Admin Only)
**GET** `/api/v1/coupons/admin/:id`

> Requires `Authorization: Bearer <adminToken>`

---

### 9.4 Update Coupon (Admin Only)
**PUT** `/api/v1/coupons/admin/:id`

> Requires `Authorization: Bearer <adminToken>`
> Request body has the same optional fields as Create Coupon.

---

### 9.5 Delete Coupon (Admin Only)
**DELETE** `/api/v1/coupons/admin/:id`

---

### 9.6 Toggle Coupon Status (Admin Only)
**PATCH** `/api/v1/coupons/admin/:id/toggle-status`

---

### 9.7 Apply Coupon / Preview Calculations (Customer)
**POST** `/api/v1/coupons/apply`

> Requires `Authorization: Bearer <customerToken>`
> Simulates coupon validation and returns post-discount/GST breakdown for current cart contents.

**Request Body (JSON):**
```json
{
  "couponCode": "SAVE10"
}
```

**Success Response** `200`:
```json
{
  "success": true,
  "message": "Coupon applied successfully",
  "data": {
    "pricing": {
      "itemsPrice": 1200,
      "couponCode": "SAVE10",
      "couponDiscount": 120,
      "gstAmount": 194.4,
      "shippingPrice": 0,
      "totalPrice": 1274.4
    }
  }
}
```

**Error Response** `400`:
```json
{
  "success": false,
  "message": "Minimum purchase amount of Rs 500 is required to apply this coupon"
}
```

---

## 13. WALLET APIs (Customer)

### 13.1 Get Wallet Balance
**GET** `/wallet/balance`
> **Headers:** `Authorization: Bearer <customer_token>`

**Success Response** `200`:ac
```json
{
  "success": true,
  "data": {
    "balance": 500,
    "transactions": []
  }
}
```

### 13.2 Initialize Top-up
**POST** `/wallet/topup`
> **Headers:** `Authorization: Bearer <customer_token>`

**Request Body:**
```json
{ "amount": 500 }
```

### 13.3 Verify Top-up
**POST** `/wallet/verify-topup`
**Request Body:**
```json
{
  "razorpay_order_id": "order_...",
  "razorpay_payment_id": "pay_...",
  "razorpay_signature": "...",
  "amount": 500
}
```

---

## 14. ORDER RETURNS & QC APIs

### 14.1 Request Return (Customer)
**PUT** `/orders/:id/request-return`
> **Headers:** `Authorization: Bearer <customer_token>`

**Request Body:**
```json
{ "reason": "Item defective" }
```

### 14.2 Approve Return (Admin/Staff)
**PUT** `/admin/orders/:id/approve-return`

### 14.3 Mark Returned (Agent)
**PUT** `/admin/orders/:id/mark-returned`

### 14.4 QC Check & Refund (Warehouse Manager)
**PUT** `/admin/orders/:id/qc-check`
> **Headers:** `Authorization: Bearer <admin_or_staff_token>`

**Request Body:**
```json
{ 
  "isPassed": true, 
  "comments": "Item intact, eligible for refund" 
}
```

---

## 15. ADMIN ANALYTICS & CUSTOMERS

### 15.1 Admin Dashboard (Papa Boss View)
**GET** `/admin/dashboard`
> **Headers:** `Authorization: Bearer <admin_token>`

**Success Response:** Returns `systemStats` and `warehouseAnalytics`.

### 15.2 Get All Customers
**GET** `/admin/customers`

### 15.3 Get Single Customer (360° Profile)
**GET** `/admin/customers/:id`
**Returns:** Profile, Orders, Addresses, Wallet Transactions.

### 15.4 Suspend/Unsuspend Customer
**PATCH** `/admin/customers/:id/toggle-status`
