/**
 * Product Management Custom Hook
 * Provides reusable state management and operations for product data
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import productApiService from "../services/inventory-related/productService.js";
import {
  validateProduct,
  formatStockStatus,
} from "../utils/product/productFormatter.js";

/**
 * Custom hook for product management
 * @param {Object} options - Configuration options
 * @returns {Object} Product state and methods
 */
export const useProductManagement = (options = {}) => {
  const {
    initialPage = 0,
    initialPageSize = 20,
    initialSort = null,
    autoFetch = true,
    debounceDelay = 300,
  } = options;

  // State management
  const [state, setState] = useState({
    // Product data
    products: [],
    currentProduct: null,

    // Pagination
    pagination: {
      currentPage: initialPage,
      pageSize: initialPageSize,
      totalElements: 0,
      totalPages: 0,
      isFirst: true,
      isLast: true,
      numberOfElements: 0,
      sort: initialSort,
    },

    // Loading states
    loading: {
      products: false,
      currentProduct: false,
      creating: false,
      updating: false,
      deleting: false,
      searching: false,
    },

    // Error states
    error: {
      products: null,
      currentProduct: null,
      operation: null,
    },

    // Search and filters
    searchQuery: "",
    filters: {
      minPrice: null,
      maxPrice: null,
      categoryId: null,
      stockStatus: null,
    },

    // Additional state
    productCount: 0,
    isDirty: false,
  });

  // Debounce timer for search
  const [searchTimer, setSearchTimer] = useState(null);

  /**
   * Update specific part of state
   */
  const updateState = useCallback((updates) => {
    setState((prevState) => ({
      ...prevState,
      ...updates,
    }));
  }, []);

  /**
   * Update loading state for specific operation
   */
  const setLoading = useCallback(
    (operation, isLoading) => {
      updateState({
        loading: {
          ...state.loading,
          [operation]: isLoading,
        },
      });
    },
    [state.loading, updateState]
  );

  /**
   * Update error state for specific operation
   */
  const setError = useCallback(
    (operation, error) => {
      updateState({
        error: {
          ...state.error,
          [operation]: error,
        },
      });
    },
    [state.error, updateState]
  );

  /**
   * Reset error state
   */
  const resetError = useCallback(
    (operation = null) => {
      if (operation) {
        setError(operation, null);
      } else {
        updateState({
          error: {
            products: null,
            currentProduct: null,
            operation: null,
          },
        });
      }
    },
    [setError, updateState]
  );

  /**
   * Fetch products with pagination
   */
  const fetchProducts = useCallback(
    async (
      page = state.pagination.currentPage,
      size = state.pagination.pageSize,
      sort = state.pagination.sort
    ) => {
      setLoading("products", true);
      resetError("products");
      try {
        const response = await productApiService.getAllProducts(
          page,
          size,
          sort
        );

        // Handle null or invalid response
        if (!response) {
          throw new Error("No response received from product API");
        }

        updateState({
          products: response.content || [],
          pagination: response.pagination || {
            currentPage: page,
            pageSize: size,
            totalElements: 0,
            totalPages: 0,
            isFirst: true,
            isLast: true,
            numberOfElements: 0,
            sort: sort,
          },
          loading: { ...state.loading, products: false },
        });

        return response;
      } catch (error) {
        console.error("Error fetching products:", error);
        setError("products", error);
        setLoading("products", false);
        throw error;
      }
    },
    [
      state.pagination,
      state.loading,
      setLoading,
      resetError,
      setError,
      updateState,
    ]
  );

  /**
   * Fetch single product by ID
   */
  const fetchProductById = useCallback(
    async (id) => {
      setLoading("currentProduct", true);
      resetError("currentProduct");

      try {
        const product = await productApiService.getProductById(id);

        updateState({
          currentProduct: product,
          loading: { ...state.loading, currentProduct: false },
        });

        return product;
      } catch (error) {
        setError("currentProduct", error);
        setLoading("currentProduct", false);
        throw error;
      }
    },
    [state.loading, setLoading, resetError, setError, updateState]
  );

  /**
   * Create new product
   */
  const createProduct = useCallback(
    async (productData) => {
      // Validate product data
      const validation = validateProduct(productData);
      if (!validation.isValid) {
        const error = {
          type: "VALIDATION_ERROR",
          message: "Product validation failed",
          details: Object.entries(validation.errors).map(
            ([field, message]) => ({ field, message })
          ),
        };
        setError("operation", error);
        throw error;
      }

      setLoading("creating", true);
      resetError("operation");

      try {
        const newProduct = await productApiService.createProduct(productData);

        // Optimistic update
        updateState({
          products: [newProduct, ...state.products],
          currentProduct: newProduct,
          loading: { ...state.loading, creating: false },
          isDirty: true,
        });

        return newProduct;
      } catch (error) {
        setError("operation", error);
        setLoading("creating", false);
        throw error;
      }
    },
    [
      state.products,
      state.loading,
      setLoading,
      resetError,
      setError,
      updateState,
    ]
  );

  /**
   * Update existing product
   */
  const updateProduct = useCallback(
    async (id, productData) => {
      // Validate product data
      const validation = validateProduct(productData);
      if (!validation.isValid) {
        const error = {
          type: "VALIDATION_ERROR",
          message: "Product validation failed",
          details: Object.entries(validation.errors).map(
            ([field, message]) => ({ field, message })
          ),
        };
        setError("operation", error);
        throw error;
      }

      setLoading("updating", true);
      resetError("operation");

      try {
        const updatedProduct = await productApiService.updateProduct(
          id,
          productData
        );

        // Update product in list
        const updatedProducts = state.products.map((product) =>
          product.id === id ? updatedProduct : product
        );

        updateState({
          products: updatedProducts,
          currentProduct: updatedProduct,
          loading: { ...state.loading, updating: false },
          isDirty: true,
        });

        return updatedProduct;
      } catch (error) {
        setError("operation", error);
        setLoading("updating", false);
        throw error;
      }
    },
    [
      state.products,
      state.loading,
      setLoading,
      resetError,
      setError,
      updateState,
    ]
  );

  /**
   * Delete product
   */
  const deleteProduct = useCallback(
    async (id) => {
      setLoading("deleting", true);
      resetError("operation");

      try {
        await productApiService.deleteProduct(id);

        // Remove product from list
        const updatedProducts = state.products.filter(
          (product) => product.id !== id
        );

        updateState({
          products: updatedProducts,
          currentProduct:
            state.currentProduct?.id === id ? null : state.currentProduct,
          loading: { ...state.loading, deleting: false },
          isDirty: true,
        });

        return true;
      } catch (error) {
        setError("operation", error);
        setLoading("deleting", false);
        throw error;
      }
    },
    [
      state.products,
      state.currentProduct,
      state.loading,
      setLoading,
      resetError,
      setError,
      updateState,
    ]
  );

  /**
   * Search products with debouncing
   */
  const searchProducts = useCallback(
    (query, immediate = false) => {
      updateState({ searchQuery: query });

      if (searchTimer) {
        clearTimeout(searchTimer);
      }

      const performSearch = async () => {
        if (!query.trim()) {
          return fetchProducts();
        }

        setLoading("searching", true);
        resetError("products");

        try {
          const response = await productApiService.searchProducts(
            query,
            0, // Reset to first page for new search
            state.pagination.pageSize,
            state.pagination.sort
          );

          updateState({
            products: response.content,
            pagination: { ...response.pagination, currentPage: 0 },
            loading: { ...state.loading, searching: false },
          });

          return response;
        } catch (error) {
          setError("products", error);
          setLoading("searching", false);
          throw error;
        }
      };

      if (immediate) {
        performSearch();
      } else {
        const timer = setTimeout(performSearch, debounceDelay);
        setSearchTimer(timer);
      }
    },
    [
      searchTimer,
      debounceDelay,
      fetchProducts,
      state.pagination,
      state.loading,
      setLoading,
      resetError,
      setError,
      updateState,
    ]
  );

  /**
   * Update product stock
   */
  const updateStock = useCallback(
    async (id, stockChange) => {
      setLoading("updating", true);
      resetError("operation");

      try {
        await productApiService.updateProductStock(id, stockChange);

        // Update stock in local state
        const updatedProducts = state.products.map((product) => {
          if (product.id === id) {
            return {
              ...product,
              currentStock: Math.max(0, product.currentStock + stockChange),
            };
          }
          return product;
        });

        updateState({
          products: updatedProducts,
          loading: { ...state.loading, updating: false },
          isDirty: true,
        });

        return true;
      } catch (error) {
        setError("operation", error);
        setLoading("updating", false);
        throw error;
      }
    },
    [
      state.products,
      state.loading,
      setLoading,
      resetError,
      setError,
      updateState,
    ]
  );

  /**
   * Update product price
   */
  const updatePrice = useCallback(
    async (id, price) => {
      setLoading("updating", true);
      resetError("operation");

      try {
        await productApiService.updateProductPrice(id, price);

        // Update price in local state
        const updatedProducts = state.products.map((product) => {
          if (product.id === id) {
            return { ...product, price };
          }
          return product;
        });

        updateState({
          products: updatedProducts,
          loading: { ...state.loading, updating: false },
          isDirty: true,
        });

        return true;
      } catch (error) {
        setError("operation", error);
        setLoading("updating", false);
        throw error;
      }
    },
    [
      state.products,
      state.loading,
      setLoading,
      resetError,
      setError,
      updateState,
    ]
  );

  /**
   * Set current product
   */
  const setCurrentProduct = useCallback(
    (product) => {
      updateState({ currentProduct: product });
    },
    [updateState]
  );

  /**
   * Reset current product
   */
  const resetCurrentProduct = useCallback(() => {
    updateState({ currentProduct: null });
  }, [updateState]);

  /**
   * Change page
   */
  const changePage = useCallback(
    (page) => {
      if (state.searchQuery) {
        searchProducts(state.searchQuery, true);
      } else {
        fetchProducts(page);
      }
    },
    [state.searchQuery, searchProducts, fetchProducts]
  );

  /**
   * Change page size
   */
  const changePageSize = useCallback(
    (size) => {
      updateState({
        pagination: { ...state.pagination, pageSize: size, currentPage: 0 },
      });

      if (state.searchQuery) {
        searchProducts(state.searchQuery, true);
      } else {
        fetchProducts(0, size);
      }
    },
    [
      state.pagination,
      state.searchQuery,
      searchProducts,
      fetchProducts,
      updateState,
    ]
  );

  /**
   * Apply filters
   */
  const applyFilters = useCallback(
    async (filters) => {
      updateState({ filters });

      if (filters.minPrice && filters.maxPrice) {
        setLoading("products", true);
        try {
          const products = await productApiService.getProductsByPriceRange(
            filters.minPrice,
            filters.maxPrice
          );
          updateState({
            products,
            loading: { ...state.loading, products: false },
          });
        } catch (error) {
          setError("products", error);
          setLoading("products", false);
        }
      } else {
        fetchProducts();
      }
    },
    [state.loading, fetchProducts, setLoading, setError, updateState]
  );

  /**
   * Clear filters
   */
  const clearFilters = useCallback(() => {
    updateState({
      filters: {
        minPrice: null,
        maxPrice: null,
        categoryId: null,
        stockStatus: null,
      },
      searchQuery: "",
    });
    fetchProducts();
  }, [fetchProducts, updateState]);

  /**
   * Refresh data
   */
  const refresh = useCallback(() => {
    if (state.searchQuery) {
      searchProducts(state.searchQuery, true);
    } else {
      fetchProducts();
    }
  }, [state.searchQuery, searchProducts, fetchProducts]);

  // Computed values
  const computedValues = useMemo(() => {
    const productsWithStatus = state.products.map((product) => ({
      ...product,
      stockStatus: formatStockStatus(product),
    }));

    const lowStockProducts = productsWithStatus.filter(
      (product) =>
        product.stockStatus.status === "low_stock" ||
        product.stockStatus.status === "out_of_stock"
    );

    const totalValue = state.products.reduce(
      (sum, product) => sum + product.price * product.currentStock,
      0
    );

    return {
      productsWithStatus,
      lowStockProducts,
      lowStockCount: lowStockProducts.length,
      totalValue,
      hasProducts: state.products.length > 0,
      isLoading: Object.values(state.loading).some((loading) => loading),
      hasError: Object.values(state.error).some((error) => error !== null),
    };
  }, [state.products, state.loading, state.error]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchProducts();
    }
  }, [autoFetch]); // Only run on mount

  // Cleanup search timer on unmount
  useEffect(() => {
    return () => {
      if (searchTimer) {
        clearTimeout(searchTimer);
      }
    };
  }, [searchTimer]);

  return {
    // State
    ...state,
    ...computedValues,

    // Actions
    fetchProducts,
    fetchProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    searchProducts,
    updateStock,
    updatePrice,
    setCurrentProduct,
    resetCurrentProduct,
    changePage,
    changePageSize,
    applyFilters,
    clearFilters,
    refresh,
    resetError,
  };
};

export default useProductManagement;
