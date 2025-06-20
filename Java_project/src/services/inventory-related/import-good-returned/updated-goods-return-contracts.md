# Goods Return API Documentation - Frontend Integration Guide

## Overview

This document describes the API endpoints for managing supplier returns with integrated stock movement tracking. The system now maintains data consistency by creating corresponding stock movements for every goods return operation.

---

## 📋 Table of Contents

1. [Authentication & Base URL](#authentication--base-url)
2. [Goods Return Endpoints](#goods-return-endpoints)
3. [Stock Movement Endpoints](#stock-movement-endpoints)
4. [Data Models](#data-models)
5. [Error Handling](#error-handling)
6. [Integration Examples](#integration-examples)

---

## 🔐 Authentication & Base URL

**Base URL:** `https://localhost:8080/api/inventory`

**Authentication:** Include JWT token in Authorization header

```bash
Authorization: Bearer <your-jwt-token>
```

---

## 📦 Goods Return Endpoints

### 1. Record Supplier Return

Creates a goods return record and corresponding stock movement.

**Endpoint:** `POST /goods-returns`

**Request Body:**

```json
{
  "supplierId": 123,
  "purchaseOrderId": 456,
  "reason": "Damaged goods received",
  "returnDate": "2025-06-20",
  "lines": [
    {
      "productId": 789,
      "quantityReturned": 10.5
    }
  ]
}
```

**Request Schema:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `supplierId` | `Long` | ✅ | ID of the supplier |
| `purchaseOrderId` | `Long` | ✅ | Original purchase order ID |
| `reason` | `String` | ❌ | Reason for return |
| `returnDate` | `String` (ISO Date) | ❌ | Return date (defaults to today) |
| `lines` | `Array` | ✅ | Array of return line items |
| `lines[].productId` | `Long` | ✅ | Product being returned |
| `lines[].quantityReturned` | `Number` | ✅ | Quantity to return (positive value) |

**Response (201 Created):**

```json
{
  "id": 1,
  "partyId": 123,
  "purchaseOrderId": 456,
  "productId": 789,
  "quantityReturned": 10.5,
  "unitCost": 25.5,
  "totalValue": 267.75,
  "reason": "Damaged goods received",
  "returnDate": "2025-06-20",
  "stockLedgerId": 9876,
  "createdAt": "2025-06-20T10:30:00Z",
  "updatedAt": "2025-06-20T10:30:00Z"
}
```

**Error Responses:**

- `400 Bad Request` - Invalid request data
- `404 Not Found` - Purchase order or product not found
- `409 Conflict` - Return quantity exceeds available amount

---

### 2. Get Goods Return by ID

Retrieves a specific goods return record.

**Endpoint:** `GET /goods-returns/{id}`

**Response (200 OK):**

```json
{
  "id": 1,
  "partyId": 123,
  "purchaseOrderId": 456,
  "productId": 789,
  "quantityReturned": 10.5,
  "unitCost": 25.5,
  "totalValue": 267.75,
  "reason": "Damaged goods received",
  "returnDate": "2025-06-20",
  "stockLedgerId": 9876,
  "createdAt": "2025-06-20T10:30:00Z",
  "updatedAt": "2025-06-20T10:30:00Z"
}
```

---

### 3. Get Stock Movement for Return

Retrieves the stock movement associated with a goods return.

**Endpoint:** `GET /goods-returns/{id}/stock-movement`

**Response (200 OK):**

```json
{
  "id": 9876,
  "productId": 789,
  "productName": "Premium Coffee Beans",
  "productUnit": "KG",
  "warehouseId": 1,
  "warehouseName": "Main Warehouse",
  "movementType": "RETURN",
  "quantity": -10.5,
  "documentReference": "GOODS_RETURN_456",
  "eventTimestamp": "2025-06-20T10:30:00Z",
  "userId": "SYSTEM",
  "referenceId": "GOODS_RETURN_456",
  "referenceType": "GOODS_RETURN",
  "notes": "Supplier return - Damaged goods received (PO: 456, Product: 789)"
}
```

---

### 4. Get Returns by Supplier

Retrieves all returns for a specific supplier.

**Endpoint:** `GET /goods-returns/by-supplier/{supplierId}`

**Response (200 OK):**

```json
[
  {
    "id": 1,
    "partyId": 123,
    "purchaseOrderId": 456,
    "productId": 789,
    "quantityReturned": 10.5,
    "unitCost": 25.5,
    "totalValue": 267.75,
    "reason": "Damaged goods received",
    "returnDate": "2025-06-20",
    "stockLedgerId": 9876,
    "createdAt": "2025-06-20T10:30:00Z",
    "updatedAt": "2025-06-20T10:30:00Z"
  }
]
```

---

### 5. Get Returns by Supplier (Paginated)

Retrieves returns for a supplier with pagination.

**Endpoint:** `GET /goods-returns/by-supplier/{supplierId}/paginated?page=0&size=20&sort=returnDate,desc`

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | `Integer` | 0 | Page number (0-based) |
| `size` | `Integer` | 20 | Items per page |
| `sort` | `String` | - | Sort criteria (e.g., "returnDate,desc") |

**Response (200 OK):**

```json
{
  "content": [
    {
      "id": 1,
      "partyId": 123,
      "purchaseOrderId": 456,
      "productId": 789,
      "quantityReturned": 10.5,
      "unitCost": 25.5,
      "totalValue": 267.75,
      "reason": "Damaged goods received",
      "returnDate": "2025-06-20",
      "stockLedgerId": 9876,
      "createdAt": "2025-06-20T10:30:00Z",
      "updatedAt": "2025-06-20T10:30:00Z"
    }
  ],
  "pageable": {
    "sort": {
      "sorted": true,
      "unsorted": false
    },
    "pageNumber": 0,
    "pageSize": 20
  },
  "totalElements": 1,
  "totalPages": 1,
  "last": true,
  "first": true,
  "numberOfElements": 1
}
```

---

### 6. Get Returns by Purchase Order

Retrieves all returns for a specific purchase order.

**Endpoint:** `GET /goods-returns/by-purchase-order/{purchaseOrderId}`

**Response:** Same format as supplier returns list

---

### 7. Get Returns by Product

Retrieves all returns for a specific product.

**Endpoint:** `GET /goods-returns/by-product/{productId}`

**Response:** Same format as supplier returns list

---

### 8. Get Returns by Date Range

Retrieves returns within a specific date range.

**Endpoint:** `GET /goods-returns/by-date-range?startDate=2025-06-01&endDate=2025-06-30`

**Query Parameters:**
| Parameter | Type | Required | Format | Description |
|-----------|------|----------|--------|-------------|
| `startDate` | `String` | ✅ | YYYY-MM-DD | Start date (inclusive) |
| `endDate` | `String` | ✅ | YYYY-MM-DD | End date (inclusive) |

**Response:** Same format as supplier returns list

---

### 9. Get Returns by Supplier and Date Range

Combines supplier and date filtering.

**Endpoint:** `GET /goods-returns/by-supplier/{supplierId}/date-range?startDate=2025-06-01&endDate=2025-06-30`

**Response:** Same format as supplier returns list

---

## 📊 Stock Movement Endpoints

### 1. Get All Return Movements

Retrieves all stock movements of type RETURN (includes both customer and supplier returns).

**Endpoint:** `GET /stock/movements/type/RETURN`

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Stock movements by type RETURN retrieved successfully",
  "data": [
    {
      "id": 9876,
      "productId": 789,
      "productName": "Premium Coffee Beans",
      "productUnit": "KG",
      "warehouseId": 1,
      "warehouseName": "Main Warehouse",
      "movementType": "RETURN",
      "quantity": -10.5,
      "documentReference": "GOODS_RETURN_456",
      "eventTimestamp": "2025-06-20T10:30:00Z",
      "userId": "SYSTEM",
      "referenceId": "GOODS_RETURN_456",
      "referenceType": "GOODS_RETURN",
      "notes": "Supplier return - Damaged goods received (PO: 456, Product: 789)"
    }
  ]
}
```

---

### 2. Get Return Movements by Product

Retrieves return movements for a specific product.

**Endpoint:** `GET /stock/movements/type/RETURN?productId={productId}`

**Response:** Same format as above, filtered by product

---

### 3. Record Direct Stock Return

Records a stock return directly (alternative to goods return flow).

**Endpoint:** `POST /stock/returns`

**Request Body:**

```json
{
  "productId": 789,
  "quantity": 10.5,
  "referenceId": "MANUAL_RETURN_001",
  "referenceType": "MANUAL_RETURN",
  "notes": "Customer return - defective item",
  "originalOrderLineId": "SO-123-LINE-1"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Stock return recorded successfully: Product 789, Quantity 10.5, Reference MANUAL_RETURN_001",
  "data": {
    "id": 9877,
    "productId": 789,
    "productName": "Premium Coffee Beans",
    "productUnit": "KG",
    "warehouseId": 1,
    "warehouseName": "Main Warehouse",
    "movementType": "RETURN",
    "quantity": 10.5,
    "documentReference": null,
    "eventTimestamp": "2025-06-20T11:00:00Z",
    "userId": "CUSTOMER_RETURN_SYSTEM",
    "referenceId": "MANUAL_RETURN_001",
    "referenceType": "MANUAL_RETURN",
    "notes": "Customer return - defective item (Original Order Line: SO-123-LINE-1)"
  }
}
```

---

## 📋 Data Models

### GoodsReturn Model

```typescript
interface GoodsReturn {
  id: number;
  partyId: number; // Supplier ID
  purchaseOrderId: number; // Original PO ID
  productId: number;
  quantityReturned: number;
  unitCost: number;
  totalValue: number;
  reason?: string;
  returnDate: string; // ISO date
  stockLedgerId?: number; // Links to stock movement
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}
```

### StockLedger Model

```typescript
interface StockLedger {
  id: number;
  productId: number;
  productName: string;
  productUnit: string;
  warehouseId: number;
  warehouseName: string;
  movementType:
    | "RECEIPT"
    | "ISSUE"
    | "ADJUSTMENT_IN"
    | "ADJUSTMENT_OUT"
    | "RETURN"
    | "DISPOSAL";
  quantity: number; // Negative for outbound movements
  documentReference?: string;
  eventTimestamp: string; // ISO datetime
  userId: string;
  referenceId?: string;
  referenceType?: string;
  notes?: string;
}
```

### API Response Wrapper

```typescript
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
```

---

## ❌ Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "data": null
}
```

### Common HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Business rule violation
- `500 Internal Server Error` - Server error

### Validation Errors

```json
{
  "success": false,
  "message": "Validation failed",
  "data": {
    "errors": [
      {
        "field": "quantityReturned",
        "message": "Quantity must be positive"
      },
      {
        "field": "productId",
        "message": "Product ID is required"
      }
    ]
  }
}
```

---

## 🔗 Integration Examples

### Frontend Implementation Example (React/TypeScript)

```typescript
// Service for handling goods returns
class GoodsReturnService {
  private baseUrl = "/api/inventory/goods-returns";

  async recordReturn(returnData: CreateReturnRequest): Promise<GoodsReturn> {
    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(returnData),
    });

    if (!response.ok) {
      throw new Error(`Failed to record return: ${response.statusText}`);
    }

    return response.json();
  }

  async getReturnsBySupplier(
    supplierId: number,
    page = 0,
    size = 20
  ): Promise<PagedResponse<GoodsReturn>> {
    const response = await fetch(
      `${this.baseUrl}/by-supplier/${supplierId}/paginated?page=${page}&size=${size}`,
      {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch returns: ${response.statusText}`);
    }

    return response.json();
  }

  async getStockMovement(returnId: number): Promise<StockLedger> {
    const response = await fetch(`${this.baseUrl}/${returnId}/stock-movement`, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch stock movement: ${response.statusText}`);
    }

    return response.json();
  }
}

// Usage example
const returnService = new GoodsReturnService();

// Record a return
const newReturn = await returnService.recordReturn({
  supplierId: 123,
  purchaseOrderId: 456,
  reason: "Damaged goods",
  lines: [{ productId: 789, quantityReturned: 10.5 }],
});

// Get associated stock movement
const stockMovement = await returnService.getStockMovement(newReturn.id);
console.log(`Stock movement created: ${stockMovement.id}`);
```

### Data Consistency Validation

```typescript
// Function to validate data consistency
async function validateReturnConsistency(returnId: number): Promise<boolean> {
  const goodsReturn = await fetch(
    `/api/inventory/goods-returns/${returnId}`
  ).then((r) => r.json());
  const stockMovement = await fetch(
    `/api/inventory/goods-returns/${returnId}/stock-movement`
  ).then((r) => r.json());

  // Validate linkage
  if (goodsReturn.stockLedgerId !== stockMovement.id) {
    console.error("Linkage mismatch between GoodsReturn and StockLedger");
    return false;
  }

  // Validate quantities (stock movement should be negative for supplier returns)
  if (Math.abs(stockMovement.quantity) !== goodsReturn.quantityReturned) {
    console.error("Quantity mismatch between GoodsReturn and StockLedger");
    return false;
  }

  // Validate product consistency
  if (goodsReturn.productId !== stockMovement.productId) {
    console.error("Product ID mismatch");
    return false;
  }

  return true;
}
```

---

## 📝 Notes for Frontend Development

1. **Quantity Handling**:

   - Goods return quantities are always positive
   - Stock movement quantities are negative for supplier returns (outbound)
   - Stock movement quantities are positive for customer returns (inbound)

2. **Data Consistency**:

   - Every goods return has a corresponding stock movement
   - Use `stockLedgerId` to link between records
   - Both endpoints provide the same core information from different perspectives

3. **Error Handling**:

   - Always check for business rule violations (e.g., return quantity exceeding billed amount)
   - Handle network errors gracefully
   - Provide user-friendly error messages

4. **Performance**:

   - Use pagination for large datasets
   - Consider caching frequently accessed data
   - Implement loading states for API calls

5. **Real-time Updates**:
   - Consider implementing WebSocket connections for real-time stock updates
   - Refresh related data after successful return operations
