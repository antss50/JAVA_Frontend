# Goods Return API Documentation

## Overview
The Goods Return API allows recording supplier returns for products that were previously received but need to be returned due to damage, defects, or other reasons.

## Base URL
```
/api/inventory/goods-returns
```

## Endpoints

### 1. Record Goods Return

**Endpoint:** `POST /api/inventory/goods-returns`

**Description:** Records goods being returned to a supplier. This endpoint handles multiline returns where multiple products can be returned in a single transaction.

**Authorization:** Authentication required

**Request Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

## Request Format

### Single Product Return
```json
{
  "supplierId": 3,
  "purchaseOrderId": 4,
  "reason": "DAMAGED",
  "returnDate": "2025-06-16",
  "lines": [
    {
      "productId": 1,
      "quantityReturned": 2.0
    }
  ]
}
```

### Multiple Products Return (Multiline)
```json
{
  "supplierId": 5,
  "purchaseOrderId": 123,
  "reason": "QUALITY_ISSUES",
  "returnDate": "2025-06-17",
  "lines": [
    {
      "productId": 101,
      "quantityReturned": 5.0
    },
    {
      "productId": 102,
      "quantityReturned": 3.0
    },
    {
      "productId": 103,
      "quantityReturned": 1.0
    }
  ]
}
```

## Request Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `supplierId` | Long | Yes | ID of the supplier receiving the return |
| `purchaseOrderId` | Long | Yes | ID of the original purchase order |
| `reason` | String | No | Reason for return (e.g., "DAMAGED", "DEFECTIVE", "WRONG_ITEM") |
| `returnDate` | String (Date) | No | Date of return (ISO format: YYYY-MM-DD). Defaults to current date |
| `lines` | Array | Yes | List of products being returned (minimum 1 item) |

### Lines Object Structure
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `productId` | Long | Yes | ID of the product being returned |
| `quantityReturned` | Decimal | Yes | Quantity being returned (must be positive) |

## Response Format

### Success Response (201 Created)
```json
{
  "id": 3,
  "partyId": 3,
  "purchaseOrderId": 4,
  "productId": 1,
  "quantityReturned": 2.0,
  "unitCost": 15.0,
  "totalValue": 30.0,
  "reason": "DAMAGED",
  "returnDate": "2025-06-16",
  "createdAt": "2025-06-16T10:30:00Z",
  "updatedAt": "2025-06-16T10:30:00Z"
}
```

### Multiline Return Response
For multiline returns, multiple records are created. Each line item returns a separate response object:

```json
[
  {
    "id": 4,
    "partyId": 5,
    "purchaseOrderId": 123,
    "productId": 101,
    "quantityReturned": 5.0,
    "unitCost": 25.0,
    "totalValue": 125.0,
    "reason": "QUALITY_ISSUES",
    "returnDate": "2025-06-17",
    "createdAt": "2025-06-17T09:15:00Z",
    "updatedAt": "2025-06-17T09:15:00Z"
  },
  {
    "id": 5,
    "partyId": 5,
    "purchaseOrderId": 123,
    "productId": 102,
    "quantityReturned": 3.0,
    "unitCost": 12.5,
    "totalValue": 37.5,
    "reason": "QUALITY_ISSUES",
    "returnDate": "2025-06-17",
    "createdAt": "2025-06-17T09:15:00Z",
    "updatedAt": "2025-06-17T09:15:00Z"
  }
]
```

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | Long | Unique identifier for the return record |
| `partyId` | Long | Supplier ID (same as supplierId in request) |
| `purchaseOrderId` | Long | Original purchase order ID |
| `productId` | Long | Product being returned |
| `quantityReturned` | Decimal | Quantity returned |
| `unitCost` | Decimal | Unit cost of the product (retrieved from original purchase order) |
| `totalValue` | Decimal | Total value of return (quantityReturned × unitCost) |
| `reason` | String | Reason for return |
| `returnDate` | String (Date) | Date of return |
| `createdAt` | String (DateTime) | When the record was created |
| `updatedAt` | String (DateTime) | When the record was last updated |

## Error Responses

### 400 Bad Request - Validation Error
```json
{
  "timestamp": "2025-06-17T10:30:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/api/inventory/goods-returns"
}
```

### 409 Conflict - Duplicate Return
```json
{
  "timestamp": "2025-06-17T10:30:00Z",
  "status": 409,
  "error": "Conflict",
  "message": "Return already recorded for this product and purchase order",
  "path": "/api/inventory/goods-returns"
}
```

### 500 Internal Server Error
```json
{
  "timestamp": "2025-06-17T10:30:00Z",
  "status": 500,
  "error": "Internal Server Error",
  "message": "Failed to record goods return",
  "path": "/api/inventory/goods-returns"
}
```

## Business Rules

1. **Single Return Per Product/PO**: Each product can only be returned once per purchase order
2. **Positive Quantities**: Return quantities must be greater than zero
3. **Valid Purchase Order**: The purchase order must exist and be accessible
4. **Cost Calculation**: Unit cost is automatically retrieved from the original purchase order
5. **Finance Integration**: Return events are published for finance module processing

## Example Usage

### Frontend Implementation Example
```javascript
const returnGoods = async (returnData) => {
  try {
    const response = await fetch('/api/inventory/goods-returns', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(returnData)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('Return recorded successfully:', result);
      return result;
    } else {
      const error = await response.json();
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('Error recording return:', error);
    throw error;
  }
};

// Usage for multiline return
const multilineReturn = {
  supplierId: 5,
  purchaseOrderId: 123,
  reason: "DAMAGED",
  returnDate: "2025-06-17",
  lines: [
    { productId: 101, quantityReturned: 5.0 },
    { productId: 102, quantityReturned: 3.0 }
  ]
};

returnGoods(multilineReturn);
```

## Notes

- The system automatically calculates `unitCost` and `totalValue` based on the original purchase order
- Return dates default to the current date if not specified
- Each line item in a multiline return creates a separate return record
- Events are published to integrate with the finance module for accounting purposes
- Authentication is required for all requests