import { useState, useEffect, useCallback, useMemo } from "react";
import "./transaction.css";
import { useStockLedger } from "../../hooks/useStockLedger.js";
import { usePartyManagement } from "../../hooks/usePartyManagement.js";
import { useProductManagement } from "../../hooks/useProductManagement.js";
import ReturnImportProductsForm from "../../components/ReturnImportProductsForm.jsx";

const ReturnImportedProduct = () => {
  // State for search filters
  const [searchFilters, setSearchFilters] = useState({
    returnCode: "",
    supplierId: "",
    startDate: "",
    endDate: "",
    status: "",
  });

  // UI state
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [viewMode, setViewMode] = useState("list"); // 'list' or 'details'

  // Use stock ledger hook to get RETURN movements
  const {
    loading,
    error,
    stockMovements,
    getMovementsByType,
    getMovementsByDateRange,
    clearError,
  } = useStockLedger({
    autoRefresh: true,
    refreshInterval: 60000, // Refresh every minute
  });
  // Get suppliers for filter dropdown
  const { parties: suppliers, loading: suppliersLoading } = usePartyManagement({
    autoLoad: true,
    partyType: "VENDOR",
  });

  // Get products for display
  const { products, loading: productsLoading } = useProductManagement({
    autoLoad: true,
  });

  // Load goods returns on component mount
  useEffect(() => {
    loadGoodsReturns();
  }, []);

  /**
   * Load goods returns from stock movements (RETURN type)
   */
  const loadGoodsReturns = useCallback(async () => {
    try {
      clearError();

      const filters = {};

      // Add date range filter if provided
      if (searchFilters.startDate && searchFilters.endDate) {
        filters.startDate = searchFilters.startDate;
        filters.endDate = searchFilters.endDate;
      }

      console.log("Loading goods returns with filters:", filters);
      const result = await getMovementsByType("RETURN", filters);
      console.log("Received return movements:", result);
      console.log("stockMovements state:", stockMovements);
    } catch (err) {
      console.error("Error loading goods returns:", err);
    }
  }, [
    getMovementsByType,
    searchFilters.startDate,
    searchFilters.endDate,
    clearError,
    stockMovements,
  ]);
  /**
   * Handle search input changes
   */
  const handleSearchChange = useCallback((field, value) => {
    setSearchFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  /**
   * Handle search execution
   */
  const handleSearch = useCallback(() => {
    loadGoodsReturns();
  }, [loadGoodsReturns]);

  /**
   * Clear search filters
   */
  const handleClearSearch = useCallback(() => {
    setSearchFilters({
      returnCode: "",
      supplierId: "",
      startDate: "",
      endDate: "",
      status: "",
    });
    loadGoodsReturns();
  }, [loadGoodsReturns]);

  /**
   * Handle return form success
   */
  const handleReturnSuccess = useCallback(
    (result) => {
      console.log("Return created successfully:", result);
      setShowReturnForm(false);
      loadGoodsReturns(); // Refresh the list
    },
    [loadGoodsReturns]
  );

  /**
   * Handle view return details
   */
  const handleViewDetails = useCallback((returnItem) => {
    setSelectedReturn(returnItem);
    setViewMode("details");
  }, []);

  /**
   * Back to list view
   */
  const handleBackToList = useCallback(() => {
    setSelectedReturn(null);
    setViewMode("list");
  }, []);

  /**
   * Filter returns based on search criteria
   */
  const displayedReturns = useMemo(() => {
    let filtered = [...(stockMovements || [])];

    // Filter by return code (using movement reference)
    if (searchFilters.returnCode.trim()) {
      const searchTerm = searchFilters.returnCode.toLowerCase();
      filtered = filtered.filter(
        (returnItem) =>
          returnItem.documentReference?.toLowerCase().includes(searchTerm) ||
          returnItem.id?.toString().includes(searchTerm) ||
          `TH${returnItem.id.toString().padStart(3, "0")}`
            .toLowerCase()
            .includes(searchTerm)
      );
    }

    // Filter by supplier
    if (searchFilters.supplierId) {
      filtered = filtered.filter(
        (returnItem) =>
          returnItem.partyId?.toString() === searchFilters.supplierId
      );
    }

    return filtered;
  }, [stockMovements, searchFilters]);

  /**
   * Format currency
   */
  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);
  }, []);

  /**
   * Format date and time
   */
  const formatDateTime = useCallback((dateString) => {
    if (!dateString) return "-";

    const date = new Date(dateString);
    return new Intl.DateTimeFormat("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }, []);
  /**
   * Get supplier name by ID
   */
  const getSupplierName = useCallback(
    (supplierId) => {
      const supplier = suppliers.find((s) => s.id === supplierId);
      return supplier?.name || "Không xác định";
    },
    [suppliers]
  );

  /**
   * Get product name by ID
   */
  const getProductName = useCallback(
    (productId) => {
      const product = products.find((p) => p.id === productId);
      return product?.name || `Sản phẩm ID: ${productId}`;
    },
    [products]
  );

  /**
   * Generate return code
   */
  const generateReturnCode = useCallback((returnId) => {
    return `TH${returnId.toString().padStart(3, "0")}`;
  }, []);

  return (
    <div className="trahang-container full-container">
      {/* Search Box */}
      <div className="danhmuc-search-box">
        <h4>Tìm kiếm</h4>
        <input
          type="text"
          placeholder="Nhập mã trả hàng"
          className="trahang-input bg-light text-dark"
          value={searchFilters.returnCode}
          onChange={(e) => handleSearchChange("returnCode", e.target.value)}
        />{" "}
        <select
          className="trahang-input bg-light text-dark"
          value={searchFilters.supplierId}
          onChange={(e) => handleSearchChange("supplierId", e.target.value)}
          disabled={suppliersLoading}
        >
          <option value="">Tất cả nhà cung cấp</option>
          {suppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          placeholder="Từ ngày"
          className="trahang-input bg-light text-dark"
          value={searchFilters.startDate}
          onChange={(e) => handleSearchChange("startDate", e.target.value)}
        />
        <input
          type="date"
          placeholder="Đến ngày"
          className="trahang-input bg-light text-dark"
          value={searchFilters.endDate}
          onChange={(e) => handleSearchChange("endDate", e.target.value)}
        />
        <select
          className="trahang-input bg-light text-dark"
          value={searchFilters.status}
          onChange={(e) => handleSearchChange("status", e.target.value)}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="COMPLETED">Hoàn thành</option>
          <option value="PENDING">Đang xử lý</option>
          <option value="CANCELLED">Đã hủy</option>
        </select>
        <div>
          <button
            className="search-btn"
            onClick={handleSearch}
            disabled={loading}
            style={{ display: 'block', width: '100%', marginBottom: 8 }}
          >
            {loading ? "Đang tìm..." : "🔍 Tìm kiếm"}
          </button>
          <button
            className="search-btn"
            onClick={handleClearSearch}
            style={{ backgroundColor: "#6c757d", width: '100%' }}
          >
            🗑️ Xóa bộ lọc
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="trahang-main-content">
        {viewMode === "list" ? (
          <>
            {/* Header */}
            <div className="trahang-header">
              <h2 className="trahang-title">PHIẾU TRẢ HÀNG NHẬP</h2>
              <button
                className="trahang-button"
                onClick={() => setShowReturnForm(true)}
              >
                + Trả hàng
              </button>
            </div>{" "}
            {/* Error Display */}
            {error && (
              <div
                style={{
                  backgroundColor: "#fee",
                  border: "1px solid #fcc",
                  borderRadius: "4px",
                  padding: "12px",
                  marginBottom: "16px",
                  color: "#c33",
                }}
              >
                {error.message || error}
              </div>
            )}
            {/* Loading State */}
            {loading && (
              <div
                style={{ textAlign: "center", padding: "20px", color: "#666" }}
              >
                Đang tải dữ liệu...
              </div>
            )}
            {/* Returns Table */}
            {!loading && (
              <table className="table table-hover mb-0">
                <thead className="table-danger text-center">
                  <tr>
                    <th>Mã trả hàng</th>
                    <th>Thời gian</th>
                    <th>Nhà cung cấp</th>
                    <th>Sản phẩm</th>
                    <th>Số lượng</th>
                    <th>Tham chiếu</th>
                    <th>Ghi chú</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody className="text-center align-middle">
                  {displayedReturns.length > 0 ? (
                    displayedReturns.map((returnItem) => (
                      <tr key={returnItem.id}>
                        <td>
                          <span className="badge bg-secondary">
                            {generateReturnCode(returnItem.id)}
                          </span>
                        </td>
                        <td>{formatDateTime(returnItem.movementDate)}</td>
                        <td>{getSupplierName(returnItem.partyId)}</td>
                        <td className="fw-bold">{getProductName(returnItem.productId)}</td>
                        <td>{Math.abs(returnItem.quantity)}</td>
                        <td>{returnItem.documentReference || "-"}</td>
                        <td className="text-start">{returnItem.notes || "-"}</td>
                        <td>
                          <span className="badge bg-success">Hoàn thành</span>
                        </td>
                        <td>
                          <button
                            onClick={() => handleViewDetails(returnItem)}
                            className="btn btn-sm btn-primary"
                            title="Xem chi tiết"
                          >
                            Xem
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="text-center text-muted py-3">
                        {loading ? "Đang tải..." : "Không có dữ liệu phù hợp"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

            )}{" "}
            {/* Summary */}
            {displayedReturns.length > 0 && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "12px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "4px",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>Tổng số phiếu: {displayedReturns.length}</span>
                <span>
                  Tổng số lượng trả:{" "}
                  {displayedReturns.reduce(
                    (sum, item) => sum + Math.abs(item.quantity || 0),
                    0
                  )}
                </span>
              </div>
            )}
          </>
        ) : (
          /* Detail View */
          <div>
            <div style={{ marginBottom: "20px" }}>
              <button
                onClick={handleBackToList}
                style={{
                  padding: "8px 12px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                ← Quay lại danh sách
              </button>
            </div>

            {selectedReturn && (
              <div
                style={{
                  backgroundColor: "white",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  padding: "24px",
                }}
              >
                <h2>
                  Chi tiết phiếu trả hàng{" "}
                  {generateReturnCode(selectedReturn.id)}
                </h2>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "20px",
                    marginTop: "20px",
                  }}
                >
                  <div>
                    <h3>Thông tin chung</h3>{" "}
                    <p>
                      <strong>Mã phiếu:</strong>{" "}
                      {generateReturnCode(selectedReturn.id)}
                    </p>
                    <p>
                      <strong>Ngày tạo:</strong>{" "}
                      {formatDateTime(selectedReturn.movementDate)}
                    </p>
                    <p>
                      <strong>Nhà cung cấp:</strong>{" "}
                      {getSupplierName(selectedReturn.partyId)}
                    </p>
                    <p>
                      <strong>Tham chiếu:</strong>{" "}
                      {selectedReturn.documentReference || "-"}
                    </p>
                  </div>

                  <div>
                    <h3>Thông tin sản phẩm</h3>{" "}
                    <p>
                      <strong>Sản phẩm:</strong>{" "}
                      {getProductName(selectedReturn.productId)}
                    </p>{" "}
                    <p>
                      <strong>Số lượng trả:</strong>{" "}
                      {Math.abs(selectedReturn.quantity)}
                    </p>
                    <p>
                      <strong>Ghi chú:</strong> {selectedReturn.notes || "-"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Return Form Modal */}
      <ReturnImportProductsForm
        isOpen={showReturnForm}
        onClose={() => setShowReturnForm(false)}
        onSuccess={handleReturnSuccess}
      />
    </div>
  );
};
export default ReturnImportedProduct;
