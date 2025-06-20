# Product API Documentation

## Overview

This document provides comprehensive API documentation for the Product Management endpoints in the Supermarket Warehouse system. These endpoints handle all product-related operations including CRUD operations, search, and inventory management.

## Base URL

```
/api/inventory/products
```

## Authentication

All endpoints support CORS with origin "\*" and max age 3600 seconds.

---

## Endpoints

### 1. Get All Products (Paginated)

**GET** `/api/inventory/products`

Retrieves a paginated list of all products with their category information.

#### Request Parameters

| Parameter | Type    | Required | Description                                      |
| --------- | ------- | -------- | ------------------------------------------------ |
| page      | integer | No       | Page number (0-based, default: 0)                |
| size      | integer | No       | Page size (default: 20)                          |
| sort      | string  | No       | Sort criteria (e.g., "name,asc" or "price,desc") |

#### Example Request

```http
GET /api/inventory/products?page=0&size=10&sort=name,asc
```

#### Response (200 OK)

```json
{
  "content": [
    {
      "id": 1,
      "name": "Apple iPhone 14",
      "description": "Latest iPhone model",
      "price": 999.99,
      "currentStock": 50,
      "minStockLevel": 10,
      "maxStockLevel": 100,
      "categoryId": 2,
      "categoryName": "Electronics",
      "version": 1
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 10,
    "sort": {
      "sorted": true,
      "orders": [
        {
          "property": "name",
          "direction": "ASC"
        }
      ]
    }
  },
  "totalElements": 150,
  "totalPages": 15,
  "first": true,
  "last": false,
  "numberOfElements": 10
}
```

---

### 2. Get Product by ID

**GET** `/api/inventory/products/{id}`

Retrieves a specific product by its ID.

#### Path Parameters

| Parameter | Type | Required | Description |
| --------- | ---- | -------- | ----------- |
| id        | long | Yes      | Product ID  |

#### Example Request

```http
GET /api/inventory/products/1
```

#### Response (200 OK)

```json
{
  "id": 1,
  "name": "Apple iPhone 14",
  "description": "Latest iPhone model",
  "price": 999.99,
  "currentStock": 50,
  "minStockLevel": 10,
  "maxStockLevel": 100,
  "categoryId": 2,
  "categoryName": "Electronics",
  "version": 1
}
```

#### Response (404 Not Found)

```json
{
  "error": "Product not found"
}
```

---

### 3. Get Product with Category

**GET** `/api/inventory/products/{id}/with-category`

Retrieves a specific product with full category information.

#### Path Parameters

| Parameter | Type | Required | Description |
| --------- | ---- | -------- | ----------- |
| id        | long | Yes      | Product ID  |

#### Example Request

```http
GET /api/inventory/products/1/with-category
```

#### Response (200 OK)

```json
{
  "id": 1,
  "name": "Apple iPhone 14",
  "description": "Latest iPhone model",
  "price": 999.99,
  "currentStock": 50,
  "minStockLevel": 10,
  "maxStockLevel": 100,
  "categoryId": 2,
  "categoryName": "Electronics",
  "version": 1
}
```

---

### 4. Create New Product

**POST** `/api/inventory/products`

Creates a new product in the system.

#### Request Body

```json
{
  "name": "Samsung Galaxy S24",
  "description": "Latest Samsung smartphone",
  "price": 899.99,
  "currentStock": 30,
  "minStockLevel": 5,
  "maxStockLevel": 80,
  "categoryId": 2
}
```

#### Request Body Validation

| Field         | Type    | Required | Constraints                |
| ------------- | ------- | -------- | -------------------------- |
| name          | string  | Yes      | Not null, not empty        |
| description   | string  | No       | Maximum length varies      |
| price         | decimal | Yes      | Positive value             |
| currentStock  | integer | Yes      | Non-negative               |
| minStockLevel | integer | Yes      | Non-negative               |
| maxStockLevel | integer | Yes      | Greater than minStockLevel |
| categoryId    | long    | Yes      | Valid category ID          |

#### Example Request

```http
POST /api/inventory/products
Content-Type: application/json

{
  "name": "Samsung Galaxy S24",
  "description": "Latest Samsung smartphone",
  "price": 899.99,
  "currentStock": 30,
  "minStockLevel": 5,
  "maxStockLevel": 80,
  "categoryId": 2
}
```

#### Response (201 Created)

```json
{
  "id": 2,
  "name": "Samsung Galaxy S24",
  "description": "Latest Samsung smartphone",
  "price": 899.99,
  "currentStock": 30,
  "minStockLevel": 5,
  "maxStockLevel": 80,
  "categoryId": 2,
  "categoryName": "Electronics",
  "version": 1
}
```

#### Response (400 Bad Request)

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "name",
      "message": "Name is required"
    }
  ]
}
```

---

### 5. Update Product

**PUT** `/api/inventory/products/{id}`

Updates an existing product. Uses optimistic locking with version control.

#### Path Parameters

| Parameter | Type | Required | Description |
| --------- | ---- | -------- | ----------- |
| id        | long | Yes      | Product ID  |

#### Request Body

```json
{
  "id": 1,
  "name": "Apple iPhone 15",
  "description": "Updated iPhone model",
  "price": 1099.99,
  "currentStock": 45,
  "minStockLevel": 10,
  "maxStockLevel": 100,
  "categoryId": 2,
  "version": 1
}
```

**Important:** The `version` field must match the current version in the database to prevent concurrent modifications.

#### Example Request

```http
PUT /api/inventory/products/1
Content-Type: application/json

{
  "id": 1,
  "name": "Apple iPhone 15",
  "description": "Updated iPhone model",
  "price": 1099.99,
  "currentStock": 45,
  "minStockLevel": 10,
  "maxStockLevel": 100,
  "categoryId": 2,
  "version": 1
}
```

#### Response (200 OK)

```json
{
  "id": 1,
  "name": "Apple iPhone 15",
  "description": "Updated iPhone model",
  "price": 1099.99,
  "currentStock": 45,
  "minStockLevel": 10,
  "maxStockLevel": 100,
  "categoryId": 2,
  "categoryName": "Electronics",
  "version": 2
}
```

#### Response (409 Conflict)

```json
{
  "error": "Optimistic locking failure - version mismatch"
}
```

---

### 6. Delete Product

**DELETE** `/api/inventory/products/{id}`

Deletes a product from the system. Cannot delete products with remaining stock.

#### Path Parameters

| Parameter | Type | Required | Description |
| --------- | ---- | -------- | ----------- |
| id        | long | Yes      | Product ID  |

#### Example Request

```http
DELETE /api/inventory/products/1
```

#### Response (204 No Content)

No response body.

#### Response (400 Bad Request)

```json
{
  "error": "Cannot delete product with remaining stock"
}
```

#### Response (404 Not Found)

```json
{
  "error": "Product not found"
}
```

---

### 7. Search Products

**GET** `/api/inventory/products/search`

Searches products by name or description.

#### Request Parameters

| Parameter | Type    | Required | Description                       |
| --------- | ------- | -------- | --------------------------------- |
| query     | string  | Yes      | Search term                       |
| page      | integer | No       | Page number (0-based, default: 0) |
| size      | integer | No       | Page size (default: 20)           |
| sort      | string  | No       | Sort criteria                     |

#### Example Request

```http
GET /api/inventory/products/search?query=iPhone&page=0&size=10
```

#### Response (200 OK)

```json
{
  "content": [
    {
      "id": 1,
      "name": "Apple iPhone 14",
      "description": "Latest iPhone model",
      "price": 999.99,
      "currentStock": 50,
      "minStockLevel": 10,
      "maxStockLevel": 100,
      "categoryId": 2,
      "categoryName": "Electronics",
      "version": 1
    }
  ],
  "totalElements": 1,
  "totalPages": 1,
  "first": true,
  "last": true
}
```

---

### 8. Get Products by Price Range

**GET** `/api/inventory/products/price-range`

Retrieves products within a specific price range.

#### Request Parameters

| Parameter | Type    | Required | Description   |
| --------- | ------- | -------- | ------------- |
| minPrice  | decimal | Yes      | Minimum price |
| maxPrice  | decimal | Yes      | Maximum price |

#### Example Request

```http
GET /api/inventory/products/price-range?minPrice=500.00&maxPrice=1500.00
```

#### Response (200 OK)

```json
[
  {
    "id": 1,
    "name": "Apple iPhone 14",
    "description": "Latest iPhone model",
    "price": 999.99,
    "currentStock": 50,
    "minStockLevel": 10,
    "maxStockLevel": 100,
    "categoryId": 2,
    "categoryName": "Electronics",
    "version": 1
  }
]
```

---

### 9. Update Product Price

**PATCH** `/api/inventory/products/{id}/price`

Updates only the price of a specific product.

#### Path Parameters

| Parameter | Type | Required | Description |
| --------- | ---- | -------- | ----------- |
| id        | long | Yes      | Product ID  |

#### Request Parameters

| Parameter | Type    | Required | Description |
| --------- | ------- | -------- | ----------- |
| price     | decimal | Yes      | New price   |

#### Example Request

```http
PATCH /api/inventory/products/1/price?price=1199.99
```

#### Response (200 OK)

No response body.

---

### 10. Update Stock Configuration

**PUT** `/api/inventory/products/{id}/stock-config`

Updates the stock configuration (min/max levels) for a product.

#### Path Parameters

| Parameter | Type | Required | Description |
| --------- | ---- | -------- | ----------- |
| id        | long | Yes      | Product ID  |

#### Request Body

```json
{
  "minStockLevel": 15,
  "maxStockLevel": 120
}
```

#### Example Request

```http
PUT /api/inventory/products/1/stock-config
Content-Type: application/json

{
  "minStockLevel": 15,
  "maxStockLevel": 120
}
```

#### Response (200 OK)

```json
{
  "id": 1,
  "name": "Apple iPhone 14",
  "description": "Latest iPhone model",
  "price": 999.99,
  "currentStock": 50,
  "minStockLevel": 15,
  "maxStockLevel": 120,
  "categoryId": 2,
  "categoryName": "Electronics",
  "version": 2
}
```

---

### 11. Update Product Stock

**PATCH** `/api/inventory/products/{id}/stock`

Updates the current stock level of a product.

#### Path Parameters

| Parameter | Type | Required | Description |
| --------- | ---- | -------- | ----------- |
| id        | long | Yes      | Product ID  |

#### Request Parameters

| Parameter   | Type    | Required | Description                                |
| ----------- | ------- | -------- | ------------------------------------------ |
| stockChange | integer | Yes      | Stock change amount (positive or negative) |

#### Example Request

```http
PATCH /api/inventory/products/1/stock?stockChange=10
```

#### Response (200 OK)

No response body.

---

### 12. Get Product Count

**GET** `/api/inventory/products/count`

Returns the total number of products in the system.

#### Example Request

```http
GET /api/inventory/products/count
```

#### Response (200 OK)

```json
150
```

---

### 13. Check Product Existence

**GET** `/api/inventory/products/{id}/exists`

Checks if a product exists in the system.

#### Path Parameters

| Parameter | Type | Required | Description |
| --------- | ---- | -------- | ----------- |
| id        | long | Yes      | Product ID  |

#### Example Request

```http
GET /api/inventory/products/1/exists
```

#### Response (200 OK)

```json
true
```

---

### 14. Get Active Products

**GET** `/api/inventory/products/active`

Retrieves all active products (currently returns all products as the active/inactive status is not implemented).

#### Request Parameters

| Parameter | Type    | Required | Description                       |
| --------- | ------- | -------- | --------------------------------- |
| page      | integer | No       | Page number (0-based, default: 0) |
| size      | integer | No       | Page size (default: 20)           |
| sort      | string  | No       | Sort criteria                     |

#### Example Request

```http
GET /api/inventory/products/active?page=0&size=10
```

#### Response (200 OK)

Same as "Get All Products" response.

---

### 15. Debug Product Existence

**GET** `/api/inventory/products/debug/contains/{productId}`

Debug endpoint to check product existence across different data retrieval methods.

#### Path Parameters

| Parameter | Type | Required | Description         |
| --------- | ---- | -------- | ------------------- |
| productId | long | Yes      | Product ID to debug |

#### Request Parameters

| Parameter | Type    | Required | Description                        |
| --------- | ------- | -------- | ---------------------------------- |
| page      | integer | No       | Page number for current page check |
| size      | integer | No       | Page size for current page check   |

#### Example Request

```http
GET /api/inventory/products/debug/contains/1?page=0&size=10
```

#### Response (200 OK)

```json
{
  "productId": 1,
  "foundInCurrentPage": true,
  "foundInAllProducts": true,
  "currentPageSize": 10,
  "totalProducts": 150,
  "totalPages": 15,
  "currentPageNumber": 0,
  "productExistsById": true,
  "specificProduct": {
    "id": 1,
    "name": "Apple iPhone 14",
    "description": "Latest iPhone model",
    "price": 999.99,
    "currentStock": 50,
    "minStockLevel": 10,
    "maxStockLevel": 100,
    "categoryId": 2,
    "categoryName": "Electronics",
    "version": 1
  }
}
```

---

## Data Models

### ProductDto

```typescript
interface ProductDto {
  id?: number;
  name: string;
  description?: string;
  price: number;
  currentStock: number;
  minStockLevel: number;
  maxStockLevel: number;
  categoryId: number;
  categoryName?: string;
  version?: number;
}
```

### StockConfigDto

```typescript
interface StockConfigDto {
  minStockLevel: number;
  maxStockLevel: number;
}
```

### PageResponse<T>

```typescript
interface PageResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      sorted: boolean;
      orders: {
        property: string;
        direction: "ASC" | "DESC";
      }[];
    };
  };
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
}
```

---

## Error Handling

### Common HTTP Status Codes

- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **204 No Content**: Request successful, no content to return
- **400 Bad Request**: Invalid request data or business rule violation
- **404 Not Found**: Resource not found
- **409 Conflict**: Optimistic locking failure or concurrent modification

### Error Response Format

```json
{
  "error": "Error message description",
  "details": [
    {
      "field": "fieldName",
      "message": "Field-specific error message"
    }
  ]
}
```

---

## Frontend Implementation Notes

1. **Pagination**: Use the `pageable` parameters for implementing pagination controls.
2. **Optimistic Locking**: Always include the `version` field when updating products to prevent concurrent modifications.
3. **Stock Management**: Use the dedicated stock endpoints for inventory operations rather than full product updates.
4. **Search**: Implement debounced search to avoid excessive API calls.
5. **Error Handling**: Implement proper error handling for all status codes, especially for business rule violations.
6. **Loading States**: Show loading indicators during API calls, especially for paginated requests.

---

## Example Frontend Implementation (JavaScript/TypeScript)

```typescript
// Example API service class
class ProductApiService {
  private baseUrl = "/api/inventory/products";

  async getAllProducts(
    page = 0,
    size = 20,
    sort?: string
  ): Promise<PageResponse<ProductDto>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      ...(sort && { sort }),
    });

    const response = await fetch(`${this.baseUrl}?${params}`);
    return response.json();
  }

  async createProduct(
    product: Omit<ProductDto, "id" | "categoryName" | "version">
  ): Promise<ProductDto> {
    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async updateProduct(id: number, product: ProductDto): Promise<ProductDto> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    });

    if (response.status === 409) {
      throw new Error(
        "Product was modified by another user. Please refresh and try again."
      );
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async deleteProduct(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: "DELETE",
    });

    if (response.status === 400) {
      const error = await response.json();
      throw new Error(error.error);
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }
}
```

This documentation provides complete information for frontend developers to integrate with the Product API endpoints effectively.
