/**
 * Goods Receipt Form Component
 * Supports multiline goods receipt creation with quantityAccepted, quantityRejected, and rejectionReason
 */

import { useState, useEffect, useCallback } from "react";
import { useBillManagement } from "../hooks/useBillManagement.js";
import { useGoodsReceipt } from "../hooks/useGoodsReceipt.js";

const GoodsReceiptForm = ({ isOpen, onClose, onSuccess }) => {
  const {
    bills,
    loadBills,
    loading: billLoading,
    errors: billErrors,
  } = useBillManagement({
    autoLoad: true,
  });
  const {
    recordGoodsReceipt,
    loading: goodsReceiptLoading,
    errors: goodsReceiptErrors,
  } = useGoodsReceipt({
    onSuccess: (response) => {
      // Mark the bill as processed
      if (formData.billId) {
        markBillAsProcessed(parseInt(formData.billId));
      }
      onSuccess && onSuccess(response);
      resetForm();
      onClose();
    },
    onError: (error) => {
      console.error("Goods receipt error:", error);
      setErrors({ submit: error.message });
    },
  });

  // Form state
  const [formData, setFormData] = useState({
    billId: "",
    supplierId: "",
    referenceNumber: "",
    receivedBy: "",
    notes: "",
    lines: [],
  }); // UI state
  const [selectedBill, setSelectedBill] = useState(null);
  const [errors, setErrors] = useState({});
  const [validationErrors, setValidationErrors] = useState([]);
  const [billSearchTerm, setBillSearchTerm] = useState("");
  const [processedBillIds, setProcessedBillIds] = useState(new Set());
  // Use loading state from useGoodsReceipt hook
  const loading = goodsReceiptLoading.recording;

  // Load processed bill IDs from localStorage on component mount
  useEffect(() => {
    const savedProcessedBills = localStorage.getItem("processedBillIds");
    if (savedProcessedBills) {
      try {
        const parsedIds = JSON.parse(savedProcessedBills);
        setProcessedBillIds(new Set(parsedIds));
      } catch (error) {
        console.error("Error loading processed bill IDs:", error);
        setProcessedBillIds(new Set());
      }
    }
  }, []);

  // Save processed bill IDs to localStorage whenever it changes
  useEffect(() => {
    if (processedBillIds.size > 0) {
      localStorage.setItem(
        "processedBillIds",
        JSON.stringify([...processedBillIds])
      );
    }
  }, [processedBillIds]);

  /**
   * Mark a bill as processed
   */
  const markBillAsProcessed = useCallback((billId) => {
    setProcessedBillIds((prev) => new Set([...prev, billId]));
  }, []);

  /**
   * Remove a bill from processed list (for cases where processing failed)
   */
  const unmarkBillAsProcessed = useCallback((billId) => {
    setProcessedBillIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(billId);
      return newSet;
    });
  }, []);

  /**
   * Clear all processed bills (admin function)
   */ const clearProcessedBills = useCallback(() => {
    setProcessedBillIds(new Set());
    localStorage.removeItem("processedBillIds");
  }, []);

  /**
   * Filter bills based on search term and exclude processed bills
   */
  const filteredBills = (bills || []).filter((bill) => {
    // Exclude processed bills
    if (processedBillIds.has(bill.id)) {
      return false;
    }

    // Only show pending bills
    if (bill.status !== "PENDING") {
      return false;
    }

    // Apply search filter
    if (!billSearchTerm) return true;

    const searchLower = billSearchTerm.toLowerCase();
    return (
      bill.billNumber?.toLowerCase().includes(searchLower) ||
      bill.vendorName?.toLowerCase().includes(searchLower) ||
      bill.totalAmount?.toString().includes(searchLower)
    );
  });

  // Debug logging
  useEffect(() => {
    console.log("GoodsReceiptForm - Bills:", bills);
    console.log("GoodsReceiptForm - Bill Loading:", billLoading);
    console.log("GoodsReceiptForm - Bill Errors:", billErrors);
    console.log("GoodsReceiptForm - Processed Bill IDs:", processedBillIds);
    console.log(
      "GoodsReceiptForm - Filtered Bills Count:",
      filteredBills.length
    );

    // Check if bills array is empty and not loading
    if (!billLoading.bills && bills.length === 0) {
      console.warn("No bills found. Attempting to manually reload bills...");
      loadBills();
    }
  }, [
    bills,
    billLoading,
    billErrors,
    loadBills,
    processedBillIds,
    filteredBills,
  ]);

  /**
   * Reset form to initial state
   */
  const resetForm = useCallback(() => {
    setFormData({
      billId: "",
      supplierId: "",
      referenceNumber: "",
      receivedBy: "",
      notes: "",
      lines: [],
    });
    setSelectedBill(null);
    setErrors({});
    setValidationErrors([]);
    setBillSearchTerm("");
  }, []);
  /**
   * Handle bill selection
   */
  const handleBillSelect = useCallback((bill) => {
    if (!bill) return;

    setSelectedBill(bill);

    // Auto-generate reference number
    const referenceNumber = `GR-${bill.billNumber || "UNKNOWN"}-${Date.now()
      .toString()
      .slice(-4)}`;

    // Create lines from bill lines (with safety checks)
    const lines = (bill.billLines || []).map((billLine) => ({
      billLineId: billLine.id,
      billId: bill.id,
      productId: billLine.productId,
      productName: billLine.productName || "Unknown Product",
      orderedQuantity: billLine.quantity || 0,
      quantityAccepted: billLine.quantity || 0, // Default to full quantity
      quantityRejected: 0,
      rejectionReason: "",
    }));

    setFormData((prev) => ({
      ...prev,
      billId: bill.id,
      supplierId: bill.partyId || bill.vendorId || "",
      referenceNumber,
      lines,
    }));
  }, []);

  /**
   * Handle line data changes
   */
  const handleLineChange = useCallback((index, field, value) => {
    setFormData((prev) => {
      const newLines = [...prev.lines];
      const line = { ...newLines[index] };

      line[field] = value;

      // Auto-calculate quantities
      if (field === "quantityAccepted" || field === "quantityRejected") {
        const accepted =
          parseFloat(
            field === "quantityAccepted" ? value : line.quantityAccepted
          ) || 0;
        const rejected =
          parseFloat(
            field === "quantityRejected" ? value : line.quantityRejected
          ) || 0;

        // Ensure total doesn't exceed ordered quantity
        const total = accepted + rejected;
        if (total > line.orderedQuantity) {
          if (field === "quantityAccepted") {
            line.quantityRejected = Math.max(
              0,
              line.orderedQuantity - accepted
            );
          } else {
            line.quantityAccepted = Math.max(
              0,
              line.orderedQuantity - rejected
            );
          }
        }
      }

      newLines[index] = line;
      return { ...prev, lines: newLines };
    });
  }, []);

  /**
   * Add new line
   */
  const addLine = useCallback(() => {
    if (!selectedBill) return;

    const newLine = {
      billLineId: null,
      billId: selectedBill.id,
      productId: "",
      productName: "",
      orderedQuantity: 0,
      quantityAccepted: 0,
      quantityRejected: 0,
      rejectionReason: "",
    };

    setFormData((prev) => ({
      ...prev,
      lines: [...prev.lines, newLine],
    }));
  }, [selectedBill]);

  /**
   * Remove line
   */
  const removeLine = useCallback((index) => {
    setFormData((prev) => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index),
    }));
  }, []);

  /**
   * Validate form data
   */
  const validateForm = useCallback(() => {
    const errors = [];

    if (!formData.billId) {
      errors.push("Vui lòng chọn hóa đơn");
    }

    if (!formData.referenceNumber.trim()) {
      errors.push("Vui lòng nhập số tham chiếu");
    }

    if (!formData.receivedBy.trim()) {
      errors.push("Vui lòng nhập người nhận");
    }

    if (formData.lines.length === 0) {
      errors.push("Phải có ít nhất một dòng sản phẩm");
    }

    formData.lines.forEach((line, index) => {
      if (!line.productId) {
        errors.push(`Dòng ${index + 1}: Vui lòng chọn sản phẩm`);
      }

      const accepted = parseFloat(line.quantityAccepted) || 0;
      const rejected = parseFloat(line.quantityRejected) || 0;
      const total = accepted + rejected;

      if (total === 0) {
        errors.push(
          `Dòng ${index + 1}: Số lượng nhận hoặc từ chối phải lớn hơn 0`
        );
      }

      if (total > line.orderedQuantity) {
        errors.push(
          `Dòng ${index + 1}: Tổng số lượng không được vượt quá số đặt hàng`
        );
      }

      if (rejected > 0 && !line.rejectionReason.trim()) {
        errors.push(`Dòng ${index + 1}: Vui lòng nhập lý do từ chối`);
      }
    });

    setValidationErrors(errors);
    return errors.length === 0;
  }, [formData]);
  /**
   * Submit goods receipt
   */
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    setErrors({});

    try {
      // Prepare data according to the bill-based structure expected by flow.md
      const goodsReceiptData = {
        supplierId: formData.supplierId,
        referenceNumber: formData.referenceNumber,
        billId: formData.billId,
        lines: formData.lines,
        receivedBy: formData.receivedBy,
        notes: formData.notes,
      };

      await recordGoodsReceipt(goodsReceiptData);
    } catch (error) {
      console.error("Error submitting goods receipt:", error);
      setErrors({ submit: error.message });
    }
  }, [formData, validateForm, recordGoodsReceipt]);

  /**
   * Handle close
   */
  const handleClose = useCallback(() => {
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
          padding: "0",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px",
            borderBottom: "1px solid #dee2e6",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "#f8f9fa",
          }}
        >
          <h3 style={{ margin: 0, color: "#495057" }}>Tạo Phiếu Nhập Hàng</h3>
          <button
            onClick={handleClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: "#6c757d",
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "20px" }}>
          {" "}
          {/* Validation Errors */}
          {(validationErrors.length > 0 ||
            goodsReceiptErrors.validation.length > 0) && (
            <div
              style={{
                backgroundColor: "#f8d7da",
                color: "#721c24",
                padding: "10px",
                borderRadius: "4px",
                marginBottom: "20px",
                border: "1px solid #f5c6cb",
              }}
            >
              <strong>Lỗi xác thực:</strong>
              <ul style={{ margin: "5px 0 0 0", paddingLeft: "20px" }}>
                {validationErrors.map((error, index) => (
                  <li key={`local-${index}`}>{error}</li>
                ))}
                {goodsReceiptErrors.validation.map((error, index) => (
                  <li key={`hook-${index}`}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          {/* Bill Loading Errors */}
          {billErrors.bills && (
            <div
              style={{
                backgroundColor: "#f8d7da",
                color: "#721c24",
                padding: "10px",
                borderRadius: "4px",
                marginBottom: "20px",
                border: "1px solid #f5c6cb",
              }}
            >
              <strong>Lỗi tải hóa đơn:</strong> {billErrors.bills}
            </div>
          )}
          {/* Submit Errors */}
          {(errors.submit || goodsReceiptErrors.recording) && (
            <div
              style={{
                backgroundColor: "#f8d7da",
                color: "#721c24",
                padding: "10px",
                borderRadius: "4px",
                marginBottom: "20px",
                border: "1px solid #f5c6cb",
              }}
            >
              <strong>Lỗi:</strong>{" "}
              {errors.submit || goodsReceiptErrors.recording}
            </div>
          )}
          {/* Form Fields */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
              marginBottom: "20px",
            }}
          >
            {" "}
            {/* Bill Selection with Search */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "bold",
                }}
              >
                Chọn Hóa Đơn <span style={{ color: "red" }}>*</span>
              </label>

              {/* Search Input */}
              <input
                type="text"
                value={billSearchTerm}
                onChange={(e) => setBillSearchTerm(e.target.value)}
                placeholder="Tìm kiếm hóa đơn theo số, nhà cung cấp hoặc tổng tiền..."
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ced4da",
                  borderRadius: "4px",
                  marginBottom: "5px",
                  fontSize: "14px",
                }}
                className="bg-light"
              />

              {/* Bill Selection */}
              <select
                value={formData.billId}
                onChange={(e) => {
                  const bill = bills.find(
                    (b) => b.id === parseInt(e.target.value)
                  );
                  handleBillSelect(bill);
                }}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ced4da",
                  borderRadius: "4px",
                }}
                disabled={billLoading.bills}
                className="bg-light text-dark"
              >
                <option value="">
                  {billLoading.bills ? "Đang tải..." : "Chọn hóa đơn..."}
                </option>
                {filteredBills.map((bill) => (
                  <option key={bill.id} value={bill.id}>
                    {" "}
                    {bill.billNumber} - {bill.vendorName} (
                    {bill.totalAmount.toLocaleString("vi-VN")}đ)
                  </option>
                ))}
              </select>

              {/* Show loading or no results message */}
              {billSearchTerm &&
                filteredBills.length === 0 &&
                !billLoading.bills && (
                  <div
                    style={{
                      padding: "8px",
                      marginTop: "5px",
                      backgroundColor: "#f8f9fa",
                      border: "1px solid #dee2e6",
                      borderRadius: "4px",
                      fontSize: "14px",
                      color: "#6c757d",
                    }}
                  >
                    {" "}
                    Không tìm thấy hóa đơn nào phù hợp với "{billSearchTerm}"
                  </div>
                )}

              {/* Show no bills available message with reload button */}
              {!billLoading.bills &&
                filteredBills.length === 0 &&
                !billSearchTerm && (
                  <div
                    style={{
                      padding: "12px",
                      marginTop: "5px",
                      backgroundColor: "#fff3cd",
                      border: "1px solid #ffeaa7",
                      borderRadius: "4px",
                      fontSize: "14px",
                      color: "#856404",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>Không có hóa đơn nào để chọn</span>
                    <button
                      type="button"
                      onClick={() => loadBills()}
                      style={{
                        padding: "4px 8px",
                        backgroundColor: "#007bff",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      Tải lại{" "}
                    </button>
                  </div>
                )}

              {/* Processed Bills Information */}
              {processedBillIds.size > 0 && (
                <div
                  style={{
                    padding: "8px",
                    marginTop: "5px",
                    backgroundColor: "#d1ecf1",
                    border: "1px solid #bee5eb",
                    borderRadius: "4px",
                    fontSize: "12px",
                    color: "#0c5460",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span>
                    {processedBillIds.size} hóa đơn đã được xử lý (đã ẩn)
                  </span>
                  <button
                    type="button"
                    onClick={clearProcessedBills}
                    style={{
                      padding: "2px 6px",
                      backgroundColor: "#6c757d",
                      color: "white",
                      border: "none",
                      borderRadius: "3px",
                      fontSize: "11px",
                      cursor: "pointer",
                    }}
                    title="Xóa danh sách hóa đơn đã xử lý (chỉ dành cho admin)"
                  >
                    Reset
                  </button>
                </div>
              )}
            </div>
            {/* Reference Number */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "bold",
                }}
              >
                Số Tham Chiếu <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="text"
                className='text-dark bg-light'
                value={formData.referenceNumber}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    referenceNumber: e.target.value,
                  }))
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ced4da",
                  borderRadius: "4px",
                }}
                placeholder="Nhập số tham chiếu..."
              />
            </div>
            {/* Received By */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "bold",
                }}
              >
                Người Nhận <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="text"
                value={formData.receivedBy}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    receivedBy: e.target.value,
                  }))
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ced4da",
                  borderRadius: "4px",
                }}
                placeholder="Nhập tên người nhận..."
                className="bg-light text-dark"
              />
            </div>
            {/* Notes */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "bold",
                }}
              >
                Ghi Chú
              </label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ced4da",
                  borderRadius: "4px",
                }}
                placeholder="Nhập ghi chú..."
                className="bg-light text-dark"
              />
            </div>
          </div>
          {/* Lines Section */}
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "15px",
              }}
            >
              <h4 style={{ margin: 0 }}>Chi Tiết Sản Phẩm</h4>
              <button
                type="button"
                onClick={addLine}
                disabled={!selectedBill}
                style={{
                  backgroundColor: "#28a745",
                  color: "white",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                + Thêm Dòng
              </button>
            </div>

            {formData.lines.length > 0 ? (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    border: "1px solid #dee2e6",
                  }}
                >
                  <thead>
                    <tr style={{ backgroundColor: "#f8f9fa" }}>
                      <th
                        style={{
                          padding: "10px",
                          border: "1px solid #dee2e6",
                          textAlign: "left",
                        }}
                      >
                        Sản Phẩm
                      </th>
                      <th
                        style={{
                          padding: "10px",
                          border: "1px solid #dee2e6",
                          textAlign: "center",
                        }}
                      >
                        SL Đặt
                      </th>
                      <th
                        style={{
                          padding: "10px",
                          border: "1px solid #dee2e6",
                          textAlign: "center",
                        }}
                      >
                        SL Nhận
                      </th>
                      <th
                        style={{
                          padding: "10px",
                          border: "1px solid #dee2e6",
                          textAlign: "center",
                        }}
                      >
                        SL Từ Chối
                      </th>
                      <th
                        style={{
                          padding: "10px",
                          border: "1px solid #dee2e6",
                          textAlign: "left",
                        }}
                      >
                        Lý Do Từ Chối
                      </th>
                      <th
                        style={{
                          padding: "10px",
                          border: "1px solid #dee2e6",
                          textAlign: "center",
                        }}
                      >
                        Thao Tác
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.lines.map((line, index) => (
                      <tr key={index}>
                        <td
                          style={{
                            padding: "10px",
                            border: "1px solid #dee2e6",
                          }}
                        >
                          {line.productName || `Sản phẩm ${line.productId}`}
                        </td>
                        <td
                          style={{
                            padding: "10px",
                            border: "1px solid #dee2e6",
                            textAlign: "center",
                          }}
                        >
                          {line.orderedQuantity}
                        </td>
                        <td
                          style={{
                            padding: "10px",
                            border: "1px solid #dee2e6",
                          }}
                        >
                          <input
                            type="number"
                            min="0"
                            max={line.orderedQuantity}
                            value={line.quantityAccepted}
                            onChange={(e) =>
                              handleLineChange(
                                index,
                                "quantityAccepted",
                                e.target.value
                              )
                            }
                            style={{
                              width: "80px",
                              padding: "4px",
                              border: "1px solid #ced4da",
                              borderRadius: "4px",
                              textAlign: "center",
                            }}
                            className="bg-light text-dark"
                          />
                        </td>
                        <td
                          style={{
                            padding: "10px",
                            border: "1px solid #dee2e6",
                          }}
                        >
                          <input
                            type="number"
                            min="0"
                            max={line.orderedQuantity}
                            value={line.quantityRejected}
                            onChange={(e) =>
                              handleLineChange(
                                index,
                                "quantityRejected",
                                e.target.value
                              )
                            }
                            style={{
                              width: "80px",
                              padding: "4px",
                              border: "1px solid #ced4da",
                              borderRadius: "4px",
                              textAlign: "center",
                            }}
                            className="bg-light text-dark"
                          />
                        </td>
                        <td
                          style={{
                            padding: "10px",
                            border: "1px solid #dee2e6",
                          }}
                        >
                          <input
                            type="text"
                            value={line.rejectionReason}
                            onChange={(e) =>
                              handleLineChange(
                                index,
                                "rejectionReason",
                                e.target.value
                              )
                            }
                            style={{
                              width: "100%",
                              padding: "4px",
                              border: "1px solid #ced4da",
                              borderRadius: "4px",
                            }}
                            className="bg-light text-dark"
                            placeholder="Nhập lý do từ chối..."
                            disabled={parseFloat(line.quantityRejected) === 0}
                          />
                        </td>
                        <td
                          style={{
                            padding: "10px",
                            border: "1px solid #dee2e6",
                            textAlign: "center",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => removeLine(index)}
                            style={{
                              backgroundColor: "#dc3545",
                              color: "white",
                              border: "none",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "12px",
                            }}
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px",
                  color: "#6c757d",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "4px",
                }}
              >
                {selectedBill
                  ? "Không có dòng sản phẩm nào"
                  : "Vui lòng chọn hóa đơn để xem chi tiết sản phẩm"}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "20px",
            borderTop: "1px solid #dee2e6",
            backgroundColor: "#f8f9fa",
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
          }}
        >
          <button
            onClick={handleClose}
            style={{
              padding: "10px 20px",
              border: "1px solid #6c757d",
              backgroundColor: "white",
              color: "#6c757d",
              borderRadius: "4px",
              cursor: "pointer",
            }}
            disabled={loading}
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || formData.lines.length === 0}
            style={{
              padding: "10px 20px",
              border: "none",
              backgroundColor: loading ? "#6c757d" : "#007bff",
              color: "white",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Đang xử lý..." : "Tạo Phiếu Nhập"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoodsReceiptForm;
