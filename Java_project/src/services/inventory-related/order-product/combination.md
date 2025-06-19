# Manual Product Ordering - Frontend API Integration Guide

## Overview

This document provides frontend developers with a comprehensive guide to integrate multiple APIs for building a manual product ordering interface. The solution combines data from Product Controller, Stock Controller, and Party Controller to provide a complete view of products, their current stock levels, and available suppliers.

## Purpose

Enable manual product ordering workflow by combining:

- **Product information** (details, pricing, categories)
- **Current stock levels** (inventory quantities)
- **Supplier information** (vendor details for ordering)

This allows procurement staff to manually review inventory and place orders without relying on automated low-stock alerts.

## Required API Endpoints

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
```

### 3. Party Controller - Get Suppliers

**Endpoint:** `GET /api/parties/type/SUPPLIER`

**Purpose:** Retrieve all suppliers for order placement.

**Sample Request:**

```http
GET /api/parties/type/SUPPLIER
Accept: application/json
```

**Sample Response:**

```json
[
  {
    "id": 1,
    "name": "Global Coffee Suppliers Ltd",
    "type": "SUPPLIER",
    "contactPerson": "John Smith",
    "email": "orders@globalcoffee.com",
    "phone": "+1-555-0123",
    "address": "123 Business District, City, State 12345",
    "taxId": "TAX123456789",
    "active": true
  },
  {
    "id": 2,
    "name": "Fresh Foods Wholesale",
    "type": "SUPPLIER",
    "contactPerson": "Maria Garcia",
    "email": "procurement@freshfoods.com",
    "phone": "+1-555-0456",
    "address": "456 Industrial Ave, City, State 54321",
    "taxId": "TAX987654321",
    "active": true
  }
]
```

## Data Integration Strategy

### 1. Combining Product and Stock Data

**Approach:** Merge products with their current stock levels using productId as the key.

**Implementation Example (JavaScript):**

```javascript
async function getCombinedProductStockData() {
  try {
    // Fetch products and stock data in parallel
    const [productsResponse, stockResponse] = await Promise.all([
      fetch("/api/inventory/products?size=1000"), // Get all products
      fetch("/api/inventory/stock/all"),
    ]);

    const productsData = await productsResponse.json();
    const stockData = await stockResponse.json();

    // Create a map of stock levels by product ID
    const stockMap = new Map();
    stockData.data.forEach((stock) => {
      stockMap.set(stock.productId, stock);
    });

    // Combine product data with stock information
    const combinedData = productsData.content.map((product) => ({
      ...product,
      currentStock: stockMap.get(product.id)?.currentStock || 0,
      stockInfo: stockMap.get(product.id) || null,
      // Calculate stock status
      stockStatus: calculateStockStatus(
        stockMap.get(product.id)?.currentStock || 0,
        product.reorderLevel,
        product.maxStock
      ),
    }));

    return combinedData;
  } catch (error) {
    console.error("Error fetching combined data:", error);
    throw error;
  }
}

function calculateStockStatus(currentStock, reorderLevel, maxStock) {
  if (currentStock <= 0) return "OUT_OF_STOCK";
  if (currentStock <= reorderLevel) return "LOW_STOCK";
  if (currentStock >= maxStock * 0.9) return "OVERSTOCKED";
  return "NORMAL";
}
```

### 2. Supplier Data Integration

**Implementation Example:**

```javascript
async function getSuppliersData() {
  try {
    const response = await fetch("/api/parties/type/SUPPLIER");
    const suppliers = await response.json();

    // Filter only active suppliers
    return suppliers.filter((supplier) => supplier.active);
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    throw error;
  }
}
```

## Complete Integration Example

### React Component Example

```javascript
import React, { useState, useEffect } from "react";

const ManualOrderingInterface = () => {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load combined product and stock data
      const combinedData = await getCombinedProductStockData();
      const suppliersData = await getSuppliersData();

      setProducts(combinedData);
      setSuppliers(suppliersData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const addToOrder = (product, quantity, supplierId) => {
    const orderItem = {
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      currentStock: product.currentStock,
      orderQuantity: quantity,
      supplierId: supplierId,
      estimatedCost: product.price * quantity,
    };

    setSelectedItems((prev) => [...prev, orderItem]);
  };

  const getStockStatusColor = (status) => {
    switch (status) {
      case "OUT_OF_STOCK":
        return "red";
      case "LOW_STOCK":
        return "orange";
      case "OVERSTOCKED":
        return "blue";
      default:
        return "green";
    }
  };

  if (loading) return <div>Loading products and stock data...</div>;

  return (
    <div>
      <h1>Manual Product Ordering</h1>

      <div className="products-grid">
        {products.map((product) => (
          <div key={product.id} className="product-card">
            <h3>{product.name}</h3>
            <p>SKU: {product.sku}</p>
            <p>
              Current Stock: {product.currentStock} {product.unit}
            </p>
            <p>
              Reorder Level: {product.reorderLevel} {product.unit}
            </p>
            <div
              className="stock-status"
              style={{ color: getStockStatusColor(product.stockStatus) }}
            >
              Status: {product.stockStatus}
            </div>

            <div className="order-section">
              <h4>Place Order</h4>
              <input type="number" placeholder="Quantity" min="1" />
              <select>
                <option value="">Select Supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
              <button onClick={() => addToOrder(product, quantity, supplierId)}>
                Add to Order
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="order-summary">
        <h2>Order Summary</h2>
        {selectedItems.map((item, index) => (
          <div key={index} className="order-item">
            <span>{item.productName}</span>
            <span>Qty: {item.orderQuantity}</span>
            <span>Est. Cost: ${item.estimatedCost}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
```

## Advanced Features

### 1. Filtering and Sorting Products

```javascript
const filterProducts = (products, filters) => {
  return products.filter((product) => {
    // Filter by stock status
    if (filters.stockStatus && product.stockStatus !== filters.stockStatus) {
      return false;
    }

    // Filter by category
    if (filters.categoryId && product.category.id !== filters.categoryId) {
      return false;
    }

    // Filter by low stock only
    if (filters.lowStockOnly && product.stockStatus !== "LOW_STOCK") {
      return false;
    }

    return true;
  });
};

const sortProducts = (products, sortBy) => {
  return [...products].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "stock_asc":
        return a.currentStock - b.currentStock;
      case "stock_desc":
        return b.currentStock - a.currentStock;
      case "reorder_priority":
        // Sort by how close to reorder level
        const aPriority = a.reorderLevel - a.currentStock;
        const bPriority = b.reorderLevel - b.currentStock;
        return bPriority - aPriority;
      default:
        return 0;
    }
  });
};
```

### 2. Bulk Order Creation

```javascript
const createBulkOrder = async (orderItems, supplierId) => {
  try {
    const orderData = {
      supplierId: supplierId,
      orderDate: new Date().toISOString(),
      items: orderItems.map((item) => ({
        productId: item.productId,
        quantity: item.orderQuantity,
        unitPrice: item.product.price,
      })),
      notes: "Manual order created from inventory review",
    };

    const response = await fetch("/api/purchase-orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      throw new Error("Failed to create order");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating bulk order:", error);
    throw error;
  }
};
```

## Error Handling

### Common Error Scenarios

1. **API Unavailability**

```javascript
const handleApiError = (error, apiName) => {
  console.error(`${apiName} API Error:`, error);

  if (error.name === "TypeError" && error.message.includes("fetch")) {
    return {
      type: "NETWORK_ERROR",
      message: `Unable to connect to ${apiName}. Please check your connection.`,
    };
  }

  if (error.status === 404) {
    return {
      type: "NOT_FOUND",
      message: `${apiName} endpoint not found.`,
    };
  }

  return {
    type: "UNKNOWN_ERROR",
    message: `An error occurred while fetching ${apiName} data.`,
  };
};
```

2. **Data Inconsistency**

```javascript
const validateDataConsistency = (products, stocks) => {
  const issues = [];

  // Check for products without stock data
  const stockIds = new Set(stocks.map((s) => s.productId));
  const missingStock = products.filter((p) => !stockIds.has(p.id));

  if (missingStock.length > 0) {
    issues.push({
      type: "MISSING_STOCK_DATA",
      count: missingStock.length,
      products: missingStock.map((p) => ({ id: p.id, name: p.name })),
    });
  }

  return issues;
};
```

## Performance Considerations

### 1. Data Caching Strategy

```javascript
class ProductStockCache {
  constructor(cacheTimeout = 5 * 60 * 1000) {
    // 5 minutes
    this.cache = new Map();
    this.cacheTimeout = cacheTimeout;
  }

  async get(key, fetcher) {
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const data = await fetcher();
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });

    return data;
  }

  clear() {
    this.cache.clear();
  }
}

const cache = new ProductStockCache();

// Usage
const getCachedProductData = () => {
  return cache.get("combined-product-stock", getCombinedProductStockData);
};
```

### 2. Pagination for Large Datasets

```javascript
const getAllProductsPaginated = async () => {
  let allProducts = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(
      `/api/inventory/products?page=${page}&size=100`
    );
    const data = await response.json();

    allProducts.push(...data.content);
    hasMore = !data.last;
    page++;
  }

  return allProducts;
};
```

## UI/UX Best Practices

### 1. Loading States

- Show skeleton loaders while fetching data
- Display progress indicators for bulk operations
- Provide clear feedback during order creation

### 2. Data Visualization

- Use color coding for stock status (red=out, orange=low, green=normal)
- Display stock levels as progress bars
- Highlight products requiring urgent attention

### 3. User Experience

- Enable bulk selection for multiple products
- Provide quick filters (low stock, category, supplier)
- Include search functionality for large product catalogs
- Save draft orders for later completion

## Security Considerations

1. **API Authentication**: Ensure all API calls include proper authentication tokens
2. **Input Validation**: Validate order quantities and supplier selections
3. **Permission Checks**: Verify user has ordering permissions before allowing order creation
4. **Audit Trail**: Log all manual ordering activities for compliance

## Testing Strategies

### Unit Tests

```javascript
describe("Product Stock Integration", () => {
  test("should combine product and stock data correctly", () => {
    const products = [{ id: 1, name: "Test Product", reorderLevel: 10 }];
    const stocks = [{ productId: 1, currentStock: 5 }];

    const combined = combineProductStock(products, stocks);

    expect(combined[0].stockStatus).toBe("LOW_STOCK");
  });
});
```

### Integration Tests

```javascript
describe("API Integration", () => {
  test("should fetch all required data successfully", async () => {
    const data = await getCombinedProductStockData();
    expect(data).toBeDefined();
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty("currentStock");
  });
});
```

## Conclusion

This integration guide provides a complete solution for building a manual product ordering interface by combining Product, Stock, and Party APIs. The approach ensures data consistency, provides a smooth user experience, and includes proper error handling and performance optimizations.

Key benefits:

- **Complete visibility** into product details and current stock levels
- **Supplier integration** for streamlined order placement
- **Flexible filtering and sorting** for efficient inventory management
- **Scalable architecture** supporting large product catalogs
- **Error resilience** with proper fallback mechanisms

For additional features or customizations, refer to the individual API documentation for each controller.
