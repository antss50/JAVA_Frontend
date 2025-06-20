/**
 * Product API Service
 * Handles all HTTP requests related to product management
 */

import {
  formatProduct,
  formatProductForApi,
  formatPageResponse,
  formatError,
  formatStockConfigForApi,
  formatSearchParams,
} from "../../utils/product/productFormatter.js";

const BASE_URL = "http://localhost:8080/api/inventory/products";

/**
 * Product API Service Class
 */
class ProductApiService {
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
      throw formatError(error);
    }
  }

  /**
   * Get all products with pagination
   * @param {number} page - Page number (0-based)
   * @param {number} size - Page size
   * @param {string} sort - Sort criteria (e.g., "name,asc")
   * @returns {Promise<Object>} Paginated products response
   */
  async getAllProducts(page = 0, size = 20, sort = null) {
    const params = formatSearchParams({ page, size, sort });
    const url = `${BASE_URL}?${params}`;

    const response = await this.makeRequest(url);
    return formatPageResponse(response);
  }

  /**
   * Get product by ID
   * @param {number} id - Product ID
   * @returns {Promise<Object>} Product data
   */
  async getProductById(id) {
    const url = `${BASE_URL}/${id}`;
    const response = await this.makeRequest(url);
    return formatProduct(response);
  }

  /**
   * Get product with category information
   * @param {number} id - Product ID
   * @returns {Promise<Object>} Product data with category
   */
  async getProductWithCategory(id) {
    const url = `${BASE_URL}/${id}/with-category`;
    const response = await this.makeRequest(url);
    return formatProduct(response);
  }

  /**
   * Create new product
   * @param {Object} productData - Product data
   * @returns {Promise<Object>} Created product data
   */
  async createProduct(productData) {
    const formattedData = formatProductForApi(productData, false);
    const response = await this.makeRequest(BASE_URL, {
      method: "POST",
      body: JSON.stringify(formattedData),
    });
    return formatProduct(response);
  }

  /**
   * Update existing product
   * @param {number} id - Product ID
   * @param {Object} productData - Updated product data
   * @returns {Promise<Object>} Updated product data
   */
  async updateProduct(id, productData) {
    const formattedData = formatProductForApi(productData, true);
    const url = `${BASE_URL}/${id}`;

    const response = await this.makeRequest(url, {
      method: "PUT",
      body: JSON.stringify(formattedData),
    });
    return formatProduct(response);
  }

  /**
   * Delete product
   * @param {number} id - Product ID
   * @returns {Promise<void>}
   */
  async deleteProduct(id) {
    const url = `${BASE_URL}/${id}`;
    await this.makeRequest(url, {
      method: "DELETE",
    });
  }

  /**
   * Search products by name or description
   * @param {string} query - Search query
   * @param {number} page - Page number (0-based)
   * @param {number} size - Page size
   * @param {string} sort - Sort criteria
   * @returns {Promise<Object>} Paginated search results
   */
  async searchProducts(query, page = 0, size = 20, sort = null) {
    const params = formatSearchParams({ query, page, size, sort });
    const url = `${BASE_URL}/search?${params}`;

    const response = await this.makeRequest(url);
    return formatPageResponse(response);
  }

  /**
   * Get products by price range
   * @param {number} minPrice - Minimum price
   * @param {number} maxPrice - Maximum price
   * @returns {Promise<Array>} Products within price range
   */
  async getProductsByPriceRange(minPrice, maxPrice) {
    const params = formatSearchParams({ minPrice, maxPrice });
    const url = `${BASE_URL}/price-range?${params}`;

    const response = await this.makeRequest(url);
    return (response || []).map(formatProduct);
  }

  /**
   * Update product price
   * @param {number} id - Product ID
   * @param {number} price - New price
   * @returns {Promise<void>}
   */
  async updateProductPrice(id, price) {
    const params = new URLSearchParams({ price: price.toString() });
    const url = `${BASE_URL}/${id}/price?${params}`;

    await this.makeRequest(url, {
      method: "PATCH",
    });
  }

  /**
   * Update stock configuration (min/max levels)
   * @param {number} id - Product ID
   * @param {Object} stockConfig - Stock configuration object
   * @returns {Promise<Object>} Updated product data
   */
  async updateStockConfiguration(id, stockConfig) {
    const formattedConfig = formatStockConfigForApi(stockConfig);
    const url = `${BASE_URL}/${id}/stock-config`;

    const response = await this.makeRequest(url, {
      method: "PUT",
      body: JSON.stringify(formattedConfig),
    });
    return formatProduct(response);
  }

  /**
   * Update product stock
   * @param {number} id - Product ID
   * @param {number} stockChange - Stock change amount (positive or negative)
   * @returns {Promise<void>}
   */
  async updateProductStock(id, stockChange) {
    const params = new URLSearchParams({ stockChange: stockChange.toString() });
    const url = `${BASE_URL}/${id}/stock?${params}`;

    await this.makeRequest(url, {
      method: "PATCH",
    });
  }

  /**
   * Get total product count
   * @returns {Promise<number>} Total number of products
   */
  async getProductCount() {
    const url = `${BASE_URL}/count`;
    return await this.makeRequest(url);
  }

  /**
   * Check if product exists
   * @param {number} id - Product ID
   * @returns {Promise<boolean>} Whether product exists
   */
  async checkProductExists(id) {
    const url = `${BASE_URL}/${id}/exists`;
    return await this.makeRequest(url);
  }

  /**
   * Get active products (paginated)
   * @param {number} page - Page number (0-based)
   * @param {number} size - Page size
   * @param {string} sort - Sort criteria
   * @returns {Promise<Object>} Paginated active products response
   */
  async getActiveProducts(page = 0, size = 20, sort = null) {
    const params = formatSearchParams({ page, size, sort });
    const url = `${BASE_URL}/active?${params}`;

    const response = await this.makeRequest(url);
    return formatPageResponse(response);
  }

  /**
   * Debug product existence (for development/debugging)
   * @param {number} productId - Product ID to debug
   * @param {number} page - Page number for current page check
   * @param {number} size - Page size for current page check
   * @returns {Promise<Object>} Debug information
   */
  async debugProductExistence(productId, page = 0, size = 10) {
    const params = formatSearchParams({ page, size });
    const url = `${BASE_URL}/debug/contains/${productId}?${params}`;

    const response = await this.makeRequest(url);
    return {
      ...response,
      specificProduct: response.specificProduct
        ? formatProduct(response.specificProduct)
        : null,
    };
  }

  /**
   * Batch operations helper
   * @param {Array} operations - Array of operation objects
   * @returns {Promise<Array>} Results of all operations
   */
  async batchOperations(operations) {
    const promises = operations.map(async (operation) => {
      try {
        const result = await this[operation.method](...operation.args);
        return { success: true, result, operation };
      } catch (error) {
        return { success: false, error, operation };
      }
    });

    return Promise.allSettled(promises);
  }

  /**
   * Get products with low stock
   * @param {number} page - Page number (0-based)
   * @param {number} size - Page size
   * @returns {Promise<Object>} Products with low stock
   */
  async getLowStockProducts(page = 0, size = 20) {
    // This would need to be implemented on the backend, for now we'll get all products and filter
    const allProducts = await this.getAllProducts(page, size);

    if (allProducts && allProducts.content) {
      allProducts.content = allProducts.content.filter(
        (product) => product.currentStock <= product.minStockLevel
      );
    }

    return allProducts;
  }
}

// Create and export a singleton instance
const productApiService = new ProductApiService();
export default productApiService;

// Export the class for testing or creating new instances
export { ProductApiService };
