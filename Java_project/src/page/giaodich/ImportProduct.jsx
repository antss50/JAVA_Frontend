import { useState, useEffect, useMemo, useCallback } from "react";
import "./transaction.css";
import { useStockLedger } from "../../hooks/useStockLedger.js";
import GoodsReceiptForm from "../../components/GoodsReceiptForm.jsx";

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
      <div className="nhaphang-search-box">
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
            className="nhaphang-input"
            value={searchFilters.documentReference}
            onChange={(e) =>
              handleSearchChange("documentReference", e.target.value)
            }
          />
          <input
            type="text"
            placeholder="Nhập tên hoặc mã nhà cung cấp"
            className="nhaphang-input"
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
            className="nhaphang-input"
            value={searchFilters.startDate}
            onChange={(e) => handleSearchChange("startDate", e.target.value)}
          />
          <input
            type="date"
            placeholder="Đến ngày"
            className="nhaphang-input"
            value={searchFilters.endDate}
            onChange={(e) => handleSearchChange("endDate", e.target.value)}
          />
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            className="nhaphang-button"
            onClick={handleSearch}
            disabled={loading}
          >
            {loading ? "Đang tìm..." : "Tìm kiếm"}
          </button>
          <button
            className="nhaphang-button"
            onClick={handleClearSearch}
            style={{ backgroundColor: "#6c757d" }}
          >
            Xóa bộ lọc
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
            <table className="nhaphang-table">
              <thead>
                <tr>
                  <th>Mã nhập hàng</th>
                  <th>Thời gian</th>
                  <th>Kho nhận</th>
                  <th>Số mặt hàng</th>
                  <th>Tổng số lượng</th>
                  <th>Người nhận</th>
                  <th>Trạng thái</th>
                  <th>Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {groupedReceipts.length > 0 ? (
                  groupedReceipts.map((receipt, index) => (
                    <tr key={receipt.documentReference || index}>
                      <td>{receipt.documentReference}</td>
                      <td>{formatDateTime(receipt.eventTimestamp)}</td>
                      <td>{receipt.warehouseName || "Kho chính"}</td>
                      <td>{receipt.itemCount}</td>
                      <td>{receipt.totalQuantity.toLocaleString()}</td>
                      <td>{receipt.userId || "N/A"}</td>
                      <td>
                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "12px",
                            backgroundColor:
                              getReceiptStatus(receipt) === "Hoàn tất"
                                ? "#d4edda"
                                : "#fff3cd",
                            color:
                              getReceiptStatus(receipt) === "Hoàn tất"
                                ? "#155724"
                                : "#856404",
                            border: `1px solid ${
                              getReceiptStatus(receipt) === "Hoàn tất"
                                ? "#c3e6cb"
                                : "#ffeaa7"
                            }`,
                          }}
                        >
                          {getReceiptStatus(receipt)}
                        </span>
                      </td>
                      <td>{receipt.notes || ""}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="8"
                      style={{ textAlign: "center", padding: "20px" }}
                    >
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
            <table className="nhaphang-table">
              <thead>
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
              <tbody>
                {filteredMovements.length > 0 ? (
                  filteredMovements.map((movement, index) => (
                    <tr key={movement.id || index}>
                      <td>{movement.documentReference}</td>
                      <td>{movement.productName}</td>
                      <td>{movement.productUnit}</td>
                      <td style={{ textAlign: "right" }}>
                        {movement.quantity
                          ? movement.quantity.toLocaleString()
                          : "0"}
                      </td>
                      <td>{movement.warehouseName || "Kho chính"}</td>
                      <td>{formatDateTime(movement.eventTimestamp)}</td>
                      <td>{movement.userId || "N/A"}</td>
                      <td>
                        <span
                          style={{
                            padding: "2px 6px",
                            borderRadius: "3px",
                            fontSize: "11px",
                            backgroundColor:
                              movement.referenceType === "GOODS_RECEIPT"
                                ? "#e3f2fd"
                                : "#fff3e0",
                            color:
                              movement.referenceType === "GOODS_RECEIPT"
                                ? "#1565c0"
                                : "#ef6c00",
                            border: `1px solid ${
                              movement.referenceType === "GOODS_RECEIPT"
                                ? "#bbdefb"
                                : "#ffcc02"
                            }`,
                          }}
                        >
                          {movement.referenceType || "N/A"}
                        </span>
                      </td>
                      <td>{movement.notes || ""}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="9"
                      style={{ textAlign: "center", padding: "20px" }}
                    >
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
      </div>
    </div>
  );
};
export default ImportProduct;
