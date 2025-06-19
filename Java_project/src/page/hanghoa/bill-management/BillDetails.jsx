import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaEdit,
  FaMoneyBillWave,
  FaTrash,
  FaPrint,
  FaFileDownload,
  FaHistory,
} from "react-icons/fa";
import useBillManagement from "../../../hooks/useBillManagement";
import "../product.css";

const BillDetails = () => {
  const navigate = useNavigate();
  const { billId } = useParams();

  const {
    currentBill,
    loading,
    errors,
    loadBillById,
    makePayment,
    deleteBill,
    clearError,
  } = useBillManagement();

  // Local state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  // Load bill data on component mount
  useEffect(() => {
    if (billId) {
      loadBillById(parseInt(billId));
    }
  }, [billId, loadBillById]);

  // Event handlers
  const handlePaymentClick = () => {
    setPaymentAmount("");
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      showToast("Vui lòng nhập số tiền hợp lệ", "error");
      return;
    }

    const remainingBalance =
      (currentBill?.totalAmount || 0) - (currentBill?.amountPaid || 0);
    if (parseFloat(paymentAmount) > remainingBalance) {
      showToast(
        "Số tiền thanh toán không được vượt quá số tiền còn lại",
        "error"
      );
      return;
    }

    const result = await makePayment(
      parseInt(billId),
      parseFloat(paymentAmount)
    );

    if (result.success) {
      showToast("Thanh toán thành công");
      setShowPaymentModal(false);
      setPaymentAmount("");
      // Reload bill data to show updated payment
      loadBillById(parseInt(billId));
    } else {
      showToast(result.error || "Có lỗi xảy ra khi thanh toán", "error");
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    const result = await deleteBill(parseInt(billId));

    if (result.success) {
      showToast("Xóa hóa đơn thành công");
      setTimeout(() => {
        navigate("/hang-hoa/bill-management");
      }, 1500);
    } else {
      showToast(result.error || "Có lỗi xảy ra khi xóa hóa đơn", "error");
    }
    setShowDeleteConfirm(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    // This would typically generate and download a PDF
    showToast("Chức năng xuất PDF đang được phát triển", "info");
  };

  // Calculate remaining balance
  const remainingBalance = currentBill
    ? (currentBill.totalAmount || 0) - (currentBill.amountPaid || 0)
    : 0;

  // Render helper functions
  const renderBillHeader = () => (
    <div
      className="bill-header"
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "30px",
        padding: "20px",
        backgroundColor: "#f8f9fa",
        borderRadius: "8px",
      }}
    >
      <div>
        <h1 style={{ margin: "0 0 8px 0", fontSize: "28px", color: "#333" }}>
          {currentBill?.billNumber}
        </h1>
        <p style={{ margin: 0, color: "#6c757d", fontSize: "16px" }}>
          Chi tiết hóa đơn
        </p>
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        <button
          onClick={() => navigate("/hang-hoa/bill-management")}
          style={{
            padding: "8px 16px",
            backgroundColor: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <FaArrowLeft /> Quay lại
        </button>

        {currentBill?.status !== "PAID" && (
          <button
            onClick={handlePaymentClick}
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
            <FaMoneyBillWave /> Thanh toán
          </button>
        )}

        <button
          onClick={() => navigate(`/hang-hoa/sua-hoa-don/${billId}`)}
          style={{
            padding: "8px 16px",
            backgroundColor: "#ffc107",
            color: "black",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <FaEdit /> Sửa
        </button>

        <button
          onClick={handlePrint}
          style={{
            padding: "8px 16px",
            backgroundColor: "#17a2b8",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <FaPrint /> In
        </button>

        <button
          onClick={handleExport}
          style={{
            padding: "8px 16px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <FaFileDownload /> Xuất PDF
        </button>

        <button
          onClick={handleDeleteClick}
          style={{
            padding: "8px 16px",
            backgroundColor: "#dc3545",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <FaTrash /> Xóa
        </button>
      </div>
    </div>
  );

  const renderBillInfo = () => (
    <div
      className="bill-info"
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: "20px",
        marginBottom: "30px",
      }}
    >
      <div
        className="info-card"
        style={{
          padding: "20px",
          backgroundColor: "#ffffff",
          borderRadius: "8px",
          border: "1px solid #dee2e6",
        }}
      >
        <h4 style={{ margin: "0 0 16px 0", color: "#495057" }}>
          Thông tin chung
        </h4>
        <div style={{ marginBottom: "8px" }}>
          <strong>Mã hóa đơn:</strong> {currentBill?.billNumber}
        </div>
        <div style={{ marginBottom: "8px" }}>
          <strong>Nhà cung cấp:</strong> {currentBill?.vendorName}
        </div>
        <div style={{ marginBottom: "8px" }}>
          <strong>Trạng thái:</strong>{" "}
          <span
            style={{
              backgroundColor: currentBill?.statusBadge?.color,
              color: "white",
              padding: "2px 8px",
              borderRadius: "4px",
              fontSize: "12px",
            }}
          >
            {currentBill?.statusBadge?.text}
          </span>
        </div>
      </div>

      <div
        className="info-card"
        style={{
          padding: "20px",
          backgroundColor: "#ffffff",
          borderRadius: "8px",
          border: "1px solid #dee2e6",
        }}
      >
        <h4 style={{ margin: "0 0 16px 0", color: "#495057" }}>
          Thông tin ngày
        </h4>
        <div style={{ marginBottom: "8px" }}>
          <strong>Ngày tạo:</strong> {currentBill?.billDate}
        </div>
        <div style={{ marginBottom: "8px" }}>
          <strong>Ngày đến hạn:</strong>{" "}
          <span
            style={{ color: currentBill?.isOverdue ? "#dc3545" : "#495057" }}
          >
            {currentBill?.dueDate}
            {currentBill?.isOverdue && " (Quá hạn)"}
          </span>
        </div>
      </div>

      <div
        className="info-card"
        style={{
          padding: "20px",
          backgroundColor: "#ffffff",
          borderRadius: "8px",
          border: "1px solid #dee2e6",
        }}
      >
        <h4 style={{ margin: "0 0 16px 0", color: "#495057" }}>
          Thông tin thanh toán
        </h4>
        <div style={{ marginBottom: "8px" }}>
          <strong>Tổng tiền:</strong> {currentBill?.totalAmount}
        </div>
        <div style={{ marginBottom: "8px" }}>
          <strong>Đã thanh toán:</strong> {currentBill?.amountPaid}
        </div>
        <div style={{ marginBottom: "8px" }}>
          <strong>Còn lại:</strong>{" "}
          <span
            style={{
              color: remainingBalance > 0 ? "#dc3545" : "#28a745",
              fontWeight: "bold",
            }}
          >
            ${remainingBalance.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );

  const renderBillLines = () => (
    <div className="bill-lines" style={{ marginBottom: "30px" }}>
      <h3 style={{ marginBottom: "16px" }}>Chi tiết hóa đơn</h3>

      <table className="kiemkho-table">
        <thead>
          <tr>
            <th>STT</th>
            <th>Tên sản phẩm</th>
            <th>Mô tả</th>
            <th>Số lượng</th>
            <th>Đơn giá</th>
            <th>Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          {currentBill?.billLines && currentBill.billLines.length > 0 ? (
            currentBill.billLines.map((line, index) => (
              <tr key={line.id || index}>
                <td>{index + 1}</td>
                <td>{line.productName}</td>
                <td>{line.description}</td>
                <td>{line.quantity}</td>
                <td>{line.unitPrice}</td>
                <td>{line.lineTotal}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="no-data">
                Không có chi tiết hóa đơn
              </td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr style={{ backgroundColor: "#f8f9fa", fontWeight: "bold" }}>
            <td colSpan="5" style={{ textAlign: "right", padding: "12px" }}>
              Tổng cộng:
            </td>
            <td style={{ fontSize: "18px", color: "#28a745" }}>
              {currentBill?.totalAmount}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );

  const renderPaymentHistory = () => (
    <div className="payment-history" style={{ marginBottom: "30px" }}>
      <h3
        style={{
          marginBottom: "16px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <FaHistory /> Lịch sử thanh toán
      </h3>

      {currentBill?.payments && currentBill.payments.length > 0 ? (
        <table className="kiemkho-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Ngày thanh toán</th>
              <th>Số tiền</th>
              <th>Phương thức</th>
              <th>Mã tham chiếu</th>
            </tr>
          </thead>
          <tbody>
            {currentBill.payments.map((payment, index) => (
              <tr key={payment.id || index}>
                <td>{index + 1}</td>
                <td>{payment.paymentDate}</td>
                <td>{payment.amount}</td>
                <td>{payment.paymentMethod}</td>
                <td>{payment.referenceNumber || "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div
          style={{
            padding: "20px",
            textAlign: "center",
            backgroundColor: "#f8f9fa",
            borderRadius: "8px",
            color: "#6c757d",
          }}
        >
          Chưa có thanh toán nào
        </div>
      )}
    </div>
  );

  const renderNotes = () =>
    currentBill?.notes && (
      <div className="bill-notes" style={{ marginBottom: "30px" }}>
        <h3 style={{ marginBottom: "16px" }}>Ghi chú</h3>
        <div
          style={{
            padding: "16px",
            backgroundColor: "#f8f9fa",
            borderRadius: "8px",
            border: "1px solid #dee2e6",
          }}
        >
          {currentBill.notes}
        </div>
      </div>
    );

  // Payment Modal
  const renderPaymentModal = () =>
    showPaymentModal && (
      <div className="popup-overlay">
        <div className="popup-content" style={{ width: "400px" }}>
          <h3 style={{ marginTop: 0 }}>Thanh toán hóa đơn</h3>

          <div style={{ marginBottom: "20px" }}>
            <p>
              <strong>Mã hóa đơn:</strong> {currentBill?.billNumber}
            </p>
            <p>
              <strong>Nhà cung cấp:</strong> {currentBill?.vendorName}
            </p>
            <p>
              <strong>Tổng tiền:</strong> {currentBill?.totalAmount}
            </p>
            <p>
              <strong>Đã thanh toán:</strong> {currentBill?.amountPaid}
            </p>
            <p>
              <strong>Còn lại:</strong>{" "}
              <span style={{ color: "#dc3545", fontWeight: "bold" }}>
                ${remainingBalance.toFixed(2)}
              </span>
            </p>
          </div>

          <label
            style={{
              display: "block",
              margin: "16px 0 8px 0",
              fontWeight: "500",
            }}
          >
            Số tiền thanh toán:
          </label>
          <input
            type="number"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            placeholder="Nhập số tiền"
            max={remainingBalance}
            min="0"
            step="0.01"
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              marginBottom: "16px",
            }}
          />

          <div
            style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}
          >
            <button
              onClick={() => setShowPaymentModal(false)}
              style={{
                padding: "10px 20px",
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
              onClick={handlePaymentSubmit}
              disabled={loading.paying}
              style={{
                padding: "10px 20px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              {loading.paying ? "Đang xử lý..." : "Thanh toán"}
            </button>
          </div>
        </div>
      </div>
    );

  // Delete Confirmation Modal
  const renderDeleteConfirmModal = () =>
    showDeleteConfirm && (
      <div className="popup-overlay">
        <div className="popup-content" style={{ width: "400px" }}>
          <h3 style={{ marginTop: 0 }}>Xác nhận xóa</h3>
          <p>
            Bạn có chắc chắn muốn xóa hóa đơn{" "}
            <strong>{currentBill?.billNumber}</strong>?
          </p>
          <p style={{ color: "#dc3545" }}>Hành động này không thể hoàn tác!</p>

          <div
            style={{
              display: "flex",
              gap: "8px",
              justifyContent: "flex-end",
              marginTop: "20px",
            }}
          >
            <button
              onClick={() => setShowDeleteConfirm(false)}
              style={{
                padding: "10px 20px",
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
              onClick={handleDeleteConfirm}
              disabled={loading.deleting}
              style={{
                padding: "10px 20px",
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              {loading.deleting ? "Đang xóa..." : "Xóa"}
            </button>
          </div>
        </div>
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

  // Loading and error states
  if (loading.currentBill) {
    return (
      <div className="full-container">
        <div
          className="kiemkho-main-content"
          style={{ marginLeft: 0, width: "100%" }}
        >
          <div style={{ textAlign: "center", padding: "60px" }}>
            <h3>Đang tải chi tiết hóa đơn...</h3>
          </div>
        </div>
      </div>
    );
  }

  if (errors.currentBill) {
    return (
      <div className="full-container">
        <div
          className="kiemkho-main-content"
          style={{ marginLeft: 0, width: "100%" }}
        >
          <div style={{ textAlign: "center", padding: "60px" }}>
            <h3 style={{ color: "#dc3545" }}>Lỗi: {errors.currentBill}</h3>
            <button
              onClick={() => navigate("/hang-hoa/bill-management")}
              style={{
                padding: "10px 20px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                marginTop: "20px",
              }}
            >
              Quay lại danh sách hóa đơn
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentBill) {
    return (
      <div className="full-container">
        <div
          className="kiemkho-main-content"
          style={{ marginLeft: 0, width: "100%" }}
        >
          <div style={{ textAlign: "center", padding: "60px" }}>
            <h3>Không tìm thấy hóa đơn</h3>
            <button
              onClick={() => navigate("/hang-hoa/bill-management")}
              style={{
                padding: "10px 20px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                marginTop: "20px",
              }}
            >
              Quay lại danh sách hóa đơn
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="full-container">
      <div
        className="kiemkho-main-content"
        style={{ marginLeft: 0, width: "100%" }}
      >
        {renderBillHeader()}
        {renderBillInfo()}
        {renderBillLines()}
        {renderPaymentHistory()}
        {renderNotes()}
      </div>

      {renderPaymentModal()}
      {renderDeleteConfirmModal()}
      {renderToast()}
    </div>
  );
};

export default BillDetails;
