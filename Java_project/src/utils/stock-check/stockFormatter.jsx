/**
 * Stock Check Formatter Layer
 * Handles unwrapping API responses and formatting data for display components
 */

// =============================================================================
// RESPONSE UNWRAPPING UTILITIES
// =============================================================================

/**
 * Unwraps the standard API response format to extract data
 * @param {Object} response - API response with timestamp, success, message, data structure
 * @returns {Object} Extracted data or null if unsuccessful
 */
export const unwrapApiResponse = (response) => {
  if (!response) return null;

  // Handle Spring Page object (paginated response)
  if (Array.isArray(response.content) && response.pageable) {
    // This is a Spring Page object, return as-is
    return response;
  }

  // If response.success is explicitly false and no data, treat as error
  if (response.success === false && !response.data) {
    const errorMsg =
      response.message || "API request failed (no error message provided)";
    console.error("API Error:", errorMsg, "Full response:", response);
    throw new Error(errorMsg);
  }

  // If data exists, return it even if success is false (for tolerant mode)
  if (response.data) {
    if (response.success === false) {
      console.warn(
        "API returned success: false but data exists. Full response:",
        response
      );
    }
    return response.data;
  }

  // If neither data nor explicit error, treat as error
  const errorMsg =
    response.message || "API request failed (no error message provided)";
  console.error("API Error:", errorMsg, "Full response:", response);
  throw new Error(errorMsg);
};

/**
 * Unwraps paginated API response and extracts both data and pagination info
 * @param {Object} response - Paginated API response
 * @returns {Object} Object containing content and pagination info
 */
export const unwrapPaginatedResponse = (response) => {
  const data = unwrapApiResponse(response);
  if (!data) return { content: [], pagination: null };

  return {
    content: data.content || [],
    pagination: data.pageable ? formatPaginationInfo(data) : null,
  };
};

// =============================================================================
// STOCK CHECK RESULT FORMATTERS
// =============================================================================

/**
 * Groups stock check results by checkReference and creates summary objects
 * @param {Array} results - Array of individual stock check results
 * @returns {Array} Array of grouped summaries with expandable line items
 */
export const formatStockCheckSummaries = (results) => {
  if (!Array.isArray(results)) return [];

  // Group results by checkReference
  const grouped = groupBy(results, "checkReference");

  // Transform each group into a summary object
  return Object.entries(grouped).map(([checkReference, lineItems]) => {
    const formattedLineItems = formatStockCheckResults(lineItems);
    const firstItem = lineItems[0] || {};

    // Calculate summary statistics
    const totalItems = lineItems.length;
    const itemsWithVariance = lineItems.filter(
      (item) => Math.abs(item.variance || 0) > 0
    ).length;
    const itemsMatching = lineItems.filter(
      (item) => item.checkStatus === "MATCH"
    ).length;
    const shortages = lineItems.filter(
      (item) => item.checkStatus === "SHORTAGE"
    ).length;
    const overages = lineItems.filter(
      (item) => item.checkStatus === "OVERAGE"
    ).length;

    return {
      // Core identifiers
      checkReference: checkReference || "Unknown",
      checkDate: formatDateTime(firstItem.checkDate),
      checkedBy: firstItem.checkedBy || "",

      // Summary statistics
      totalItems,
      itemsWithVariance,
      itemsMatching,
      shortages,
      overages,

      // Calculated percentages
      accuracyRate: calculatePercentage(itemsMatching, totalItems),
      varianceRate: calculatePercentage(itemsWithVariance, totalItems),

      // Status and colors
      overallStatus: calculateOverallStatus(lineItems),
      statusColor: getOverallStatusColor(lineItems),
      statusLabel: formatOverallStatus(lineItems),

      // Detailed line items (for expansion)
      lineItems: formattedLineItems,

      // Display helpers
      hasVariances: itemsWithVariance > 0,
      requiresAttention: lineItems.some(
        (item) => item.checkStatus !== "MATCH" && !item.processed
      ),
      isFullyProcessed: lineItems.every(
        (item) => item.checkStatus === "MATCH" || item.processed
      ),

      // Raw values for further processing
      rawCheckDate: firstItem.checkDate,
      rawLineItems: lineItems,
    };
  });
};

/**
 * Formats a single stock check result for display
 * @param {Object} result - Raw stock check result from API
 * @returns {Object} Formatted stock check result
 */
export const formatStockCheckResult = (result) => {
  if (!result) return null;

  return {
    // Core identifiers
    checkResultId: result.checkResultId,
    productId: result.productId,
    productName: result.productName,

    // Quantities and variance
    expectedQuantity: formatQuantity(result.expectedQuantity),
    actualQuantity: formatQuantity(result.actualQuantity),
    variance: formatVariance(result.variance),
    variancePercentage: formatPercentage(result.variancePercentage),

    // Status and messaging
    checkStatus: result.checkStatus,
    statusLabel: formatCheckStatus(result.checkStatus),
    statusColor: getStatusColor(result.checkStatus),
    message: result.message || "", // Dates and metadata
    checkDate: formatDateTime(result.checkTimestamp || result.checkDate),
    checkedBy: result.checkedBy,
    checkReference: result.checkReference || "",
    notes: result.notes || "",

    // Processing status
    processed: result.processed || false,
    processedBy: result.processedBy || "",
    processedDate: result.processedDate
      ? formatDateTime(result.processedDate)
      : "",

    // Raw values for calculations
    rawExpectedQuantity: result.expectedQuantity,
    rawActualQuantity: result.actualQuantity,
    rawVariance: result.variance,
    rawVariancePercentage: result.variancePercentage,
    rawCheckDate: result.checkTimestamp || result.checkDate,

    // Display helpers
    hasVariance: Math.abs(result.variance || 0) > 0,
    isShortage: result.checkStatus === "SHORTAGE",
    isOverage: result.checkStatus === "OVERAGE",
    isMatch: result.checkStatus === "MATCH",
    requiresAttention: result.checkStatus !== "MATCH" && !result.processed,
  };
};

/**
 * Formats an array of stock check results
 * @param {Array} results - Array of raw stock check results
 * @returns {Array} Array of formatted stock check results
 */
export const formatStockCheckResults = (results) => {
  if (!Array.isArray(results)) return [];
  return results.map(formatStockCheckResult);
};

/**
 * Formats batch stock check results with summary information
 * @param {Array} results - Array of raw batch stock check results
 * @returns {Object} Formatted batch results with summary
 */
export const formatBatchStockCheckResults = (results) => {
  if (!Array.isArray(results)) return { results: [], summary: null };

  const formattedResults = formatStockCheckResults(results);
  const summary = calculateBatchSummary(formattedResults);

  return {
    results: formattedResults,
    summary,
  };
};

/**
 * Formats stock check summary statistics
 * @param {Object} summary - Raw summary data from API
 * @returns {Object} Formatted summary statistics
 */
export const formatStockCheckSummary = (summary) => {
  if (!summary) return null;

  return {
    totalChecks: formatNumber(summary.totalChecks),
    checksWithVariance: formatNumber(summary.checksWithVariance),
    checksWithoutVariance: formatNumber(summary.checksWithoutVariance),
    averageVariance: formatVariance(summary.averageVariance),
    totalVarianceValue: formatCurrency(summary.totalVarianceValue),

    // Calculated percentages
    varianceRate: calculatePercentage(
      summary.checksWithVariance,
      summary.totalChecks
    ),
    accuracyRate: calculatePercentage(
      summary.checksWithoutVariance,
      summary.totalChecks
    ),

    // Raw values
    rawTotalChecks: summary.totalChecks,
    rawChecksWithVariance: summary.checksWithVariance,
    rawChecksWithoutVariance: summary.checksWithoutVariance,
    rawAverageVariance: summary.averageVariance,
    rawTotalVarianceValue: summary.totalVarianceValue,
  };
};

// =============================================================================
// PRODUCT LIST FORMATTERS
// =============================================================================

/**
 * Formats a single product for display in stock check interface
 * @param {Object} product - Raw product data from API
 * @returns {Object} Formatted product data
 */
export const formatProduct = (product) => {
  if (!product) return null;

  return {
    // Core identifiers
    id: product.id,
    name: product.name,

    // Category information
    categoryId: product.categoryId,
    categoryName: product.categoryName,

    // Pricing
    purchasePrice: formatCurrency(product.purchasePrice),
    sellingPrice: formatCurrency(product.sellingPrice),

    // Inventory details
    unit: product.unit || "PCS",
    reorderLevel: formatQuantity(product.reorderLevel),
    currentStock: formatQuantity(product.currentStock),

    // Display helpers
    displayName: `${product.name} (${product.unit || "PCS"})`,
    lowStock: product.currentStock <= product.reorderLevel,

    // Raw values for calculations
    rawPurchasePrice: product.purchasePrice,
    rawSellingPrice: product.sellingPrice,
    rawReorderLevel: product.reorderLevel,
    rawCurrentStock: product.currentStock,
  };
};

/**
 * Formats an array of products for product list display
 * @param {Array} products - Array of raw product data
 * @returns {Array} Array of formatted products
 */
export const formatProducts = (products) => {
  if (!Array.isArray(products)) return [];
  return products.map(formatProduct);
};

/**
 * Formats paginated product list response
 * @param {Object} paginatedResponse - Raw paginated product response
 * @returns {Object} Formatted paginated product data
 */
export const formatPaginatedProducts = (paginatedResponse) => {
  if (!paginatedResponse) return { products: [], pagination: null };

  return {
    products: formatProducts(paginatedResponse.content || []),
    pagination: formatPaginationInfo(paginatedResponse),
  };
};

// =============================================================================
// STOCK CHECK LINE ITEM FORMATTERS (for multiline interface)
// =============================================================================

/**
 * Formats a stock check line item for the multiline interface
 * @param {Object} lineItem - Stock check line item data
 * @returns {Object} Formatted line item
 */
export const formatStockCheckLineItem = (lineItem) => {
  if (!lineItem) return null;

  return {
    // Product information
    productId: lineItem.productId,
    productName: lineItem.productName || "",
    unit: lineItem.unit || "PCS",
    currentStock: formatQuantity(lineItem.currentStock),

    // Check data
    expectedQuantity: lineItem.expectedQuantity || 0,
    notes: lineItem.notes || "",

    // Validation
    isValid: lineItem.productId && lineItem.expectedQuantity >= 0,

    // Display helpers
    displayName: lineItem.productName
      ? `${lineItem.productName} (${lineItem.unit || "PCS"})`
      : "Select Product",

    // Raw values
    rawExpectedQuantity: lineItem.expectedQuantity,
    rawCurrentStock: lineItem.currentStock,
  };
};

/**
 * Formats array of stock check line items
 * @param {Array} lineItems - Array of line items
 * @returns {Array} Array of formatted line items
 */
export const formatStockCheckLineItems = (lineItems) => {
  if (!Array.isArray(lineItems)) return [];
  return lineItems.map(formatStockCheckLineItem);
};

// =============================================================================
// HELPER FORMATTING FUNCTIONS
// =============================================================================

/**
 * Formats quantity values
 * @param {number} quantity - Quantity value
 * @returns {string} Formatted quantity
 */
const formatQuantity = (quantity) => {
  if (quantity == null) return "0";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(quantity);
};

/**
 * Formats variance values with appropriate sign
 * @param {number} variance - Variance value
 * @returns {string} Formatted variance with sign
 */
const formatVariance = (variance) => {
  if (variance == null) return "0";
  const formatted = formatQuantity(Math.abs(variance));
  if (variance > 0) return `+${formatted}`;
  if (variance < 0) return `-${formatted}`;
  return formatted;
};

/**
 * Formats percentage values
 * @param {number} percentage - Percentage value
 * @returns {string} Formatted percentage
 */
const formatPercentage = (percentage) => {
  if (percentage == null) return "0%";
  return `${percentage.toFixed(1)}%`;
};

/**
 * Formats currency values
 * @param {number} amount - Currency amount
 * @returns {string} Formatted currency
 */
const formatCurrency = (amount) => {
  if (amount == null) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

/**
 * Formats numbers with commas
 * @param {number} number - Number to format
 * @returns {string} Formatted number
 */
const formatNumber = (number) => {
  if (number == null) return "0";
  return new Intl.NumberFormat("en-US").format(number);
};

/**
 * Formats date and time
 * @param {string} dateTimeString - ISO datetime string
 * @returns {string} Formatted datetime
 */
const formatDateTime = (dateTimeString) => {
  if (!dateTimeString) return "";
  return new Date(dateTimeString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Formats check status for display
 * @param {string} status - Check status (MATCH, SHORTAGE, OVERAGE)
 * @returns {string} Human-readable status
 */
const formatCheckStatus = (status) => {
  const statusMap = {
    MATCH: "Match",
    SHORTAGE: "Shortage",
    OVERAGE: "Overage",
  };
  return statusMap[status] || status;
};

/**
 * Gets color class for check status
 * @param {string} status - Check status
 * @returns {string} CSS color class
 */
const getStatusColor = (status) => {
  const colorMap = {
    MATCH: "success",
    SHORTAGE: "danger",
    OVERAGE: "warning",
  };
  return colorMap[status] || "secondary";
};

/**
 * Formats pagination information
 * @param {Object} paginatedData - Paginated response data
 * @returns {Object} Formatted pagination info
 */
const formatPaginationInfo = (paginatedData) => {
  if (!paginatedData.pageable) return null;

  return {
    currentPage: (paginatedData.pageable.pageNumber || 0) + 1, // Convert 0-based to 1-based
    totalPages: paginatedData.totalPages || 0,
    totalElements: paginatedData.totalElements || 0,
    pageSize: paginatedData.pageable.pageSize || paginatedData.size || 20,
    isFirst: paginatedData.first || false,
    isLast: paginatedData.last || false,
    hasNext: !(paginatedData.last || false),
    hasPrevious: !(paginatedData.first || false),
  };
};

/**
 * Calculates percentage
 * @param {number} part - Part value
 * @param {number} total - Total value
 * @returns {string} Formatted percentage
 */
const calculatePercentage = (part, total) => {
  if (!total || total === 0) return "0%";
  return formatPercentage((part / total) * 100);
};

/**
 * Calculates summary for batch stock check results
 * @param {Array} results - Array of formatted stock check results
 * @returns {Object} Batch summary
 */
const calculateBatchSummary = (results) => {
  const total = results.length;
  const withVariance = results.filter((r) => r.hasVariance).length;
  const shortcuts = results.filter((r) => r.isShortage).length;
  const overages = results.filter((r) => r.isOverage).length;
  const matches = results.filter((r) => r.isMatch).length;

  return {
    totalItems: total,
    itemsWithVariance: withVariance,
    itemsWithoutVariance: matches,
    shortages: shortcuts,
    overages: overages,
    matches: matches,
    varianceRate: calculatePercentage(withVariance, total),
    accuracyRate: calculatePercentage(matches, total),
  };
};

/**
 * Groups an array of objects by a specified key
 * @param {Array} array - Array to group
 * @param {string} key - Key to group by
 * @returns {Object} Grouped object with key as property names
 */
const groupBy = (array, key) => {
  return array.reduce((groups, item) => {
    const group = item[key] || "Unknown";
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(item);
    return groups;
  }, {});
};

/**
 * Calculates overall status for a group of stock check results
 * @param {Array} lineItems - Array of line item results
 * @returns {string} Overall status
 */
const calculateOverallStatus = (lineItems) => {
  if (!Array.isArray(lineItems) || lineItems.length === 0) {
    return "UNKNOWN";
  }

  const hasVariances = lineItems.some(
    (item) => Math.abs(item.variance || 0) > 0
  );
  const allProcessed = lineItems.every(
    (item) => item.checkStatus === "MATCH" || item.processed
  );

  if (!hasVariances) return "COMPLETE_MATCH";
  if (allProcessed) return "COMPLETE_PROCESSED";
  return "PENDING_REVIEW";
};

/**
 * Gets color class for overall status
 * @param {Array} lineItems - Array of line item results
 * @returns {string} CSS color class
 */
const getOverallStatusColor = (lineItems) => {
  const status = calculateOverallStatus(lineItems);
  const colorMap = {
    COMPLETE_MATCH: "success",
    COMPLETE_PROCESSED: "info",
    PENDING_REVIEW: "warning",
    UNKNOWN: "secondary",
  };
  return colorMap[status] || "secondary";
};

/**
 * Formats overall status for display
 * @param {Array} lineItems - Array of line item results
 * @returns {string} Human-readable status
 */
const formatOverallStatus = (lineItems) => {
  const status = calculateOverallStatus(lineItems);
  const statusMap = {
    COMPLETE_MATCH: "Complete - All Match",
    COMPLETE_PROCESSED: "Complete - Processed",
    PENDING_REVIEW: "Pending Review",
    UNKNOWN: "Unknown",
  };
  return statusMap[status] || status;
};

// =============================================================================
// GROUPED STOCK CHECK RESULT FORMATTERS
// =============================================================================

/**
 * Groups stock check results by checkReference to create master-detail structure
 * @param {Array} results - Array of formatted stock check results
 * @returns {Array} Array of grouped stock check summaries
 */
export const groupStockCheckResultsByReference = (results) => {
  if (!Array.isArray(results)) return [];

  // Group results by checkReference
  const grouped = results.reduce((groups, result) => {
    const key = result.checkReference || "UNKNOWN";
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(result);
    return groups;
  }, {});

  // Convert groups to summary objects
  return Object.entries(grouped).map(([checkReference, items]) =>
    createStockCheckSummaryFromGroup(checkReference, items)
  );
};

/**
 * Creates a summary object from a group of stock check results
 * @param {string} checkReference - The grouping key
 * @param {Array} items - Array of stock check results in this group
 * @returns {Object} Summary object with aggregate data
 */
export const createStockCheckSummaryFromGroup = (checkReference, items) => {
  if (!Array.isArray(items) || items.length === 0) return null;

  const firstItem = items[0];
  const totalItems = items.length;
  const itemsWithVariance = items.filter((item) => item.hasVariance).length;
  const shortages = items.filter((item) => item.isShortage).length;
  const overages = items.filter((item) => item.isOverage).length;
  const matches = items.filter((item) => item.isMatch).length;
  const unprocessedItems = items.filter(
    (item) => item.requiresAttention
  ).length;

  // Determine overall status
  let overallStatus, overallStatusColor;
  if (itemsWithVariance === 0) {
    overallStatus = "All Match";
    overallStatusColor = "success";
  } else if (unprocessedItems > 0) {
    overallStatus = "Requires Attention";
    overallStatusColor = "danger";
  } else {
    overallStatus = "Has Variances";
    overallStatusColor = "warning";
  }

  return {
    // Core identifiers
    checkReference,
    summaryId: `summary-${checkReference}`,

    // Aggregate counts
    totalItems,
    itemsWithVariance,
    itemsWithoutVariance: matches,
    shortages,
    overages,
    matches,
    unprocessedItems,

    // Metadata from first item
    checkDate: firstItem.checkDate,
    checkedBy: firstItem.checkedBy,
    rawCheckDate: firstItem.rawCheckDate,

    // Overall status
    overallStatus,
    overallStatusColor,
    statusLabel: overallStatus,
    statusColor: overallStatusColor,

    // Calculated percentages
    accuracyRate: calculatePercentage(matches, totalItems),
    varianceRate: calculatePercentage(itemsWithVariance, totalItems),

    // UI state
    isExpanded: false,
    isSummary: true,

    // Detailed items for expansion
    details: items,

    // Display helpers
    hasVariances: itemsWithVariance > 0,
    requiresAttention: unprocessedItems > 0,
    summaryText: `${totalItems} items • ${matches} matches • ${itemsWithVariance} variances`,
  };
};

/**
 * Formats grouped stock check results for master-detail display
 * @param {Array} results - Array of raw stock check results
 * @returns {Object} Object containing grouped summaries and details
 */
export const formatGroupedStockCheckResults = (results) => {
  if (!Array.isArray(results)) return { summaries: [], totalSummaries: 0 };

  // First format individual results
  const formattedResults = formatStockCheckResults(results);

  // Then group by checkReference
  const summaries = groupStockCheckResultsByReference(formattedResults);

  // Sort summaries by date (newest first)
  summaries.sort((a, b) => new Date(b.rawCheckDate) - new Date(a.rawCheckDate));

  return {
    summaries,
    totalSummaries: summaries.length,
    totalDetailedItems: formattedResults.length,
  };
};

/**
 * Formats paginated grouped stock check results
 * @param {Object} paginatedResponse - Raw paginated response
 * @returns {Object} Object containing grouped summaries with pagination
 */
export const formatPaginatedGroupedResults = (paginatedResponse) => {
  if (!paginatedResponse) return { summaries: [], pagination: null };

  const { summaries, totalSummaries, totalDetailedItems } =
    formatGroupedStockCheckResults(paginatedResponse.content || []);

  // Create custom pagination info for summaries
  const pagination = paginatedResponse.pageable
    ? {
        ...formatPaginationInfo(paginatedResponse),
        // Override with summary-specific data
        totalSummaries,
        totalDetailedItems,
      }
    : null;

  return {
    summaries,
    pagination,
  };
};

// =============================================================================
// EXPORT ALL FORMATTERS
// =============================================================================

export default {
  // Response unwrapping
  unwrapApiResponse,
  unwrapPaginatedResponse,

  // Stock check result formatters
  formatStockCheckSummaries,
  formatStockCheckResult,
  formatStockCheckResults,
  formatBatchStockCheckResults,
  formatStockCheckSummary,

  // Grouped result formatters
  groupStockCheckResultsByReference,
  createStockCheckSummaryFromGroup,
  formatGroupedStockCheckResults,
  formatPaginatedGroupedResults,

  // Product formatters
  formatProduct,
  formatProducts,
  formatPaginatedProducts,

  // Line item formatters
  formatStockCheckLineItem,
  formatStockCheckLineItems,
};
