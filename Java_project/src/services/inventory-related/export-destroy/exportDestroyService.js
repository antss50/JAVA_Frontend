/**
 * Export Destroy API Service
 * Handles all HTTP requests for stock disposal operations
 */

import {
  formatStockDisposalRequest,
  formatDisposalResponse,
  formatErrorResponse,
  validateDisposalRequest,
} from "../../../utils/inventory-related/exportDestroyFormatter.js";

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

    // Parse response
    const contentType = response.headers.get("content-type");
    let responseData;

    if (contentType && contentType.includes("application/json")) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    if (!response.ok) {
      // Handle API error responses
      const errorData =
        typeof responseData === "object"
          ? responseData
          : { message: responseData };
      throw {
        response: {
          status: response.status,
          statusText: response.statusText,
          data: errorData,
        },
      };
    }

    return responseData;
  } catch (error) {
    console.error("API Request failed:", error);

    // Handle network errors
    if (!error.response) {
      throw {
        message: "Network error. Please check your connection and try again.",
        type: "NETWORK_ERROR",
      };
    }

    throw error;
  }
};

/**
 * Record stock disposal
 * @param {Object} disposalData - Disposal form data
 * @returns {Promise<Object>} Disposal response
 */
export const recordStockDisposal = async (disposalData) => {
  try {
    // Validate request data
    const validation = validateDisposalRequest(disposalData);
    if (!validation.isValid) {
      throw {
        message: `Validation failed: ${validation.errors.join(", ")}`,
        type: "VALIDATION_ERROR",
        errors: validation.errors,
      };
    }

    // Format request payload
    const requestPayload = formatStockDisposalRequest(disposalData);

    console.log("Recording stock disposal with payload:", requestPayload);

    // Make API request
    const response = await makeRequest(`${BASE_URL}/disposals`, {
      method: "POST",
      body: JSON.stringify(requestPayload),
    });

    // Format and return response
    const formattedResponse = formatDisposalResponse(response);
    console.log("Stock disposal recorded successfully:", formattedResponse);

    return formattedResponse;
  } catch (error) {
    console.error("Error recording stock disposal:", error);
    const formattedError = formatErrorResponse(error);
    throw formattedError;
  }
};

/**
 * Get disposal history (placeholder - endpoint may not exist yet)
 * @param {Object} filters - Optional filters for disposal history
 * @returns {Promise<Array>} Array of disposal records
 */
export const getDisposalHistory = async (filters = {}) => {
  try {
    console.log(
      "Note: Disposal history endpoint not yet implemented on backend"
    );

    // Return empty result for now
    return {
      success: true,
      message: "Disposal history endpoint not yet implemented",
      disposalRecords: [],
    };
  } catch (error) {
    console.error("Error fetching disposal history:", error);
    const formattedError = formatErrorResponse(error);
    throw formattedError;
  }
};

/**
 * Get disposal record by ID (if needed for future enhancement)
 * @param {number} disposalId - Disposal record ID
 * @returns {Promise<Object>} Disposal record details
 */
export const getDisposalById = async (disposalId) => {
  try {
    if (!disposalId) {
      throw {
        message: "Disposal ID is required",
        type: "VALIDATION_ERROR",
      };
    }

    console.log(
      "Note: Get disposal by ID endpoint not yet implemented on backend"
    );

    // Return placeholder response
    return {
      success: true,
      message: "Get disposal by ID endpoint not yet implemented",
      disposalRecords: [],
    };
  } catch (error) {
    console.error("Error fetching disposal record:", error);
    const formattedError = formatErrorResponse(error);
    throw formattedError;
  }
};

/**
 * Validate disposal request without submitting (for form validation)
 * @param {Object} disposalData - Disposal form data
 * @returns {Object} Validation result
 */
export const validateDisposal = (disposalData) => {
  try {
    const validation = validateDisposalRequest(disposalData);
    console.log("Disposal validation result:", validation);
    return validation;
  } catch (error) {
    console.error("Error validating disposal:", error);
    return {
      isValid: false,
      errors: ["Validation error occurred"],
    };
  }
};

/**
 * Check if sufficient stock is available for disposal (simulation)
 * Note: This would typically be handled by the backend, but can be useful for frontend validation
 * @param {Array} items - Array of disposal items
 * @returns {Promise<Object>} Stock availability check result
 */
export const checkStockAvailability = async (items) => {
  try {
    if (!items || items.length === 0) {
      throw {
        message: "Items array is required",
        type: "VALIDATION_ERROR",
      };
    }

    // This would typically call a dedicated endpoint for stock checking
    // For now, we'll return a placeholder response
    console.log("Checking stock availability for items:", items);

    // Simulated response - in real implementation, this would call an API
    return {
      success: true,
      message: "Stock availability check completed",
      availabilityResults: items.map((item) => ({
        productId: item.productId,
        requestedQuantity: item.quantityToDispose,
        availableQuantity: 999, // Placeholder
        sufficient: true, // Placeholder
      })),
    };
  } catch (error) {
    console.error("Error checking stock availability:", error);
    const formattedError = formatErrorResponse(error);
    throw formattedError;
  }
};

// Export all service functions
const exportDestroyService = {
  recordStockDisposal,
  getDisposalHistory,
  getDisposalById,
  validateDisposal,
  checkStockAvailability,
};

export default exportDestroyService;
