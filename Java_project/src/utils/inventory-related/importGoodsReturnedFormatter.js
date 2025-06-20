/**
 * Import Goods Returned Formatter Utilities
 * Handles transformation of goods return data between API and frontend formats
 */

/**
 * Formats goods return data for API requests
 * @param {Object} goodsReturn - Frontend goods return data
 * @returns {Object} API-ready goods return object
 */
export const formatGoodsReturnForApi = (goodsReturn) => {
  if (!goodsReturn) return null;

  return {
    supplierId: goodsReturn.supplierId,
    purchaseOrderId: goodsReturn.purchaseOrderId,
    reason: goodsReturn.reason || "",
    returnDate: goodsReturn.returnDate
      ? new Date(goodsReturn.returnDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    lines: (goodsReturn.lines || []).map(formatGoodsReturnLineForApi),
  };
};

/**
 * Formats individual goods return line for API requests
 * @param {Object} line - Frontend goods return line data
 * @returns {Object} API-ready goods return line object
 */
export const formatGoodsReturnLineForApi = (line) => {
  if (!line) return null;

  return {
    productId: parseInt(line.productId),
    quantityReturned: parseFloat(line.quantityReturned),
  };
};

/**
 * Formats goods return response from API for frontend consumption
 * @param {Object|Array} apiResponse - API response data
 * @returns {Object|Array} Frontend-ready goods return data
 */
export const formatGoodsReturnFromApi = (apiResponse) => {
  if (!apiResponse) return null;

  // Handle array response (multiline returns)
  if (Array.isArray(apiResponse)) {
    return apiResponse.map(formatSingleGoodsReturnFromApi);
  }

  // Handle single response
  return formatSingleGoodsReturnFromApi(apiResponse);
};

/**
 * Formats single goods return response from API
 * @param {Object} apiReturn - Single API goods return response
 * @returns {Object} Frontend-ready goods return data
 */
export const formatSingleGoodsReturnFromApi = (apiReturn) => {
  if (!apiReturn) return null;

  return {
    id: apiReturn.id,
    supplierId: apiReturn.partyId,
    purchaseOrderId: apiReturn.purchaseOrderId,
    productId: apiReturn.productId,
    quantityReturned: apiReturn.quantityReturned,
    unitCost: apiReturn.unitCost,
    totalValue: apiReturn.totalValue,
    reason: apiReturn.reason || "",
    returnDate: apiReturn.returnDate,
    stockLedgerId: apiReturn.stockLedgerId, // New field for stock movement tracking
    createdAt: apiReturn.createdAt,
    updatedAt: apiReturn.updatedAt,
  };
};

/**
 * Creates initial goods return object for forms
 * @param {Object} options - Configuration options
 * @returns {Object} Initial goods return object
 */
export const createInitialGoodsReturn = (options = {}) => {
  const {
    supplierId = null,
    purchaseOrderId = null,
    returnDate = new Date().toISOString().split("T")[0],
  } = options;

  return {
    supplierId,
    purchaseOrderId,
    reason: "",
    returnDate,
    lines: [],
  };
};

/**
 * Creates a new goods return line item
 * @param {Object} options - Configuration options
 * @returns {Object} New goods return line object
 */
export const createGoodsReturnLine = (options = {}) => {
  const { productId = null, quantityReturned = 0 } = options;

  return {
    productId,
    quantityReturned,
    // Additional fields for display purposes
    productName: "",
    unitCost: 0,
    totalValue: 0,
  };
};

/**
 * Adds a new line item to goods return
 * @param {Object} goodsReturn - Current goods return object
 * @param {Object} lineData - New line item data
 * @returns {Object} Updated goods return object
 */
export const addGoodsReturnLine = (goodsReturn, lineData = {}) => {
  if (!goodsReturn) return null;

  const newLine = createGoodsReturnLine(lineData);

  return {
    ...goodsReturn,
    lines: [...goodsReturn.lines, newLine],
  };
};

/**
 * Removes a line item from goods return
 * @param {Object} goodsReturn - Current goods return object
 * @param {number} lineIndex - Index of line to remove
 * @returns {Object} Updated goods return object
 */
export const removeGoodsReturnLine = (goodsReturn, lineIndex) => {
  if (!goodsReturn || lineIndex < 0 || lineIndex >= goodsReturn.lines.length) {
    return goodsReturn;
  }

  return {
    ...goodsReturn,
    lines: goodsReturn.lines.filter((_, index) => index !== lineIndex),
  };
};

/**
 * Updates a specific line item in goods return
 * @param {Object} goodsReturn - Current goods return object
 * @param {number} lineIndex - Index of line to update
 * @param {Object} updateData - Data to update
 * @returns {Object} Updated goods return object
 */
export const updateGoodsReturnLine = (goodsReturn, lineIndex, updateData) => {
  if (!goodsReturn || lineIndex < 0 || lineIndex >= goodsReturn.lines.length) {
    return goodsReturn;
  }

  const updatedLines = goodsReturn.lines.map((line, index) => {
    if (index === lineIndex) {
      return { ...line, ...updateData };
    }
    return line;
  });

  return {
    ...goodsReturn,
    lines: updatedLines,
  };
};

/**
 * Validates goods return data before API submission
 * @param {Object} goodsReturn - Goods return data to validate
 * @returns {Object} Validation result with isValid flag and errors array
 */
export const validateGoodsReturn = (goodsReturn) => {
  const errors = [];

  if (!goodsReturn) {
    errors.push("Goods return data is required");
    return { isValid: false, errors };
  }

  // Required field validations
  if (!goodsReturn.supplierId) {
    errors.push("Supplier is required");
  }

  if (!goodsReturn.purchaseOrderId) {
    errors.push("Purchase Order is required");
  }

  if (!goodsReturn.lines || goodsReturn.lines.length === 0) {
    errors.push("At least one product line is required");
  }

  // Validate each line item
  if (goodsReturn.lines && goodsReturn.lines.length > 0) {
    goodsReturn.lines.forEach((line, index) => {
      if (!line.productId) {
        errors.push(`Product is required for line ${index + 1}`);
      }

      if (!line.quantityReturned || line.quantityReturned <= 0) {
        errors.push(
          `Quantity returned must be greater than 0 for line ${index + 1}`
        );
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Calculates total return value for display
 * @param {Object} goodsReturn - Goods return object
 * @returns {number} Total return value
 */
export const calculateTotalReturnValue = (goodsReturn) => {
  if (!goodsReturn || !goodsReturn.lines) return 0;

  return goodsReturn.lines.reduce((total, line) => {
    const lineValue = (line.quantityReturned || 0) * (line.unitCost || 0);
    return total + lineValue;
  }, 0);
};

/**
 * Formats error response from API
 * @param {Object} error - Error response from API
 * @returns {string} Formatted error message
 */
export const formatApiError = (error) => {
  if (!error) return "An unknown error occurred";

  // Handle structured API error responses
  if (error.response?.data) {
    const errorData = error.response.data;

    // Handle validation errors
    if (errorData.data?.errors && Array.isArray(errorData.data.errors)) {
      return errorData.data.errors.map((err) => err.message).join("; ");
    }

    // Handle standard error message
    if (errorData.message) {
      return errorData.message;
    }
  }

  // Handle different error response formats
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error.message) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Failed to process goods return request";
};

/**
 * Formats stock movement data from API response
 * @param {Object} apiStockMovement - Stock movement response from API
 * @returns {Object} Frontend-ready stock movement data
 */
export const formatStockMovementFromApi = (apiStockMovement) => {
  if (!apiStockMovement) return null;

  return {
    id: apiStockMovement.id,
    productId: apiStockMovement.productId,
    productName: apiStockMovement.productName,
    productUnit: apiStockMovement.productUnit,
    warehouseId: apiStockMovement.warehouseId,
    warehouseName: apiStockMovement.warehouseName,
    movementType: apiStockMovement.movementType,
    quantity: apiStockMovement.quantity,
    documentReference: apiStockMovement.documentReference,
    eventTimestamp: apiStockMovement.eventTimestamp,
    userId: apiStockMovement.userId,
    referenceId: apiStockMovement.referenceId,
    referenceType: apiStockMovement.referenceType,
    notes: apiStockMovement.notes,
  };
};

/**
 * Formats wrapped API response (with success, message, data structure)
 * @param {Object} apiResponse - Wrapped API response
 * @returns {any} Extracted data from response
 */
export const formatWrappedApiResponse = (apiResponse) => {
  if (!apiResponse) return null;

  // If response has success/message/data structure, extract data
  if (apiResponse.success !== undefined && apiResponse.data !== undefined) {
    return apiResponse.data;
  }

  // Otherwise return as-is
  return apiResponse;
};

/**
 * Formats success message for goods return operations
 * @param {Object|Array} response - API response
 * @returns {string} Success message
 */
export const formatSuccessMessage = (response) => {
  if (!response) return "Operation completed successfully";

  if (Array.isArray(response)) {
    const count = response.length;
    return `Successfully recorded return for ${count} product${
      count > 1 ? "s" : ""
    }`;
  }

  return "Goods return recorded successfully";
};

/**
 * Groups multiline return responses by purchase order
 * @param {Array} returns - Array of return responses
 * @returns {Object} Grouped returns by purchase order ID
 */
export const groupReturnsByPurchaseOrder = (returns) => {
  if (!Array.isArray(returns)) return {};

  return returns.reduce((groups, returnItem) => {
    const poId = returnItem.purchaseOrderId;
    if (!groups[poId]) {
      groups[poId] = [];
    }
    groups[poId].push(returnItem);
    return groups;
  }, {});
};

/**
 * Default reason options for goods returns
 */
export const RETURN_REASONS = [
  { value: "DAMAGED", label: "Damaged" },
  { value: "DEFECTIVE", label: "Defective" },
  { value: "WRONG_ITEM", label: "Wrong Item" },
  { value: "QUALITY_ISSUES", label: "Quality Issues" },
  { value: "EXPIRED", label: "Expired" },
  { value: "OTHER", label: "Other" },
];
