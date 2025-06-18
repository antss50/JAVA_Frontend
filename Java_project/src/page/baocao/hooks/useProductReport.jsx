import { useState, useEffect, useCallback } from "react";
import reportService from "/src/services/reports-related/reportServices";
import {
  formatProductSalesReport,
  formatPaginatedReports,
  formatTopSellingProducts,
  formatCategorySalesPerformance,
  formatProductSalesByCategory,
  formatReportPeriod,
  calculatePercentageChange,
} from "/src/utils/reports-formatter/reportsFormatter";

/**
 * Custom hook for Product Sales Reports
 *
 * This hook provides a complete API for fetching and managing product sales reports
 * according to the backend API specification defined in request_format.md
 *
 * Supported API endpoints:
 * - GET /api/sales/reports/product-sales/daily
 * - GET /api/sales/reports/product-sales/weekly
 * - GET /api/sales/reports/product-sales/monthly
 * - GET /api/sales/reports/product-sales/quarterly
 * - GET /api/sales/reports/product-sales/yearly
 * - GET /api/sales/reports/product-sales/date-range
 * - GET /api/sales/reports/product-sales (paginated)
 * - GET /api/sales/reports/product-sales/top-selling
 * - GET /api/sales/reports/product-sales/category-performance
 * - GET /api/sales/reports/product-sales/category/{categoryId}
 *
 * All requests include proper validation according to API requirements:
 * - Dates must be in YYYY-MM-DD format
 * - Years must be between 2020-2050
 * - Months must be between 1-12
 * - Quarters must be between 1-4
 * - Limits must be between 1-100
 * - Category IDs must be positive integers
 * - Start dates must not be after end dates
 */

// ========== VALIDATION FUNCTIONS ==========
const validateDate = (date) => {
  if (!date) throw new Error("Date is required");
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    throw new Error("Date must be in YYYY-MM-DD format");
  }
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    throw new Error("Invalid date");
  }
  return true;
};

const validateYear = (year) => {
  if (!year) throw new Error("Year is required");
  if (!Number.isInteger(year) || year < 2020 || year > 2050) {
    throw new Error("Year must be an integer between 2020 and 2050");
  }
  return true;
};

const validateMonth = (month) => {
  if (!month) throw new Error("Month is required");
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error("Month must be an integer between 1 and 12");
  }
  return true;
};

const validateQuarter = (quarter) => {
  if (!quarter) throw new Error("Quarter is required");
  if (!Number.isInteger(quarter) || quarter < 1 || quarter > 4) {
    throw new Error("Quarter must be an integer between 1 and 4");
  }
  return true;
};

const validateLimit = (limit) => {
  if (limit && (!Number.isInteger(limit) || limit < 1 || limit > 100)) {
    throw new Error("Limit must be an integer between 1 and 100");
  }
  return true;
};

const validateCategoryId = (categoryId) => {
  if (!categoryId) throw new Error("Category ID is required");
  if (!Number.isInteger(Number(categoryId)) || Number(categoryId) <= 0) {
    throw new Error("Category ID must be a positive integer");
  }
  return true;
};

const validatePagination = (page, size) => {
  if (page && (!Number.isInteger(page) || page < 0)) {
    throw new Error("Page must be a non-negative integer");
  }
  if (size && (!Number.isInteger(size) || size < 1)) {
    throw new Error("Page size must be a positive integer");
  }
  return true;
};

const validateDateRange = (startDate, endDate) => {
  validateDate(startDate);
  validateDate(endDate);

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start > end) {
    throw new Error("Start date must be before or equal to end date");
  }
  return true;
};

const useProductReports = (initialConfig = {}) => {
  // ========== STATE MANAGEMENT ==========
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Report data states
  const [currentReport, setCurrentReport] = useState(null);
  const [reportsList, setReportsList] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [categoryPerformance, setCategoryPerformance] = useState([]);
  const [productsByCategory, setProductsByCategory] = useState([]);

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalElements: 0,
    pageSize: initialConfig.pageSize || 10,
  });

  // Filter states
  const [filters, setFilters] = useState({
    reportType: initialConfig.reportType || "daily",
    selectedDate:
      initialConfig.selectedDate || new Date().toISOString().split("T")[0],
    startDate:
      initialConfig.startDate ||
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
    endDate: initialConfig.endDate || new Date().toISOString().split("T")[0],
    selectedYear: initialConfig.selectedYear || new Date().getFullYear(),
    selectedMonth: initialConfig.selectedMonth || new Date().getMonth() + 1,
    selectedQuarter:
      initialConfig.selectedQuarter ||
      Math.ceil((new Date().getMonth() + 1) / 3),
    selectedWeekStart:
      initialConfig.selectedWeekStart || new Date().toISOString().split("T")[0],
    selectedCategory: initialConfig.selectedCategory || "",
    topProductsLimit: initialConfig.topProductsLimit || 10,
  });

  // ========== DATA FETCHING FUNCTIONS ==========
  const fetchCurrentReport = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let reportData = null;

      switch (filters.reportType) {
        case "daily":
          validateDate(filters.selectedDate);
          reportData = await reportService.getDailyReport(filters.selectedDate);
          console.log(
            "[useProductReports] Raw daily report data after retrieval:",
            reportData
          ); // Log raw data after retrieval
          break;
        case "weekly":
          validateDate(filters.selectedWeekStart);
          reportData = await reportService.getWeeklyReport(
            filters.selectedWeekStart
          );
          break;
        case "monthly":
          validateYear(filters.selectedYear);
          validateMonth(filters.selectedMonth);
          reportData = await reportService.getMonthlyReport(
            filters.selectedYear,
            filters.selectedMonth
          );
          break;
        case "quarterly":
          validateYear(filters.selectedYear);
          validateQuarter(filters.selectedQuarter);
          reportData = await reportService.getQuarterlyReport(
            filters.selectedYear,
            filters.selectedQuarter
          );
          break;
        case "yearly":
          validateYear(filters.selectedYear);
          reportData = await reportService.getYearlyReport(
            filters.selectedYear
          );
          break;
        case "dateRange":
          validateDateRange(filters.startDate, filters.endDate);
          reportData = await reportService.getDateRangeReport(
            filters.startDate,
            filters.endDate
          );
          break;
        default:
          throw new Error("Invalid report type");
      }

      const formattedReport = formatProductSalesReport(reportData);
      console.log(
        "[useProductReports] Formatted daily report data:",
        formattedReport
      ); // Log after formatting
      setCurrentReport(formattedReport);
      console.log(
        "[useProductReports] Data before setState (setCurrentReport):",
        formattedReport
      ); // Log before setState
    } catch (err) {
      setError(err.message || "Failed to fetch report");
      console.error("Error fetching current report:", err);
    } finally {
      setLoading(false);
    }
  }, [filters]);
  const fetchReportsList = useCallback(
    async (page = 0) => {
      setLoading(true);
      setError(null);

      try {
        validatePagination(page, pagination.pageSize);

        const response = await reportService.getProductSalesReports(
          page,
          pagination.pageSize,
          "reportDate,desc"
        );

        const formattedResponse = formatPaginatedReports(response);
        setReportsList(formattedResponse.content);
        setPagination(formattedResponse.pagination);
      } catch (err) {
        setError(err.message || "Failed to fetch reports list");
        console.error("Error fetching reports list:", err);
      } finally {
        setLoading(false);
      }
    },
    [pagination.pageSize]
  );
  const fetchTopProducts = useCallback(async () => {
    try {
      validateDateRange(filters.startDate, filters.endDate);
      validateLimit(filters.topProductsLimit);

      const data = await reportService.getTopSellingProducts(
        filters.startDate,
        filters.endDate,
        filters.topProductsLimit
      );
      const formattedData = formatTopSellingProducts(data);
      setTopProducts(formattedData);
    } catch (err) {
      console.error("Error fetching top products:", err);
      setError(err.message || "Failed to fetch top products");
    }
  }, [filters.startDate, filters.endDate, filters.topProductsLimit]);
  const fetchCategoryPerformance = useCallback(async () => {
    try {
      validateDateRange(filters.startDate, filters.endDate);

      const data = await reportService.getCategorySalesPerformance(
        filters.startDate,
        filters.endDate
      );
      const formattedData = formatCategorySalesPerformance(data);
      setCategoryPerformance(formattedData);
    } catch (err) {
      console.error("Error fetching category performance:", err);
      setError(err.message || "Failed to fetch category performance");
    }
  }, [filters.startDate, filters.endDate]);

  const fetchProductsByCategory = useCallback(
    async (categoryId) => {
      if (!categoryId) return;
      try {
        validateCategoryId(categoryId);
        validateDateRange(filters.startDate, filters.endDate);

        const data = await reportService.getProductSalesByCategory(
          categoryId,
          filters.startDate,
          filters.endDate
        );
        const formattedData = formatProductSalesByCategory(data);
        setProductsByCategory(formattedData);
      } catch (err) {
        console.error("Error fetching products by category:", err);
        setError(err.message || "Failed to fetch products by category");
      }
    },
    [filters.startDate, filters.endDate]
  );

  const fetchAnalyticsData = useCallback(async () => {
    await Promise.all([fetchTopProducts(), fetchCategoryPerformance()]);
  }, [fetchTopProducts, fetchCategoryPerformance]);

  // ========== ACTION FUNCTIONS ==========
  const updateFilters = useCallback((newFilters) => {
    // Validate new filter values before updating
    try {
      if (newFilters.selectedDate) validateDate(newFilters.selectedDate);
      if (newFilters.startDate) validateDate(newFilters.startDate);
      if (newFilters.endDate) validateDate(newFilters.endDate);
      if (newFilters.selectedWeekStart)
        validateDate(newFilters.selectedWeekStart);
      if (newFilters.selectedYear) validateYear(newFilters.selectedYear);
      if (newFilters.selectedMonth) validateMonth(newFilters.selectedMonth);
      if (newFilters.selectedQuarter)
        validateQuarter(newFilters.selectedQuarter);
      if (newFilters.topProductsLimit)
        validateLimit(newFilters.topProductsLimit);
      if (newFilters.selectedCategory)
        validateCategoryId(newFilters.selectedCategory);

      // If both startDate and endDate are being updated, validate the range
      if (newFilters.startDate && newFilters.endDate) {
        validateDateRange(newFilters.startDate, newFilters.endDate);
      }

      setFilters((prev) => ({
        ...prev,
        ...newFilters,
      }));
    } catch (err) {
      setError(err.message || "Invalid filter parameters");
      console.error("Error updating filters:", err);
    }
  }, []);

  const changePage = useCallback(
    (newPage) => {
      fetchReportsList(newPage - 1);
    },
    [fetchReportsList]
  );

  const refreshData = useCallback(() => {
    fetchCurrentReport();
  }, [fetchCurrentReport]);

  const generateReport = useCallback(
    async (reportType, params) => {
      updateFilters({
        reportType,
        ...params,
      });
    },
    [updateFilters]
  );

  // ========== UTILITY FUNCTIONS ==========

  const getFormattedPeriod = useCallback(() => {
    return formatReportPeriod(filters.reportType.toUpperCase());
  }, [filters.reportType]);

  const getReportSummary = useCallback(() => {
    if (!currentReport) return null;

    return {
      totalSales: currentReport.totalSales,
      totalQuantity: currentReport.totalQuantitySold,
      numberOfProducts: currentReport.numberOfProducts,
      topProduct: currentReport.topSellingProduct,
      period: getFormattedPeriod(),
      dateRange: `${currentReport.formattedStartDate} - ${currentReport.formattedEndDate}`,
    };
  }, [currentReport, getFormattedPeriod]);

  // ========== EFFECTS ==========

  useEffect(() => {
    fetchCurrentReport();
  }, [fetchCurrentReport]);

  useEffect(() => {
    if (filters.selectedCategory) {
      fetchProductsByCategory(filters.selectedCategory);
    }
  }, [filters.selectedCategory, fetchProductsByCategory]);

  // ========== RETURN API ==========
  return {
    // State
    loading,
    error,
    currentReport,
    reportsList,
    topProducts,
    categoryPerformance,
    productsByCategory,
    pagination,
    filters,

    // Actions
    updateFilters,
    changePage,
    refreshData,
    generateReport,
    fetchReportsList,
    fetchAnalyticsData,
    fetchProductsByCategory,

    // Utilities
    getFormattedPeriod,
    getReportSummary,

    // Computed
    isLoading: loading,
    hasError: !!error,
    hasData: !!currentReport,
  };
};

export default useProductReports;
