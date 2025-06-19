import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaPlus,
  FaTrash,
  FaSave,
  FaArrowLeft,
  FaCalculator,
} from "react-icons/fa";
import useBillManagement from "../../../hooks/useBillManagement";
import "../product.css";

const BillForm = () => {
  const navigate = useNavigate();
  const { billId } = useParams(); // For editing existing bills
  const isEditMode = !!billId;

  const {
    currentBill,
    loading,
    errors,
    loadBillById,
    createBill,
    updateBill,
    clearError,
  } = useBillManagement();

  // Form data state
  const [billData, setBillData] = useState({
    billNumber: "",
    partyId: "",
    billDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    notes: "",
    status: "PENDING",
  });

  const [billLines, setBillLines] = useState([
    {
      id: null,
      productId: "",
      productName: "",
      description: "",
      quantity: 1,
      unitPrice: 0,
    },
  ]);
  // TODO: Implement vendor and product APIs when available
  // No documented APIs for fetching vendors and products in the final_flow_document.md
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);

  // Toast notification state
  const [toastShow, setToastShow] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastVariant, setToastVariant] = useState("success");

  const showToast = (message, variant = "success") => {
    setToastMessage(message);
    setToastVariant(variant);
    setToastShow(true);
    setTimeout(() => setToastShow(false), 3000);
  };

  // Load bill data for editing
  useEffect(() => {
    if (isEditMode && billId) {
      loadBillById(parseInt(billId));
    }
  }, [isEditMode, billId, loadBillById]);

  // Populate form when bill data is loaded
  useEffect(() => {
    if (isEditMode && currentBill) {
      setBillData({
        billNumber: currentBill.billNumber || "",
        partyId: currentBill.partyId?.toString() || "",
        billDate:
          currentBill.billDate || new Date().toISOString().split("T")[0],
        dueDate: currentBill.dueDate || "",
        notes: currentBill.notes || "",
        status: currentBill.status || "PENDING",
      });

      if (currentBill.billLines && currentBill.billLines.length > 0) {
        setBillLines(
          currentBill.billLines.map((line) => ({
            id: line.id,
            productId: line.productId?.toString() || "",
            productName: line.productName || "",
            description: line.description || "",
            quantity: line.quantity || 1,
            unitPrice: parseFloat(line.unitPrice) || 0,
          }))
        );
      }
    }
  }, [isEditMode, currentBill]);

  // Generate bill number for new bills
  useEffect(() => {
    if (!isEditMode && !billData.billNumber) {
      const timestamp = Date.now().toString().slice(-6);
      const currentYear = new Date().getFullYear();
      setBillData((prev) => ({
        ...prev,
        billNumber: `MANUAL-${currentYear}-${timestamp}`,
      }));
    }
  }, [isEditMode, billData.billNumber]);

  // Event handlers
  const handleBillDataChange = (field, value) => {
    setBillData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLineChange = (index, field, value) => {
    setBillLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, [field]: value } : line))
    );
  };

  const handleProductChange = (index, productId) => {
    const selectedProduct = products.find((p) => p.id === parseInt(productId));

    setBillLines((prev) =>
      prev.map((line, i) =>
        i === index
          ? {
              ...line,
              productId,
              productName: selectedProduct ? selectedProduct.name : "",
              description: selectedProduct
                ? `${selectedProduct.name} - ${selectedProduct.unit}`
                : "",
            }
          : line
      )
    );
  };

  const addNewLine = () => {
    setBillLines((prev) => [
      ...prev,
      {
        id: null,
        productId: "",
        productName: "",
        description: "",
        quantity: 1,
        unitPrice: 0,
      },
    ]);
  };

  const removeLine = (index) => {
    if (billLines.length > 1) {
      setBillLines((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const calculateLineTotal = (quantity, unitPrice) => {
    return (parseFloat(quantity) || 0) * (parseFloat(unitPrice) || 0);
  };

  const calculateBillTotal = () => {
    return billLines.reduce(
      (total, line) =>
        total + calculateLineTotal(line.quantity, line.unitPrice),
      0
    );
  };

  const validateForm = () => {
    const errors = [];

    if (!billData.billNumber.trim()) {
      errors.push("Mã hóa đơn không được để trống");
    }
    if (!billData.partyId) {
      errors.push("Vui lòng chọn nhà cung cấp");
    }

    // Check if vendor data is available
    if (vendors.length === 0) {
      errors.push(
        "Không có dữ liệu nhà cung cấp. Vui lòng liên hệ quản trị viên."
      );
    }

    // Check if product data is available for bill lines
    if (products.length === 0 && billLines.some((line) => line.productId)) {
      errors.push("Không có dữ liệu sản phẩm. Vui lòng liên hệ quản trị viên.");
    }

    if (!billData.billDate) {
      errors.push("Ngày hóa đơn không được để trống");
    }

    if (!billData.dueDate) {
      errors.push("Ngày đến hạn không được để trống");
    }

    if (
      billData.dueDate &&
      billData.billDate &&
      new Date(billData.dueDate) < new Date(billData.billDate)
    ) {
      errors.push("Ngày đến hạn phải sau ngày hóa đơn");
    }

    const validLines = billLines.filter(
      (line) =>
        line.description.trim() && line.quantity > 0 && line.unitPrice > 0
    );

    if (validLines.length === 0) {
      errors.push("Vui lòng thêm ít nhất một dòng hóa đơn hợp lệ");
    }

    return errors;
  };

  const handleSave = async () => {
    const validationErrors = validateForm();

    if (validationErrors.length > 0) {
      showToast(validationErrors.join(", "), "error");
      return;
    }

    // Prepare bill data
    const formattedBillData = {
      ...billData,
      billLines: billLines
        .filter(
          (line) =>
            line.description.trim() && line.quantity > 0 && line.unitPrice > 0
        )
        .map((line) => ({
          id: line.id,
          productId: line.productId ? parseInt(line.productId) : null,
          description: line.description.trim(),
          quantity: parseInt(line.quantity),
          unitPrice: parseFloat(line.unitPrice),
        })),
    };

    let result;
    if (isEditMode) {
      result = await updateBill(parseInt(billId), formattedBillData);
    } else {
      result = await createBill(formattedBillData);
    }

    if (result.success) {
      showToast(
        isEditMode ? "Cập nhật hóa đơn thành công!" : "Tạo hóa đơn thành công!"
      );
      setTimeout(() => {
        navigate("/hang-hoa/bill-management");
      }, 1500);
    } else {
      showToast(result.error || "Có lỗi xảy ra", "error");
    }
  };

  const handleCancel = () => {
    navigate("/hang-hoa/bill-management");
  };

  // Render helper functions
  const renderBillInformation = () => (
    <div
      className="bill-info-section"
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "20px",
        marginBottom: "30px",
        padding: "20px",
        backgroundColor: "#f8f9fa",
        borderRadius: "8px",
      }}
    >
      <div>
        <label
          style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}
        >
          Mã hóa đơn <span style={{ color: "#dc3545" }}>*</span>
          <input
            type="text"
            value={billData.billNumber}
            onChange={(e) => handleBillDataChange("billNumber", e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              marginTop: "4px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
            placeholder="Nhập mã hóa đơn"
          />
        </label>

        <label
          style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}
        >
          Nhà cung cấp <span style={{ color: "#dc3545" }}>*</span>
          <select
            value={billData.partyId}
            onChange={(e) => handleBillDataChange("partyId", e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              marginTop: "4px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          >
            <option value="">Chọn nhà cung cấp...</option>
            {vendors.length === 0 ? (
              <option value="" disabled>
                Không có dữ liệu nhà cung cấp
              </option>
            ) : (
              vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </option>
              ))
            )}
          </select>
        </label>

        <label
          style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}
        >
          Trạng thái
          <select
            value={billData.status}
            onChange={(e) => handleBillDataChange("status", e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              marginTop: "4px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          >
            <option value="PENDING">Chờ xử lý</option>
            <option value="APPROVED">Đã duyệt</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
        </label>
      </div>

      <div>
        <label
          style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}
        >
          Ngày hóa đơn <span style={{ color: "#dc3545" }}>*</span>
          <input
            type="date"
            value={billData.billDate}
            onChange={(e) => handleBillDataChange("billDate", e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              marginTop: "4px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
        </label>

        <label
          style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}
        >
          Ngày đến hạn <span style={{ color: "#dc3545" }}>*</span>
          <input
            type="date"
            value={billData.dueDate}
            onChange={(e) => handleBillDataChange("dueDate", e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              marginTop: "4px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
        </label>

        <label
          style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}
        >
          Tổng tiền
          <input
            type="text"
            value={`$${calculateBillTotal().toFixed(2)}`}
            readOnly
            style={{
              width: "100%",
              padding: "8px",
              marginTop: "4px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              backgroundColor: "#e9ecef",
              fontWeight: "bold",
              fontSize: "16px",
            }}
          />
        </label>
      </div>

      <div style={{ gridColumn: "span 2" }}>
        <label
          style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}
        >
          Ghi chú
          <textarea
            value={billData.notes}
            onChange={(e) => handleBillDataChange("notes", e.target.value)}
            placeholder="Nhập ghi chú cho hóa đơn..."
            rows="3"
            style={{
              width: "100%",
              padding: "8px",
              marginTop: "4px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              resize: "vertical",
            }}
          />
        </label>
      </div>
    </div>
  );

  const renderBillLinesTable = () => (
    <div className="bill-lines-section">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <h3 style={{ margin: 0 }}>Chi tiết hóa đơn</h3>
        <button
          onClick={addNewLine}
          style={{
            padding: "8px 16px",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <FaPlus /> Thêm dòng
        </button>
      </div>

      <table className="kiemkho-table">
        <thead>
          <tr>
            <th>STT</th>
            <th>Sản phẩm</th>
            <th>Mô tả</th>
            <th>Số lượng</th>
            <th>Đơn giá (USD)</th>
            <th>Thành tiền</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {billLines.map((line, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>
                <select
                  value={line.productId}
                  onChange={(e) => handleProductChange(index, e.target.value)}
                  style={{
                    width: "100%",
                    padding: "4px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                  }}
                >
                  <option value="">Chọn sản phẩm...</option>
                  {products.length === 0 ? (
                    <option value="" disabled>
                      Không có dữ liệu sản phẩm
                    </option>
                  ) : (
                    products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))
                  )}
                </select>
              </td>
              <td>
                <input
                  type="text"
                  value={line.description}
                  onChange={(e) =>
                    handleLineChange(index, "description", e.target.value)
                  }
                  placeholder="Mô tả sản phẩm/dịch vụ"
                  style={{
                    width: "100%",
                    padding: "4px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                  }}
                />
              </td>
              <td>
                <input
                  type="number"
                  value={line.quantity}
                  onChange={(e) =>
                    handleLineChange(index, "quantity", e.target.value)
                  }
                  min="1"
                  style={{
                    width: "80px",
                    padding: "4px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                  }}
                />
              </td>
              <td>
                <input
                  type="number"
                  value={line.unitPrice}
                  onChange={(e) =>
                    handleLineChange(index, "unitPrice", e.target.value)
                  }
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  style={{
                    width: "100px",
                    padding: "4px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                  }}
                />
              </td>
              <td>
                <strong>
                  $
                  {calculateLineTotal(line.quantity, line.unitPrice).toFixed(2)}
                </strong>
              </td>
              <td>
                <button
                  onClick={() => removeLine(index)}
                  disabled={billLines.length === 1}
                  style={{
                    padding: "4px 8px",
                    backgroundColor:
                      billLines.length === 1 ? "#6c757d" : "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: billLines.length === 1 ? "not-allowed" : "pointer",
                  }}
                  title="Xóa dòng"
                >
                  <FaTrash />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ backgroundColor: "#f8f9fa", fontWeight: "bold" }}>
            <td colSpan="5" style={{ textAlign: "right", padding: "12px" }}>
              <FaCalculator style={{ marginRight: "8px" }} />
              Tổng cộng:
            </td>
            <td style={{ fontSize: "18px", color: "#28a745" }}>
              ${calculateBillTotal().toFixed(2)}
            </td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );

  const renderActionButtons = () => (
    <div
      style={{
        display: "flex",
        gap: "12px",
        justifyContent: "flex-end",
        marginTop: "30px",
        padding: "20px 0",
      }}
    >
      <button
        onClick={handleCancel}
        style={{
          padding: "12px 24px",
          backgroundColor: "#6c757d",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "16px",
          fontWeight: "600",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <FaArrowLeft /> Hủy
      </button>

      <button
        onClick={handleSave}
        disabled={loading.creating || loading.updating}
        style={{
          padding: "12px 24px",
          backgroundColor: "#28a745",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "16px",
          fontWeight: "600",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <FaSave />{" "}
        {loading.creating || loading.updating
          ? "Đang lưu..."
          : isEditMode
          ? "Cập nhật"
          : "Tạo hóa đơn"}
      </button>
    </div>
  );

  // Toast Notification
  const renderToast = () =>
    toastShow && (
      <div
        style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          backgroundColor: toastVariant === "success" ? "#28a745" : "#dc3545",
          color: "white",
          padding: "12px 20px",
          borderRadius: "4px",
          zIndex: 1000,
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        }}
      >
        {toastMessage}
      </div>
    );

  return (
    <div className="full-container">
      <div
        className="kiemkho-main-content"
        style={{ marginLeft: 0, width: "100%" }}
      >
        <div className="kiemkho-header">
          <h2 className="kiemkho-title">
            {isEditMode ? "SỬA HÓA ĐƠN" : "TẠO HÓA ĐƠN THỦ CÔNG"}
          </h2>
        </div>

        {loading.currentBill && isEditMode ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            Đang tải dữ liệu hóa đơn...
          </div>
        ) : errors.currentBill && isEditMode ? (
          <div
            style={{ textAlign: "center", padding: "40px", color: "#dc3545" }}
          >
            Lỗi: {errors.currentBill}
          </div>
        ) : (
          <>
            {renderBillInformation()}
            {renderBillLinesTable()}
            {renderActionButtons()}
          </>
        )}
      </div>

      {renderToast()}
    </div>
  );
};

export default BillForm;
