# Stock Check Results API Documentation for Frontend

## Overview

This document provides comprehensive API documentation for the Stock Check Results endpoints in the Supermarket Warehouse Inventory Management System. These APIs enable frontend applications to manage stock checking operations, view results, and create new stock check records.

**Base URL**: `/api/inventory/stock-check-results`

**Content-Type**: `application/json`

**CORS**: Enabled for all origins with max age of 3600 seconds

---

## 1. Get All Stock Check Results

### Endpoint

```
GET /api/inventory/stock-check-results
```

### Description

Retrieves a paginated list of all stock check results in the system, sorted by check timestamp in descending order by default.

### Query Parameters

| Parameter | Type    | Required | Default        | Description                                                  |
| --------- | ------- | -------- | -------------- | ------------------------------------------------------------ |
| `page`    | integer | No       | 0              | Zero-based page number                                       |
| `size`    | integer | No       | 20             | Number of items per page                                     |
| `sort`    | string  | No       | checkTimestamp | Field to sort by. Can be comma-separated for multiple fields |

### Example Request

```http
GET /api/inventory/stock-check-results?page=0&size=10&sort=checkTimestamp,desc
```

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Stock check results retrieved successfully",
  "data": {
    "content": [
      {
        "id": 1,
        "productId": 101,
        "productName": "Apple iPhone 14",
        "warehouseId": 1,
        "checkTimestamp": "2025-06-17T14:30:00",
        "expectedQuantity": 100.0,
        "actualQuantity": 98.0,
        "variance": -2.0,
        "checkStatus": "SHORTAGE",
        "checkedBy": "John Doe",
        "checkReference": "CHK-2025-001",
        "notes": "Found 2 units missing during routine check",
        "processed": false,
        "approvedBy": null,
        "approvedAt": null,
        "createdAt": "2025-06-17T14:30:00",
        "updatedAt": "2025-06-17T14:30:00"
      },
      {
        "id": 2,
        "productId": 102,
        "productName": "Samsung Galaxy S24",
        "warehouseId": 1,
        "checkTimestamp": "2025-06-17T15:45:00",
        "expectedQuantity": 50.0,
        "actualQuantity": 50.0,
        "variance": 0.0,
        "checkStatus": "MATCH",
        "checkedBy": "Jane Smith",
        "checkReference": "CHK-2025-002",
        "notes": "Perfect match - no discrepancy",
        "processed": false,
        "approvedBy": null,
        "approvedAt": null,
        "createdAt": "2025-06-17T15:45:00",
        "updatedAt": "2025-06-17T15:45:00"
      }
    ],
    "pageable": {
      "pageNumber": 0,
      "pageSize": 10,
      "sort": {
        "sorted": true,
        "orderBy": ["checkTimestamp"],
        "direction": "DESC"
      }
    },
    "totalElements": 45,
    "totalPages": 5,
    "last": false,
    "first": true,
    "numberOfElements": 10,
    "size": 10,
    "number": 0,
    "empty": false
  }
}
```

### Error Responses

**400 Bad Request** - Invalid pagination parameters

```json
{
  "success": false,
  "message": "Invalid pagination parameters",
  "data": null
}
```

**500 Internal Server Error** - Server error

```json
{
  "success": false,
  "message": "Internal server error occurred",
  "data": null
}
```

---

## 2. Get Stock Check Result by ID

### Endpoint

```
GET /api/inventory/stock-check-results/{id}
```

### Description

Retrieves a specific stock check result by its unique identifier.

### Path Parameters

| Parameter | Type | Required | Description                                     |
| --------- | ---- | -------- | ----------------------------------------------- |
| `id`      | long | Yes      | The unique identifier of the stock check result |

### Example Request

```http
GET /api/inventory/stock-check-results/1
```

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Stock check result retrieved successfully",
  "data": {
    "id": 1,
    "productId": 101,
    "productName": "Apple iPhone 14",
    "warehouseId": 1,
    "checkTimestamp": "2025-06-17T14:30:00",
    "expectedQuantity": 100.0,
    "actualQuantity": 98.0,
    "variance": -2.0,
    "checkStatus": "SHORTAGE",
    "checkedBy": "John Doe",
    "checkReference": "CHK-2025-001",
    "notes": "Found 2 units missing during routine check",
    "processed": false,
    "approvedBy": null,
    "approvedAt": null,
    "createdAt": "2025-06-17T14:30:00",
    "updatedAt": "2025-06-17T14:30:00"
  }
}
```

### Error Responses

**404 Not Found** - Stock check result not found

```json
{
  "success": false,
  "message": "StockCheckResult not found with id: 999",
  "data": null
}
```

**400 Bad Request** - Invalid ID format

```json
{
  "success": false,
  "message": "Invalid ID format",
  "data": null
}
```

---

## 3. Perform New Stock Check and Create Result Record

### Endpoint

```
POST /api/inventory/stock-check-results/perform-check
```

### Description

Performs a new stock check for a product by comparing expected quantity with actual inventory quantity and creates a result record. The system automatically calculates variance and determines the check status.

### Request Body

```json
{
  "productId": 101,
  "expectedQuantity": 100.0,
  "checkedBy": "John Doe",
  "checkReference": "CHK-2025-003",
  "notes": "Monthly inventory check"
}
```

### Request Body Parameters

| Field              | Type    | Required | Validation    | Description                                |
| ------------------ | ------- | -------- | ------------- | ------------------------------------------ |
| `productId`        | long    | Yes      | NotNull       | The ID of the product to check             |
| `expectedQuantity` | decimal | Yes      | NotNull, >= 0 | The expected quantity in stock             |
| `checkedBy`        | string  | Yes      | NotBlank      | Name/ID of the user performing the check   |
| `checkReference`   | string  | No       | -             | Optional reference number for the check    |
| `notes`            | string  | No       | -             | Optional notes or comments about the check |

### Example Request

```http
POST /api/inventory/stock-check-results/perform-check
Content-Type: application/json

{
  "productId": 101,
  "expectedQuantity": 100.0,
  "checkedBy": "John Doe",
  "checkReference": "CHK-2025-003",
  "notes": "Monthly inventory check"
}
```

### Success Response (201 Created)

```json
{
  "success": true,
  "message": "Stock check performed successfully",
  "data": {
    "result": {
      "id": 3,
      "productId": 101,
      "productName": "Apple iPhone 14",
      "warehouseId": 1,
      "checkTimestamp": "2025-06-17T16:20:00",
      "expectedQuantity": 100.0,
      "actualQuantity": 103.0,
      "variance": 3.0,
      "checkStatus": "OVERAGE",
      "checkedBy": "John Doe",
      "checkReference": "CHK-2025-003",
      "notes": "Monthly inventory check",
      "processed": false,
      "approvedBy": null,
      "approvedAt": null,
      "createdAt": "2025-06-17T16:20:00",
      "updatedAt": "2025-06-17T16:20:00"
    },
    "message": "Stock check completed with overage of 3.0 units",
    "success": true
  }
}
```

### Error Responses

**400 Bad Request** - Validation errors

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "productId",
      "message": "Product ID is required"
    },
    {
      "field": "expectedQuantity",
      "message": "Expected quantity is required"
    },
    {
      "field": "checkedBy",
      "message": "Checked by is required"
    }
  ]
}
```

**400 Bad Request** - Product not found

```json
{
  "success": false,
  "message": "Product not found with ID: 999",
  "data": null
}
```

**500 Internal Server Error** - Server error during stock check

```json
{
  "success": false,
  "message": "Internal error performing stock check: Database connection failed",
  "data": null
}
```

---

## Data Models

### StockCheckResultDto

```json
{
  "id": "long - Unique identifier",
  "productId": "long - Product identifier",
  "productName": "string - Product name for display",
  "warehouseId": "long - Warehouse identifier",
  "checkTimestamp": "datetime - When the check was performed (ISO 8601)",
  "expectedQuantity": "decimal - Expected quantity in stock",
  "actualQuantity": "decimal - Actual quantity found",
  "variance": "decimal - Difference (actual - expected)",
  "checkStatus": "enum - MATCH, SHORTAGE, or OVERAGE",
  "checkedBy": "string - User who performed the check",
  "checkReference": "string - Optional reference number",
  "notes": "string - Optional notes or comments",
  "processed": "boolean - Whether variance has been processed",
  "approvedBy": "string - User who approved processing (if any)",
  "approvedAt": "datetime - When processing was approved (if any)",
  "createdAt": "datetime - Record creation timestamp",
  "updatedAt": "datetime - Last update timestamp"
}
```

### CheckStatus Enum Values

- **MATCH**: Expected and actual quantities are identical
- **SHORTAGE**: Actual quantity is less than expected (negative variance)
- **OVERAGE**: Actual quantity is greater than expected (positive variance)

---

## Frontend Implementation Guidelines

### 1. Pagination Handling

```javascript
// Example pagination request
const fetchStockCheckResults = async (page = 0, size = 20) => {
  const response = await fetch(
    `/api/inventory/stock-check-results?page=${page}&size=${size}&sort=checkTimestamp,desc`
  );
  const data = await response.json();
  return data;
};
```

### 2. Error Handling

```javascript
const handleApiResponse = async (response) => {
  const data = await response.json();

  if (!data.success) {
    if (data.errors) {
      // Handle validation errors
      data.errors.forEach((error) => {
        console.error(`${error.field}: ${error.message}`);
      });
    } else {
      // Handle general errors
      console.error(data.message);
    }
    throw new Error(data.message);
  }

  return data.data;
};
```

### 3. Stock Check Creation

```javascript
const performStockCheck = async (stockCheckData) => {
  try {
    const response = await fetch(
      "/api/inventory/stock-check-results/perform-check",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(stockCheckData),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await handleApiResponse(response);
    return result;
  } catch (error) {
    console.error("Error performing stock check:", error);
    throw error;
  }
};
```

### 4. Status Color Coding

```javascript
const getStatusColor = (status) => {
  switch (status) {
    case "MATCH":
      return "#28a745"; // Green
    case "SHORTAGE":
      return "#dc3545"; // Red
    case "OVERAGE":
      return "#ffc107"; // Yellow
    default:
      return "#6c757d"; // Gray
  }
};
```

---

## Notes for Frontend Developers

1. **DateTime Format**: All datetime fields use ISO 8601 format (YYYY-MM-DDTHH:mm:ss)
2. **Decimal Precision**: Quantity and variance fields support up to 3 decimal places
3. **Pagination**: Uses Spring Boot's standard pagination format with zero-based page numbers
4. **CORS**: API supports cross-origin requests from any domain
5. **Validation**: Server-side validation is enforced; client-side validation should mirror these rules
6. **Status Calculation**: Check status and variance are automatically calculated by the server
7. **Processing**: Stock check results with variances (SHORTAGE/OVERAGE) can be processed separately
8. **References**: Check references are optional but recommended for audit trails

### Recommended UI Components

- Data tables with pagination for result listings
- Forms with validation for stock check creation
- Status badges with color coding
- Modal dialogs for detailed result views
- Search and filter functionality for large datasets
- Dashboard widgets for summary statistics
