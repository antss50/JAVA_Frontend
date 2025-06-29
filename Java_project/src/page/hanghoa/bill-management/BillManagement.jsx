import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaSearch,
  FaFilter,
  FaPlus,
  FaEye,
  FaEdit,
  FaTrash,
  FaMoneyBillWave,
  FaDownload,
  FaFileInvoice,
  FaShoppingCart,
} from "react-icons/fa";
import useBillManagement from "../../../hooks/useBillManagement";
import "../product.css";

const BillManagement = () => {
  const navigate = useNavigate();

  // Helper function to format currency
  const formatCurrency = (amount) => {
    if (!amount) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const {
    bills,
    summary,
    pagination,
    loading,
    errors,
    loadBills,
    loadSummary,
    makePayment,
    deleteBill,
    searchBillByNumber,
    nextPage,
    previousPage,
    goToPage,
    changePageSize,
    changeSort,
    refreshAll,
    clearError,
  } = useBillManagement({ autoLoad: true });

  // Local state
  const [searchText, setSearchText] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    vendorName: "",
    fromDate: "",
    toDate: "",
  });
  const [selectedBill, setSelectedBill] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

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

  // Load data on component mount
  useEffect(() => {
    loadBills();
    loadSummary();
  }, []);

  // Event handlers
  const handleSearch = () => {
    if (searchText.trim()) {
      searchBillByNumber(searchText.trim());
    } else {
      loadBills();
    }
  };

  const handleClearSearch = () => {
    setSearchText("");
    setFilters({
      status: "",
      vendorName: "",
      fromDate: "",
      toDate: "",
    });
    loadBills();
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    // For now, we'll implement client-side filtering
    // In a real app, you'd pass these filters to the API
    loadBills();
    setShowFilters(false);
  };

  const handlePaymentClick = (bill) => {
    setSelectedBill(bill);
    setPaymentAmount("");
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async () => {
    if (!selectedBill || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      showToast("Vui lòng nhập số tiền hợp lệ", "error");
      return;
    }

    const result = await makePayment(
      selectedBill.id,
      parseFloat(paymentAmount)
    );

    if (result.success) {
      showToast("Thanh toán thành công");
      setShowPaymentModal(false);
      setSelectedBill(null);
      setPaymentAmount("");
      loadSummary(); // Refresh summary after payment
    } else {
      showToast(result.error || "Có lỗi xảy ra khi thanh toán", "error");
    }
  };

  const handleDeleteClick = (bill) => {
    setShowDeleteConfirm(bill);
  };

  const handleDeleteConfirm = async () => {
    if (!showDeleteConfirm) return;

    const result = await deleteBill(showDeleteConfirm.id);

    if (result.success) {
      showToast("Xóa hóa đơn thành công");
      setShowDeleteConfirm(null);
      loadSummary(); // Refresh summary after deletion
    } else {
      showToast(result.error || "Có lỗi xảy ra khi xóa hóa đơn", "error");
    }
  };

  const handleSortChange = (field) => {
    const currentSort = pagination.sort || "";
    const direction = currentSort.includes("desc") ? "asc" : "desc";
    changeSort(`${field},${direction}`);
  };

  // Calculate remaining balance for payment modal
  const remainingBalance = selectedBill
    ? (selectedBill.totalAmount || 0) - (selectedBill.amountPaid || 0)
    : 0;

  // Render helper functions
  const renderSummaryCards = () => (
    <div
      className="summary-cards"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "16px",
        marginBottom: "24px",
      }}
    >
      <div
        className="summary-card"
        style={{
          background: "#f8f9fa",
          padding: "20px",
          borderRadius: "8px",
          border: "1px solid #dee2e6",
        }}
      >
        <h4 style={{ margin: "0 0 8px 0", color: "#495057" }}>Tổng công nợ</h4>
        <p
          style={{
            margin: 0,
            fontSize: "24px",
            fontWeight: "bold",
            color: "#dc3545",
          }}
        >
          {summary?.totalOutstanding
            ? formatCurrency(summary.totalOutstanding)
            : "0 ₫"}
        </p>
      </div>

      <div
        className="summary-card"
        style={{
          background: "#f8f9fa",
          padding: "20px",
          borderRadius: "8px",
          border: "1px solid #dee2e6",
        }}
      >
        <h4 style={{ margin: "0 0 8px 0", color: "#495057" }}>
          Hóa đơn quá hạn
        </h4>
        <p
          style={{
            margin: 0,
            fontSize: "24px",
            fontWeight: "bold",
            color: "#dc3545",
          }}
        >
          {summary?.overdueCount || 0}
        </p>{" "}
        <small style={{ color: "#6c757d" }}>
          Tổng:{" "}
          {summary?.overdueAmount
            ? formatCurrency(summary.overdueAmount)
            : "0 ₫"}
        </small>
      </div>

      <div
        className="summary-card"
        style={{
          background: "#f8f9fa",
          padding: "20px",
          borderRadius: "8px",
          border: "1px solid #dee2e6",
        }}
      >
        <h4 style={{ margin: "0 0 8px 0", color: "#495057" }}>Tổng hóa đơn</h4>
        <p
          style={{
            margin: 0,
            fontSize: "24px",
            fontWeight: "bold",
            color: "#28a745",
          }}
        >
          {pagination.totalElements || bills.length || 0}
        </p>
      </div>
    </div>
  );

  const renderSearchSection = () => (
    <div className="kiemkho-search-box">
      <h4>Tìm kiếm & Bộ lọc</h4>

      <div className="search-inputs">
        <input
          type="text"
          placeholder="Nhập mã hóa đơn"
          className="kiemkho-input"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSearch()}
        />

        <button
          onClick={handleSearch}
          className="search-btn"
          style={{ marginBottom: "10px", width: "100%" }}
        >
          🔍 Tìm kiếm
        </button>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="search-btn"
          style={{
            marginBottom: "10px",
            width: "100%",
            backgroundColor: showFilters ? "#28a745" : "#007bff",
          }}
        >
          <FaFilter /> Bộ lọc {showFilters ? "(Đang mở)" : ""}
        </button>

        <button
          onClick={handleClearSearch}
          className="search-btn"
          style={{
            marginBottom: "10px",
            width: "100%",
            backgroundColor: "#6c757d",
          }}
        >
          🗑️ Xóa bộ lọc
        </button>
      </div>

      {showFilters && (
        <div className="filters-section" style={{ marginTop: "16px" }}>
          <label
            style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}
          >
            Trạng thái:
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="kiemkho-input"
              style={{ marginTop: "4px" }}
            >
              <option value="">Tất cả</option>
              <option value="PENDING">Chờ xử lý</option>
              <option value="APPROVED">Đã duyệt</option>
              <option value="PAID">Đã thanh toán</option>
              <option value="PARTIALLY_PAID">Thanh toán một phần</option>
              <option value="OVERDUE">Quá hạn</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
          </label>

          <label
            style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}
          >
            Nhà cung cấp:
            <input
              type="text"
              value={filters.vendorName}
              onChange={(e) => handleFilterChange("vendorName", e.target.value)}
              placeholder="Tên nhà cung cấp"
              className="kiemkho-input"
              style={{ marginTop: "4px" }}
            />
          </label>

          <label
            style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}
          >
            Từ ngày:
            <input
              type="date"
              value={filters.fromDate}
              onChange={(e) => handleFilterChange("fromDate", e.target.value)}
              className="kiemkho-input"
              style={{ marginTop: "4px" }}
            />
          </label>

          <label
            style={{
              display: "block",
              marginBottom: "16px",
              fontWeight: "500",
            }}
          >
            Đến ngày:
            <input
              type="date"
              value={filters.toDate}
              onChange={(e) => handleFilterChange("toDate", e.target.value)}
              className="kiemkho-input"
              style={{ marginTop: "4px" }}
            />
          </label>

          <button
            onClick={handleApplyFilters}
            className="kiemkho-button"
            style={{ width: "100%" }}
          >
            Áp dụng bộ lọc
          </button>
        </div>
      )}
    </div>
  );

  const renderTableHeader = () => (
    <div className="kiemkho-header">
      <h2 className="kiemkho-title">LỊCH SỬ NHẬP HÀNG</h2>
      <div className="header-actions" style={{ display: "flex", gap: "12px" }}>
        <button
          className="kiemkho-button"
          onClick={() => navigate("/hang-hoa/bill-management/purchase-order")}
          style={{ backgroundColor: "#28a745" }}
        >
          <FaShoppingCart /> Tạo đơn hàng
        </button>
        <button
          className="kiemkho-button"
          onClick={() => navigate("/hang-hoa/bill-management/new")}
          style={{ backgroundColor: "#17a2b8" }}
        >
          <FaFileInvoice /> Tạo hóa đơn
        </button>
        <button
          onClick={refreshAll}
          className="kiemkho-button"
          disabled={loading.bills}
        >
          <FaDownload /> {loading.bills ? "Đang tải..." : "Làm mới"}
        </button>
      </div>
    </div>
  );

  const renderBillsTable = () => (
    <table className="table table-hover mb-0">
      <thead className="table-light text-center">
        <tr>
          <th onClick={() => handleSortChange("billNumber")} style={{ cursor: "pointer" }}>
            Mã hóa đơn ↕
          </th>
          <th onClick={() => handleSortChange("vendorName")} style={{ cursor: "pointer" }}>
            Nhà cung cấp ↕
          </th>
          <th onClick={() => handleSortChange("billDate")} style={{ cursor: "pointer" }}>
            Ngày tạo ↕
          </th>
          <th onClick={() => handleSortChange("dueDate")} style={{ cursor: "pointer" }}>
            Ngày đến hạn ↕
          </th>
          <th>Tổng tiền</th>
          <th>Đã thanh toán</th>
          <th>Còn lại</th>
          <th>Trạng thái</th>
          <th>Thao tác</th>
        </tr>
      </thead>
      <tbody className="text-center">
        {loading.bills ? (
          <tr>
            <td colSpan="9" className="no-data">Đang tải dữ liệu...</td>
          </tr>
        ) : bills.length === 0 ? (
          <tr>
            <td colSpan="9" className="no-data">
              {errors.bills ? `Lỗi: ${errors.bills}` : "Không có dữ liệu"}
            </td>
          </tr>
        ) : (
          bills.map((bill) => (
            <tr key={bill.id}>
              <td>
                <span className="badge bg-secondary">{bill.billNumber}</span>
              </td>
              <td className="fw-bold">{bill.vendorName}</td>
              <td>{new Date(bill.billDate).toLocaleDateString("vi-VN")}</td>
              <td className={bill.isOverdue ? "text-danger fw-bold" : ""}>
                {new Date(bill.dueDate).toLocaleDateString("vi-VN")}
              </td>
              <td>{bill.totalAmount?.toLocaleString()} </td>
              <td>{bill.amountPaid?.toLocaleString()} </td>
              <td className="fw-bold text-danger">{bill.outstandingAmount?.toLocaleString()}</td>
              <td>
                <span className={`badge ${bill.statusBadge?.class}`} style={{
                  backgroundColor: bill.statusBadge?.color || "#888",
                  color: "white",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontWeight: "bold"
                }}>
                  {bill.statusBadge?.text || "Không rõ"}
                </span>
              </td>
              <td>
                <div className="d-flex justify-content-center gap-2">
                  <button
                    onClick={() => navigate(`/hang-hoa/bill-management/${bill.id}`)}
                    className="btn btn-sm btn-primary"
                    title="Xem chi tiết"
                  >
                    <FaEye />
                  </button>
                  {bill.status !== "PAID" && (
                    <button
                      onClick={() => handlePaymentClick(bill)}
                      className="btn btn-sm btn-success"
                      title="Thanh toán"
                    >
                      <FaMoneyBillWave />
                    </button>
                  )}
                  <button
                    onClick={() => navigate(`/hang-hoa/bill-management/edit/${bill.id}`)}
                    className="btn btn-sm btn-warning text-dark"
                    title="Sửa"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(bill)}
                    className="btn btn-sm btn-danger"
                    title="Xóa"
                  >
                    <FaTrash />
                  </button>
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>

  );

  const renderPagination = () => (
    <div
      className="pagination-section"
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: "20px",
        padding: "16px",
        backgroundColor: "#f8f9fa",
        borderRadius: "8px",
      }}
    >
      <div className="pagination-info">
        <span>{pagination.displayText}</span>
      </div>

      <div
        className="pagination-controls"
        style={{ display: "flex", gap: "8px", alignItems: "center" }}
      >
        <button
          onClick={previousPage}
          disabled={!pagination.hasPreviousPage}
          className="kiemkho-button"
          style={{
            padding: "8px 12px",
            backgroundColor: pagination.hasPreviousPage ? "#007bff" : "#6c757d",
          }}
        >
          Trước
        </button>

        <span style={{ margin: "0 16px" }}>
          Trang {pagination.currentPage + 1} / {pagination.totalPages}
        </span>

        <button
          onClick={nextPage}
          disabled={!pagination.hasNextPage}
          className="kiemkho-button"
          style={{
            padding: "8px 12px",
            backgroundColor: pagination.hasNextPage ? "#007bff" : "#6c757d",
          }}
        >
          Sau
        </button>

        <select
          value={pagination.pageSize}
          onChange={(e) => changePageSize(parseInt(e.target.value))}
          style={{
            padding: "8px",
            marginLeft: "16px",
            borderRadius: "4px",
            border: "1px solid #ccc",
          }}
        >
          <option value={10}>10 / trang</option>
          <option value={20}>20 / trang</option>
          <option value={50}>50 / trang</option>
        </select>
      </div>
    </div>
  );

  // Payment Modal
  const renderPaymentModal = () =>
    showPaymentModal && (
      <div className="popup-overlay">
        <div className="popup-content" style={{ width: "400px" }}>
          <h3 style={{ marginTop: 0 }}>Thanh toán hóa đơn</h3>
          <p>
            <strong>Mã hóa đơn:</strong> {selectedBill?.billNumber}
          </p>
          <p>
            <strong>Nhà cung cấp:</strong> {selectedBill?.vendorName}
          </p>
          <p>
            <strong>Tổng tiền:</strong> {selectedBill?.totalAmount}
          </p>
          <p>
            <strong>Đã thanh toán:</strong> {selectedBill?.amountPaid}
          </p>
          <p>
            {" "}
            <strong>Còn lại:</strong>{" "}
            <span style={{ color: "#dc3545", fontWeight: "bold" }}>
              {remainingBalance.toLocaleString("vi-VN")} ₫
            </span>
          </p>

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
            <strong>{showDeleteConfirm.billNumber}</strong>?
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
              onClick={() => setShowDeleteConfirm(null)}
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

  return (
    <div className="full-container">
      {renderSearchSection()}

      <div className="kiemkho-main-content">
        {renderSummaryCards()}
        {renderTableHeader()}
        {renderBillsTable()}
        {renderPagination()}
      </div>

      {renderPaymentModal()}
      {renderDeleteConfirmModal()}
      {renderToast()}
    </div>
  );
};

export default BillManagement;
