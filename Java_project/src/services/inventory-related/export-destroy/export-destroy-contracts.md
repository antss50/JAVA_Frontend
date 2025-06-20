# Stock Disposal API Documentation

## Endpoint: Record Stock Disposal

Records disposal of products (expired, damaged, contaminated, etc.) and publishes ProductDisposedEvent for financial processing.

### Request Details

**Method:** `POST`  
**URL:** `/api/inventory/stock/disposals`  
**Content-Type:** `application/json`  
**Authentication:** Required (based on your security configuration)

### Request Body

The request body should be a JSON object with the following structure:

```json
{
  "disposalDate": "2025-06-17",
  "disposalReason": "EXPIRED",
  "disposalMethod": "DESTRUCTION",
  "approvedBy": "manager_john_doe",
  "notes": "Weekly expired product disposal",
  "referenceNumber": "DISP-2025-001",
  "items": [
    {
      "productId": 123,
      "quantityToDispose": 10.5,
      "batchNumber": "BATCH-001",
      "expirationDate": "2025-06-15",
      "notes": "Expired milk products"
    },
    {
      "productId": 456,
      "quantityToDispose": 5.0,
      "batchNumber": "BATCH-002",
      "expirationDate": "2025-06-14",
      "notes": "Damaged packaging"
    }
  ]
}
```

#### Root Level Fields

| Field             | Type                | Required | Description                                                    |
| ----------------- | ------------------- | -------- | -------------------------------------------------------------- |
| `disposalDate`    | `string` (ISO Date) | ✅ Yes   | Date when disposal occurred (YYYY-MM-DD format)                |
| `disposalReason`  | `string` (enum)     | ✅ Yes   | Reason for disposal. See [Disposal Reasons](#disposal-reasons) |
| `disposalMethod`  | `string` (enum)     | ✅ Yes   | Method of disposal. See [Disposal Methods](#disposal-methods)  |
| `approvedBy`      | `string`            | ❌ No    | ID/username of person who approved the disposal                |
| `notes`           | `string`            | ❌ No    | Additional notes about the disposal                            |
| `referenceNumber` | `string`            | ❌ No    | Reference number for disposal authorization                    |
| `items`           | `array`             | ✅ Yes   | Array of disposal line items (minimum 1 item required)         |

#### Disposal Line Item Fields

| Field               | Type                | Required | Description                                           |
| ------------------- | ------------------- | -------- | ----------------------------------------------------- |
| `productId`         | `number`            | ✅ Yes   | ID of the product to dispose                          |
| `quantityToDispose` | `number`            | ✅ Yes   | Quantity to dispose (must be positive, minimum 0.001) |
| `batchNumber`       | `string`            | ❌ No    | Batch number for batch tracking                       |
| `expirationDate`    | `string` (ISO Date) | ❌ No    | Expiration date for expired items (YYYY-MM-DD format) |
| `notes`             | `string`            | ❌ No    | Additional notes for this specific line item          |

#### Disposal Reasons

| Value           | Description                     |
| --------------- | ------------------------------- |
| `EXPIRED`       | Product has expired             |
| `DAMAGED`       | Product is damaged/defective    |
| `CONTAMINATED`  | Product is contaminated         |
| `RECALLED`      | Product recall                  |
| `OBSOLETE`      | Product is obsolete             |
| `QUALITY_ISSUE` | Quality does not meet standards |
| `OTHER`         | Other reason                    |

#### Disposal Methods

| Value              | Description           |
| ------------------ | --------------------- |
| `DESTRUCTION`      | Destroyed/Incinerated |
| `RECYCLING`        | Recycled              |
| `DONATION`         | Donated               |
| `RETURN_TO_VENDOR` | Returned to vendor    |
| `COMPOST`          | Composted             |
| `OTHER`            | Other method          |

### Response Format

#### Success Response (HTTP 201 Created)

```json
{
  "success": true,
  "message": "Stock disposal recorded successfully. Details: Product 123: Disposed 10.5, Current Stock = 89.5; Product 456: Disposed 5.0, Current Stock = 45.0;",
  "data": [
    {
      "id": 1001,
      "productId": 123,
      "productName": "Organic Milk 1L",
      "productUnit": "pieces",
      "warehouseId": 1,
      "warehouseName": "Main Warehouse",
      "movementType": "DISPOSAL",
      "quantity": -10.5,
      "documentReference": "DISP-2025-001",
      "eventTimestamp": "2025-06-17T10:30:00",
      "userId": "manager_john_doe",
      "referenceId": null,
      "referenceType": "STOCK_DISPOSAL",
      "notes": "Stock disposal - Reason: Product has expired, Method: Destroyed/Incinerated, Approved by: manager_john_doe, Batch: BATCH-001, Expiry: 2025-06-15, Notes: Expired milk products"
    },
    {
      "id": 1002,
      "productId": 456,
      "productName": "Premium Bread",
      "productUnit": "pieces",
      "warehouseId": 1,
      "warehouseName": "Main Warehouse",
      "movementType": "DISPOSAL",
      "quantity": -5.0,
      "documentReference": "DISP-2025-001",
      "eventTimestamp": "2025-06-17T10:30:00",
      "userId": "manager_john_doe",
      "referenceId": null,
      "referenceType": "STOCK_DISPOSAL",
      "notes": "Stock disposal - Reason: Product has expired, Method: Destroyed/Incinerated, Approved by: manager_john_doe, Batch: BATCH-002, Expiry: 2025-06-14, Notes: Damaged packaging"
    }
  ]
}
```

#### Error Response (HTTP 500 Internal Server Error)

```json
{
  "success": false,
  "message": "Failed to record stock disposal: Insufficient stock for disposal. Product 123 - Available: 5.0, Required: 10.5",
  "data": null
}
```

#### Validation Error Response (HTTP 400 Bad Request)

```json
{
  "success": false,
  "message": "Validation failed: Disposal date is required",
  "data": null
}
```

### Response Data Fields

Each disposal record in the response contains:

| Field               | Type     | Description                                                         |
| ------------------- | -------- | ------------------------------------------------------------------- |
| `id`                | `number` | Unique ID of the stock ledger entry                                 |
| `productId`         | `number` | ID of the disposed product                                          |
| `productName`       | `string` | Name of the disposed product                                        |
| `productUnit`       | `string` | Unit of measurement for the product                                 |
| `warehouseId`       | `number` | ID of the warehouse                                                 |
| `warehouseName`     | `string` | Name of the warehouse                                               |
| `movementType`      | `string` | Always "DISPOSAL" for disposal records                              |
| `quantity`          | `number` | Quantity disposed (negative value indicating stock reduction)       |
| `documentReference` | `string` | Reference number from the request                                   |
| `eventTimestamp`    | `string` | Timestamp when disposal was recorded (ISO format)                   |
| `userId`            | `string` | User who approved/recorded the disposal                             |
| `referenceId`       | `string` | Always null for disposals                                           |
| `referenceType`     | `string` | Always "STOCK_DISPOSAL"                                             |
| `notes`             | `string` | Detailed notes including disposal reason, method, and other details |

### Business Rules

1. **Stock Validation**: The system validates that sufficient stock is available before allowing disposal
2. **Positive Quantities**: All disposal quantities must be positive (minimum 0.001)
3. **Product Validation**: All product IDs must exist in the system
4. **Event Publishing**: Successfully recorded disposals publish `ProductDisposedEvent` for financial processing
5. **Audit Trail**: All disposals are recorded with full audit information including user, timestamp, and detailed notes

### Common Error Scenarios

| Error Type         | HTTP Status | Possible Causes                                                |
| ------------------ | ----------- | -------------------------------------------------------------- |
| Validation Error   | 400         | Missing required fields, invalid quantities, empty items array |
| Insufficient Stock | 500         | Disposal quantity exceeds available stock                      |
| Product Not Found  | 500         | Invalid product ID                                             |
| Server Error       | 500         | Database issues, system errors                                 |

### Frontend Implementation Notes

1. **Date Format**: Always use ISO date format (YYYY-MM-DD) for dates
2. **Decimal Numbers**: Quantities can have decimal places (e.g., 10.5)
3. **Error Handling**: Check the `success` field in response to determine if request succeeded
4. **Stock Verification**: The response message includes current stock levels after disposal
5. **Batch Operations**: Multiple products can be disposed in a single request
6. **Audit Information**: All disposal details are captured in the `notes` field of each ledger entry

### Example Usage

```javascript
// Example JavaScript fetch request
const disposalData = {
  disposalDate: "2025-06-17",
  disposalReason: "EXPIRED",
  disposalMethod: "DESTRUCTION",
  approvedBy: "manager_john_doe",
  notes: "Weekly expired product disposal",
  referenceNumber: "DISP-2025-001",
  items: [
    {
      productId: 123,
      quantityToDispose: 10.5,
      batchNumber: "BATCH-001",
      expirationDate: "2025-06-15",
      notes: "Expired milk products",
    },
  ],
};

fetch("/api/inventory/stock/disposals", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer YOUR_TOKEN_HERE",
  },
  body: JSON.stringify(disposalData),
})
  .then((response) => response.json())
  .then((data) => {
    if (data.success) {
      console.log("Disposal recorded successfully:", data.data);
      console.log("Summary:", data.message);
    } else {
      console.error("Error:", data.message);
    }
  })
  .catch((error) => {
    console.error("Network error:", error);
  });
```
