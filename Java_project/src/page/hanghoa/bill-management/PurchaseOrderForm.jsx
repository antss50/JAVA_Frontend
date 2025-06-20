import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaSearch,
  FaTrash,
  FaPlus,
  FaShoppingCart,
  FaExclamationTriangle,
  FaArrowLeft,
} from "react-icons/fa";
import useBillManagement from "../../../hooks/useBillManagement";
import usePartyManagement from "../../../hooks/usePartyManagement";
import ToastMessage from "../../../component/ToastMessage";
import "../product.css";

const PurchaseOrderForm = () => {
  const navigate = useNavigate();
  const {
    lowStockAlerts,
    loading,
    errors,
    loadLowStockAlerts,
    createPurchaseOrder,
    clearError,
  } = useBillManagement({
    autoLoad: false,
    loadLowStockOnInit: true,
  });
  // Initialize party management for suppliers
  const {
    parties: suppliers,
    loading: partyLoading,
    error: partyError,
    loadParties,
    setSelectedType,
  } = usePartyManagement({
    initialType: "SUPPLIER",
    autoLoad: true, // Auto-load suppliers on mount
  });

  // Local state
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [orderDetails, setOrderDetails] = useState({
    partyId: "",
    notes: "",
    orderDate: new Date().toISOString().split("T")[0],
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);

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

  // Debug effect to log lowStockAlerts data
  useEffect(() => {
    console.log("PurchaseOrderForm - lowStockAlerts updated:", {
      lowStockAlerts,
      loading: loading.lowStockAlerts,
      error: errors.lowStockAlerts,
      length: lowStockAlerts?.length || 0,
    });
  }, [lowStockAlerts, loading.lowStockAlerts, errors.lowStockAlerts]);

  // Event handlers
  const handleSelectProduct = (alert) => {
    const isSelected = selectedProducts.some(
      (p) => p.productId === alert.productId
    );

    if (isSelected) {
      setSelectedProducts((prev) =>
        prev.filter((p) => p.productId !== alert.productId)
      );
    } else {
      const newProduct = {
        productId: alert.productId,
        productName: alert.productName,
        unit: alert.unit || "PCS",
        currentStock: alert.currentStock,
        reorderLevel: alert.reorderLevel,
        suggestedQuantity:
          alert.suggestedOrderQuantity ||
          (alert.reorderLevel - alert.currentStock) * 1.5,
        quantity:
          alert.suggestedOrderQuantity ||
          Math.ceil((alert.reorderLevel - alert.currentStock) * 1.5),
        unitPrice: 0,
        description: `Restocking for ${alert.productName}`,
      };
      setSelectedProducts((prev) => [...prev, newProduct]);
    }
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === lowStockAlerts.length) {
      // Deselect all
      setSelectedProducts([]);
    } else {
      // Select all
      const allProducts = lowStockAlerts.map((alert) => ({
        productId: alert.productId,
        productName: alert.productName,
        unit: alert.unit || "PCS",
        currentStock: alert.currentStock,
        reorderLevel: alert.reorderLevel,
        suggestedQuantity:
          alert.suggestedOrderQuantity ||
          (alert.reorderLevel - alert.currentStock) * 1.5,
        quantity:
          alert.suggestedOrderQuantity ||
          Math.ceil((alert.reorderLevel - alert.currentStock) * 1.5),
        unitPrice: 0,
        description: `Restocking for ${alert.productName}`,
      }));
      setSelectedProducts(allProducts);
    }
  };

  const handleQuantityChange = (productId, quantity) => {
    setSelectedProducts((prev) =>
      prev.map((product) =>
        product.productId === productId
          ? { ...product, quantity: parseInt(quantity) || 0 }
          : product
      )
    );
  };

  const handlePriceChange = (productId, unitPrice) => {
    setSelectedProducts((prev) =>
      prev.map((product) =>
        product.productId === productId
          ? { ...product, unitPrice: parseFloat(unitPrice) || 0 }
          : product
      )
    );
  };

  const handleDescriptionChange = (productId, description) => {
    setSelectedProducts((prev) =>
      prev.map((product) =>
        product.productId === productId ? { ...product, description } : product
      )
    );
  };

  const handleRemoveProduct = (productId) => {
    setSelectedProducts((prev) =>
      prev.filter((p) => p.productId !== productId)
    );
  };

  const handleOrderDetailsChange = (field, value) => {
    setOrderDetails((prev) => ({ ...prev, [field]: value }));
  };
  const handleCreateOrder = async () => {
    // Validation
    if (!orderDetails.partyId) {
      showToast("Vui lòng chọn nhà cung cấp", "error");
      return;
    } // Check if vendor data is available
    if (suppliers.length === 0) {
      showToast(
        "Không có dữ liệu nhà cung cấp. Vui lòng liên hệ quản trị viên.",
        "error"
      );
      return;
    }

    if (selectedProducts.length === 0) {
      showToast("Vui lòng chọn ít nhất một sản phẩm", "error");
      return;
    }

    const invalidProducts = selectedProducts.filter(
      (p) => p.quantity <= 0 || p.unitPrice <= 0
    );
    if (invalidProducts.length > 0) {
      showToast(
        "Vui lòng nhập số lượng và đơn giá hợp lệ cho tất cả sản phẩm",
        "error"
      );
      return;
    }

    // Create order data
    const orderData = {
      partyId: parseInt(orderDetails.partyId),
      notes: orderDetails.notes,
      orderLines: selectedProducts.map((product) => ({
        productId: product.productId,
        productName: product.productName,
        description: product.description,
        quantity: product.quantity,
        unitPrice: product.unitPrice,
      })),
    };

    // Submit order
    const result = await createPurchaseOrder(orderData);

    if (result.success) {
      setCreatedOrder(result.data);
      setShowSuccess(true);
      showToast("Tạo đơn hàng thành công!");

      // Reset form
      setSelectedProducts([]);
      setOrderDetails({
        partyId: "",
        notes: "",
        orderDate: new Date().toISOString().split("T")[0],
      });
    } else {
      showToast(result.error || "Có lỗi xảy ra khi tạo đơn hàng", "error");
    }
  };
  const handleNewOrder = () => {
    setShowSuccess(false);
    setCreatedOrder(null);
    setSelectedProducts([]); // Reset selected products
    setOrderDetails({
      partyId: "",
      notes: "",
      orderDate: new Date().toISOString().split("T")[0],
    });
    // Only refresh alerts if needed - the alerts don't change often
    // loadLowStockAlerts(); // Comment out to reduce unnecessary requests
  };
  const handleViewBill = () => {
    if (createdOrder && createdOrder.billId) {
      navigate(`/hang-hoa/bill-management/${createdOrder.billId}`);
    }
  };

  // Calculate totals
  const totalQuantity = selectedProducts.reduce(
    (sum, p) => sum + p.quantity,
    0
  );
  const totalAmount = selectedProducts.reduce(
    (sum, p) => sum + p.quantity * p.unitPrice,
    0
  );

  // Render helper functions
  const renderLowStockAlertsSection = () => {
    console.log("renderLowStockAlertsSection - Current state:", {
      lowStockAlerts,
      lowStockAlertsLength: lowStockAlerts?.length,
      lowStockAlertsType: typeof lowStockAlerts,
      loading: loading.lowStockAlerts,
      error: errors.lowStockAlerts,
      selectedProductsLength: selectedProducts.length,
    });

    return (
      <div className="kiemkho-search-box">
        <h4>Sản phẩm thiếu hàng</h4>

        <div style={{ marginBottom: "16px" }}>
          <button
            onClick={handleSelectAll}
            className="kiemkho-button"
            style={{ width: "100%", marginBottom: "8px" }}
          >
            {selectedProducts.length === lowStockAlerts.length
              ? "Bỏ chọn tất cả"
              : "Chọn tất cả"}
          </button>

          <p style={{ fontSize: "14px", color: "#6c757d", margin: 0 }}>
            Đã chọn: {selectedProducts.length} / {lowStockAlerts.length} sản
            phẩm
          </p>
        </div>

        {loading.lowStockAlerts ? (
          <div style={{ textAlign: "center", padding: "20px" }}>
            Đang tải...
          </div>
        ) : errors.lowStockAlerts ? (
          <div
            style={{ textAlign: "center", padding: "20px", color: "#dc3545" }}
          >
            Lỗi: {errors.lowStockAlerts}
          </div>
        ) : lowStockAlerts.length === 0 ? (
          <div
            style={{ textAlign: "center", padding: "20px", color: "#28a745" }}
          >
            <FaExclamationTriangle style={{ marginBottom: "8px" }} />
            <br />
            Không có sản phẩm thiếu hàng
          </div>
        ) : (
          (() => {
            console.log(
              "About to render lowStockAlerts.map with:",
              lowStockAlerts
            );
            return (
              <div
                className="low-stock-list"
                style={{ maxHeight: "400px", overflowY: "auto" }}
              >
                {lowStockAlerts.map((alert) => {
                  console.log("Mapping alert:", alert);
                  const isSelected = selectedProducts.some(
                    (p) => p.productId === alert.productId
                  );

                  return (
                    <div
                      key={alert.productId}
                      className={`low-stock-item ${
                        isSelected ? "selected" : ""
                      }`}
                      onClick={() => handleSelectProduct(alert)}
                      style={{
                        padding: "12px",
                        marginBottom: "8px",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        cursor: "pointer",
                        backgroundColor: isSelected ? "#e7f3ff" : "#f8f9fa",
                        borderColor: isSelected ? "#007bff" : "#ccc",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <h6
                            style={{ margin: "0 0 4px 0", fontWeight: "bold" }}
                          >
                            {alert.productName}
                          </h6>
                          <div style={{ fontSize: "12px", color: "#6c757d" }}>
                            <div>
                              Tồn kho: {alert.currentStock} {alert.unit}
                            </div>
                            <div>
                              Mức tồn tối thiểu: {alert.reorderLevel}{" "}
                              {alert.unit}
                            </div>
                            <div>
                              Thiếu: {alert.reorderLevel - alert.currentStock}{" "}
                              {alert.unit}
                            </div>
                          </div>
                        </div>

                        <span
                          className={`alert-badge ${alert.alertBadge?.class}`}
                          style={{
                            backgroundColor: alert.alertBadge?.color,
                            color: "white",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontSize: "10px",
                          }}
                        >
                          {alert.alertBadge?.text}
                        </span>
                      </div>{" "}
                    </div>
                  );
                })}
              </div>
            );
          })()
        )}
      </div>
    );
  };

  const renderSelectedProductsTable = () => (
    <div className="selected-products-section">
      <table className="kiemkhochitiet-table">
        <thead>
          <tr>
            <th>STT</th>
            <th>Tên sản phẩm</th>
            <th>Tồn kho hiện tại</th>
            <th>Số lượng đặt hàng</th>
            <th>Đơn giá (VNĐ)</th>
            <th>Thành tiền</th>
            <th>Mô tả</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {selectedProducts.length === 0 ? (
            <tr>
              <td colSpan="8" className="no-data">
                Chưa có sản phẩm nào được chọn. Chọn sản phẩm từ danh sách bên
                trái.
              </td>
            </tr>
          ) : (
            selectedProducts.map((product, index) => (
              <tr key={product.productId}>
                <td>{index + 1}</td>
                <td>
                  <div>
                    <strong>{product.productName}</strong>
                    <br />
                    <small style={{ color: "#6c757d" }}>
                      Mã: {product.productId} | Đơn vị: {product.unit}
                    </small>
                  </div>
                </td>
                <td>
                  {product.currentStock} {product.unit}
                  <br />
                  <small style={{ color: "#dc3545" }}>
                    (Thiếu: {product.reorderLevel - product.currentStock})
                  </small>
                </td>
                <td>
                  <input
                    type="number"
                    value={product.quantity}
                    onChange={(e) =>
                      handleQuantityChange(product.productId, e.target.value)
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
                    value={product.unitPrice}
                    onChange={(e) =>
                      handlePriceChange(product.productId, e.target.value)
                    }
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    style={{
                      width: "80px",
                      padding: "4px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                    }}
                  />
                </td>{" "}
                <td>
                  <strong>
                    {(product.quantity * product.unitPrice).toLocaleString(
                      "vi-VN"
                    )}{" "}
                    ₫
                  </strong>
                </td>
                <td>
                  <input
                    type="text"
                    value={product.description}
                    onChange={(e) =>
                      handleDescriptionChange(product.productId, e.target.value)
                    }
                    placeholder="Mô tả sản phẩm..."
                    style={{
                      width: "150px",
                      padding: "4px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                    }}
                  />
                </td>
                <td>
                  <button
                    onClick={() => handleRemoveProduct(product.productId)}
                    style={{
                      padding: "4px 8px",
                      backgroundColor: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                    title="Xóa sản phẩm"
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  const renderOrderInformation = () => (
    <div className="kiemkhochitiet-info">
      <div className="info-section">
        {" "}
        <label>
          Nhà cung cấp <span style={{ color: "#dc3545" }}>*</span>
          <select
            value={orderDetails.partyId}
            onChange={(e) =>
              handleOrderDetailsChange("partyId", e.target.value)
            }
            style={{
              width: "100%",
              padding: "8px",
              marginTop: "4px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
            required
            disabled={partyLoading}
          >
            {" "}
            <option value="">Chọn nhà cung cấp...</option>
            {suppliers.length === 0 ? (
              <option value="" disabled>
                {partyLoading ? "Đang tải..." : "Không có dữ liệu nhà cung cấp"}
              </option>
            ) : (
              suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))
            )}
          </select>
          {partyError && (
            <div
              style={{ color: "#dc3545", fontSize: "12px", marginTop: "4px" }}
            >
              {" "}
              Lỗi tải nhà cung cấp: {partyError.message || "Không xác định"}
              <button
                onClick={loadParties}
                style={{
                  marginLeft: "8px",
                  padding: "2px 6px",
                  fontSize: "10px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "2px",
                  cursor: "pointer",
                }}
              >
                Thử lại
              </button>
            </div>
          )}
        </label>
        <label>
          Ngày đặt hàng
          <input
            type="date"
            value={orderDetails.orderDate}
            onChange={(e) =>
              handleOrderDetailsChange("orderDate", e.target.value)
            }
            style={{
              width: "100%",
              padding: "8px",
              marginTop: "4px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
        </label>
        <label>
          Tổng số lượng
          <input
            type="number"
            value={totalQuantity}
            readOnly
            className="readonly-input"
            style={{
              width: "100%",
              padding: "8px",
              marginTop: "4px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              backgroundColor: "#f8f9fa",
            }}
          />
        </label>{" "}
        <label>
          Tổng giá trị (VNĐ)
          <input
            type="text"
            value={`${totalAmount.toLocaleString("vi-VN")} ₫`}
            readOnly
            className="readonly-input"
            style={{
              width: "100%",
              padding: "8px",
              marginTop: "4px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              backgroundColor: "#f8f9fa",
              fontWeight: "bold",
              fontSize: "16px",
            }}
          />
        </label>
        <label>
          Ghi chú
          <textarea
            value={orderDetails.notes}
            onChange={(e) => handleOrderDetailsChange("notes", e.target.value)}
            placeholder="Ghi chú cho đơn hàng..."
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

  const renderActionButtons = () => (
    <div className="kiemkhochitiet-buttons">
      <button
        onClick={() => navigate("/hang-hoa/bill-management")}
        className="draft"
        style={{
          padding: "12px 24px",
          backgroundColor: "#6c757d",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "16px",
          fontWeight: "600",
        }}
      >
        <FaArrowLeft /> Quay lại
      </button>{" "}
      <button
        onClick={handleCreateOrder}
        disabled={
          loading.creating || selectedProducts.length === 0 || partyLoading
        }
        className="submit"
        style={{
          padding: "12px 24px",
          backgroundColor:
            selectedProducts.length === 0 || partyLoading
              ? "#6c757d"
              : "#28a745",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor:
            selectedProducts.length === 0 || partyLoading
              ? "not-allowed"
              : "pointer",
          fontSize: "16px",
          fontWeight: "600",
        }}
      >
        <FaShoppingCart /> {loading.creating ? "Đang tạo..." : "Tạo đơn hàng"}
      </button>
    </div>
  );

  // Success Modal
  const renderSuccessModal = () =>
    showSuccess &&
    createdOrder && (
      <div className="popup-overlay">
        <div className="popup-content" style={{ width: "500px" }}>
          <h3 style={{ marginTop: 0, color: "#28a745" }}>
            ✅ Tạo đơn hàng thành công!
          </h3>

          <div style={{ marginBottom: "20px" }}>
            <p>
              <strong>Mã đơn hàng:</strong> {createdOrder.billNumber}
            </p>
            <p>
              <strong>Nhà cung cấp:</strong> {createdOrder.vendorName}
            </p>
            <p>
              <strong>Ngày tạo:</strong> {createdOrder.billDate}
            </p>
            <p>
              <strong>Ngày đến hạn:</strong> {createdOrder.dueDate}
            </p>
            <p>
              <strong>Tổng giá trị:</strong>{" "}
              <span
                style={{
                  fontWeight: "bold",
                  fontSize: "18px",
                  color: "#28a745",
                }}
              >
                {createdOrder.totalAmount?.toLocaleString("vi-VN") ||
                  totalAmount.toLocaleString("vi-VN")}{" "}
                ₫
              </span>
            </p>
            <p>
              <strong>Số sản phẩm:</strong>{" "}
              {createdOrder.orderLines?.length || selectedProducts.length}
            </p>
          </div>

          <div
            style={{ fontSize: "14px", color: "#6c757d", marginBottom: "20px" }}
          >
            Đơn hàng đã được tạo thành hóa đơn trong hệ thống. Bạn có thể xem
            chi tiết hoặc tạo đơn hàng mới.
          </div>

          <div
            style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}
          >
            <button
              onClick={handleNewOrder}
              style={{
                padding: "10px 20px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Tạo đơn hàng mới
            </button>
            <button
              onClick={handleViewBill}
              style={{
                padding: "10px 20px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Xem hóa đơn
            </button>
          </div>
        </div>
      </div>
    );
  // Toast Notification
  const renderToast = () => (
    <ToastMessage
      show={toastShow}
      message={toastMessage}
      variant={toastVariant}
      onClose={() => setToastShow(false)}
    />
  );

  return (
    <div className="full-container">
      {renderLowStockAlertsSection()}

      <div className="kiemkho-main-content">
        {" "}
        <div className="kiemkho-header">
          <h2 className="kiemkho-title">TẠO ĐƠN HÀNG TỪ CẢNH BÁO THIẾU HÀNG</h2>
          {partyLoading && (
            <div
              style={{ fontSize: "14px", color: "#6c757d", marginTop: "4px" }}
            >
              Đang tải danh sách nhà cung cấp...
            </div>
          )}
        </div>
        <div className="kiemkhochitiet-table-section">
          {renderSelectedProductsTable()}
          {renderOrderInformation()}
        </div>
        {renderActionButtons()}
      </div>

      {renderSuccessModal()}
      {renderToast()}
    </div>
  );
};

export default PurchaseOrderForm;
