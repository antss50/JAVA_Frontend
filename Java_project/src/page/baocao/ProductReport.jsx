import React, { useState } from "react";
import useProductReports from "../baocao/hooks/useProductReport";

const ProductReport = () => {
  // ========== CUSTOM HOOK ==========
  const {
    // State
    loading,
    error,
    currentReport,
    reportsList,
    topProducts,
    categoryPerformance,
    pagination,
    filters,

    // Actions
    updateFilters,
    changePage,
    refreshData,
    fetchReportsList,
    fetchAnalyticsData,

    // Utilities
    getFormattedPeriod,
    getReportSummary,

    // Computed
    isLoading,
    hasError,
    hasData,
  } = useProductReports({
    reportType: "daily",
    pageSize: 10,
  });

  // ========== LOCAL UI STATE ==========
  const [activeTab, setActiveTab] = useState("overview");
  const [formData, setFormData] = useState({
    reportType: filters.reportType,
    selectedDate: filters.selectedDate,
    startDate: filters.startDate,
    endDate: filters.endDate,
    selectedYear: filters.selectedYear,
    selectedMonth: filters.selectedMonth,
    selectedQuarter: filters.selectedQuarter,
    selectedWeekStart: filters.selectedWeekStart,
    topProductsLimit: filters.topProductsLimit,
  });

  // ========== VALIDATION HELPERS ==========
  const validateFormData = () => {
    const errors = [];

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    if (
      formData.reportType === "daily" &&
      !dateRegex.test(formData.selectedDate)
    ) {
      errors.push("Ngày phải có định dạng YYYY-MM-DD");
    }

    if (formData.reportType === "dateRange") {
      if (!dateRegex.test(formData.startDate)) {
        errors.push("Ngày bắt đầu phải có định dạng YYYY-MM-DD");
      }
      if (!dateRegex.test(formData.endDate)) {
        errors.push("Ngày kết thúc phải có định dạng YYYY-MM-DD");
      }
      if (new Date(formData.startDate) > new Date(formData.endDate)) {
        errors.push("Ngày bắt đầu không được sau ngày kết thúc");
      }
    }

    if (
      formData.reportType === "weekly" &&
      !dateRegex.test(formData.selectedWeekStart)
    ) {
      errors.push("Ngày bắt đầu tuần phải có định dạng YYYY-MM-DD");
    }

    if (["monthly", "quarterly", "yearly"].includes(formData.reportType)) {
      if (formData.selectedYear < 2020 || formData.selectedYear > 2050) {
        errors.push("Năm phải từ 2020 đến 2050");
      }
    }

    if (formData.reportType === "monthly") {
      if (formData.selectedMonth < 1 || formData.selectedMonth > 12) {
        errors.push("Tháng phải từ 1 đến 12");
      }
    }

    if (formData.reportType === "quarterly") {
      if (formData.selectedQuarter < 1 || formData.selectedQuarter > 4) {
        errors.push("Quý phải từ 1 đến 4");
      }
    }

    if (formData.topProductsLimit < 1 || formData.topProductsLimit > 100) {
      errors.push("Giới hạn sản phẩm phải từ 1 đến 100");
    }

    return errors;
  };

  // ========== EVENT HANDLERS ==========
  const handleTabChange = (tab) => {
    setActiveTab(tab);

    // Fetch data based on tab
    if (tab === "detailed") {
      fetchReportsList();
    } else if (tab === "analytics") {
      fetchAnalyticsData();
    }
  };

  const handleInputChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleApplyFilters = () => {
    const errors = validateFormData();

    if (errors.length > 0) {
      alert("Lỗi validation:\n" + errors.join("\n"));
      return;
    }

    // Apply filters to the hook
    updateFilters(formData);
  };

  const handleReportTypeChange = (reportType) => {
    setFormData((prev) => ({
      ...prev,
      reportType,
    }));
  };

  // ========== RENDER FILTER INPUTS ==========
  const renderFilterInputs = () => {
    return (
      <div className="filters-section">
        <h3>Bộ lọc báo cáo</h3>

        {/* Report Type Selection */}
        <div className="filter-group">
          <label>Loại báo cáo:</label>
          <select
            value={formData.reportType}
            onChange={(e) => handleReportTypeChange(e.target.value)}
          >
            <option value="daily">Hàng ngày</option>
            <option value="weekly">Hàng tuần</option>
            <option value="monthly">Hàng tháng</option>
            <option value="quarterly">Hàng quý</option>
            <option value="yearly">Hàng năm</option>
            <option value="dateRange">Khoảng thời gian</option>
          </select>
        </div>

        {/* Daily Report Inputs */}
        {formData.reportType === "daily" && (
          <div className="filter-group">
            <label>Ngày báo cáo:</label>
            <input
              type="date"
              value={formData.selectedDate}
              onChange={(e) =>
                handleInputChange("selectedDate", e.target.value)
              }
              required
            />
          </div>
        )}

        {/* Weekly Report Inputs */}
        {formData.reportType === "weekly" && (
          <div className="filter-group">
            <label>Ngày bắt đầu tuần (Thứ 2):</label>
            <input
              type="date"
              value={formData.selectedWeekStart}
              onChange={(e) =>
                handleInputChange("selectedWeekStart", e.target.value)
              }
              required
            />
          </div>
        )}

        {/* Monthly Report Inputs */}
        {formData.reportType === "monthly" && (
          <div className="filter-group">
            <label>Năm:</label>
            <input
              type="number"
              min="2020"
              max="2050"
              value={formData.selectedYear}
              onChange={(e) =>
                handleInputChange("selectedYear", parseInt(e.target.value))
              }
              required
            />
            <label>Tháng:</label>
            <select
              value={formData.selectedMonth}
              onChange={(e) =>
                handleInputChange("selectedMonth", parseInt(e.target.value))
              }
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  Tháng {i + 1}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Quarterly Report Inputs */}
        {formData.reportType === "quarterly" && (
          <div className="filter-group">
            <label>Năm:</label>
            <input
              type="number"
              min="2020"
              max="2050"
              value={formData.selectedYear}
              onChange={(e) =>
                handleInputChange("selectedYear", parseInt(e.target.value))
              }
              required
            />
            <label>Quý:</label>
            <select
              value={formData.selectedQuarter}
              onChange={(e) =>
                handleInputChange("selectedQuarter", parseInt(e.target.value))
              }
            >
              <option value={1}>Quý 1 (Q1)</option>
              <option value={2}>Quý 2 (Q2)</option>
              <option value={3}>Quý 3 (Q3)</option>
              <option value={4}>Quý 4 (Q4)</option>
            </select>
          </div>
        )}

        {/* Yearly Report Inputs */}
        {formData.reportType === "yearly" && (
          <div className="filter-group">
            <label>Năm:</label>
            <input
              type="number"
              min="2020"
              max="2050"
              value={formData.selectedYear}
              onChange={(e) =>
                handleInputChange("selectedYear", parseInt(e.target.value))
              }
              required
            />
          </div>
        )}

        {/* Date Range Report Inputs */}
        {formData.reportType === "dateRange" && (
          <div className="filter-group">
            <label>Từ ngày:</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => handleInputChange("startDate", e.target.value)}
              required
            />
            <label>Đến ngày:</label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => handleInputChange("endDate", e.target.value)}
              required
            />
          </div>
        )}

        {/* Analytics Settings (for Top Products) */}
        {activeTab === "analytics" && (
          <div className="filter-group">
            <label>Giới hạn sản phẩm bán chạy:</label>
            <input
              type="number"
              min="1"
              max="100"
              value={formData.topProductsLimit}
              onChange={(e) =>
                handleInputChange("topProductsLimit", parseInt(e.target.value))
              }
            />
          </div>
        )}

        {/* Apply Button */}
        <button
          className="apply-filters-btn"
          onClick={handleApplyFilters}
          disabled={isLoading}
        >
          {isLoading ? "Đang tải..." : "Áp dụng bộ lọc"}
        </button>
      </div>
    );
  };

  // ========== RENDER ==========
  return (
    <div className="full-container">
      <div className="product-report-container">
        <header className="report-header">
          <h1>Báo Cáo Hàng Hoá</h1>
          <div className="report-actions">
            <button onClick={refreshData} disabled={isLoading}>
              {isLoading ? "Đang tải..." : "Làm mới"}
            </button>
          </div>
        </header>

        {/* Error Display */}
        {hasError && (
          <div className="error-container">
            <p>Lỗi: {error}</p>
            <button onClick={refreshData}>Thử lại</button>
          </div>
        )}

        {/* Render Filter Inputs */}
        {renderFilterInputs()}

        {/* Current Filter Display */}
        <div className="current-filters">
          <p>
            <strong>Bộ lọc hiện tại:</strong> {getFormattedPeriod()}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button
            className={activeTab === "overview" ? "active" : ""}
            onClick={() => handleTabChange("overview")}
          >
            Tổng quan
          </button>
          <button
            className={activeTab === "detailed" ? "active" : ""}
            onClick={() => handleTabChange("detailed")}
          >
            Chi tiết
          </button>
          <button
            className={activeTab === "analytics" ? "active" : ""}
            onClick={() => handleTabChange("analytics")}
          >
            Phân tích
          </button>
        </div>

        {/* Content based on active tab */}
        <div className="tab-content">
          {activeTab === "overview" && (
            <div className="overview-tab">
              {isLoading ? (
                <div className="loading-spinner">
                  <p>Đang tải báo cáo...</p>
                </div>
              ) : hasData ? (
                <div className="report-summary">
                  <h3>Báo cáo {getFormattedPeriod()}</h3>
                  {(() => {
                    const summary = getReportSummary();
                    return summary ? (
                      <div className="summary-grid">
                        <div className="summary-item">
                          <label>Tổng doanh thu:</label>
                          <span className="value">
                            {summary.totalSales?.toLocaleString() || "N/A"} VND
                          </span>
                        </div>
                        <div className="summary-item">
                          <label>Tổng số lượng:</label>
                          <span className="value">
                            {summary.totalQuantity?.toLocaleString() || "N/A"}
                          </span>
                        </div>
                        <div className="summary-item">
                          <label>Số sản phẩm:</label>
                          <span className="value">
                            {summary.numberOfProducts || "N/A"}
                          </span>
                        </div>
                        <div className="summary-item">
                          <label>Sản phẩm bán chạy:</label>
                          <span className="value">
                            {summary.topProduct || "N/A"}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p>Không thể hiển thị thông tin tóm tắt</p>
                    );
                  })()}

                  {/* Product Sales Details */}
                  {currentReport?.productSalesDetails &&
                    currentReport.productSalesDetails.length > 0 && (
                      <div className="product-details">
                        <h4>Chi tiết bán hàng theo sản phẩm</h4>
                        <table className="product-table">
                          <thead>
                            <tr>
                              <th>Sản phẩm</th>
                              <th>Danh mục</th>
                              <th>Số lượng bán</th>
                              <th>Doanh thu</th>
                              <th>Giá trung bình</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentReport.productSalesDetails.map(
                              (product, index) => (
                                <tr key={index}>
                                  <td>{product.productName}</td>
                                  <td>{product.category}</td>
                                  <td>
                                    {product.quantitySold?.toLocaleString()}
                                  </td>
                                  <td>
                                    {product.totalRevenue?.toLocaleString()} VND
                                  </td>
                                  <td>
                                    {product.averagePrice?.toLocaleString()} VND
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                </div>
              ) : (
                <div className="no-data">
                  <p>Không có dữ liệu báo cáo cho bộ lọc hiện tại</p>
                  <p>Vui lòng chọn bộ lọc khác và nhấn "Áp dụng bộ lọc"</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "detailed" && (
            <div className="detailed-tab">
              <h3>Danh sách báo cáo chi tiết</h3>

              {reportsList.length > 0 ? (
                <>
                  <div className="reports-list">
                    {reportsList.map((report, index) => (
                      <div key={index} className="report-item">
                        <h4>
                          {report.reportPeriod} - {report.reportDate}
                        </h4>
                        <p>
                          Doanh thu: {report.totalSales?.toLocaleString()} VND
                        </p>
                        <p>
                          Số lượng: {report.totalQuantitySold?.toLocaleString()}
                        </p>
                        <p>Sản phẩm: {report.numberOfProducts}</p>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  <div className="pagination">
                    <button
                      onClick={() => changePage(pagination.currentPage - 1)}
                      disabled={pagination.currentPage === 1 || isLoading}
                    >
                      Trước
                    </button>
                    <span>
                      Trang {pagination.currentPage} / {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => changePage(pagination.currentPage + 1)}
                      disabled={
                        pagination.currentPage === pagination.totalPages ||
                        isLoading
                      }
                    >
                      Sau
                    </button>
                  </div>
                </>
              ) : (
                <p>Không có báo cáo nào. Nhấn "Làm mới" để tải dữ liệu.</p>
              )}
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="analytics-tab">
              <h3>Phân tích dữ liệu</h3>
              <div className="analytics-grid">
                <div className="top-products">
                  <h4>Sản phẩm bán chạy</h4>
                  {topProducts.length > 0 ? (
                    <table className="analytics-table">
                      <thead>
                        <tr>
                          <th>Sản phẩm</th>
                          <th>Số lượng</th>
                          <th>Doanh thu</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topProducts.map((product, index) => (
                          <tr key={index}>
                            <td>{product[0]}</td>
                            <td>{product[1]?.toLocaleString()}</td>
                            <td>{product[2]?.toLocaleString()} VND</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p>Không có dữ liệu sản phẩm bán chạy</p>
                  )}
                </div>

                <div className="category-performance">
                  <h4>Hiệu suất theo danh mục</h4>
                  {categoryPerformance.length > 0 ? (
                    <table className="analytics-table">
                      <thead>
                        <tr>
                          <th>Danh mục</th>
                          <th>Tổng số lượng</th>
                          <th>Tổng doanh thu</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categoryPerformance.map((category, index) => (
                          <tr key={index}>
                            <td>{category[0]}</td>
                            <td>{category[1]?.toLocaleString()}</td>
                            <td>{category[2]?.toLocaleString()} VND</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p>Không có dữ liệu hiệu suất danh mục</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductReport;
