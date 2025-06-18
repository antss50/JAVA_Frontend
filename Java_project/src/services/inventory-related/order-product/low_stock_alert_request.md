# Inventory Alerts API Documentation

## Overview

This document describes the Inventory Alerts API endpoints that provide low stock information to assist with purchase order creation in the AP (Accounts Payable) module.

## Base URL

```
http://localhost:8080/api/inventory/alerts
```

## Authentication

- No authentication required for these endpoints
- CORS is enabled for all origins

## Endpoints

### 1. Get Low Stock Alerts

**Endpoint:** `GET /low-stock`

**Description:**
Returns a list of products whose current stock level is at or below their configured reorder level. This endpoint is primarily used by the AP module to identify products that need to be restocked through purchase orders.

**Request Parameters:** None

**Request Headers:**

```
Content-Type: application/json
Accept: application/json
```

**Request Example:**

```http
GET /api/inventory/alerts/low-stock HTTP/1.1
Host: localhost:8080
Content-Type: application/json
Accept: application/json
```

**Response Format:**

**Success Response (HTTP 200):**

```json
[
  {
    "productId": 1,
    "productName": "Rice 25kg Bag",
    "unit": "bag",
    "reorderLevel": 10.0,
    "currentStock": 5.0
  },
  {
    "productId": 2,
    "productName": "Cooking Oil 1L",
    "unit": "bottle",
    "reorderLevel": 20.0,
    "currentStock": 15.0
  },
  {
    "productId": 3,
    "productName": "Sugar 1kg",
    "unit": "kg",
    "reorderLevel": 50.0,
    "currentStock": 25.0
  }
]
```

**Response Fields:**

| Field          | Type       | Description                                                |
| -------------- | ---------- | ---------------------------------------------------------- |
| `productId`    | Long       | Unique identifier for the product                          |
| `productName`  | String     | Name of the product                                        |
| `unit`         | String     | Unit of measurement (e.g., "kg", "piece", "bottle", "bag") |
| `reorderLevel` | BigDecimal | The minimum stock level that triggers a reorder alert      |
| `currentStock` | BigDecimal | Current available stock quantity                           |

**Empty Response (HTTP 200):**

```json
[]
```

**Error Responses:**

**Internal Server Error (HTTP 500):**

```json
{
  "timestamp": "2025-06-17T10:30:00.000+00:00",
  "status": 500,
  "error": "Internal Server Error",
  "message": "Database connection failed",
  "path": "/api/inventory/alerts/low-stock"
}
```

## Integration with AP Module

### Purpose

This API is specifically designed to support the AP module's purchase order creation workflow. The low stock alerts help procurement teams identify which products need to be ordered from suppliers.

### Usage in Purchase Order Creation

1. **Stock Monitoring:** The AP module can periodically call this endpoint to monitor inventory levels
2. **Purchase Order Generation:** Use the returned product information to create purchase orders
3. **Supplier Selection:** The `productId` can be used to look up supplier information for each product
4. **Quantity Calculation:** The difference between `reorderLevel` and `currentStock` indicates the minimum quantity needed

### Frontend Implementation Examples

**JavaScript/TypeScript:**

```javascript
// Fetch low stock alerts
async function getLowStockAlerts() {
  try {
    const response = await fetch("/api/inventory/alerts/low-stock", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const alerts = await response.json();
    return alerts;
  } catch (error) {
    console.error("Error fetching low stock alerts:", error);
    throw error;
  }
}

// Calculate suggested order quantity
function calculateOrderQuantity(alert) {
  const deficit = alert.reorderLevel - alert.currentStock;
  // Add 50% buffer to prevent frequent reorders
  return Math.ceil(deficit * 1.5);
}

// Usage example
getLowStockAlerts().then((alerts) => {
  alerts.forEach((alert) => {
    console.log(`Product: ${alert.productName}`);
    console.log(`Current Stock: ${alert.currentStock} ${alert.unit}`);
    console.log(`Reorder Level: ${alert.reorderLevel} ${alert.unit}`);
    console.log(
      `Suggested Order: ${calculateOrderQuantity(alert)} ${alert.unit}`
    );
    console.log("---");
  });
});
```

**React Component Example:**

```jsx
import React, { useState, useEffect } from "react";

const LowStockAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLowStockAlerts();
  }, []);

  const fetchLowStockAlerts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/inventory/alerts/low-stock");
      if (!response.ok) throw new Error("Failed to fetch alerts");
      const data = await response.json();
      setAlerts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading low stock alerts...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="low-stock-alerts">
      <h2>Low Stock Alerts</h2>
      {alerts.length === 0 ? (
        <p>No low stock alerts at the moment.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Current Stock</th>
              <th>Reorder Level</th>
              <th>Unit</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((alert) => (
              <tr key={alert.productId}>
                <td>{alert.productName}</td>
                <td>{alert.currentStock}</td>
                <td>{alert.reorderLevel}</td>
                <td>{alert.unit}</td>
                <td>
                  <button onClick={() => createPurchaseOrder(alert)}>
                    Create PO
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

const createPurchaseOrder = (alert) => {
  // Navigate to purchase order creation with pre-filled data
  console.log("Creating purchase order for:", alert.productName);
};

export default LowStockAlerts;
```

## Business Logic

### Stock Level Calculation

- **Current Stock:** Calculated as the sum of all stock ledger entries for each product
- **Low Stock Condition:** `currentStock <= reorderLevel`
- **Only Configured Products:** Only products with a defined `reorderLevel` are included in alerts

### Data Freshness

- Data is calculated in real-time from the stock ledger
- No caching is applied, ensuring up-to-date information
- Consider implementing client-side caching for better performance if needed

## Testing

### Manual Testing

```bash
# Test the endpoint using curl
curl -X GET "http://localhost:8080/api/inventory/alerts/low-stock" \
     -H "Accept: application/json" \
     -H "Content-Type: application/json"
```

### Test Scenarios

1. **Normal Flow:** Products with stock below reorder level
2. **Empty Result:** All products have sufficient stock
3. **Null Reorder Level:** Products without configured reorder levels are excluded
4. **Zero Stock:** Products with zero current stock
5. **Exact Match:** Products with stock exactly equal to reorder level

## Notes for Frontend Developers

1. **Polling Strategy:** Consider implementing periodic polling (every 5-10 minutes) to keep data fresh
2. **Error Handling:** Always implement proper error handling for network failures
3. **Loading States:** Show loading indicators while fetching data
4. **Empty States:** Provide meaningful messages when no alerts are present
5. **Performance:** For large datasets, consider implementing pagination or filtering
6. **Integration:** This endpoint works seamlessly with the AP module's purchase order creation endpoints

## Related APIs

- **AP Module Purchase Orders:** `/api/ap/purchase-orders` - For creating purchase orders from low stock alerts
- **Inventory Products:** `/api/inventory/products` - For additional product information
- **Stock Ledger:** `/api/inventory/stock-ledger` - For detailed stock movement history

## Change Log

| Version | Date       | Changes                   |
| ------- | ---------- | ------------------------- |
| 1.0     | 2025-06-17 | Initial API documentation |

---

**Contact:** Development Team  
**Last Updated:** June 17, 2025
