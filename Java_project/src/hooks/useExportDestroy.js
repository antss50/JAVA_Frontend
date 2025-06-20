/**
 * useExportDestroy Custom Hook
 * Provides reusable state management and functions for stock disposal operations
 */

import { useState, useEffect, useCallback, useRef } from "react";
import exportDestroyService from "../services/inventory-related/export-destroy/exportDestroyService.js";
import {
  formatDisposalSummary,
  formatErrorResponse,
  generateDisposalReference,
  DISPOSAL_REASONS,
  DISPOSAL_METHODS,
  getDisposalReasonText,
  getDisposalMethodText,
} from "../utils/inventory-related/exportDestroyFormatter.js";

/**
 * Custom hook for export/destroy (stock disposal) operations
 * @param {Object} options - Hook configuration options
 * @param {boolean} options.autoRefresh - Whether to auto-refresh disposal history
 * @param {number} options.refreshInterval - Refresh interval in milliseconds
 * @param {boolean} options.enableHistory - Whether to load disposal history
 * @returns {Object} Hook state and functions
 */
export const useExportDestroy = (options = {}) => {
  const {
    autoRefresh = false,
    refreshInterval = 60000, // 1 minute
    enableHistory = false,
  } = options;

  // State management
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [disposalRecords, setDisposalRecords] = useState([]);
  const [disposalHistory, setDisposalHistory] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [lastDisposal, setLastDisposal] = useState(null);
  const [summary, setSummary] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Refs for cleanup and caching
  const refreshIntervalRef = useRef(null);
  const abortControllerRef = useRef(null);

  /**
   * Generic error handler
   */
  const handleError = useCallback((error, operation) => {
    const formattedError = formatErrorResponse(error);
    setError({
      ...formattedError,
      operation,
      timestamp: new Date().toISOString(),
    });
    console.error(`Error in ${operation}:`, formattedError);
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
    setValidationErrors([]);
  }, []);

  /**
   * Record stock disposal
   * @param {Object} disposalData - Disposal form data
   * @returns {Promise<Object>} Disposal result
   */
  const recordDisposal = useCallback(
    async (disposalData) => {
      try {
        setSubmitting(true);
        setError(null);
        setValidationErrors([]);

        // Generate reference number if not provided
        if (!disposalData.referenceNumber) {
          disposalData.referenceNumber = generateDisposalReference();
        }

        console.log("Recording disposal:", disposalData);

        const result = await exportDestroyService.recordStockDisposal(
          disposalData
        );

        if (result.success) {
          setLastDisposal(result);
          setDisposalRecords(result.disposalRecords || []);
          setSummary(formatDisposalSummary(result.disposalRecords || []));
          setLastUpdated(new Date().toISOString()); // Refresh history if enabled (disabled for now since endpoint doesn't exist)
          // if (enableHistory) {
          //   await loadDisposalHistory();
          // }
        }

        return result;
      } catch (error) {
        if (error.type === "VALIDATION_ERROR") {
          setValidationErrors(error.errors || [error.message]);
        } else {
          handleError(error, "recordDisposal");
        }
        throw error;
      } finally {
        setSubmitting(false);
      }
    },
    [enableHistory, handleError]
  );

  /**
   * Load disposal history
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} Disposal history
   */
  const loadDisposalHistory = useCallback(
    async (filters = {}) => {
      try {
        setLoading(true);
        setError(null);

        console.log("Loading disposal history with filters:", filters);

        const result = await exportDestroyService.getDisposalHistory(filters);

        if (result.success) {
          setDisposalHistory(result.disposalRecords || []);
          setLastUpdated(new Date().toISOString());
        }

        return result.disposalRecords || [];
      } catch (error) {
        handleError(error, "loadDisposalHistory");
        return [];
      } finally {
        setLoading(false);
      }
    },
    [handleError]
  );

  /**
   * Get disposal record by ID
   * @param {number} disposalId - Disposal record ID
   * @returns {Promise<Object>} Disposal record
   */
  const getDisposalById = useCallback(
    async (disposalId) => {
      try {
        setLoading(true);
        setError(null);

        console.log("Getting disposal by ID:", disposalId);

        const result = await exportDestroyService.getDisposalById(disposalId);
        return result;
      } catch (error) {
        handleError(error, "getDisposalById");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [handleError]
  );

  /**
   * Validate disposal form data
   * @param {Object} disposalData - Disposal form data
   * @returns {Object} Validation result
   */
  const validateDisposal = useCallback(
    (disposalData) => {
      try {
        setValidationErrors([]);

        const validation = exportDestroyService.validateDisposal(disposalData);

        if (!validation.isValid) {
          setValidationErrors(validation.errors);
        }

        return validation;
      } catch (error) {
        handleError(error, "validateDisposal");
        return { isValid: false, errors: ["Validation error occurred"] };
      }
    },
    [handleError]
  );

  /**
   * Check stock availability for disposal items
   * @param {Array} items - Disposal items
   * @returns {Promise<Object>} Stock availability result
   */
  const checkStockAvailability = useCallback(
    async (items) => {
      try {
        setLoading(true);
        setError(null);

        console.log("Checking stock availability for items:", items);

        const result = await exportDestroyService.checkStockAvailability(items);
        return result;
      } catch (error) {
        handleError(error, "checkStockAvailability");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [handleError]
  );

  /**
   * Reset hook state
   */
  const reset = useCallback(() => {
    setError(null);
    setValidationErrors([]);
    setDisposalRecords([]);
    setDisposalHistory([]);
    setLastDisposal(null);
    setSummary(null);
    setLastUpdated(null);
  }, []);

  /**
   * Refresh data
   */
  const refresh = useCallback(async () => {
    if (enableHistory) {
      await loadDisposalHistory();
    }
  }, [enableHistory, loadDisposalHistory]);

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh && enableHistory && refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(() => {
        refresh();
      }, refreshInterval);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [autoRefresh, enableHistory, refreshInterval, refresh]);
  // Initial data loading (disabled for now since endpoint doesn't exist)
  // useEffect(() => {
  //   if (enableHistory) {
  //     loadDisposalHistory();
  //   }
  // }, [enableHistory, loadDisposalHistory]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Cleanup intervals
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }

      // Abort pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    // State
    loading,
    submitting,
    error,
    disposalRecords,
    disposalHistory,
    validationErrors,
    lastDisposal,
    summary,
    lastUpdated,

    // Functions
    recordDisposal,
    loadDisposalHistory,
    getDisposalById,
    validateDisposal,
    checkStockAvailability,
    clearError,
    reset,
    refresh,

    // Utilities
    generateReference: generateDisposalReference,
    getReasonText: getDisposalReasonText,
    getMethodText: getDisposalMethodText,

    // Constants
    DISPOSAL_REASONS,
    DISPOSAL_METHODS,

    // Computed properties
    hasError: !!error,
    hasValidationErrors: validationErrors.length > 0,
    isReady: !loading && !submitting,
    hasData: disposalRecords.length > 0 || disposalHistory.length > 0,
  };
};

export default useExportDestroy;
