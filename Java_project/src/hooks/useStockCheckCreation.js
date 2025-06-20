// src/hooks/useStockCheckCreation.js

import { useState, useCallback, useRef, useEffect } from "react";
import {
  stockCheckService,
  unwrapApiResponse,
  formatStockCheckResult,
  formatBatchStockCheckResults,
  formatProducts,
  unwrapPaginatedResponse,
} from "../utils/stock-check/index.js";

/**
 * Custom hook for creating new stock checks
 * Handles product selection, form management, and stock check execution
 */
export const useStockCheckCreation = () => {
  // =============================================================================
  // STATE MANAGEMENT
  // =============================================================================

  // Product search and selection
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]); // New: store all products
  const [filteredProducts, setFilteredProducts] = useState([]); // New: filtered list for display
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Loading states
  const [productsLoading, setProductsLoading] = useState(false);
  const [allProductsLoading, setAllProductsLoading] = useState(false); // New: loading for all products
  const [batchLoading, setBatchLoading] = useState(false);
  const [singleLoading, setSingleLoading] = useState(false);

  // Error states
  const [productsError, setProductsError] = useState(null);
  const [allProductsError, setAllProductsError] = useState(null); // New: error for all products
  const [error, setError] = useState(null);

  // Results
  const [batchResults, setBatchResults] = useState(null);
  const [singleResult, setSingleResult] = useState(null);

  // Refs for cleanup
  const searchTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);

  // =============================================================================
  // PRODUCT FETCHING AND MANAGEMENT
  // =============================================================================

  /**
   * Fetch all products for selection (called on mount)
   */
  const fetchAllProducts = useCallback(async () => {
    try {
      setAllProductsLoading(true);
      setAllProductsError(null);

      const response = await stockCheckService.getProducts({
        page: 0,
        size: 1000, // Get a large number of products
      });

      const allProductsList = response.products || [];
      const formattedProducts = formatProducts(allProductsList);

      setAllProducts(formattedProducts);
      setFilteredProducts(formattedProducts); // Initially show all products
    } catch (err) {
      setAllProductsError("Failed to fetch products");
      console.error("Error fetching all products:", err);
    } finally {
      setAllProductsLoading(false);
    }
  }, []);

  /**
   * Filter products locally based on search query
   */
  const filterProductsLocally = useCallback(
    (query) => {
      if (!query || query.trim().length === 0) {
        setFilteredProducts(allProducts);
        return;
      }

      const lowercaseQuery = query.toLowerCase().trim();
      const filtered = allProducts.filter(
        (product) =>
          product.name.toLowerCase().includes(lowercaseQuery) ||
          product.id.toString().includes(lowercaseQuery) ||
          (product.categoryName &&
            product.categoryName.toLowerCase().includes(lowercaseQuery))
      );

      setFilteredProducts(filtered);
    },
    [allProducts]
  );

  /**
   * Search products by name or code (legacy function, now uses local filtering)
   */
  const searchProducts = useCallback(
    async (query) => {
      setSearchQuery(query);
      filterProductsLocally(query);
    },
    [filterProductsLocally]
  );

  // =============================================================================
  // EFFECTS
  // =============================================================================

  // Fetch all products on mount
  useEffect(() => {
    fetchAllProducts();
  }, [fetchAllProducts]);

  // Update filtered products when search query changes
  useEffect(() => {
    filterProductsLocally(searchQuery);
  }, [searchQuery, filterProductsLocally]);

  // =============================================================================
  // PRODUCT SELECTION MANAGEMENT
  // =============================================================================

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

      // Clear search after adding
      setProducts([]);
      setSearchQuery("");
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
        product.id === productId ? { ...product, notes: notes || "" } : product
      )
    );
  }, []);

  /**
   * Clear all selected products
   */
  const clearSelection = useCallback(() => {
    setSelectedProducts([]);
    setProducts([]);
    setSearchQuery("");
  }, []);

  // =============================================================================
  // STOCK CHECK OPERATIONS
  // =============================================================================

  /**
   * Perform single stock check
   */
  const performSingleStockCheck = useCallback(async (stockCheckRequest) => {
    try {
      setSingleLoading(true);
      setError(null);

      const result = await stockCheckService.performSingleStockCheck(
        stockCheckRequest
      );
      const formattedResult = formatStockCheckResult(result);

      setSingleResult(formattedResult);
      return formattedResult;
    } catch (err) {
      setError(`Failed to perform stock check: ${err.message}`);
      console.error("Error performing single stock check:", err);
      throw err;
    } finally {
      setSingleLoading(false);
    }
  }, []);

  /**
   * Perform batch stock check for selected products
   */
  const performBatchStockCheck = useCallback(
    async (additionalData = {}) => {
      if (selectedProducts.length === 0) {
        setError("No products selected for stock check");
        return;
      }

      try {
        setBatchLoading(true);
        setError(null);

        // Build stock check requests for all selected products
        const stockCheckRequests = selectedProducts.map((product) => ({
          productId: product.id,
          expectedQuantity: product.expectedQuantity || 0,
          checkedBy:
            additionalData.checkedBy ||
            localStorage.getItem("username") ||
            "system",
          checkReference:
            additionalData.checkReference || product.checkReference,
          notes: product.notes || "",
        }));

        const result = await stockCheckService.performBatchStockCheck(
          stockCheckRequests
        );
        const formattedResults = formatBatchStockCheckResults(result);

        setBatchResults(formattedResults);
        return formattedResults;
      } catch (err) {
        setError(`Failed to perform batch stock check: ${err.message}`);
        console.error("Error performing batch stock check:", err);
        throw err;
      } finally {
        setBatchLoading(false);
      }
    },
    [selectedProducts]
  );

  /**
   * Build stock check request object
   */
  const buildStockCheckRequest = useCallback((params) => {
    return stockCheckService.buildStockCheckRequest(params);
  }, []);
  // =============================================================================
  // UTILITY FUNCTIONS
  // =============================================================================

  /**
   * Clear all results
   */
  const clearResults = useCallback(() => {
    setBatchResults(null);
    setSingleResult(null);
  }, []);

  /**
   * Clear batch results only
   */
  const clearBatchResults = useCallback(() => {
    setBatchResults(null);
  }, []);

  /**
   * Clear single result only
   */
  const clearSingleResult = useCallback(() => {
    setSingleResult(null);
  }, []);

  /**
   * Clear all errors
   */
  const clearError = useCallback(() => {
    setError(null);
    setProductsError(null);
  }, []);

  /**
   * Reset entire hook state
   */
  const resetState = useCallback(() => {
    setProducts([]);
    setSelectedProducts([]);
    setSearchQuery("");
    setBatchResults(null);
    setSingleResult(null);
    setError(null);
    setProductsError(null);
  }, []);

  // =============================================================================
  // VALIDATION HELPERS
  // =============================================================================

  /**
   * Validate selected products for stock check
   */
  const validateSelection = useCallback(() => {
    const errors = [];

    if (selectedProducts.length === 0) {
      errors.push("No products selected for stock check");
    }

    selectedProducts.forEach((product, index) => {
      if (!product.expectedQuantity && product.expectedQuantity !== 0) {
        errors.push(
          `Product ${index + 1} (${product.name}) is missing expected quantity`
        );
      }

      if (product.expectedQuantity < 0) {
        errors.push(
          `Product ${index + 1} (${
            product.name
          }) has negative expected quantity`
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
  const isLoading = productsLoading || batchLoading || singleLoading;

  // =============================================================================
  // CLEANUP
  // =============================================================================

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // =============================================================================
  // RETURN API
  // =============================================================================
  return {
    // State
    products,
    allProducts,
    filteredProducts,
    selectedProducts,
    searchQuery,
    batchResults,
    singleResult,

    // Loading states
    productsLoading,
    allProductsLoading, // New: loading state for all products
    batchLoading,
    singleLoading,
    isLoading,

    // Error states
    productsError,
    allProductsError, // New: error state for all products
    error,

    // Product management
    searchProducts,
    fetchAllProducts,
    filterProductsLocally,
    addProductToSelection,
    removeProductFromSelection,
    updateExpectedQuantity,
    updateProductNotes,
    clearSelection,

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
