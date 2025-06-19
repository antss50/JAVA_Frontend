// src/services/inventory-related/stock-check/stockCheckService.jsx

/**
 * Stock Check API Service Layer
 * Handles API calls and uses formatters to return display-ready data
 */

import {
  unwrapApiResponse,
  unwrapPaginatedResponse,
  formatStockCheckResult,
  formatStockCheckResults,
  formatBatchStockCheckResults,
  formatStockCheckSummary,
  formatProduct,
  formatProducts,
  formatPaginatedProducts,
  formatGroupedStockCheckResults,
  formatPaginatedGroupedResults,
} from "../../../utils/stock-check/stockFormatter.jsx";

// =============================================================================
// API CONFIGURATION
// =============================================================================

const BASE_URL = "http://localhost:8080/api";
const STOCK_CHECK_BASE = `${BASE_URL}/inventory/stock-check-results`;
const PRODUCTS_BASE = `${BASE_URL}/inventory/products`;

// Default headers for all requests
const getDefaultHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
});

// =============================================================================
// STOCK CHECK OPERATIONS
// =============================================================================

/**
 * Performs a single stock check
 * @param {Object} stockCheckRequest - Stock check request data
 * @returns {Object} Formatted stock check result
 */
export const performSingleStockCheck = async (stockCheckRequest) => {
  try {
    const response = await fetch(`${STOCK_CHECK_BASE}/perform-check`, {
      method: "POST",
      headers: getDefaultHeaders(),
      body: JSON.stringify(stockCheckRequest),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const unwrappedData = unwrapApiResponse(data);
    return formatStockCheckResult(unwrappedData);
  } catch (error) {
    console.error("Error performing single stock check:", error);
    throw error;
  }
};

/**
 * Performs batch stock check for multiple products
 * @param {Array} stockCheckRequests - Array of stock check requests
 * @returns {Object} Formatted batch stock check results with summary
 */
export const performBatchStockCheck = async (stockCheckRequests) => {
  try {
    const response = await fetch(`${STOCK_CHECK_BASE}/perform-check/batch`, {
      method: "POST",
      headers: getDefaultHeaders(),
      body: JSON.stringify(stockCheckRequests),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const unwrappedData = unwrapApiResponse(data);
    return formatBatchStockCheckResults(unwrappedData);
  } catch (error) {
    console.error("Error performing batch stock check:", error);
    throw error;
  }
};

// =============================================================================
// STOCK CHECK RESULTS RETRIEVAL
// =============================================================================

/**
 * Gets all stock check results with pagination and grouped formatting
 * @param {Object} params - Query parameters {page, size, sort, grouped}
 * @returns {Object} Formatted paginated stock check results (grouped or detailed)
 */
export const getStockCheckResults = async (params = {}) => {
  try {
    // Base query parameters for pagination and sorting
    const queryParams = new URLSearchParams({
      page: params.page || 0,
      size: params.size || 20,
      sort: params.sort || "checkTimestamp",
    });

    // Add any additional filter parameters that were passed in
    const validFilterKeys = [
      'startDate',
      'endDate',
      'status',
      'productId',
      'productName',
      'checkReference',
      'hasVariance'
    ];

    validFilterKeys.forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });

    const response = await fetch(`${STOCK_CHECK_BASE}?${queryParams}`, {
      headers: getDefaultHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Check if grouped formatting is requested
    if (params.grouped) {
      return formatPaginatedGroupedResults(data);
    } else {
      const { content, pagination } = unwrapPaginatedResponse(data);
      return {
        results: formatStockCheckResults(content),
        pagination,
      };
    }
  } catch (error) {
    console.error("Error fetching stock check results:", error);
    throw error;
  }
};

/**
 * Gets grouped stock check results (summary view)
 * @param {Object} params - Query parameters {page, size, sort}
 * @returns {Object} Formatted grouped stock check summaries
 */
export const getGroupedStockCheckResults = async (params = {}) => {
  return getStockCheckResults({ ...params, grouped: true });
};

/**
 * Gets stock check result by ID
 * @param {number} id - Stock check result ID
 * @returns {Object} Formatted stock check result
 */
export const getStockCheckResultById = async (id) => {
  try {
    const response = await fetch(`${STOCK_CHECK_BASE}/${id}`, {
      headers: getDefaultHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const unwrappedData = unwrapApiResponse(data);
    return formatStockCheckResult(unwrappedData);
  } catch (error) {
    console.error("Error fetching stock check result:", error);
    throw error;
  }
};

/**
 * Gets stock check results by product ID
 * @param {number} productId - Product ID
 * @param {Object} params - Query parameters {page, size}
 * @returns {Object} Formatted paginated stock check results for product
 */
export const getStockCheckResultsByProduct = async (productId, params = {}) => {
  try {
    const queryParams = new URLSearchParams({
      page: params.page || 0,
      size: params.size || 20,
    });

    const response = await fetch(
      `${STOCK_CHECK_BASE}/product/${productId}?${queryParams}`,
      {
        headers: getDefaultHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const { content, pagination } = unwrapPaginatedResponse(data);

    return {
      results: formatStockCheckResults(content),
      pagination,
    };
  } catch (error) {
    console.error("Error fetching stock check results by product:", error);
    throw error;
  }
};

/**
 * Gets stock check results by status
 * @param {string} status - Check status (MATCH, SHORTAGE, OVERAGE)
 * @param {Object} params - Query parameters {page, size}
 * @returns {Object} Formatted paginated stock check results by status
 */
export const getStockCheckResultsByStatus = async (status, params = {}) => {
  try {
    const queryParams = new URLSearchParams({
      page: params.page || 0,
      size: params.size || 20,
    });

    const response = await fetch(
      `${STOCK_CHECK_BASE}/status/${status}?${queryParams}`,
      {
        headers: getDefaultHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const { content, pagination } = unwrapPaginatedResponse(data);

    return {
      results: formatStockCheckResults(content),
      pagination,
    };
  } catch (error) {
    console.error("Error fetching stock check results by status:", error);
    throw error;
  }
};

/**
 * Gets stock check results by date range
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @param {Object} params - Query parameters {page, size}
 * @returns {Object} Formatted paginated stock check results by date range
 */
export const getStockCheckResultsByDateRange = async (
  startDate,
  endDate,
  params = {}
) => {
  try {
    const queryParams = new URLSearchParams({
      startDate,
      endDate,
      page: params.page || 0,
      size: params.size || 20,
    });

    const response = await fetch(
      `${STOCK_CHECK_BASE}/date-range?${queryParams}`,
      {
        headers: getDefaultHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const { content, pagination } = unwrapPaginatedResponse(data);

    return {
      results: formatStockCheckResults(content),
      pagination,
    };
  } catch (error) {
    console.error("Error fetching stock check results by date range:", error);
    throw error;
  }
};

/**
 * Gets latest stock check result for a product
 * @param {number} productId - Product ID
 * @returns {Object} Formatted latest stock check result
 */
export const getLatestStockCheckForProduct = async (productId) => {
  try {
    const response = await fetch(
      `${STOCK_CHECK_BASE}/product/${productId}/latest`,
      {
        headers: getDefaultHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const unwrappedData = unwrapApiResponse(data);
    return formatStockCheckResult(unwrappedData);
  } catch (error) {
    console.error("Error fetching latest stock check for product:", error);
    throw error;
  }
};

/**
 * Gets stock check results with variance above threshold
 * @param {number} threshold - Minimum variance threshold
 * @param {Object} params - Query parameters {page, size}
 * @returns {Object} Formatted paginated stock check results with variance
 */
export const getStockCheckResultsWithVariance = async (
  threshold = 0.0,
  params = {}
) => {
  try {
    const queryParams = new URLSearchParams({
      threshold: threshold.toString(),
      page: params.page || 0,
      size: params.size || 20,
    });

    const response = await fetch(
      `${STOCK_CHECK_BASE}/variance?${queryParams}`,
      {
        headers: getDefaultHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const { content, pagination } = unwrapPaginatedResponse(data);

    return {
      results: formatStockCheckResults(content),
      pagination,
    };
  } catch (error) {
    console.error("Error fetching stock check results with variance:", error);
    throw error;
  }
};

/**
 * Gets stock check summary statistics
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Object} Formatted stock check summary
 */
export const getStockCheckSummary = async (startDate, endDate) => {
  try {
    const queryParams = new URLSearchParams({
      startDate,
      endDate,
    });

    const response = await fetch(`${STOCK_CHECK_BASE}/summary?${queryParams}`, {
      headers: getDefaultHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const unwrappedData = unwrapApiResponse(data);
    return formatStockCheckSummary(unwrappedData);
  } catch (error) {
    console.error("Error fetching stock check summary:", error);
    throw error;
  }
};

// =============================================================================
// VARIANCE MANAGEMENT
// =============================================================================

/**
 * Gets unprocessed variances
 * @param {Object} params - Query parameters {page, size}
 * @returns {Object} Formatted paginated unprocessed variances
 */
export const getUnprocessedVariances = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams({
      page: params.page || 0,
      size: params.size || 20,
    });

    const response = await fetch(
      `${STOCK_CHECK_BASE}/unprocessed?${queryParams}`,
      {
        headers: getDefaultHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const { content, pagination } = unwrapPaginatedResponse(data);

    return {
      results: formatStockCheckResults(content),
      pagination,
    };
  } catch (error) {
    console.error("Error fetching unprocessed variances:", error);
    throw error;
  }
};

/**
 * Gets count of unprocessed variances
 * @returns {number} Count of unprocessed variances
 */
export const getUnprocessedVariancesCount = async () => {
  try {
    const response = await fetch(`${STOCK_CHECK_BASE}/unprocessed/count`, {
      headers: getDefaultHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const unwrappedData = unwrapApiResponse(data);
    return unwrappedData;
  } catch (error) {
    console.error("Error fetching unprocessed variances count:", error);
    throw error;
  }
};

/**
 * Processes a variance
 * @param {number} id - Stock check result ID
 * @param {string} approvedBy - Username of approver
 * @returns {Object} Formatted processed stock check result
 */
export const processVariance = async (id, approvedBy) => {
  try {
    const queryParams = new URLSearchParams({
      approvedBy,
    });

    const response = await fetch(
      `${STOCK_CHECK_BASE}/${id}/process?${queryParams}`,
      {
        method: "POST",
        headers: getDefaultHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const unwrappedData = unwrapApiResponse(data);
    return formatStockCheckResult(unwrappedData);
  } catch (error) {
    console.error("Error processing variance:", error);
    throw error;
  }
};

// =============================================================================
// PRODUCT OPERATIONS FOR STOCK CHECK
// =============================================================================

/**
 * Gets all products with pagination
 * @param {Object} params - Query parameters {page, size, sort}
 * @returns {Object} Formatted paginated products
 */
export const getProducts = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams({
      page: params.page || 0,
      size: params.size || 20,
      sort: params.sort || "name",
    });

    const response = await fetch(`${PRODUCTS_BASE}?${queryParams}`, {
      headers: getDefaultHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const { content, pagination } = unwrapPaginatedResponse(data);

    return {
      products: formatProducts(content),
      pagination,
    };
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
};

/**
 * Searches products by name
 * @param {string} query - Search query
 * @param {Object} params - Query parameters {page, size}
 * @returns {Object} Formatted paginated search results
 */
export const searchProducts = async (query, params = {}) => {
  try {
    const queryParams = new URLSearchParams({
      query,
      page: params.page || 0,
      size: params.size || 20,
    });

    const response = await fetch(`${PRODUCTS_BASE}/search?${queryParams}`, {
      headers: getDefaultHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const { content, pagination } = unwrapPaginatedResponse(data);

    return {
      products: formatProducts(content),
      pagination,
    };
  } catch (error) {
    console.error("Error searching products:", error);
    throw error;
  }
};

/**
 * Gets a single product by ID
 * @param {number} productId - Product ID
 * @returns {Object} Formatted product data
 */
export const getProductById = async (productId) => {
  try {
    const response = await fetch(`${PRODUCTS_BASE}/${productId}`, {
      headers: getDefaultHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const unwrappedData = unwrapApiResponse(data);
    return formatProduct(unwrappedData);
  } catch (error) {
    console.error("Error fetching product:", error);
    throw error;
  }
};

// =============================================================================
// EXPORT AND REPORTING
// =============================================================================

/**
 * Exports stock check results to CSV
 * @param {Object} filters - Export filters {startDate, endDate}
 * @returns {Blob} CSV file blob
 */
export const exportStockCheckResultsToCSV = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (filters.startDate) queryParams.append("startDate", filters.startDate);
    if (filters.endDate) queryParams.append("endDate", filters.endDate);

    const response = await fetch(
      `${STOCK_CHECK_BASE}/export/csv?${queryParams}`,
      {
        headers: getDefaultHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.blob();
  } catch (error) {
    console.error("Error exporting stock check results to CSV:", error);
    throw error;
  }
};

/**
 * Gets statistical data for stock checks
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Object} Formatted statistical data
 */
export const getStockCheckStatistics = async (startDate, endDate) => {
  try {
    const queryParams = new URLSearchParams({
      startDate,
      endDate,
    });

    const response = await fetch(`${STOCK_CHECK_BASE}/stats?${queryParams}`, {
      headers: getDefaultHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const unwrappedData = unwrapApiResponse(data);
    return unwrappedData; // Statistics might need custom formatting
  } catch (error) {
    console.error("Error fetching stock check statistics:", error);
    throw error;
  }
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Builds a stock check request object
 * @param {Object} params - Request parameters
 * @returns {Object} Stock check request object
 */
export const buildStockCheckRequest = (params) => {
  return {
    productId: params.productId,
    expectedQuantity: params.expectedQuantity,
    checkedBy: params.checkedBy || localStorage.getItem("username") || "system",
    checkReference: params.checkReference || generateCheckReference(),
    notes: params.notes || "",
  };
};

/**
 * Generates a unique check reference
 * @returns {string} Generated check reference
 */
const generateCheckReference = () => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const timeStr = date.toTimeString().slice(0, 8).replace(/:/g, "");
  return `CHK-${dateStr}-${timeStr}`;
};

// Export all service functions
export default {
  // Stock check operations
  performSingleStockCheck,
  performBatchStockCheck,

  // Results retrieval
  getStockCheckResults,
  getGroupedStockCheckResults,
  getStockCheckResultById,
  getStockCheckResultsByProduct,
  getStockCheckResultsByStatus,
  getStockCheckResultsByDateRange,
  getLatestStockCheckForProduct,
  getStockCheckResultsWithVariance,
  getStockCheckSummary,

  // Variance management
  getUnprocessedVariances,
  getUnprocessedVariancesCount,
  processVariance,

  // Product operations
  getProducts,
  searchProducts,
  getProductById,

  // Export and reporting
  exportStockCheckResultsToCSV,
  getStockCheckStatistics,

  // Utilities
  buildStockCheckRequest,
};
