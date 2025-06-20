/**
 * Party Formatter Utilities
 * Handles data validation, transformation, and formatting for Party API operations
 */

/**
 * Party Types enum
 */
export const PARTY_TYPES = {
  CUSTOMER: "CUSTOMER",
  SUPPLIER: "SUPPLIER",
  EMPLOYEE: "EMPLOYEE",
};

/**
 * Default party data structure
 */
export const defaultPartyData = {
  name: "",
  email: "",
  phone: "",
  address: "",
  partyType: PARTY_TYPES.CUSTOMER,
  active: true,
};

/**
 * Validates party data according to API contracts
 * @param {Object} partyData - The party data to validate
 * @returns {Array} Array of validation errors (empty if valid)
 */
export const validatePartyData = (partyData) => {
  const errors = [];

  // Required fields validation
  if (!partyData.name || partyData.name.trim() === "") {
    errors.push({
      field: "name",
      message: "Name is required",
    });
  }

  if (partyData.name && partyData.name.length > 255) {
    errors.push({
      field: "name",
      message: "Name must not exceed 255 characters",
    });
  }

  if (!partyData.partyType) {
    errors.push({
      field: "partyType",
      message: "Party type is required",
    });
  }

  if (
    partyData.partyType &&
    !Object.values(PARTY_TYPES).includes(partyData.partyType)
  ) {
    errors.push({
      field: "partyType",
      message: "Party type must be CUSTOMER, SUPPLIER, or EMPLOYEE",
    });
  }

  // Optional field validations
  if (partyData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(partyData.email)) {
    errors.push({
      field: "email",
      message: "Email must be valid",
    });
  }

  if (partyData.email && partyData.email.length > 100) {
    errors.push({
      field: "email",
      message: "Email must not exceed 100 characters",
    });
  }

  if (partyData.phone && partyData.phone.length > 20) {
    errors.push({
      field: "phone",
      message: "Phone number must not exceed 20 characters",
    });
  }

  if (partyData.address && partyData.address.length > 200) {
    errors.push({
      field: "address",
      message: "Address must not exceed 200 characters",
    });
  }

  return errors;
};

/**
 * Formats party data for API request (removes empty optional fields)
 * @param {Object} partyData - Raw party data from form
 * @returns {Object} Formatted party data for API
 */
export const formatPartyForRequest = (partyData) => {
  const formatted = {
    name: partyData.name?.trim(),
    partyType: partyData.partyType,
    active: partyData.active ?? true,
  };

  // Only include optional fields if they have values
  if (partyData.email?.trim()) {
    formatted.email = partyData.email.trim();
  }

  if (partyData.phone?.trim()) {
    formatted.phone = partyData.phone.trim();
  }

  if (partyData.address?.trim()) {
    formatted.address = partyData.address.trim();
  }

  return formatted;
};

/**
 * Formats party data received from API for frontend use
 * @param {Object} apiPartyData - Party data from API response
 * @returns {Object} Formatted party data for frontend
 */
export const formatPartyFromResponse = (apiPartyData) => {
  if (!apiPartyData) return null;

  return {
    id: apiPartyData.id,
    name: apiPartyData.name || "",
    email: apiPartyData.email || "",
    phone: apiPartyData.phone || "",
    address: apiPartyData.address || "",
    partyType: apiPartyData.partyType || PARTY_TYPES.CUSTOMER,
    active: apiPartyData.active ?? true,
  };
};

/**
 * Formats validation errors for display
 * @param {Array} errors - Array of validation errors
 * @returns {Object} Formatted errors by field
 */
export const formatValidationErrors = (errors) => {
  const errorsByField = {};
  const generalErrors = [];

  errors.forEach((error) => {
    if (error.field) {
      if (!errorsByField[error.field]) {
        errorsByField[error.field] = [];
      }
      errorsByField[error.field].push(error.message);
    } else {
      generalErrors.push(error.message);
    }
  });

  return {
    byField: errorsByField,
    general: generalErrors,
    hasErrors: errors.length > 0,
  };
};

/**
 * Formats API error response for user display
 * @param {Error} error - Error object from API call
 * @returns {Object} Formatted error message
 */
export const formatApiError = (error) => {
  const defaultMessage = "An unexpected error occurred. Please try again.";

  if (!error) {
    return { message: defaultMessage, type: "error" };
  }

  const errorMessage = error.message || error.toString();

  // Handle specific HTTP error codes
  if (errorMessage.includes("401")) {
    return {
      message: "Authentication required. Please log in again.",
      type: "auth",
      requiresLogin: true,
    };
  }

  if (errorMessage.includes("403")) {
    return {
      message: "You do not have permission to perform this action.",
      type: "permission",
    };
  }

  if (errorMessage.includes("404")) {
    return {
      message: "The requested party was not found.",
      type: "notFound",
    };
  }

  if (errorMessage.includes("400")) {
    return {
      message: "Invalid data provided. Please check your input.",
      type: "validation",
    };
  }

  if (errorMessage.includes("409")) {
    return {
      message: "A party with similar details already exists.",
      type: "conflict",
    };
  }

  if (errorMessage.includes("500")) {
    return {
      message: "Server error. Please try again later.",
      type: "server",
    };
  }

  return {
    message: errorMessage.includes("fetch")
      ? "Network error. Please check your connection."
      : defaultMessage,
    type: "error",
  };
};

/**
 * Generates display text for party type
 * @param {string} partyType - Party type value
 * @returns {string} Human-readable party type
 */
export const getPartyTypeDisplay = (partyType) => {
  const typeMap = {
    [PARTY_TYPES.CUSTOMER]: "Customer",
    [PARTY_TYPES.SUPPLIER]: "Supplier",
    [PARTY_TYPES.EMPLOYEE]: "Employee",
  };

  return typeMap[partyType] || partyType;
};

/**
 * Generates party display name with type
 * @param {Object} party - Party object
 * @returns {string} Formatted display name
 */
export const getPartyDisplayName = (party) => {
  if (!party || !party.name) return "Unknown Party";

  const typeDisplay = getPartyTypeDisplay(party.partyType);
  return `${party.name} (${typeDisplay})`;
};

/**
 * Filters parties by search term
 * @param {Array} parties - Array of party objects
 * @param {string} searchTerm - Search term to filter by
 * @returns {Array} Filtered parties
 */
export const filterPartiesBySearch = (parties, searchTerm) => {
  if (!searchTerm || !searchTerm.trim()) return parties;

  const term = searchTerm.toLowerCase().trim();

  return parties.filter(
    (party) =>
      party.name?.toLowerCase().includes(term) ||
      party.email?.toLowerCase().includes(term) ||
      party.phone?.includes(term) ||
      party.address?.toLowerCase().includes(term) ||
      getPartyTypeDisplay(party.partyType).toLowerCase().includes(term)
  );
};

/**
 * Sorts parties by specified field and direction
 * @param {Array} parties - Array of party objects
 * @param {string} field - Field to sort by
 * @param {string} direction - Sort direction ('asc' or 'desc')
 * @returns {Array} Sorted parties
 */
export const sortParties = (parties, field = "name", direction = "asc") => {
  return [...parties].sort((a, b) => {
    let aValue = a[field] || "";
    let bValue = b[field] || "";

    // Handle different field types
    if (field === "active") {
      aValue = a.active ? 1 : 0;
      bValue = b.active ? 1 : 0;
    } else if (typeof aValue === "string") {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    let result = 0;
    if (aValue < bValue) result = -1;
    if (aValue > bValue) result = 1;

    return direction === "desc" ? -result : result;
  });
};

/**
 * Groups parties by type
 * @param {Array} parties - Array of party objects
 * @returns {Object} Parties grouped by type
 */
export const groupPartiesByType = (parties) => {
  const grouped = {
    [PARTY_TYPES.CUSTOMER]: [],
    [PARTY_TYPES.SUPPLIER]: [],
    [PARTY_TYPES.EMPLOYEE]: [],
  };

  parties.forEach((party) => {
    if (grouped[party.partyType]) {
      grouped[party.partyType].push(party);
    }
  });

  return grouped;
};

/**
 * Checks if party data has unsaved changes
 * @param {Object} originalData - Original party data
 * @param {Object} currentData - Current party data
 * @returns {boolean} True if there are unsaved changes
 */
export const hasUnsavedChanges = (originalData, currentData) => {
  if (!originalData && !currentData) return false;
  if (!originalData || !currentData) return true;

  const fields = ["name", "email", "phone", "address", "partyType", "active"];

  return fields.some((field) => {
    const original = originalData[field] || "";
    const current = currentData[field] || "";
    return original !== current;
  });
};

/**
 * Creates a copy of party data for editing
 * @param {Object} party - Original party data
 * @returns {Object} Copy of party data for editing
 */
export const createEditableCopy = (party) => {
  if (!party) return { ...defaultPartyData };

  return {
    id: party.id,
    name: party.name || "",
    email: party.email || "",
    phone: party.phone || "",
    address: party.address || "",
    partyType: party.partyType || PARTY_TYPES.CUSTOMER,
    active: party.active ?? true,
  };
};
