// src/page/hanghoa/StockCheckForm.jsx

/**
 * Stock Check Form Component
 * Handles creating new stock checks (both single and batch)
 */

import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaList,
  FaPlus,
  FaTrash,
  FaSearch,
  FaSave,
  FaCheck,
} from "react-icons/fa";
import useStockCheckCreation from "/src/hooks/useStockCheckCreation_new.js";
import "../product.css";

const StockCheckForm = () => {
  const navigate = useNavigate();
  const searchInputRef = useRef(null);
  const {
    // State
    products,
    allProducts,
    filteredProducts,
    selectedProducts,
    searchQuery,
    batchResults,

    // Loading states
    productsLoading,
    allProductsLoading,
    batchLoading,

    // Error states
    productsError,
    allProductsError,
    error,

    // Operations
    searchProducts,
    fetchAllProducts,
    addProductToSelection,
    removeProductFromSelection,
    updateExpectedQuantity,
    updateProductNotes,
    clearSelection,
    performBatchStockCheck,
    clearBatchResults,
    clearError,

    // Utilities
    generateCheckReference,
  } = useStockCheckCreation();
  // =============================================================================
  // LOCAL STATE
  // =============================================================================
  const [checkReference, setCheckReference] = useState("");
  const [checkedBy, setCheckedBy] = useState(
    localStorage.getItem("username") || ""
  );
  const [checkNotes, setCheckNotes] = useState("");
  const [checkStatus, setCheckStatus] = useState("DRAFT"); // DRAFT, COMPLETED
  const [showResults, setShowResults] = useState(false);

  // =============================================================================
  // EFFECTS
  // =============================================================================

  // Initialize check reference
  useEffect(() => {
    if (!checkReference) {
      setCheckReference(generateCheckReference());
    }
  }, [checkReference, generateCheckReference]);

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================
  const handleProductSearch = async (query) => {
    // The filtering is now handled automatically by the hook
    await searchProducts(query);
  };

  const handleAddProduct = (product) => {
    addProductToSelection(product);
    // Clear search by calling searchProducts with empty string
    searchProducts("");
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handleRemoveProduct = (productId) => {
    removeProductFromSelection(productId);
  };

  const handleExpectedQuantityChange = (productId, quantity) => {
    updateExpectedQuantity(productId, quantity);
  };

  const handleNotesChange = (productId, notes) => {
    updateProductNotes(productId, notes);
  };
  const handlePerformStockCheck = async () => {
    if (selectedProducts.length === 0) {
      alert("Vui lòng chọn ít nhất một sản phẩm để kiểm kho");
      return;
    }

    if (!checkedBy.trim()) {
      alert("Vui lòng nhập tên người kiểm");
      return;
    }

    try {
      clearError();

      const result = await performBatchStockCheck({
        checkedBy: checkedBy.trim(),
        checkReference: checkReference,
      });

      if (checkStatus === "COMPLETED") {
        setShowResults(true);
        alert(`Hoàn thành kiểm kho cho ${result.results.length} sản phẩm`);
      } else {
        alert("Đã lưu tạm phiếu kiểm kho");
      }
    } catch (err) {
      alert("Có lỗi xảy ra khi thực hiện kiểm kho");
    }
  };

  const handleSaveDraft = async () => {
    setCheckStatus("DRAFT");
    await handlePerformStockCheck();
  };

  const handleComplete = async () => {
    setCheckStatus("COMPLETED");
    await handlePerformStockCheck();
    // Navigate back to StockCheckManagement after completion
    navigate("/hang-hoa/kiem-kho");
  };
  const handleNewCheck = () => {
    clearSelection();
    clearBatchResults();
    setShowResults(false);
    setCheckReference(generateCheckReference());
    setCheckNotes("");
  };

  const handleGoBack = () => {
    navigate("/hang-hoa/kiem-kho");
  };

  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================

  const totalExpectedQuantity = selectedProducts.reduce(
    (sum, product) => sum + (product.expectedQuantity || 0),
    0
  );

  const hasVariances =
    batchResults && batchResults.results.some((r) => r.hasVariance);

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================
  const renderProductSearch = () => (
    <div className="product-search-section">
      <div className="search-input-container">
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Tìm kiếm sản phẩm theo tên hoặc mã..."
          value={searchQuery}
          onChange={(e) => handleProductSearch(e.target.value)}
          className="product-search-input bg-light text-dark"
        />
        <FaSearch className="search-icon" />
      </div>{" "}
      {allProductsError && (
        <div className="search-error">
          Lỗi tải sản phẩm:{" "}
          {typeof allProductsError === "string"
            ? allProductsError
            : allProductsError.message || "Không thể tải danh sách sản phẩm"}
        </div>
      )}
    </div>
  );

  const renderProductList = () => (
    <div className="product-list-section">
      <h3>Danh sách sản phẩm ({filteredProducts.length})</h3>

      {allProductsLoading ? (
        <div className="loading-message">Đang tải danh sách sản phẩm...</div>
      ) : filteredProducts.length === 0 ? (
        <div className="no-products-message">
          {searchQuery
            ? "Không tìm thấy sản phẩm nào"
            : "Không có sản phẩm nào"}
        </div>
      ) : (
        <div className="product-list-table">
          <table className="products-table">
            <thead>
              <tr>
                <th>Mã SP</th>
                <th>Tên sản phẩm</th>
                <th>Danh mục</th>
                <th>Tồn kho</th>
                <th>Đơn vị</th>
                <th>Giá bán</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td>{product.id}</td>
                  <td>{product.name}</td>
                  <td>{product.category?.name || "N/A"}</td>
                  <td>{product.currentStock || 0}</td>
                  <td>{product.unit}</td>
                  <td>{product.sellingPrice?.toLocaleString() || "N/A"}</td>
                  <td>
                    <button
                      onClick={() => handleAddProduct(product)}
                      className="add-product-btn"
                      disabled={selectedProducts.some(
                        (p) => p.id === product.id
                      )}
                    >
                      {selectedProducts.some((p) => p.id === product.id) ? (
                        "Đã chọn"
                      ) : (
                        <>
                          <FaPlus /> Chọn
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderSelectedProductsTable = () => (
    <div className="selected-products-section">
      <table className="table table-hover table-bordered kiemkhochitiet-table">
        <thead className="table-light text-center">
          <tr>
            <th>STT</th>
            <th>Mã hàng hóa</th>
            <th>Tên hàng</th>
            <th>Tồn kho hiện tại</th>
            <th>Số lượng dự kiến</th>
            <th>Đơn vị</th>
            <th>Ghi chú</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody className="align-middle text-center">
          {selectedProducts.length === 0 ? (
            <tr>
              <td colSpan="8" className="text-muted">
                Chưa có sản phẩm nào được chọn. Sử dụng ô tìm kiếm bên trên để thêm sản phẩm.
              </td>
            </tr>
          ) : (
            selectedProducts.map((product, index) => (
              <tr key={product.id}>
                <td>{index + 1}</td>
                <td>{product.id}</td>
                <td className="text-start fw-semibold">{product.name}</td>
                <td>{product.currentStock?.toLocaleString() || 0}</td>
                <td>
                  <input
                    type="number"
                    value={product.expectedQuantity || ""}
                    onChange={(e) => handleExpectedQuantityChange(product.id, e.target.value)}
                    min="0"
                    step="0.01"
                    className="form-control form-control-sm text-end"
                    style={{ maxWidth: "100px", margin: "0 auto" }}
                  />
                </td>
                <td>{product.unit}</td>
                <td>
                  <input
                    type="text"
                    value={product.notes || ""}
                    onChange={(e) => handleNotesChange(product.id, e.target.value)}
                    placeholder="Ghi chú..."
                    className="form-control form-control-sm"
                  />
                </td>
                <td>
                  <button
                    onClick={() => handleRemoveProduct(product.id)}
                    className="btn btn-sm btn-danger"
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

  const renderCheckInformation = () => (
    <div className="kiemkhochitiet-info">
      <div className="info-section">
        <label>
          Nhân viên kiểm <span className="required">*</span>
          <input
            type="text"
            value={checkedBy}
            onChange={(e) => setCheckedBy(e.target.value)}
            placeholder="Nhập tên người kiểm"
            className="bg-light text-dark"
            required
          />
        </label>

        <label>
          Ngày kiểm
          <input
            type="date"
            value={new Date().toISOString().split("T")[0]}
            className="bg-light text-dark"
            readOnly
          />
        </label>

        <label>
          Mã phiếu kiểm
          <input
            type="text"
            value={checkReference}
            onChange={(e) => setCheckReference(e.target.value)}
            className="bg-light text-dark"
          />
        </label>

        <label>
          Tổng SL dự kiến
          <input
            type="number"
            value={totalExpectedQuantity}
            readOnly
            className="readonly-input"
          />
        </label>

        <label>
          Ghi chú chung
          <textarea
            value={checkNotes}
            onChange={(e) => setCheckNotes(e.target.value)}
            placeholder="Ghi chú cho toàn bộ phiếu kiểm..."
            className="bg-light text-dark"
            rows="3"
          />
        </label>
      </div>
    </div>
  ); // Close renderCheckInformation

  const renderActionButtons = () => (
    <div className="kiemkhochitiet-buttons">
      <button onClick={handleGoBack} className="back-btn">
        Quay lại
      </button>

      <button
        onClick={handleNewCheck}
        className="new-check-btn"
        disabled={selectedProducts.length === 0}
      >
        <FaPlus /> Phiếu mới
      </button>

      <button
        onClick={handleSaveDraft}
        className="draft-btn"
        disabled={batchLoading || selectedProducts.length === 0}
      >
        <FaSave /> {batchLoading ? "Đang lưu..." : "Lưu tạm"}
      </button>

      <button
        onClick={handleComplete}
        className="submit-btn"
        disabled={
          batchLoading || selectedProducts.length === 0 || !checkedBy.trim()
        }
      >
        <FaCheck /> {batchLoading ? "Đang xử lý..." : "Hoàn thành"}
      </button>
    </div>
  );

  const renderBatchResults = () => {
    if (!batchResults || !showResults) return null;

    return (
      <div className="batch-results-section">
        <h3>Kết quả kiểm kho</h3>

        {/* Summary */}
        <div className="results-summary">
          <div className="summary-cards">
            <div className="summary-card">
              <h4>Tổng sản phẩm</h4>
              <p>{batchResults.summary.totalItems}</p>
            </div>
            <div className="summary-card error">
              <h4>Có chênh lệch</h4>
              <p>{batchResults.summary.itemsWithVariance}</p>
            </div>
            <div className="summary-card success">
              <h4>Chính xác</h4>
              <p>{batchResults.summary.matches}</p>
            </div>
            <div className="summary-card warning">
              <h4>Tỷ lệ chính xác</h4>
              <p>{batchResults.summary.accuracyRate}</p>
            </div>
          </div>
        </div>

        {/* Individual Results */}
        <div className="results-table-section">
          <table className="results-table">
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Dự kiến</th>
                <th>Thực tế</th>
                <th>Chênh lệch</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {batchResults.results.map((result) => (
                <tr
                  key={result.checkResultId}
                  className={`result-${result.statusColor}`}
                >
                  <td>{result.productName}</td>
                  <td>{result.expectedQuantity}</td>
                  <td>{result.actualQuantity}</td>
                  <td className={result.hasVariance ? "variance" : ""}>
                    {result.variance}
                  </td>
                  <td>
                    <span className={`status-badge ${result.statusColor}`}>
                      {result.statusLabel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {hasVariances && (
          <div className="variance-warning">
            <strong>⚠️ Phát hiện chênh lệch:</strong> Vui lòng kiểm tra và xử lý
            các sản phẩm có chênh lệch.
          </div>
        )}
      </div>
    );
  };

  // =============================================================================
  // ERROR HANDLING
  // =============================================================================

  if (error && !batchLoading) {
    return (
      <div className="full-container">
        {" "}
        <div className="error-container">
          <h2>Có lỗi xảy ra</h2>
          <p>
            {typeof error === "string"
              ? error
              : error.message || "Đã xảy ra lỗi không xác định"}
          </p>
          <button onClick={() => clearError()}>Đóng</button>
        </div>
      </div>
    );
  }

  // =============================================================================
  // MAIN RENDER
  // =============================================================================
  return (
    <div className="kiemkhochitiet-container full-container">
      <div className="form-header">
        <h2>PHIẾU KIỂM KHO CHI TIẾT</h2>
        <div className="form-status">
          <span className={`status-indicator ${checkStatus.toLowerCase()}`}>
            {checkStatus === "DRAFT" ? "Nháp" : "Hoàn thành"}
          </span>
        </div>
      </div>

      {/* Product Search */}
      {renderProductSearch()}

      {/* Product List */}
      {renderProductList()}

      {/* Main Content */}
      <div className="kiemkhochitiet-table-section">
        {/* Selected Products Table */}
        {renderSelectedProductsTable()}

        {/* Check Information */}
        {renderCheckInformation()}
      </div>

      {/* Action Buttons */}
      {renderActionButtons()}

      {/* Batch Results */}
      {renderBatchResults()}

      {/* Loading Overlay */}
      {batchLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner">
            <div>Đang thực hiện kiểm kho...</div>
            <div className="spinner"></div>
          </div>
        </div>
      )}

      <style>{`
        .form-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 2px solid #eee;
        }

        .form-header h2 {
          margin: 0;
          color: #333;
        }

        .status-indicator {
          padding: 4px 12px;
          border-radius: 4px;
          font-weight: bold;
          font-size: 12px;
        }

        .status-indicator.draft {
          background: #fff3cd;
          color: #856404;
        }

        .status-indicator.completed {
          background: #d4edda;
          color: #155724;
        }

        .product-search-section {
          margin-bottom: 20px;
          position: relative;
        }

        .search-input-container {
          position: relative;
          display: flex;
          align-items: center;
        }

        .product-search-input {
          width: 100%;
          padding: 12px 40px 12px 16px;
          border: 2px solid #ddd;
          border-radius: 8px;
          font-size: 16px;
        }

        .product-search-input:focus {
          border-color: #007bff;
          outline: none;
        }

        .search-icon {
          position: absolute;
          right: 12px;
          color: #666;
        }

        .product-search-results {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #ddd;
          border-top: none;
          border-radius: 0 0 8px 8px;
          max-height: 300px;
          overflow-y: auto;
          z-index: 1000;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .search-loading,
        .no-search-results {
          padding: 20px;
          text-align: center;
          color: #666;
        }

        .search-results-list {
          max-height: 300px;
          overflow-y: auto;
        }

        .search-result-item {
          padding: 12px 16px;
          border-bottom: 1px solid #eee;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .search-result-item:hover {
          background: #f8f9fa;
        }

        .search-result-item:last-child {
          border-bottom: none;
        }

        .product-info {
          flex: 1;
        }

        .product-info strong {
          display: block;
          color: #333;
        }

        .product-details {
          font-size: 12px;
          color: #666;
        }

        .product-price {
          font-weight: bold;
          color: #007bff;
        }        .search-error {
          padding: 10px;
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
          border-radius: 4px;
          margin-top: 10px;
        }

        .product-list-section {
          margin-bottom: 20px;
          background: white;
          border-radius: 8px;
          padding: 20px;
          border: 1px solid #ddd;
        }

        .product-list-section h3 {
          margin-top: 0;
          color: #333;
          border-bottom: 1px solid #eee;
          padding-bottom: 10px;
        }

        .loading-message,
        .no-products-message {
          text-align: center;
          padding: 20px;
          color: #666;
          font-style: italic;
        }

        .product-list-table {
          max-height: 400px;
          overflow-y: auto;
        }

        .products-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }

        .products-table th {
          background: #f8f9fa;
          padding: 10px;
          text-align: left;
          border: 1px solid #ddd;
          font-weight: bold;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .products-table td {
          padding: 10px;
          border: 1px solid #ddd;
        }

        .products-table tr:hover {
          background: #f8f9fa;
        }

        .add-product-btn {
          background: #28a745;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
        }

        .add-product-btn:hover:not(:disabled) {
          background: #218838;
        }

        .add-product-btn:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }

        .selected-products-section {
          margin-bottom: 20px;
        }

        .quantity-input,
        .notes-input {
          width: 100%;
          padding: 6px 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        .quantity-input {
          text-align: center;
          max-width: 100px;
        }

        .remove-btn {
          background: #dc3545;
          color: white;
          border: none;
          padding: 6px 8px;
          border-radius: 4px;
          cursor: pointer;
        }

        .remove-btn:hover {
          background: #c82333;
        }

        .info-section {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .info-section label {
          display: flex;
          flex-direction: column;
          gap: 5px;
          font-weight: bold;
        }

        .required {
          color: #dc3545;
        }

        .readonly-input {
          background: #f8f9fa;
          border-color: #e9ecef;
        }

        .kiemkhochitiet-buttons {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          margin-top: 20px;
        }

        .back-btn {
          background: #6c757d;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
        }

        .new-check-btn {
          background: #17a2b8;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .draft-btn {
          background: #ffc107;
          color: #000;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .submit-btn {
          background: #28a745;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .back-btn:hover {
          background: #5a6268;
        }
        .new-check-btn:hover {
          background: #138496;
        }
        .draft-btn:hover {
          background: #e0a800;
        }
        .submit-btn:hover {
          background: #218838;
        }

        .back-btn:disabled,
        .new-check-btn:disabled,
        .draft-btn:disabled,
        .submit-btn:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }

        .batch-results-section {
          margin-top: 30px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .batch-results-section h3 {
          margin-top: 0;
          color: #333;
        }

        .results-summary {
          margin-bottom: 20px;
        }

        .summary-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
        }

        .summary-card {
          background: white;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .summary-card h4 {
          margin: 0 0 10px 0;
          font-size: 14px;
          color: #666;
        }

        .summary-card p {
          margin: 0;
          font-size: 24px;
          font-weight: bold;
        }

        .summary-card.success p {
          color: #28a745;
        }
        .summary-card.error p {
          color: #dc3545;
        }
        .summary-card.warning p {
          color: #ffc107;
        }

        .results-table-section {
          background: white;
          border-radius: 8px;
          overflow: hidden;
        }

        .results-table {
          width: 100%;
          border-collapse: collapse;
        }

        .results-table th {
          background: #f8f9fa;
          padding: 12px;
          text-align: left;
          border-bottom: 2px solid #dee2e6;
        }

        .results-table td {
          padding: 12px;
          border-bottom: 1px solid #dee2e6;
        }

        .result-success {
          background-color: rgba(40, 167, 69, 0.05);
        }
        .result-danger {
          background-color: rgba(220, 53, 69, 0.05);
        }
        .result-warning {
          background-color: rgba(255, 193, 7, 0.05);
        }

        .variance {
          font-weight: bold;
          color: #dc3545;
        }

        .status-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
        }

        .status-badge.success {
          background: #d4edda;
          color: #155724;
        }

        .status-badge.danger {
          background: #f8d7da;
          color: #721c24;
        }

        .status-badge.warning {
          background: #fff3cd;
          color: #856404;
        }

        .variance-warning {
          margin-top: 15px;
          padding: 15px;
          background: #fff3cd;
          color: #856404;
          border: 1px solid #ffeaa7;
          border-radius: 4px;
        }

        .loading-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
        }

        .loading-spinner {
          background: white;
          padding: 30px;
          border-radius: 8px;
          text-align: center;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #007bff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 15px auto;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .no-data {
          text-align: center;
          color: #666;
          font-style: italic;
          padding: 40px;
        }

        .error-container {
          text-align: center;
          padding: 40px;
        }

        .error-container button {
          background: #007bff;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          margin-top: 20px;
        }
      `}</style>
    </div>
  );
};

export default StockCheckForm;
