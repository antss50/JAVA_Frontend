/**
 * Stock Ledger Formatter Utilities
 * Handles formatting of requests and responses for stock ledger operations
 */

/**
 * Format date to ISO string (YYYY-MM-DD)
 * @param {Date|string} date - Date to format
 * @returns {string} ISO date string
 */
export const formatToISODate = (date) => {
  if (!date) return "";
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toISOString().split("T")[0];
};

/**
 * Format datetime to ISO string (YYYY-MM-DDTHH:MM:SS)
 * @param {Date|string} datetime - DateTime to format
 * @returns {string} ISO datetime string
 */
export const formatToISODateTime = (datetime) => {
  if (!datetime) return "";
  const dateObj = datetime instanceof Date ? datetime : new Date(datetime);
  return dateObj.toISOString().slice(0, 19);
};

/**
 * Parse ISO date string to Date object
 * @param {string} isoString - ISO date/datetime string
 * @returns {Date|null} Parsed date or null if invalid
 */
export const parseISODate = (isoString) => {
  if (!isoString) return null;
  try {
    return new Date(isoString);
  } catch (error) {
    console.error("Error parsing date:", error);
    return null;
  }
};

/**
 * Format number to BigDecimal string with proper precision
 * @param {number|string} value - Value to format
 * @param {number} precision - Decimal places (default: 2)
 * @returns {string} Formatted BigDecimal string
 */
export const formatToBigDecimal = (value, precision = 2) => {
  if (value === null || value === undefined || value === "") return "";
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(numValue)) return "";
  return numValue.toFixed(precision);
};

/**
 * Parse BigDecimal string to number
 * @param {string} bigDecimalStr - BigDecimal string
 * @returns {number} Parsed number
 */
export const parseBigDecimal = (bigDecimalStr) => {
  if (!bigDecimalStr) return 0;
  return parseFloat(bigDecimalStr);
};

/**
 * Format stock adjustment request
 * @param {Object} adjustmentData - Stock adjustment data
 * @returns {Object} Formatted request body
 */
export const formatStockAdjustmentRequest = (adjustmentData) => {
  return {
    productId: adjustmentData.productId,
    quantityChange: formatToBigDecimal(adjustmentData.quantityChange),
    reason: adjustmentData.reason,
    reference: adjustmentData.reference || null,
  };
};

/**
 * Format goods receipt request
 * @param {Object} receiptData - Goods receipt data
 * @returns {Object} Formatted request body
 */
export const formatGoodsReceiptRequest = (receiptData) => {
  return {
    vendorId: receiptData.vendorId,
    purchaseOrderNumber: receiptData.purchaseOrderNumber,
    invoiceNumber: receiptData.invoiceNumber,
    receivedDate: formatToISODate(receiptData.receivedDate),
    receivedBy: receiptData.receivedBy,
    notes: receiptData.notes || "",
    items: receiptData.items.map((item) => ({
      productId: item.productId,
      quantityReceived: formatToBigDecimal(item.quantityReceived),
      unitCost: formatToBigDecimal(item.unitCost),
      batchNumber: item.batchNumber || null,
      expirationDate: item.expirationDate
        ? formatToISODate(item.expirationDate)
        : null,
      notes: item.notes || "",
    })),
  };
};

/**
 * Format stock disposal request
 * @param {Object} disposalData - Stock disposal data
 * @returns {Object} Formatted request body
 */
export const formatStockDisposalRequest = (disposalData) => {
  return {
    disposalReason: disposalData.disposalReason,
    disposalMethod: disposalData.disposalMethod,
    approvedBy: disposalData.approvedBy,
    notes: disposalData.notes || "",
    items: disposalData.items.map((item) => ({
      productId: item.productId,
      quantityToDispose: formatToBigDecimal(item.quantityToDispose),
      batchNumber: item.batchNumber || null,
      expirationDate: item.expirationDate
        ? formatToISODate(item.expirationDate)
        : null,
      notes: item.notes || "",
    })),
  };
};

/**
 * Format stock movement data for display
 * @param {Object} movement - Raw stock movement data
 * @returns {Object} Formatted movement data
 */
export const formatStockMovement = (movement) => {
  // Format notes to extract PO, Line, and any trailing notes
  let formattedNotes = movement.notes || "";
  if (formattedNotes.includes("Multi-line goods receipt from PO:")) {
    // Match PO, Line, and everything after Line (including optional notes)
    // Example: "Multi-line goods receipt from PO: 1, Line: 1, Rejected: 1 (hi)"
    const match = formattedNotes.match(/PO:\s*(\d+),\s*Line:\s*(\d+)(.*)/);
    if (match) {
      // match[3] may include comma and space, so trim it
      const trailing = match[3] ? match[3].replace(/^,?\s*/, "") : "";
      formattedNotes =
        `PO: ${match[1]}, Line: ${match[2]}` +
        (trailing ? `, ${trailing}` : "");
    }
  }

  return {
    ...movement,
    quantity: parseBigDecimal(movement.quantity),
    eventTimestamp: parseISODate(movement.eventTimestamp),
    formattedTimestamp: movement.eventTimestamp
      ? new Date(movement.eventTimestamp).toLocaleString()
      : "",
    movementTypeDisplay: formatMovementType(movement.movementType),
    quantityDisplay: `${Math.abs(parseBigDecimal(movement.quantity))} ${
      movement.productUnit || ""
    }`.trim(),
    notes: formattedNotes, // Use the formatted notes
  };
};

/**
 * Format movement type for display
 * @param {string} movementType - Raw movement type
 * @returns {string} Display-friendly movement type
 */
export const formatMovementType = (movementType) => {
  const typeMap = {
    RECEIPT: "Goods Receipt",
    SALE: "Sale",
    ADJUSTMENT: "Stock Adjustment",
    TRANSFER: "Transfer",
    DISPOSAL: "Disposal",
    RETURN: "Return",
  };
  return typeMap[movementType] || movementType;
};

/**
 * Format stock status for display
 * @param {Object} stockStatus - Raw stock status data
 * @returns {Object} Formatted stock status
 */
export const formatStockStatus = (stockStatus) => {
  return {
    ...stockStatus,
    currentStock: parseBigDecimal(stockStatus.currentStock),
    minimumStock: parseBigDecimal(stockStatus.minimumStock),
    maximumStock: parseBigDecimal(stockStatus.maximumStock),
    reorderLevel: parseBigDecimal(stockStatus.reorderLevel),
    variance: parseBigDecimal(stockStatus.variance),
    lastMovementDate: parseISODate(stockStatus.lastMovementDate),
    statusDisplay: formatStockStatusType(stockStatus.status),
    stockLevel: getStockLevelIndicator(
      parseBigDecimal(stockStatus.currentStock),
      parseBigDecimal(stockStatus.minimumStock),
      parseBigDecimal(stockStatus.reorderLevel)
    ),
  };
};

/**
 * Format stock status type for display
 * @param {string} status - Raw status
 * @returns {string} Display-friendly status
 */
export const formatStockStatusType = (status) => {
  const statusMap = {
    ADEQUATE: "Adequate",
    LOW_STOCK: "Low Stock",
    OUT_OF_STOCK: "Out of Stock",
    OVERSTOCKED: "Overstocked",
    MATCH: "Match",
    SHORTAGE: "Shortage",
    OVERAGE: "Overage",
  };
  return statusMap[status] || status;
};

/**
 * Get stock level indicator
 * @param {number} currentStock - Current stock level
 * @param {number} minimumStock - Minimum stock level
 * @param {number} reorderLevel - Reorder level
 * @returns {Object} Stock level indicator with color and text
 */
export const getStockLevelIndicator = (
  currentStock,
  minimumStock,
  reorderLevel
) => {
  if (currentStock <= 0) {
    return { level: "critical", color: "red", text: "Out of Stock" };
  } else if (currentStock <= minimumStock) {
    return { level: "low", color: "orange", text: "Low Stock" };
  } else if (currentStock <= reorderLevel) {
    return { level: "warning", color: "yellow", text: "Reorder Soon" };
  } else {
    return { level: "good", color: "green", text: "Adequate" };
  }
};

/**
 * Format API response for consistent handling
 * @param {Object} response - Raw API response
 * @returns {Object} Formatted response
 */
export const formatApiResponse = (response) => {
  return {
    success: response.success || false,
    message: response.message || "",
    data: response.data || null,
    timestamp: parseISODate(response.timestamp),
    formattedTimestamp: response.timestamp
      ? new Date(response.timestamp).toLocaleString()
      : "",
  };
};

/**
 * Format error response
 * @param {Error|Object} error - Error object or API error response
 * @returns {Object} Formatted error
 */
export const formatErrorResponse = (error) => {
  if (error?.response?.data) {
    // API error response
    return {
      success: false,
      message: error.response.data.message || "An error occurred",
      data: null,
      timestamp: new Date(),
      status: error.response.status,
      statusText: error.response.statusText,
    };
  } else if (error instanceof Error) {
    // JavaScript error
    return {
      success: false,
      message: error.message || "An unexpected error occurred",
      data: null,
      timestamp: new Date(),
      status: null,
      statusText: null,
    };
  } else {
    // Unknown error
    return {
      success: false,
      message: "An unknown error occurred",
      data: null,
      timestamp: new Date(),
      status: null,
      statusText: null,
    };
  }
};

/**
 * Disposal reason options
 */
export const DISPOSAL_REASONS = [
  { value: "EXPIRED", label: "Expired" },
  { value: "DAMAGED", label: "Damaged" },
  { value: "CONTAMINATED", label: "Contaminated" },
  { value: "RECALLED", label: "Recalled" },
  { value: "OTHER", label: "Other" },
];

/**
 * Disposal method options
 */
export const DISPOSAL_METHODS = [
  { value: "DESTRUCTION", label: "Destruction" },
  { value: "RETURN_TO_VENDOR", label: "Return to Vendor" },
  { value: "DONATION", label: "Donation" },
  { value: "RECYCLING", label: "Recycling" },
  { value: "OTHER", label: "Other" },
];

/**
 * Movement type options
 */
export const MOVEMENT_TYPES = [
  { value: "RECEIPT", label: "Receipt" },
  { value: "SALE", label: "Sale" },
  { value: "ADJUSTMENT", label: "Adjustment" },
  { value: "TRANSFER", label: "Transfer" },
  { value: "DISPOSAL", label: "Disposal" },
];

/**
 * Validate BigDecimal input
 * @param {string|number} value - Value to validate
 * @returns {Object} Validation result
 */
export const validateBigDecimal = (value) => {
  if (value === null || value === undefined || value === "") {
    return { isValid: false, message: "Value is required" };
  }

  const numValue = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return { isValid: false, message: "Invalid number format" };
  }

  if (numValue < 0) {
    return { isValid: false, message: "Value cannot be negative" };
  }

  return { isValid: true, message: "", value: numValue };
};

/**
 * Validate date input
 * @param {string|Date} date - Date to validate
 * @returns {Object} Validation result
 */
export const validateDate = (date) => {
  if (!date) {
    return { isValid: false, message: "Date is required" };
  }

  const dateObj = date instanceof Date ? date : new Date(date);

  if (isNaN(dateObj.getTime())) {
    return { isValid: false, message: "Invalid date format" };
  }

  return { isValid: true, message: "", value: dateObj };
};
