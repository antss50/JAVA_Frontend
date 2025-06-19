// src/page/hanghoa/stock-check/StockCheckManagement.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaSearch,
  FaFilter,
  FaDownload,
  FaPlus,
  FaEye,
  FaChevronDown,
  FaChevronRight,
  FaCheck,
  FaTimes,
  FaExclamationTriangle
} from "react-icons/fa";
import useStockCheck from "../../../hooks/useStockCheck";
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
    fetchGroupedStockCheckResults,
    fetchResultsByStatus,
    fetchResultsByDateRange,
    processVariance,
    exportToCSV,
    applyFilters,
    clearFilters,

    // View mode management
    switchViewMode,
    toggleSummaryExpansion,
  } = useStockCheck();

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

  const handleExport = async () => {
    try {
      await exportToCSV({
        startDate: dateFilter.startDate || undefined,
        endDate: dateFilter.endDate || undefined,
      });
    } catch (err) {
      alert("Failed to export data");
    }
  };

  const handlePageChange = async (page) => {
    setCurrentPage(page);
    await fetchStockCheckResults({ page: page - 1 });
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
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
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
          <div className="stat-card">
            <h4>Tỷ lệ chính xác</h4>
            <p className="stat-number success">{summary.accuracyRate}</p>
          </div>
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
          onClick={handleExport}
          className="export-btn"
          disabled={loading}
        >
          <FaDownload /> Xuất Excel
        </button>
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
    <table className="kiemkho-table">
      <thead>
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
      <tbody>
        {stockCheckResults.length === 0 ? (
          <tr>
            <td colSpan="9" className="no-data">
              {resultsLoading ? "Đang tải..." : "Không có dữ liệu"}
            </td>
          </tr>
        ) : (
          stockCheckResults.map((result) => (
            <tr
              key={
                result.checkResultId ||
                result.productId ||
                result.checkReference
              }
              className={`status-${result.statusColor}`}
            >
              <td>{result.checkReference}</td>
              <td>{result.productName}</td>
              <td>{result.checkDate}</td>
              <td>{result.expectedQuantity}</td>
              <td>{result.actualQuantity}</td>
              <td className={result.hasVariance ? "variance" : ""}>
                {result.variance}
                {result.variancePercentage && ` (${result.variancePercentage})`}
              </td>
              <td>
                <span className={`status-badge ${result.statusColor}`}>
                  {result.statusLabel}
                </span>
                {result.requiresAttention && (
                  <span className="attention-badge">Cần xử lý</span>
                )}
              </td>
              <td>{result.checkedBy}</td>
              <td>
                <div className="action-buttons">
                  <button
                    onClick={() =>
                      navigate(`/hang-hoa/kiem-kho/${result.checkResultId}`)
                    }
                    className="view-btn"
                    title="Xem chi tiết"
                  >
                    <FaEye />
                  </button>
                  {result.requiresAttention && (
                    <button
                      onClick={() =>
                        handleProcessVariance(result.checkResultId)
                      }
                      className="process-btn"
                      title="Xử lý chênh lệch"
                    >
                      <FaEdit />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );

  // Render grouped summary table with expand/collapse
  const renderGroupedStockCheckTable = () => (
    <table className="kiemkho-table">
      <thead>
        <tr>
          <th>Mã kiểm kho</th>
          <th>Ngày kiểm</th>
          <th>Người kiểm</th>
          <th>Tổng sản phẩm</th>
          <th>Có chênh lệch</th>
          <th>Tỷ lệ chính xác</th>
          <th>Trạng thái</th>
          <th>Thao tác</th>
        </tr>
      </thead>
      <tbody>
        {stockCheckSummaries.length === 0 ? (
          <tr key="no-data">
            <td colSpan="8" className="no-data">
              {resultsLoading ? "Đang tải..." : "Không có dữ liệu"}
            </td>
          </tr>
        ) : (
          stockCheckSummaries.map((summary, index) => {
            const isExpanded = expandedSummaries.has(summary.referenceId);
            return (
              <React.Fragment key={`summary-${summary.referenceId || index}`}>
                <tr className={`status-row ${isExpanded ? 'expanded' : ''}`}>
                  <td>{summary.referenceId || 'N/A'}</td>
                  <td>{new Date(summary.checkTimestamp).toLocaleDateString()}</td>
                  <td>{summary.checkedBy || 'N/A'}</td>
                  <td>{summary.totalItems || 0}</td>
                  <td className={summary.itemsWithVariance > 0 ? "variance" : ""}>
                    {summary.itemsWithVariance || 0}
                  </td>
                  <td>
                    {summary.totalItems > 0 
                      ? `${Math.round(((summary.totalItems - summary.itemsWithVariance) / summary.totalItems) * 100)}%`
                      : '100%'}
                  </td>
                  <td>
                    <span className={`status-badge ${
                      summary.itemsWithVariance > 0 ? 'warning' : 'success'
                    }`}>
                      {summary.itemsWithVariance > 0 ? 'Có chênh lệch' : 'Đã khớp'}
                    </span>
                    {summary.itemsWithVariance > 0 && (
                      <span className="attention-badge">Cần xử lý</span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => toggleSummaryExpansion(summary.referenceId)}
                        className="view-btn"
                        title={isExpanded ? "Ẩn chi tiết" : "Xem chi tiết"}
                      >
                        <FaEye />
                        {isExpanded ? " Ẩn" : " Xem"}
                      </button>
                    </div>
                  </td>
                </tr>
                {isExpanded && summary.items && summary.items.map((item, itemIndex) => (
                  <tr 
                    key={`detail-${item.id || itemIndex}-${summary.referenceId}`}
                    className="detail-row"
                  >
                    <td colSpan="2">{item.productName || 'N/A'}</td>
                    <td>SL dự kiến: {item.expectedQuantity}</td>
                    <td>SL thực tế: {item.actualQuantity}</td>
                    <td colSpan="2">
                      Chênh lệch: 
                      <span className={item.variance !== 0 ? 'variance' : ''}>
                        {item.variance > 0 ? `+${item.variance}` : item.variance}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${
                        item.checkStatus === 'MATCH' ? 'success' : 
                        item.checkStatus === 'OVERAGE' ? 'warning' : 'error'
                      }`}>
                        {item.checkStatus === 'MATCH' ? 'Khớp' : 
                         item.checkStatus === 'OVERAGE' ? 'Thừa' : 'Thiếu'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => navigate(`/hang-hoa/kiem-kho/chi-tiet/${item.id}`)}
                          className="view-btn"
                          title="Xem chi tiết"
                        >
                          <FaEye />
                        </button>
                      </div>
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
      `}</style>
    </div>
  );
};

export default StockCheckManagement;
