/**
 * Export Destroy Formatter Utilities
 * Handles formatting of requests and responses for stock disposal operations
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
 * Disposal reasons enum
 */
export const DISPOSAL_REASONS = {
  EXPIRED: "EXPIRED",
  DAMAGED: "DAMAGED",
  CONTAMINATED: "CONTAMINATED",
  RECALLED: "RECALLED",
  OBSOLETE: "OBSOLETE",
  QUALITY_ISSUE: "QUALITY_ISSUE",
  OTHER: "OTHER",
};

/**
 * Disposal methods enum
 */
export const DISPOSAL_METHODS = {
  DESTRUCTION: "DESTRUCTION",
  RECYCLING: "RECYCLING",
  DONATION: "DONATION",
  RETURN_TO_VENDOR: "RETURN_TO_VENDOR",
  COMPOST: "COMPOST",
  OTHER: "OTHER",
};

/**
 * Get disposal reason display text
 * @param {string} reason - Disposal reason enum value
 * @returns {string} Display text
 */
export const getDisposalReasonText = (reason) => {
  const reasonTexts = {
    [DISPOSAL_REASONS.EXPIRED]: "Sản phẩm hết hạn",
    [DISPOSAL_REASONS.DAMAGED]: "Sản phẩm lỗi/hỏng",
    [DISPOSAL_REASONS.CONTAMINATED]: "Sản phẩm bị bẩn",
    [DISPOSAL_REASONS.RECALLED]: "Thu hồi sản phẩm",
    [DISPOSAL_REASONS.OBSOLETE]: "Sản phẩm lỗi thời",
    [DISPOSAL_REASONS.QUALITY_ISSUE]: "Chất lượng không đạt tiêu chuẩn",
    [DISPOSAL_REASONS.OTHER]: "Lý do khác",
  };
  return reasonTexts[reason] || reason;
};

/**
 * Get disposal method display text
 * @param {string} method - Disposal method enum value
 * @returns {string} Display text
 */
export const getDisposalMethodText = (method) => {
  const methodTexts = {
    [DISPOSAL_METHODS.DESTRUCTION]: "Tiêu huỷ",
    [DISPOSAL_METHODS.RECYCLING]: "Tái chế",
    [DISPOSAL_METHODS.DONATION]: "Quyên góp",
    [DISPOSAL_METHODS.RETURN_TO_VENDOR]: "Trả về nhà sản xuất",
    [DISPOSAL_METHODS.COMPOST]: "Làm phân bón",
    [DISPOSAL_METHODS.OTHER]: "Cách xử lý khác",
  };
  return methodTexts[method] || method;
};

/**
 * Format disposal line item for request
 * @param {Object} item - Disposal item data
 * @returns {Object} Formatted disposal item
 */
export const formatDisposalItem = (item) => {
  const formattedItem = {
    productId: parseInt(item.productId) || 0,
    quantityToDispose: parseFloat(item.quantityToDispose) || 0,
  };

  // Add optional fields if provided
  if (item.batchNumber) {
    formattedItem.batchNumber = item.batchNumber.trim();
  }

  if (item.expirationDate) {
    formattedItem.expirationDate = formatToISODate(item.expirationDate);
  }

  if (item.notes) {
    formattedItem.notes = item.notes.trim();
  }

  return formattedItem;
};

/**
 * Format stock disposal request
 * @param {Object} formData - Form data from UI
 * @returns {Object} Formatted request payload
 */
export const formatStockDisposalRequest = (formData) => {
  const request = {
    disposalDate: formatToISODate(formData.disposalDate),
    disposalReason: formData.disposalReason,
    disposalMethod: formData.disposalMethod,
    items: (formData.items || []).map(formatDisposalItem),
  };

  // Add optional fields if provided
  if (formData.approvedBy) {
    request.approvedBy = formData.approvedBy.trim();
  }

  if (formData.notes) {
    request.notes = formData.notes.trim();
  }

  if (formData.referenceNumber) {
    request.referenceNumber = formData.referenceNumber.trim();
  }

  return request;
};

/**
 * Format disposal response data for UI display
 * @param {Object} responseData - Raw API response
 * @returns {Object} Formatted response data
 */
export const formatDisposalResponse = (responseData) => {
  if (!responseData) return null;

  return {
    success: responseData.success || false,
    message: responseData.message || "",
    disposalRecords: (responseData.data || []).map((record) => ({
      id: record.id,
      productId: record.productId,
      productName: record.productName,
      productUnit: record.productUnit,
      warehouseId: record.warehouseId,
      warehouseName: record.warehouseName,
      movementType: record.movementType,
      quantity: Math.abs(record.quantity), // Convert to positive for display
      quantityDisposed: Math.abs(record.quantity),
      documentReference: record.documentReference,
      eventTimestamp: record.eventTimestamp,
      eventDate: formatToISODate(record.eventTimestamp),
      userId: record.userId,
      referenceType: record.referenceType,
      notes: record.notes,
      // Parse disposal details from notes if available
      disposalDetails: parseDisposalDetailsFromNotes(record.notes),
    })),
  };
};

/**
 * Parse disposal details from notes field
 * @param {string} notes - Notes field containing disposal details
 * @returns {Object} Parsed disposal details
 */
export const parseDisposalDetailsFromNotes = (notes) => {
  if (!notes) return {};

  const details = {};

  // Extract disposal reason
  const reasonMatch = notes.match(/Reason: ([^,]+)/);
  if (reasonMatch) {
    details.reason = reasonMatch[1].trim();
  }

  // Extract disposal method
  const methodMatch = notes.match(/Method: ([^,]+)/);
  if (methodMatch) {
    details.method = methodMatch[1].trim();
  }

  // Extract approved by
  const approvedMatch = notes.match(/Approved by: ([^,]+)/);
  if (approvedMatch) {
    details.approvedBy = approvedMatch[1].trim();
  }

  // Extract batch number
  const batchMatch = notes.match(/Batch: ([^,]+)/);
  if (batchMatch) {
    details.batchNumber = batchMatch[1].trim();
  }

  // Extract expiry date
  const expiryMatch = notes.match(/Expiry: ([^,]+)/);
  if (expiryMatch) {
    details.expirationDate = expiryMatch[1].trim();
  }

  return details;
};

/**
 * Validate disposal request data
 * @param {Object} requestData - Request data to validate
 * @returns {Object} Validation result with isValid and errors
 */
export const validateDisposalRequest = (requestData) => {
  const errors = [];

  // Validate required fields
  if (!requestData.disposalDate) {
    errors.push("Disposal date is required");
  }

  if (!requestData.disposalReason) {
    errors.push("Disposal reason is required");
  }

  if (!requestData.disposalMethod) {
    errors.push("Disposal method is required");
  }

  if (!requestData.items || requestData.items.length === 0) {
    errors.push("At least one disposal item is required");
  }

  // Validate disposal reason enum
  if (
    requestData.disposalReason &&
    !Object.values(DISPOSAL_REASONS).includes(requestData.disposalReason)
  ) {
    errors.push("Invalid disposal reason");
  }

  // Validate disposal method enum
  if (
    requestData.disposalMethod &&
    !Object.values(DISPOSAL_METHODS).includes(requestData.disposalMethod)
  ) {
    errors.push("Invalid disposal method");
  }

  // Validate items
  if (requestData.items && Array.isArray(requestData.items)) {
    requestData.items.forEach((item, index) => {
      if (!item.productId) {
        errors.push(`Item ${index + 1}: Product ID is required`);
      }

      if (!item.quantityToDispose || item.quantityToDispose <= 0) {
        errors.push(
          `Item ${index + 1}: Quantity to dispose must be greater than 0`
        );
      }

      if (item.quantityToDispose && item.quantityToDispose < 0.001) {
        errors.push(`Item ${index + 1}: Minimum disposal quantity is 0.001`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Format error response for UI display
 * @param {Error|Object} error - Error object or API error response
 * @returns {Object} Formatted error data
 */
export const formatErrorResponse = (error) => {
  if (!error) return null;

  // Handle API error responses
  if (error.response && error.response.data) {
    return {
      success: false,
      message: error.response.data.message || "An error occurred",
      statusCode: error.response.status,
      data: error.response.data.data || null,
    };
  }

  // Handle fetch errors
  if (error.message) {
    return {
      success: false,
      message: error.message,
      statusCode: null,
      data: null,
    };
  }

  // Handle generic errors
  return {
    success: false,
    message: "An unexpected error occurred",
    statusCode: null,
    data: null,
  };
};

/**
 * Generate reference number for disposal
 * @param {string} prefix - Reference prefix (default: "DISP")
 * @returns {string} Generated reference number
 */
export const generateDisposalReference = (prefix = "DISP") => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const time = String(now.getTime()).slice(-6); // Last 6 digits of timestamp

  return `${prefix}-${year}${month}${day}-${time}`;
};

/**
 * Format disposal summary for display
 * @param {Array} disposalRecords - Array of disposal records
 * @returns {Object} Summary data
 */
export const formatDisposalSummary = (disposalRecords) => {
  if (!disposalRecords || disposalRecords.length === 0) {
    return {
      totalItems: 0,
      totalQuantity: 0,
      uniqueProducts: 0,
      averageQuantity: 0,
    };
  }

  const totalQuantity = disposalRecords.reduce(
    (sum, record) => sum + record.quantityDisposed,
    0
  );
  const uniqueProducts = new Set(
    disposalRecords.map((record) => record.productId)
  ).size;

  return {
    totalItems: disposalRecords.length,
    totalQuantity: parseFloat(totalQuantity.toFixed(3)),
    uniqueProducts,
    averageQuantity: parseFloat(
      (totalQuantity / disposalRecords.length).toFixed(3)
    ),
  };
};
