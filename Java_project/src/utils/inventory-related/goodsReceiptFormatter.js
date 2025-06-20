/**
 * Goods Receipt Formatter Utilities
 * Handles transformation of goods receipt data between API and frontend formats
 */

/**
 * Formats goods receipt data for API requests (supports both traditional and bill-based receipts)
 * @param {Object} goodsReceipt - Frontend goods receipt data
 * @returns {Object} API-ready goods receipt object
 */
export const formatGoodsReceiptForApi = (goodsReceipt) => {
  if (!goodsReceipt) return null;

  // Handle bill-based goods receipt (new format with quantityAccepted/Rejected)
  if (goodsReceipt.lines && goodsReceipt.billId) {
    return {
      supplierId: goodsReceipt.vendorId || goodsReceipt.supplierId,
      referenceNumber:
        goodsReceipt.documentReference || goodsReceipt.referenceNumber,
      billId: goodsReceipt.billId,
      lines: goodsReceipt.lines.map(formatGoodsReceiptLineForApi),
      receivedBy: goodsReceipt.receivedBy || "",
      notes: goodsReceipt.notes || "",
    };
  }

  // Handle traditional goods receipt (legacy format)
  return {
    vendorId: goodsReceipt.vendorId || "",
    receiptDate: goodsReceipt.receiptDate
      ? new Date(goodsReceipt.receiptDate).toISOString()
      : new Date().toISOString(),
    documentReference: goodsReceipt.documentReference || "",
    warehouseId: parseInt(goodsReceipt.warehouseId) || 1,
    items: (goodsReceipt.items || []).map(formatGoodsReceiptItemForApi),
    receivedBy: goodsReceipt.receivedBy || "",
    notes: goodsReceipt.notes || "",
  };
};

/**
 * Formats individual goods receipt line for API requests (bill-based)
 * @param {Object} line - Frontend goods receipt line data
 * @returns {Object} API-ready goods receipt line object
 */
export const formatGoodsReceiptLineForApi = (line) => {
  if (!line) return null;

  return {
    billLineId: line.billLineId,
    billId: line.billId,
    productId: parseInt(line.productId),
    quantityAccepted: parseFloat(line.quantityAccepted) || 0,
    quantityRejected: parseFloat(line.quantityRejected) || 0,
    rejectionReason: line.rejectionReason || "",
  };
};

/**
 * Formats individual goods receipt item for API requests (traditional)
 * @param {Object} item - Frontend goods receipt item data
 * @returns {Object} API-ready goods receipt item object
 */
export const formatGoodsReceiptItemForApi = (item) => {
  if (!item) return null;

  const formattedItem = {
    productId: parseInt(item.productId),
    quantityReceived: parseFloat(item.quantityReceived).toFixed(2),
  };

  // Add optional fields only if they have values
  if (
    item.unitCost !== null &&
    item.unitCost !== undefined &&
    item.unitCost !== ""
  ) {
    formattedItem.unitCost = parseFloat(item.unitCost).toFixed(2);
  }

  if (item.expiryDate) {
    formattedItem.expiryDate = new Date(item.expiryDate)
      .toISOString()
      .split("T")[0]; // YYYY-MM-DD format
  }

  if (item.batchNumber) {
    formattedItem.batchNumber = item.batchNumber;
  }

  if (item.notes) {
    formattedItem.notes = item.notes;
  }

  return formattedItem;
};

/**
 * Formats goods receipt response data from API
 * @param {Object} response - Raw API response data
 * @returns {Object} Formatted goods receipt response
 */
export const formatGoodsReceiptResponse = (response) => {
  if (!response) return null;

  return {
    success: response.success || false,
    message: response.message || "",
    stockLedgerEntries: (response.data || []).map(formatStockLedgerEntry),
    rawData: response.data || [],
  };
};

/**
 * Formats individual stock ledger entry from API response
 * @param {Object} entry - Raw stock ledger entry from API
 * @returns {Object} Formatted stock ledger entry
 */
export const formatStockLedgerEntry = (entry) => {
  if (!entry) return null;

  return {
    id: entry.id || null,
    productId: entry.productId || null,
    productName: entry.productName || "",
    productUnit: entry.productUnit || "",
    warehouseId: entry.warehouseId || null,
    warehouseName: entry.warehouseName || "",
    movementType: entry.movementType || "",
    quantity: parseFloat(entry.quantity) || 0,
    documentReference: entry.documentReference || "",
    eventTimestamp: entry.eventTimestamp
      ? new Date(entry.eventTimestamp)
      : null,
    userId: entry.userId || "",
    referenceId: entry.referenceId || "",
    referenceType: entry.referenceType || "",
    notes: entry.notes || "",
  };
};

/**
 * Validates goods receipt request data (supports both formats)
 * @param {Object} goodsReceipt - Goods receipt data to validate
 * @returns {Object} Validation result with isValid flag and errors array
 */
export const validateGoodsReceiptRequest = (goodsReceipt) => {
  const errors = [];

  // Required field validations
  if (!goodsReceipt) {
    errors.push("Goods receipt data is required");
    return { isValid: false, errors };
  }

  // Bill-based format validation
  if (goodsReceipt.lines && goodsReceipt.billId) {
    if (!goodsReceipt.supplierId && !goodsReceipt.vendorId) {
      errors.push("Supplier ID is required");
    }

    if (!goodsReceipt.referenceNumber && !goodsReceipt.documentReference) {
      errors.push("Document reference is required");
    }

    if (!goodsReceipt.billId) {
      errors.push("Bill ID is required");
    }

    if (!goodsReceipt.receivedBy || goodsReceipt.receivedBy.trim() === "") {
      errors.push("Received by field is required");
    }

    // Lines validation
    if (!Array.isArray(goodsReceipt.lines) || goodsReceipt.lines.length === 0) {
      errors.push("At least one line is required");
    } else {
      goodsReceipt.lines.forEach((line, index) => {
        const lineErrors = validateGoodsReceiptLine(line, index);
        errors.push(...lineErrors);
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Traditional format validation
  if (!goodsReceipt.vendorId || goodsReceipt.vendorId.trim() === "") {
    errors.push("Vendor ID is required");
  }

  if (
    !goodsReceipt.documentReference ||
    goodsReceipt.documentReference.trim() === ""
  ) {
    errors.push("Document reference is required");
  }

  if (!goodsReceipt.warehouseId) {
    errors.push("Warehouse ID is required");
  }

  if (!goodsReceipt.receivedBy || goodsReceipt.receivedBy.trim() === "") {
    errors.push("Received by field is required");
  }

  if (!goodsReceipt.receiptDate) {
    errors.push("Receipt date is required");
  }

  // Items validation
  if (
    !goodsReceipt.items ||
    !Array.isArray(goodsReceipt.items) ||
    goodsReceipt.items.length === 0
  ) {
    errors.push("At least one item is required");
  } else {
    goodsReceipt.items.forEach((item, index) => {
      const itemErrors = validateGoodsReceiptItem(item, index);
      errors.push(...itemErrors);
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validates individual goods receipt line (bill-based)
 * @param {Object} line - Goods receipt line to validate
 * @param {number} index - Line index for error reporting
 * @returns {Array} Array of validation errors
 */
export const validateGoodsReceiptLine = (line, index) => {
  const errors = [];
  const linePrefix = `Line ${index + 1}:`;

  if (!line.productId) {
    errors.push(`${linePrefix} Product ID is required`);
  }

  if (!line.billLineId) {
    errors.push(`${linePrefix} Bill Line ID is required`);
  }

  const quantityAccepted = parseFloat(line.quantityAccepted) || 0;
  const quantityRejected = parseFloat(line.quantityRejected) || 0;
  const totalQuantity = quantityAccepted + quantityRejected;

  if (totalQuantity <= 0) {
    errors.push(
      `${linePrefix} Total quantity (accepted + rejected) must be greater than 0`
    );
  }

  if (
    quantityRejected > 0 &&
    (!line.rejectionReason || line.rejectionReason.trim() === "")
  ) {
    errors.push(
      `${linePrefix} Rejection reason is required when quantity is rejected`
    );
  }

  return errors;
};

/**
 * Validates individual goods receipt item (traditional)
 * @param {Object} item - Goods receipt item to validate
 * @param {number} index - Item index for error reporting
 * @returns {Array} Array of validation errors
 */
export const validateGoodsReceiptItem = (item, index) => {
  const errors = [];
  const itemPrefix = `Item ${index + 1}:`;

  if (!item.productId) {
    errors.push(`${itemPrefix} Product ID is required`);
  }

  if (!item.quantityReceived || parseFloat(item.quantityReceived) <= 0) {
    errors.push(`${itemPrefix} Quantity received must be greater than 0`);
  }

  if (
    item.unitCost !== null &&
    item.unitCost !== undefined &&
    item.unitCost !== "" &&
    parseFloat(item.unitCost) < 0
  ) {
    errors.push(`${itemPrefix} Unit cost cannot be negative`);
  }

  if (item.expiryDate && new Date(item.expiryDate) <= new Date()) {
    errors.push(`${itemPrefix} Expiry date must be in the future`);
  }

  return errors;
};

/**
 * Formats API error responses
 * @param {Object} error - Error object from API
 * @returns {Object} Formatted error object
 */
export const formatApiError = (error) => {
  if (!error) return { message: "Unknown error occurred", code: 500 };

  // Handle different error structures
  if (error.response) {
    const { status, data } = error.response;
    return {
      message: data?.message || data?.error || "API request failed",
      code: status || 500,
      details: data?.details || null,
      validation: data?.validation || null,
    };
  }

  // Handle network errors
  if (error.message) {
    return {
      message: error.message,
      code: 0,
      details: "Network error or server unavailable",
    };
  }

  return {
    message: "Unknown error occurred",
    code: 500,
    details: error.toString(),
  };
};

/**
 * Formats success message with stock verification details
 * @param {string} message - API success message
 * @returns {Object} Parsed success information
 */
export const parseStockVerificationMessage = (message) => {
  if (!message) return { message: "", stockUpdates: [] };

  // Extract stock verification details from message
  // Expected format: "Goods receipt recorded successfully. Stock verification: Product 101: Current Stock = 150.00; Product 102: Current Stock = 75.00;"
  const stockUpdates = [];
  const stockVerificationMatch = message.match(/Stock verification: (.+)/);

  if (stockVerificationMatch) {
    const stockPart = stockVerificationMatch[1];
    const productMatches = stockPart.match(
      /Product (\d+): Current Stock = ([\d.]+)/g
    );

    if (productMatches) {
      productMatches.forEach((match) => {
        const [, productId, currentStock] = match.match(
          /Product (\d+): Current Stock = ([\d.]+)/
        );
        stockUpdates.push({
          productId: parseInt(productId),
          currentStock: parseFloat(currentStock),
        });
      });
    }
  }

  return {
    message: message.split(". Stock verification:")[0] || message,
    stockUpdates,
  };
};

/**
 * Creates initial goods receipt object for forms
 * @param {Object} defaults - Default values to override
 * @returns {Object} Initial goods receipt object
 */
export const createInitialGoodsReceipt = (defaults = {}) => {
  return {
    vendorId: "",
    receiptDate: new Date().toISOString().split("T")[0], // Today's date in YYYY-MM-DD format
    documentReference: "",
    warehouseId: 1,
    receivedBy: "",
    notes: "",
    items: [
      {
        productId: "",
        quantityReceived: "",
        unitCost: "",
        expiryDate: "",
        batchNumber: "",
        notes: "",
      },
    ],
    ...defaults,
  };
};

/**
 * Adds a new empty item to goods receipt
 * @param {Object} goodsReceipt - Current goods receipt data
 * @returns {Object} Updated goods receipt with new item
 */
export const addNewGoodsReceiptItem = (goodsReceipt) => {
  const newItem = {
    productId: "",
    quantityReceived: "",
    unitCost: "",
    expiryDate: "",
    batchNumber: "",
    notes: "",
  };

  return {
    ...goodsReceipt,
    items: [...(goodsReceipt.items || []), newItem],
  };
};

/**
 * Removes an item from goods receipt
 * @param {Object} goodsReceipt - Current goods receipt data
 * @param {number} index - Index of item to remove
 * @returns {Object} Updated goods receipt without the specified item
 */
export const removeGoodsReceiptItem = (goodsReceipt, index) => {
  const items = [...(goodsReceipt.items || [])];
  items.splice(index, 1);

  return {
    ...goodsReceipt,
    items,
  };
};
