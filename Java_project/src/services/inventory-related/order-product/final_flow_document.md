# Bill Management & Purchase Order Frontend API Documentation

## Overview

This document provides comprehensive API documentation for frontend developers to implement bill management and purchase order functionality. The system supports a complete workflow from low stock alerts to purchase order creation and bill management.

## Base URLs

- **Bill Management**: `/api/ap/bills`
- **Purchase Orders**: `/api/ap/purchase-orders`

---

## Complete Workflow

### 1. Purchase Order Workflow

1. **Get Low Stock Alerts** → Display products needing restocking
2. **Create Purchase Order** → User selects products and creates order
3. **View Created Bills** → Purchase orders appear in bill management system

### 2. Bill Management

- View all bills (with pagination)
- Search bills by ID or bill number
- View overdue bills
- Track outstanding amounts
- Make payments
- Create manual bills
- Delete bills

---

## Bill Management APIs

### 1. Get All Bills (Paginated)

**Endpoint:** `GET /api/ap/bills`

**Description:** Retrieve all bills with pagination support. Perfect for displaying bills in a table with pagination controls.

**Query Parameters:**

```
page=0          // Page number (0-based)
size=20         // Number of items per page
sort=billDate,desc  // Sort by field and direction
```

**Request Example:**

```
GET /api/ap/bills?page=0&size=10&sort=billDate,desc
```

**Response (200 OK):**

```json
{
  "content": [
    {
      "id": 1,
      "billNumber": "PO-2025-000001",
      "partyId": 5,
      "vendorName": "ABC Wholesale Supplies",
      "billDate": "2025-06-19",
      "dueDate": "2025-07-19",
      "status": "PENDING",
      "totalAmount": 1250.75,
      "amountPaid": 0.0,
      "notes": "Monthly restocking order",
      "billLines": [
        {
          "id": 101,
          "billId": 1,
          "productId": 15,
          "productName": "Coca Cola 330ml",
          "description": "Soft drink - 330ml cans",
          "quantity": 100,
          "unitPrice": 12.5,
          "lineTotal": 1250.0
        }
      ],
      "payments": []
    }
  ],
  "pageable": {
    "sort": {
      "sorted": true,
      "unsorted": false
    },
    "pageNumber": 0,
    "pageSize": 10
  },
  "totalElements": 25,
  "totalPages": 3,
  "first": true,
  "last": false,
  "numberOfElements": 10
}
```

**Frontend Implementation Notes:**

- Use `totalElements` for showing "Showing X of Y records"
- Use `totalPages` for pagination controls
- Use `first` and `last` for enabling/disabling navigation buttons

---

### 2. Get Bill by ID

**Endpoint:** `GET /api/ap/bills/{id}`

**Description:** Retrieve a specific bill with all details including line items and payments.

**Path Parameters:**

- `id` (Long): Bill ID

**Request Example:**

```
GET /api/ap/bills/1
```

**Response (200 OK):**

```json
{
  "id": 1,
  "billNumber": "PO-2025-000001",
  "partyId": 5,
  "vendorName": "ABC Wholesale Supplies",
  "billDate": "2025-06-19",
  "dueDate": "2025-07-19",
  "status": "PENDING",
  "totalAmount": 1250.75,
  "amountPaid": 0.0,
  "notes": "Monthly restocking order",
  "billLines": [
    {
      "id": 101,
      "billId": 1,
      "productId": 15,
      "productName": "Coca Cola 330ml",
      "description": "Soft drink - 330ml cans",
      "quantity": 100,
      "unitPrice": 12.5,
      "lineTotal": 1250.0
    }
  ],
  "payments": [
    {
      "id": 201,
      "billId": 1,
      "paymentDate": "2025-06-20",
      "amount": 500.0,
      "paymentMethod": "BANK_TRANSFER",
      "referenceNumber": "TXN-20250620-001"
    }
  ]
}
```

**Error Response (404 Not Found):**

```json
{
  "error": "Bill not found with id: 1",
  "timestamp": "2025-06-19T10:30:00"
}
```

---

### 3. Get Bill by Number

**Endpoint:** `GET /api/ap/bills/number/{billNumber}`

**Description:** Search for a specific bill using its bill number. Useful for implementing search functionality.

**Path Parameters:**

- `billNumber` (String): Bill number (e.g., "PO-2025-000001")

**Request Example:**

```
GET /api/ap/bills/number/PO-2025-000001
```

**Response:** Same format as Get Bill by ID

---

### 4. Get Overdue Bills

**Endpoint:** `GET /api/ap/bills/overdue`

**Description:** Retrieve all bills that are past their due date. Perfect for alerts and overdue reports.

**Request Example:**

```
GET /api/ap/bills/overdue
```

**Response (200 OK):**

```json
[
  {
    "id": 3,
    "billNumber": "PO-2025-000003",
    "partyId": 7,
    "vendorName": "Overdue Supplier Inc",
    "billDate": "2025-05-15",
    "dueDate": "2025-06-15",
    "status": "OVERDUE",
    "totalAmount": 850.00,
    "amountPaid": 200.00,
    "notes": "Urgent payment required",
    "billLines": [...],
    "payments": [...]
  }
]
```

---

### 5. Get Total Outstanding Amount

**Endpoint:** `GET /api/ap/bills/outstanding-amount`

**Description:** Get the total amount owed across all unpaid bills. Perfect for dashboard summaries.

**Request Example:**

```
GET /api/ap/bills/outstanding-amount
```

**Response (200 OK):**

```json
15750.25
```

---

### 6. Create Manual Bill

**Endpoint:** `POST /api/ap/bills`

**Description:** Create a bill manually (not through purchase order process). Useful for one-off vendor bills.

**Request Headers:**

```
Content-Type: application/json
```

**Request Body:**

```json
{
  "billNumber": "MANUAL-2025-001",
  "partyId": 5,
  "billDate": "2025-06-19",
  "dueDate": "2025-07-19",
  "status": "PENDING",
  "notes": "Manual entry for utilities bill",
  "billLines": [
    {
      "productId": 25,
      "description": "Office supplies",
      "quantity": 1,
      "unitPrice": 150.0
    }
  ]
}
```

**Response (201 Created):**

```json
{
  "id": 15,
  "billNumber": "MANUAL-2025-001",
  "partyId": 5,
  "vendorName": "ABC Wholesale Supplies",
  "billDate": "2025-06-19",
  "dueDate": "2025-07-19",
  "status": "PENDING",
  "totalAmount": 150.00,
  "amountPaid": 0.00,
  "notes": "Manual entry for utilities bill",
  "billLines": [...],
  "payments": []
}
```

---

### 7. Update Bill

**Endpoint:** `PUT /api/ap/bills/{id}`

**Description:** Update an existing bill. Useful for editing bill details before approval.

**Path Parameters:**

- `id` (Long): Bill ID

**Request Body:** Same format as Create Bill

**Response (200 OK):** Same format as Get Bill by ID

---

### 8. Make Payment

**Endpoint:** `POST /api/ap/bills/{id}/pay`

**Description:** Record a payment against a bill. The system will automatically calculate remaining balance.

**Path Parameters:**

- `id` (Long): Bill ID

**Query Parameters:**

- `amount` (BigDecimal): Payment amount

**Request Example:**

```
POST /api/ap/bills/1/pay?amount=500.00
```

**Response (200 OK):**

```json
{
  "id": 1,
  "billNumber": "PO-2025-000001",
  "partyId": 5,
  "vendorName": "ABC Wholesale Supplies",
  "billDate": "2025-06-19",
  "dueDate": "2025-07-19",
  "status": "PARTIALLY_PAID",
  "totalAmount": 1250.75,
  "amountPaid": 500.00,
  "notes": "Monthly restocking order",
  "billLines": [...],
  "payments": [
    {
      "id": 201,
      "billId": 1,
      "paymentDate": "2025-06-19",
      "amount": 500.00,
      "paymentMethod": "BANK_TRANSFER",
      "referenceNumber": "AUTO-GENERATED"
    }
  ]
}
```

---

### 9. Delete Bill

**Endpoint:** `DELETE /api/ap/bills/{id}`

**Description:** Delete a bill. Use with caution - typically only for cancelled or erroneous bills.

**Path Parameters:**

- `id` (Long): Bill ID

**Request Example:**

```
DELETE /api/ap/bills/1
```

**Response (204 No Content):** Empty response body

---

## Purchase Order Workflow APIs

### 1. Get Low Stock Alerts

**Endpoint:** `GET /api/ap/purchase-orders/low-stock-alerts`

**Description:** Get products that are at or below their reorder level. This is the starting point for the purchase order workflow.

**Request Example:**

```
GET /api/ap/purchase-orders/low-stock-alerts
```

**Response (200 OK):**

```json
[
  {
    "productId": 15,
    "productName": "Coca Cola 330ml",
    "currentStock": 25.0,
    "reorderLevel": 100.0,
    "maxStock": 500.0,
    "alertLevel": "LOW",
    "lastUpdated": "2025-06-19T10:30:00",
    "suggestedOrderQuantity": 200
  },
  {
    "productId": 23,
    "productName": "Office Paper A4",
    "currentStock": 5.0,
    "reorderLevel": 50.0,
    "maxStock": 200.0,
    "alertLevel": "CRITICAL",
    "lastUpdated": "2025-06-19T09:15:00",
    "suggestedOrderQuantity": 150
  }
]
```

---

### 2. Create Purchase Order

**Endpoint:** `POST /api/ap/purchase-orders`

**Description:** Create a purchase order from selected low stock products. This automatically creates a bill in the system.

**Request Headers:**

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
      "productId": 15,
      "productName": "Coca Cola 330ml",
      "description": "Soft drink - 330ml cans",
      "quantity": 200,
      "unitPrice": 12.5
    },
    {
      "productId": 23,
      "productName": "Office Paper A4",
      "description": "White copy paper, 500 sheets per pack",
      "quantity": 150,
      "unitPrice": 5.75
    }
  ]
}
```

**Response (201 Created):**

```json
{
  "billId": 45,
  "billNumber": "PO-2025-000045",
  "partyId": 5,
  "vendorName": "ABC Wholesale Supplies Ltd.",
  "billDate": "2025-06-19",
  "dueDate": "2025-07-19",
  "status": "PENDING",
  "totalAmount": 3362.5,
  "notes": "Monthly restocking for low inventory items",
  "orderLines": [
    {
      "id": 201,
      "productId": 15,
      "productName": "Coca Cola 330ml",
      "description": "Soft drink - 330ml cans",
      "quantity": 200,
      "unitPrice": 12.5,
      "lineTotal": 2500.0
    },
    {
      "id": 202,
      "productId": 23,
      "productName": "Office Paper A4",
      "description": "White copy paper, 500 sheets per pack",
      "quantity": 150,
      "unitPrice": 5.75,
      "lineTotal": 862.5
    }
  ]
}
```

**Important Note:** The `billId` returned from this endpoint can be used to fetch the bill details using the Bill Management APIs.

---

## Frontend Implementation Guide

### 1. Purchase Order Workflow Implementation

```javascript
// Step 1: Get low stock alerts
const getLowStockAlerts = async () => {
  const response = await fetch("/api/ap/purchase-orders/low-stock-alerts");
  return await response.json();
};

// Step 2: Create purchase order from selected products
const createPurchaseOrder = async (orderData) => {
  const response = await fetch("/api/ap/purchase-orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(orderData),
  });
  return await response.json();
};

// Step 3: Redirect to bill details or refresh bill list
const handleOrderCreated = (orderResponse) => {
  // Option 1: Navigate to bill details page
  window.location.href = `/bills/${orderResponse.billId}`;

  // Option 2: Refresh bill list if on bills page
  // refreshBillList();
};
```

### 2. Bill Management Implementation

```javascript
// Get paginated bills for table display
const getBills = async (page = 0, size = 10, sort = "billDate,desc") => {
  const response = await fetch(
    `/api/ap/bills?page=${page}&size=${size}&sort=${sort}`
  );
  return await response.json();
};

// Search bill by number
const searchBillByNumber = async (billNumber) => {
  const response = await fetch(`/api/ap/bills/number/${billNumber}`);
  if (response.ok) {
    return await response.json();
  }
  return null;
};

// Make payment
const makePayment = async (billId, amount) => {
  const response = await fetch(`/api/ap/bills/${billId}/pay?amount=${amount}`, {
    method: "POST",
  });
  return await response.json();
};
```

### 3. Recommended UI Components

#### Bills Table Component

- **Columns**: Bill Number, Vendor, Date, Due Date, Status, Amount, Actions
- **Features**: Sorting, pagination, search by bill number
- **Actions**: View details, make payment, edit, delete

#### Purchase Order Wizard

- **Step 1**: Display low stock alerts with selection checkboxes
- **Step 2**: Edit quantities and prices for selected products
- **Step 3**: Select vendor and add notes
- **Step 4**: Review and create order

#### Bill Details Modal/Page

- **Sections**: Bill info, line items, payment history
- **Actions**: Make payment, edit bill, download/print

### 4. Status Handling

```javascript
const getBillStatusBadge = (status) => {
  const statusConfig = {
    PENDING: { class: "badge-warning", text: "Pending" },
    APPROVED: { class: "badge-success", text: "Approved" },
    PAID: { class: "badge-success", text: "Paid" },
    PARTIALLY_PAID: { class: "badge-info", text: "Partially Paid" },
    OVERDUE: { class: "badge-danger", text: "Overdue" },
    CANCELLED: { class: "badge-secondary", text: "Cancelled" },
  };
  return statusConfig[status] || { class: "badge-secondary", text: status };
};
```

### 5. Error Handling

```javascript
const handleApiError = (error, response) => {
  if (response.status === 404) {
    showNotification("Record not found", "error");
  } else if (response.status === 400) {
    showNotification("Invalid request data", "error");
  } else {
    showNotification("An error occurred. Please try again.", "error");
  }
};
```

### 6. Form Validation

#### Purchase Order Form

- **Required**: partyId, orderLines (min 1 item)
- **Validation**: quantity > 0, unitPrice > 0
- **Auto-calculation**: Line totals and order total

#### Bill Form

- **Required**: billNumber, partyId, billDate, dueDate
- **Validation**: dueDate >= billDate, totalAmount > 0

---

## Common Workflows

### 1. Complete Purchase Order Workflow

1. User navigates to "Create Purchase Order" page
2. System fetches and displays low stock alerts
3. User selects products and adjusts quantities/prices
4. User selects vendor and adds notes
5. System creates purchase order (bill)
6. User is redirected to bill details or bills list
7. New bill appears in bills table with "PENDING" status

### 2. Bill Payment Workflow

1. User searches/finds bill in bills table
2. User clicks "Make Payment" action
3. System shows payment form with current balance
4. User enters payment amount and submits
5. System updates bill status and payment history
6. Bill table refreshes with updated information

### 3. Bill Search and Filter

1. User can search by bill number using search input
2. User can filter by status using dropdown
3. User can filter by date range using date pickers
4. User can sort by any column in the table

---

## Best Practices

1. **Always handle loading states** - Show spinners during API calls
2. **Implement proper error handling** - Display user-friendly error messages
3. **Use confirmation dialogs** - For delete and payment actions
4. **Cache frequently used data** - Vendor lists, product information
5. **Implement real-time updates** - Refresh totals and status automatically
6. **Provide clear navigation** - Between purchase orders and bills
7. **Show calculation breakdowns** - Line totals, taxes, final amounts
8. **Implement bulk actions** - For processing multiple bills

This documentation provides all the necessary information for implementing a complete bill management and purchase order system on the frontend.
