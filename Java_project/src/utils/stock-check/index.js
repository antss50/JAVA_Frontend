// src/utils/stock-check/index.js

/**
 * Stock Check Utilities Export
 * Centralized export for all stock check related utilities
 */

// Import and re-export all formatters
import stockFormatter, {
  // Response unwrapping
  unwrapApiResponse,
  unwrapPaginatedResponse,

  // Stock check result formatters
  formatStockCheckResult,
  formatStockCheckResults,
  formatBatchStockCheckResults,
  formatStockCheckSummary,

  // Product formatters
  formatProduct,
  formatProducts,
  formatPaginatedProducts,

  // Line item formatters
  formatStockCheckLineItem,
  formatStockCheckLineItems,
} from "./stockFormatter.jsx";

// Import and re-export the service layer
import stockCheckService from "../../services/inventory-related/stock-check/stockCheckService.jsx";

// Export formatters individually
export {
  // Response unwrapping utilities
  unwrapApiResponse,
  unwrapPaginatedResponse,

  // Stock check result formatters
  formatStockCheckResult,
  formatStockCheckResults,
  formatBatchStockCheckResults,
  formatStockCheckSummary,

  // Product formatters
  formatProduct,
  formatProducts,
  formatPaginatedProducts,

  // Line item formatters
  formatStockCheckLineItem,
  formatStockCheckLineItems,
};

// Export the complete formatter object
export { stockFormatter };

// Export the service layer
export { stockCheckService };

// Default export with all utilities
export default {
  formatters: stockFormatter,
  service: stockCheckService,

  // Direct access to key functions
  unwrapApiResponse,
  formatStockCheckResult,
  formatProducts,

  // Common use case helpers
  performStockCheck: stockCheckService.performSingleStockCheck,
  performBatchStockCheck: stockCheckService.performBatchStockCheck,
  getProducts: stockCheckService.getProducts,
  searchProducts: stockCheckService.searchProducts,
  getStockCheckResults: stockCheckService.getStockCheckResults,
};
