/**
 * Bill Management Data Formatter
 *
 * This module provides utility functions for formatting, validating, and transforming
 * data between the frontend and the Bill Management APIs.
 *
 * @module billFormatter
 */

/**
 * Formats a bill object for display in the UI
 * @param {Object} bill - Raw bill data from API
 * @returns {Object} Formatted bill data
 */
export const formatBillForDisplay = (bill) => {
  if (!bill) return null;

  return {
    ...bill,
    billDate: formatDateForDisplay(bill.billDate),
    dueDate: formatDateForDisplay(bill.dueDate),
    totalAmount: formatCurrency(bill.totalAmount),
    amountPaid: formatCurrency(bill.amountPaid),
    outstandingAmount: formatCurrency(bill.totalAmount - bill.amountPaid),
    isOverdue: isDateOverdue(bill.dueDate),
    statusBadge: getBillStatusBadge(bill.status),
    billLines: bill.billLines?.map(formatBillLineForDisplay) || [],
    payments: bill.payments?.map(formatPaymentForDisplay) || [],
  };
};

/**
 * Formats a bill line for display
 * @param {Object} line - Raw bill line data
 * @returns {Object} Formatted bill line
 */
export const formatBillLineForDisplay = (line) => {
  if (!line) return null;

  return {
    ...line,
    unitPrice: formatCurrency(line.unitPrice),
    lineTotal: formatCurrency(line.lineTotal),
    quantity: formatNumber(line.quantity),
  };
};

/**
 * Formats a payment record for display
 * @param {Object} payment - Raw payment data
 * @returns {Object} Formatted payment
 */
export const formatPaymentForDisplay = (payment) => {
  if (!payment) return null;

  return {
    ...payment,
    paymentDate: formatDateForDisplay(payment.paymentDate),
    amount: formatCurrency(payment.amount),
    paymentMethod: formatPaymentMethod(payment.paymentMethod),
  };
};

/**
 * Formats purchase order request data for API submission
 * @param {Object} orderData - Purchase order form data
 * @returns {Object} Formatted request body
 */
export const formatPurchaseOrderRequest = (orderData) => {
  if (!orderData) throw new Error("Order data is required");

  const formattedOrderLines = orderData.orderLines?.map((line) => ({
    productId: parseInt(line.productId),
    productName: line.productName?.trim(),
    description: line.description?.trim() || "",
    quantity: parseInt(line.quantity),
    unitPrice: parseFloat(line.unitPrice),
  }));

  return {
    partyId: parseInt(orderData.partyId),
    notes: orderData.notes?.trim() || "",
    orderLines: formattedOrderLines,
  };
};

/**
 * Formats manual bill creation request
 * @param {Object} billData - Bill form data
 * @returns {Object} Formatted request body
 */
export const formatBillRequest = (billData) => {
  if (!billData) throw new Error("Bill data is required");

  const billLines =
    billData.billLines?.map((line) => {
      const lineData = {
        productId:
          line.productId && line.productId.toString().trim() !== ""
            ? parseInt(line.productId)
            : null,
        description: line.description?.trim() || "",
        quantity: Math.max(1, parseInt(line.quantity) || 1),
        unitPrice: (
          Math.round((parseFloat(line.unitPrice) || 0) * 100) / 100
        ).toString(), // Send as string
        lineTotal: (
          Math.round(
            (parseFloat(line.unitPrice) || 0) *
              Math.max(1, parseInt(line.quantity) || 1) *
              100
          ) / 100
        ).toString(), // Calculate and send line total as string
      };

      // Include id for existing lines (for updates)
      if (line.id !== undefined && line.id !== null) {
        lineData.id = line.id;
      }

      return lineData;
    }) || [];

  // Calculate total amount
  const totalAmount = billLines.reduce((sum, line) => {
    return sum + parseFloat(line.lineTotal || 0);
  }, 0);

  return {
    billNumber: billData.billNumber?.trim(),
    partyId: parseInt(billData.partyId),
    vendorName: billData.vendorName?.trim() || "", // Add vendor name
    billDate: formatDateForAPI(billData.billDate),
    dueDate: formatDateForAPI(billData.dueDate),
    status: billData.status || "PENDING",
    totalAmount: totalAmount.toString(), // Send total as string
    amountPaid: "0", // New bills start with 0 amount paid
    notes: billData.notes?.trim() || "",
    billLines: billLines,
    payments: [], // New bills start with empty payments array
  };
};

/**
 * Formats payment request data
 * @param {number} billId - Bill ID
 * @param {number|string} amount - Payment amount
 * @returns {Object} Formatted payment data
 */
export const formatPaymentRequest = (billId, amount) => {
  return {
    billId: parseInt(billId),
    amount: parseFloat(amount),
  };
};

/**
 * Formats low stock alert data for display
 * @param {Array} alerts - Raw low stock alerts from API
 * @returns {Array} Formatted alerts
 */
export const formatLowStockAlertsForDisplay = (alerts) => {
  console.log("formatLowStockAlertsForDisplay - Input alerts:", alerts);
  console.log("formatLowStockAlertsForDisplay - Input type:", typeof alerts);
  console.log(
    "formatLowStockAlertsForDisplay - Is array?",
    Array.isArray(alerts)
  );

  if (!Array.isArray(alerts)) {
    console.log(
      "formatLowStockAlertsForDisplay - Returning empty array, input is not array"
    );
    return [];
  }

  const result = alerts.map((alert) => {
    // Parse numeric values safely
    const currentStock = parseFloat(alert.currentStock) || 0;
    const reorderLevel = parseFloat(alert.reorderLevel) || 0;
    const maxStock = parseFloat(alert.maxStock) || reorderLevel * 2; // Default to 2x reorder level
    const stockDeficit = Math.max(0, reorderLevel - currentStock);

    // Calculate suggested order quantity if not provided
    const suggestedOrderQuantity =
      parseFloat(alert.suggestedOrderQuantity) ||
      Math.max(stockDeficit, Math.ceil(reorderLevel * 0.5)); // At least the deficit or 50% of reorder level

    // Determine alert level based on stock situation
    let alertLevel = alert.alertLevel;
    if (!alertLevel) {
      if (currentStock <= 0) {
        alertLevel = "OUT_OF_STOCK";
      } else if (currentStock < reorderLevel * 0.5) {
        alertLevel = "CRITICAL";
      } else {
        alertLevel = "LOW";
      }
    }

    return {
      ...alert,
      // Keep original numeric values for calculations
      currentStock,
      reorderLevel,
      maxStock,
      suggestedOrderQuantity,
      // Add formatted display values
      currentStockDisplay: formatNumber(currentStock),
      reorderLevelDisplay: formatNumber(reorderLevel),
      maxStockDisplay: formatNumber(maxStock),
      suggestedOrderQuantityDisplay: formatNumber(suggestedOrderQuantity),
      lastUpdated: alert.lastUpdated
        ? formatDateTimeForDisplay(alert.lastUpdated)
        : "N/A",
      alertBadge: getAlertLevelBadge(alertLevel),
      alertLevel,
      stockDeficit,
    };
  });

  console.log("formatLowStockAlertsForDisplay - Formatted result:", result);
  return result;
};

/**
 * Calculates bill totals from line items
 * @param {Array} billLines - Array of bill line items
 * @returns {Object} Calculated totals
 */
export const calculateBillTotals = (billLines) => {
  if (!Array.isArray(billLines)) return { lineTotal: 0, totalAmount: 0 };

  const lineTotal = billLines.reduce((total, line) => {
    const quantity = parseFloat(line.quantity) || 0;
    const unitPrice = parseFloat(line.unitPrice) || 0;
    return total + quantity * unitPrice;
  }, 0);

  return {
    lineTotal,
    totalAmount: lineTotal, // Can be extended for taxes, discounts, etc.
  };
};

/**
 * Validates purchase order data before submission
 * @param {Object} orderData - Purchase order data
 * @returns {Object} Validation result
 */
export const validatePurchaseOrderData = (orderData) => {
  const errors = [];

  if (!orderData.partyId) {
    errors.push("Vendor is required");
  }

  if (!orderData.orderLines || orderData.orderLines.length === 0) {
    errors.push("At least one order line is required");
  }

  orderData.orderLines?.forEach((line, index) => {
    if (!line.productId) {
      errors.push(`Product is required for line ${index + 1}`);
    }
    if (!line.quantity || line.quantity <= 0) {
      errors.push(`Quantity must be greater than 0 for line ${index + 1}`);
    }
    if (!line.unitPrice || line.unitPrice <= 0) {
      errors.push(`Unit price must be greater than 0 for line ${index + 1}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validates bill data before submission
 * @param {Object} billData - Bill data
 * @returns {Object} Validation result
 */
export const validateBillData = (billData) => {
  const errors = [];

  if (!billData.billNumber?.trim()) {
    errors.push("Bill number is required");
  }

  if (!billData.partyId) {
    errors.push("Vendor is required");
  }

  // Validate partyId is a valid number
  if (
    billData.partyId &&
    (isNaN(parseInt(billData.partyId)) || parseInt(billData.partyId) <= 0)
  ) {
    errors.push("Invalid vendor ID");
  }

  if (!billData.billDate) {
    errors.push("Bill date is required");
  }

  if (!billData.dueDate) {
    errors.push("Due date is required");
  }

  if (
    billData.billDate &&
    billData.dueDate &&
    new Date(billData.dueDate) < new Date(billData.billDate)
  ) {
    errors.push("Due date must be after bill date");
  }

  // Validate bill lines
  if (billData.billLines && Array.isArray(billData.billLines)) {
    billData.billLines.forEach((line, index) => {
      if (
        line.productId &&
        (isNaN(parseInt(line.productId)) || parseInt(line.productId) <= 0)
      ) {
        errors.push(`Invalid product ID at line ${index + 1}`);
      }

      if (
        !line.quantity ||
        isNaN(parseInt(line.quantity)) ||
        parseInt(line.quantity) <= 0
      ) {
        errors.push(`Invalid quantity at line ${index + 1}`);
      }

      if (
        !line.unitPrice ||
        isNaN(parseFloat(line.unitPrice)) ||
        parseFloat(line.unitPrice) < 0
      ) {
        errors.push(`Invalid unit price at line ${index + 1}`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Utility Functions

/**
 * Formats currency values for display
 * @param {number|string} amount - Amount to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount) => {
  const numAmount = parseFloat(amount) || 0;
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(numAmount);
};

/**
 * Formats numbers for display
 * @param {number|string} value - Number to format
 * @returns {string} Formatted number string
 */
export const formatNumber = (value) => {
  const numValue = parseFloat(value) || 0;
  return new Intl.NumberFormat("en-US").format(numValue);
};

/**
 * Formats date for display (human-readable)
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
export const formatDateForDisplay = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/**
 * Formats datetime for display
 * @param {string} dateTimeString - ISO datetime string
 * @returns {string} Formatted datetime
 */
export const formatDateTimeForDisplay = (dateTimeString) => {
  if (!dateTimeString) return "";
  return new Date(dateTimeString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Formats date for API submission (YYYY-MM-DD)
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDateForAPI = (date) => {
  if (!date) return "";
  const dateObj = new Date(date);
  return dateObj.toISOString().split("T")[0];
};

/**
 * Checks if a date is overdue
 * @param {string} dueDate - Due date string
 * @returns {boolean} True if overdue
 */
export const isDateOverdue = (dueDate) => {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
};

/**
 * Gets status badge configuration for bills
 * @param {string} status - Bill status
 * @returns {Object} Badge configuration
 */
export const getBillStatusBadge = (status) => {
  const statusConfig = {
    PENDING: { class: "badge-warning", text: "Chờ xử lý", color: "#ffc107" },
    APPROVED: { class: "badge-success", text: "Đã duyệt", color: "#28a745" },
    PAID: { class: "badge-success", text: "Đã thanh toán", color: "#28a745" },
    PARTIALLY_PAID: {
      class: "badge-info",
      text: "Thanh toán một phần",
      color: "#17a2b8",
    },
    OVERDUE: { class: "badge-danger", text: "Quá hạn", color: "#dc3545" },
    CANCELLED: {
      class: "badge-secondary",
      text: "Đã hủy",
      color: "#6c757d",
    },
    APPLIED: {
      class: "badge-success",
      text: "Đã áp dụng",
      color: "#D3D3D3",
    },
  };
  return (
    statusConfig[status] || {
      class: "badge-secondary",
      text: status,
      color: "#6c757d",
    }
  );
};

/**
 * Gets alert level badge configuration
 * @param {string} alertLevel - Alert level
 * @returns {Object} Badge configuration
 */
export const getAlertLevelBadge = (alertLevel) => {
  const alertConfig = {
    LOW: { class: "badge-warning", text: "Low Stock", color: "#ffc107" },
    CRITICAL: { class: "badge-danger", text: "Critical", color: "#dc3545" },
    OUT_OF_STOCK: {
      class: "badge-danger",
      text: "Out of Stock",
      color: "#dc3545",
    },
  };
  return (
    alertConfig[alertLevel] || {
      class: "badge-secondary",
      text: alertLevel,
      color: "#6c757d",
    }
  );
};

/**
 * Formats payment method for display
 * @param {string} method - Payment method code
 * @returns {string} Formatted payment method
 */
export const formatPaymentMethod = (method) => {
  const methodMap = {
    CASH: "Cash",
    BANK_TRANSFER: "Bank Transfer",
    CHECK: "Check",
    CREDIT_CARD: "Credit Card",
    DEBIT_CARD: "Debit Card",
  };
  return methodMap[method] || method;
};

/**
 * Formats pagination info for display
 * @param {Object} paginationData - Pagination data from API
 * @returns {Object} Formatted pagination info
 */
export const formatPaginationInfo = (paginationData) => {
  if (
    !paginationData ||
    typeof paginationData.pageNumber !== "number" ||
    typeof paginationData.pageSize !== "number" ||
    typeof paginationData.totalElements !== "number" ||
    typeof paginationData.totalPages !== "number"
  ) {
    return {
      currentPage: 1,
      totalPages: 1,
      pageSize: 10,
      totalElements: 0,
      startRecord: 0,
      endRecord: 0,
      isFirst: true,
      isLast: true,
      displayText: "No records",
    };
  }

  let { pageNumber, pageSize, totalElements, totalPages, first, last } =
    paginationData;

  // Defensive: always at least 1 page
  if (!Number.isFinite(totalPages) || totalPages < 1) totalPages = 1;
  if (!Number.isFinite(pageNumber) || pageNumber < 0) pageNumber = 0;
  if (!Number.isFinite(pageSize) || pageSize < 1) pageSize = 10;
  if (!Number.isFinite(totalElements) || totalElements < 0) totalElements = 0;

  // Clamp current page to totalPages
  let currentPage = Math.min(pageNumber + 1, totalPages);

  let startRecord = 0;
  let endRecord = 0;
  if (totalElements > 0) {
    startRecord = pageNumber * pageSize + 1;
    endRecord = Math.min((pageNumber + 1) * pageSize, totalElements);
  }

  return {
    currentPage,
    totalPages,
    pageSize,
    totalElements,
    startRecord,
    endRecord,
    isFirst: first ?? currentPage === 1,
    isLast: last ?? currentPage === totalPages,
    displayText:
      totalElements === 0
        ? "No records"
        : `Showing ${startRecord}-${endRecord} of ${totalElements} records`,
  };
};
