// 1. Daily Product Sales Report
const dailyReportRequest = {
  method: 'GET',
  endpoint: '/api/sales/reports/product-sales/daily',
  params: {
    reportDate: '2025-06-17' // Required: ISO date format (YYYY-MM-DD)
  },
  headers: {
    'Authorization': 'Bearer <token>' // Required for authentication
  }
};

// 2. Date Range Product Sales Report
const dateRangeReportRequest = {
  method: 'GET',
  endpoint: '/api/sales/reports/product-sales/date-range',
  params: {
    startDate: '2025-06-01',    // Required: ISO date format (YYYY-MM-DD)
    endDate: '2025-06-17',      // Required: ISO date format (YYYY-MM-DD)
    reportPeriod: 'CUSTOM'      // Optional: Default is 'CUSTOM'
  },
  headers: {
    'Authorization': 'Bearer <token>'
  }
};

// 3. Weekly Product Sales Report
const weeklyReportRequest = {
  method: 'GET',
  endpoint: '/api/sales/reports/product-sales/weekly',
  params: {
    weekStartDate: '2025-06-16' // Required: ISO date format (YYYY-MM-DD) - Monday of the week
  },
  headers: {
    'Authorization': 'Bearer <token>'
  }
};

// 4. Monthly Product Sales Report
const monthlyReportRequest = {
  method: 'GET',
  endpoint: '/api/sales/reports/product-sales/monthly',
  params: {
    year: 2025,  // Required: Integer between 2020-2050
    month: 6     // Required: Integer between 1-12
  },
  headers: {
    'Authorization': 'Bearer <token>'
  }
};

// 5. Quarterly Product Sales Report
const quarterlyReportRequest = {
  method: 'GET',
  endpoint: '/api/sales/reports/product-sales/quarterly',
  params: {
    year: 2025,    // Required: Integer between 2020-2050
    quarter: 2     // Required: Integer between 1-4
  },
  headers: {
    'Authorization': 'Bearer <token>'
  }
};

// 6. Yearly Product Sales Report
const yearlyReportRequest = {
  method: 'GET',
  endpoint: '/api/sales/reports/product-sales/yearly',
  params: {
    year: 2025 // Required: Integer between 2020-2050
  },
  headers: {
    'Authorization': 'Bearer <token>'
  }
};

// 7. Paginated Product Sales Reports
const paginatedReportsRequest = {
  method: 'GET',
  endpoint: '/api/sales/reports/product-sales',
  params: {
    page: 0,              // Optional: Page number (0-based)
    size: 20,             // Optional: Number of items per page
    sort: 'id,desc'       // Optional: Sort criteria (field,direction)
  },
  headers: {
    'Authorization': 'Bearer <token>'
  }
};

// 8. Top Selling Products
const topSellingProductsRequest = {
  method: 'GET',
  endpoint: '/api/sales/reports/product-sales/top-selling',
  params: {
    startDate: '2025-06-01',  // Required: ISO date format (YYYY-MM-DD)
    endDate: '2025-06-17',    // Required: ISO date format (YYYY-MM-DD)
    limit: 10                 // Optional: Integer between 1-100, default is 10
  },
  headers: {
    'Authorization': 'Bearer <token>'
  }
};

// 9. Category Sales Performance
const categorySalesPerformanceRequest = {
  method: 'GET',
  endpoint: '/api/sales/reports/product-sales/category-performance',
  params: {
    startDate: '2025-06-01',  // Required: ISO date format (YYYY-MM-DD)
    endDate: '2025-06-17'     // Required: ISO date format (YYYY-MM-DD)
  },
  headers: {
    'Authorization': 'Bearer <token>'
  }
};

// 10. Product Sales by Category
const productSalesByCategoryRequest = {
  method: 'GET',
  endpoint: '/api/sales/reports/product-sales/category/{categoryId}',
  pathParams: {
    categoryId: 123 // Required: Long - Category ID in URL path
  },
  params: {
    startDate: '2025-06-01',  // Required: ISO date format (YYYY-MM-DD)
    endDate: '2025-06-17'     // Required: ISO date format (YYYY-MM-DD)
  },
  headers: {
    'Authorization': 'Bearer <token>'
  }
};

##Validation 

const validationRules = {
  dates: {
    format: 'YYYY-MM-DD', // ISO date format required
    required: ['reportDate', 'startDate', 'endDate', 'weekStartDate']
  },
  year: {
    min: 2020,
    max: 2050,
    type: 'integer'
  },
  month: {
    min: 1,
    max: 12,
    type: 'integer'
  },
  quarter: {
    min: 1,
    max: 4,
    type: 'integer'
  },
  limit: {
    min: 1,
    max: 100,
    type: 'integer',
    default: 10
  },
  pagination: {
    page: {
      min: 0,
      type: 'integer',
      default: 0
    },
    size: {
      min: 1,
      type: 'integer',
      default: 20
    },
    sort: {
      format: 'field,direction', // e.g., 'id,desc'
      type: 'string'
    }
  },
  categoryId: {
    type: 'Long',
    required: true
  }
};