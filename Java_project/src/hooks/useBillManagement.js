/**
 * Bill Management Custom Hook
 *
 * This hook provides state management and business logic for bill management
 * functionality. It wraps the API service calls with React state management.
 *
 * @module useBillManagement
 */

import { useState, useEffect, useCallback, useRef } from "react";
import billService from "../services/bill-management/billService";
import {
  formatBillForDisplay,
  formatLowStockAlertsForDisplay,
  formatPurchaseOrderRequest,
  formatBillRequest,
  formatPaymentRequest,
  validatePurchaseOrderData,
  validateBillData,
  formatPaginationInfo,
} from "../utils/bill-management/billFormatter";

/**
 * Custom hook for bill management operations
 * @param {Object} options - Hook configuration options
 * @param {boolean} options.autoLoad - Whether to automatically load bills on mount
 * @param {number} options.refreshInterval - Auto-refresh interval in milliseconds
 * @returns {Object} Hook state and functions
 */
export const useBillManagement = (options = {}) => {
  const { autoLoad = true, refreshInterval = null } = options;

  // State Management
  const [bills, setBills] = useState([]);
  const [currentBill, setCurrentBill] = useState(null);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [summary, setSummary] = useState(null);

  // Pagination State
  const [pagination, setPagination] = useState({
    currentPage: 0,
    pageSize: 10,
    totalPages: 0,
    totalElements: 0,
    sort: "billDate,desc",
  });

  // Loading States
  const [loading, setLoading] = useState({
    bills: false,
    currentBill: false,
    lowStockAlerts: false,
    summary: false,
    creating: false,
    updating: false,
    deleting: false,
    paying: false,
  });

  // Error States
  const [errors, setErrors] = useState({
    bills: null,
    currentBill: null,
    lowStockAlerts: null,
    summary: null,
    creating: null,
    updating: null,
    deleting: null,
    paying: null,
  });

  // Refs for cleanup
  const refreshIntervalRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Utility function to update loading state
  const setLoadingState = useCallback((key, value) => {
    setLoading((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Utility function to update error state
  const setErrorState = useCallback((key, value) => {
    setErrors((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Clear specific error
  const clearError = useCallback(
    (key) => {
      setErrorState(key, null);
    },
    [setErrorState]
  );

  // Clear all errors
  const clearAllErrors = useCallback(() => {
    setErrors({
      bills: null,
      currentBill: null,
      lowStockAlerts: null,
      summary: null,
      creating: null,
      updating: null,
      deleting: null,
      paying: null,
    });
  }, []);

  // Bill Management Functions

  /**
   * Load bills with pagination
   * @param {Object} paginationParams - Pagination parameters
   */
  const loadBills = useCallback(
    async (paginationParams = {}) => {
      setLoadingState("bills", true);
      setErrorState("bills", null);

      const params = { ...pagination, ...paginationParams };

      try {
        const response = await billService.getBills(params);

        if (response.success) {
          const formattedBills =
            response.data.content?.map(formatBillForDisplay) || [];
          setBills(formattedBills);

          // Update pagination info
          setPagination((prev) => ({
            ...prev,
            currentPage:
              typeof response.data.number === "number"
                ? response.data.number
                : 0,
            pageSize:
              typeof response.data.size === "number"
                ? response.data.size
                : prev.pageSize,
            totalPages:
              typeof response.data.totalPages === "number"
                ? response.data.totalPages
                : 1,
            totalElements:
              typeof response.data.totalElements === "number"
                ? response.data.totalElements
                : 0,
            isFirst:
              typeof response.data.first === "boolean"
                ? response.data.first
                : undefined,
            isLast:
              typeof response.data.last === "boolean"
                ? response.data.last
                : undefined,
          }));
        } else {
          setErrorState("bills", response.error);
        }
      } catch (error) {
        setErrorState("bills", "Failed to load bills");
      } finally {
        setLoadingState("bills", false);
      }
    },
    [pagination, setLoadingState, setErrorState]
  );

  /**
   * Load a specific bill by ID
   * @param {number} billId - Bill ID
   */
  const loadBillById = useCallback(
    async (billId) => {
      setLoadingState("currentBill", true);
      setErrorState("currentBill", null);

      try {
        const response = await billService.getBillById(billId);

        if (response.success) {
          const formattedBill = formatBillForDisplay(response.data);
          setCurrentBill(formattedBill);
        } else {
          setErrorState("currentBill", response.error);
          setCurrentBill(null);
        }
      } catch (error) {
        setErrorState("currentBill", "Failed to load bill");
        setCurrentBill(null);
      } finally {
        setLoadingState("currentBill", false);
      }
    },
    [setLoadingState, setErrorState]
  );

  /**
   * Search for a bill by bill number
   * @param {string} billNumber - Bill number
   */
  const searchBillByNumber = useCallback(
    async (billNumber) => {
      setLoadingState("bills", true);
      setErrorState("bills", null);

      try {
        const response = await billService.getBillByNumber(billNumber);

        if (response.success) {
          const formattedBill = formatBillForDisplay(response.data);
          setBills([formattedBill]);
          setPagination((prev) => ({
            ...prev,
            totalElements: 1,
            totalPages: 1,
          }));
        } else {
          setErrorState("bills", response.error);
          setBills([]);
        }
      } catch (error) {
        setErrorState("bills", "Failed to search bill");
        setBills([]);
      } finally {
        setLoadingState("bills", false);
      }
    },
    [setLoadingState, setErrorState]
  );

  /**
   * Load low stock alerts for purchase orders
   */
  const loadLowStockAlerts = useCallback(async () => {
    setLoadingState("lowStockAlerts", true);
    setErrorState("lowStockAlerts", null);

    try {
      const response = await billService.getLowStockAlerts();

      if (response.success) {
        const formattedAlerts = formatLowStockAlertsForDisplay(response.data);
        setLowStockAlerts(formattedAlerts);
      } else {
        setErrorState("lowStockAlerts", response.error);
      }
    } catch (error) {
      setErrorState("lowStockAlerts", "Failed to load low stock alerts");
    } finally {
      setLoadingState("lowStockAlerts", false);
    }
  }, [setLoadingState, setErrorState]);

  /**
   * Load bills summary (outstanding amount, overdue bills, etc.)
   */
  const loadSummary = useCallback(async () => {
    setLoadingState("summary", true);
    setErrorState("summary", null);

    try {
      const response = await billService.getBillsSummary();

      if (response.success) {
        setSummary(response.data);
      } else {
        setErrorState("summary", response.error);
      }
    } catch (error) {
      setErrorState("summary", "Failed to load summary");
    } finally {
      setLoadingState("summary", false);
    }
  }, [setLoadingState, setErrorState]);

  /**
   * Create a purchase order
   * @param {Object} orderData - Purchase order data
   * @returns {Object} Creation result
   */
  const createPurchaseOrder = useCallback(
    async (orderData) => {
      setLoadingState("creating", true);
      setErrorState("creating", null);

      try {
        // Validate data
        const validation = validatePurchaseOrderData(orderData);
        if (!validation.isValid) {
          setErrorState("creating", validation.errors.join(", "));
          return { success: false, errors: validation.errors };
        }

        // Format and submit
        const formattedData = formatPurchaseOrderRequest(orderData);
        const response = await billService.createPurchaseOrder(formattedData);

        if (response.success) {
          // Refresh bills list to show new purchase order
          await loadBills();
          return { success: true, data: response.data };
        } else {
          setErrorState("creating", response.error);
          return { success: false, error: response.error };
        }
      } catch (error) {
        setErrorState("creating", "Failed to create purchase order");
        return { success: false, error: "Failed to create purchase order" };
      } finally {
        setLoadingState("creating", false);
      }
    },
    [setLoadingState, setErrorState, loadBills]
  );

  /**
   * Create a manual bill
   * @param {Object} billData - Bill data
   * @returns {Object} Creation result
   */
  const createBill = useCallback(
    async (billData) => {
      setLoadingState("creating", true);
      setErrorState("creating", null);

      try {
        // Validate data
        const validation = validateBillData(billData);
        if (!validation.isValid) {
          setErrorState("creating", validation.errors.join(", "));
          return { success: false, errors: validation.errors };
        }

        // Format and submit
        const formattedData = formatBillRequest(billData);
        const response = await billService.createBill(formattedData);

        if (response.success) {
          // Refresh bills list
          await loadBills();
          return { success: true, data: response.data };
        } else {
          setErrorState("creating", response.error);
          return { success: false, error: response.error };
        }
      } catch (error) {
        setErrorState("creating", "Failed to create bill");
        return { success: false, error: "Failed to create bill" };
      } finally {
        setLoadingState("creating", false);
      }
    },
    [setLoadingState, setErrorState, loadBills]
  );

  /**
   * Update an existing bill
   * @param {number} billId - Bill ID
   * @param {Object} billData - Updated bill data
   * @returns {Object} Update result
   */
  const updateBill = useCallback(
    async (billId, billData) => {
      setLoadingState("updating", true);
      setErrorState("updating", null);

      try {
        const validation = validateBillData(billData);
        if (!validation.isValid) {
          setErrorState("updating", validation.errors.join(", "));
          return { success: false, errors: validation.errors };
        }

        const formattedData = formatBillRequest(billData);
        const response = await billService.updateBill(billId, formattedData);

        if (response.success) {
          // Update current bill if it's the one being edited
          if (currentBill && currentBill.id === billId) {
            const formattedBill = formatBillForDisplay(response.data);
            setCurrentBill(formattedBill);
          }

          // Refresh bills list
          await loadBills();
          return { success: true, data: response.data };
        } else {
          setErrorState("updating", response.error);
          return { success: false, error: response.error };
        }
      } catch (error) {
        setErrorState("updating", "Failed to update bill");
        return { success: false, error: "Failed to update bill" };
      } finally {
        setLoadingState("updating", false);
      }
    },
    [setLoadingState, setErrorState, currentBill, loadBills]
  );

  /**
   * Make a payment on a bill
   * @param {number} billId - Bill ID
   * @param {number} amount - Payment amount
   * @returns {Object} Payment result
   */
  const makePayment = useCallback(
    async (billId, amount) => {
      setLoadingState("paying", true);
      setErrorState("paying", null);

      try {
        const response = await billService.makePayment(billId, amount);

        if (response.success) {
          // Update current bill if it's the one being paid
          if (currentBill && currentBill.id === billId) {
            const formattedBill = formatBillForDisplay(response.data);
            setCurrentBill(formattedBill);
          }

          // Refresh bills list and summary
          await Promise.all([loadBills(), loadSummary()]);
          return { success: true, data: response.data };
        } else {
          setErrorState("paying", response.error);
          return { success: false, error: response.error };
        }
      } catch (error) {
        setErrorState("paying", "Failed to process payment");
        return { success: false, error: "Failed to process payment" };
      } finally {
        setLoadingState("paying", false);
      }
    },
    [setLoadingState, setErrorState, currentBill, loadBills, loadSummary]
  );

  /**
   * Delete a bill
   * @param {number} billId - Bill ID
   * @returns {Object} Deletion result
   */
  const deleteBill = useCallback(
    async (billId) => {
      setLoadingState("deleting", true);
      setErrorState("deleting", null);

      try {
        const response = await billService.deleteBill(billId);

        if (response.success) {
          // Clear current bill if it's the one being deleted
          if (currentBill && currentBill.id === billId) {
            setCurrentBill(null);
          }

          // Refresh bills list and summary
          await Promise.all([loadBills(), loadSummary()]);
          return { success: true };
        } else {
          setErrorState("deleting", response.error);
          return { success: false, error: response.error };
        }
      } catch (error) {
        setErrorState("deleting", "Failed to delete bill");
        return { success: false, error: "Failed to delete bill" };
      } finally {
        setLoadingState("deleting", false);
      }
    },
    [setLoadingState, setErrorState, currentBill, loadBills, loadSummary]
  );

  // Pagination Functions

  /**
   * Go to next page
   */
  const nextPage = useCallback(() => {
    if (pagination.currentPage < pagination.totalPages - 1) {
      loadBills({ page: pagination.currentPage + 1 });
    }
  }, [pagination.currentPage, pagination.totalPages, loadBills]);

  /**
   * Go to previous page
   */
  const previousPage = useCallback(() => {
    if (pagination.currentPage > 0) {
      loadBills({ page: pagination.currentPage - 1 });
    }
  }, [pagination.currentPage, loadBills]);

  /**
   * Go to specific page
   * @param {number} page - Page number (0-based)
   */
  const goToPage = useCallback(
    (page) => {
      if (page >= 0 && page < pagination.totalPages) {
        loadBills({ page });
      }
    },
    [pagination.totalPages, loadBills]
  );

  /**
   * Change page size
   * @param {number} size - New page size
   */
  const changePageSize = useCallback(
    (size) => {
      loadBills({ page: 0, size });
    },
    [loadBills]
  );

  /**
   * Change sort order
   * @param {string} sort - Sort criteria
   */
  const changeSort = useCallback(
    (sort) => {
      loadBills({ page: 0, sort });
    },
    [loadBills]
  );

  // Refresh Functions

  /**
   * Refresh all data
   */
  const refreshAll = useCallback(async () => {
    await Promise.all([loadBills(), loadSummary(), loadLowStockAlerts()]);
  }, [loadBills, loadSummary, loadLowStockAlerts]);

  /**
   * Refresh bills only
   */
  const refreshBills = useCallback(() => {
    loadBills();
  }, [loadBills]);

  // Auto-refresh setup
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(refreshAll, refreshInterval);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [refreshInterval, refreshAll]);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      refreshAll();
    }
  }, [autoLoad, refreshAll]);

  // Cleanup on unmount
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

  // Computed values
  const paginationInfo = formatPaginationInfo(pagination);
  const hasNextPage = pagination.currentPage < pagination.totalPages - 1;
  const hasPreviousPage = pagination.currentPage > 0;
  const isAnyLoading = Object.values(loading).some(Boolean);
  const hasAnyError = Object.values(errors).some(Boolean);

  // Return hook interface
  return {
    // Data
    bills,
    currentBill,
    lowStockAlerts,
    summary,

    // Pagination
    pagination: {
      ...pagination,
      ...paginationInfo,
      hasNextPage,
      hasPreviousPage,
    },

    // Loading states
    loading,
    isAnyLoading,

    // Error states
    errors,
    hasAnyError,

    // Core functions
    loadBills,
    loadBillById,
    searchBillByNumber,
    loadLowStockAlerts,
    loadSummary,
    createPurchaseOrder,
    createBill,
    updateBill,
    makePayment,
    deleteBill,

    // Pagination functions
    nextPage,
    previousPage,
    goToPage,
    changePageSize,
    changeSort,

    // Utility functions
    refreshAll,
    refreshBills,
    clearError,
    clearAllErrors,

    // State setters (for advanced use cases)
    setCurrentBill,
    setBills,
  };
};

export default useBillManagement;
