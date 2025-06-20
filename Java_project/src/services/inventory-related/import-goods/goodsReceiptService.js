/**
 * Goods Receipt API Service
 * Handles all HTTP requests related to goods receipt operations
 */

import {
  formatGoodsReceiptForApi,
  formatGoodsReceiptResponse,
  formatApiError,
  validateGoodsReceiptRequest,
} from "../../../utils/inventory-related/goodsReceiptFormatter.js";

const BASE_URL = "http://localhost:8080/api/inventory/stock";

/**
 * Goods Receipt API Service Class
 */
class GoodsReceiptApiService {
  /**
   * Generic request handler with error handling
   * @param {string} url - Request URL
   * @param {Object} options - Fetch options
   * @returns {Promise} Response data or throws error
   */
  async makeRequest(url, options = {}) {
    try {
      const defaultOptions = {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      };

      const response = await fetch(url, { ...defaultOptions, ...options });

      // Handle different response statuses
      if (response.status === 204) {
        return null; // No content
      }

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw {
          response: {
            status: response.status,
            data: data || { error: response.statusText },
          },
        };
      }

      return data;
    } catch (error) {
      // Re-throw with consistent error format
      if (error.response) {
        throw error; // Already formatted
      }

      // Handle network errors or other issues
      throw {
        response: {
          status: 0,
          data: { error: error.message || "Network error" },
        },
      };
    }
  }

  /**
   * Records a multi-line goods receipt
   * @param {Object} goodsReceiptData - Goods receipt data from form
   * @returns {Promise<Object>} Formatted response with stock ledger entries
   */
  async recordGoodsReceipt(goodsReceiptData) {
    try {
      // Validate the request data
      const validation = validateGoodsReceiptRequest(goodsReceiptData);
      if (!validation.isValid) {
        throw {
          response: {
            status: 400,
            data: {
              error: "Validation failed",
              message: "Please fix the following errors:",
              validation: validation.errors,
            },
          },
        };
      }

      // Format data for API
      const apiData = formatGoodsReceiptForApi(goodsReceiptData);

      console.log("Recording goods receipt:", apiData);

      const response = await this.makeRequest(`${BASE_URL}/goods-receipt`, {
        method: "POST",
        body: JSON.stringify(apiData),
      });

      // Format and return response
      return formatGoodsReceiptResponse(response);
    } catch (error) {
      console.error("Error recording goods receipt:", error);
      throw formatApiError(error);
    }
  }

  /**
   * Gets goods receipt history (if supported by backend)
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Goods receipt history
   */
  async getGoodsReceiptHistory(filters = {}) {
    try {
      const queryParams = new URLSearchParams();

      if (filters.vendorId) queryParams.append("vendorId", filters.vendorId);
      if (filters.warehouseId)
        queryParams.append("warehouseId", filters.warehouseId);
      if (filters.startDate) queryParams.append("startDate", filters.startDate);
      if (filters.endDate) queryParams.append("endDate", filters.endDate);
      if (filters.documentReference)
        queryParams.append("documentReference", filters.documentReference);

      const queryString = queryParams.toString();
      const url = `${BASE_URL}/goods-receipts${
        queryString ? `?${queryString}` : ""
      }`;

      const response = await this.makeRequest(url);

      return response || { data: [], totalElements: 0 };
    } catch (error) {
      console.error("Error fetching goods receipt history:", error);
      throw formatApiError(error);
    }
  }

  /**
   * Gets a specific goods receipt by document reference
   * @param {string} documentReference - Document reference to search for
   * @returns {Promise<Object>} Goods receipt details
   */
  async getGoodsReceiptByReference(documentReference) {
    try {
      if (!documentReference) {
        throw new Error("Document reference is required");
      }

      const response = await this.makeRequest(
        `${BASE_URL}/goods-receipt/${encodeURIComponent(documentReference)}`
      );

      return formatGoodsReceiptResponse(response);
    } catch (error) {
      console.error("Error fetching goods receipt:", error);
      throw formatApiError(error);
    }
  }

  /**
   * Validates goods receipt data without submitting
   * @param {Object} goodsReceiptData - Goods receipt data to validate
   * @returns {Promise<Object>} Validation result
   */
  async validateGoodsReceipt(goodsReceiptData) {
    try {
      const validation = validateGoodsReceiptRequest(goodsReceiptData);

      // You could also make an API call to validate on backend if needed
      // const response = await this.makeRequest(`${BASE_URL}/goods-receipt/validate`, {
      //   method: "POST",
      //   body: JSON.stringify(formatGoodsReceiptForApi(goodsReceiptData)),
      // });

      return {
        isValid: validation.isValid,
        errors: validation.errors,
        warnings: [], // Could be populated from backend validation
      };
    } catch (error) {
      console.error("Error validating goods receipt:", error);
      throw formatApiError(error);
    }
  }

  /**
   * Checks if a document reference is unique
   * @param {string} documentReference - Document reference to check
   * @returns {Promise<boolean>} True if unique, false if already exists
   */
  async isDocumentReferenceUnique(documentReference) {
    try {
      if (!documentReference) return false;

      // This would typically be a specific endpoint for checking uniqueness
      const response = await this.makeRequest(
        `${BASE_URL}/goods-receipt/check-reference/${encodeURIComponent(
          documentReference
        )}`
      );

      return response?.isUnique || false;
    } catch (error) {
      // If the endpoint doesn't exist or returns 404, assume it's unique
      if (error.response?.status === 404) {
        return true;
      }

      console.error("Error checking document reference uniqueness:", error);
      // Return false to be safe
      return false;
    }
  }

  /**
   * Gets available warehouses for goods receipt
   * @returns {Promise<Array>} List of available warehouses
   */
  async getAvailableWarehouses() {
    try {
      const response = await this.makeRequest(
        "http://localhost:8080/api/inventory/warehouses"
      );

      return response?.data || response || [];
    } catch (error) {
      console.error("Error fetching warehouses:", error);
      // Return default warehouse if API fails
      return [
        {
          id: 1,
          name: "Main Warehouse",
          isActive: true,
        },
      ];
    }
  }

  /**
   * Gets vendor information for goods receipt
   * @param {string} vendorId - Vendor ID to get info for
   * @returns {Promise<Object>} Vendor information
   */
  async getVendorInfo(vendorId) {
    try {
      if (!vendorId) return null;

      const response = await this.makeRequest(
        `http://localhost:8080/api/vendors/${encodeURIComponent(vendorId)}`
      );

      return response || null;
    } catch (error) {
      console.error("Error fetching vendor info:", error);
      return null;
    }
  }
}

// Create and export singleton instance
const goodsReceiptApiService = new GoodsReceiptApiService();
export default goodsReceiptApiService;

// Also export the class for testing purposes
export { GoodsReceiptApiService };
