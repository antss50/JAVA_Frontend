/**
 * Import Goods Returned Management Custom Hook
 * Provides reusable state management and operations for goods return data
 */

import { useState, useCallback, useRef } from "react";
import importGoodsReturnedService from "../services/inventory-related/import-good-returned/importGoodsReturnedService.js";
import {
  createInitialGoodsReturn,
  addGoodsReturnLine,
  removeGoodsReturnLine,
  updateGoodsReturnLine,
  validateGoodsReturn,
  formatSuccessMessage,
  calculateTotalReturnValue,
  RETURN_REASONS,
} from "../utils/inventory-related/importGoodsReturnedFormatter.js";

/**
 * Custom hook for import goods returned management
 * @param {Object} options - Configuration options
 * @returns {Object} Goods return state and methods
 */
export const useImportGoodsReturned = (options = {}) => {
  const {
    autoCalculateValues = true,
    onSuccess = null,
    onError = null,
  } = options;

  // Refs for tracking operations
  const abortControllerRef = useRef(null);

  // State management
  const [state, setState] = useState({
    // Current goods return being created/edited
    currentGoodsReturn: createInitialGoodsReturn(),

    // Loading states
    loading: {
      recording: false,
      validating: false,
      fetching: false,
      submitting: false,
    },

    // Error handling
    errors: {
      recording: null,
      validation: [],
      api: null,
    },

    // Success states
    lastRecordedReturn: null,
    successMessage: "",

    // Data collections
    goodsReturns: [],
    filteredReturns: [],

    // UI state
    showValidationErrors: false,
    isFormDirty: false,
  });

  /**
   * Updates loading state for specific operation
   */
  const setLoading = useCallback((operation, isLoading) => {
    setState((prev) => ({
      ...prev,
      loading: {
        ...prev.loading,
        [operation]: isLoading,
      },
    }));
  }, []);

  /**
   * Sets error state
   */
  const setError = useCallback((errorType, error) => {
    setState((prev) => ({
      ...prev,
      errors: {
        ...prev.errors,
        [errorType]: error,
      },
    }));
  }, []);

  /**
   * Clears all errors
   */
  const clearErrors = useCallback(() => {
    setState((prev) => ({
      ...prev,
      errors: {
        recording: null,
        validation: [],
        api: null,
      },
      showValidationErrors: false,
    }));
  }, []);

  /**
   * Initializes a new goods return
   */
  const initializeGoodsReturn = useCallback(
    (initialData = {}) => {
      const newGoodsReturn = createInitialGoodsReturn(initialData);

      setState((prev) => ({
        ...prev,
        currentGoodsReturn: newGoodsReturn,
        isFormDirty: false,
        lastRecordedReturn: null,
        successMessage: "",
      }));

      clearErrors();
    },
    [clearErrors]
  );

  /**
   * Updates the current goods return
   */
  const updateGoodsReturn = useCallback(
    (updates) => {
      setState((prev) => ({
        ...prev,
        currentGoodsReturn: {
          ...prev.currentGoodsReturn,
          ...updates,
        },
        isFormDirty: true,
      }));

      // Clear validation errors when user makes changes
      clearErrors();
    },
    [clearErrors]
  );

  /**
   * Adds a new line item to the current goods return
   */
  const addLineItem = useCallback(
    (lineData = {}) => {
      setState((prev) => {
        const updatedGoodsReturn = addGoodsReturnLine(
          prev.currentGoodsReturn,
          lineData
        );
        return {
          ...prev,
          currentGoodsReturn: updatedGoodsReturn,
          isFormDirty: true,
        };
      });

      clearErrors();
    },
    [clearErrors]
  );

  /**
   * Removes a line item from the current goods return
   */
  const removeLineItem = useCallback((lineIndex) => {
    setState((prev) => {
      const updatedGoodsReturn = removeGoodsReturnLine(
        prev.currentGoodsReturn,
        lineIndex
      );
      return {
        ...prev,
        currentGoodsReturn: updatedGoodsReturn,
        isFormDirty: true,
      };
    });
  }, []);

  /**
   * Updates a specific line item
   */
  const updateLineItem = useCallback(
    (lineIndex, updateData) => {
      setState((prev) => {
        const updatedGoodsReturn = updateGoodsReturnLine(
          prev.currentGoodsReturn,
          lineIndex,
          updateData
        );

        return {
          ...prev,
          currentGoodsReturn: updatedGoodsReturn,
          isFormDirty: true,
        };
      });

      clearErrors();
    },
    [clearErrors]
  );

  /**
   * Validates the current goods return
   */
  const validateCurrentGoodsReturn = useCallback(() => {
    const validation = validateGoodsReturn(state.currentGoodsReturn);

    setState((prev) => ({
      ...prev,
      errors: {
        ...prev.errors,
        validation: validation.errors,
      },
      showValidationErrors: !validation.isValid,
    }));

    return validation;
  }, [state.currentGoodsReturn]);

  /**
   * Records the current goods return
   */
  const recordGoodsReturn = useCallback(async () => {
    // Validate before submission
    const validation = validateCurrentGoodsReturn();
    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    setLoading("recording", true);
    setLoading("submitting", true);
    setError("recording", null);

    try {
      // Cancel any previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const response = await importGoodsReturnedService.recordGoodsReturn(
        state.currentGoodsReturn
      );

      const successMsg = formatSuccessMessage(response);

      setState((prev) => ({
        ...prev,
        lastRecordedReturn: response,
        successMessage: successMsg,
        isFormDirty: false,
      }));

      // Call success callback if provided
      if (onSuccess) {
        onSuccess(response, successMsg);
      }

      return { success: true, data: response, message: successMsg };
    } catch (error) {
      const errorMessage = error.message || "Failed to record goods return";
      setError("recording", errorMessage);

      // Call error callback if provided
      if (onError) {
        onError(error, errorMessage);
      }

      return { success: false, error: errorMessage };
    } finally {
      setLoading("recording", false);
      setLoading("submitting", false);
    }
  }, [
    state.currentGoodsReturn,
    validateCurrentGoodsReturn,
    setLoading,
    setError,
    onSuccess,
    onError,
  ]);

  /**
   * Fetches goods returns with optional filters
   */
  const fetchGoodsReturns = useCallback(
    async (filters = {}) => {
      setLoading("fetching", true);
      setError("api", null);

      try {
        const response = await importGoodsReturnedService.getGoodsReturns(
          filters
        );

        setState((prev) => ({
          ...prev,
          goodsReturns: response,
          filteredReturns: response,
        }));

        return { success: true, data: response };
      } catch (error) {
        const errorMessage = error.message || "Failed to fetch goods returns";
        setError("api", errorMessage);

        return { success: false, error: errorMessage };
      } finally {
        setLoading("fetching", false);
      }
    },
    [setLoading, setError]
  );

  /**
   * Fetches goods returns by purchase order
   */
  const fetchReturnsByPurchaseOrder = useCallback(
    async (purchaseOrderId) => {
      if (!purchaseOrderId) {
        setError("api", "Purchase Order ID is required");
        return { success: false, error: "Purchase Order ID is required" };
      }

      setLoading("fetching", true);
      setError("api", null);

      try {
        const response =
          await importGoodsReturnedService.getGoodsReturnsByPurchaseOrder(
            purchaseOrderId
          );

        setState((prev) => ({
          ...prev,
          filteredReturns: response,
        }));

        return { success: true, data: response };
      } catch (error) {
        const errorMessage =
          error.message || "Failed to fetch returns for purchase order";
        setError("api", errorMessage);

        return { success: false, error: errorMessage };
      } finally {
        setLoading("fetching", false);
      }
    },
    [setLoading, setError]
  );
  /**
   * Fetches goods returns by supplier
   */
  const fetchReturnsBySupplier = useCallback(
    async (supplierId, dateRange = {}) => {
      if (!supplierId) {
        setError("api", "Supplier ID is required");
        return { success: false, error: "Supplier ID is required" };
      }

      setLoading("fetching", true);
      setError("api", null);

      try {
        const response =
          await importGoodsReturnedService.getGoodsReturnsBySupplier(
            supplierId,
            dateRange
          );

        setState((prev) => ({
          ...prev,
          filteredReturns: response,
        }));

        return { success: true, data: response };
      } catch (error) {
        const errorMessage =
          error.message || "Failed to fetch returns for supplier";
        setError("api", errorMessage);

        return { success: false, error: errorMessage };
      } finally {
        setLoading("fetching", false);
      }
    },
    [setLoading, setError]
  );

  /**
   * Fetches goods returns by product
   */
  const fetchReturnsByProduct = useCallback(
    async (productId) => {
      if (!productId) {
        setError("api", "Product ID is required");
        return { success: false, error: "Product ID is required" };
      }

      setLoading("fetching", true);
      setError("api", null);

      try {
        const response =
          await importGoodsReturnedService.getGoodsReturnsByProduct(productId);

        setState((prev) => ({
          ...prev,
          filteredReturns: response,
        }));

        return { success: true, data: response };
      } catch (error) {
        const errorMessage =
          error.message || "Failed to fetch returns for product";
        setError("api", errorMessage);

        return { success: false, error: errorMessage };
      } finally {
        setLoading("fetching", false);
      }
    },
    [setLoading, setError]
  );

  /**
   * Fetches goods returns by date range
   */
  const fetchReturnsByDateRange = useCallback(
    async (startDate, endDate) => {
      if (!startDate || !endDate) {
        setError("api", "Start date and end date are required");
        return {
          success: false,
          error: "Start date and end date are required",
        };
      }

      setLoading("fetching", true);
      setError("api", null);

      try {
        const response =
          await importGoodsReturnedService.getGoodsReturnsByDateRange(
            startDate,
            endDate
          );

        setState((prev) => ({
          ...prev,
          filteredReturns: response,
        }));

        return { success: true, data: response };
      } catch (error) {
        const errorMessage =
          error.message || "Failed to fetch returns for date range";
        setError("api", errorMessage);

        return { success: false, error: errorMessage };
      } finally {
        setLoading("fetching", false);
      }
    },
    [setLoading, setError]
  );
  /**
   * Fetches stock movement for a specific return
   */
  const fetchStockMovementForReturn = useCallback(
    async (returnId) => {
      if (!returnId) {
        setError("api", "Return ID is required");
        return { success: false, error: "Return ID is required" };
      }

      setLoading("fetching", true);
      setError("api", null);

      try {
        const response =
          await importGoodsReturnedService.getStockMovementForReturn(returnId);

        return { success: true, data: response };
      } catch (error) {
        const errorMessage =
          error.message || "Failed to fetch stock movement for return";
        setError("api", errorMessage);

        return { success: false, error: errorMessage };
      } finally {
        setLoading("fetching", false);
      }
    },
    [setLoading, setError]
  );

  /**
   * Searches for bills that can be returned
   */
  const searchReturnableBills = useCallback(
    async (searchFilters = {}, pagination = {}) => {
      setLoading("fetching", true);
      setError("api", null);

      try {
        const response = await importGoodsReturnedService.searchReturnableBills(
          searchFilters,
          pagination
        );

        return { success: true, data: response.data };
      } catch (error) {
        const errorMessage =
          error.message || "Failed to search returnable bills";
        setError("api", errorMessage);

        return { success: false, error: errorMessage };
      } finally {
        setLoading("fetching", false);
      }
    },
    [setLoading, setError]
  );

  /**
   * Gets all bills that can be returned
   */
  const getReturnableBills = useCallback(
    async (pagination = {}) => {
      setLoading("fetching", true);
      setError("api", null);

      try {
        const response = await importGoodsReturnedService.getReturnableBills(
          pagination
        );

        return { success: true, data: response.data };
      } catch (error) {
        const errorMessage =
          error.message || "Failed to fetch returnable bills";
        setError("api", errorMessage);

        return { success: false, error: errorMessage };
      } finally {
        setLoading("fetching", false);
      }
    },
    [setLoading, setError]
  );

  /**
   * Gets a specific bill for return processing
   */
  const getBillForReturn = useCallback(
    async (billId) => {
      if (!billId) {
        setError("api", "Bill ID is required");
        return { success: false, error: "Bill ID is required" };
      }

      setLoading("fetching", true);
      setError("api", null);

      try {
        const response = await importGoodsReturnedService.getBillForReturn(
          billId
        );

        return { success: true, data: response.data };
      } catch (error) {
        const errorMessage = error.message || "Failed to fetch bill for return";
        setError("api", errorMessage);

        return { success: false, error: errorMessage };
      } finally {
        setLoading("fetching", false);
      }
    },
    [setLoading, setError]
  );

  /**
   * Calculates total return value for current goods return
   */
  const getTotalReturnValue = useCallback(() => {
    return calculateTotalReturnValue(state.currentGoodsReturn);
  }, [state.currentGoodsReturn]);

  /**
   * Gets available return reasons
   */
  const getReturnReasons = useCallback(() => {
    return RETURN_REASONS;
  }, []);

  /**
   * Resets the hook state
   */
  const reset = useCallback(() => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setState({
      currentGoodsReturn: createInitialGoodsReturn(),
      loading: {
        recording: false,
        validating: false,
        fetching: false,
        submitting: false,
      },
      errors: {
        recording: null,
        validation: [],
        api: null,
      },
      lastRecordedReturn: null,
      successMessage: "",
      goodsReturns: [],
      filteredReturns: [],
      showValidationErrors: false,
      isFormDirty: false,
    });
  }, []);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);
  return {
    // State
    ...state,

    // Computed values
    totalReturnValue: getTotalReturnValue(),
    returnReasons: getReturnReasons(),

    // Actions
    initializeGoodsReturn,
    updateGoodsReturn,
    addLineItem,
    removeLineItem,
    updateLineItem,
    validateCurrentGoodsReturn,
    recordGoodsReturn,
    fetchGoodsReturns,
    fetchReturnsByPurchaseOrder,
    fetchReturnsBySupplier,
    fetchReturnsByProduct,
    fetchReturnsByDateRange,
    fetchStockMovementForReturn,

    // Bill searching for returns
    searchReturnableBills,
    getReturnableBills,
    getBillForReturn,

    clearErrors,
    reset,
    cleanup,
  };
};
