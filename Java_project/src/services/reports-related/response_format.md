// ProductSalesReportDto response format (for most endpoints)
const productSalesReportResponse = {
  id: 1,
  reportDate: "2025-06-17",
  reportPeriod: "DAILY", // DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY, CUSTOM
  startDate: "2025-06-17",
  endDate: "2025-06-17",
  totalSales: 15000.50,
  totalQuantitySold: 250,
  numberOfProducts: 45,
  topSellingProduct: "Product Name",
  generatedBy: "username",
  generatedAt: "2025-06-17T10:30:00",
  productSalesDetails: [
    {
      productId: 1,
      productName: "Product A",
      category: "Category 1",
      quantitySold: 50,
      totalRevenue: 2500.00,
      averagePrice: 50.00
    }
    // ... more products
  ]
};

// Paginated response format (for getProductSalesReports)
const paginatedReportsResponse = {
  content: [
    // ... array of ProductSalesReportDto objects
  ],
  pageable: {
    sort: {
      empty: false,
      sorted: true,
      unsorted: false
    },
    offset: 0,
    pageSize: 20,
    pageNumber: 0,
    paged: true,
    unpaged: false
  },
  last: false,
  totalPages: 5,
  totalElements: 100,
  size: 20,
  number: 0,
  sort: {
    empty: false,
    sorted: true,
    unsorted: false
  },
  first: true,
  numberOfElements: 20,
  empty: false
};

// Top selling products response format
const topSellingProductsResponse = [
  ["Product Name", 150, 7500.00], // [productName, quantitySold, totalRevenue]
  ["Another Product", 120, 6000.00],
  // ... more products
];

// Category sales performance response format
const categorySalesPerformanceResponse = [
  ["Electronics", 500, 25000.00], // [categoryName, totalQuantity, totalRevenue]
  ["Clothing", 300, 15000.00],
  // ... more categories
];

// Product sales by category response format
const productSalesByCategoryResponse = [
  ["Product A", 50, 2500.00], // [productName, quantitySold, totalRevenue]
  ["Product B", 30, 1500.00],
  // ... more products in the category
];