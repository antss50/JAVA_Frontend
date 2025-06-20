# Stock Management API Guide for Frontend

## Overview

This document provides comprehensive API documentation for the Stock Management endpoints in the Supermarket Warehouse system. These APIs handle inventory stock operations including stock checking, adjustments, goods receipt, and disposal.

**Base URL**: `/api/inventory/stock`

**Cross-Origin**: Enabled for all origins with max age of 3600 seconds

## Authentication

All endpoints require proper authentication. Include the authorization token in the request headers.

## API Endpoints

### 1. Get Current Stock Level

**Endpoint**: `GET /api/inventory/stock/current`

**Description**: Get the current stock level for a specific product

**Parameters**:

- `productId` (required, Long): The ID of the product

**Request Example**:

```
GET /api/inventory/stock/current?productId=123
```

**Response**:

- **Type**: `BigDecimal`
- **Example**: `150.50`

**Error Responses**:

- `404`: Product not found
- `500`: Internal server error

---

### 2. Check Stock Availability

**Endpoint**: `GET /api/inventory/stock/check-availability`

**Description**: Check if sufficient stock is available for a product

**Parameters**:

- `productId` (required, Long): The ID of the product
- `requiredQuantity` (required, BigDecimal): The quantity needed

**Request Example**:

```
GET /api/inventory/stock/check-availability?productId=123&requiredQuantity=50.00
```

**Response**:

- **Type**: `Boolean`
- **Example**: `true`

---

### 3. Get All Product Stocks

**Endpoint**: `GET /api/inventory/stock/all`

**Description**: Get current stock levels for all products

**Request Example**:

```
GET /api/inventory/stock/all
```

**Response**:

```json
{
  "success": true,
  "message": "Product stocks retrieved successfully",
  "data": [
    {
      "productId": 1,
      "productName": "Apple Juice",
      "productSku": "APL-001",
      "currentStock": 150.5,
      "unit": "bottles"
    },
    {
      "productId": 2,
      "productName": "Orange Juice",
      "productSku": "ORG-001",
      "currentStock": 75.25,
      "unit": "bottles"
    }
  ],
  "timestamp": "2025-06-19T10:30:00"
}
```

---

### 4. Get Product Stock Movements

**Endpoint**: `GET /api/inventory/stock/movements/product/{productId}`

**Description**: Get stock movement history for a specific product

**Path Parameters**:

- `productId` (required, Long): The ID of the product

**Request Example**:

```
GET /api/inventory/stock/movements/product/123
```

**Response**:

```json
{
  "success": true,
  "message": "Stock movements retrieved successfully",
  "data": [
    {
      "id": 1001,
      "productId": 123,
      "productName": "Apple Juice",
      "productUnit": "bottles",
      "warehouseId": 1,
      "warehouseName": "Main Warehouse",
      "movementType": "RECEIPT",
      "quantity": 100.0,
      "documentReference": "GR-2025-001",
      "eventTimestamp": "2025-06-19T09:00:00",
      "userId": "user123",
      "referenceId": "PO-2025-001",
      "referenceType": "PURCHASE_ORDER",
      "notes": "Goods received from supplier ABC"
    }
  ],
  "timestamp": "2025-06-19T10:30:00"
}
```

---

### 5. Get Stock Movements by Date Range

**Endpoint**: `GET /api/inventory/stock/movements/date-range`

**Description**: Get stock movements within a specific date range

**Parameters**:

- `startDate` (required, LocalDate): Start date in ISO format (YYYY-MM-DD)
- `endDate` (required, LocalDate): End date in ISO format (YYYY-MM-DD)

**Request Example**:

```
GET /api/inventory/stock/movements/date-range?startDate=2025-06-01&endDate=2025-06-19
```

**Response**: Same format as product movements endpoint

---

### 6. Adjust Stock

**Endpoint**: `POST /api/inventory/stock/adjust`

**Description**: Record a stock adjustment (increase or decrease)

**Request Body**:

```json
{
  "productId": 123,
  "quantityChange": "25.50",
  "reason": "INVENTORY_COUNT_ADJUSTMENT",
  "reference": "ADJ-2025-001"
}
```

**Request Fields**:

- `productId` (required, Long): The ID of the product
- `quantityChange` (required, String): The quantity change (positive for increase, negative for decrease)
- `reason` (required, String): Reason for adjustment
- `reference` (optional, String): Reference number or document

**Response**:

```json
{
  "success": true,
  "message": "Stock adjustment recorded successfully",
  "data": {
    "id": 1002,
    "productId": 123,
    "productName": "Apple Juice",
    "productUnit": "bottles",
    "warehouseId": 1,
    "warehouseName": "Main Warehouse",
    "movementType": "ADJUSTMENT",
    "quantity": 25.5,
    "documentReference": "ADJ-2025-001",
    "eventTimestamp": "2025-06-19T10:30:00",
    "userId": "user123",
    "referenceId": null,
    "referenceType": null,
    "notes": "INVENTORY_COUNT_ADJUSTMENT"
  },
  "timestamp": "2025-06-19T10:30:00"
}
```

---

### 7. Record Goods Receipt

**Endpoint**: `POST /api/inventory/stock/goods-receipt`

**Description**: Record multi-line goods received from vendor and publish events for AP/Finance processing

**Request Body**:

```json
{
  "vendorId": 456,
  "purchaseOrderNumber": "PO-2025-001",
  "invoiceNumber": "INV-2025-001",
  "receivedDate": "2025-06-19",
  "receivedBy": "warehouse_user",
  "notes": "Goods received in good condition",
  "items": [
    {
      "productId": 123,
      "quantityReceived": 100.0,
      "unitCost": 2.5,
      "batchNumber": "BATCH-001",
      "expirationDate": "2025-12-31",
      "notes": "Premium quality batch"
    },
    {
      "productId": 124,
      "quantityReceived": 50.0,
      "unitCost": 3.0,
      "batchNumber": "BATCH-002",
      "expirationDate": "2025-11-30"
    }
  ]
}
```

**Response**:

```json
{
  "success": true,
  "message": "Goods receipt recorded successfully. Stock verification: Product 123: Current Stock = 250.50; Product 124: Current Stock = 125.00;",
  "data": [
    {
      "id": 1003,
      "productId": 123,
      "productName": "Apple Juice",
      "productUnit": "bottles",
      "warehouseId": 1,
      "warehouseName": "Main Warehouse",
      "movementType": "RECEIPT",
      "quantity": 100.0,
      "documentReference": "GR-2025-001",
      "eventTimestamp": "2025-06-19T10:30:00",
      "userId": "warehouse_user",
      "referenceId": "PO-2025-001",
      "referenceType": "PURCHASE_ORDER",
      "notes": "Goods received from vendor. Batch: BATCH-001, Expiry: 2025-12-31"
    }
  ],
  "timestamp": "2025-06-19T10:30:00"
}
```

---

### 8. Record Stock Disposal

**Endpoint**: `POST /api/inventory/stock/disposals`

**Description**: Record disposal of products (expired, damaged, contaminated, etc.) and publish events for financial processing

**Request Body**:

```json
{
  "disposalReason": "EXPIRED",
  "disposalMethod": "DESTRUCTION",
  "approvedBy": "manager_user",
  "notes": "Monthly expired product disposal",
  "items": [
    {
      "productId": 123,
      "quantityToDispose": 10.0,
      "batchNumber": "BATCH-001",
      "expirationDate": "2025-06-15",
      "notes": "Expired last week"
    },
    {
      "productId": 124,
      "quantityToDispose": 5.0,
      "batchNumber": "BATCH-002",
      "notes": "Damaged packaging"
    }
  ]
}
```

**Disposal Reasons**:

- `EXPIRED`: Products past expiration date
- `DAMAGED`: Physically damaged products
- `CONTAMINATED`: Contaminated products
- `RECALLED`: Manufacturer recall
- `OTHER`: Other reasons

**Disposal Methods**:

- `DESTRUCTION`: Physical destruction
- `RETURN_TO_VENDOR`: Return to supplier
- `DONATION`: Donate to charity
- `RECYCLING`: Recycle materials
- `OTHER`: Other methods

**Response**:

```json
{
  "success": true,
  "message": "Successfully disposed 2 product lines. Disposal reason: Expired, Method: Destruction",
  "data": [
    {
      "id": 1004,
      "productId": 123,
      "productName": "Apple Juice",
      "productUnit": "bottles",
      "warehouseId": 1,
      "warehouseName": "Main Warehouse",
      "movementType": "DISPOSAL",
      "quantity": -10.0,
      "documentReference": "DISP-2025-001",
      "eventTimestamp": "2025-06-19T10:30:00",
      "userId": "manager_user",
      "referenceId": null,
      "referenceType": "DISPOSAL",
      "notes": "Monthly expired product disposal. Disposal reason: Expired, Method: Destruction, Batch: BATCH-001, Expiry: 2025-06-15, Item notes: Expired last week"
    }
  ],
  "timestamp": "2025-06-19T10:30:00"
}
```

---

### 9. Get Stock Level with Optional Check

**Endpoint**: `GET /api/inventory/stock/level-with-check`

**Description**: Get stock level and perform optional check against expected quantity

**Parameters**:

- `productId` (required, Long): The ID of the product
- `expectedQuantity` (optional, BigDecimal): Expected quantity for comparison
- `checkedBy` (optional, String): User performing the check

**Request Example**:

```
GET /api/inventory/stock/level-with-check?productId=123&expectedQuantity=150.00&checkedBy=user123
```

**Response**:

```json
{
  "success": true,
  "message": "Stock level retrieved successfully",
  "data": {
    "productId": 123,
    "currentStock": 145.5,
    "expectedQuantity": 150.0,
    "variance": -4.5,
    "status": "SHORTAGE",
    "message": "For formal stock checking, use POST /api/inventory/stock-check-results/perform-check"
  },
  "timestamp": "2025-06-19T10:30:00"
}
```

**Status Values**:

- `MATCH`: Current stock equals expected quantity
- `SHORTAGE`: Current stock is less than expected
- `OVERAGE`: Current stock is more than expected

---

### 10. Get Stock Status

**Endpoint**: `GET /api/inventory/stock/status`

**Description**: Get comprehensive stock status including variance information

**Parameters**:

- `productId` (required, Long): The ID of the product

**Request Example**:

```
GET /api/inventory/stock/status?productId=123
```

**Response**:

```json
{
  "success": true,
  "message": "Stock status retrieved successfully",
  "data": {
    "productId": 123,
    "productName": "Apple Juice",
    "currentStock": 145.5,
    "minimumStock": 50.0,
    "maximumStock": 500.0,
    "reorderLevel": 100.0,
    "status": "ADEQUATE",
    "lastMovementDate": "2025-06-19T09:00:00",
    "lastMovementType": "SALE",
    "variance": -4.5,
    "variancePercentage": -3.0
  },
  "timestamp": "2025-06-19T10:30:00"
}
```

---

### 11. Get Movements by Type

**Endpoint**: `GET /api/inventory/stock/movements/type/{movementType}`

**Description**: Get stock movements by movement type with optional filters

**Path Parameters**:

- `movementType` (required): Movement type (RECEIPT, SALE, ADJUSTMENT, TRANSFER, DISPOSAL)

**Query Parameters**:

- `productId` (optional, Long): Filter by product ID
- `categoryId` (optional, Long): Filter by product category ID

**Request Examples**:

```
GET /api/inventory/stock/movements/type/RECEIPT
GET /api/inventory/stock/movements/type/SALE?productId=123
GET /api/inventory/stock/movements/type/DISPOSAL?categoryId=5
GET /api/inventory/stock/movements/type/ADJUSTMENT?productId=123&categoryId=5
```

**Movement Types**:

- `RECEIPT`: Goods received
- `SALE`: Products sold
- `ADJUSTMENT`: Stock adjustments
- `TRANSFER`: Stock transfers
- `DISPOSAL`: Product disposals

**Response**: Same format as other movement endpoints

---

## Error Handling

All endpoints return standardized error responses:

```json
{
  "success": false,
  "message": "Error description",
  "data": null,
  "timestamp": "2025-06-19T10:30:00"
}
```

**Common HTTP Status Codes**:

- `200`: Success
- `201`: Created (for POST operations)
- `400`: Bad Request (validation errors)
- `404`: Not Found
- `500`: Internal Server Error

## Data Types

### BigDecimal

- Used for quantities and monetary values
- Sent as strings in JSON to preserve precision
- Example: `"150.50"`

### LocalDateTime

- ISO 8601 format: `YYYY-MM-DDTHH:MM:SS`
- Example: `"2025-06-19T10:30:00"`

### LocalDate

- ISO date format: `YYYY-MM-DD`
- Example: `"2025-06-19"`

## Integration Notes

1. **Stock Verification**: Goods receipt endpoint automatically performs stock verification
2. **Event Publishing**: Goods receipt and disposal operations publish domain events for other modules
3. **Formal Stock Checking**: Use dedicated stock check endpoints for formal checking operations
4. **Multi-line Operations**: Goods receipt and disposal support multiple product lines in single request
5. **Audit Trail**: All stock movements are automatically logged with user information and timestamps

## Best Practices

1. Always handle both success and error responses
2. Use appropriate HTTP methods (GET for queries, POST for modifications)
3. Include user identification in requests where applicable
4. Validate quantities and dates on the frontend before sending requests
5. Display meaningful error messages to users
6. Implement proper loading states for async operations
7. Cache frequently accessed data like product lists
8. Use pagination for large result sets (implement client-side if needed)

## Example Frontend Implementation

```javascript
// Example: Get current stock
async function getCurrentStock(productId) {
  try {
    const response = await fetch(
      `/api/inventory/stock/current?productId=${productId}`
    );
    const stockLevel = await response.json();
    return stockLevel;
  } catch (error) {
    console.error("Error fetching stock:", error);
    throw error;
  }
}

// Example: Record stock adjustment
async function adjustStock(adjustment) {
  try {
    const response = await fetch("/api/inventory/stock/adjust", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify(adjustment),
    });
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message);
    }

    return result.data;
  } catch (error) {
    console.error("Error adjusting stock:", error);
    throw error;
  }
}
```
