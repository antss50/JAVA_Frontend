// src/hooks/useStockCheckCreation.js

import { useState, useCallback, useRef } from "react";
import {
  stockCheckService,
  unwrapApiResponse,
  formatStockCheckResult,
  formatBatchStockCheckResults,
} from "../utils/stock-check/index.js";
import useProductWithStock from "./useProductWithStock.js";

/**
 * Custom hook for creating new stock checks
 * Handles product selection, form management, and stock check execution
 * Now uses the combined product and stock data
 */
export const useStockCheckCreation = () => {
  // =============================================================================
  // PRODUCT DATA WITH STOCK (Combined API)
  // =============================================================================

  const {
    allProducts,
    filteredProducts,
    searchQuery: productSearchQuery,
    allProductsLoading,
    allProductsError,
    searchProducts: searchProductsWithStock,
    sortProducts,
    refreshData,
    clearError: clearProductError,
  } = useProductWithStock({
    initialSort: "name,asc",
    autoFetch: true,
    pageSize: 1000,
  });

  // =============================================================================
  // STATE MANAGEMENT
  // =============================================================================

  // Selection and stock check state
  const [selectedProducts, setSelectedProducts] = useState([]);

  // Loading states
  const [batchLoading, setBatchLoading] = useState(false);
  const [singleLoading, setSingleLoading] = useState(false);

  // Error states
  const [error, setError] = useState(null);

  // Results
  const [batchResults, setBatchResults] = useState(null);
  const [singleResult, setSingleResult] = useState(null);

  // Refs for cleanup
  const abortControllerRef = useRef(null);

  // =============================================================================
  // PRODUCT SEARCH AND MANAGEMENT
  // =============================================================================

  /**
   * Search products by name or code (uses local filtering)
   */
  const searchProducts = useCallback(
    async (query) => {
      return await searchProductsWithStock(query);
    },
    [searchProductsWithStock]
  );

  /**
   * Generate unique check reference
   */
  const generateCheckReference = useCallback(() => {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
    const timeStr = date.toTimeString().slice(0, 8).replace(/:/g, "");
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `CHK-${dateStr}-${timeStr}-${random}`;
  }, []);

  /**
   * Add product to selection for stock check
   */
  const addProductToSelection = useCallback(
    (product) => {
      setSelectedProducts((prev) => {
        // Check if product is already selected
        if (prev.find((p) => p.id === product.id)) {
          return prev;
        }

        // Add product with default expected quantity
        const newProduct = {
          ...product,
          expectedQuantity: product.currentStock || 0,
          notes: "",
          checkReference: generateCheckReference(),
        };

        return [...prev, newProduct];
      });
    },
    [generateCheckReference]
  );

  /**
   * Remove product from selection
   */
  const removeProductFromSelection = useCallback((productId) => {
    setSelectedProducts((prev) => prev.filter((p) => p.id !== productId));
  }, []);

  /**
   * Update expected quantity for a selected product
   */
  const updateExpectedQuantity = useCallback((productId, quantity) => {
    setSelectedProducts((prev) =>
      prev.map((product) =>
        product.id === productId
          ? { ...product, expectedQuantity: parseFloat(quantity) || 0 }
          : product
      )
    );
  }, []);

  /**
   * Update notes for a selected product
   */
  const updateProductNotes = useCallback((productId, notes) => {
    setSelectedProducts((prev) =>
      prev.map((product) =>
        product.id === productId ? { ...product, notes } : product
      )
    );
  }, []);

  /**
   * Clear all selected products
   */
  const clearSelection = useCallback(() => {
    setSelectedProducts([]);
  }, []);

  // =============================================================================
  // STOCK CHECK OPERATIONS
  // =============================================================================

  /**
   * Perform single stock check
   */
  const performSingleStockCheck = useCallback(async (stockCheckData) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      setSingleLoading(true);
      setError(null);

      const result = await stockCheckService.performSingleStockCheck(
        stockCheckData
      );

      const formattedResult = formatStockCheckResult(result);
      setSingleResult(formattedResult);

      return formattedResult;
    } catch (err) {
      if (err.name !== "AbortError") {
        setError("Failed to perform stock check");
        console.error("Error performing single stock check:", err);
      }
      throw err;
    } finally {
      setSingleLoading(false);
    }
  }, []);

  /**
   * Perform batch stock check
   */
  const performBatchStockCheck = useCallback(
    async (batchData) => {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      try {
        setBatchLoading(true);
        setError(null);

        // Build requests from selected products
        const stockCheckRequests = selectedProducts.map((product) => ({
          productId: product.id,
          expectedQuantity: product.expectedQuantity || 0,
          checkedBy: batchData.checkedBy,
          checkReference: batchData.checkReference || generateCheckReference(),
          notes: product.notes || "",
        }));

        const result = await stockCheckService.performBatchStockCheck(
          stockCheckRequests
        );

        const formattedResult = formatBatchStockCheckResults(result);
        setBatchResults(formattedResult);

        return formattedResult;
      } catch (err) {
        if (err.name !== "AbortError") {
          setError("Failed to perform batch stock check");
          console.error("Error performing batch stock check:", err);
        }
        throw err;
      } finally {
        setBatchLoading(false);
      }
    },
    [selectedProducts, generateCheckReference]
  );

  /**
   * Build stock check request object
   */
  const buildStockCheckRequest = useCallback(
    (params) => {
      return {
        productId: params.productId,
        expectedQuantity: params.expectedQuantity,
        checkedBy:
          params.checkedBy || localStorage.getItem("username") || "system",
        checkReference: params.checkReference || generateCheckReference(),
        notes: params.notes || "",
      };
    },
    [generateCheckReference]
  );

  // =============================================================================
  // UTILITY FUNCTIONS
  // =============================================================================

  /**
   * Clear results
   */
  const clearResults = useCallback(() => {
    setBatchResults(null);
    setSingleResult(null);
  }, []);

  /**
   * Clear batch results
   */
  const clearBatchResults = useCallback(() => {
    setBatchResults(null);
  }, []);

  /**
   * Clear single result
   */
  const clearSingleResult = useCallback(() => {
    setSingleResult(null);
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
    clearProductError();
  }, [clearProductError]);

  /**
   * Reset state
   */
  const resetState = useCallback(() => {
    setSelectedProducts([]);
    setBatchResults(null);
    setSingleResult(null);
    setError(null);
  }, []);

  // =============================================================================
  // VALIDATION
  // =============================================================================

  /**
   * Validate selected products
   */
  const validateSelection = useCallback(() => {
    const errors = [];

    if (selectedProducts.length === 0) {
      errors.push("No products selected");
    }

    selectedProducts.forEach((product, index) => {
      if (!product.expectedQuantity && product.expectedQuantity !== 0) {
        errors.push(`Product ${index + 1}: Expected quantity is required`);
      }

      if (product.expectedQuantity < 0) {
        errors.push(
          `Product ${index + 1}: Expected quantity cannot be negative`
        );
      }
    });

    return errors;
  }, [selectedProducts]);

  /**
   * Check if selection is valid
   */
  const isSelectionValid = useCallback(() => {
    return validateSelection().length === 0;
  }, [validateSelection]);

  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================

  const totalSelectedProducts = selectedProducts.length;
  const totalExpectedQuantity = selectedProducts.reduce(
    (sum, product) => sum + (product.expectedQuantity || 0),
    0
  );
  const hasResults = !!(batchResults || singleResult);
  const isLoading = allProductsLoading || batchLoading || singleLoading;

  // =============================================================================
  // CLEANUP
  // =============================================================================

  // Cleanup on unmount is handled by useEffect in the parent hooks

  // =============================================================================
  // RETURN API
  // =============================================================================

  return {
    // State
    products: allProducts, // For backward compatibility
    allProducts,
    filteredProducts,
    selectedProducts,
    searchQuery: productSearchQuery,
    batchResults,
    singleResult,

    // Loading states
    productsLoading: allProductsLoading, // For backward compatibility
    allProductsLoading,
    batchLoading,
    singleLoading,
    isLoading,

    // Error states
    productsError: allProductsError, // For backward compatibility
    allProductsError,
    error,

    // Product management
    searchProducts,
    addProductToSelection,
    removeProductFromSelection,
    updateExpectedQuantity,
    updateProductNotes,
    clearSelection,
    sortProducts,
    refreshData,

    // Stock check operations
    performSingleStockCheck,
    performBatchStockCheck,
    buildStockCheckRequest,

    // Utilities
    generateCheckReference,
    clearResults,
    clearBatchResults,
    clearSingleResult,
    clearError,
    resetState,

    // Validation
    validateSelection,
    isSelectionValid,

    // Computed values
    totalSelectedProducts,
    totalExpectedQuantity,
    hasResults,
  };
};

export default useStockCheckCreation;
