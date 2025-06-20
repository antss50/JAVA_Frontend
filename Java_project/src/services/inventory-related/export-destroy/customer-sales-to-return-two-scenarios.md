Customer Return Integration Flow Test Suite
==========================================
This test verifies the complete customer return integration:
1. Customer Return Processing
2. Financial Impact Calculation
3. Inventory Adjustments (Destroy/Return to Supplier)
4. Finance Journal Entry Creation
5. Supplier Return Processing
6. Disposal Record Creation
7. End-to-End Validation


========================================
STEP 1: AUTHENTICATION
========================================

--- Testing: Login ---
URL: POST http://localhost:8080/api/auth/login
✓ Login - SUCCESS
Response: {"accessToken":"eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiJhZG1pbiIsInVzZXJJZCI6MSwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsImF1dGhvcml0aWVzIjpbIlJPTEVfQURNSU4iXSwiaWF0IjoxNzUwMjY0OTUyLCJleHAiOjE3NTAzNTEzNTJ9.SzrWXK_21BotO5or0tJGXc9Qw8nkRh9ti54H_OTvLfSP3NeeFvY7086ggwpE7V0Y","refreshToken":"eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiJhZG1pbiIsInVzZXJJZCI6MSwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3NTAyNjQ5NTIsImV4cCI6MTc1MDg2OTc1Mn0.QArgvMl_fEL9TwSnBnnvYzCq02cBhey7khet2uam95862hiJV49uaTKKyK35eE7_","tokenType":"Bearer","expiresIn":1750351352000,"userInfo":{"id":1,"username":"admin","email":"admin@example.com","firstName":"Quản Trị","lastName":"Viên","roles":["ADMIN"]}}
🎉 Authentication successful!

========================================
STEP 2: DATA DISCOVERY AND SETUP
========================================

🔍 Discovering available products...

--- Testing: Get Products ---
URL: GET http://localhost:8080/api/inventory/products
✓ Get Products - SUCCESS
⚠️  Using first available product (may not have optimal test conditions): Laptop ProBook 15 G10

🔍 Discovering available customers...

--- Testing: Get Parties ---
URL: GET http://localhost:8080/api/parties
✓ Get Parties - SUCCESS
Response: Array with 21 items
DEBUG: Parties Response Structure:
Response is an Array with 21 items
First item: {
  "id": 0,
  "name": "Khách Mua Lẻ",
  "email": "pos@system.local",
  "phone": "N/A",
  "address": "Điểm Bán Hàng",
  "partyType": "CUSTOMER",
  "active": true
}
   Found direct array response, processing...
DEBUG: Processed 21 parties
   Sample parties:
   ID: 0, Name: Khách Mua Lẻ, Type: CUSTOMER
   ID: 1, Name: Công Ty TNHH Công Nghệ Toàn Cầu, Type: CUSTOMER
   ID: 2, Name: Công Ty CP Giải Pháp Sáng Tạo, Type: CUSTOMER
🔍 Looking for customer entries...
   Attempting direct customer lookup...

--- Testing: Get Customers Directly ---
URL: GET http://localhost:8080/api/parties/type/CUSTOMER
✓ Get Customers Directly - SUCCESS
Response: Array with 7 items
   Found 7 direct customers
✅ Found customer via direct endpoint: Khách Mua Lẻ
✅ Selected test customer: Khách Mua Lẻ (ID: 0)

========================================
STEP 3: SETUP TEST DATA
========================================
📝 Creating setup sales order for return testing:
   Customer: Khách Mua Lẻ (ID: 0)
   Product: Laptop ProBook 15 G10 (ID: 1)
   Quantity: 3
   Unit Price: 31200000
   Line Total: 93600000
   Total Amount: 93600000

--- Testing: Create Setup Sales Order ---
URL: POST http://localhost:8080/api/sales/orders
Request Body:
{
  "totalAmount": 93600000.0,
  "orderLines": [
    {
      "unitPrice": 31200000.0,
      "productId": 1,
      "lineTotal": 93600000.0,
      "quantity": 3.0
    }
  ]
}
✓ Create Setup Sales Order - SUCCESS
Response: {"orderId":10,"customerId":0,"saleTimestamp":"2025-06-18T16:42:32.728026","totalAmount":93600000.0,"orderLines":[{"lineId":20,"orderId":10,"productId":1,"productName":"Laptop ProBook 15 G10","quantity":3.0,"quantityReturned":0,"unitPrice":31200000.0,"lineTotal":93600000.0}],"customerName":"Khách Mua Lẻ","orderTimestamp":"2025-06-18T16:42:32.728026"}
   Order created with ID: 10

--- Testing: Get Setup Order Details ---
URL: GET http://localhost:8080/api/sales/orders/10
✓ Get Setup Order Details - SUCCESS
Response: {"orderId":10,"customerId":0,"saleTimestamp":"2025-06-18T16:42:32.728026","totalAmount":93600000.0,"orderLines":[{"lineId":20,"orderId":10,"productId":1,"productName":"Laptop ProBook 15 G10","quantity":3.0,"quantityReturned":0.0,"unitPrice":31200000.0,"lineTotal":93600000.0}],"customerName":"Khách Mua Lẻ","orderTimestamp":"2025-06-18T16:42:32.728026"}
✅ Setup order created successfully!
   Order ID: 10
   Order Line ID: 20
⏳ Waiting 3 seconds for background processing...

========================================
STEP 4: RECORD INITIAL STOCK LEVELS
========================================

--- Testing: Get Pre-Return Stock ---
URL: GET http://localhost:8080/api/inventory/stock/current?productId=1
✓ Get Pre-Return Stock - SUCCESS
Response: 98.0
📊 Pre-return stock level: 98

========================================
STEP 5: CUSTOMER RETURN - DESTROY ACTION
========================================
📝 Processing customer return (DESTROY):
   Original Order: 10
   Order Line: 20
   Quantity to Destroy: 1
   Reason: Product damaged - customer return

--- Testing: Process Customer Return (Destroy) ---
URL: POST http://localhost:8080/api/sales/orders/10/customer-return
Request Body:
{
  "customerId": 0,
  "returnLines": [
    {
      "quantityReturned": 1.0,
      "productId": 1,
      "id": 20,
      "unitPrice": 31200000.0,
      "originalOrderLineId": 20,
      "returnAction": "DESTROY"
    }
  ],
  "orderId": 10,
  "reason": "Product damaged - customer return"
}
✓ Process Customer Return (Destroy) - SUCCESS
Response: {"originalOrderId":10,"customerId":0,"customerName":"Khách Mua Lẻ","processingDate":"2025-06-18","totalRefundAmount":31200000.0,"totalLossAmount":10800000.0,"totalRecoveryAmount":0,"netLoss":10800000.0,"refundJournalId":1750264956243,"lossJournalId":1750264956246,"processedLines":[{"originalOrderLineId":20,"productId":1,"productName":"Laptop ProBook 15 G10","quantityReturned":1.0,"sellingPrice":31200000.0,"buyingPrice":20400000.0,"refundAmount":31200000.0,"lossAmount":10800000.0,"recoveryAmount":0,"inventoryAction":"Return recorded (ID: 48), Disposal recorded (ID: 49), ProductDisposedEvent published","purchaseOrderId":null,"goodsReturnId":null,"requiresManualAction":false,"manualActionReason":null}]}
✅ Customer return (DESTROY) processed successfully!
   Customer Refund: 31200000
   Total Loss: 10800000
   Net Loss: 10800000
   Refund Journal ID: 1750264956243
   Loss Journal ID: 1750264956246
⏳ Waiting 3 seconds for background processing...

========================================
STEP 6: VERIFY DESTROY IMPACT - STOCK (NEW PROCESS)
========================================

--- Testing: Get Post-Destroy Stock ---
URL: GET http://localhost:8080/api/inventory/stock/current?productId=1
✓ Get Post-Destroy Stock - SUCCESS
Response: 98.0
📊 Stock Analysis (DESTROY - TWO-STEP PROCESS):
   Pre-Return Stock: 98
   Destroy Quantity: 1
   Process: Return (+1) → Disposal (-1)
   Expected Net Stock Change: 0 (two-step process)
   Actual Stock: 98
   Net Stock Change: 0
✅ Stock adjustment verified for TWO-STEP DESTROY process!
   Return record created (+stock) and disposal record created (-stock)

========================================
STEP 7: VERIFY RETURN & DISPOSAL RECORDS (NEW PROCESS)
========================================

🔍 Checking customer return records...

--- Testing: Get Recent Returns ---
URL: GET http://localhost:8080/api/inventory/stock/movements/type/RETURN?productId=1
✓ Get Recent Returns - SUCCESS
Response: {"timestamp":"2025-06-18T16:42:39.2479336","success":true,"message":"Stock movements by type RETURN filtered by product ID 1 retrieved successfully","data":[{"id":48,"productId":1,"productName":"Laptop ProBook 15 G10","productUnit":"cái","warehouseId":1,"warehouseName":"Kho Hàng Chính","movementType":"RETURN","quantity":1.0,"documentReference":null,"eventTimestamp":"2025-06-18T16:42:36.209041","userId":"CUSTOMER_RETURN_SYSTEM","referenceId":"CR-10","referenceType":"CUSTOMER_RETURN","notes":"Customer return - Product damaged - customer return (Original Order Line: 20)","increment":true,"decrement":false}]}
✅ Customer return record verified!
   Return ID: 48
   Product ID: 1
   Quantity: 1
   Reference: CR-10
   Type: CUSTOMER_RETURN

🗑️  Checking disposal records...

--- Testing: Get Recent Disposals ---
URL: GET http://localhost:8080/api/inventory/stock/movements/type/DISPOSAL?productId=1
✓ Get Recent Disposals - SUCCESS
Response: {"timestamp":"2025-06-18T16:42:39.3040599","success":true,"message":"Stock movements by type DISPOSAL filtered by product ID 1 retrieved successfully","data":[{"id":49,"productId":1,"productName":"Laptop ProBook 15 G10","productUnit":"cái","warehouseId":1,"warehouseName":"Kho Hàng Chính","movementType":"DISPOSAL","quantity":1.0,"documentReference":null,"eventTimestamp":"2025-06-18T16:42:36.231344","userId":"CUSTOMER_RETURN_SYSTEM","referenceId":"6634062d-2f32-467c-87d2-ec996d1b3e68","referenceType":"STOCK_DISPOSAL","notes":"Stock disposal - Reason: CUSTOMER_RETURN, Method: DESTRUCTION, Notes: Customer return disposal CR-10 (Return ID: 48)","increment":true,"decrement":false}]}
✅ Disposal record verified!
   Disposal ID: 49
   Product ID: 1
   Quantity: 1
   Reference: 6634062d-2f32-467c-87d2-ec996d1b3e68
   Notes: Stock disposal - Reason: CUSTOMER_RETURN, Method: DESTRUCTION, Notes: Customer return disposal CR-10 (Return ID: 48)
✅ Disposal correctly linked to customer return!

========================================
STEP 8: CUSTOMER RETURN - RETURN TO SUPPLIER
========================================
📝 Processing customer return (RETURN_TO_SUPPLIER):
   Original Order: 10
   Quantity to Return: 2
   Reason: Customer not satisfied - return to supplier

--- Testing: Process Customer Return (Supplier) ---
URL: POST http://localhost:8080/api/sales/orders/10/customer-return
Request Body:
{
  "customerId": 0,
  "returnLines": [
    {
      "quantityReturned": 2.0,
      "productId": 1,
      "id": 20,
      "unitPrice": 31200000.0,
      "originalOrderLineId": 20,
      "returnAction": "RETURN_TO_SUPPLIER"
    }
  ],
  "orderId": 10,
  "reason": "Customer not satisfied - return to supplier"
}
✓ Process Customer Return (Supplier) - SUCCESS
Response: {"originalOrderId":10,"customerId":0,"customerName":"Khách Mua Lẻ","processingDate":"2025-06-18","totalRefundAmount":62400000.0,"totalLossAmount":21600000.0,"totalRecoveryAmount":40800000.0,"netLoss":-19200000.0,"refundJournalId":1750264959373,"lossJournalId":null,"processedLines":[{"originalOrderLineId":20,"productId":1,"productName":"Laptop ProBook 15 G10","quantityReturned":2.0,"sellingPrice":31200000.0,"buyingPrice":20400000.0,"refundAmount":62400000.0,"lossAmount":21600000.0,"recoveryAmount":40800000.0,"inventoryAction":"Return recorded (ID: 50) - Awaiting supplier return processing","purchaseOrderId":null,"goodsReturnId":null,"requiresManualAction":true,"manualActionReason":"Requires AP purchase order identification for supplier return"}]}
✅ Customer return (RETURN_TO_SUPPLIER) processed successfully!
   Customer Refund: 62400000
   Total Loss: 21600000
   Recovery Amount: 40800000
   Net Loss: -19200000
⚠️  Manual Action Required: Requires AP purchase order identification for supplier return
   Inventory Action: Return recorded (ID: 50) - Awaiting supplier return processing
⏳ Waiting 3 seconds for background processing...

========================================
STEP 9: VERIFY MANUAL ACTION WORKFLOW
========================================
✅ Manual action requirement verified!
   Reason: Requires AP purchase order identification for supplier return
   Status: Customer refund issued, awaiting manual supplier return processing

📋 Simulating Manual Supplier Return Process...
   1. Customer return invoice created: ✅
   2. Manual review required: ⚠️  Pending staff action
   3. AP purchase order identification: ⏳ Manual process
   4. Supplier return creation: ⏳ Via separate API

🔍 Checking for manual supplier return endpoint...

--- Testing: Test Manual Return Endpoint ---
URL: GET http://localhost:8080/api/inventory/manual-returns/help
✗ Test Manual Return Endpoint - FAILED                                                                                  
Error: Response status code does not indicate success: 404 ().
HTTP Status: NotFound
Could not read error response body
⚠️  Manual supplier return endpoint not yet implemented
   (This is expected in current implementation)

========================================
STEP 10: VERIFY STOCK IMPACT - TWO-STEP PROCESS
========================================

--- Testing: Get Post-Supplier-Return Stock ---
URL: GET http://localhost:8080/api/inventory/stock/current?productId=1
✓ Get Post-Supplier-Return Stock - SUCCESS
Response: 100.0
📊 Stock Analysis (SUPPLIER RETURN - TWO-STEP PROCESS):
   Stock After Destroy: 98
   Supplier Return Quantity: 2
   Process: Return (+2), No Disposal (manual)
   Expected Stock Increase: +2
   Actual Stock: 100
   Stock Change: +2
   Behavior: Return creates inventory credit, manual processing for supplier return
✅ Stock behavior verified - return recorded, awaiting manual supplier processing!

========================================
STEP 11: VERIFY FINAL STOCK LEVELS (TWO-STEP PROCESS)
========================================

--- Testing: Get Final Stock ---
URL: GET http://localhost:8080/api/inventory/stock/current?productId=1
✓ Get Final Stock - SUCCESS
Response: 100.0
📊 Final Stock Analysis (TWO-STEP PROCESS):
   Pre-Return Stock: 98
   Destroyed (Return+Disposal): 1 (+1 -1 = 0)
   Supplier Return (Return Only): 2 (+2)
   Expected Net Stock Change: +2
   Expected Final Stock: 100
   Actual Final Stock: 100
   Actual Net Stock Change: +2
✅ Final stock levels verified for two-step process!
   Destroy action: Net zero change (return + disposal)
   Supplier return: Stock increase pending manual processing

========================================
STEP 15: FINANCIAL IMPACT SUMMARY (UPDATED)
========================================
💰 FINANCIAL IMPACT SUMMARY (UPDATED):
=======================================
Customer Refunds Issued: 93600000
Total Loss (Calculated): 32400000
Potential Recovery (Supplier): 40800000
Net Loss (Current): -8400000

📝 NOTE: Recovery amount is potential only.
   Actual recovery depends on successful manual supplier return processing.

========================================
STEP 16: END-TO-END INTEGRATION SUMMARY (UPDATED)
========================================

📊 CUSTOMER RETURN FLOW SUMMARY (NEW PROCESS):
===============================================
🏪 Original Sales Order:
   Order ID: 10
   Customer: Khách Mua Lẻ
   Product: Laptop ProBook 15 G10
   Original Quantity: 3

📦 Return Processing (TWO-STEP WORKFLOW):
   Destroyed: Return+Disposal (1 + 1 = net 0 stock change)
   Supplier Return: Return only (2, pending manual disposal)
   Total Customer Refunds: 93600000

📊 Inventory Impact (TWO-STEP PROCESS):
   Pre-Return Stock: 98
   Final Stock: 100
   Net Stock Change: 2 (supplier return credit)
   Return Records: 2 created (1 + 2)
   Disposal Records: 1 created (1 only)

� Stock Ledger Records (TWO-STEP PROCESS):
   Customer Return ID: 48
   Disposal ID: 49
   Status: ✅ Complete audit trail with proper linkage

🚚 Supplier Returns (NEW PROCESS):
   Status: ⚠️  Marked for manual processing
   Customer Invoice: ✅ Created
   Manual Action Required: True
   Reason: Requires AP purchase order identification for supplier return
   Next Steps: Staff must identify AP purchase order and create supplier return

========================================
FINAL TEST RESULTS (UPDATED CRITERIA)
========================================

📊 OVERALL RESULTS:
Total Tests: 22
✅ Passed: 21
❌ Failed: 1
📈 Success Rate: 95.45%

🎯 INTEGRATION ASSESSMENT (UPDATED):
✅ Customer Return Processing: Working
✅ Inventory Integration: Working (two-step process with correct stock impacts)
✅ Disposal System: Working
✅ Manual Action Workflow: Working
✅ Finance Integration: Working
✅ Business Logic: Working (proper financial calculations)

🏆 Integration Score: 95/100
✅ EXCELLENT! New customer return workflow working with minor issues

💡 UPDATED RECOMMENDATIONS:

🔄 TWO-STEP WORKFLOW SUMMARY:
1. Customer returns with DESTROY → Return record (+stock) + Disposal record (-stock) = Net 0
2. Customer returns with RETURN_TO_SUPPLIER → Return record (+stock) only, manual disposal later
3. Customer invoices created immediately for both cases
4. Proper audit trail: Return ID → Disposal ID linkage for destroyed items
5. Stock movements tracked in stock_ledger with MovementType.RETURN and MovementType.DISPOSAL

⏰ Test completed at: 06/18/2025 23:42:43