### 1. Product Controller - Get All Products

**Endpoint:** `GET /api/inventory/products`

**Purpose:** Retrieve comprehensive product information including categories and pricing.

**Parameters:**

- `page` (optional): Page number (default: 0)
- `size` (optional): Items per page (default: 20)
- `sort` (optional): Sort criteria

**Sample Request:**

```http
GET /api/inventory/products?page=0&size=50&sort=name,asc
Accept: application/json
```

**Sample Response:**

```json
{
  "content": [
    {
      "id": 1,
      "name": "Premium Coffee Beans",
      "sku": "COF-001",
      "description": "High-quality arabica coffee beans",
      "price": 15.99,
      "unit": "kg",
      "category": {
        "id": 5,
        "name": "Beverages",
        "description": "Coffee, tea, and other beverages"
      },
      "reorderLevel": 10,
      "maxStock": 100,
      "version": 1
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 50
  },
  "totalElements": 150,
  "totalPages": 3,
  "first": true,
  "last": false
}
```

### 2. Stock Controller - Get All Product Stocks

**Endpoint:** `GET /api/inventory/stock/all`

**Purpose:** Retrieve current stock levels for all products.

**Sample Request:**

```http
GET /api/inventory/stock/all
Accept: application/json
```

**Sample Response:**

```json
{
  "success": true,
  "message": "Product stocks retrieved successfully",
  "data": [
    {
      "productId": 1,
      "productName": "Premium Coffee Beans",
      "sku": "COF-001",
      "currentStock": 8.5,
      "unit": "kg"
    },
    {
      "productId": 2,
      "productName": "Organic Tea Leaves",
      "sku": "TEA-001",
      "currentStock": 25.0,
      "unit": "kg"
    }
  ]
}