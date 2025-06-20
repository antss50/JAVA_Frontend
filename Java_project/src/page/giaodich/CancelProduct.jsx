import React, { useState, useEffect, useCallback, useMemo } from "react";
import "./transaction.css";
import { useStockLedger } from "../../hooks/useStockLedger";
import { useExportDestroy } from "../../hooks/useExportDestroy";
import DisposalForm from "../../components/DisposalForm";
import ToastMessage from "../../component/ToastMessage";
import "./DisposalDetailsModal.css"
import {
  DISPOSAL_REASONS,
  DISPOSAL_METHODS,
  getDisposalReasonText,
  getDisposalMethodText,
} from "../../utils/inventory-related/exportDestroyFormatter";

const CancelProduct = () => {
  // State for search filters
  const [searchFilters, setSearchFilters] = useState({
    documentReference: "",
    disposalType: "all", // "all", "manual", "customer_return"
    startDate: "",
    endDate: "",
    reason: "",
    method: "",
  });
  // UI state
  const [showDisposalForm, setShowDisposalForm] = useState(false);
  const [viewMode, setViewMode] = useState("summary"); // 'summary' or 'detailed'
  const [selectedDisposal, setSelectedDisposal] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastVariant, setToastVariant] = useState("success");
  // Use stock ledger hook to get DISPOSAL movements
  const {
    loading,
    error,
    stockMovements,
    getMovementsByType,
    getMovementsByDateRange,
    clearError,
    clearCache,
    refreshData,
  } = useStockLedger({
    autoRefresh: true,
    refreshInterval: 60000,
  });
  // Use export destroy hook for disposal operations (history disabled)
  const {
    submitting,
    error: disposalError,
    recordDisposal,
    clearError: clearDisposalError,
    DISPOSAL_REASONS: REASONS,
    DISPOSAL_METHODS: METHODS,
  } = useExportDestroy({
    enableHistory: false, // Disable history since endpoint doesn't exist yet
    autoRefresh: false,
  });

  // Load disposal movements on component mount
  useEffect(() => {
    loadDisposalMovements();
  }, []);
  /**
   * Load disposal movements (both manual and customer return)
   */
  const loadDisposalMovements = useCallback(async () => {
    try {
      clearError();

      // Clear cache to ensure fresh data
      clearCache();

      console.log("Loading disposal movements...");

      // Get all DISPOSAL movements
      const movements = await getMovementsByType("DISPOSAL");
      console.log("Received DISPOSAL movements:", movements);

      // If date filters are applied, also filter by date range
      if (searchFilters.startDate && searchFilters.endDate) {
        console.log(
          "Applying date filters:",
          searchFilters.startDate,
          searchFilters.endDate
        );
        await getMovementsByDateRange(
          searchFilters.startDate,
          searchFilters.endDate
        );
      }
    } catch (error) {
      console.error("Error loading disposal movements:", error);
    }
  }, [
    getMovementsByType,
    getMovementsByDateRange,
    searchFilters.startDate,
    searchFilters.endDate,
    clearError,
    clearCache,
  ]);

  /**
   * Handle search input changes
   */
  const handleSearchChange = (field, value) => {
    setSearchFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  /**
   * Handle search execution
   */
  const handleSearch = useCallback(() => {
    loadDisposalMovements();
  }, [loadDisposalMovements]);

  /**
   * Clear search filters
   */
  const handleClearSearch = useCallback(() => {
    setSearchFilters({
      documentReference: "",
      disposalType: "all",
      startDate: "",
      endDate: "",
      reason: "",
      method: "",
    });
    // Clear cache and reload data after clearing filters
    clearCache();
    loadDisposalMovements();
  }, [loadDisposalMovements, clearCache]);
  /**
   * Handle disposal form success
   */
  const handleDisposalSuccess = useCallback(
    async (result) => {
      console.log("Disposal recorded successfully:", result);

      try {
        // Close the disposal form immediately to give user feedback
        setShowDisposalForm(false);

        // Show success message
        setToastMessage("Phiếu xuất hủy đã được tạo thành công!");
        setToastVariant("success");
        setShowToast(true);

        // Clear cache to ensure fresh data
        clearCache();

        // Add a small delay to ensure the disposal has been processed on the backend
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Refresh the movements data
        console.log(
          "Refreshing disposal movements after successful creation..."
        );
        await loadDisposalMovements();

        console.log("Data refreshed successfully after disposal");
      } catch (error) {
        console.error("Error refreshing disposal movements:", error);

        // Show error message
        setToastMessage(
          "Tạo phiếu thành công nhưng có lỗi khi làm mới dữ liệu. Vui lòng tải lại trang."
        );
        setToastVariant("warning");
        setShowToast(true);

        // Fallback: use refreshData if loadDisposalMovements fails
        try {
          console.log("Attempting fallback refresh...");
          await refreshData();
          console.log("Data refreshed using fallback method");
        } catch (fallbackError) {
          console.error("Fallback refresh also failed:", fallbackError);
          // If both methods fail, at least the auto-refresh will catch it eventually
        }
      }
    },
    [loadDisposalMovements, clearCache, refreshData]
  );

  /**
   * Toggle view mode between summary and detailed
   */
  const toggleViewMode = useCallback(() => {
    setViewMode((prev) => (prev === "summary" ? "detailed" : "summary"));
  }, []);
  /**
   * Extract disposal reason from notes
   */
  const extractDisposalReason = useCallback((notes) => {
    if (!notes) return "";
    const match = notes.match(/Reason: ([^,]+)/);
    return match ? match[1].trim() : "";
  }, []);

  /**
   * Extract disposal method from notes
   */
  const extractDisposalMethod = useCallback((notes) => {
    if (!notes) return "";
    const match = notes.match(/Method: ([^,]+)/);
    return match ? match[1].trim() : "";
  }, []);
  /**
   * Filter movements based on search criteria
   */
  const filteredMovements = useMemo(() => {
    console.log("Filtering movements. Raw stockMovements:", stockMovements);

    if (!stockMovements || stockMovements.length === 0) {
      console.log("No stock movements available");
      return [];
    }

    const filtered = stockMovements.filter((movement) => {
      // Filter by movement type (DISPOSAL only)
      if (movement.movementType !== "DISPOSAL") {
        console.log(
          `Excluding movement ${movement.id} - type: ${movement.movementType}`
        );
        return false;
      }

      // Filter by disposal type (manual vs customer return)
      if (searchFilters.disposalType !== "all") {
        const isCustomerReturn = movement.userId === "CUSTOMER_RETURN_SYSTEM";
        if (searchFilters.disposalType === "manual" && isCustomerReturn)
          return false;
        if (
          searchFilters.disposalType === "customer_return" &&
          !isCustomerReturn
        )
          return false;
      }

      // Filter by document reference
      if (
        searchFilters.documentReference &&
        !movement.documentReference
          ?.toLowerCase()
          .includes(searchFilters.documentReference.toLowerCase())
      ) {
        return false;
      }

      // Filter by disposal reason (extracted from notes)
      if (searchFilters.reason) {
        const hasReason = movement.notes
          ?.toLowerCase()
          .includes(searchFilters.reason.toLowerCase());
        if (!hasReason) return false;
      }

      // Filter by disposal method (extracted from notes)
      if (searchFilters.method) {
        const hasMethod = movement.notes
          ?.toLowerCase()
          .includes(searchFilters.method.toLowerCase());
        if (!hasMethod) return false;
      }

      return true;
    });

    console.log("Filtered movements:", filtered);
    return filtered;
  }, [stockMovements, searchFilters]);

  /**
   * Group movements by document reference to show as disposal records
   */
  const groupedDisposals = useMemo(() => {
    const groups = new Map();

    filteredMovements.forEach((movement) => {
      const key =
        movement.documentReference ||
        movement.referenceId ||
        `single-${movement.id}`;

      if (!groups.has(key)) {
        groups.set(key, {
          id: key,
          documentReference:
            movement.documentReference || `DISP-${movement.id}`,
          eventTimestamp: movement.eventTimestamp,
          userId: movement.userId,
          warehouseName: movement.warehouseName,
          referenceType: movement.referenceType,
          isCustomerReturn: movement.userId === "CUSTOMER_RETURN_SYSTEM",
          items: [],
          totalQuantity: 0,
          disposalReason: extractDisposalReason(movement.notes),
          disposalMethod: extractDisposalMethod(movement.notes),
          notes: movement.notes,
        });
      }

      const group = groups.get(key);
      group.items.push({
        id: movement.id,
        productId: movement.productId,
        productName: movement.productName,
        productUnit: movement.productUnit,
        quantity: Math.abs(movement.quantity),
        notes: movement.notes,
      });
      group.totalQuantity += Math.abs(movement.quantity);
    });
    return Array.from(groups.values()).sort(
      (a, b) => new Date(b.eventTimestamp) - new Date(a.eventTimestamp)
    );
  }, [filteredMovements, extractDisposalReason, extractDisposalMethod]);

  /**
   * Format date for display
   */
  const formatDateTime = (dateTime) => {
    if (!dateTime) return "";
    try {
      const date = new Date(dateTime);
      return date.toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch (error) {
      return dateTime;
    }
  };

  /**
   * Get status based on disposal data
   */
  const getDisposalStatus = (disposal) => {
    if (disposal.isCustomerReturn) {
      return {
        text: "Hoàn trả KH",
        className: "status-customer-return",
      };
    }
    return {
      text: "Đã xác nhận",
      className: "status-confirmed",
    };
  };

  /**
   * Handle view disposal details
   */
  const handleViewDetails = (disposal) => {
    setSelectedDisposal(disposal);
  };

  return (
    <div className="xuathuy-container full-container">
      {/* Search Filters */}
      <div className="danhmuc-search-box">
        <h4>Tìm kiếm</h4>
        <div className="search-row">
          <input
            type="text"
            placeholder="Nhập mã xuất hủy"
            className="xuathuy-input bg-light"
            value={searchFilters.documentReference}
            onChange={(e) =>
              handleSearchChange("documentReference", e.target.value)
            }
          />
          <select
            className="xuathuy-input bg-light text-dark"
            value={searchFilters.disposalType}
            onChange={(e) => handleSearchChange("disposalType", e.target.value)}
          >
            <option value="all">Tất cả loại xuất hủy</option>
            <option value="manual">Xuất hủy thủ công</option>
            <option value="customer_return">Hoàn trả khách hàng</option>
          </select>
        </div>

        <div className="search-row">
          <input
            type="date"
            className="xuathuy-input bg-light text-dark"
            placeholder="Từ ngày"
            value={searchFilters.startDate}
            onChange={(e) => handleSearchChange("startDate", e.target.value)}
          />
          <input
            type="date"
            className="xuathuy-input bg-light text-dark"
            placeholder="Đến ngày"
            value={searchFilters.endDate}
            onChange={(e) => handleSearchChange("endDate", e.target.value)}
          />
        </div>

        <div className="search-row">
          <select
            className="xuathuy-input bg-light text-dark"
            value={searchFilters.reason}
            onChange={(e) => handleSearchChange("reason", e.target.value)}
          >
            <option value="">Chọn lý do hủy</option>
            {Object.entries(DISPOSAL_REASONS).map(([key, value]) => (
              <option key={key} value={value}>
                {getDisposalReasonText(value)}
              </option>
            ))}
          </select>
          <select
            className="xuathuy-input bg-light text-dark"
            value={searchFilters.method}
            onChange={(e) => handleSearchChange("method", e.target.value)}
          >
            <option value="">Chọn phương thức hủy</option>
            {Object.entries(DISPOSAL_METHODS).map(([key, value]) => (
              <option key={key} value={value}>
                {getDisposalMethodText(value)}
              </option>
            ))}
          </select>
        </div>

        <div className="search-actions">
          <button className="search-btn" onClick={handleSearch}>
            🔍 Tìm kiếm
          </button>
          <button className="clear-btn" onClick={handleClearSearch}>
            🗑️ Xóa bộ lọc
          </button>
          <button className="toggle-view-btn" onClick={toggleViewMode}>
            {viewMode === "summary" ? "📋 Chi tiết" : "📊 Tóm tắt"}
          </button>
        </div>
      </div>
      {/* Main Content */}
      <div className="xuathuy-main-content">
        <div className="xuathuy-header">
          <h2 className="xuathuy-title">PHIẾU XUẤT HUỶ</h2>
          <div className="header-actions">
            <span className="total-count">
              Tổng: {groupedDisposals.length} phiếu xuất hủy
            </span>
            <button
              className="xuathuy-button"
              onClick={() => setShowDisposalForm(true)}
              disabled={submitting}
            >
              {submitting ? "⏳ Đang xử lý..." : "+ Xuất huỷ"}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {(error || disposalError) && (
          <div className="error-message">
            <span>❌ {error?.message || disposalError?.message}</span>
            <button
              onClick={() => {
                clearError();
                clearDisposalError();
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="loading-message">
            ⏳ Đang tải danh sách xuất hủy...
          </div>
        )}

        {/* Disposal Table */}
        {!loading && (
          <div className="table-container">
            <table className="table table-hover mb-0">
              <thead className="table-danger text-center">
                <tr>
                  <th>Mã xuất hủy</th>
                  <th>Thời gian</th>
                  <th>Loại</th>
                  <th>Chi nhánh</th>
                  <th>Số lượng</th>
                  <th>Lý do</th>
                  <th>Phương thức</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody className="text-center align-middle">
                {groupedDisposals.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-muted py-3">
                      {filteredMovements.length === 0
                        ? "Không có dữ liệu xuất hủy"
                        : "Không tìm thấy kết quả phù hợp"}
                    </td>
                  </tr>
                ) : (
                  groupedDisposals.map((disposal) => {
                    const status = getDisposalStatus(disposal);
                    return (
                      <tr key={disposal.id}>
                        <td>
                          <span className="badge bg-secondary">{disposal.documentReference}</span>
                        </td>
                        <td>{formatDateTime(disposal.eventTimestamp)}</td>
                        <td>
                          <span
                            className={`badge ${disposal.isCustomerReturn
                              ? "bg-info"
                              : "bg-warning text-dark"
                              }`}
                          >
                            {disposal.isCustomerReturn ? "Hoàn trả KH" : "Thủ công"}
                          </span>
                        </td>
                        <td>{disposal.warehouseName}</td>
                        <td className="text-start">
                          {viewMode === "summary" ? (
                            <span>{disposal.totalQuantity}</span>
                          ) : (
                            <ul className="list-unstyled mb-0">
                              {disposal.items.map((item, idx) => (
                                <li key={idx}>
                                  <strong>{item.productName}</strong>: {item.quantity}{" "}
                                  {item.productUnit}
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                        <td>{getDisposalReasonText(disposal.disposalReason)}</td>
                        <td>{getDisposalMethodText(disposal.disposalMethod)}</td>
                        <td>
                          <span className={`badge ${status.className}`}>
                            {status.text}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleViewDetails(disposal)}
                          >
                            Xem
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

          </div>
        )}
      </div>
      {/* Disposal Form Modal */}
      {showDisposalForm && (
        <DisposalForm
          onClose={() => setShowDisposalForm(false)}
          onSuccess={handleDisposalSuccess}
        />
      )}{" "}
      {/* Disposal Details Modal */}
      {selectedDisposal && (
        <DisposalDetailsModal
          disposal={selectedDisposal}
          onClose={() => setSelectedDisposal(null)}
        />
      )}
      {/* Toast Notification */}
      <ToastMessage
        show={showToast}
        onClose={() => setShowToast(false)}
        message={toastMessage}
        variant={toastVariant}
      />
    </div>
  );
};

/**
 * Disposal Details Modal Component
 */
const DisposalDetailsModal = ({ disposal, onClose }) => {
  if (!disposal) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content disposal-details-modal"
        onClick={(e) => e.stopPropagation()}
        style={{backgroundColor: '#fff'}}
      >
        {/* Header */}
        <div className="modal-header">
          <h3>Chi tiết phiếu xuất hủy</h3>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Thông tin chung */}
          <div className="detail-section">
            <h4>Thông tin chung</h4>
            <div className="row">
              <div className="col-md-6 mb-2">
                <strong>Mã phiếu:</strong> {disposal.documentReference}
              </div>
              <div className="col-md-6 mb-2">
                <strong>Thời gian:</strong>{" "}
                {new Date(disposal.eventTimestamp).toLocaleString("vi-VN")}
              </div>
              <div className="col-md-6 mb-2">
                <strong>Kho:</strong> {disposal.warehouseName}
              </div>
              <div className="col-md-6 mb-2">
                <strong>Loại:</strong>{" "}
                {disposal.isCustomerReturn
                  ? "Hoàn trả khách hàng"
                  : "Xuất hủy thủ công"}
              </div>
              <div className="col-md-6 mb-2">
                <strong>Lý do:</strong>{" "}
                {getDisposalReasonText(disposal.disposalReason)}
              </div>
              <div className="col-md-6 mb-2">
                <strong>Phương thức:</strong>{" "}
                {getDisposalMethodText(disposal.disposalMethod)}
              </div>
            </div>
          </div>

          {/* Danh sách sản phẩm */}
          <div className="detail-section mt-4">
            <h4>Danh sách sản phẩm</h4>
            <table className="table table-hover mt-2">
              <thead className="table-light text-center">
                <tr>
                  <th>Sản phẩm</th>
                  <th>Số lượng</th>
                  <th>Đơn vị</th>
                </tr>
              </thead>
              <tbody className="text-center">
                {disposal.items.map((item, index) => (
                  <tr key={index}>
                    <td className="fw-bold">{item.productName}</td>
                    <td>{item.quantity}</td>
                    <td>{item.productUnit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer text-end">
          <button className="btn btn-secondary" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>

  );

};

export default CancelProduct;
