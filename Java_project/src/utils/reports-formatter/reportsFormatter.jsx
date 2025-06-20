// src/utils/reports-formatter/reportsFormatter.jsx

/**
 * Formats a ProductSalesReportDto object for display
 * @param {Object} report - The raw report data from API
 * @returns {Object} Formatted report data
 */
export const formatProductSalesReport = (report) => {
  if (!report) return null;

  // Support both productSales and productSalesDetails
  const details = report.productSalesDetails || report.productSales || [];

  // Compute summary fields if missing
  const totalSales =
    report.totalSales != null
      ? report.totalSales
      : details.reduce(
          (sum, p) => sum + (p.totalSalesAmount || p.totalRevenue || 0),
          0
        );
  const totalQuantitySold =
    report.totalQuantitySold != null
      ? report.totalQuantitySold
      : details.reduce((sum, p) => sum + (p.quantitySold || 0), 0);
  const numberOfProducts =
    report.numberOfProducts != null ? report.numberOfProducts : details.length;
  const topSellingProduct =
    report.topSellingProduct ||
    (details.length > 0
      ? details.reduce(
          (top, p) =>
            (p.quantitySold || 0) > (top.quantitySold || 0) ? p : top,
          details[0]
        ).productName
      : undefined);

  return {
    ...report,
    totalSales: formatCurrency(totalSales),
    totalQuantitySold,
    numberOfProducts,
    topSellingProduct,
    formattedReportDate: formatDate(report.reportDate),
    formattedStartDate: formatDate(report.startDate),
    formattedEndDate: formatDate(report.endDate),
    formattedGeneratedAt: formatDateTime(report.generatedAt),
    productSalesDetails: details.map((product) => ({
      productId: product.productId,
      productName: product.productName,
      category: product.category || product.categoryName,
      quantitySold: product.quantitySold,
      totalRevenue: formatCurrency(
        product.totalSalesAmount || product.totalRevenue || 0
      ),
      averagePrice: formatCurrency(
        product.averageUnitPrice || product.averagePrice || 0
      ),
      orderCount: product.orderCount,
      salesPercentage: product.salesPercentage,
    })),
  };
};

/**
 * Formats paginated reports response
 * @param {Object} paginatedResponse - The paginated response from API
 * @returns {Object} Formatted paginated data
 */
export const formatPaginatedReports = (paginatedResponse) => {
  if (!paginatedResponse) return null;

  return {
    ...paginatedResponse,
    content: paginatedResponse.content?.map((report) =>
      formatProductSalesReport(report)
    ),
    pagination: {
      currentPage: paginatedResponse.number + 1, // Convert 0-based to 1-based
      totalPages: paginatedResponse.totalPages,
      totalElements: paginatedResponse.totalElements,
      pageSize: paginatedResponse.size,
      isFirst: paginatedResponse.first,
      isLast: paginatedResponse.last,
      hasNext: !paginatedResponse.last,
      hasPrevious: !paginatedResponse.first,
    },
  };
};

/**
 * Formats top selling products array for display
 * @param {Array} topProducts - Array of [productName, quantitySold, totalRevenue]
 * @returns {Array} Formatted top products data
 */
export const formatTopSellingProducts = (topProducts) => {
  if (!Array.isArray(topProducts)) return [];

  return topProducts.map(
    ([productName, quantitySold, totalRevenue], index) => ({
      rank: index + 1,
      productName,
      quantitySold: formatNumber(quantitySold),
      totalRevenue: formatCurrency(totalRevenue),
      rawQuantity: quantitySold,
      rawRevenue: totalRevenue,
    })
  );
};

/**
 * Formats category sales performance array for display
 * @param {Array} categoryData - Array of [categoryName, totalQuantity, totalRevenue]
 * @returns {Array} Formatted category performance data
 */
export const formatCategorySalesPerformance = (categoryData) => {
  if (!Array.isArray(categoryData)) return [];

  return categoryData.map(([categoryName, totalQuantity, totalRevenue]) => ({
    categoryName,
    totalQuantity: formatNumber(totalQuantity),
    totalRevenue: formatCurrency(totalRevenue),
    rawQuantity: totalQuantity,
    rawRevenue: totalRevenue,
    averageRevenuePerUnit:
      totalQuantity > 0
        ? formatCurrency(totalRevenue / totalQuantity)
        : formatCurrency(0),
  }));
};

/**
 * Formats product sales by category array for display
 * @param {Array} productData - Array of [productName, quantitySold, totalRevenue]
 * @returns {Array} Formatted product sales data
 */
export const formatProductSalesByCategory = (productData) => {
  if (!Array.isArray(productData)) return [];

  return productData.map(([productName, quantitySold, totalRevenue]) => ({
    productName,
    quantitySold: formatNumber(quantitySold),
    totalRevenue: formatCurrency(totalRevenue),
    rawQuantity: quantitySold,
    rawRevenue: totalRevenue,
    averagePrice:
      quantitySold > 0
        ? formatCurrency(totalRevenue / quantitySold)
        : formatCurrency(0),
  }));
};

/**
 * Formats report period for display
 * @param {string} period - Report period (DAILY, WEEKLY, etc.)
 * @returns {string} Human-readable period
 */
export const formatReportPeriod = (period) => {
  const periodMap = {
    DAILY: "Daily",
    WEEKLY: "Weekly",
    MONTHLY: "Monthly",
    QUARTERLY: "Quarterly",
    YEARLY: "Yearly",
    CUSTOM: "Custom Period",
  };
  return periodMap[period] || period;
};

/**
 * Helper function to format currency
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string
 */
const formatCurrency = (amount) => {
  if (amount == null) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

/**
 * Helper function to format numbers with commas
 * @param {number} number - The number to format
 * @returns {string} Formatted number string
 */
const formatNumber = (number) => {
  if (number == null) return "0";
  return new Intl.NumberFormat("vi-VN").format(number);
};

/**
 * Helper function to format date
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date string
 */
const formatDate = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/**
 * Helper function to format date and time
 * @param {string} dateTimeString - ISO datetime string
 * @returns {string} Formatted datetime string
 */
const formatDateTime = (dateTimeString) => {
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
 * Utility to calculate percentage change between two values
 * @param {number} current - Current value
 * @param {number} previous - Previous value
 * @returns {Object} Percentage change data
 */
export const calculatePercentageChange = (current, previous) => {
  if (previous === 0) {
    return {
      percentage: current > 0 ? 100 : 0,
      isIncrease: current > 0,
      formatted: current > 0 ? "+100%" : "0%",
    };
  }

  const change = ((current - previous) / previous) * 100;
  return {
    percentage: Math.abs(change),
    isIncrease: change > 0,
    formatted: `${change > 0 ? "+" : ""}${change.toFixed(1)}%`,
  };
};
