/**
 * Product Formatter Utilities
 * Handles transformation of product data between API and frontend formats
 */

/**
 * Formats product data received from API
 * @param {Object} product - Raw product data from API
 * @returns {Object} Formatted product object
 */
export const formatProduct = (product) => {
  if (!product) return null;

  return {
    id: product.id || null,
    name: product.name || "",
    sku: product.sku || "",
    description: product.description || "",
    price: parseFloat(product.sellingPrice) || parseFloat(product.price) || 0,
    sellingPrice:
      parseFloat(product.sellingPrice) || parseFloat(product.price) || 0,
    purchasePrice: parseFloat(product.purchasePrice) || 0,
    unit: product.unit || "",
    categoryId: product.categoryId || null,
    categoryName: product.categoryName || "",
    // Create category object for compatibility
    category: {
      id: product.categoryId || null,
      name: product.categoryName || "",
    },
    reorderLevel: parseFloat(product.reorderLevel) || 0,
    maxStock: parseFloat(product.maxStock) || 0,
    version: product.version || 1,
  };
};

/**
 * Formats product data for API requests (removes readonly fields)
 * @param {Object} product - Product data to send to API
 * @param {boolean} isUpdate - Whether this is an update operation (includes id and version)
 * @returns {Object} API-ready product object
 */
export const formatProductForApi = (product, isUpdate = false) => {
  if (!product) return null;

  const apiProduct = {
    name: product.name,
    description: product.description || "",
    price: parseFloat(product.price),
    currentStock: parseInt(product.currentStock),
    minStockLevel: parseInt(product.minStockLevel),
    maxStockLevel: parseInt(product.maxStockLevel),
    categoryId: product.categoryId,
  };

  if (isUpdate) {
    apiProduct.id = product.id;
    apiProduct.version = product.version;
  }

  return apiProduct;
};

/**
 * Formats paginated response from API
 * @param {Object} pageResponse - Paginated response from API
 * @returns {Object} Formatted pagination object
 */
export const formatPageResponse = (pageResponse) => {
  if (!pageResponse) return null;

  return {
    content: (pageResponse.content || []).map(formatProduct),
    pagination: {
      currentPage: pageResponse.pageable?.pageNumber || 0,
      pageSize: pageResponse.pageable?.pageSize || 20,
      totalElements: pageResponse.totalElements || 0,
      totalPages: pageResponse.totalPages || 0,
      isFirst: pageResponse.first || false,
      isLast: pageResponse.last || false,
      numberOfElements: pageResponse.numberOfElements || 0,
      sort: pageResponse.pageable?.sort || null,
    },
  };
};

/**
 * Formats error response from API
 * @param {Object} error - Error object from API
 * @returns {Object} Formatted error object
 */
export const formatError = (error) => {
  if (!error) return null;

  // Handle different error response formats
  if (error.response) {
    const { status, data } = error.response;
    return {
      status,
      message: data?.error || data?.message || "An error occurred",
      details: data?.details || [],
      type: getErrorType(status),
    };
  }

  return {
    status: 500,
    message: error.message || "Network error occurred",
    details: [],
    type: "NETWORK_ERROR",
  };
};

/**
 * Determines error type based on status code
 * @param {number} status - HTTP status code
 * @returns {string} Error type
 */
const getErrorType = (status) => {
  switch (status) {
    case 400:
      return "VALIDATION_ERROR";
    case 404:
      return "NOT_FOUND";
    case 409:
      return "CONFLICT";
    case 500:
      return "SERVER_ERROR";
    default:
      return "UNKNOWN_ERROR";
  }
};

/**
 * Validates product data
 * @param {Object} product - Product data to validate
 * @returns {Object} Validation result with errors
 */
export const validateProduct = (product) => {
  const errors = {};

  if (!product.name || product.name.trim() === "") {
    errors.name = "Product name is required";
  }

  if (!product.price || product.price <= 0) {
    errors.price = "Price must be greater than 0";
  }

  if (product.currentStock < 0) {
    errors.currentStock = "Current stock cannot be negative";
  }

  if (product.minStockLevel < 0) {
    errors.minStockLevel = "Minimum stock level cannot be negative";
  }

  if (product.maxStockLevel <= product.minStockLevel) {
    errors.maxStockLevel =
      "Maximum stock level must be greater than minimum stock level";
  }

  if (!product.categoryId) {
    errors.categoryId = "Category is required";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Formats price for display
 * @param {number} price - Price value
 * @param {string} currency - Currency symbol (default: '₫')
 * @returns {string} Formatted price string
 */
export const formatPriceDisplay = (price, currency = "₫") => {
  if (price === null || price === undefined) return `0 ${currency}`;
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(parseFloat(price));
};

/**
 * Determines stock status based on current stock and thresholds
 * @param {Object} product - Product object
 * @returns {Object} Stock status information
 */
export const formatStockStatus = (product) => {
  if (!product) return { status: "unknown", message: "Unknown", color: "gray" };

  const { currentStock, minStockLevel, maxStockLevel } = product;

  if (currentStock === 0) {
    return {
      status: "out_of_stock",
      message: "Out of Stock",
      color: "red",
      severity: "critical",
    };
  }

  if (currentStock <= minStockLevel) {
    return {
      status: "low_stock",
      message: "Low Stock",
      color: "orange",
      severity: "warning",
    };
  }

  if (currentStock >= maxStockLevel) {
    return {
      status: "overstock",
      message: "Overstock",
      color: "blue",
      severity: "info",
    };
  }

  return {
    status: "normal",
    message: "In Stock",
    color: "green",
    severity: "success",
  };
};

/**
 * Formats stock configuration for API
 * @param {Object} stockConfig - Stock configuration object
 * @returns {Object} API-ready stock configuration
 */
export const formatStockConfigForApi = (stockConfig) => {
  return {
    minStockLevel: parseInt(stockConfig.minStockLevel),
    maxStockLevel: parseInt(stockConfig.maxStockLevel),
  };
};

/**
 * Formats search parameters for API
 * @param {Object} searchParams - Search parameters object
 * @returns {URLSearchParams} URL search parameters
 */
export const formatSearchParams = (searchParams) => {
  const params = new URLSearchParams();

  if (searchParams.page !== undefined) {
    params.append("page", searchParams.page.toString());
  }

  if (searchParams.size !== undefined) {
    params.append("size", searchParams.size.toString());
  }

  if (searchParams.sort) {
    params.append("sort", searchParams.sort);
  }

  if (searchParams.query) {
    params.append("query", searchParams.query);
  }

  if (searchParams.minPrice !== undefined) {
    params.append("minPrice", searchParams.minPrice.toString());
  }

  if (searchParams.maxPrice !== undefined) {
    params.append("maxPrice", searchParams.maxPrice.toString());
  }

  return params;
};

/**
 * Calculates stock percentage based on min/max levels
 * @param {Object} product - Product object
 * @returns {number} Stock percentage (0-100)
 */
export const calculateStockPercentage = (product) => {
  if (!product || product.maxStockLevel === 0) return 0;

  const { currentStock, minStockLevel, maxStockLevel } = product;
  const range = maxStockLevel - minStockLevel;

  if (range === 0) return 100;

  const percentage = ((currentStock - minStockLevel) / range) * 100;
  return Math.max(0, Math.min(100, percentage));
};
