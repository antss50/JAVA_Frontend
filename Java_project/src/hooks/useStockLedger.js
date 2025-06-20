/**
 * useStockLedger Custom Hook
 * Provides reusable state management and functions for stock ledger operations
 */

import { useState, useEffect, useCallback, useRef } from "react";
import stockLedgerService from "../services/inventory-related/stockLedgerService.js";
import {
  formatStockMovement,
  formatStockStatus,
  formatErrorResponse,
} from "../utils/stock-check/stockLedgerFormatter.js";

/**
 * Custom hook for stock ledger operations
 * @param {Object} options - Hook configuration options
 * @param {boolean} options.autoRefresh - Whether to auto-refresh data
 * @param {number} options.refreshInterval - Refresh interval in milliseconds
 * @param {boolean} options.cacheData - Whether to cache data
 * @returns {Object} Hook state and functions
 */
export const useStockLedger = (options = {}) => {
  const {
    autoRefresh = false,
    refreshInterval = 30000, // 30 seconds
    cacheData = true,
  } = options;

  // State management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentStock, setCurrentStock] = useState(null);
  const [allStocks, setAllStocks] = useState([]);
  const [stockMovements, setStockMovements] = useState([]);
  const [stockStatus, setStockStatus] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Refs for cleanup and caching
  const refreshIntervalRef = useRef(null);
  const cacheRef = useRef(new Map());
  const abortControllerRef = useRef(null);

  /**
   * Generic error handler
   */
  const handleError = useCallback((error, operation) => {
    const formattedError = formatErrorResponse(error);
    setError({
      ...formattedError,
      operation,
      timestamp: new Date(),
    });
    console.error(`Stock Ledger Error [${operation}]:`, error);
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Get cache key
   */
  const getCacheKey = useCallback((operation, params) => {
    return `${operation}_${JSON.stringify(params)}`;
  }, []);

  /**
   * Get cached data
   */
  const getCachedData = useCallback(
    (key) => {
      if (!cacheData) return null;
      const cached = cacheRef.current.get(key);
      if (cached && Date.now() - cached.timestamp < 60000) {
        // 1 minute cache
        return cached.data;
      }
      return null;
    },
    [cacheData]
  );

  /**
   * Set cached data
   */
  const setCachedData = useCallback(
    (key, data) => {
      if (cacheData) {
        cacheRef.current.set(key, {
          data,
          timestamp: Date.now(),
        });
      }
    },
    [cacheData]
  );

  /**
   * Generic API call wrapper
   */
  const executeApiCall = useCallback(
    async (apiFunction, params, operation, setCacheKey = null) => {
      // Check cache first
      if (setCacheKey) {
        const cached = getCachedData(setCacheKey);
        if (cached) return cached;
      }

      setLoading(true);
      clearError();

      // Cancel previous request if exists
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      try {
        const result = await apiFunction(...params);
        setLastUpdated(new Date());

        // Cache result if needed
        if (setCacheKey && result) {
          setCachedData(setCacheKey, result);
        }

        return result;
      } catch (error) {
        if (error.name !== "AbortError") {
          handleError(error, operation);
        }
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [getCachedData, setCachedData, clearError, handleError]
  );

  /**
   * Get current stock for a product
   */
  const getCurrentStockLevel = useCallback(
    async (productId) => {
      const cacheKey = getCacheKey("currentStock", { productId });
      const result = await executeApiCall(
        stockLedgerService.getCurrentStock,
        [productId],
        "getCurrentStock",
        cacheKey
      );
      setCurrentStock(result);
      return result;
    },
    [executeApiCall, getCacheKey]
  );

  /**
   * Check stock availability
   */
  const checkAvailability = useCallback(
    async (productId, requiredQuantity) => {
      const cacheKey = getCacheKey("availability", {
        productId,
        requiredQuantity,
      });
      return executeApiCall(
        stockLedgerService.checkStockAvailability,
        [productId, requiredQuantity],
        "checkAvailability",
        cacheKey
      );
    },
    [executeApiCall, getCacheKey]
  );

  /**
   * Get all product stocks
   */
  const getAllStocks = useCallback(async () => {
    const cacheKey = getCacheKey("allStocks", {});
    const result = await executeApiCall(
      stockLedgerService.getAllProductStocks,
      [],
      "getAllStocks",
      cacheKey
    );
    setAllStocks(result || []);
    return result;
  }, [executeApiCall, getCacheKey]);

  /**
   * Get stock movements for a product
   */
  const getProductMovements = useCallback(
    async (productId) => {
      const cacheKey = getCacheKey("productMovements", { productId });
      const result = await executeApiCall(
        stockLedgerService.getProductStockMovements,
        [productId],
        "getProductMovements",
        cacheKey
      );

      const formattedMovements = result?.map(formatStockMovement) || [];
      setStockMovements(formattedMovements);
      return formattedMovements;
    },
    [executeApiCall, getCacheKey]
  );

  /**
   * Get stock movements by date range
   */
  const getMovementsByDateRange = useCallback(
    async (startDate, endDate) => {
      const cacheKey = getCacheKey("movementsByDate", { startDate, endDate });
      const result = await executeApiCall(
        stockLedgerService.getStockMovementsByDateRange,
        [startDate, endDate],
        "getMovementsByDateRange",
        cacheKey
      );

      const formattedMovements = result?.map(formatStockMovement) || [];
      setStockMovements(formattedMovements);
      return formattedMovements;
    },
    [executeApiCall, getCacheKey]
  );
  /**
   * Get stock movements by type
   */
  const getMovementsByType = useCallback(
    async (movementType, filters = {}) => {
      const cacheKey = getCacheKey("movementsByType", {
        movementType,
        filters,
      });
      const result = await executeApiCall(
        stockLedgerService.getStockMovementsByType,
        [movementType, filters],
        "getMovementsByType",
        cacheKey
      );

      const formattedMovements = result?.map(formatStockMovement) || [];
      setStockMovements(formattedMovements);
      return formattedMovements;
    },
    [executeApiCall, getCacheKey]
  );

  /**
   * Adjust stock
   */
  const adjustStock = useCallback(
    async (adjustmentData) => {
      const result = await executeApiCall(
        stockLedgerService.adjustStock,
        [adjustmentData],
        "adjustStock"
      );

      // Clear relevant cache entries
      cacheRef.current.clear();

      return result;
    },
    [executeApiCall]
  );

  /**
   * Record goods receipt
   */
  const recordGoodsReceipt = useCallback(
    async (receiptData) => {
      const result = await executeApiCall(
        stockLedgerService.recordGoodsReceipt,
        [receiptData],
        "recordGoodsReceipt"
      );

      // Clear relevant cache entries
      cacheRef.current.clear();

      return result;
    },
    [executeApiCall]
  );

  /**
   * Record stock disposal
   */
  const recordStockDisposal = useCallback(
    async (disposalData) => {
      const result = await executeApiCall(
        stockLedgerService.recordStockDisposal,
        [disposalData],
        "recordStockDisposal"
      );

      // Clear relevant cache entries
      cacheRef.current.clear();

      return result;
    },
    [executeApiCall]
  );

  /**
   * Get stock status
   */
  const getStockStatusData = useCallback(
    async (productId) => {
      const cacheKey = getCacheKey("stockStatus", { productId });
      const result = await executeApiCall(
        stockLedgerService.getStockStatus,
        [productId],
        "getStockStatus",
        cacheKey
      );

      const formattedStatus = formatStockStatus(result);
      setStockStatus(formattedStatus);
      return formattedStatus;
    },
    [executeApiCall, getCacheKey]
  );

  /**
   * Get stock level with check
   */
  const getStockLevelWithCheck = useCallback(
    async (productId, expectedQuantity, checkedBy) => {
      return executeApiCall(
        stockLedgerService.getStockLevelWithCheck,
        [productId, expectedQuantity, checkedBy],
        "getStockLevelWithCheck"
      );
    },
    [executeApiCall]
  );

  /**
   * Bulk operations
   */
  const bulkOperations = {
    getMultipleStocks: useCallback(
      async (productIds) => {
        return executeApiCall(
          stockLedgerService.getMultipleProductStocks,
          [productIds],
          "getMultipleStocks"
        );
      },
      [executeApiCall]
    ),

    checkMultipleAvailability: useCallback(
      async (checks) => {
        return executeApiCall(
          stockLedgerService.checkMultipleStockAvailability,
          [checks],
          "checkMultipleAvailability"
        );
      },
      [executeApiCall]
    ),
  };

  /**
   * Utility functions
   */
  const utilities = {
    getLowStockProducts: useCallback(async () => {
      return executeApiCall(
        stockLedgerService.getLowStockProducts,
        [],
        "getLowStockProducts"
      );
    }, [executeApiCall]),

    getRecentMovements: useCallback(
      async (days = 30) => {
        const result = await executeApiCall(
          stockLedgerService.getRecentStockMovements,
          [days],
          "getRecentMovements"
        );

        const formattedMovements = result?.map(formatStockMovement) || [];
        return formattedMovements;
      },
      [executeApiCall]
    ),

    exportData: useCallback(
      async (filters = {}) => {
        return executeApiCall(
          stockLedgerService.exportStockData,
          [filters],
          "exportData"
        );
      },
      [executeApiCall]
    ),

    clearCache: useCallback(() => {
      cacheRef.current.clear();
    }, []),

    refreshData: useCallback(async () => {
      cacheRef.current.clear();
      await getAllStocks();
    }, [getAllStocks]),
  };

  /**
   * Setup auto-refresh
   */
  useEffect(() => {
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(() => {
        utilities.refreshData();
      }, refreshInterval);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [autoRefresh, refreshInterval, utilities.refreshData]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    // State
    loading,
    error,
    currentStock,
    allStocks,
    stockMovements,
    stockStatus,
    lastUpdated,

    // Core functions
    getCurrentStockLevel,
    checkAvailability,
    getAllStocks,
    getProductMovements,
    getMovementsByDateRange,
    getMovementsByType,
    adjustStock,
    recordGoodsReceipt,
    recordStockDisposal,
    getStockStatusData,
    getStockLevelWithCheck,

    // Bulk operations
    ...bulkOperations,

    // Utilities
    ...utilities,

    // Error handling
    clearError,
  };
};

/**
 * Hook for specific product stock management
 * @param {number} productId - Product ID to track
 * @param {Object} options - Hook options
 * @returns {Object} Product-specific stock state and functions
 */
export const useProductStock = (productId, options = {}) => {
  const [productData, setProductData] = useState({
    currentStock: null,
    stockStatus: null,
    movements: [],
    availability: {},
  });

  const stockLedger = useStockLedger(options);

  const loadProductData = useCallback(async () => {
    if (!productId) return;

    try {
      const [currentStock, stockStatus, movements] = await Promise.all([
        stockLedger.getCurrentStockLevel(productId),
        stockLedger.getStockStatusData(productId),
        stockLedger.getProductMovements(productId),
      ]);

      setProductData({
        currentStock,
        stockStatus,
        movements,
        availability: {},
      });
    } catch (error) {
      console.error("Error loading product data:", error);
    }
  }, [productId, stockLedger]);

  const checkProductAvailability = useCallback(
    async (requiredQuantity) => {
      if (!productId) return false;

      const available = await stockLedger.checkAvailability(
        productId,
        requiredQuantity
      );
      setProductData((prev) => ({
        ...prev,
        availability: {
          ...prev.availability,
          [requiredQuantity]: available,
        },
      }));

      return available;
    },
    [productId, stockLedger]
  );

  useEffect(() => {
    loadProductData();
  }, [loadProductData]);

  return {
    ...stockLedger,
    productData,
    loadProductData,
    checkProductAvailability,
    productId,
  };
};

export default useStockLedger;
