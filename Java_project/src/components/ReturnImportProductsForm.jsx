/**
 * Return Import Products Form Component
 * Handles post-receipt returning of goods to suppliers based on bills (like goods receipt)
 *
 * Features:
 * - Bill selection and search
 * - Product return quantity and reason specification
 * - Form validation and submission
 * - Auto-refresh after successful submission to fetch updated data
 */

import { useState, useEffect, useCallback } from "react";
import { useImportGoodsReturned } from "../hooks/useImportGoodsReturned.js";

const ReturnImportProductsForm = ({ isOpen, onClose, onSuccess }) => {
  // Form state (following goods receipt pattern)
  const [formData, setFormData] = useState({
    billId: "",
    supplierId: "",
    referenceNumber: "",
    returnedBy: "",
    notes: "",
    returnDate: new Date().toISOString().split("T")[0],
    lines: [],
  });
  // UI state
  const [selectedBill, setSelectedBill] = useState(null);
  const [errors, setErrors] = useState({});
  const [validationErrors, setValidationErrors] = useState([]);
  // Move billSearchTerm declaration above all useCallback hooks that use it
  const [billSearchTerm, setBillSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false); // New state for refresh loading
  const [showSuccessMessage, setShowSuccessMessage] = useState(false); // Success message state

  // Bill search state
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showBillSearch, setShowBillSearch] = useState(true);
  const [billPagination, setBillPagination] = useState({
    page: 0,
    size: 10,
    totalPages: 1,
    totalElements: 0,
  });

  const {
    recordGoodsReturn,
    loading: goodsReturnLoading,
    errors: goodsReturnErrors,
    searchReturnableBills,
    getReturnableBills,
    getBillForReturn,
  } = useImportGoodsReturned({
    onSuccess: async (response) => {
      console.log("Return submission successful, triggering auto-refresh..."); // Call parent success handler
      onSuccess && onSuccess(response);

      // Form will be reset and refreshed in handleSubmit after this callback
    },
    onError: (error) => {
      console.error("Return goods error:", error);
      setErrors({ submit: error.message });
    },
  });

  // Use loading state from useImportGoodsReturned hook
  const loading = goodsReturnLoading.recording;
  // Load returnable bills on component mount
  useEffect(() => {
    if (isOpen) {
      loadReturnableBills();
    }
  }, [isOpen]);

  // Debug: Track formData changes
  useEffect(() => {
    console.log("FormData updated:", formData);
  }, [formData]);

  // Reload bills when pagination changes
  useEffect(() => {
    if (isOpen && !billSearchTerm.trim()) {
      loadReturnableBills();
    }
  }, [billPagination.page, billPagination.size]);

  /**
   * Load bills that can be returned
   */
  const loadReturnableBills = useCallback(async () => {
    setIsSearching(true);
    try {
      const result = await getReturnableBills({
        page: billPagination.page,
        size: billPagination.size,
        sort: "billDate,desc",
      });

      if (result.success) {
        setSearchResults(result.data.content || []);
        setBillPagination((prev) => ({
          ...prev,
          totalPages: result.data.totalPages || 1,
          totalElements: result.data.totalElements || 0,
        }));
      } else {
        setErrors({ search: result.error });
      }
    } catch (error) {
      setErrors({ search: "Failed to load bills" });
    } finally {
      setIsSearching(false);
    }
  }, [getReturnableBills, billPagination.page, billPagination.size]);

  /**
   * Handle bill search
   */
  // billSearchTerm must be declared before this useCallback
  const handleBillSearch = useCallback(
    async (searchTerm) => {
      // Default to billSearchTerm if searchTerm is undefined
      const term =
        typeof searchTerm === "undefined" ? billSearchTerm : searchTerm;
      if (!term.trim()) {
        // If search term is empty, load all returnable bills
        await loadReturnableBills();
        return;
      }

      setIsSearching(true);
      try {
        const result = await searchReturnableBills(
          {
            billNumber: term,
            vendorName: term,
          },
          {
            page: 0,
            size: billPagination.size,
            sort: "billDate,desc",
          }
        );

        if (result.success) {
          setSearchResults(result.data.content || []);
          setBillPagination((prev) => ({
            ...prev,
            page: 0,
            totalPages: result.data.totalPages || 1,
            totalElements: result.data.totalElements || 0,
          }));
        } else {
          setErrors({ search: result.error });
        }
      } catch (error) {
        setErrors({ search: "Failed to search bills" });
      } finally {
        setIsSearching(false);
      }
    },
    [
      searchReturnableBills,
      billSearchTerm,
      billPagination.size,
      loadReturnableBills,
    ]
  );

  /**
   * Handle bill selection
   */ const handleBillSelect = useCallback(
    async (bill) => {
      try {
        // Fetch detailed bill information for return
        const billDetails = await getBillForReturn(bill.id);

        console.log("Bill details response:", billDetails); // Debug log

        if (billDetails.success) {
          console.log("Bill data:", billDetails.data); // Debug log
          console.log("Bill lines:", billDetails.data.lines); // Debug log
          console.log(
            "Bill lines details:",
            billDetails.data.lines?.map((line) => ({
              id: line.id,
              productId: line.productId,
              productName: line.productName,
              quantity: line.quantity,
              receivedQuantity: line.receivedQuantity,
              returnedQuantity: line.returnedQuantity,
            }))
          ); // Debug log

          setSelectedBill(billDetails.data);
          setShowBillSearch(false);

          // Update form data
          setFormData((prev) => ({
            ...prev,
            billId: bill.id,
            supplierId: billDetails.data.supplierId,
            referenceNumber: billDetails.data.billNumber || `#${bill.id}`,
            lines:
              billDetails.data.lines?.map((line) => ({
                ...line,
                quantityToReturn: 0,
                reason: "",
                // Use received quantity from stockledger instead of ordered quantity
                receivedQuantity: line.receivedQuantity || 0,
                returnedQuantity: line.returnedQuantity || 0,
                maxQuantity:
                  (line.receivedQuantity || 0) - (line.returnedQuantity || 0),
              })) || [],
          }));
        } else {
          setErrors({ billSelect: billDetails.error });
        }
      } catch (error) {
        setErrors({ billSelect: "Failed to load bill details" });
        console.error("Error loading bill details:", error);
      }
    },
    [getBillForReturn]
  );
  /**
   * Reset form to initial state
   */
  const resetForm = useCallback(() => {
    setFormData({
      billId: "",
      supplierId: "",
      referenceNumber: "",
      returnedBy: "",
      notes: "",
      returnDate: new Date().toISOString().split("T")[0],
      lines: [],
    });
    setSelectedBill(null);
    setShowBillSearch(true);
    setBillSearchTerm("");
    setSearchResults([]);
    setErrors({});
    setValidationErrors([]);
    setIsRefreshing(false); // Reset refresh state
    setShowSuccessMessage(false); // Reset success message
  }, []);
  /**
   * Validate form before submission
   */
  const validateForm = useCallback(() => {
    const errors = [];

    console.log("Validating form with data:", formData); // Debug log    console.log("Selected bill:", selectedBill); // Debug log

    if (!selectedBill) {
      errors.push("Vui lòng chọn phiếu nhập hàng");
    }

    // Validate billId
    const billId =
      formData.billId && formData.billId.toString().trim() !== ""
        ? formData.billId
        : selectedBill?.id;
    if (!billId) {
      errors.push("Không tìm thấy ID phiếu nhập hàng");
    }

    if (!formData.returnDate) {
      errors.push("Vui lòng chọn ngày trả hàng");
    }

    const validLines = formData.lines.filter(
      (line) => line.quantityToReturn > 0
    );
    console.log("Valid lines with quantity > 0:", validLines); // Debug log

    if (validLines.length === 0) {
      errors.push("Vui lòng chọn ít nhất một sản phẩm để trả về");
    }

    formData.lines.forEach((line, index) => {
      if (line.quantityToReturn > 0) {
        if (!line.reason || line.reason.trim() === "") {
          errors.push(`Dòng ${index + 1}: Vui lòng nhập lý do trả hàng`);
        }

        if (line.quantityToReturn > line.maxQuantity) {
          errors.push(
            `Dòng ${
              index + 1
            }: Số lượng trả về không được vượt quá số lượng có thể trả (${
              line.maxQuantity
            })`
          );
        }
      }
    });
    console.log("Validation errors:", errors); // Debug log
    setValidationErrors(errors);
    return errors.length === 0;
  }, [selectedBill, formData]);

  // Auto-refresh function to reload bill data after successful submission
  const refreshBillData = useCallback(async () => {
    setIsRefreshing(true);
    setShowSuccessMessage(true);
    try {
      console.log("Auto-refreshing bill data after successful submission...");

      // Reset pagination to first page to see latest changes
      setBillPagination((prev) => ({
        ...prev,
        page: 0,
      }));

      // Reload bill list based on current search state
      if (billSearchTerm.trim()) {
        await handleBillSearch(billSearchTerm);
      } else {
        await loadReturnableBills();
      }

      console.log("Bill data refreshed successfully");

      // Hide success message after a delay
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to refresh bill data:", error);
      setShowSuccessMessage(false);
      // Don't show error to user as this is background refresh
    } finally {
      setIsRefreshing(false);
    }
  }, [billSearchTerm, loadReturnableBills, handleBillSearch]);

  /**
   * Handle form submission
   */ const handleSubmit = useCallback(async () => {
    console.log("Form data before validation:", formData); // Debug log
    console.log("Selected bill before validation:", selectedBill); // Debug log

    if (!validateForm()) return;
    try {
      // Use selectedBill.id if formData.billId is not available or empty
      const billId =
        formData.billId && formData.billId.toString().trim() !== ""
          ? formData.billId
          : selectedBill?.id;

      console.log("Resolved billId:", billId); // Debug log

      if (!billId) {
        throw new Error("No valid bill ID found");
      }

      // Prepare return data
      const returnData = {
        billId: billId,
        supplierId: formData.supplierId || selectedBill?.supplierId,
        returnDate: formData.returnDate,
        returnedBy: formData.returnedBy || "System",
        notes: formData.notes,
        lines: formData.lines
          .filter((line) => line.quantityToReturn > 0)
          .map((line) => {
            console.log("Processing line for submission:", {
              id: line.id,
              productId: line.productId,
              productName: line.productName,
              quantityToReturn: line.quantityToReturn,
              unitPrice: line.unitPrice,
              reason: line.reason,
            }); // Debug log

            return {
              productId: line.productId,
              quantity: line.quantityToReturn,
              unitPrice: line.unitPrice,
              reason: line.reason,
              originalLineId: line.id,
            };
          }),
      };
      console.log("Submitting return data:", returnData); // Debug log

      const result = await recordGoodsReturn(returnData);
      console.log("Return submission result:", result); // Debug log

      // If submission was successful, handle post-submission logic
      if (result) {
        console.log("Return submission successful, triggering auto-refresh...");

        // Reset form state
        resetForm();

        // Auto-refresh bill data to reflect updated quantities
        await refreshBillData();

        // Close the form after refresh
        onClose();
      }
    } catch (error) {
      console.error("Error submitting return:", error);
      setErrors({ submit: error.message });
    }
  }, [
    validateForm,
    recordGoodsReturn,
    formData,
    selectedBill,
    resetForm,
    refreshBillData,
    onClose,
  ]);

  /**
   * Handle close
   */ const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        className="modal-content"
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          width: "90%",
          maxWidth: "1200px",
          maxHeight: "90vh",
          overflow: "auto",
          padding: "24px",
        }}
      >
        {" "}
        {/* Header */}
        <div
          style={{
            marginBottom: "24px",
            borderBottom: "1px solid #eee",
            paddingBottom: "16px",
          }}
        >
          {" "}
          <h2 style={{ margin: 0, color: "#333" }}>Tạo Phiếu Trả Hàng Nhập</h2>
          <p style={{ margin: "8px 0 0 0", color: "#666" }}>
            Trả hàng đã nhập về cho nhà cung cấp
          </p>{" "}
        </div>
        {/* Success Message */}
        {showSuccessMessage && (
          <div
            style={{
              backgroundColor: "#d4edda",
              border: "1px solid #c3e6cb",
              borderRadius: "4px",
              padding: "12px",
              marginBottom: "16px",
              color: "#155724",
            }}
          >
            <p style={{ margin: 0 }}>
              ✓ Phiếu trả hàng đã được tạo thành công! Đang làm mới dữ liệu...
            </p>
          </div>
        )}
        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div
            style={{
              backgroundColor: "#fee",
              border: "1px solid #fcc",
              borderRadius: "4px",
              padding: "12px",
              marginBottom: "16px",
            }}
          >
            <h4 style={{ margin: "0 0 8px 0", color: "#c33" }}>
              Vui lòng kiểm tra:
            </h4>
            <ul style={{ margin: 0, paddingLeft: "20px" }}>
              {validationErrors.map((error, index) => (
                <li key={index} style={{ color: "#c33" }}>
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}
        {/* API Errors */}
        {(errors.submit || errors.billSelect || errors.search) && (
          <div
            style={{
              backgroundColor: "#fee",
              border: "1px solid #fcc",
              borderRadius: "4px",
              padding: "12px",
              marginBottom: "16px",
            }}
          >
            <p style={{ margin: 0, color: "#c33" }}>
              {errors.submit || errors.billSelect || errors.search}
            </p>
          </div>
        )}
        {/* Bill Search and Selection Section */}
        {showBillSearch && (
          <div style={{ marginBottom: "24px" }}>
            <h3 style={{ marginBottom: "16px", color: "#333" }}>
              Chọn phiếu nhập hàng để trả
            </h3>

            {/* Search Input */}
            <div style={{ marginBottom: "16px", display: "flex", gap: "12px" }}>
              <input
                type="text"
                placeholder="Tìm kiếm theo số phiếu hoặc nhà cung cấp..."
                value={billSearchTerm}
                onChange={(e) => setBillSearchTerm(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleBillSearch();
                  }
                }}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
                className="bg-light"
              />{" "}
              <button
                onClick={() => handleBillSearch()}
                disabled={isSearching || isRefreshing}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor:
                    isSearching || isRefreshing ? "not-allowed" : "pointer",
                  fontSize: "14px",
                }}
              >
                {isSearching
                  ? "Đang tìm..."
                  : isRefreshing
                  ? "Làm mới..."
                  : "Tìm kiếm"}
              </button>{" "}
              <button
                onClick={() => {
                  setBillSearchTerm("");
                  loadReturnableBills();
                }}
                disabled={isSearching || isRefreshing}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor:
                    isSearching || isRefreshing ? "not-allowed" : "pointer",
                  fontSize: "14px",
                }}
              >
                {isRefreshing ? "Đang làm mới..." : "Làm mới"}
              </button>
            </div>

            {/* Search Results */}
            <div
              style={{
                border: "1px solid #ddd",
                borderRadius: "4px",
                maxHeight: "400px",
                overflow: "auto",
              }}
            >
              {" "}
              {isSearching || isRefreshing ? (
                <div style={{ padding: "20px", textAlign: "center" }}>
                  <p>
                    {isRefreshing
                      ? "Đang làm mới danh sách phiếu nhập..."
                      : "Đang tải danh sách phiếu nhập..."}
                  </p>
                </div>
              ) : searchResults.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center" }}>
                  <p style={{ color: "#666" }}>
                    Không tìm thấy phiếu nhập nào có thể trả hàng
                  </p>
                </div>
              ) : (
                <div>
                  {/* Bill List */}
                  {searchResults.map((bill) => (
                    <div
                      key={bill.id}
                      onClick={() => handleBillSelect(bill)}
                      style={{
                        padding: "12px 16px",
                        borderBottom: "1px solid #eee",
                        cursor: "pointer",
                        backgroundColor: "white",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = "#f8f9fa";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = "white";
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: "500", marginBottom: "4px" }}>
                          {bill.billNumber || `Phiếu #${bill.id}`}
                        </div>
                        <div style={{ fontSize: "12px", color: "#666" }}>
                          Nhà cung cấp: {bill.supplierName || "Không xác định"}
                        </div>
                        <div style={{ fontSize: "12px", color: "#666" }}>
                          Ngày nhập:{" "}
                          {bill.billDate
                            ? new Date(bill.billDate).toLocaleDateString(
                                "vi-VN"
                              )
                            : "N/A"}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "14px", fontWeight: "500" }}>
                          {bill.totalAmount?.toLocaleString("vi-VN")} đ
                        </div>
                        <div style={{ fontSize: "12px", color: "#666" }}>
                          {bill.totalLines || 0} sản phẩm
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Pagination */}
                  {billPagination.totalPages > 1 && (
                    <div
                      style={{
                        padding: "12px 16px",
                        borderTop: "1px solid #eee",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        backgroundColor: "#f8f9fa",
                      }}
                    >
                      <div style={{ fontSize: "12px", color: "#666" }}>
                        Trang {billPagination.page + 1} /{" "}
                        {billPagination.totalPages}(
                        {billPagination.totalElements} phiếu)
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() =>
                            setBillPagination((prev) => ({
                              ...prev,
                              page: Math.max(0, prev.page - 1),
                            }))
                          }
                          disabled={billPagination.page === 0}
                          style={{
                            padding: "4px 8px",
                            border: "1px solid #ddd",
                            borderRadius: "4px",
                            backgroundColor: "white",
                            cursor:
                              billPagination.page === 0
                                ? "not-allowed"
                                : "pointer",
                            fontSize: "12px",
                          }}
                        >
                          Trước
                        </button>
                        <button
                          onClick={() =>
                            setBillPagination((prev) => ({
                              ...prev,
                              page: Math.min(
                                prev.totalPages - 1,
                                prev.page + 1
                              ),
                            }))
                          }
                          disabled={
                            billPagination.page >= billPagination.totalPages - 1
                          }
                          style={{
                            padding: "4px 8px",
                            border: "1px solid #ddd",
                            borderRadius: "4px",
                            backgroundColor: "white",
                            cursor:
                              billPagination.page >=
                              billPagination.totalPages - 1
                                ? "not-allowed"
                                : "pointer",
                            fontSize: "12px",
                          }}
                        >
                          Sau
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        {/* Selected Bill Details and Return Configuration */}
        {selectedBill && (
          <div style={{ marginBottom: "24px" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "24px",
                marginBottom: "24px",
              }}
            >
              {/* Left Column - Bill Details and Return Info */}
              <div>
                {/* Selected Bill Information */}
                <div
                  style={{
                    marginBottom: "16px",
                    padding: "12px",
                    backgroundColor: "#f8f9fa",
                    borderRadius: "4px",
                  }}
                >
                  <h4 style={{ margin: "0 0 8px 0", color: "#333" }}>
                    Thông tin phiếu nhập
                  </h4>
                  <div style={{ fontSize: "14px", color: "#666" }}>
                    <div>
                      <strong>Số phiếu:</strong>{" "}
                      {selectedBill.billNumber || `#${selectedBill.id}`}
                    </div>
                    <div>
                      <strong>Nhà cung cấp:</strong> {selectedBill.supplierName}
                    </div>
                    <div>
                      <strong>Ngày nhập:</strong>{" "}
                      {selectedBill.billDate
                        ? new Date(selectedBill.billDate).toLocaleDateString(
                            "vi-VN"
                          )
                        : "N/A"}
                    </div>
                    <div>
                      <strong>Tổng tiền:</strong>{" "}
                      {selectedBill.totalAmount?.toLocaleString("vi-VN")} đ
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedBill(null);
                      setShowBillSearch(true);
                      setFormData((prev) => ({
                        ...prev,
                        billId: "",
                        lines: [],
                      }));
                    }}
                    style={{
                      marginTop: "8px",
                      padding: "4px 8px",
                      backgroundColor: "#6c757d",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    Chọn phiếu khác
                  </button>
                </div>

                {/* Return Date and Additional Info */}
                <div style={{ marginBottom: "16px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: "500",
                    }}
                  >
                    Ngày trả hàng *
                  </label>
                  <input
                    type="date"
                    value={formData.returnDate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        returnDate: e.target.value,
                      }))
                    }
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      fontSize: "14px",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: "500",
                    }}
                  >
                    Người tạo phiếu
                  </label>
                  <input
                    type="text"
                    placeholder="Nhập tên người tạo phiếu..."
                    value={formData.returnedBy}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        returnedBy: e.target.value,
                      }))
                    }
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      fontSize: "14px",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: "500",
                    }}
                  >
                    Ghi chú
                  </label>
                  <textarea
                    placeholder="Nhập ghi chú..."
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      fontSize: "14px",
                      resize: "vertical",
                    }}
                  />
                </div>
              </div>

              {/* Right Column - Return Line Items */}
              <div>
                <h3 style={{ marginBottom: "16px" }}>Chi tiết trả hàng</h3>

                {formData.lines.length === 0 ? (
                  <div
                    style={{
                      padding: "20px",
                      textAlign: "center",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      color: "#666",
                    }}
                  >
                    Chưa có sản phẩm nào để trả
                  </div>
                ) : (
                  <div
                    style={{
                      maxHeight: "400px",
                      overflowY: "auto",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                    }}
                  >
                    {formData.lines.map((line, index) => (
                      <div
                        key={index}
                        style={{
                          padding: "12px",
                          borderBottom:
                            index < formData.lines.length - 1
                              ? "1px solid #eee"
                              : "none",
                        }}
                      >
                        <div style={{ marginBottom: "8px" }}>
                          <div
                            style={{ fontWeight: "500", marginBottom: "4px" }}
                          >
                            {line.productName}
                          </div>{" "}
                          <div style={{ fontSize: "12px", color: "#666" }}>
                            Đã nhận: {line.receivedQuantity} | Đã trả:{" "}
                            {line.returnedQuantity} | Có thể trả:{" "}
                            {line.maxQuantity}
                          </div>
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "8px",
                            marginBottom: "8px",
                          }}
                        >
                          <div>
                            <label
                              style={{
                                display: "block",
                                fontSize: "12px",
                                marginBottom: "4px",
                              }}
                            >
                              Số lượng trả
                            </label>
                            <input
                              type="number"
                              min="0"
                              max={line.maxQuantity}
                              value={line.quantityToReturn || ""}
                              onChange={(e) => {
                                const quantity = Math.max(
                                  0,
                                  Math.min(
                                    line.maxQuantity,
                                    parseInt(e.target.value) || 0
                                  )
                                );
                                setFormData((prev) => ({
                                  ...prev,
                                  lines: prev.lines.map((l, i) =>
                                    i === index
                                      ? { ...l, quantityToReturn: quantity }
                                      : l
                                  ),
                                }));
                              }}
                              style={{
                                width: "100%",
                                padding: "6px 8px",
                                border: "1px solid #ddd",
                                borderRadius: "4px",
                                fontSize: "12px",
                              }}
                            />
                          </div>
                          <div>
                            <label
                              style={{
                                display: "block",
                                fontSize: "12px",
                                marginBottom: "4px",
                              }}
                            >
                              Đơn giá
                            </label>
                            <input
                              type="text"
                              value={
                                line.unitPrice?.toLocaleString("vi-VN") || "0"
                              }
                              disabled
                              style={{
                                width: "100%",
                                padding: "6px 8px",
                                border: "1px solid #ddd",
                                borderRadius: "4px",
                                fontSize: "12px",
                                backgroundColor: "#f8f9fa",
                                color: "#666",
                              }}
                            />
                          </div>
                        </div>

                        <div>
                          <label
                            style={{
                              display: "block",
                              fontSize: "12px",
                              marginBottom: "4px",
                            }}
                          >
                            Lý do trả *
                          </label>
                          <input
                            type="text"
                            placeholder="Nhập lý do trả hàng..."
                            value={line.reason || ""}
                            onChange={(e) => {
                              setFormData((prev) => ({
                                ...prev,
                                lines: prev.lines.map((l, i) =>
                                  i === index
                                    ? { ...l, reason: e.target.value }
                                    : l
                                ),
                              }));
                            }}
                            style={{
                              width: "100%",
                              padding: "6px 8px",
                              border: "1px solid #ddd",
                              borderRadius: "4px",
                              fontSize: "12px",
                            }}
                          />
                        </div>

                        {line.quantityToReturn > 0 && (
                          <div
                            style={{
                              marginTop: "8px",
                              fontSize: "12px",
                              color: "#666",
                            }}
                          >
                            Thành tiền:{" "}
                            {(
                              (line.quantityToReturn || 0) *
                              (line.unitPrice || 0)
                            ).toLocaleString("vi-VN")}{" "}
                            đ
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Return Summary */}
            {formData.lines.some((line) => line.quantityToReturn > 0) && (
              <div style={{ marginBottom: "24px" }}>
                <h3 style={{ marginBottom: "16px" }}>Tổng quan trả hàng</h3>
                <div
                  style={{
                    padding: "16px",
                    backgroundColor: "#f8f9fa",
                    borderRadius: "4px",
                    border: "1px solid #ddd",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: "16px",
                      textAlign: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "14px", color: "#666" }}>
                        Tổng sản phẩm
                      </div>
                      <div style={{ fontSize: "18px", fontWeight: "500" }}>
                        {
                          formData.lines.filter(
                            (line) => line.quantityToReturn > 0
                          ).length
                        }
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "14px", color: "#666" }}>
                        Tổng số lượng
                      </div>
                      <div style={{ fontSize: "18px", fontWeight: "500" }}>
                        {formData.lines.reduce(
                          (sum, line) => sum + (line.quantityToReturn || 0),
                          0
                        )}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "14px", color: "#666" }}>
                        Tổng tiền
                      </div>
                      <div style={{ fontSize: "18px", fontWeight: "500" }}>
                        {formData.lines
                          .reduce(
                            (sum, line) =>
                              sum +
                              (line.quantityToReturn || 0) *
                                (line.unitPrice || 0),
                            0
                          )
                          .toLocaleString("vi-VN")}{" "}
                        đ
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {/* Action Buttons */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "24px",
            paddingTop: "16px",
            borderTop: "1px solid #eee",
          }}
        >
          <div>
            {loading && <span style={{ color: "#666" }}>Đang xử lý...</span>}
            {isRefreshing && (
              <span style={{ color: "#17a2b8" }}>Đang làm mới dữ liệu...</span>
            )}
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={handleClose}
              disabled={loading || isRefreshing}
              style={{
                padding: "8px 16px",
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              disabled={
                loading ||
                isRefreshing ||
                !selectedBill ||
                !formData.lines.some((line) => line.quantityToReturn > 0)
              }
              style={{
                padding: "8px 16px",
                backgroundColor:
                  !selectedBill ||
                  !formData.lines.some((line) => line.quantityToReturn > 0)
                    ? "#ccc"
                    : "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor:
                  !selectedBill ||
                  !formData.lines.some((line) => line.quantityToReturn > 0)
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {loading
                ? "Đang tạo..."
                : isRefreshing
                ? "Làm mới dữ liệu..."
                : "Tạo phiếu trả hàng"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReturnImportProductsForm;
