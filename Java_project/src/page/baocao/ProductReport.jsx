import React, { useState } from "react";
import useProductReports from "../baocao/hooks/useProductReport";
import './ProductReport.css';

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
    refreshData,

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
      <div className="filters-section d-flex gap-5">

        {/* Report Type Selection */}
        <div className="filter-group">
          <label>Loại báo cáo:</label>
          <select
            className="text-dark"
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
              className="text-dark"
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
              className="text-dark"
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
              className="text-dark me-3"
              onChange={(e) =>
                handleInputChange("selectedYear", parseInt(e.target.value))
              }
              required
            />
            <label>Tháng:</label>
            <select
              value={formData.selectedMonth}
              className="text-dark"
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
              className="text-dark me-3"
              onChange={(e) =>
                handleInputChange("selectedYear", parseInt(e.target.value))
              }
              required
            />
            <label>Quý:</label>
            <select
              value={formData.selectedQuarter}
              className="text-dark"
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
              className="text-dark"
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
              className="text-dark me-3"
              onChange={(e) => handleInputChange("startDate", e.target.value)}
              required
            />
            <label>Đến ngày:</label>
            <input
              type="date"
              value={formData.endDate}
              className="text-dark"
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
              className="text-dark"
              onChange={(e) =>
                handleInputChange("topProductsLimit", parseInt(e.target.value))
              }
            />
          </div>
        )}

        {/* Apply Button */}
        <button
          className="btn btn-success rounded-5 mb-3"
          onClick={handleApplyFilters}
          disabled={isLoading}
        >
          {isLoading ? "Đang tải..." : "Tìm Kiếm"}
        </button>
      </div>
    );
  };

  // ========== RENDER ==========
  return (
    <div className="full-container">
      <div className="product-report-container">
        <header className="report-header d-flex align-items-center justify-content-between">
          <div className="d-flex">
            <h1>Báo Cáo Hàng Hoá</h1>
            <div className="report-actions">
              <button onClick={refreshData} disabled={isLoading} className="bg-white text-black fs-2 p-0 ms-3">
                {isLoading ? "Đang tải..." : "↺"}
              </button>
            </div>
          </div>

          <div className="d-flex align-items-center">
            {renderFilterInputs()}
          </div>
        </header>

        {/* Error Display */}
        {hasError && (
          <div className="error-container">
            <p>Lỗi: {error}</p>
            <button onClick={refreshData}>Thử lại</button>
          </div>
        )}

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
                  {(() => {
                    const summary = getReportSummary();
                    return summary ? (
                      <div className="thong-ke-noi-dung mb-4">
                        <div className="item fs-5">
                          <label>Tổng doanh thu:</label>
                          <span className="value fw-bold ms-2">
                            {summary.totalSales?.toLocaleString() || "N/A"} VNĐ
                          </span>
                        </div>
                        <div className="item fs-5">
                          <label>Số sản phẩm:</label>
                          <span className="value fw-bold ms-2">
                            {summary.numberOfProducts || "0"}
                          </span>
                        </div>
                        <div className="item fs-5">
                          <label>Sản phẩm bán chạy:</label>
                          <span className="value fw-bold ms-2">
                            {summary.topProduct || "Không có"}
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
                        <h4 className="mb-4">Chi tiết bán hàng theo sản phẩm</h4>
                        <table className="table table-hover mb-0">
                          <thead className="table-primary text-center">
                            <tr>
                              <th>Tên sản phẩm</th>
                              <th>Danh mục</th>
                              <th>Số lượng bán</th>
                              <th>Doanh thu</th>
                              <th>Giá trung bình</th>
                            </tr>
                          </thead>
                          <tbody className="text-center">
                            {currentReport.productSalesDetails.map((product, index) => (
                              <tr key={index}>
                                <td className="fw-bold">{product.productName}</td>
                                <td>
                                  <span className="badge bg-light text-dark">
                                    {product.category || "Không rõ"}
                                  </span>
                                </td>
                                <td>{product.quantitySold?.toLocaleString() || 0}</td>
                                <td className="fw-bold text-success">
                                  {product.totalRevenue?.toLocaleString()} VNĐ
                                </td>
                                <td>{product.averagePrice?.toLocaleString()} VNĐ</td>
                              </tr>
                            ))}
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
        </div>
      </div>
    </div>
  );
};

export default ProductReport;
