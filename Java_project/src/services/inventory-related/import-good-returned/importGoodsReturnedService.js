/**
 * Import Goods Returned API Service
 * Handles all HTTP requests to the Goods Returns API endpoints
 */

import {
  formatGoodsReturnForApi,
  formatGoodsReturnFromApi,
  formatApiError,
  formatStockMovementFromApi,
  formatWrappedApiResponse,
} from "../../../utils/inventory-related/importGoodsReturnedFormatter.js";

/**
 * Import Goods Returned API Service Class
 * Provides methods for recording goods returns to suppliers
 */
class ImportGoodsReturnedService {
  constructor() {
    this.baseURL = "http://localhost:8080/api/inventory/goods-returns";
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Gets authentication token from localStorage
   * @returns {string|null} JWT token
   */
  getAuthToken() {
    return localStorage.getItem("authToken");
  }

  /**
   * Makes authenticated API call with error handling
   * @param {string} url - API endpoint URL
   * @param {Object} options - Fetch options
   * @returns {Promise<any>} API response data
   */
  async apiCall(url, options = {}) {
    const token = this.getAuthToken();

    const defaultHeaders = {
      "Content-Type": "application/json",
    };

    // Add authentication header if token exists
    if (token) {
      defaultHeaders["Authorization"] = `Bearer ${token}`;
    }

    const requestOptions = {
      ...options,
      headers: { ...defaultHeaders, ...options.headers },
    };

    try {
      const response = await fetch(url, requestOptions);

      // Handle different response status codes
      if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem("authToken");
        throw new Error("Authentication failed. Please log in again.");
      }

      if (response.status === 403) {
        throw new Error("You don't have permission to perform this action.");
      }

      if (response.status === 404) {
        throw new Error("The requested resource was not found.");
      }

      if (response.status === 409) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            "Conflict: Return already recorded for this product and purchase order"
        );
      }
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Backend error response:", {
          status: response.status,
          statusText: response.statusText,
          errorData: errorData,
        });

        // Extract more detailed error information
        const errorMessage =
          errorData.message ||
          errorData.error ||
          errorData.details ||
          `HTTP error! status: ${response.status}`;

        throw new Error(errorMessage);
      }

      // Handle empty responses (204 No Content)
      if (response.status === 204) {
        return null;
      }

      return await response.json();
    } catch (error) {
      // Network or parsing errors
      if (error instanceof TypeError) {
        throw new Error("Network error. Please check your connection.");
      }
      throw error;
    }
  }
  /**
   * Records goods return to supplier
   * @param {Object} goodsReturnData - Goods return data
   * @returns {Promise<Object|Array>} Created goods return record(s)
   */ async recordGoodsReturn(goodsReturnData) {
    try {
      console.log("Raw return data received:", goodsReturnData); // Debug log

      let formattedData;
      try {
        formattedData = formatGoodsReturnForApi(goodsReturnData);
      } catch (formatterError) {
        console.error("Error in formatter:", formatterError);
        throw new Error(`Data formatting failed: ${formatterError.message}`);
      }
      console.log("Formatted data for API:", formattedData); // Debug log

      console.log(
        "JSON payload being sent:",
        JSON.stringify(formattedData, null, 2)
      ); // Debug log

      if (!formattedData) {
        throw new Error(
          "Invalid goods return data provided - formatter returned null"
        );
      }

      console.log("About to send POST request to:", this.baseURL); // Debug log

      const response = await this.apiCall(this.baseURL, {
        method: "POST",
        body: JSON.stringify(formattedData),
      });

      console.log("Response received - status:", response?.status); // Debug log
      console.log("API response:", response); // Debug log

      // Format response data for frontend consumption
      return formatGoodsReturnFromApi(response);
    } catch (error) {
      const formattedError = formatApiError(error);
      console.error("Error recording goods return:", formattedError);
      throw new Error(formattedError);
    }
  }

  /**
   * Gets all goods returns (if endpoint exists for listing)
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} List of goods returns
   */
  async getGoodsReturns(filters = {}) {
    try {
      const queryParams = new URLSearchParams();

      // Add filters to query parameters
      if (filters.supplierId) {
        queryParams.append("supplierId", filters.supplierId);
      }
      if (filters.purchaseOrderId) {
        queryParams.append("purchaseOrderId", filters.purchaseOrderId);
      }
      if (filters.startDate) {
        queryParams.append("startDate", filters.startDate);
      }
      if (filters.endDate) {
        queryParams.append("endDate", filters.endDate);
      }

      const url = queryParams.toString()
        ? `${this.baseURL}?${queryParams.toString()}`
        : this.baseURL;

      const response = await this.apiCall(url, {
        method: "GET",
      });

      // Format response data for frontend consumption
      return Array.isArray(response)
        ? response.map(formatGoodsReturnFromApi)
        : [];
    } catch (error) {
      const formattedError = formatApiError(error);
      console.error("Error fetching goods returns:", formattedError);
      throw new Error(formattedError);
    }
  }

  /**
   * Searches for bills that can be returned (bills with stockledger RECEIPT entries)
   * @param {Object} searchFilters - Search filters
   * @param {string} searchFilters.billNumber - Bill number to search for
   * @param {string} searchFilters.vendorName - Vendor name filter
   * @param {string} searchFilters.fromDate - Start date filter
   * @param {string} searchFilters.toDate - End date filter
   * @param {Object} pagination - Pagination parameters
   * @returns {Promise<Object>} Paginated bills that can be returned
   */
  async searchReturnableBills(searchFilters = {}, pagination = {}) {
    try {
      const queryParams = new URLSearchParams();

      // Add search filters
      if (searchFilters.billNumber) {
        queryParams.append("billNumber", searchFilters.billNumber);
      }
      if (searchFilters.vendorName) {
        queryParams.append("vendorName", searchFilters.vendorName);
      }
      if (searchFilters.fromDate) {
        queryParams.append("fromDate", searchFilters.fromDate);
      }
      if (searchFilters.toDate) {
        queryParams.append("toDate", searchFilters.toDate);
      }

      // Add pagination parameters
      queryParams.append("page", pagination.page || 0);
      queryParams.append("size", pagination.size || 20);
      queryParams.append("sort", pagination.sort || "billDate,desc");

      const url = `${
        this.baseURL
      }/returnable-bills/search?${queryParams.toString()}`;
      const response = await this.apiCall(url);

      return {
        success: true,
        data: formatWrappedApiResponse(response),
      };
    } catch (error) {
      const formattedError = formatApiError(error);
      console.error("Error searching returnable bills:", formattedError);
      return { success: false, error: formattedError };
    }
  }

  /**
   * Gets all bills that can be returned (bills with stockledger RECEIPT entries)
   * @param {Object} pagination - Pagination parameters
   * @returns {Promise<Object>} Paginated returnable bills
   */
  async getReturnableBills(
    pagination = { page: 0, size: 20, sort: "billDate,desc" }
  ) {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append("page", pagination.page);
      queryParams.append("size", pagination.size);
      queryParams.append("sort", pagination.sort);

      const url = `${this.baseURL}/returnable-bills?${queryParams.toString()}`;
      const response = await this.apiCall(url);

      return {
        success: true,
        data: formatWrappedApiResponse(response),
      };
    } catch (error) {
      const formattedError = formatApiError(error);
      console.error("Error fetching returnable bills:", formattedError);
      return { success: false, error: formattedError };
    }
  }
  /**
   * Gets detailed information about a bill that can be returned
   * @param {number|string} billId - Bill ID
   * @returns {Promise<Object>} Bill details with returnable quantities
   */
  async getReturnableBillDetails(billId) {
    try {
      if (!billId) {
        throw new Error("Bill ID is required");
      }

      const url = `${this.baseURL}/returnable-bills/${billId}`;
      const response = await this.apiCall(url);

      return {
        success: true,
        data: response, // Return raw response as it already has the correct structure
      };
    } catch (error) {
      const formattedError = formatApiError(error);
      console.error("Error fetching returnable bill details:", formattedError);
      return { success: false, error: formattedError };
    }
  }

  /**
   * Gets a specific bill by ID for return processing with returnable quantities
   * This is an alias for getReturnableBillDetails for backward compatibility
   * @param {number} billId - Bill ID
   * @returns {Promise<Object>} Bill details with returnable quantities
   */
  async getBillForReturn(billId) {
    return this.getReturnableBillDetails(billId);
  }

  /**
   * Clears the service cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Gets cached data by key
   * @param {string} key - Cache key
   * @returns {any|null} Cached data or null if expired/not found
   */
  getCachedData(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  /**
   * Sets cached data with timestamp
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   */
  setCachedData(key, data) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }
}

// Export singleton instance
const importGoodsReturnedService = new ImportGoodsReturnedService();
export default importGoodsReturnedService;
