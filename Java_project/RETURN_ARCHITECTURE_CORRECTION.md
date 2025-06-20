# Return Import Products - Corrected Architecture

## Problem Identified

The initial implementation was based on a flawed assumption about the system architecture:

### ❌ **Incorrect Assumption**

- Assumed there were separate "goods receipt" records to search and return from
- Tried to update bill status to track what could be returned
- Used bill management service to find "received" bills

### ✅ **Actual Architecture**

- Import process only creates **stockledger movements** with type "RECEIPT"
- Original **product order bills remain unchanged** (preserving data integrity)
- Bills are used as **reference only** during import to determine accepted/rejected quantities
- All inventory tracking happens through the **stockledger system**

## Corrected Solution: StockLedger-Based Returns

### Core Principle

**Use stockledger as the single source of truth for what can be returned**

### How It Works

1. **Find Returnable Bills**

   - Query bills that have associated RECEIPT stockledger entries
   - These are bills where goods have actually been received into inventory

2. **Calculate Received Quantities**

   - Aggregate stockledger RECEIPT movements to get actual received quantities per product
   - This gives the true "received" amount, which may differ from "ordered" amount

3. **Calculate Returnable Quantities**

   - Formula: `Returnable = Received - Already Returned`
   - Subtract any existing RETURN stockledger movements from received quantities

4. **Process Returns**
   - Create RETURN stockledger entries that reference the original bill
   - Maintain full audit trail without modifying source documents

### New API Endpoints Required

```javascript
// Backend endpoints needed:
GET /api/inventory/goods-returns/returnable-bills
GET /api/inventory/goods-returns/returnable-bills/search
GET /api/inventory/goods-returns/returnable-bills/{billId}
POST /api/inventory/goods-returns (existing, but with stockledger integration)
```

### Database Logic

```sql
-- Find bills with received goods (bills that have RECEIPT stockledger entries)
SELECT DISTINCT b.*,
       COUNT(sl.id) as receipt_count,
       SUM(sl.quantity) as total_received
FROM bills b
JOIN stock_ledger sl ON b.id = sl.reference_document_id
WHERE sl.movement_type = 'RECEIPT'
GROUP BY b.id

-- Calculate returnable quantities for a specific bill
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

### Updated Frontend Implementation

#### Service Layer Changes

- `searchReturnableBills()` - Now queries stockledger-based endpoint _(temporary fallback active)_
- `getReturnableBills()` - Gets bills with RECEIPT stockledger entries _(temporary fallback active)_
- `getBillForReturn()` - Returns bill with calculated returnable quantities _(temporary fallback active)_

#### Temporary Fallback Implementation

Until the backend endpoints are ready, the service uses:

```javascript
// Uses existing stockledger service to find RECEIPT movements
const { getStockMovementsByType } = await import("../stockLedgerService.js");

// Gets bills that have received goods
const receiptMovements = await getStockMovementsByType("RECEIPT");

// Calculates returnable quantities by aggregating movements
const returnMovements = await getStockMovementsByType("RETURN");
```

#### Form Changes

- Displays "Đã nhận" (received) instead of "Đã nhập" (ordered)
- Shows "Đã trả" (already returned) quantities
- Calculates returnable quantities based on stockledger data
- Validates against actual received amounts, not ordered amounts

#### Data Flow

```
Original Bill → Stockledger RECEIPT → Calculate Received Quantities
                     ↓
Return Form ← Calculate Returnable ← Subtract Existing RETURN entries
                     ↓
Submit Return → Create RETURN Stockledger Entry → Update Inventory
```

## Benefits of This Approach

### ✅ **Data Integrity**

- Original bills never modified
- Complete separation of ordering and inventory tracking
- Full audit trail maintained

### ✅ **Accuracy**

- Returns based on actual received quantities
- Handles partial receipts correctly
- Accounts for previously returned items

### ✅ **Architectural Consistency**

- Aligns with existing stockledger-based inventory system
- Maintains single source of truth for inventory movements
- Follows established patterns

### ✅ **Flexibility**

- Supports partial returns
- Handles complex scenarios (partial receipts, multiple returns)
- Easy to extend for additional movement types

## Implementation Status

### ✅ **Completed**

- Updated service methods to use stockledger-based endpoints
- Modified form to show received vs returnable quantities
- Updated validation logic
- Corrected data flow architecture
- **Added temporary fallback implementation** using existing stockledger service

### 🔄 **Current Status: Temporary Fallback Active**

Since the backend stockledger-based endpoints are not yet implemented, the frontend now uses a **temporary fallback solution**:

- **`getReturnableBills()`**: Uses `getStockMovementsByType("RECEIPT")` to find bills with received goods
- **`searchReturnableBills()`**: Filters the returnable bills based on search criteria
- **`getBillForReturn()`**: Combines bill data with stockledger movements to calculate returnable quantities
- **User Notice**: Added warning in the UI about temporary implementation

This fallback ensures the feature works immediately while maintaining the correct architecture.

### 🔄 **Pending Backend Implementation**

- Backend API endpoints for stockledger-based bill queries
- Optimized stockledger aggregation logic
- Return processing with stockledger integration
- Remove temporary fallback once endpoints are ready

### 📋 **Next Steps**

1. Implement backend endpoints for stockledger-based queries
2. Test end-to-end return flow with actual stockledger data
3. Verify quantity calculations are accurate
4. Update documentation for other developers

## Key Learnings

This correction highlights the importance of:

1. **Understanding the actual data architecture** before implementing features
2. **Maintaining data integrity** by not modifying source documents
3. **Using the appropriate source of truth** for each type of calculation
4. **Aligning with existing system patterns** rather than creating new approaches

The corrected implementation now properly leverages the stockledger system as the foundation for return processing, ensuring data accuracy and architectural consistency.
