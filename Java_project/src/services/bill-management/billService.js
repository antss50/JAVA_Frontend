/**
 * Bill Management API Service
 *
 * This module provides functions to interact with the Bill Management and
 * Purchase Order APIs. It handles all HTTP requests and response processing.
 *
 * @module billService
 */

// API Base URLs
const BILL_API_BASE = "http://localhost:8080/api/ap/bills";
const PURCHASE_ORDER_API_BASE = "http://localhost:8080/api/ap/purchase-orders";

/**
 * Generic API request handler with error handling
 * @param {string} url - Request URL
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} API response
 */
const apiRequest = async (url, options = {}) => {
  const defaultOptions = {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options.headers,
    },
  };

  const config = { ...defaultOptions, ...options };

  try {
    const response = await fetch(url, config);

    // Handle different response types
    if (response.status === 204) {
      return { success: true, data: null };
    }

    const contentType = response.headers.get("content-type");
    let data;

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      throw new Error(
        data.message || data.error || `HTTP error! status: ${response.status}`
      );
    }

    return { success: true, data };
  } catch (error) {
    console.error("API Request Error:", error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred",
      status: error.status || 500,
    };
  }
};

// Bill Management API Functions

/**
 * Get paginated list of bills
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (0-based)
 * @param {number} params.size - Page size
 * @param {string} params.sort - Sort criteria (e.g., 'billDate,desc')
 * @returns {Promise<Object>} Paginated bills response
 */
export const getBills = async (params = {}) => {
  const { page = 0, size = 10, sort = "billDate,desc" } = params;
  const queryParams = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
    sort,
  });

  return apiRequest(`${BILL_API_BASE}?${queryParams}`);
};

/**
 * Get a specific bill by ID
 * @param {number} billId - Bill ID
 * @returns {Promise<Object>} Bill data
 */
export const getBillById = async (billId) => {
  if (!billId) {
    return { success: false, error: "Bill ID is required" };
  }

  return apiRequest(`${BILL_API_BASE}/${billId}`);
};

/**
 * Get a bill by bill number
 * @param {string} billNumber - Bill number
 * @returns {Promise<Object>} Bill data
 */
export const getBillByNumber = async (billNumber) => {
  if (!billNumber) {
    return { success: false, error: "Bill number is required" };
  }

  const encodedBillNumber = encodeURIComponent(billNumber);
  return apiRequest(`${BILL_API_BASE}/number/${encodedBillNumber}`);
};

/**
 * Get all overdue bills
 * @returns {Promise<Object>} Overdue bills array
 */
export const getOverdueBills = async () => {
  return apiRequest(`${BILL_API_BASE}/overdue`);
};

/**
 * Get total outstanding amount across all bills
 * @returns {Promise<Object>} Total outstanding amount
 */
export const getOutstandingAmount = async () => {
  return apiRequest(`${BILL_API_BASE}/outstanding-amount`);
};

/**
 * Create a new manual bill
 * @param {Object} billData - Bill creation data
 * @returns {Promise<Object>} Created bill data
 */
export const createBill = async (billData) => {
  if (!billData) {
    return { success: false, error: "Bill data is required" };
  }

  return apiRequest(BILL_API_BASE, {
    method: "POST",
    body: JSON.stringify(billData),
  });
};

/**
 * Update an existing bill
 * @param {number} billId - Bill ID
 * @param {Object} billData - Updated bill data
 * @returns {Promise<Object>} Updated bill data
 */
export const updateBill = async (billId, billData) => {
  if (!billId) {
    return { success: false, error: "Bill ID is required" };
  }
  if (!billData) {
    return { success: false, error: "Bill data is required" };
  }

  return apiRequest(`${BILL_API_BASE}/${billId}`, {
    method: "PUT",
    body: JSON.stringify(billData),
  });
};

/**
 * Make a payment on a bill
 * @param {number} billId - Bill ID
 * @param {number} amount - Payment amount
 * @returns {Promise<Object>} Updated bill data with payment
 */
export const makePayment = async (billId, amount) => {
  if (!billId) {
    return { success: false, error: "Bill ID is required" };
  }
  if (!amount || amount <= 0) {
    return { success: false, error: "Payment amount must be greater than 0" };
  }

  const queryParams = new URLSearchParams({
    amount: amount.toString(),
  });

  return apiRequest(`${BILL_API_BASE}/${billId}/pay?${queryParams}`, {
    method: "POST",
  });
};

/**
 * Delete a bill
 * @param {number} billId - Bill ID
 * @returns {Promise<Object>} Deletion result
 */
export const deleteBill = async (billId) => {
  if (!billId) {
    return { success: false, error: "Bill ID is required" };
  }

  return apiRequest(`${BILL_API_BASE}/${billId}`, {
    method: "DELETE",
  });
};

// Purchase Order API Functions

/**
 * Get low stock alerts for purchase order creation
 * @returns {Promise<Object>} Low stock alerts array
 */
export const getLowStockAlerts = async () => {
  return apiRequest(`${PURCHASE_ORDER_API_BASE}/low-stock-alerts`);
};

/**
 * Create a purchase order (which creates a bill in the system)
 * @param {Object} orderData - Purchase order data
 * @returns {Promise<Object>} Created purchase order/bill data
 */
export const createPurchaseOrder = async (orderData) => {
  if (!orderData) {
    return { success: false, error: "Order data is required" };
  }

  return apiRequest(PURCHASE_ORDER_API_BASE, {
    method: "POST",
    body: JSON.stringify(orderData),
  });
};

// Search and Filter Functions

/**
 * Search bills with advanced filters
 * @param {Object} filters - Search filters
 * @param {string} filters.billNumber - Bill number to search for
 * @param {string} filters.vendorName - Vendor name filter
 * @param {string} filters.status - Bill status filter
 * @param {string} filters.fromDate - Start date filter
 * @param {string} filters.toDate - End date filter
 * @param {Object} pagination - Pagination parameters
 * @returns {Promise<Object>} Filtered bills
 */
export const searchBills = async (filters = {}, pagination = {}) => {
  // If searching by bill number specifically, use the dedicated endpoint
  if (filters.billNumber && Object.keys(filters).length === 1) {
    return getBillByNumber(filters.billNumber);
  }

  // For other filters, we'll need to implement client-side filtering
  // or wait for backend implementation of advanced search
  const billsResponse = await getBills(pagination);

  if (!billsResponse.success) {
    return billsResponse;
  }

  let filteredBills = billsResponse.data.content || [];

  // Apply client-side filters
  if (filters.vendorName) {
    const vendorFilter = filters.vendorName.toLowerCase();
    filteredBills = filteredBills.filter((bill) =>
      bill.vendorName?.toLowerCase().includes(vendorFilter)
    );
  }

  if (filters.status) {
    filteredBills = filteredBills.filter(
      (bill) => bill.status === filters.status
    );
  }

  if (filters.fromDate) {
    filteredBills = filteredBills.filter(
      (bill) => new Date(bill.billDate) >= new Date(filters.fromDate)
    );
  }

  if (filters.toDate) {
    filteredBills = filteredBills.filter(
      (bill) => new Date(bill.billDate) <= new Date(filters.toDate)
    );
  }

  return {
    success: true,
    data: {
      ...billsResponse.data,
      content: filteredBills,
    },
  };
};

/**
 * Get bills summary statistics
 * @returns {Promise<Object>} Summary statistics
 */
export const getBillsSummary = async () => {
  try {
    const [outstandingResponse, overdueResponse] = await Promise.all([
      getOutstandingAmount(),
      getOverdueBills(),
    ]);

    if (!outstandingResponse.success || !overdueResponse.success) {
      return {
        success: false,
        error: "Failed to fetch summary data",
      };
    }

    const totalOutstanding = outstandingResponse.data || 0;
    const overdueBills = overdueResponse.data || [];
    const overdueCount = overdueBills.length;
    const overdueAmount = overdueBills.reduce(
      (sum, bill) => sum + (bill.totalAmount - bill.amountPaid),
      0
    );

    return {
      success: true,
      data: {
        totalOutstanding,
        overdueCount,
        overdueAmount,
        overdueBills,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: "Failed to calculate bills summary",
    };
  }
};

// Utility Functions

/**
 * Validate bill number format
 * @param {string} billNumber - Bill number to validate
 * @returns {boolean} True if valid format
 */
export const validateBillNumber = (billNumber) => {
  if (!billNumber) return false;
  // Assuming format like "PO-2025-000001" or "MANUAL-2025-001"
  const billNumberPattern = /^[A-Z]+-\d{4}-\d{3,6}$/;
  return billNumberPattern.test(billNumber);
};

/**
 * Generate suggested bill number
 * @param {string} type - Bill type ('PO' for purchase order, 'MANUAL' for manual)
 * @returns {string} Suggested bill number
 */
export const generateBillNumber = (type = "MANUAL") => {
  const currentYear = new Date().getFullYear();
  const timestamp = Date.now().toString().slice(-6);
  return `${type}-${currentYear}-${timestamp}`;
};

/**
 * Calculate remaining balance for a bill
 * @param {Object} bill - Bill object
 * @returns {number} Remaining balance
 */
export const calculateRemainingBalance = (bill) => {
  if (!bill) return 0;
  return (bill.totalAmount || 0) - (bill.amountPaid || 0);
};

/**
 * Check if bill is fully paid
 * @param {Object} bill - Bill object
 * @returns {boolean} True if fully paid
 */
export const isBillFullyPaid = (bill) => {
  if (!bill) return false;
  return calculateRemainingBalance(bill) <= 0;
};

/**
 * Get payment status for a bill
 * @param {Object} bill - Bill object
 * @returns {string} Payment status
 */
export const getPaymentStatus = (bill) => {
  if (!bill) return "UNKNOWN";

  const remaining = calculateRemainingBalance(bill);

  if (remaining <= 0) return "PAID";
  if (bill.amountPaid > 0) return "PARTIALLY_PAID";
  return "UNPAID";
};

// Export all functions for easy importing
export default {
  // Bill Management
  getBills,
  getBillById,
  getBillByNumber,
  getOverdueBills,
  getOutstandingAmount,
  createBill,
  updateBill,
  makePayment,
  deleteBill,

  // Purchase Orders
  getLowStockAlerts,
  createPurchaseOrder,

  // Search and Filters
  searchBills,
  getBillsSummary,

  // Utilities
  validateBillNumber,
  generateBillNumber,
  calculateRemainingBalance,
  isBillFullyPaid,
  getPaymentStatus,
};
