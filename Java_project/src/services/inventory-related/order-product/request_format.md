# Purchase Order API Contracts

## Overview

This document describes the API endpoints for managing purchase orders in the supermarket warehouse system. The Purchase Order API enables the creation of purchase orders from low stock alerts and integrates with the inventory module for goods receipt processing.

## Base URL

```
/api/ap/purchase-orders
```

## Integration with Inventory Module

Purchase orders created through this API are directly linked to the inventory module's goods receipt functionality. Each purchase order line item can be received through the inventory goods receipt endpoint using the generated `billId` and `billLineId`.

---

## Endpoints

### 1. Get Low Stock Alerts

**Endpoint:** `GET /api/ap/purchase-orders/low-stock-alerts`

**Description:** Retrieves a list of products whose current stock levels are at or below their configured reorder levels. This endpoint helps identify which products need to be restocked.

**Headers:**

```
Content-Type: application/json
```

**Request:** No request body required.

**Response (200 OK):**

```json
[
  {
    "productId": 1,
    "productName": "Coca Cola 330ml",
    "unit": "PCS",
    "reorderLevel": 100.0,
    "currentStock": 75.5
  },
  {
    "productId": 15,
    "productName": "Laptop Dell Inspiron 15",
    "unit": "PCS",
    "reorderLevel": 5.0,
    "currentStock": 2.0
  },
  {
    "productId": 23,
    "productName": "Office Paper A4",
    "unit": "PACK",
    "reorderLevel": 50.0,
    "currentStock": 45.0
  }
]
```

**Response Fields:**

- `productId` (Long): Unique product identifier
- `productName` (String): Product display name
- `unit` (String): Unit of measurement (PCS, PACK, KG, etc.)
- `reorderLevel` (BigDecimal): Minimum stock level threshold
- `currentStock` (BigDecimal): Current available stock quantity

---

### 2. Create Purchase Order

**Endpoint:** `POST /api/ap/purchase-orders`

**Description:** Creates a purchase order bill from selected products. This generates bill entries in the AP module and automatically creates journal entries in the finance module for proper accounting.

**Headers:**

```
Content-Type: application/json
```

**Request Body:**

```json
{
  "partyId": 5,
  "notes": "Monthly restocking for low inventory items",
  "orderLines": [
    {
      "productId": 1,
      "productName": "Coca Cola 330ml",
      "description": "Soft drink - 330ml cans",
      "quantity": 100,
      "unitPrice": 12.5
    },
    {
      "productId": 15,
      "productName": "Laptop Dell Inspiron 15",
      "description": "Business laptop with SSD",
      "quantity": 3,
      "unitPrice": 650.0
    },
    {
      "productId": 23,
      "productName": "Office Paper A4",
      "description": "White copy paper, 500 sheets per pack",
      "quantity": 20,
      "unitPrice": 5.75
    }
  ]
}
```

**Request Fields:**

- `partyId` (Long, required): Vendor/supplier party ID
- `notes` (String, optional): Additional notes for the purchase order
- `orderLines` (Array, required): List of products to order
  - `productId` (Long, required): Product unique identifier
  - `productName` (String, required): Product name for reference
  - `description` (String, optional): Product description
  - `quantity` (Integer, required): Quantity to order
  - `unitPrice` (BigDecimal, required): Price per unit

**Response (201 Created):**

```json
{
  "billId": 45,
  "billNumber": "PO-2025-000045",
  "partyId": 5,
  "vendorName": "ABC Wholesale Supplies Ltd.",
  "billDate": "2025-06-17",
  "dueDate": "2025-07-17",
  "status": "PENDING",
  "totalAmount": 3215.0,
  "notes": "Monthly restocking for low inventory items",
  "orderLines": [
    {
      "id": 101,
      "productId": 1,
      "productName": "Coca Cola 330ml",
      "description": "Soft drink - 330ml cans",
      "quantity": 100,
      "unitPrice": 12.5,
      "lineTotal": 1250.0
    },
    {
      "id": 102,
      "productId": 15,
      "productName": "Laptop Dell Inspiron 15",
      "description": "Business laptop with SSD",
      "quantity": 3,
      "unitPrice": 650.0,
      "lineTotal": 1950.0
    },
    {
      "id": 103,
      "productId": 23,
      "productName": "Office Paper A4",
      "description": "White copy paper, 500 sheets per pack",
      "quantity": 20,
      "unitPrice": 5.75,
      "lineTotal": 115.0
    }
  ]
}
```

**Response Fields:**

- `billId` (Long): Unique purchase order identifier for inventory integration
- `billNumber` (String): Human-readable purchase order number
- `partyId` (Long): Vendor party ID
- `vendorName` (String): Vendor company name
- `billDate` (LocalDate): Purchase order creation date
- `dueDate` (LocalDate): Expected delivery/payment due date
- `status` (String): Order status (PENDING, APPROVED, RECEIVED, etc.)
- `totalAmount` (BigDecimal): Total order value (automatically calculated)
- `notes` (String): Order notes
- `orderLines` (Array): List of ordered products with line details
  - `id` (Long): Bill line ID for goods receipt integration
  - `productId` (Long): Product identifier
  - `productName` (String): Product name
  - `description` (String): Product description
  - `quantity` (Integer): Ordered quantity
  - `unitPrice` (BigDecimal): Unit price
  - `lineTotal` (BigDecimal): Line total (quantity × unitPrice)

---

## Integration with Inventory Goods Receipt

### Linking Purchase Orders to Goods Receipt

Once a purchase order is created, the returned `billId` and line-level `id` values are used to record goods receipts in the inventory module.

**Inventory Goods Receipt Endpoint:** `POST /api/inventory/stock/goods-receipt`

**Request Example:**

```json
{
  "billId": 45,
  "supplierId": 5,
  "referenceNumber": "DN-2025-001",
  "receivedBy": "John Doe",
  "notes": "All items delivered in good condition",
  "lines": [
    {
      "billId": 45,
      "billLineId": 101,
      "productId": 1,
      "quantityAccepted": 100.0,
      "quantityRejected": 0.0,
      "rejectionReason": null
    },
    {
      "billId": 45,
      "billLineId": 102,
      "productId": 15,
      "quantityAccepted": 2.0,
      "quantityRejected": 1.0,
      "rejectionReason": "Damaged screen"
    },
    {
      "billId": 45,
      "billLineId": 103,
      "productId": 23,
      "quantityAccepted": 20.0,
      "quantityRejected": 0.0,
      "rejectionReason": null
    }
  ]
}
```

### Complete Workflow

1. **Get Low Stock Alerts** → Identify products needing restocking
2. **Create Purchase Order** → Generate purchase order with selected products
3. **Receive Goods** → Record actual delivery using inventory goods receipt endpoint
4. **Automatic Processing** → System automatically:
   - Updates inventory stock levels
   - Creates financial journal entries
   - Publishes domain events for cross-module integration

---

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Party ID is required",
    "Order lines cannot be empty",
    "Product ID is required for all order lines"
  ]
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "Vendor with ID 999 not found",
  "data": null
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Failed to create purchase order: Database connection error",
  "data": null
}
```

---

## Business Rules

1. **Vendor Validation**: The `partyId` must exist in the party module as a valid vendor
2. **Product Validation**: All `productId` values must exist in the inventory module
3. **Quantity Validation**: Quantities must be positive integers
4. **Price Validation**: Unit prices must be positive decimal values
5. **Automatic Calculation**: Line totals and bill total are calculated automatically
6. **Financial Integration**: Purchase orders automatically create journal entries (Debit: Inventory, Credit: Accounts Payable)
7. **Event Publishing**: Successfully created purchase orders trigger domain events for other modules

---

## Frontend Implementation Notes

### Recommended UI Flow

1. **Dashboard**: Display low stock alerts count as a notification
2. **Low Stock Page**:
   - Fetch and display products below reorder level
   - Allow selection of products with checkboxes
   - Show current stock vs. reorder level visually
3. **Purchase Order Form**:
   - Pre-populate selected products
   - Allow editing of quantities and unit prices
   - Vendor selection dropdown
   - Real-time total calculation
4. **Confirmation Page**:
   - Show created purchase order details
   - Provide link to goods receipt functionality
   - Display financial impact summary

### State Management

- Store low stock alerts in application state
- Cache vendor list for dropdown population
- Track purchase order creation status
- Maintain relationship between purchase orders and goods receipts

### Error Handling

- Validate form data before submission
- Display user-friendly error messages
- Handle network errors gracefully
- Provide retry mechanisms for failed requests

---

## Testing

### Sample Test Data

**Valid Vendor IDs**: 1, 2, 3, 4, 5
**Valid Product IDs**: Check via `/api/inventory/products` endpoint
**Test Scenarios**:

- Single product purchase order
- Multi-product purchase order
- Large quantity orders
- Zero quantity handling
- Invalid vendor ID
- Invalid product ID
- Missing required fields

---

## Changelog

| Version | Date       | Changes                                                                 |
| ------- | ---------- | ----------------------------------------------------------------------- |
| 1.0     | 2025-06-17 | Initial API documentation with purchase order and inventory integration |
