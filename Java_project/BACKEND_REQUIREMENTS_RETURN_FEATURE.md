# Backend Requirements: Return Import Products Feature

## Overview

The frontend needs backend support for a stockledger-based return system. Returns should be based on actual received quantities (from stockledger RECEIPT entries) rather than original bill quantities.

## Core Principle

**Use stockledger as single source of truth** - don't modify original bills, calculate returnable quantities from stockledger movements.

## Required API Endpoints

### 1. Get Returnable Bills

```
GET /api/inventory/goods-returns/returnable-bills
Query Parameters: page, size, sort
```

**Purpose**: Get bills that have RECEIPT stockledger entries (goods actually received)

**SQL Logic**:

```sql
SELECT DISTINCT b.*, COUNT(sl.id) as receipt_count, SUM(sl.quantity) as total_received
FROM bills b
JOIN stock_ledger sl ON b.id = sl.reference_document_id
WHERE sl.movement_type = 'RECEIPT'
GROUP BY b.id
ORDER BY b.bill_date DESC
```

**Response**:

```json
{
  "content": [
    {
      "id": 123,
      "billNumber": "PO-2024-001",
      "supplierName": "ABC Supplier",
      "billDate": "2024-06-15",
      "totalAmount": 150000,
      "totalLines": 5,
      "receiptCount": 3,
      "totalReceived": 100
    }
  ],
  "totalElements": 25,
  "totalPages": 3,
  "page": 0,
  "size": 10
}
```

### 2. Search Returnable Bills

```
GET /api/inventory/goods-returns/returnable-bills/search
Query Parameters: billNumber, vendorName, fromDate, toDate, page, size, sort
```

**Purpose**: Search returnable bills with filters

**SQL Logic**: Same as above + WHERE filters for billNumber, vendorName, date range

### 3. Get Bill Details for Return

```
GET /api/inventory/goods-returns/returnable-bills/{billId}
```

**Purpose**: Get bill details with calculated returnable quantities per product

**SQL Logic**:

```sql
SELECT
  sl.product_id,
  p.name as product_name,
  SUM(CASE WHEN sl.movement_type = 'RECEIPT' THEN sl.quantity ELSE 0 END) as received_qty,
  SUM(CASE WHEN sl.movement_type = 'RETURN' THEN sl.quantity ELSE 0 END) as returned_qty,
  (SUM(CASE WHEN sl.movement_type = 'RECEIPT' THEN sl.quantity ELSE 0 END) -
   SUM(CASE WHEN sl.movement_type = 'RETURN' THEN sl.quantity ELSE 0 END)) as returnable_qty
FROM stock_ledger sl
JOIN products p ON sl.product_id = p.id
WHERE sl.reference_document_id = :billId
GROUP BY sl.product_id, p.name
HAVING returnable_qty > 0
```

**Response**:

```json
{
  "id": 123,
  "billNumber": "PO-2024-001",
  "supplierName": "ABC Supplier",
  "supplierId": 45,
  "billDate": "2024-06-15",
  "totalAmount": 150000,
  "lines": [
    {
      "id": 1,
      "productId": 67,
      "productName": "Product A",
      "unitPrice": 25000,
      "orderedQuantity": 10,
      "receivedQuantity": 8,
      "returnedQuantity": 2,
      "maxQuantity": 6
    }
  ]
}
```

### 4. Create Return (Enhanced Existing)

```
POST /api/inventory/goods-returns
```

**Purpose**: Process return and create RETURN stockledger entries

**Request**:

```json
{
  "billId": 123,
  "supplierId": 45,
  "returnDate": "2024-06-20",
  "returnedBy": "John Doe",
  "notes": "Defective items",
  "lines": [
    {
      "productId": 67,
      "quantity": 3,
      "unitPrice": 25000,
      "reason": "Quality issues",
      "originalLineId": 1
    }
  ]
}
```

**Business Logic**:

1. Validate returnable quantities against stockledger
2. Create return record
3. Create RETURN stockledger entries with `reference_document_id = billId`
4. Update inventory levels

## Key Database Changes

### Required Indexes

```sql
CREATE INDEX idx_stock_ledger_reference_movement
ON stock_ledger(reference_document_id, movement_type);

CREATE INDEX idx_stock_ledger_product_movement
ON stock_ledger(product_id, movement_type);
```

### StockLedger Entry for Returns

- `movement_type` = 'RETURN'
- `reference_document_id` = original bill ID (not return ID)
- `return_id` = return record ID (for linking)
- `quantity` = returned quantity
- `reason` = return reason

## Data Validation Requirements

1. **Quantity Validation**: Return quantity ≤ (Received quantity - Already returned quantity)
2. **Bill Validation**: Only bills with RECEIPT stockledger entries can be returned
3. **Product Validation**: Only products that were actually received can be returned

## Current Frontend Status

✅ **Frontend is ready** with temporary fallback using existing stockledger endpoints  
⚠️ **Waiting for backend** to implement proper aggregated endpoints  
🔄 **Will switch to new endpoints** once available

## Architecture Benefits

- ✅ Original bills never modified (data integrity)
- ✅ Returns based on actual received quantities (accuracy)
- ✅ Full audit trail through stockledger (compliance)
- ✅ Supports partial receipts and returns (flexibility)

## Questions for Backend Team

1. **Do current stockledger tables support `reference_document_id` field?**
2. **Is `movement_type` enum already defined with RECEIPT/RETURN values?**
3. **Are there existing aggregation queries in stockledger service?**
4. **What's the estimated timeline for implementing these endpoints?**
5. **Any concerns about the proposed database indexes?**

---

**Priority**: High - Feature is architecturally complete on frontend, just needs backend support  
**Complexity**: Medium - Mainly aggregation queries + validation logic  
**Impact**: Enables proper return tracking without compromising data integrity
