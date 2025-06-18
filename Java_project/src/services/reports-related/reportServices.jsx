// src/services/reports-related/reportServices.jsx

import axios from "axios";

const API_BASE_URL = "http://localhost:8080/api/sales/reports/product-sales";

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const reportService = {
  // Get daily product sales report
  getDailyReport: async (reportDate) => {
    const response = await apiClient.get("/daily", {
      params: { reportDate },
    });
    console.log("[reportService] Raw daily report data:", response.data); // Log raw data after retrieval
    return response.data;
  },

  // Get product sales report for date range
  getDateRangeReport: async (startDate, endDate, reportPeriod = "CUSTOM") => {
    const response = await apiClient.get("/date-range", {
      params: { startDate, endDate, reportPeriod },
    });
    return response.data;
  },

  // Get weekly product sales report
  getWeeklyReport: async (weekStartDate) => {
    const response = await apiClient.get("/weekly", {
      params: { weekStartDate },
    });
    return response.data;
  },

  // Get monthly product sales report
  getMonthlyReport: async (year, month) => {
    const response = await apiClient.get("/monthly", {
      params: { year, month },
    });
    return response.data;
  },

  // Get quarterly product sales report
  getQuarterlyReport: async (year, quarter) => {
    const response = await apiClient.get("/quarterly", {
      params: { year, quarter },
    });
    return response.data;
  },

  // Get yearly product sales report
  getYearlyReport: async (year) => {
    const response = await apiClient.get("/yearly", {
      params: { year },
    });
    return response.data;
  },

  // Get paginated product sales reports
  getProductSalesReports: async (page = 0, size = 20, sort = "id,desc") => {
    const response = await apiClient.get("/", {
      params: { page, size, sort },
    });
    return response.data;
  },

  // Get top selling products
  getTopSellingProducts: async (startDate, endDate, limit = 10) => {
    const response = await apiClient.get("/top-selling", {
      params: { startDate, endDate, limit },
    });
    return response.data;
  },

  // Get category sales performance
  getCategorySalesPerformance: async (startDate, endDate) => {
    const response = await apiClient.get("/category-performance", {
      params: { startDate, endDate },
    });
    return response.data;
  },

  // Get product sales by category
  getProductSalesByCategory: async (categoryId, startDate, endDate) => {
    const response = await apiClient.get(`/category/${categoryId}`, {
      params: { startDate, endDate },
    });
    return response.data;
  },
};

export default reportService;
