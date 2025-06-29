import { useState, useEffect, useCallback, useMemo } from "react";
import "./transaction.css";
import { useStockLedger } from "../../hooks/useStockLedger.js";
import { usePartyManagement } from "../../hooks/usePartyManagement.js";
import { useProductManagement } from "../../hooks/useProductManagement.js";
import { getPurchaseOrderById } from "../../services/bill-management/billService.js";
import ReturnImportProductsForm from "../../components/ReturnImportProductsForm.jsx";
import { formatReturnNotes } from "../../utils/inventory-related/importGoodsReturnedFormatter.js";

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

  // State for enriched returns with supplier names
  const [enrichedReturns, setEnrichedReturns] = useState([]);
  const [enrichingData, setEnrichingData] = useState(false);

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
   * Enrich returns with supplier names by fetching purchase order details
   */
  const enrichReturnsWithSupplierNames = useCallback(
    async (returns) => {
      if (!returns || returns.length === 0) {
        setEnrichedReturns([]);
        return;
      }

      setEnrichingData(true);

      try {
        const enrichedData = await Promise.all(
          returns.map(async (returnItem) => {
            let supplierName = "Không xác định";
            let billNumber = null;
            let billDate = null;

            console.log("Processing return item:", returnItem);
            console.log(
              "Reference type:",
              returnItem.referenceType,
              "Reference ID:",
              returnItem.referenceDocumentId
            );

            // If referenceType is GOODS_RETURN or SUPPLIER_RETURN, fetch supplier from PO
            if (
              (returnItem.referenceType === "GOODS_RETURN" ||
                returnItem.referenceType === "SUPPLIER_RETURN") &&
              returnItem.referenceDocumentId
            ) {
              try {
                console.log(
                  `Fetching PO details for ID: ${returnItem.referenceDocumentId}`
                );
                const poResponse = await getPurchaseOrderById(
                  returnItem.referenceDocumentId
                );

                if (poResponse.success && poResponse.data) {
                  const purchaseOrder = poResponse.data;
                  console.log("Purchase order data:", purchaseOrder);

                  // Extract bill number and date
                  if (purchaseOrder.billNumber) {
                    billNumber = purchaseOrder.billNumber;
                  }
                  if (purchaseOrder.billDate) {
                    billDate = purchaseOrder.billDate;
                  }

                  // Check if supplier info is directly in the PO
                  if (purchaseOrder.supplierName) {
                    supplierName = purchaseOrder.supplierName;
                  } else if (purchaseOrder.vendorName) {
                    // Bills use vendorName field
                    supplierName = purchaseOrder.vendorName;
                  } else if (purchaseOrder.partyId) {
                    // Bills use partyId field
                    const supplier = suppliers.find(
                      (s) => s.id === purchaseOrder.partyId
                    );
                    supplierName =
                      supplier?.name || `Party ID: ${purchaseOrder.partyId}`;
                  } else if (purchaseOrder.supplierId) {
                    // If only supplier ID, find name from suppliers list
                    const supplier = suppliers.find(
                      (s) => s.id === purchaseOrder.supplierId
                    );
                    supplierName =
                      supplier?.name ||
                      `Supplier ID: ${purchaseOrder.supplierId}`;
                  } else if (purchaseOrder.vendorId) {
                    // Or vendorId instead of supplierId
                    const supplier = suppliers.find(
                      (s) => s.id === purchaseOrder.vendorId
                    );
                    supplierName =
                      supplier?.name || `Vendor ID: ${purchaseOrder.vendorId}`;
                  }
                }
              } catch (error) {
                console.error(
                  `Error fetching PO ${returnItem.referenceDocumentId}:`,
                  error
                );
              }
            } else if (returnItem.partyId) {
              // Fallback to partyId if available
              const supplier = suppliers.find(
                (s) => s.id === returnItem.partyId
              );
              supplierName = supplier?.name || "Không xác định";
            } else if (returnItem.documentReference) {
              // Handle seeded data: parse supplier from documentReference (e.g., RT-TCTY-001)
              const supplierCodeMatch =
                returnItem.documentReference.match(/RT-([A-Z]+)-/);
              if (supplierCodeMatch) {
                const supplierCode = supplierCodeMatch[1];
                console.log("Extracted supplier code:", supplierCode);

                // Map supplier codes to names (based on the pattern seen in the data)
                const supplierCodeMap = {
                  TCTY: "Tổng Công Ty Phân Phối Máy Tính",
                  VLK: "Vua Linh Kiện Điện Tử",
                  ASIA: "Nhà Phân Phối Thiết Bị Văn Phòng Á Châu",
                };

                supplierName =
                  supplierCodeMap[supplierCode] ||
                  `Supplier Code: ${supplierCode}`;
              }
            }

            return {
              ...returnItem,
              supplierName,
              billNumber,
              billDate,
            };
          })
        );

        setEnrichedReturns(enrichedData);
        console.log("Enriched returns with supplier names:", enrichedData);
      } catch (error) {
        console.error("Error enriching returns with supplier names:", error);
        // Fallback to original data without supplier names
        setEnrichedReturns(
          returns.map((item) => ({
            ...item,
            supplierName: "Không xác định",
            billNumber: null,
            billDate: null,
          }))
        );
      } finally {
        setEnrichingData(false);
      }
    },
    [suppliers]
  );

  // Effect to enrich returns when stockMovements or suppliers change
  useEffect(() => {
    if (stockMovements && stockMovements.length > 0 && suppliers.length > 0) {
      enrichReturnsWithSupplierNames(stockMovements);
    } else {
      setEnrichedReturns([]);
    }
  }, [stockMovements, suppliers, enrichReturnsWithSupplierNames]);
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
    let filtered = [...(enrichedReturns || [])];

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
  }, [enrichedReturns, searchFilters]);

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
   * Format date only (without time)
   */
  const formatDate = useCallback((dateString) => {
    if (!dateString) return "-";

    const date = new Date(dateString);
    return new Intl.DateTimeFormat("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
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
   * Get supplier name by ID or from enriched data
   */
  const getSupplierName = useCallback(
    (returnItem) => {
      // If we have enriched data with supplier name, use it
      if (returnItem.supplierName) {
        return returnItem.supplierName;
      }

      // Fallback to party lookup
      if (returnItem.partyId) {
        const supplier = suppliers.find((s) => s.id === returnItem.partyId);
        return supplier?.name || "Không xác định";
      }

      return "Không xác định";
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
            disabled={loading || enrichingData}
            style={{ display: "block", width: "100%", marginBottom: 8 }}
          >
            {loading || enrichingData ? "Đang tìm..." : "🔍 Tìm kiếm"}
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
            {(loading || enrichingData) && (
              <div
                style={{ textAlign: "center", padding: "20px", color: "#666" }}
              >
                {enrichingData
                  ? "Đang tải thông tin nhà cung cấp..."
                  : "Đang tải dữ liệu..."}
              </div>
            )}
            {/* Returns Table */}
            {!loading && !enrichingData && (
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
                        <td>
                          {returnItem.billDate
                            ? formatDate(returnItem.billDate)
                            : formatDateTime(returnItem.movementDate)}
                        </td>
                        <td>{getSupplierName(returnItem)}</td>
                        <td className="fw-bold">
                          {getProductName(returnItem.productId)}
                        </td>
                        <td>{Math.abs(returnItem.quantity)}</td>
                        <td>
                          {returnItem.billNumber ||
                            returnItem.documentReference ||
                            "-"}
                        </td>
                        <td className="text-start">
                          {formatReturnNotes(returnItem.notes) || "-"}
                        </td>
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
                        {loading || enrichingData
                          ? "Đang tải..."
                          : "Không có dữ liệu phù hợp"}
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
                      {selectedReturn.billDate
                        ? formatDate(selectedReturn.billDate)
                        : formatDateTime(selectedReturn.movementDate)}
                    </p>
                    <p>
                      <strong>Nhà cung cấp:</strong>{" "}
                      {getSupplierName(selectedReturn)}
                    </p>
                    <p>
                      <strong>Tham chiếu:</strong>{" "}
                      {selectedReturn.billNumber ||
                        selectedReturn.documentReference ||
                        "-"}
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
                      <strong>Ghi chú:</strong>{" "}
                      {formatReturnNotes(selectedReturn.notes) || "-"}
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
