============================================================
STEP 3: ORDER-PRODUCT FLOW (AP BILL CREATION)
============================================================
📝 Creating bill with:
   Bill Number: TEST-BILL-2378
   Supplier: Office Supply Co.
   Product: ProBook 15 G10
   Quantity: 10, Unit Price: .00

--- Testing: Create Bill ---
   POST http://localhost:8080/api/ap/bills
   Request Body: {
  "billDate": "2025-06-16",
  "partyId": 3,
  "billLines": [
    {
      "lineTotal": 150.0,
      "productId": 1,
      "quantity": 10,
      "description": "Test product line item",
      "unitPrice": 15.0
    }
  ],
  "totalAmount": 150.0,
  "dueDate": "2025-07-16",
  "billNumber": "TEST-BILL-2378",
  "notes": "Automated test bill for AP order product flow"
}
✓ Create Bill - SUCCESS
🎉 Bill created successfully!
   Bill ID: 4
   Bill Number: TEST-BILL-2378
   Total Amount: 150

DEBUG: Bill creation response:
{
  "id": 4,
  "billNumber": "TEST-BILL-2378",
  "partyId": 3,
  "vendorName": "Office Supply Co.",
  "billDate": "2025-06-16",
  "dueDate": "2025-07-16",
  "status": "PENDING",
  "totalAmount": 150.0,
  "amountPaid": 0,
  "notes": "Automated test bill for AP order product flow",
  "billLines": [
    {
      "id": 3,
      "billId": 4,
      "productId": 1,
      "productName": "ProBook 15 G10",
      "description": "Test product line item",
      "quantity": 10,
      "unitPrice": 15.0,
      "lineTotal": 150.0
    }
  ],
  "payments": []
}
✅ Bill lines found in creation response: 1

⏳ Waiting for bill processing to complete...

--- Testing: Fetch Created Bill ---
   GET http://localhost:8080/api/ap/bills/4
✓ Fetch Created Bill - SUCCESS
DEBUG: billFetched object content:
{
  "id": 4,
  "billNumber": "TEST-BILL-2378",
  "partyId": 3,
  "vendorName": "Office Supply Co.",
  "billDate": "2025-06-16",
  "dueDate": "2025-07-16",
  "status": "PENDING",
  "totalAmount": 150.0,
  "amountPaid": 0.0,
  "notes": "Automated test bill for AP order product flow",
  "billLines": [
    {
      "id": 3,
      "billId": 4,
      "productId": 1,
      "productName": "ProBook 15 G10",
      "description": "Test product line item",
      "quantity": 10,
      "unitPrice": 15.0,
      "lineTotal": 150.0
    }
  ],
  "payments": []
}
✅ Bill validation successful:
   Lines Count: 1
   Status: PENDING
   First Line: Product 1, Qty 10, Price 15
✅ ORDER-PRODUCT FLOW: SUCCESSFUL

============================================================
STEP 4: IMPORT-PRODUCT RECEIPT FLOW
============================================================
📦 Testing goods receipt from vendor...
📦 Recording goods receipt with:
   Bill ID: 4
   Bill Line ID: 3
   Supplier: Office Supply Co.
   Accepted: 8, Rejected: 2
   Rejection Reason: Damaged goods

--- Testing: Goods Receipt ---
   POST http://localhost:8080/api/inventory/stock/goods-receipt
   Request Body: {
  "supplierId": 3,
  "referenceNumber": "GR-TEST-BILL-2378",
  "billId": 4,
  "lines": [
    {
      "rejectionReason": "Damaged goods - packaging compromised",
      "quantityRejected": 2,
      "quantityAccepted": 8,
      "billLineId": 3,
      "billId": 4,
      "productId": 1
    }
  ],
  "receivedBy": "test-user",
  "notes": "Automated test goods receipt"
}
✓ Goods Receipt - SUCCESS
✅ Goods receipt recorded successfully!
   Stock movements created: 1
   - Product 1: Qty 8, Type:
✅ IMPORT-PRODUCT RECEIPT FLOW: SUCCESSFUL
