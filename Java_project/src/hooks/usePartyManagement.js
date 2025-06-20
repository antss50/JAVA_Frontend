/**
 * usePartyManagement Hook
 * Custom React hook for managing party data and operations
 * Provides a reusable interface for party-related functionality
 */

import { useState, useEffect, useCallback, useRef } from "react";
import partyService from "../services/inventory-related/partyService.js";
import {
  validatePartyData,
  formatApiError,
  PARTY_TYPES,
  filterPartiesBySearch,
  sortParties,
  groupPartiesByType,
  hasUnsavedChanges,
  createEditableCopy,
} from "../utils/party/partyFormatter.js";

/**
 * Custom hook for party management
 * @param {Object} options - Configuration options
 * @returns {Object} Party management state and functions
 */
export const usePartyManagement = (options = {}) => {
  const {
    initialType = null,
    autoLoad = true,
    enableCache = true,
    enableOptimisticUpdates = true,
  } = options;

  // State management
  const [parties, setParties] = useState([]);
  const [filteredParties, setFilteredParties] = useState([]);
  const [selectedParty, setSelectedParty] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // Filter and search state
  const [selectedType, setSelectedType] = useState(initialType);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");

  // Statistics state
  const [statistics, setStatistics] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    byType: { CUSTOMER: 0, SUPPLIER: 0, EMPLOYEE: 0 },
  });

  // Operation state
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Refs for cleanup and optimistic updates
  const abortControllerRef = useRef(null);
  const optimisticUpdatesRef = useRef([]);

  /**
   * Handles API errors consistently
   */
  const handleError = useCallback((error, context = "") => {
    console.error(`Error in ${context}:`, error);
    const formattedError = formatApiError(error);
    setError(formattedError);

    // Handle authentication errors
    if (formattedError.requiresLogin) {
      // You might want to trigger a login redirect here
      // window.location.href = '/login';
    }

    return formattedError;
  }, []);

  /**
   * Clears error state
   */
  const clearError = useCallback(() => {
    setError(null);
    setValidationErrors({});
  }, []);

  /**
   * Loads parties based on current filters
   */
  const loadParties = useCallback(
    async (force = false) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      setLoading(true);
      clearError();

      try {
        let loadedParties;

        if (selectedType && selectedType !== "ALL") {
          loadedParties = await partyService.getPartiesByType(
            selectedType,
            enableCache && !force
          );
        } else {
          loadedParties = await partyService.getAllParties(
            enableCache && !force
          );
        }

        setParties(loadedParties || []);
      } catch (error) {
        if (error.name !== "AbortError") {
          handleError(error, "loadParties");
        }
      } finally {
        setLoading(false);
      }
    },
    [selectedType, enableCache, handleError, clearError]
  );

  /**
   * Loads a specific party by ID
   */
  const loadPartyById = useCallback(
    async (partyId, force = false) => {
      setLoading(true);
      clearError();

      try {
        const party = await partyService.getPartyById(
          partyId,
          enableCache && !force
        );
        setSelectedParty(party);
        return party;
      } catch (error) {
        handleError(error, "loadPartyById");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [enableCache, handleError, clearError]
  );

  /**
   * Creates a new party
   */
  const createParty = useCallback(
    async (partyData) => {
      // Validate data first
      const errors = validatePartyData(partyData);
      if (errors.length > 0) {
        setValidationErrors(errors);
        return { success: false, errors };
      }

      setIsCreating(true);
      clearError();

      // Optimistic update
      let optimisticParty = null;
      if (enableOptimisticUpdates) {
        optimisticParty = {
          id: `temp_${Date.now()}`,
          ...partyData,
          _isOptimistic: true,
        };
        setParties((prev) => [...prev, optimisticParty]);
        optimisticUpdatesRef.current.push(optimisticParty.id);
      }

      try {
        const createdParty = await partyService.createParty(partyData);

        if (enableOptimisticUpdates) {
          // Replace optimistic update with real data
          setParties((prev) =>
            prev.map((p) => (p.id === optimisticParty.id ? createdParty : p))
          );
          optimisticUpdatesRef.current = optimisticUpdatesRef.current.filter(
            (id) => id !== optimisticParty.id
          );
        } else {
          setParties((prev) => [...prev, createdParty]);
        }

        return { success: true, data: createdParty };
      } catch (error) {
        // Remove optimistic update on error
        if (enableOptimisticUpdates && optimisticParty) {
          setParties((prev) => prev.filter((p) => p.id !== optimisticParty.id));
          optimisticUpdatesRef.current = optimisticUpdatesRef.current.filter(
            (id) => id !== optimisticParty.id
          );
        }

        const formattedError = handleError(error, "createParty");
        return { success: false, error: formattedError };
      } finally {
        setIsCreating(false);
      }
    },
    [enableOptimisticUpdates, handleError, clearError]
  );

  /**
   * Updates an existing party
   */
  const updateParty = useCallback(
    async (partyId, partyData) => {
      // Validate data first
      const errors = validatePartyData(partyData);
      if (errors.length > 0) {
        setValidationErrors(errors);
        return { success: false, errors };
      }

      setIsUpdating(true);
      clearError();

      // Store original data for rollback
      const originalParty = parties.find((p) => p.id === partyId);

      // Optimistic update
      if (enableOptimisticUpdates && originalParty) {
        const optimisticParty = {
          ...originalParty,
          ...partyData,
          _isOptimistic: true,
        };
        setParties((prev) =>
          prev.map((p) => (p.id === partyId ? optimisticParty : p))
        );

        if (selectedParty && selectedParty.id === partyId) {
          setSelectedParty(optimisticParty);
        }
      }

      try {
        const updatedParty = await partyService.updateParty(partyId, partyData);

        setParties((prev) =>
          prev.map((p) => (p.id === partyId ? updatedParty : p))
        );

        if (selectedParty && selectedParty.id === partyId) {
          setSelectedParty(updatedParty);
        }

        return { success: true, data: updatedParty };
      } catch (error) {
        // Rollback optimistic update on error
        if (enableOptimisticUpdates && originalParty) {
          setParties((prev) =>
            prev.map((p) => (p.id === partyId ? originalParty : p))
          );

          if (selectedParty && selectedParty.id === partyId) {
            setSelectedParty(originalParty);
          }
        }

        const formattedError = handleError(error, "updateParty");
        return { success: false, error: formattedError };
      } finally {
        setIsUpdating(false);
      }
    },
    [parties, selectedParty, enableOptimisticUpdates, handleError, clearError]
  );

  /**
   * Deletes a party
   */
  const deleteParty = useCallback(
    async (partyId) => {
      setIsDeleting(true);
      clearError();

      // Store original data for rollback
      const originalParty = parties.find((p) => p.id === partyId);

      // Optimistic update
      if (enableOptimisticUpdates) {
        setParties((prev) => prev.filter((p) => p.id !== partyId));

        if (selectedParty && selectedParty.id === partyId) {
          setSelectedParty(null);
        }
      }

      try {
        await partyService.deleteParty(partyId);

        if (!enableOptimisticUpdates) {
          setParties((prev) => prev.filter((p) => p.id !== partyId));

          if (selectedParty && selectedParty.id === partyId) {
            setSelectedParty(null);
          }
        }

        return { success: true };
      } catch (error) {
        // Rollback optimistic update on error
        if (enableOptimisticUpdates && originalParty) {
          setParties((prev) =>
            [...prev, originalParty].sort((a, b) => a.id - b.id)
          );
        }

        const formattedError = handleError(error, "deleteParty");
        return { success: false, error: formattedError };
      } finally {
        setIsDeleting(false);
      }
    },
    [parties, selectedParty, enableOptimisticUpdates, handleError, clearError]
  );

  /**
   * Searches parties
   */
  const searchParties = useCallback(
    async (query, type = null) => {
      setLoading(true);
      clearError();

      try {
        const results = await partyService.searchParties(query, type);
        return results;
      } catch (error) {
        handleError(error, "searchParties");
        return [];
      } finally {
        setLoading(false);
      }
    },
    [handleError, clearError]
  );

  /**
   * Loads party statistics
   */
  const loadStatistics = useCallback(async () => {
    try {
      const stats = await partyService.getPartyStatistics();
      setStatistics(stats);
      return stats;
    } catch (error) {
      handleError(error, "loadStatistics");
      return null;
    }
  }, [handleError]);

  /**
   * Exports parties data
   */
  const exportParties = useCallback(
    async (format = "json", type = null) => {
      try {
        return await partyService.exportParties(format, type);
      } catch (error) {
        handleError(error, "exportParties");
        return null;
      }
    },
    [handleError]
  );

  /**
   * Batch operations
   */
  const batchOperations = {
    create: useCallback(
      async (partiesData) => {
        setLoading(true);
        try {
          return await partyService.createMultipleParties(partiesData);
        } catch (error) {
          handleError(error, "batchCreate");
          return [];
        } finally {
          setLoading(false);
        }
      },
      [handleError]
    ),

    update: useCallback(
      async (updates) => {
        setLoading(true);
        try {
          return await partyService.updateMultipleParties(updates);
        } catch (error) {
          handleError(error, "batchUpdate");
          return [];
        } finally {
          setLoading(false);
        }
      },
      [handleError]
    ),

    delete: useCallback(
      async (partyIds) => {
        setLoading(true);
        try {
          return await partyService.deleteMultipleParties(partyIds);
        } catch (error) {
          handleError(error, "batchDelete");
          return [];
        } finally {
          setLoading(false);
        }
      },
      [handleError]
    ),
  };

  /**
   * Utility functions
   */
  const utils = {
    validateParty: useCallback((partyData) => {
      const errors = validatePartyData(partyData);
      setValidationErrors(errors);
      return errors.length === 0;
    }, []),

    createEditableCopy: useCallback((party) => {
      return createEditableCopy(party);
    }, []),

    hasUnsavedChanges: useCallback((original, current) => {
      return hasUnsavedChanges(original, current);
    }, []),

    groupByType: useCallback(
      (partiesToGroup = parties) => {
        return groupPartiesByType(partiesToGroup);
      },
      [parties]
    ),

    refreshCache: useCallback(() => {
      partyService.invalidateCache();
    }, []),
  };

  // Effect for filtering and sorting parties
  useEffect(() => {
    let result = [...parties];

    // Apply search filter
    if (searchTerm) {
      result = filterPartiesBySearch(result, searchTerm);
    }

    // Apply sorting
    result = sortParties(result, sortField, sortDirection);

    setFilteredParties(result);
  }, [parties, searchTerm, sortField, sortDirection]);

  // Effect for loading statistics
  useEffect(() => {
    if (parties.length > 0) {
      const stats = {
        total: parties.length,
        active: parties.filter((p) => p.active).length,
        inactive: parties.filter((p) => !p.active).length,
        byType: {
          CUSTOMER: parties.filter((p) => p.partyType === PARTY_TYPES.CUSTOMER)
            .length,
          SUPPLIER: parties.filter((p) => p.partyType === PARTY_TYPES.SUPPLIER)
            .length,
          EMPLOYEE: parties.filter((p) => p.partyType === PARTY_TYPES.EMPLOYEE)
            .length,
        },
      };
      setStatistics(stats);
    }
  }, [parties]);

  // Effect for auto-loading parties
  useEffect(() => {
    if (autoLoad) {
      loadParties();
    }
  }, [autoLoad, loadParties]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Filter change handlers
  const handleTypeChange = useCallback(
    (type) => {
      setSelectedType(type);
      clearError();
    },
    [clearError]
  );

  const handleSearchChange = useCallback((term) => {
    setSearchTerm(term);
  }, []);

  const handleSortChange = useCallback((field, direction = "asc") => {
    setSortField(field);
    setSortDirection(direction);
  }, []);

  return {
    // Data state
    parties: filteredParties,
    allParties: parties,
    selectedParty,
    statistics,

    // UI state
    loading,
    error,
    validationErrors,
    isCreating,
    isUpdating,
    isDeleting,

    // Filter state
    selectedType,
    searchTerm,
    sortField,
    sortDirection,

    // CRUD operations
    loadParties,
    loadPartyById,
    createParty,
    updateParty,
    deleteParty,
    searchParties,

    // Selection management
    setSelectedParty,
    clearSelection: () => setSelectedParty(null),

    // Filter management
    setSelectedType: handleTypeChange,
    setSearchTerm: handleSearchChange,
    setSorting: handleSortChange,

    // Error management
    clearError,
    handleError,

    // Batch operations
    batchOperations,

    // Statistics and export
    loadStatistics,
    exportParties,

    // Utility functions
    utils,

    // Constants
    PARTY_TYPES,

    // Advanced features
    refresh: () => loadParties(true),
    invalidateCache: () => partyService.invalidateCache(),
  };
};

export default usePartyManagement;
