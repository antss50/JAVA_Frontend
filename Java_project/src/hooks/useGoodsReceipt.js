/**
 * Goods Receipt Management Custom Hook
 * Provides reusable state management and operations for goods receipt data
 */

import { useState, useCallback, useRef } from "react";
import goodsReceiptApiService from "../services/inventory-related/import-goods/goodsReceiptService.js";
import {
  createInitialGoodsReceipt,
  addNewGoodsReceiptItem,
  removeGoodsReceiptItem,
  validateGoodsReceiptRequest,
  parseStockVerificationMessage,
} from "../utils/inventory-related/goodsReceiptFormatter.js";

/**
 * Custom hook for goods receipt management
 * @param {Object} options - Configuration options
 * @returns {Object} Goods receipt state and methods
 */
export const useGoodsReceipt = (options = {}) => {
  const {
    autoGenerateReference = true,
    defaultWarehouseId = 1,
    onSuccess = null,
    onError = null,
  } = options;

  // State management
  const [state, setState] = useState({
    // Current goods receipt being created/edited
    currentGoodsReceipt: createInitialGoodsReceipt({
      warehouseId: defaultWarehouseId,
    }),

    // Loading states
    loading: {
      recording: false,
      validating: false,
      checkingReference: false,
      fetchingHistory: false,
    },

    // Error handling
    errors: {
      recording: null,
      validation: [],
      api: null,
    },

    // Success data
    lastRecordedReceipt: null,
    stockVerification: null,

    // History and lookup data
    receiptsHistory: [],
    availableWarehouses: [],
    vendorInfo: null,

    // Form state
    isFormValid: false,
    isDirty: false,
  });

  // Ref to track if component is mounted
  const isMountedRef = useRef(true);

  /**
   * Safe state update that checks if component is still mounted
   */
  const safeSetState = useCallback((updater) => {
    if (isMountedRef.current) {
      setState(updater);
    }
  }, []);

  /**
   * Updates loading state for a specific operation
   */
  const setLoading = useCallback(
    (operation, isLoading) => {
      safeSetState((prev) => ({
        ...prev,
        loading: {
          ...prev.loading,
          [operation]: isLoading,
        },
      }));
    },
    [safeSetState]
  );

  /**
   * Updates error state
   */
  const setError = useCallback(
    (type, error) => {
      safeSetState((prev) => ({
        ...prev,
        errors: {
          ...prev.errors,
          [type]: error,
        },
      }));
    },
    [safeSetState]
  );

  /**
   * Records a goods receipt
   */
  const recordGoodsReceipt = useCallback(
    async (goodsReceiptData = null) => {
      const dataToRecord = goodsReceiptData || state.currentGoodsReceipt;

      setLoading("recording", true);
      setError("recording", null);
      setError("api", null);

      try {
        // Generate document reference if auto-generation is enabled
        let finalData = { ...dataToRecord };
        if (autoGenerateReference && !finalData.documentReference) {
          finalData.documentReference = `GR-${new Date().getFullYear()}-${String(
            Date.now()
          ).slice(-6)}`;
        }

        const response = await goodsReceiptApiService.recordGoodsReceipt(
          finalData
        );

        if (response.success) {
          const stockVerification = parseStockVerificationMessage(
            response.message
          );

          safeSetState((prev) => ({
            ...prev,
            lastRecordedReceipt: response.stockLedgerEntries,
            stockVerification: stockVerification,
            currentGoodsReceipt: createInitialGoodsReceipt({
              warehouseId: defaultWarehouseId,
            }),
            isDirty: false,
          }));

          // Call success callback if provided
          if (onSuccess) {
            onSuccess(response, stockVerification);
          }

          return response;
        } else {
          throw new Error(response.message || "Failed to record goods receipt");
        }
      } catch (error) {
        console.error("Error recording goods receipt:", error);
        setError("recording", error.message);
        setError("api", error);

        // Call error callback if provided
        if (onError) {
          onError(error);
        }

        throw error;
      } finally {
        setLoading("recording", false);
      }
    },
    [
      state.currentGoodsReceipt,
      autoGenerateReference,
      defaultWarehouseId,
      onSuccess,
      onError,
      safeSetState,
      setLoading,
      setError,
    ]
  );

  /**
   * Validates the current goods receipt
   */
  const validateGoodsReceipt = useCallback(
    async (goodsReceiptData = null) => {
      const dataToValidate = goodsReceiptData || state.currentGoodsReceipt;

      setLoading("validating", true);
      setError("validation", []);

      try {
        const validation = validateGoodsReceiptRequest(dataToValidate);

        setError("validation", validation.errors);

        safeSetState((prev) => ({
          ...prev,
          isFormValid: validation.isValid,
        }));

        return validation;
      } catch (error) {
        console.error("Error validating goods receipt:", error);
        setError("validation", ["Validation failed: " + error.message]);
        return { isValid: false, errors: ["Validation failed"] };
      } finally {
        setLoading("validating", false);
      }
    },
    [state.currentGoodsReceipt, safeSetState, setLoading, setError]
  );

  /**
   * Updates the current goods receipt
   */
  const updateGoodsReceipt = useCallback(
    (updates) => {
      safeSetState((prev) => ({
        ...prev,
        currentGoodsReceipt: {
          ...prev.currentGoodsReceipt,
          ...updates,
        },
        isDirty: true,
      }));

      // Auto-validate after update
      setTimeout(() => {
        validateGoodsReceipt();
      }, 100);
    },
    [safeSetState, validateGoodsReceipt]
  );

  /**
   * Updates a specific item in the goods receipt
   */
  const updateGoodsReceiptItem = useCallback(
    (index, itemUpdates) => {
      safeSetState((prev) => {
        const items = [...prev.currentGoodsReceipt.items];
        items[index] = { ...items[index], ...itemUpdates };

        return {
          ...prev,
          currentGoodsReceipt: {
            ...prev.currentGoodsReceipt,
            items,
          },
          isDirty: true,
        };
      });

      // Auto-validate after update
      setTimeout(() => {
        validateGoodsReceipt();
      }, 100);
    },
    [safeSetState, validateGoodsReceipt]
  );

  /**
   * Adds a new item to the goods receipt
   */
  const addGoodsReceiptItem = useCallback(() => {
    safeSetState((prev) => ({
      ...prev,
      currentGoodsReceipt: addNewGoodsReceiptItem(prev.currentGoodsReceipt),
      isDirty: true,
    }));
  }, [safeSetState]);

  /**
   * Removes an item from the goods receipt
   */
  const removeGoodsReceiptItem = useCallback(
    (index) => {
      safeSetState((prev) => ({
        ...prev,
        currentGoodsReceipt: removeGoodsReceiptItem(
          prev.currentGoodsReceipt,
          index
        ),
        isDirty: true,
      }));

      // Auto-validate after removal
      setTimeout(() => {
        validateGoodsReceipt();
      }, 100);
    },
    [safeSetState, validateGoodsReceipt]
  );

  /**
   * Checks if document reference is unique
   */
  const checkDocumentReferenceUniqueness = useCallback(
    async (documentReference) => {
      if (!documentReference) return false;

      setLoading("checkingReference", true);

      try {
        const isUnique = await goodsReceiptApiService.isDocumentReferenceUnique(
          documentReference
        );
        return isUnique;
      } catch (error) {
        console.error("Error checking document reference:", error);
        return false; // Assume not unique on error to be safe
      } finally {
        setLoading("checkingReference", false);
      }
    },
    [setLoading]
  );

  /**
   * Fetches goods receipt history
   */
  const fetchGoodsReceiptHistory = useCallback(
    async (filters = {}) => {
      setLoading("fetchingHistory", true);

      try {
        const history = await goodsReceiptApiService.getGoodsReceiptHistory(
          filters
        );

        safeSetState((prev) => ({
          ...prev,
          receiptsHistory: history.data || [],
        }));

        return history;
      } catch (error) {
        console.error("Error fetching goods receipt history:", error);
        setError("api", error);
        return { data: [], totalElements: 0 };
      } finally {
        setLoading("fetchingHistory", false);
      }
    },
    [safeSetState, setLoading, setError]
  );

  /**
   * Fetches available warehouses
   */
  const fetchAvailableWarehouses = useCallback(async () => {
    try {
      const warehouses = await goodsReceiptApiService.getAvailableWarehouses();

      safeSetState((prev) => ({
        ...prev,
        availableWarehouses: warehouses,
      }));

      return warehouses;
    } catch (error) {
      console.error("Error fetching warehouses:", error);
      return [];
    }
  }, [safeSetState]);

  /**
   * Fetches vendor information
   */
  const fetchVendorInfo = useCallback(
    async (vendorId) => {
      if (!vendorId) return null;

      try {
        const vendorInfo = await goodsReceiptApiService.getVendorInfo(vendorId);

        safeSetState((prev) => ({
          ...prev,
          vendorInfo,
        }));

        return vendorInfo;
      } catch (error) {
        console.error("Error fetching vendor info:", error);
        return null;
      }
    },
    [safeSetState]
  );

  /**
   * Resets the form to initial state
   */
  const resetForm = useCallback(() => {
    safeSetState((prev) => ({
      ...prev,
      currentGoodsReceipt: createInitialGoodsReceipt({
        warehouseId: defaultWarehouseId,
      }),
      errors: {
        recording: null,
        validation: [],
        api: null,
      },
      isDirty: false,
      isFormValid: false,
    }));
  }, [safeSetState, defaultWarehouseId]);

  /**
   * Clears all errors
   */
  const clearErrors = useCallback(() => {
    safeSetState((prev) => ({
      ...prev,
      errors: {
        recording: null,
        validation: [],
        api: null,
      },
    }));
  }, [safeSetState]);

  /**
   * Cleanup function
   */
  const cleanup = useCallback(() => {
    isMountedRef.current = false;
  }, []);

  // Return hook interface
  return {
    // State
    goodsReceipt: state.currentGoodsReceipt,
    loading: state.loading,
    errors: state.errors,
    isFormValid: state.isFormValid,
    isDirty: state.isDirty,
    lastRecordedReceipt: state.lastRecordedReceipt,
    stockVerification: state.stockVerification,
    receiptsHistory: state.receiptsHistory,
    availableWarehouses: state.availableWarehouses,
    vendorInfo: state.vendorInfo,

    // Actions
    recordGoodsReceipt,
    validateGoodsReceipt,
    updateGoodsReceipt,
    updateGoodsReceiptItem,
    addGoodsReceiptItem,
    removeGoodsReceiptItem,
    checkDocumentReferenceUniqueness,
    fetchGoodsReceiptHistory,
    fetchAvailableWarehouses,
    fetchVendorInfo,
    resetForm,
    clearErrors,
    cleanup,

    // Computed values
    isRecording: state.loading.recording,
    hasErrors:
      state.errors.validation.length > 0 ||
      !!state.errors.recording ||
      !!state.errors.api,
    canSubmit: state.isFormValid && !state.loading.recording,
    itemsCount: state.currentGoodsReceipt.items.length,
    totalQuantity: state.currentGoodsReceipt.items.reduce(
      (sum, item) => sum + (parseFloat(item.quantityReceived) || 0),
      0
    ),
  };
};

export default useGoodsReceipt;
