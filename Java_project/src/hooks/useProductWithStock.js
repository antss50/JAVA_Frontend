// src/hooks/useProductWithStock.js

/**
 * Custom hook that combines product data with stock information
 * Merges data from product management and stock ledger APIs
 */

import { useState, useCallback, useEffect, useMemo } from "react";
import useProductManagement from "./useProductManagement.js";
import useStockLedger from "./useStockLedger.js";

/**
 * Custom hook for products with stock information
 * @param {Object} options - Configuration options
 * @returns {Object} Combined product and stock state and methods
 */
export const useProductWithStock = (options = {}) => {
  const {
    initialSort = "name,asc",
    autoFetch = true,
    debounceDelay = 300,
    pageSize = 1000, // Get more products since we're filtering locally
  } = options;

  // Individual hooks
  const productManagement = useProductManagement({
    initialSort,
    autoFetch,
    debounceDelay,
    initialPageSize: pageSize,
  });

  const stockLedger = useStockLedger({
    autoRefresh: false,
    cacheData: true,
  });

  // Combined state
  const [combinedData, setCombinedData] = useState({
    productsWithStock: [],
    lastCombined: null,
    combining: false,
    combineError: null,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);

  /**
   * Combine product data with stock information
   */
  const combineProductsWithStock = useCallback(async () => {
    if (!productManagement.products || !productManagement.products.length) {
      return;
    }

    setCombinedData((prev) => ({
      ...prev,
      combining: true,
      combineError: null,
    }));

    try {
      // Get all stock data
      const stockData = await stockLedger.getAllStocks();

      // Create a map of stock data by product ID
      const stockMap = new Map();
      if (stockData && Array.isArray(stockData)) {
        stockData.forEach((stock) => {
          if (stock && stock.productId) {
            stockMap.set(stock.productId, stock);
          }
        });
      }

      // Combine product data with stock information
      const productsWithStock = productManagement.products.map((product) => {
        const stockInfo = stockMap.get(product.id);

        return {
          ...product,
          // Add stock information
          currentStock: stockInfo?.currentStock || 0,
          stockUnit: stockInfo?.unitOfMeasure || product.unit,

          // Calculate stock status
          stockStatus: calculateStockStatus(
            stockInfo?.currentStock || 0,
            product.reorderLevel,
            product.maxStock
          ),

          // Add formatted stock display
          stockDisplay: formatStockDisplay(
            stockInfo?.currentStock || 0,
            stockInfo?.unitOfMeasure || product.unit
          ),

          // Add pricing information
          sellingPrice: product.price || product.sellingPrice || 0,

          // Additional stock metadata
          lastStockUpdate: stockInfo?.lastUpdated,
          stockAvailable: (stockInfo?.currentStock || 0) > 0,
        };
      });

      // Sort products by name by default
      const sortedProducts = productsWithStock.sort((a, b) =>
        a.name.localeCompare(b.name, "vi", { sensitivity: "base" })
      );

      setCombinedData({
        productsWithStock: sortedProducts,
        lastCombined: new Date(),
        combining: false,
        combineError: null,
      });

      // Update filtered products if there's a search query
      if (searchQuery) {
        filterProducts(searchQuery, sortedProducts);
      } else {
        setFilteredProducts(sortedProducts);
      }
    } catch (error) {
      console.error("Error combining products with stock:", error);
      setCombinedData((prev) => ({
        ...prev,
        combining: false,
        combineError:
          error.message || "Failed to combine product and stock data",
      }));
    }
  }, [productManagement.products, stockLedger, searchQuery]);

  /**
   * Calculate stock status based on current stock and thresholds
   */
  const calculateStockStatus = (currentStock, reorderLevel, maxStock) => {
    if (currentStock <= 0) {
      return {
        status: "out_of_stock",
        label: "Hết hàng",
        color: "danger",
        priority: 1,
      };
    }

    if (reorderLevel && currentStock <= reorderLevel) {
      return {
        status: "low_stock",
        label: "Sắp hết",
        color: "warning",
        priority: 2,
      };
    }

    if (maxStock && currentStock >= maxStock * 0.9) {
      return {
        status: "overstocked",
        label: "Tồn kho cao",
        color: "info",
        priority: 3,
      };
    }

    return {
      status: "normal",
      label: "Bình thường",
      color: "success",
      priority: 4,
    };
  };

  /**
   * Format stock display text
   */
  const formatStockDisplay = (stock, unit) => {
    if (stock === 0) return "0";
    if (stock < 1 && stock > 0) return stock.toFixed(2);
    if (Number.isInteger(stock)) return stock.toString();
    return stock.toFixed(1);
  };

  /**
   * Filter products based on search query
   */
  const filterProducts = useCallback(
    (query, products = combinedData.productsWithStock) => {
      if (!query || query.trim().length === 0) {
        setFilteredProducts(products);
        return products;
      }

      const lowercaseQuery = query.toLowerCase().trim();
      const filtered = products.filter(
        (product) =>
          product.name.toLowerCase().includes(lowercaseQuery) ||
          product.id.toString().includes(lowercaseQuery) ||
          (product.sku && product.sku.toLowerCase().includes(lowercaseQuery)) ||
          (product.category?.name &&
            product.category.name.toLowerCase().includes(lowercaseQuery))
      );

      setFilteredProducts(filtered);
      return filtered;
    },
    [combinedData.productsWithStock]
  );

  /**
   * Search products (local filtering)
   */
  const searchProducts = useCallback(
    async (query) => {
      setSearchQuery(query);
      return filterProducts(query);
    },
    [filterProducts]
  );

  /**
   * Add product to selection (for stock check)
   */
  const addProductToSelection = useCallback(
    (product, selectedProducts, setSelectedProducts) => {
      setSelectedProducts((prev) => {
        // Check if product is already selected
        if (prev.find((p) => p.id === product.id)) {
          return prev;
        }

        // Add product with current stock as expected quantity
        const newProduct = {
          ...product,
          expectedQuantity: product.currentStock || 0,
          notes: "",
        };

        return [...prev, newProduct];
      });
    },
    []
  );

  /**
   * Sort products by different criteria
   */
  const sortProducts = useCallback(
    (sortBy, products = filteredProducts) => {
      const sorted = [...products].sort((a, b) => {
        switch (sortBy) {
          case "name_asc":
            return a.name.localeCompare(b.name, "vi", { sensitivity: "base" });
          case "name_desc":
            return b.name.localeCompare(a.name, "vi", { sensitivity: "base" });
          case "stock_asc":
            return a.currentStock - b.currentStock;
          case "stock_desc":
            return b.currentStock - a.currentStock;
          case "price_asc":
            return a.sellingPrice - b.sellingPrice;
          case "price_desc":
            return b.sellingPrice - a.sellingPrice;
          case "category_asc":
            return (a.category?.name || "").localeCompare(
              b.category?.name || "",
              "vi"
            );
          case "status_priority":
            return a.stockStatus.priority - b.stockStatus.priority;
          default:
            return a.name.localeCompare(b.name, "vi", { sensitivity: "base" });
        }
      });

      setFilteredProducts(sorted);
      return sorted;
    },
    [filteredProducts]
  );

  /**
   * Get products by stock status
   */
  const getProductsByStatus = useCallback(
    (status) => {
      return combinedData.productsWithStock.filter(
        (product) => product.stockStatus.status === status
      );
    },
    [combinedData.productsWithStock]
  );

  /**
   * Refresh all data
   */
  const refreshData = useCallback(async () => {
    await Promise.all([productManagement.refresh(), stockLedger.refreshData()]);
  }, [productManagement, stockLedger]);

  // Computed values
  const computedValues = useMemo(() => {
    const products = combinedData.productsWithStock;

    const lowStockProducts = products.filter(
      (p) =>
        p.stockStatus.status === "low_stock" ||
        p.stockStatus.status === "out_of_stock"
    );

    const outOfStockProducts = products.filter(
      (p) => p.stockStatus.status === "out_of_stock"
    );

    const totalValue = products.reduce(
      (sum, product) => sum + product.sellingPrice * product.currentStock,
      0
    );

    return {
      totalProducts: products.length,
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts.length,
      totalInventoryValue: totalValue,
      lowStockProducts,
      outOfStockProducts,
      hasProducts: products.length > 0,
      isLoading:
        productManagement.loading.products ||
        stockLedger.loading ||
        combinedData.combining,
      hasError:
        productManagement.error.products ||
        stockLedger.error ||
        combinedData.combineError,
    };
  }, [
    combinedData,
    productManagement.loading,
    productManagement.error,
    stockLedger.loading,
    stockLedger.error,
  ]);

  // Effects

  // Combine data when products or stock data changes
  useEffect(() => {
    if (productManagement.products && productManagement.products.length > 0) {
      combineProductsWithStock();
    }
  }, [productManagement.products?.length]); // Only trigger when products length changes

  // Re-combine when stock data might have changed
  useEffect(() => {
    if (stockLedger.lastUpdated && combinedData.lastCombined) {
      if (stockLedger.lastUpdated > combinedData.lastCombined) {
        combineProductsWithStock();
      }
    }
  }, [
    stockLedger.lastUpdated,
    combineProductsWithStock,
    combinedData.lastCombined,
  ]);

  return {
    // Combined data state
    allProducts: combinedData.productsWithStock || [],
    filteredProducts: filteredProducts || [],
    searchQuery,

    // Loading and error states
    allProductsLoading: computedValues.isLoading,
    allProductsError:
      productManagement.error.products ||
      stockLedger.error ||
      combinedData.combineError ||
      null,

    // Original hook states (for compatibility)
    products: combinedData.productsWithStock || [], // For backward compatibility
    productsLoading: productManagement.loading.products,
    productsError: productManagement.error.products,

    // Stock ledger states
    stockLoading: stockLedger.loading,
    stockError: stockLedger.error,

    // Combined metadata
    lastCombined: combinedData.lastCombined,
    combining: combinedData.combining,

    // Computed values
    ...computedValues,

    // Actions
    searchProducts,
    addProductToSelection,
    sortProducts,
    getProductsByStatus,
    refreshData,
    combineProductsWithStock,
    filterProducts,

    // Original hook methods (for advanced usage)
    productManagement,
    stockLedger,

    // Utility methods
    clearError: () => {
      productManagement.resetError();
      stockLedger.clearError();
      setCombinedData((prev) => ({ ...prev, combineError: null }));
    },
  };
};

export default useProductWithStock;
