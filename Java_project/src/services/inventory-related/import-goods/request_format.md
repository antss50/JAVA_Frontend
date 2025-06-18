# Goods Receipt API Documentation

## Overview

The Goods Receipt API allows recording of goods received from vendors in the supermarket warehouse system. This endpoint supports multi-line goods receipts and automatically performs stock verification.

## Endpoint

```
POST /api/inventory/stock/goods-receipt
```

## Description

Records multi-line goods received from vendor, performs stock check for verification, and publishes GoodsReceivedEvent for AP/Finance processing.

## Request

### Headers

- `Content-Type: application/json`

### Request Body

The request should contain a `GoodsReceiptRequest` object with the following structure:

```json
{
  "vendorId": "string",
  "receiptDate": "2025-06-17T10:30:00",
  "documentReference": "GR-2025-001",
  "warehouseId": 1,
  "items": [
    {
      "productId": 101,
      "quantityReceived": "50.00",
      "unitCost": "2.50",
      "expiryDate": "2025-12-31",
      "batchNumber": "BATCH001",
      "notes": "Good condition"
    },
    {
      "productId": 102,
      "quantityReceived": "25.00",
      "unitCost": "5.75",
      "expiryDate": "2025-10-15",
      "batchNumber": "BATCH002",
      "notes": "Refrigerated items"
    }
  ],
  "receivedBy": "John Doe",
  "notes": "Morning delivery from vendor ABC"
}
```

### Request Fields

- `vendorId` (string, required): Vendor identifier
- `receiptDate` (datetime, required): Date and time when goods were received
- `documentReference` (string, required): Reference number for the goods receipt
- `warehouseId` (number, required): ID of the warehouse receiving the goods
- `items` (array, required): List of items received
  - `productId` (number, required): Product identifier
  - `quantityReceived` (string/decimal, required): Quantity of product received
  - `unitCost` (string/decimal, optional): Cost per unit
  - `expiryDate` (date, optional): Product expiry date
  - `batchNumber` (string, optional): Batch/lot number
  - `notes` (string, optional): Additional notes for the item
- `receivedBy` (string, required): Name of person who received the goods
- `notes` (string, optional): General notes for the entire receipt

## Response

### Success Response (HTTP 201)

```json
{
  "success": true,
  "message": "Goods receipt recorded successfully. Stock verification: Product 101: Current Stock = 150.00; Product 102: Current Stock = 75.00;",
  "data": [
    {
      "id": 1001,
      "productId": 101,
      "productName": "Apple Juice 1L",
      "productUnit": "BOTTLE",
      "warehouseId": 1,
      "warehouseName": "Main Warehouse",
      "movementType": "RECEIPT",
      "quantity": "50.00",
      "documentReference": "GR-2025-001",
      "eventTimestamp": "2025-06-17T10:30:00",
      "userId": "user123",
      "referenceId": "GR-2025-001",
      "referenceType": "GOODS_RECEIPT",
      "notes": "Good condition"
    },
    {
      "id": 1002,
      "productId": 102,
      "productName": "Organic Milk 2L",
      "productUnit": "CARTON",
      "warehouseId": 1,
      "warehouseName": "Main Warehouse",
      "movementType": "RECEIPT",
      "quantity": "25.00",
      "documentReference": "GR-2025-001",
      "eventTimestamp": "2025-06-17T10:30:00",
      "userId": "user123",
      "referenceId": "GR-2025-001",
      "referenceType": "GOODS_RECEIPT",
      "notes": "Refrigerated items"
    }
  ]
}
```

### Error Response (HTTP 500)

```json
{
  "success": false,
  "message": "Failed to record goods receipt: [error details]",
  "data": null
}
```

## Response Fields

### Success Response

- `success` (boolean): Always `true` for successful operations
- `message` (string): Success message including stock verification details
- `data` (array): List of `StockLedgerDto` objects representing the recorded movements

### StockLedgerDto Object

- `id` (number): Unique identifier for the stock movement
- `productId` (number): Product identifier
- `productName` (string): Product name
- `productUnit` (string): Product unit of measurement
- `warehouseId` (number): Warehouse identifier
- `warehouseName` (string): Warehouse name
- `movementType` (string): Type of movement (will be "RECEIPT" for goods receipt)
- `quantity` (string): Quantity received (positive value)
- `documentReference` (string): Reference to the goods receipt document
- `eventTimestamp` (datetime): When the movement was recorded
- `userId` (string): User who processed the receipt
- `referenceId` (string): Reference identifier
- `referenceType` (string): Type of reference (will be "GOODS_RECEIPT")
- `notes` (string): Additional notes

## Business Logic

1. **Multi-line Processing**: The API processes multiple product lines in a single goods receipt
2. **Stock Verification**: After recording, the system automatically verifies current stock levels for each product
3. **Event Publishing**: A `GoodsReceivedEvent` is published for downstream processing (AP/Finance)
4. **Audit Trail**: All movements are recorded in the stock ledger for complete traceability

## Example Usage

### Frontend Implementation

```javascript
const goodsReceiptData = {
  vendorId: "VENDOR001",
  receiptDate: new Date().toISOString(),
  documentReference: "GR-2025-001",
  warehouseId: 1,
  items: [
    {
      productId: 101,
      quantityReceived: "50.00",
      unitCost: "2.50",
      batchNumber: "BATCH001",
    },
  ],
  receivedBy: "John Doe",
};

fetch("/api/inventory/stock/goods-receipt", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(goodsReceiptData),
})
  .then((response) => response.json())
  .then((data) => {
    if (data.success) {
      console.log("Goods receipt recorded:", data.data);
      console.log("Verification:", data.message);
    } else {
      console.error("Error:", data.message);
    }
  });
```

### cURL Example

```bash
curl -X POST "http://localhost:8080/api/inventory/stock/goods-receipt" \
  -H "Content-Type: application/json" \
  -d '{
    "vendorId": "VENDOR001",
    "receiptDate": "2025-06-17T10:30:00",
    "documentReference": "GR-2025-001",
    "warehouseId": 1,
    "items": [
      {
        "productId": 101,
        "quantityReceived": "50.00",
        "unitCost": "2.50",
        "batchNumber": "BATCH001"
      }
    ],
    "receivedBy": "John Doe"
  }'
```

## Error Handling

### Validation Errors (HTTP 400)

The API will return a 400 Bad Request status with validation errors if:

- Required fields are missing
- Invalid data types are provided
- Business rule violations occur (e.g., negative quantities)

### Common Error Scenarios

1. **Missing Required Fields**: Ensure all required fields are provided
2. **Invalid Product ID**: Verify the product exists in the system
3. **Invalid Warehouse ID**: Verify the warehouse exists and is active
4. **Invalid Quantity Format**: Ensure quantities are valid decimal numbers
5. **Duplicate Document Reference**: Each goods receipt should have a unique document reference

## Notes for Frontend Developers

- Always validate user input before sending the request
- Handle both success and error responses appropriately
- Display the stock verification information to users for confirmation
- Consider implementing a confirmation dialog before submitting large receipts
- Store the returned `StockLedgerDto` objects for audit trail purposes
- The `eventTimestamp` field uses ISO 8601 format for date/time values
