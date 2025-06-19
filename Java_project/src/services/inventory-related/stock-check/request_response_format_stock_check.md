# Stock Check API Documentation

## Overview

This document provides comprehensive API documentation for the Stock Check functionality in the Supermarket Warehouse Management System. The API allows frontend applications to perform stock checks, view results, and manage stock variances.

## Base URL

```
/api/inventory/stock-check-results
```

## Common Response Format

All endpoints return responses wrapped in the following format:

```json
{
  "timestamp": "2025-06-19T10:30:00",
  "success": true,
  "message": "Operation successful",
  "data": {
    /* actual response data */
  }
}
```

## Authentication

- All endpoints require proper authentication
- Include JWT token in Authorization header: `Authorization: Bearer <token>`

---

## Stock Check Operations

### 1. Perform Single Stock Check

**Endpoint:** `POST /api/inventory/stock-check-results/perform-check`

**Description:** Performs a stock check for a single product and creates a result record.

**Request Body:**

```json
{
  "productId": 123,
  "expectedQuantity": 100.0,
  "checkedBy": "john.doe",
  "checkReference": "CHK-2025-001",
  "notes": "Monthly stock check"
}
```

**Request Fields:**

- `productId` (Long, required): ID of the product to check
- `expectedQuantity` (BigDecimal, required): Expected quantity in stock
- `checkedBy` (String, required): Username of the person performing the check
- `checkReference` (String, optional): Reference number for the check
- `notes` (String, optional): Additional notes

**Response:**

```json
{
  "timestamp": "2025-06-19T10:30:00",
  "success": true,
  "message": "Stock check performed successfully",
  "data": {
    "checkResultId": 456,
    "productId": 123,
    "expectedQuantity": 100.0,
    "actualQuantity": 98.5,
    "variance": -1.5,
    "variancePercentage": -1.5,
    "checkStatus": "SHORTAGE",
    "message": "Stock shortage detected",
    "checkDate": "2025-06-19T10:30:00",
    "checkedBy": "john.doe",
    "checkReference": "CHK-2025-001"
  }
}
```

### 2. Perform Batch Stock Check (Multiline)

**Endpoint:** `POST /api/inventory/stock-check-results/perform-check/batch`

**Description:** Performs stock checks for multiple products simultaneously. This is the primary endpoint for multiline stock checking.

**Request Body:**

```json
[
  {
    "productId": 123,
    "expectedQuantity": 100.0,
    "checkedBy": "john.doe",
    "checkReference": "CHK-2025-001",
    "notes": "Product A check"
  },
  {
    "productId": 124,
    "expectedQuantity": 50.0,
    "checkedBy": "john.doe",
    "checkReference": "CHK-2025-001",
    "notes": "Product B check"
  },
  {
    "productId": 125,
    "expectedQuantity": 75.0,
    "checkedBy": "john.doe",
    "checkReference": "CHK-2025-001",
    "notes": "Product C check"
  }
]
```

**Response:**

```json
{
  "timestamp": "2025-06-19T10:30:00",
  "success": true,
  "message": "Batch stock checks performed successfully (3 items)",
  "data": [
    {
      "checkResultId": 456,
      "productId": 123,
      "expectedQuantity": 100.0,
      "actualQuantity": 98.5,
      "variance": -1.5,
      "variancePercentage": -1.5,
      "checkStatus": "SHORTAGE",
      "message": "Stock shortage detected",
      "checkDate": "2025-06-19T10:30:00",
      "checkedBy": "john.doe",
      "checkReference": "CHK-2025-001"
    },
    {
      "checkResultId": 457,
      "productId": 124,
      "expectedQuantity": 50.0,
      "actualQuantity": 50.0,
      "variance": 0.0,
      "variancePercentage": 0.0,
      "checkStatus": "MATCH",
      "message": "Stock matches expected quantity",
      "checkDate": "2025-06-19T10:30:00",
      "checkedBy": "john.doe",
      "checkReference": "CHK-2025-001"
    },
    {
      "checkResultId": 458,
      "productId": 125,
      "expectedQuantity": 75.0,
      "actualQuantity": 77.0,
      "variance": 2.0,
      "variancePercentage": 2.67,
      "checkStatus": "OVERAGE",
      "message": "Stock overage detected",
      "checkDate": "2025-06-19T10:30:00",
      "checkedBy": "john.doe",
      "checkReference": "CHK-2025-001"
    }
  ]
}
```

---

## Required Product Data for Stock Checks

### Get All Products

**Endpoint:** `GET /api/inventory/products`

**Description:** Fetch all products to populate the stock check interface.

**Query Parameters:**

- `page` (int, optional): Page number (default: 0)
- `size` (int, optional): Page size (default: 20)
- `sort` (string, optional): Sort field (default: "name")

**Response:**

```json
{
  "timestamp": "2025-06-19T10:30:00",
  "success": true,
  "message": "Products retrieved successfully",
  "data": {
    "content": [
      {
        "id": 123,
        "name": "Product A",
        "unit": "PCS",
        "categoryId": 1,
        "categoryName": "Electronics",
        "purchasePrice": 50.0,
        "sellingPrice": 75.0,
        "reorderLevel": 10.0
      }
    ],
    "pageable": {
      "sort": { "sorted": true },
      "pageNumber": 0,
      "pageSize": 20
    },
    "totalElements": 150,
    "totalPages": 8,
    "first": true,
    "last": false
  }
}
```

### Search Products

**Endpoint:** `GET /api/inventory/products/search`

**Description:** Search products by name for stock check selection.

**Query Parameters:**

- `query` (string, required): Search term
- `page` (int, optional): Page number
- `size` (int, optional): Page size

---

## Stock Check Results Management

### 3. Get All Stock Check Results

**Endpoint:** `GET /api/inventory/stock-check-results`

**Query Parameters:**

- `page` (int): Page number (default: 0)
- `size` (int): Page size (default: 20)
- `sort` (string): Sort field (default: "checkTimestamp")

### 4. Get Stock Check Result by ID

**Endpoint:** `GET /api/inventory/stock-check-results/{id}`

### 5. Get Results by Product

**Endpoint:** `GET /api/inventory/stock-check-results/product/{productId}`

### 6. Get Results by Status

**Endpoint:** `GET /api/inventory/stock-check-results/status/{status}`

**Valid Status Values:**

- `MATCH`: Expected quantity matches actual quantity
- `SHORTAGE`: Actual quantity is less than expected
- `OVERAGE`: Actual quantity is more than expected

### 7. Get Results by Date Range

**Endpoint:** `GET /api/inventory/stock-check-results/date-range`

**Query Parameters:**

- `startDate` (string, required): Start date in YYYY-MM-DD format
- `endDate` (string, required): End date in YYYY-MM-DD format
- `page` (int, optional): Page number
- `size` (int, optional): Page size

### 8. Get Latest Result for Product

**Endpoint:** `GET /api/inventory/stock-check-results/product/{productId}/latest`

### 9. Get Results with Variance

**Endpoint:** `GET /api/inventory/stock-check-results/variance`

**Query Parameters:**

- `threshold` (BigDecimal, optional): Minimum variance threshold (default: 0.0)

### 10. Get Summary Statistics

**Endpoint:** `GET /api/inventory/stock-check-results/summary`

**Query Parameters:**

- `startDate` (string, required): Start date in YYYY-MM-DD format
- `endDate` (string, required): End date in YYYY-MM-DD format

**Response:**

```json
{
  "timestamp": "2025-06-19T10:30:00",
  "success": true,
  "message": "Stock check summary retrieved successfully",
  "data": {
    "totalChecks": 250,
    "checksWithVariance": 45,
    "checksWithoutVariance": 205,
    "averageVariance": 2.5,
    "totalVarianceValue": 112.5
  }
}
```

---

## Variance Management

### 11. Get Unprocessed Variances

**Endpoint:** `GET /api/inventory/stock-check-results/unprocessed`

### 12. Get Unprocessed Variances Count

**Endpoint:** `GET /api/inventory/stock-check-results/unprocessed/count`

### 13. Process Variance

**Endpoint:** `POST /api/inventory/stock-check-results/{id}/process`




**Query Parameters:**

- `approvedBy` (string, required): Username of the person approving the variance

---

## Export and Reporting

### 14. Export to CSV

**Endpoint:** `GET /api/inventory/stock-check-results/export/csv`

**Query Parameters:**

- `startDate` (string, optional): Start date filter
- `endDate` (string, optional): End date filter

**Response:** CSV file download

### 15. Get Statistical Data

**Endpoint:** `GET /api/inventory/stock-check-results/stats`

**Query Parameters:**

- `startDate` (string, required): Start date in YYYY-MM-DD format
- `endDate` (string, required): End date in YYYY-MM-DD format

---

## Error Handling

### Common Error Responses

#### Validation Error (400 Bad Request)

```json
{
  "timestamp": "2025-06-19T10:30:00",
  "success": false,
  "message": "Product ID is required",
  "data": null
}
```

#### Not Found Error (404 Not Found)

```json
{
  "timestamp": "2025-06-19T10:30:00",
  "success": false,
  "message": "Stock check result not found",
  "data": null
}
```

#### Internal Server Error (500)

```json
{
  "timestamp": "2025-06-19T10:30:00",
  "success": false,
  "message": "Internal error performing stock check: Database connection failed",
  "data": null
}
```

---

## Frontend Implementation Guide

### Stock Check Workflow

#### 1. Single Product Stock Check

```javascript
// 1. Get product data
const products = await fetch(
  "/api/inventory/products/search?query=productName"
);

// 2. Perform stock check
const stockCheckRequest = {
  productId: selectedProduct.id,
  expectedQuantity: userInput.expectedQuantity,
  checkedBy: currentUser.username,
  checkReference: generateReference(),
  notes: userInput.notes,
};

const response = await fetch(
  "/api/inventory/stock-check-results/perform-check",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(stockCheckRequest),
  }
);
```

#### 2. Multiline Stock Check

```javascript
// 1. Fetch all products for selection
const allProducts = await fetch("/api/inventory/products");

// 2. Build multiline request from user interface
const stockCheckRequests = stockCheckLines.map((line) => ({
  productId: line.productId,
  expectedQuantity: line.expectedQuantity,
  checkedBy: currentUser.username,
  checkReference: batchReference,
  notes: line.notes,
}));

// 3. Perform batch stock check
const response = await fetch(
  "/api/inventory/stock-check-results/perform-check/batch",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(stockCheckRequests),
  }
);
```

### Data Structure for Multiline Stock Check Interface

#### Product Selection Component

```javascript
const ProductLine = {
  productId: null, // Selected product ID
  productName: "", // Display name
  currentStock: 0, // Current stock level
  expectedQuantity: 0, // User input
  unit: "PCS", // Product unit
  notes: "", // User notes
};
```

#### Stock Check Results Display

```javascript
const StockCheckResult = {
  checkResultId: null,
  productId: null,
  productName: "",
  expectedQuantity: 0,
  actualQuantity: 0,
  variance: 0,
  variancePercentage: 0,
  checkStatus: "MATCH|SHORTAGE|OVERAGE",
  message: "",
  checkDate: "",
  processed: false,
};
```

### Recommended UI Flow

1. **Product Selection Screen**

   - Search/filter products
   - Add products to stock check list
   - Set expected quantities for each product
   - Add notes per product line

2. **Batch Check Execution**

   - Review selected products
   - Confirm checker identity
   - Generate batch reference
   - Execute batch stock check

3. **Results Display**
   - Show variance summary
   - Highlight discrepancies
   - Provide options to process variances
   - Export results

### Performance Considerations

- Use pagination for large product lists
- Implement client-side filtering for better UX
- Consider caching product data for offline capability
- Validate inputs before API calls
- Handle network errors gracefully

### Security Notes

- Always validate user permissions before stock checks
- Log all stock check activities
- Implement proper authentication for all endpoints
- Validate input data on both client and server side

---

## Additional Features

### Real-time Notifications

- Consider implementing WebSocket connections for real-time updates
- Notify relevant users when variances are detected
- Update dashboards in real-time

### Mobile Considerations

- Implement barcode scanning for product selection
- Optimize for touch interfaces
- Support offline data entry with sync capability

---

This documentation covers all aspects of the Stock Check API and provides comprehensive guidance for frontend implementation. For additional questions or clarifications, please refer to the source code or contact the development team.
