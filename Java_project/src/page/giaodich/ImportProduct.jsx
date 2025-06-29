import { useState, useEffect, useMemo, useCallback } from "react";
import "./transaction.css";
import { useStockLedger } from "../../hooks/useStockLedger.js";
import GoodsReceiptForm from "../../components/GoodsReceiptForm.jsx";
import ToastMessage from "../../component/ToastMessage.jsx";

const ImportProduct = () => {
  // State for search filters
  const [searchFilters, setSearchFilters] = useState({
    documentReference: "",
    vendorId: "",
    startDate: "",
    endDate: "",
  });

  // UI state
  const [showGoodsReceiptForm, setShowGoodsReceiptForm] = useState(false);
  const [viewMode, setViewMode] = useState("summary"); // 'summary' or 'detailed'
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Use stock ledger hook to get RECEIPT movements
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
  // Load goods receipts (RECEIPT movements) on component mount
  useEffect(() => {
    loadGoodsReceipts();
  }, [getMovementsByType]); // Add dependency

  /**
   * Load goods receipts from stock movements
   */
  const loadGoodsReceipts = useCallback(async () => {
    try {
      clearError();

      // Get movements by type "RECEIPT" which represents goods receipts
      const filters = {};

      // Add date range filter if provided
      if (searchFilters.startDate && searchFilters.endDate) {
        filters.startDate = searchFilters.startDate;
        filters.endDate = searchFilters.endDate;
      }

      console.log("Loading goods receipts with filters:", filters);
      const result = await getMovementsByType("RECEIPT", filters);
      console.log("Received movements:", result);
      console.log("stockMovements state:", stockMovements);
    } catch (err) {
      console.error("Error loading goods receipts:", err);
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
    loadGoodsReceipts();
  }, [loadGoodsReceipts]);

  /**
   * Clear search filters
   */
  const handleClearSearch = useCallback(() => {
    setSearchFilters({
      documentReference: "",
      vendorId: "",
      startDate: "",
      endDate: "",
    });
    loadGoodsReceipts();
  }, [loadGoodsReceipts]);
  /**
   * Handle goods receipt form success
   */
  const handleGoodsReceiptSuccess = useCallback(
    (result) => {
      console.log("Goods receipt created successfully:", result);

      // Extract PO and Line information from the response data
      if (result && result.data && Array.isArray(result.data)) {
        const poLineMessages = result.data.map((item) => {
          // Extract PO and Line from notes (format: "Multi-line goods receipt from PO: 6, Line: 10")
          const notes = item.notes || "";
          const poMatch = notes.match(/PO:\s*(\d+)/);
          const lineMatch = notes.match(/Line:\s*(\d+)/);

          if (poMatch && lineMatch) {
            return `PO: ${poMatch[1]}, Line: ${lineMatch[1]}`;
          }
          return notes; // fallback to original notes if pattern doesn't match
        });

        // Join all PO/Line messages
        const message = poLineMessages.join("; ");
        setSuccessMessage(message);
        setShowSuccessToast(true);
      }

      // Refresh the data
      loadGoodsReceipts();
      setShowGoodsReceiptForm(false);
    },
    [loadGoodsReceipts]
  );

  /**
   * Toggle view mode between summary and detailed
   */
  const toggleViewMode = useCallback(() => {
    setViewMode((prev) => (prev === "summary" ? "detailed" : "summary"));
  }, []);

  /**
   * Filter movements based on search criteria
   */
  const filteredMovements = useMemo(() => {
    console.log("Filtering movements. stockMovements:", stockMovements);
    console.log("searchFilters:", searchFilters);

    if (!stockMovements || stockMovements.length === 0) {
      console.log("No stock movements to filter");
      return [];
    }

    const filtered = stockMovements.filter((movement) => {
      // Filter by document reference
      if (
        searchFilters.documentReference &&
        !movement.documentReference
          ?.toLowerCase()
          .includes(searchFilters.documentReference.toLowerCase())
      ) {
        return false;
      }

      // Filter by vendor (assuming vendor info might be in notes or reference)
      if (
        searchFilters.vendorId &&
        !movement.notes
          ?.toLowerCase()
          .includes(searchFilters.vendorId.toLowerCase()) &&
        !movement.referenceId
          ?.toLowerCase()
          .includes(searchFilters.vendorId.toLowerCase())
      ) {
        return false;
      }

      return true;
    });

    console.log("Filtered movements:", filtered);
    return filtered;
  }, [stockMovements, searchFilters]);
  /**
   * Group movements by document reference to show as goods receipts
   */
  const groupedReceipts = useMemo(() => {
    console.log("Grouping receipts from filteredMovements:", filteredMovements);

    const grouped = {};

    filteredMovements.forEach((movement) => {
      const docRef =
        movement.documentReference ||
        movement.referenceId ||
        `UNKNOWN-${movement.id}`;

      if (!grouped[docRef]) {
        grouped[docRef] = {
          documentReference: docRef,
          eventTimestamp: movement.eventTimestamp,
          warehouseName: movement.warehouseName,
          userId: movement.userId,
          referenceType: movement.referenceType,
          notes: movement.notes,
          items: [],
          totalQuantity: 0,
          itemCount: 0,
        };
      }

      grouped[docRef].items.push(movement);
      grouped[docRef].totalQuantity += movement.quantity || 0;
      grouped[docRef].itemCount += 1;
    });

    const result = Object.values(grouped).sort(
      (a, b) => new Date(b.eventTimestamp) - new Date(a.eventTimestamp)
    );

    console.log("Grouped receipts result:", result);
    return result;
  }, [filteredMovements]);

  /**
   * Format date for display
   */
  const formatDateTime = (dateTime) => {
    if (!dateTime) return "N/A";
    const date = new Date(dateTime);
    return date.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };
  /**
   * Get status based on movement data
   */
  const getReceiptStatus = (receipt) => {
    // Since we're retrieving RECEIPT movements, all should be marked as complete
    // You can also check specific conditions if needed:
    // - Check if movementType is "RECEIPT"
    // - Check if the receipt has items
    // - Check specific referenceType values

    if (receipt.items && receipt.items.length > 0) {
      // Check if any item has movementType "RECEIPT"
      const hasReceiptMovement = receipt.items.some(
        (item) => item.movementType === "RECEIPT"
      );
      if (hasReceiptMovement) {
        return "Hoàn tất";
      }
    }

    // Default for all retrieved goods receipt data
    return "Hoàn tất";
  };

  return (
    <div className="nhaphang-container full-container">
      <div className="danhmuc-search-box">
        <h4>Tìm kiếm phiếu nhập hàng</h4>
        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            marginBottom: "10px",
          }}
        >
          <input
            type="text"
            placeholder="Nhập mã nhập hàng"
            className="nhaphang-input bg-light"
            value={searchFilters.documentReference}
            onChange={(e) =>
              handleSearchChange("documentReference", e.target.value)
            }
          />
          <input
            type="text"
            placeholder="Nhập tên hoặc mã nhà cung cấp"
            className="nhaphang-input bg-light"
            value={searchFilters.vendorId}
            onChange={(e) => handleSearchChange("vendorId", e.target.value)}
          />
        </div>
        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            marginBottom: "10px",
          }}
        >
          <input
            type="date"
            placeholder="Từ ngày"
            className="nhaphang-input bg-light text-dark"
            value={searchFilters.startDate}
            onChange={(e) => handleSearchChange("startDate", e.target.value)}
          />
          <input
            type="date"
            placeholder="Đến ngày"
            className="nhaphang-input bg-light text-dark"
            value={searchFilters.endDate}
            onChange={(e) => handleSearchChange("endDate", e.target.value)}
          />
        </div>
        <div className="">
          <button
            className="search-btn"
            onClick={handleSearch}
            disabled={loading}
            style={{ display: "block", width: "100%", marginBottom: 8 }}
          >
            {loading ? "Đang tìm..." : "🔍 Tìm kiếm"}
          </button>
          <button
            className="search-btn"
            onClick={handleClearSearch}
            style={{ backgroundColor: "#6c757d", width: "100%" }}
          >
            🗑️ Xóa bộ lọc
          </button>
        </div>
      </div>

      <div className="nhaphang-main-content">
        {" "}
        <div className="nhaphang-header">
          <h2 className="nhaphang-title">PHIẾU NHẬP HÀNG</h2>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              className="nhaphang-button"
              onClick={toggleViewMode}
              style={{
                backgroundColor: "#6c757d",
                fontSize: "14px",
              }}
            >
              {viewMode === "summary" ? "📋 Chi tiết" : "📊 Tổng hợp"}
            </button>
            <button
              className="nhaphang-button"
              onClick={() => setShowGoodsReceiptForm(true)}
            >
              + Nhập hàng
            </button>
          </div>
        </div>
        {error && (
          <div
            style={{
              backgroundColor: "#f8d7da",
              color: "#721c24",
              padding: "10px",
              marginBottom: "15px",
              borderRadius: "4px",
              border: "1px solid #f5c6cb",
            }}
          >
            <strong>Lỗi:</strong>{" "}
            {error.message || "Không thể tải dữ liệu phiếu nhập hàng"}
            <button
              onClick={clearError}
              style={{
                float: "right",
                background: "none",
                border: "none",
                color: "#721c24",
                cursor: "pointer",
                fontSize: "16px",
              }}
            >
              ×
            </button>
          </div>
        )}{" "}
        {loading && (
          <div style={{ textAlign: "center", padding: "20px" }}>
            <div>Đang tải dữ liệu...</div>
          </div>
        )}
        {/* Summary View - Grouped by receipt */}
        {viewMode === "summary" && (
          <>
            <table className="table table-hover mb-0 text-center">
              <thead className="table-primary">
                <tr>
                  <th>Mã nhập hàng</th>
                  <th>Thời gian</th>
                  <th>Kho nhận</th>
                  <th>Số mặt hàng</th>
                  <th>Tổng SL</th>
                  <th>Người nhận</th>
                  <th>Trạng thái</th>
                  <th>Ghi chú</th>
                </tr>
              </thead>
              <tbody className="align-middle">
                {groupedReceipts.length > 0 ? (
                  groupedReceipts.map((receipt, index) => (
                    <tr key={receipt.documentReference || index}>
                      <td>
                        <span className="badge bg-secondary">
                          {receipt.documentReference}
                        </span>
                      </td>
                      <td>{formatDateTime(receipt.eventTimestamp)}</td>
                      <td>{receipt.warehouseName || "Kho chính"}</td>
                      <td>{receipt.itemCount}</td>
                      <td>{receipt.totalQuantity?.toLocaleString()}</td>
                      <td>{receipt.userId || "N/A"}</td>
                      <td>
                        <span
                          className={`badge ${
                            getReceiptStatus(receipt) === "Hoàn tất"
                              ? "bg-success"
                              : "bg-warning text-dark"
                          }`}
                        >
                          {getReceiptStatus(receipt)}
                        </span>
                      </td>
                      <td className="text-start">{receipt.notes || ""}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-muted py-3">
                      {loading ? "Đang tải..." : "Không có phiếu nhập hàng nào"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {groupedReceipts.length > 0 && (
              <div
                style={{
                  marginTop: "15px",
                  padding: "10px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              >
                <strong>Tổng kết:</strong> Tìm thấy {groupedReceipts.length}{" "}
                phiếu nhập hàng với tổng cộng {filteredMovements.length} dòng
                sản phẩm
              </div>
            )}
          </>
        )}
        {/* Detailed View - Individual lines */}
        {viewMode === "detailed" && (
          <>
            <table className="table table-hover mb-0">
              <thead className="table-primary text-center">
                <tr>
                  <th>Mã nhập hàng</th>
                  <th>Sản phẩm</th>
                  <th>Đơn vị</th>
                  <th>Số lượng</th>
                  <th>Kho nhận</th>
                  <th>Thời gian</th>
                  <th>Người nhận</th>
                  <th>Loại tham chiếu</th>
                  <th>Ghi chú</th>
                </tr>
              </thead>
              <tbody className="text-center align-middle">
                {filteredMovements.length > 0 ? (
                  filteredMovements.map((movement, index) => (
                    <tr key={movement.id || index}>
                      <td>
                        <span className="badge bg-secondary">
                          {movement.documentReference}
                        </span>
                      </td>
                      <td className="fw-bold">{movement.productName}</td>
                      <td>{movement.productUnit}</td>
                      <td className="text-end">
                        {movement.quantity?.toLocaleString() || "0"}
                      </td>
                      <td>{movement.warehouseName || "Kho chính"}</td>
                      <td>{formatDateTime(movement.eventTimestamp)}</td>
                      <td>{movement.userId || "N/A"}</td>
                      <td>
                        <span
                          className={`badge ${
                            movement.referenceType === "GOODS_RECEIPT"
                              ? "bg-primary"
                              : "bg-warning text-dark"
                          }`}
                        >
                          {movement.referenceType || "N/A"}
                        </span>
                      </td>
                      <td className="text-start">{movement.notes || ""}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="text-muted py-3">
                      {loading ? "Đang tải..." : "Không có dữ liệu chi tiết"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {filteredMovements.length > 0 && (
              <div
                style={{
                  marginTop: "15px",
                  padding: "10px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              >
                <strong>Tổng kết:</strong> Tìm thấy {filteredMovements.length}{" "}
                dòng sản phẩm từ {groupedReceipts.length} phiếu nhập hàng
              </div>
            )}
          </>
        )}
        {/* Goods Receipt Form Modal */}
        <GoodsReceiptForm
          isOpen={showGoodsReceiptForm}
          onClose={() => setShowGoodsReceiptForm(false)}
          onSuccess={handleGoodsReceiptSuccess}
        />
        {/* Success Toast Message */}
        <ToastMessage
          show={showSuccessToast}
          onClose={() => setShowSuccessToast(false)}
          message={successMessage}
          variant="success"
        />
      </div>
    </div>
  );
};
export default ImportProduct;
