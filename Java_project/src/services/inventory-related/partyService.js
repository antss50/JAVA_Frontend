/**
 * Party API Service
 * Handles all HTTP requests to the Party API endpoints
 */

import {
  formatPartyForRequest,
  formatPartyFromResponse,
} from "../../utils/party/partyFormatter.js";

/**
 * Party API Service Class
 * Provides methods for all CRUD operations on parties
 */
class PartyService {
  constructor() {
    this.baseURL = "http://localhost:8080/api/parties";
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

      // Handle different response types
      if (response.status === 204) {
        return null; // No content
      }

      if (response.status === 404) {
        return null; // Not found
      }

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP error! status: ${response.status}`;

        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch {
          // If response is not JSON, use the text or default message
          errorMessage = errorText || errorMessage;
        }

        throw new Error(errorMessage);
      }

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return await response.json();
      }

      return await response.text();
    } catch (error) {
      console.error("API call failed:", error);
      throw error;
    }
  }

  /**
   * Invalidates all cached data
   */
  invalidateCache() {
    this.cache.clear();
  }

  /**
   * Sets cache data with timestamp
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   */
  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Gets cached data if not expired
   * @param {string} key - Cache key
   * @returns {any|null} Cached data or null if expired/not found
   */
  getCache(key) {
    if (!this.cache.has(key)) return null;

    const cached = this.cache.get(key);
    if (Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    // Remove expired cache
    this.cache.delete(key);
    return null;
  }

  /**
   * Gets all parties from the API
   * @param {boolean} useCache - Whether to use cached data
   * @returns {Promise<Array>} Array of party objects
   */
  async getAllParties(useCache = true) {
    const cacheKey = "all_parties";

    if (useCache) {
      const cached = this.getCache(cacheKey);
      if (cached) return cached;
    }

    try {
      const parties = await this.apiCall(this.baseURL);
      const formattedParties = (parties || []).map(formatPartyFromResponse);

      if (useCache) {
        this.setCache(cacheKey, formattedParties);
      }

      return formattedParties;
    } catch (error) {
      console.error("Error fetching all parties:", error);
      throw error;
    }
  }

  /**
   * Gets a specific party by ID
   * @param {number} partyId - Party ID
   * @param {boolean} useCache - Whether to use cached data
   * @returns {Promise<Object|null>} Party object or null if not found
   */
  async getPartyById(partyId, useCache = true) {
    const cacheKey = `party_${partyId}`;

    if (useCache) {
      const cached = this.getCache(cacheKey);
      if (cached) return cached;
    }

    try {
      const party = await this.apiCall(`${this.baseURL}/${partyId}`);
      const formattedParty = formatPartyFromResponse(party);

      if (formattedParty && useCache) {
        this.setCache(cacheKey, formattedParty);
      }

      return formattedParty;
    } catch (error) {
      console.error(`Error fetching party ${partyId}:`, error);
      throw error;
    }
  }

  /**
   * Gets parties by type
   * @param {string} partyType - Type of party (CUSTOMER, SUPPLIER, EMPLOYEE)
   * @param {boolean} useCache - Whether to use cached data
   * @returns {Promise<Array>} Array of party objects of specified type
   */
  async getPartiesByType(partyType, useCache = true) {
    const cacheKey = `parties_type_${partyType}`;

    if (useCache) {
      const cached = this.getCache(cacheKey);
      if (cached) return cached;
    }

    try {
      const parties = await this.apiCall(`${this.baseURL}/type/${partyType}`);
      const formattedParties = (parties || []).map(formatPartyFromResponse);

      if (useCache) {
        this.setCache(cacheKey, formattedParties);
      }

      return formattedParties;
    } catch (error) {
      console.error(`Error fetching parties by type ${partyType}:`, error);
      throw error;
    }
  }

  /**
   * Creates a new party
   * @param {Object} partyData - Party data to create
   * @returns {Promise<Object>} Created party object
   */
  async createParty(partyData) {
    try {
      const formattedData = formatPartyForRequest(partyData);

      const createdParty = await this.apiCall(this.baseURL, {
        method: "POST",
        body: JSON.stringify(formattedData),
      });

      const formattedParty = formatPartyFromResponse(createdParty);

      // Invalidate relevant cache entries
      this.invalidateCache();

      return formattedParty;
    } catch (error) {
      console.error("Error creating party:", error);
      throw error;
    }
  }

  /**
   * Updates an existing party
   * @param {number} partyId - Party ID to update
   * @param {Object} partyData - Updated party data
   * @returns {Promise<Object>} Updated party object
   */
  async updateParty(partyId, partyData) {
    try {
      const formattedData = formatPartyForRequest(partyData);

      const updatedParty = await this.apiCall(`${this.baseURL}/${partyId}`, {
        method: "PUT",
        body: JSON.stringify(formattedData),
      });

      const formattedParty = formatPartyFromResponse(updatedParty);

      // Invalidate relevant cache entries
      this.invalidateCache();

      return formattedParty;
    } catch (error) {
      console.error(`Error updating party ${partyId}:`, error);
      throw error;
    }
  }

  /**
   * Deletes a party (soft delete)
   * @param {number} partyId - Party ID to delete
   * @returns {Promise<boolean>} Success status
   */
  async deleteParty(partyId) {
    try {
      await this.apiCall(`${this.baseURL}/${partyId}`, {
        method: "DELETE",
      });

      // Invalidate relevant cache entries
      this.invalidateCache();

      return true;
    } catch (error) {
      console.error(`Error deleting party ${partyId}:`, error);
      throw error;
    }
  }

  /**
   * Batch operations for multiple parties
   */

  /**
   * Creates multiple parties
   * @param {Array} partiesData - Array of party data objects
   * @returns {Promise<Array>} Array of created party objects
   */
  async createMultipleParties(partiesData) {
    const results = [];

    for (const partyData of partiesData) {
      try {
        const createdParty = await this.createParty(partyData);
        results.push({ success: true, data: createdParty });
      } catch (error) {
        results.push({ success: false, error: error.message, data: partyData });
      }
    }

    return results;
  }

  /**
   * Updates multiple parties
   * @param {Array} updates - Array of {id, data} objects
   * @returns {Promise<Array>} Array of update results
   */
  async updateMultipleParties(updates) {
    const results = [];

    for (const update of updates) {
      try {
        const updatedParty = await this.updateParty(update.id, update.data);
        results.push({ success: true, data: updatedParty });
      } catch (error) {
        results.push({ success: false, error: error.message, id: update.id });
      }
    }

    return results;
  }

  /**
   * Deletes multiple parties
   * @param {Array} partyIds - Array of party IDs to delete
   * @returns {Promise<Array>} Array of deletion results
   */
  async deleteMultipleParties(partyIds) {
    const results = [];

    for (const partyId of partyIds) {
      try {
        await this.deleteParty(partyId);
        results.push({ success: true, id: partyId });
      } catch (error) {
        results.push({ success: false, error: error.message, id: partyId });
      }
    }

    return results;
  }

  /**
   * Search parties by query string
   * @param {string} query - Search query
   * @param {string} type - Optional party type filter
   * @returns {Promise<Array>} Array of matching parties
   */
  async searchParties(query, type = null) {
    try {
      let parties;

      if (type) {
        parties = await this.getPartiesByType(type);
      } else {
        parties = await this.getAllParties();
      }

      if (!query || !query.trim()) return parties;

      const searchTerm = query.toLowerCase().trim();

      return parties.filter(
        (party) =>
          party.name?.toLowerCase().includes(searchTerm) ||
          party.email?.toLowerCase().includes(searchTerm) ||
          party.phone?.includes(searchTerm) ||
          party.address?.toLowerCase().includes(searchTerm)
      );
    } catch (error) {
      console.error("Error searching parties:", error);
      throw error;
    }
  }

  /**
   * Gets party statistics
   * @returns {Promise<Object>} Statistics object
   */
  async getPartyStatistics() {
    try {
      const parties = await this.getAllParties();

      const stats = {
        total: parties.length,
        active: parties.filter((p) => p.active).length,
        inactive: parties.filter((p) => !p.active).length,
        byType: {
          CUSTOMER: parties.filter((p) => p.partyType === "CUSTOMER").length,
          SUPPLIER: parties.filter((p) => p.partyType === "SUPPLIER").length,
          EMPLOYEE: parties.filter((p) => p.partyType === "EMPLOYEE").length,
        },
      };

      return stats;
    } catch (error) {
      console.error("Error getting party statistics:", error);
      throw error;
    }
  }

  /**
   * Validates party data against server
   * @param {Object} partyData - Party data to validate
   * @returns {Promise<Object>} Validation result
   */
  async validatePartyData(partyData) {
    try {
      // This would be a custom validation endpoint if available
      // For now, we'll do client-side validation
      const { validatePartyData } = await import(
        "../../utils/party/partyFormatter.js"
      );
      const errors = validatePartyData(partyData);

      return {
        isValid: errors.length === 0,
        errors,
      };
    } catch (error) {
      console.error("Error validating party data:", error);
      throw error;
    }
  }

  /**
   * Exports parties data
   * @param {string} format - Export format ('json', 'csv')
   * @param {string} type - Optional party type filter
   * @returns {Promise<string>} Exported data as string
   */
  async exportParties(format = "json", type = null) {
    try {
      let parties;

      if (type) {
        parties = await this.getPartiesByType(type);
      } else {
        parties = await this.getAllParties();
      }

      if (format === "csv") {
        const headers = [
          "ID",
          "Name",
          "Email",
          "Phone",
          "Address",
          "Type",
          "Active",
        ];
        const csvRows = [headers.join(",")];

        parties.forEach((party) => {
          const row = [
            party.id,
            `"${party.name}"`,
            `"${party.email || ""}"`,
            `"${party.phone || ""}"`,
            `"${party.address || ""}"`,
            party.partyType,
            party.active,
          ];
          csvRows.push(row.join(","));
        });

        return csvRows.join("\n");
      }

      return JSON.stringify(parties, null, 2);
    } catch (error) {
      console.error("Error exporting parties:", error);
      throw error;
    }
  }
}

// Create and export singleton instance
const partyService = new PartyService();
export default partyService;

// Also export the class for testing purposes
export { PartyService };
