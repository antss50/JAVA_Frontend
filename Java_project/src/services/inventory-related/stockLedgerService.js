/**
 * Stock Ledger API Service
 * Handles all HTTP requests for stock ledger operations
 */

import {
  formatStockAdjustmentRequest,
  formatGoodsReceiptRequest,
  formatStockDisposalRequest,
  formatApiResponse,
  formatErrorResponse,
  formatToISODate,
} from "../../utils/stock-check/stockLedgerFormatter.js";

// Base configuration
const BASE_URL = "http://localhost:8080/api/inventory/stock";

/**
 * Get authorization header
 * @returns {Object} Authorization headers
 */
const getAuthHeaders = () => {
  const token =
    localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

/**
 * Make HTTP request with error handling
 * @param {string} url - Request URL
 * @param {Object} options - Request options
 * @returns {Promise<Object>} Response data
 */
const makeRequest = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      headers: getAuthHeaders(),
      ...options,
    });

    // Handle non-JSON responses (like BigDecimal endpoints)
    const contentType = response.headers.get("content-type");

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = {
          message: `HTTP ${response.status}: ${response.statusText}`,
        };
      }
      throw {
        response: {
          data: errorData,
          status: response.status,
          statusText: response.statusText,
        },
      };
    }

    // Handle plain text responses (like current stock level)
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      return formatApiResponse(data);
    } else {
      // Handle plain text responses (BigDecimal values)
      const textData = await response.text();
      return {
        success: true,
        data: parseFloat(textData) || textData,
        timestamp: new Date(),
      };
    }
  } catch (error) {
    throw formatErrorResponse(error);
  }
};

/**
 * Stock Ledger API Service Class
 */
class StockLedgerService {
  /**
   * Get current stock level for a product
   * @param {number} productId - Product ID
   * @returns {Promise<number>} Current stock level
   */
  async getCurrentStock(productId) {
    const url = `${BASE_URL}/current?productId=${productId}`;
    const response = await makeRequest(url);
    return response.data;
  }

  /**
   * Check if sufficient stock is available
   * @param {number} productId - Product ID
   * @param {number} requiredQuantity - Required quantity
   * @returns {Promise<boolean>} Availability status
   */
  async checkStockAvailability(productId, requiredQuantity) {
    const url = `${BASE_URL}/check-availability?productId=${productId}&requiredQuantity=${requiredQuantity}`;
    const response = await makeRequest(url);
    return response.data;
  }

  /**
   * Get all product stocks
   * @returns {Promise<Array>} Array of product stock data
   */
  async getAllProductStocks() {
    const url = `${BASE_URL}/all`;
    const response = await makeRequest(url);
    return response.data;
  }

  /**
   * Get stock movements for a specific product
   * @param {number} productId - Product ID
   * @returns {Promise<Array>} Array of stock movements
   */
  async getProductStockMovements(productId) {
    const url = `${BASE_URL}/movements/product/${productId}`;
    const response = await makeRequest(url);
    return response.data;
  }

  /**
   * Get stock movements within a date range
   * @param {string|Date} startDate - Start date
   * @param {string|Date} endDate - End date
   * @returns {Promise<Array>} Array of stock movements
   */
  async getStockMovementsByDateRange(startDate, endDate) {
    const formattedStartDate = formatToISODate(startDate);
    const formattedEndDate = formatToISODate(endDate);
    const url = `${BASE_URL}/movements/date-range?startDate=${formattedStartDate}&endDate=${formattedEndDate}`;
    const response = await makeRequest(url);
    return response.data;
  }
  /**
   * Get stock movements by movement type
   * @param {string} movementType - Movement type (RECEIPT, SALE, ADJUSTMENT, TRANSFER, DISPOSAL)
   * @param {Object} filters - Optional filters
   * @param {number} filters.productId - Filter by product ID
   * @param {number} filters.categoryId - Filter by category ID
   * @returns {Promise<Array>} Array of stock movements
   */
  async getStockMovementsByType(movementType, filters = {}) {
    let url = `${BASE_URL}/movements/type/${movementType}`;

    const queryParams = new URLSearchParams();
    if (filters.productId) queryParams.append("productId", filters.productId);
    if (filters.categoryId)
      queryParams.append("categoryId", filters.categoryId);

    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }

    console.log("Fetching from URL:", url);
    const response = await makeRequest(url);
    console.log("Raw API response:", response);
    console.log("Returning data:", response.data);
    return response.data;
  }

  /**
   * Record stock adjustment
   * @param {Object} adjustmentData - Stock adjustment data
   * @returns {Promise<Object>} Adjustment result
   */
  async adjustStock(adjustmentData) {
    const url = `${BASE_URL}/adjust`;
    const formattedData = formatStockAdjustmentRequest(adjustmentData);

    const response = await makeRequest(url, {
      method: "POST",
      body: JSON.stringify(formattedData),
    });

    return response.data;
  }

  /**
   * Record goods receipt
   * @param {Object} receiptData - Goods receipt data
   * @returns {Promise<Array>} Array of stock movements created
   */
  async recordGoodsReceipt(receiptData) {
    const url = `${BASE_URL}/goods-receipt`;
    const formattedData = formatGoodsReceiptRequest(receiptData);

    const response = await makeRequest(url, {
      method: "POST",
      body: JSON.stringify(formattedData),
    });

    return response.data;
  }

  /**
   * Record stock disposal
   * @param {Object} disposalData - Stock disposal data
   * @returns {Promise<Array>} Array of stock movements created
   */
  async recordStockDisposal(disposalData) {
    const url = `${BASE_URL}/disposals`;
    const formattedData = formatStockDisposalRequest(disposalData);

    const response = await makeRequest(url, {
      method: "POST",
      body: JSON.stringify(formattedData),
    });

    return response.data;
  }

  /**
   * Get stock level with optional check
   * @param {number} productId - Product ID
   * @param {number} expectedQuantity - Expected quantity (optional)
   * @param {string} checkedBy - User performing check (optional)
   * @returns {Promise<Object>} Stock level with check result
   */
  async getStockLevelWithCheck(
    productId,
    expectedQuantity = null,
    checkedBy = null
  ) {
    let url = `${BASE_URL}/level-with-check?productId=${productId}`;

    if (expectedQuantity !== null) {
      url += `&expectedQuantity=${expectedQuantity}`;
    }
    if (checkedBy) {
      url += `&checkedBy=${encodeURIComponent(checkedBy)}`;
    }

    const response = await makeRequest(url);
    return response.data;
  }

  /**
   * Get comprehensive stock status
   * @param {number} productId - Product ID
   * @returns {Promise<Object>} Stock status data
   */
  async getStockStatus(productId) {
    const url = `${BASE_URL}/status?productId=${productId}`;
    const response = await makeRequest(url);
    return response.data;
  }

  /**
   * Bulk operations - Get multiple product stocks
   * @param {Array<number>} productIds - Array of product IDs
   * @returns {Promise<Array>} Array of stock levels
   */
  async getMultipleProductStocks(productIds) {
    const promises = productIds.map((id) => this.getCurrentStock(id));
    const results = await Promise.allSettled(promises);

    return productIds.map((id, index) => ({
      productId: id,
      stock:
        results[index].status === "fulfilled" ? results[index].value : null,
      error:
        results[index].status === "rejected" ? results[index].reason : null,
    }));
  }

  /**
   * Bulk check stock availability
   * @param {Array<Object>} checks - Array of {productId, requiredQuantity}
   * @returns {Promise<Array>} Array of availability results
   */
  async checkMultipleStockAvailability(checks) {
    const promises = checks.map((check) =>
      this.checkStockAvailability(check.productId, check.requiredQuantity)
    );
    const results = await Promise.allSettled(promises);

    return checks.map((check, index) => ({
      productId: check.productId,
      requiredQuantity: check.requiredQuantity,
      available:
        results[index].status === "fulfilled" ? results[index].value : false,
      error:
        results[index].status === "rejected" ? results[index].reason : null,
    }));
  }

  /**
   * Get recent stock movements (last 30 days)
   * @param {number} days - Number of days to look back (default: 30)
   * @returns {Promise<Array>} Array of recent stock movements
   */
  async getRecentStockMovements(days = 30) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.getStockMovementsByDateRange(startDate, endDate);
  }

  /**
   * Get low stock products (for dashboard/alerts)
   * @returns {Promise<Array>} Array of products with low stock
   */
  async getLowStockProducts() {
    try {
      const allStocks = await this.getAllProductStocks();

      // Filter products with low stock based on some criteria
      // This is a client-side filter since the API doesn't have a specific low stock endpoint
      const lowStockProducts = [];

      for (const product of allStocks) {
        try {
          const status = await this.getStockStatus(product.productId);
          if (
            status.status === "LOW_STOCK" ||
            status.currentStock <= status.minimumStock
          ) {
            lowStockProducts.push({
              ...product,
              stockStatus: status,
            });
          }
        } catch (error) {
          console.warn(
            `Could not get status for product ${product.productId}:`,
            error
          );
        }
      }

      return lowStockProducts;
    } catch (error) {
      console.error("Error getting low stock products:", error);
      throw error;
    }
  }

  /**
   * Export stock data (for reporting)
   * @param {Object} filters - Export filters
   * @param {Date} filters.startDate - Start date
   * @param {Date} filters.endDate - End date
   * @param {Array<number>} filters.productIds - Product IDs to include
   * @returns {Promise<Object>} Export data
   */
  async exportStockData(filters = {}) {
    try {
      const promises = [];

      // Get all stocks if no specific products requested
      if (!filters.productIds || filters.productIds.length === 0) {
        promises.push(this.getAllProductStocks());
      } else {
        promises.push(Promise.resolve([]));
      }

      // Get movements for date range if provided
      if (filters.startDate && filters.endDate) {
        promises.push(
          this.getStockMovementsByDateRange(filters.startDate, filters.endDate)
        );
      } else {
        promises.push(this.getRecentStockMovements(30));
      }

      const [allStocks, movements] = await Promise.all(promises);

      return {
        stocks: allStocks,
        movements: movements,
        exportDate: new Date(),
        filters: filters,
      };
    } catch (error) {
      console.error("Error exporting stock data:", error);
      throw error;
    }
  }
}

// Create and export service instance
const stockLedgerService = new StockLedgerService();

export default stockLedgerService;

// Export individual methods for selective imports
export const {
  getCurrentStock,
  checkStockAvailability,
  getAllProductStocks,
  getProductStockMovements,
  getStockMovementsByDateRange,
  getStockMovementsByType,
  adjustStock,
  recordGoodsReceipt,
  recordStockDisposal,
  getStockLevelWithCheck,
  getStockStatus,
  getMultipleProductStocks,
  checkMultipleStockAvailability,
  getRecentStockMovements,
  getLowStockProducts,
  exportStockData,
} = stockLedgerService;
