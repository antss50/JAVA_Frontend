// src/page/hanghoa/stock-check/StockCheckManagement.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaSearch,
  FaFilter,
  FaPlus,
  FaEye,
  FaEdit,
  FaChevronDown,
  FaChevronRight,
  FaCheck,
  FaTimes,
  FaExclamationTriangle,
} from "react-icons/fa";
import useStockCheck from "../../../hooks/useStockCheck";
import { useStockLedger } from "../../../hooks/useStockLedger";
import "../product.css";

const StockCheckManagement = () => {
  const navigate = useNavigate();
  const {
    // State
    stockCheckResults,
    summary,
    unprocessedCount,
    searchTerm,
    setSearchTerm,

    // Grouped view state
    viewMode,
    stockCheckSummaries,
    expandedSummaries,

    // Loading states
    resultsLoading,
    loading,

    // Error states
    resultsError,
    error,

    // Pagination
    resultsPagination,

    // Operations
    fetchStockCheckResults,
    fetchResultsByStatus,
    fetchResultsByDateRange,
    fetchAllStockCheckResults,
    processVariance,
    exportToCSV,
    applyFilters,
    clearFilters,

    // View mode management
    switchViewMode,
    toggleSummaryExpansion,
  } = useStockCheck();

  // Stock ledger operations
  const { adjustStock } = useStockLedger();

  // =============================================================================
  // LOCAL STATE
  // =============================================================================

  const [searchText, setSearchText] = useState(searchTerm || "");
  const [dateFilter, setDateFilter] = useState({
    startDate: "",
    endDate: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Stock adjustment modal state
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [adjustmentItem, setAdjustmentItem] = useState(null);
  const [adjustmentLoading, setAdjustmentLoading] = useState(false);
  const [adjustmentData, setAdjustmentData] = useState({
    quantityChange: "",
    reason: "",
    reference: "",
  });

  // =============================================================================
  // HELPER FUNCTIONS
  // =============================================================================

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) {
      console.warn("formatDateTime received empty/null value:", dateTimeString);
      return "N/A";
    }

    try {
      const date = new Date(dateTimeString);
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.warn("Invalid datetime string:", dateTimeString);
        return "Invalid Date";
      }

      // Format as DD/MM/YYYY HH:mm
      return date.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch (error) {
      console.error(
        "Error formatting datetime:",
        error,
        "Input:",
        dateTimeString
      );
      return "Invalid Date";
    }
  };

  const formatDate = (dateTimeString) => {
    if (!dateTimeString) {
      console.warn("formatDate received empty/null value:", dateTimeString);
      return "N/A";
    }

    try {
      const date = new Date(dateTimeString);
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.warn("Invalid date string:", dateTimeString);
        return "Invalid Date";
      }

      // Format as DD/MM/YYYY
      return date.toLocaleDateString("vi-VN");
    } catch (error) {
      console.error("Error formatting date:", error, "Input:", dateTimeString);
      return "Invalid Date";
    }
  };

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  const handleSearch = () => {
    setCurrentPage(1);
    setSearchTerm(searchText.trim());
  };

  const handleClearFilters = async () => {
    setSearchText("");
    setSearchTerm("");
    setDateFilter({ startDate: "", endDate: "" });
    await clearFilters();
  };

  const handleDateRangeChange = async () => {
    if (dateFilter.startDate && dateFilter.endDate) {
      await fetchResultsByDateRange(dateFilter.startDate, dateFilter.endDate);
    }
  };

  const handleProcessVariance = async (resultId) => {
    try {
      const currentUser = localStorage.getItem("username") || "system";
      await processVariance(resultId, currentUser);
      alert("Variance processed successfully");
    } catch (err) {
      alert("Failed to process variance");
    }
  };

  const handlePageChange = async (page) => {
    setCurrentPage(page);
    await fetchStockCheckResults({ page: page - 1 });
  };

  const handleOpenAdjustmentModal = (item) => {
    setAdjustmentItem(item);
    // Pre-fill suggested adjustment based on variance
    const suggestedChange =
      item.checkStatus === "SHORTAGE"
        ? Math.abs(item.variance)
        : item.checkStatus === "OVERAGE"
          ? -Math.abs(item.variance)
          : 0;

    setAdjustmentData({
      quantityChange: suggestedChange.toString(),
      reason: `Stock adjustment for ${item.checkStatus.toLowerCase()} found during stock check`,
      reference: `Stock Check - ${item.productName}`,
    });
    setShowAdjustmentModal(true);
  };

  const handleCloseAdjustmentModal = () => {
    if (adjustmentLoading) return; // Prevent closing while processing

    setShowAdjustmentModal(false);
    setAdjustmentItem(null);
    setAdjustmentLoading(false);
    setAdjustmentData({
      quantityChange: "",
      reason: "",
      reference: "",
    });
  };

  const handleAdjustmentSubmit = async (e) => {
    e.preventDefault();

    if (
      !adjustmentItem ||
      !adjustmentData.quantityChange ||
      !adjustmentData.reason
    ) {
      alert("Please fill in all required fields");
      return;
    }

    setAdjustmentLoading(true);

    try {
      const adjustmentPayload = {
        productId: adjustmentItem.productId || adjustmentItem.id, // Handle different ID formats
        quantityChange: parseFloat(adjustmentData.quantityChange),
        reason: adjustmentData.reason,
        reference: adjustmentData.reference,
      };

      // Make the adjustment
      const result = await adjustStock(adjustmentPayload);

      // Show success message with details
      alert(
        `Stock adjustment completed successfully!\n\nProduct: ${adjustmentItem.productName
        }\nAdjustment: ${adjustmentData.quantityChange}\nMovement Type: ${result?.movementType || "ADJUSTMENT"
        }`
      );

      handleCloseAdjustmentModal();

      // Optimistically update the item status in the UI
      // Since we've successfully adjusted the stock, this item should now show as "MATCH"
      // We'll refresh the data to get the actual updated values from the server
      setTimeout(async () => {
        try {
          await fetchAllStockCheckResults();
        } catch (refreshError) {
          console.warn(
            "Failed to refresh data after stock adjustment:",
            refreshError
          );
          // Even if refresh fails, the adjustment was successful
        }
      }, 500); // Small delay to allow backend to process
    } catch (error) {
      console.error("Stock adjustment failed:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Unknown error occurred";
      alert(`Failed to adjust stock: ${errorMessage}`);
    } finally {
      setAdjustmentLoading(false);
    }
  };

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  const renderSearchSection = () => (
    <div className="kiemkho-search-box">
      <h4>Tìm kiếm</h4>
      <div className="search-inputs">
        <input
          type="text"
          placeholder="Nhập mã phiếu hoặc tên hàng"
          className="kiemkho-input"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSearch()}
        />
        <button onClick={handleSearch} className="search-btn">
          <FaSearch /> Tìm kiếm
        </button>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="filter-btn"
        >
          <FaFilter /> Bộ lọc
        </button>
      </div>

      {showFilters && (
        <div className="filters-section">
          <div className="filter-row">
            <input
              type="date"
              value={dateFilter.startDate}
              onChange={(e) =>
                setDateFilter((prev) => ({
                  ...prev,
                  startDate: e.target.value,
                }))
              }
              className="filter-input"
            />

            <input
              type="date"
              value={dateFilter.endDate}
              onChange={(e) =>
                setDateFilter((prev) => ({
                  ...prev,
                  endDate: e.target.value,
                }))
              }
              className="filter-input"
            />

            <button
              onClick={handleDateRangeChange}
              className="apply-filter-btn"
            >
              Áp dụng
            </button>

            <button onClick={handleClearFilters} className="clear-filter-btn">
              Xóa bộ lọc
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderSummaryStats = () => {
    if (!summary) return null;

    return (
      <div className="summary-stats">
        <div className="stats-cards">
          <div className="stat-card">
            <h4>Tổng số lần kiểm</h4>
            <p className="stat-number">{summary.totalChecks}</p>
          </div>
          <div className="stat-card">
            <h4>Có chênh lệch</h4>
            <p className="stat-number error">{summary.checksWithVariance}</p>
          </div>
          {/* <div className="stat-card">
            <h4>Tỷ lệ chính xác</h4>
            <p className="stat-number success">{summary.accuracyRate}</p>
          </div> */}
          <div className="stat-card">
            <h4>Chờ xử lý</h4>
            <p className="stat-number warning">{unprocessedCount}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderTableHeader = () => (
    <div className="kiemkho-header">
      <h2 className="kiemkho-title">QUẢN LÝ KIỂM KHO</h2>
      <div className="header-actions">
        <button
          className="kiemkho-button"
          onClick={() => navigate("/hang-hoa/kiem-kho-moi")}
        >
          <FaPlus /> Kiểm kho mới
        </button>
      </div>
    </div>
  );

  const renderStockCheckTable = () => (
    <table className="table table-hover mb-0">
      <thead className="table-light text-center">
        <tr>
          <th>Mã kiểm kho</th>
          <th>Tên sản phẩm</th>
          <th>Thời gian</th>
          <th>Tồn kho</th>
          <th>Thực tế</th>
          <th>Chênh lệch</th>
          <th>Trạng thái</th>
          <th>Người kiểm</th>
          <th>Thao tác</th>
        </tr>
      </thead>
      <tbody className="text-center align-middle">
        {stockCheckResults.length === 0 ? (
          <tr>
            <td colSpan="9" className="text-muted">
              {resultsLoading ? "Đang tải..." : "Không có dữ liệu"}
            </td>
          </tr>
        ) : (
          stockCheckResults.map((result, index) => {
            return (
              <tr key={result.checkResultId || result.productId || index}>
                <td>
                  <span className="badge bg-secondary">{result.checkReference}</span>
                </td>
                <td className="fw-bold">{result.productName}</td>
                <td>{formatDateTime(result.checkDate || result.checkTimestamp)}</td>
                <td>{result.expectedQuantity}</td>
                <td>{result.actualQuantity}</td>
                <td className={result.hasVariance ? "text-danger fw-bold" : "text-success"}>
                  {result.variance}
                  {result.variancePercentage &&
                    ` (${result.variancePercentage})`}
                </td>
                <td>
                  <span
                    className={`badge ${result.statusColor === "success"
                        ? "bg-success"
                        : result.statusColor === "warning"
                          ? "bg-warning text-dark"
                          : "bg-danger"
                      }`}
                  >
                    {result.statusLabel}
                  </span>
                  {result.requiresAttention && (
                    <span className="badge bg-danger ms-2">Cần xử lý</span>
                  )}
                </td>
                <td>{result.checkedBy || "N/A"}</td>
                <td>
                  <div className="d-flex justify-content-center gap-2">
                    <button
                      className="btn btn-sm btn-info text-white"
                      onClick={() =>
                        navigate(`/hang-hoa/kiem-kho/${result.checkResultId}`)
                      }
                      title="Xem chi tiết"
                    >
                      <FaEye />
                    </button>
                    {result.requiresAttention && (
                      <button
                        className="btn btn-sm btn-warning text-dark"
                        onClick={() =>
                          handleProcessVariance(result.checkResultId)
                        }
                        title="Xử lý chênh lệch"
                      >
                        <FaEdit />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>

  );

  // Render grouped summary table with expand/collapse
  const renderGroupedStockCheckTable = () => (
    <table className="table table-hover mb-0 text-center">
      <thead className="table-light">
        <tr>
          <th>Mã kiểm kho</th>
          <th>Ngày kiểm</th>
          <th>Người kiểm</th>
          <th>Tổng SP</th>
          <th>Có chênh lệch</th>
          <th>Trạng thái</th>
          <th>Thao tác</th>
        </tr>
      </thead>
      <tbody>
        {stockCheckSummaries.length === 0 ? (
          <tr>
            <td colSpan="8" className="text-muted">
              {resultsLoading ? "Đang tải..." : "Không có dữ liệu"}
            </td>
          </tr>
        ) : (
          stockCheckSummaries.map((summary, index) => {
            const isExpanded = expandedSummaries.has(summary.referenceId);
            return (
              <React.Fragment key={`summary-${summary.referenceId || index}`}>
                <tr
                  className={`align-middle fw-medium ${isExpanded ? "table-active" : ""
                    }`}
                >
                  <td>
                    <span className="badge bg-secondary">
                      {summary.referenceId || "N/A"}
                    </span>
                  </td>
                  <td>{formatDate(summary.checkTimestamp)}</td>
                  <td>{summary.checkedBy || "N/A"}</td>
                  <td>{summary.totalItems || 0}</td>
                  <td className={summary.itemsWithVariance > 0 ? "text-warning fw-bold" : ""}>
                    {summary.itemsWithVariance || 0}
                  </td>
                  <td>
                    <span
                      className={`badge ${summary.itemsWithVariance > 0 ? "bg-warning text-dark" : "bg-success"
                        }`}
                    >
                      {summary.itemsWithVariance > 0 ? "Có chênh lệch" : "Đã khớp"}
                    </span>
                    {summary.itemsWithVariance > 0 && (
                      <span className="badge bg-danger ms-2">Cần xử lý</span>
                    )}
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => toggleSummaryExpansion(summary.referenceId)}
                    >
                      <FaEye /> {isExpanded ? "Ẩn" : "Xem"}
                    </button>
                  </td>
                </tr>

                {isExpanded &&
                  summary.items?.map((item, itemIndex) => (
                    <tr
                      key={`detail-${item.id || itemIndex}`}
                      className="table-borderless bg-light text-start"
                    >
                      <td colSpan={2} className="ps-4">
                        <strong>{item.productName || "Sản phẩm không xác định"}</strong>
                      </td>
                      <td>SL dự kiến: {item.expectedQuantity}</td>
                      <td>SL thực tế: {item.actualQuantity}</td>
                      <td colSpan={2}>
                        Chênh lệch:{" "}
                        <span
                          className={`fw-bold ${item.variance !== 0 ? "text-danger" : "text-success"
                            }`}
                        >
                          {item.variance > 0 ? `+${item.variance}` : item.variance}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${item.checkStatus === "MATCH"
                            ? "bg-success"
                            : item.checkStatus === "OVERAGE"
                              ? "bg-warning text-dark"
                              : "bg-danger"
                            }`}
                        >
                          {item.checkStatus === "MATCH"
                            ? "Khớp"
                            : item.checkStatus === "OVERAGE"
                              ? "Thừa"
                              : "Thiếu"}
                        </span>
                      </td>
                    </tr>
                  ))}
              </React.Fragment>
            );
          })
        )}
      </tbody>
    </table>

  );

  const renderPagination = () => {
    if (!resultsPagination || resultsPagination.totalPages <= 1) return null;

    const {
      currentPage: page,
      totalPages,
      hasNext,
      hasPrevious,
    } = resultsPagination;

    return (
      <div className="pagination">
        <button
          onClick={() => handlePageChange(page - 1)}
          disabled={!hasPrevious || resultsLoading}
          className="pagination-btn"
        >
          Trước
        </button>

        <span className="pagination-info">
          Trang {page} / {totalPages}
        </span>

        <button
          onClick={() => handlePageChange(page + 1)}
          disabled={!hasNext || resultsLoading}
          className="pagination-btn"
        >
          Sau
        </button>
      </div>
    );
  };

  // Stock Adjustment Modal
  const renderAdjustmentModal = () => {
    if (!showAdjustmentModal || !adjustmentItem) return null;

    return (
      <div
        className="modal-overlay"
        onClick={adjustmentLoading ? undefined : handleCloseAdjustmentModal}
      >
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Điều chỉnh tồn kho</h3>
            <button
              className="close-btn"
              onClick={handleCloseAdjustmentModal}
              disabled={adjustmentLoading}
            >
              <FaTimes />
            </button>
          </div>

          <div className="modal-body">
            <div className="product-info">
              <h4>{adjustmentItem.productName}</h4>
              <p>
                <strong>Trạng thái:</strong>
                <span
                  className={`status-badge ${adjustmentItem.checkStatus === "OVERAGE"
                    ? "warning"
                    : "error"
                    }`}
                >
                  {adjustmentItem.checkStatus === "OVERAGE" ? "Thừa" : "Thiếu"}
                </span>
              </p>
              <p>
                <strong>Tồn kho dự kiến:</strong>{" "}
                {adjustmentItem.expectedQuantity}
              </p>
              <p>
                <strong>Tồn kho thực tế:</strong>{" "}
                {adjustmentItem.actualQuantity}
              </p>
              <p>
                <strong>Chênh lệch:</strong>
                <span className="variance">
                  {adjustmentItem.variance > 0
                    ? `+${adjustmentItem.variance}`
                    : adjustmentItem.variance}
                </span>
              </p>
            </div>

            <form onSubmit={handleAdjustmentSubmit}>
              <div className="form-group">
                <label htmlFor="quantityChange">Số lượng điều chỉnh *</label>
                <input
                  type="number"
                  id="quantityChange"
                  value={adjustmentData.quantityChange}
                  onChange={(e) =>
                    setAdjustmentData((prev) => ({
                      ...prev,
                      quantityChange: e.target.value,
                    }))
                  }
                  placeholder="Nhập số lượng (dương: tăng, âm: giảm)"
                  disabled={adjustmentLoading}
                  required
                />
                <small className="help-text">
                  {adjustmentItem.checkStatus === "SHORTAGE"
                    ? "Số dương để bổ sung tồn kho"
                    : "Số âm để giảm tồn kho thừa"}
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="reason">Lý do điều chỉnh *</label>
                <textarea
                  id="reason"
                  value={adjustmentData.reason}
                  onChange={(e) =>
                    setAdjustmentData((prev) => ({
                      ...prev,
                      reason: e.target.value,
                    }))
                  }
                  placeholder="Nhập lý do điều chỉnh"
                  disabled={adjustmentLoading}
                  required
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label htmlFor="reference">Tham chiếu</label>
                <input
                  type="text"
                  id="reference"
                  value={adjustmentData.reference}
                  onChange={(e) =>
                    setAdjustmentData((prev) => ({
                      ...prev,
                      reference: e.target.value,
                    }))
                  }
                  placeholder="Mã tham chiếu (tùy chọn)"
                  disabled={adjustmentLoading}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={handleCloseAdjustmentModal}
                  disabled={adjustmentLoading}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={adjustmentLoading}
                >
                  {adjustmentLoading ? "Đang xử lý..." : "Xác nhận điều chỉnh"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  // =============================================================================
  // ERROR HANDLING
  // =============================================================================

  if (resultsError || error) {
    return (
      <div className="full-container">
        <div className="error-container">
          <h2>Lỗi tải dữ liệu</h2>
          <p>{resultsError || error}</p>
          <button onClick={() => window.location.reload()}>Thử lại</button>
        </div>
      </div>
    );
  }

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  return (
    <div className="full-container">
      <div className="kiemkho-container">
        {/* Search Section */}
        {renderSearchSection()}

        {/* Summary Statistics */}
        {renderSummaryStats()}

        {/* Main Content */}
        <div className="kiemkho-main-content">
          {/* Header with Actions */}
          {renderTableHeader()}

          {/* Stock Check Table */}
          {viewMode === "grouped"
            ? renderGroupedStockCheckTable()
            : renderStockCheckTable()}

          {/* Pagination */}
          {renderPagination()}
        </div>

        {/* Loading Overlay */}
        {(resultsLoading || loading) && (
          <div className="loading-overlay">
            <div className="loading-spinner">Đang tải...</div>
          </div>
        )}
      </div>

      {/* Stock Adjustment Modal */}
      {renderAdjustmentModal()}

      <style>{`
        .search-inputs {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }

        .search-btn,
        .filter-btn {
          background: #007bff;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .search-btn:hover,
        .filter-btn:hover {
          background: #0056b3;
        }

        .filters-section {
          margin-top: 15px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 4px;
        }

        .filter-row {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }

        .filter-select,
        .filter-input {
          padding: 6px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        .apply-filter-btn {
          background: #28a745;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
        }

        .clear-filter-btn {
          background: #6c757d;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
        }

        .summary-stats {
          margin: 20px 0;
        }

        .stats-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
        }

        .stat-card {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          text-align: center;
        }

        .stat-card h4 {
          margin: 0 0 10px 0;
          color: #666;
          font-size: 14px;
        }

        .stat-number {
          font-size: 28px;
          font-weight: bold;
          margin: 0;
        }

        .stat-number.success {
          color: #28a745;
        }
        .stat-number.error {
          color: #dc3545;
        }
        .stat-number.warning {
          color: #ffc107;
        }

        .header-actions {
          display: flex;
          gap: 10px;
        }

        .export-btn {
          background: #28a745;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .export-btn:hover {
          background: #218838;
        }

        .export-btn:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }

        .status-success {
          background-color: rgba(40, 167, 69, 0.1);
        }
        .status-danger {
          background-color: rgba(220, 53, 69, 0.1);
        }
        .status-warning {
          background-color: rgba(255, 193, 7, 0.1);
        }

        .variance {
          font-weight: bold;
          color: #dc3545;
        }

        .status-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
        }

        .status-badge.success {
          background: #d4edda;
          color: #155724;
        }

        .status-badge.danger {
          background: #f8d7da;
          color: #721c24;
        }

        .status-badge.warning {
          background: #fff3cd;
          color: #856404;
        }

        .attention-badge {
          background: #ffc107;
          color: #000;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          margin-left: 5px;
        }

        .action-buttons {
          display: flex;
          gap: 5px;
        }

        .view-btn,
        .process-btn {
          background: none;
          border: 1px solid #ddd;
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
          color: #666;
        }

        .view-btn:hover {
          background: #007bff;
          color: white;
          border-color: #007bff;
        }

        .process-btn:hover {
          background: #ffc107;
          color: #000;
          border-color: #ffc107;
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 15px;
          margin-top: 20px;
        }

        .pagination-btn {
          background: #007bff;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
        }

        .pagination-btn:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }

        .pagination-info {
          font-weight: bold;
        }

        .no-data {
          text-align: center;
          color: #666;
          font-style: italic;
          padding: 40px;
        }

        .loading-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .loading-spinner {
          background: white;
          padding: 20px 40px;
          border-radius: 8px;
          font-weight: bold;
        }

        .error-container {
          text-align: center;
          padding: 40px;
        }

        .error-container button {
          background: #007bff;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          margin-top: 20px;
        }

        /* Stock Adjustment Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 8px;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 20px 0 20px;
          border-bottom: 1px solid #eee;
        }

        .modal-header h3 {
          margin: 0;
          color: #333;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: #666;
          padding: 5px;
        }

        .close-btn:hover {
          color: #333;
        }

        .modal-body {
          padding: 20px;
        }

        .product-info {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 6px;
          margin-bottom: 20px;
        }

        .product-info h4 {
          margin: 0 0 10px 0;
          color: #333;
        }

        .product-info p {
          margin: 5px 0;
          color: #666;
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
          color: #333;
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
        }

        .help-text {
          display: block;
          margin-top: 5px;
          color: #6c757d;
          font-size: 12px;
        }

        .modal-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          margin-top: 20px;
          padding-top: 15px;
          border-top: 1px solid #eee;
        }

        .cancel-btn {
          background: #6c757d;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
        }

        .submit-btn {
          background: #28a745;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
        }

        .cancel-btn:hover {
          background: #5a6268;
        }

        .submit-btn:hover {
          background: #218838;
        }

        .adjust-btn {
          background: #ffc107;
          color: #212529;
          border: none;
          padding: 5px 8px;
          border-radius: 3px;
          cursor: pointer;
          font-size: 12px;
        }

        .adjust-btn:hover {
          background: #e0a800;
        }

        /* Disabled states for modal form */
        .form-group input:disabled,
        .form-group textarea:disabled {
          background-color: #f8f9fa;
          color: #6c757d;
          cursor: not-allowed;
        }

        .modal-actions button:disabled {
          background-color: #6c757d;
          cursor: not-allowed;
          opacity: 0.6;
        }

        .submit-btn:disabled {
          background-color: #6c757d !important;
        }
      `}</style>
    </div>
  );
};

export default StockCheckManagement;
