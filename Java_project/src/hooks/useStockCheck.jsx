// src/hooks/useStockCheck.jsx

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import stockCheckService from "/src/services/inventory-related/stock-check/stockCheckService";

/**
 * Custom hook for stock check operations
 * Handles all API integrations and state management for stock checking
 */
export const useStockCheck = () => {
  // State for all stock check results
  const [allStockCheckResults, setAllStockCheckResults] = useState([]);
  const [activeFilters, setActiveFilters] = useState({});
  // Unified free-text search across product name or reference code
  const [searchTerm, setSearchTerm] = useState("");
  
  // -----------------------------------------------------------------------------
  // STEP 1: non-text filters (date range, status, etc.)
  // -----------------------------------------------------------------------------
  const filteredResults = useMemo(() => {
    if (allStockCheckResults.length === 0) return [];
    
    try {
      // Create a deep copy of the results to avoid mutating the original
      let results = JSON.parse(JSON.stringify(allStockCheckResults));

      // Apply filters only if they exist in activeFilters
      // Return new array with new object references to ensure React detects changes
      return results.filter(item => {
        // Date range filter
        if (activeFilters.startDate && activeFilters.endDate) {
          const itemDate = new Date(item.checkTimestamp);
          const startDate = new Date(activeFilters.startDate);
          const endDate = new Date(activeFilters.endDate);
          endDate.setHours(23, 59, 59, 999);
          
          if (!(itemDate >= startDate && itemDate <= endDate)) {
            return false;
          }
        }


        // Status filter
        if (activeFilters.status && item.checkStatus !== activeFilters.status) {
          return false;
        }



        return true;
      });
    } catch (error) {
      console.error('Error filtering results:', error);
      return [];
    }
  }, [allStockCheckResults, activeFilters]);

  // State for grouped/summary view
  const [viewMode, setViewMode] = useState("grouped"); // 'detailed' or 'grouped'
  const [expandedSummaries, setExpandedSummaries] = useState(new Set());

  /**
   * Groups results by reference ID for the condensed view
   */
  const groupByRefId = useCallback((results) => {
    if (!Array.isArray(results)) return [];

    const grouped = {};

    results.forEach((result) => {
      if (!result) return;

      const reference = result.checkReference || "unknown";

      if (!grouped[reference]) {
        grouped[reference] = {
          referenceId: reference,
          checkTimestamp: result.checkTimestamp,
          checkedBy: result.checkedBy || "Unknown",
          totalItems: 0,
          itemsWithVariance: 0,
          items: [],
        };
      }

      grouped[reference].items.push(result);
      grouped[reference].totalItems++;

      if (result.status !== "MATCH") {
        grouped[reference].itemsWithVariance++;
      }
    });

    return Object.values(grouped);
  }, []);

  // -----------------------------------------------------------------------------
  // STEP 2: text search derived views
  // -----------------------------------------------------------------------------
  // Detailed list – filter individual rows by searchTerm (case-insensitive)
  const detailedResults = useMemo(() => {
    if (filteredResults.length === 0) return [];
    if (!searchTerm) return filteredResults;
    const term = searchTerm.toLowerCase();
    return filteredResults.filter((r) =>
      (r.productName || "").toLowerCase().includes(term) ||
      (r.checkReference || "").toLowerCase().includes(term)
    );
  }, [filteredResults, searchTerm]);

  // Group the base (non-text filtered) results once
  const rawSummaries = useMemo(
    () => groupByRefId(filteredResults),
    [filteredResults, groupByRefId]
  );

  // Displayed summaries – hide entire groups if none of their items match searchTerm
  const displayedSummaries = useMemo(() => {
    if (!searchTerm) return rawSummaries;
    const term = searchTerm.toLowerCase();
    return rawSummaries.filter((group) =>
      group.items.some(
        (item) =>
          (item.productName || "").toLowerCase().includes(term) ||
          (group.referenceId || "").toLowerCase().includes(term)
      )
    );
  }, [rawSummaries, searchTerm]);
  

  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsError, setResultsError] = useState(null);

  // Pagination state
  const [resultsPagination, setResultsPagination] = useState({
    page: 0,
    size: 20,
    totalItems: 0,
    totalPages: 1,
  });

  /**
   * Applies filters to the stock check results
   * Automatically refreshes when filters change or are cleared
   */
  const applyFilters = useCallback((filters = {}) => {
    setActiveFilters(prev => {
      const newFilters = { ...prev, ...filters };
      
      // If any filter is being cleared (empty string or undefined), remove it from active filters
      Object.keys(newFilters).forEach(key => {
        if (newFilters[key] === '' || newFilters[key] === undefined) {
          delete newFilters[key];
        }
      });
      
      return newFilters;
    });
    
    // Reset to first page when filters change
    setResultsPagination(prev => ({
      ...prev,
      page: 0
    }));
  }, []);

  /**
   * Clears all active filters
   */
  const clearFilters = useCallback(() => {
    setActiveFilters({});
  }, []);

  /**
   * Fetches all stock check results
   */
  const fetchAllStockCheckResults = useCallback(async (params = {}) => {
    try {
      setResultsLoading(true);
      setResultsError(null);

      // Fetch all results without pagination
      const response = await stockCheckService.getStockCheckResults({
        size: 1000, // Adjust based on expected maximum
        sort: "checkTimestamp,desc",
        ...params,
      });

      // The service already formats the response, so we can use it directly
      const results = response?.results || [];
      const paginationInfo = response?.pagination || {};

      setAllStockCheckResults(results);
      
      // Update pagination
      setResultsPagination((prev) => ({
        ...prev,
        totalItems: results.length,
        totalPages: Math.ceil(results.length / prev.size),
      }));
      
      // Grouped summaries are now handled by the memoized value below

      return { results, pagination: paginationInfo };
    } catch (err) {
      setResultsError("Failed to fetch stock check results");
      console.error("Error fetching stock check results:", err);
      throw err;
    } finally {
      setResultsLoading(false);
    }
  }, [viewMode, groupByRefId]);



  // Update pagination when filtered results change
  useEffect(() => {
    setResultsPagination(prev => ({
      ...prev,
      totalItems: filteredResults.length,
      totalPages: Math.ceil(filteredResults.length / prev.size)
    }));
  }, [filteredResults]);

  /**
   * Fetches stock check results with optional filters
   */
  const fetchStockCheckResults = useCallback(async (params = {}) => {
    try {
      setResultsLoading(true);
      setResultsError(null);

      // If we already have all results, just update the active filters
      if (allStockCheckResults.length > 0) {
        // Update active filters which will trigger the filteredResults recalculation
        if (Object.keys(params).length > 0) {
          setActiveFilters(prev => ({
            ...prev,
            ...params
          }));
        }
        
        // Return the current filtered results (they'll be updated by the useMemo)
        return {
          results: filteredResults,
          pagination: {
            totalItems: filteredResults.length,
            totalPages: Math.ceil(filteredResults.length / resultsPagination.size),
            currentPage: 1,
            pageSize: resultsPagination.size,
          },
        };
      }

      // If no results are loaded yet, fetch them
      return await fetchAllStockCheckResults(params);
    } catch (err) {
      setResultsError("Failed to fetch stock check results");
      console.error("Error fetching stock check results:", err);
      throw err;
    } finally {
      setResultsLoading(false);
    }
  }, [
    allStockCheckResults,
    fetchAllStockCheckResults,
    groupByRefId,
    resultsPagination.size,
    viewMode,
  ]);

  /**
   * Fetches results by date range
   */
  const fetchResultsByDateRange = useCallback(
    async (startDate, endDate, otherFilters = {}) => {
      return fetchStockCheckResults({
        startDate,
        endDate,
        ...otherFilters,
      });
    },
    [fetchStockCheckResults]
  );

  // Initial data fetch
  useEffect(() => {
    if (allStockCheckResults.length === 0) {
      fetchAllStockCheckResults();
    }
  }, [allStockCheckResults.length, fetchAllStockCheckResults]);

  // Update filtered results when active filters change
  useEffect(() => {
    if (allStockCheckResults.length > 0) {
      fetchStockCheckResults(activeFilters);
    }
  }, [activeFilters, allStockCheckResults, fetchStockCheckResults]);

  /**
   * Toggle view mode between grouped and detailed
   */
  // Toggle view mode between grouped and detailed; derived memoized views
  const switchViewMode = useCallback((mode) => {
    setViewMode(mode);
  }, []);

  /**
   * Toggle expansion of a summary row
   */
  const toggleSummaryExpansion = useCallback((referenceId) => {
    setExpandedSummaries((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(referenceId)) {
        newSet.delete(referenceId);
      } else {
        newSet.add(referenceId);
      }
      return newSet;
    });
  }, []);

  return {
    // State
    allStockCheckResults,
    filteredResults,
    searchTerm,
    setSearchTerm,

    stockCheckResults: viewMode === "grouped" ? [] : detailedResults,
    stockCheckSummaries: viewMode === "grouped" ? displayedSummaries : [],
    expandedSummaries,
    viewMode,

    // Loading states
    loading,
    resultsLoading,

    // Error states
    error,
    resultsError,

    // Pagination
    resultsPagination,

    // Operations
    fetchStockCheckResults,
    fetchResultsByDateRange,
    fetchAllStockCheckResults,
    applyFilters,
    clearFilters,

    // View mode management
    switchViewMode,
    toggleSummaryExpansion,
    groupByRefId,
  };
};

export default useStockCheck;
