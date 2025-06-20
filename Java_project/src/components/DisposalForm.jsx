import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useProductWithStock } from "../hooks/useProductWithStock";
import { useExportDestroy } from "../hooks/useExportDestroy";
import {
  DISPOSAL_REASONS,
  DISPOSAL_METHODS,
  getDisposalReasonText,
  getDisposalMethodText,
  generateDisposalReference,
} from "../utils/inventory-related/exportDestroyFormatter";

const DisposalForm = ({ onClose, onSuccess }) => {
  // Hooks
  const {
    allProducts,
    searchProducts,
    filteredProducts,
    searchQuery,
    allProductsLoading,
    allProductsError,
  } = useProductWithStock({
    autoFetch: true,
  });

  const {
    submitting,
    error: disposalError,
    validationErrors,
    recordDisposal,
    validateDisposal,
    clearError,
    generateReference,
  } = useExportDestroy();

  // Form state
  const [formData, setFormData] = useState({
    disposalDate: new Date().toISOString().split("T")[0],
    disposalReason: "",
    disposalMethod: "",
    approvedBy: "",
    notes: "",
    referenceNumber: generateDisposalReference(),
    items: [],
  });

  // UI state
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [productSearch, setProductSearch] = useState("");
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [currentEditingItem, setCurrentEditingItem] = useState(null);

  // Product search effect
  useEffect(() => {
    if (productSearch.trim()) {
      searchProducts(productSearch);
    }
  }, [productSearch, searchProducts]);

  /**
   * Handle form field changes
   */
  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    clearError();
  };

  /**
   * Add product to disposal items
   */
  const handleAddProduct = (product) => {
    const existingItem = formData.items.find(
      (item) => item.productId === product.id
    );

    if (existingItem) {
      alert("Sản phẩm đã được thêm vào danh sách");
      return;
    }

    const newItem = {
      productId: product.id,
      productName: product.name,
      productUnit: product.unit || "cái",
      currentStock: product.currentStock || 0,
      quantityToDispose: 1,
      batchNumber: "",
      expirationDate: "",
      notes: "",
    };

    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));

    setSelectedProducts((prev) => [...prev, product]);
    setShowProductSelector(false);
    setProductSearch("");
  };

  /**
   * Remove product from disposal items
   */
  const handleRemoveProduct = (productId) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.productId !== productId),
    }));

    setSelectedProducts((prev) =>
      prev.filter((product) => product.id !== productId)
    );
  };

  /**
   * Update disposal item
   */
  const handleUpdateItem = (itemIndex, field, value) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, index) =>
        index === itemIndex ? { ...item, [field]: value } : item
      ),
    }));
  };

  /**
   * Validate form before submission
   */
  const validateForm = () => {
    const validation = validateDisposal(formData);
    return validation.isValid;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const result = await recordDisposal(formData);

      if (result && result.success) {
        onSuccess(result);
      }
    } catch (error) {
      console.error("Error recording disposal:", error);
    }
  };

  /**
   * Filter available products (exclude already selected)
   */
  const availableProducts = useMemo(() => {
    const selectedIds = new Set(selectedProducts.map((p) => p.id));
    return filteredProducts.filter((product) => !selectedIds.has(product.id));
  }, [filteredProducts, selectedProducts]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content disposal-form-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>Tạo phiếu xuất hủy</h3>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="disposal-form">
          <div className="modal-body">
            {/* Error Display */}
            {(disposalError || allProductsError) && (
              <div className="error-message">
                <span>
                  ❌ {disposalError?.message || allProductsError?.message}
                </span>
                <button type="button" onClick={clearError}>
                  ✕
                </button>
              </div>
            )}

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="validation-errors">
                <h4>⚠️ Lỗi validation:</h4>
                <ul>
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* General Information */}
            <div className="form-section">
              <h4>Thông tin chung</h4>
              <div className="form-grid">
                <div className="form-group">
                  <label>Ngày xuất hủy *</label>
                  <input
                    type="date"
                    value={formData.disposalDate}
                    onChange={(e) =>
                      handleFieldChange("disposalDate", e.target.value)
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Mã tham chiếu</label>
                  <input
                    type="text"
                    value={formData.referenceNumber}
                    onChange={(e) =>
                      handleFieldChange("referenceNumber", e.target.value)
                    }
                    placeholder="Tự động tạo nếu để trống"
                  />
                </div>

                <div className="form-group">
                  <label>Lý do xuất hủy *</label>
                  <select
                    value={formData.disposalReason}
                    onChange={(e) =>
                      handleFieldChange("disposalReason", e.target.value)
                    }
                    required
                  >
                    <option value="">Chọn lý do</option>
                    {Object.entries(DISPOSAL_REASONS).map(([key, value]) => (
                      <option key={key} value={value}>
                        {getDisposalReasonText(value)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Phương thức xử lý *</label>
                  <select
                    value={formData.disposalMethod}
                    onChange={(e) =>
                      handleFieldChange("disposalMethod", e.target.value)
                    }
                    required
                  >
                    <option value="">Chọn phương thức</option>
                    {Object.entries(DISPOSAL_METHODS).map(([key, value]) => (
                      <option key={key} value={value}>
                        {getDisposalMethodText(value)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Người phê duyệt</label>
                  <input
                    type="text"
                    value={formData.approvedBy}
                    onChange={(e) =>
                      handleFieldChange("approvedBy", e.target.value)
                    }
                    placeholder="Nhập tên người phê duyệt"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Ghi chú</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleFieldChange("notes", e.target.value)}
                    placeholder="Nhập ghi chú về việc xuất hủy"
                    rows="3"
                  />
                </div>
              </div>
            </div>

            {/* Products Section */}
            <div className="form-section">
              <div className="section-header">
                <h4>Danh sách sản phẩm xuất hủy</h4>
                <button
                  type="button"
                  className="add-product-btn"
                  onClick={() => setShowProductSelector(true)}
                  disabled={allProductsLoading}
                >
                  {allProductsLoading ? "⏳ Đang tải..." : "➕ Thêm sản phẩm"}
                </button>
              </div>

              {/* Product Selector */}
              {showProductSelector && (
                <div className="product-selector">
                  <div className="selector-header">
                    <input
                      type="text"
                      placeholder="🔍 Tìm kiếm sản phẩm..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="product-search-input"
                      autoFocus
                    />
                    <button
                      type="button"
                      className="close-selector-btn"
                      onClick={() => setShowProductSelector(false)}
                    >
                      ✕
                    </button>
                  </div>

                  <div className="product-list">
                    {availableProducts.length === 0 ? (
                      <div className="no-products">
                        {productSearch
                          ? "Không tìm thấy sản phẩm phù hợp"
                          : "Tải dữ liệu sản phẩm..."}
                      </div>
                    ) : (
                      availableProducts.slice(0, 10).map((product) => (
                        <div
                          key={product.id}
                          className="product-item"
                          onClick={() => handleAddProduct(product)}
                        >
                          <div className="product-info">
                            <span className="product-name">{product.name}</span>
                            <span className="product-stock">
                              Tồn kho: {product.currentStock || 0}{" "}
                              {product.unit || "cái"}
                            </span>
                          </div>
                          <button type="button" className="select-product-btn">
                            Chọn
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Selected Products */}
              {formData.items.length === 0 ? (
                <div className="no-items">
                  Chưa có sản phẩm nào được chọn để xuất hủy
                </div>
              ) : (
                <div className="disposal-items">
                  <table className="items-table">
                    <thead>
                      <tr>
                        <th>Sản phẩm</th>
                        <th>Tồn kho</th>
                        <th>Số lượng hủy *</th>
                        <th>Lô sản xuất</th>
                        <th>Hạn sử dụng</th>
                        <th>Ghi chú</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.items.map((item, index) => (
                        <tr key={item.productId}>
                          <td>
                            <div className="product-cell">
                              <span className="product-name">
                                {item.productName}
                              </span>
                              <span className="product-unit">
                                ({item.productUnit})
                              </span>
                            </div>
                          </td>
                          <td>
                            <span
                              className={`stock-level ${
                                item.currentStock <= 0 ? "out-of-stock" : ""
                              }`}
                            >
                              {item.currentStock}
                            </span>
                          </td>
                          <td>
                            <input
                              type="number"
                              min="0.001"
                              max={item.currentStock}
                              step="0.001"
                              value={item.quantityToDispose}
                              onChange={(e) =>
                                handleUpdateItem(
                                  index,
                                  "quantityToDispose",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="quantity-input"
                              required
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={item.batchNumber}
                              onChange={(e) =>
                                handleUpdateItem(
                                  index,
                                  "batchNumber",
                                  e.target.value
                                )
                              }
                              placeholder="Mã lô"
                              className="batch-input"
                            />
                          </td>
                          <td>
                            <input
                              type="date"
                              value={item.expirationDate}
                              onChange={(e) =>
                                handleUpdateItem(
                                  index,
                                  "expirationDate",
                                  e.target.value
                                )
                              }
                              className="date-input"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={item.notes}
                              onChange={(e) =>
                                handleUpdateItem(index, "notes", e.target.value)
                              }
                              placeholder="Ghi chú"
                              className="notes-input"
                            />
                          </td>
                          <td>
                            <button
                              type="button"
                              className="remove-item-btn"
                              onClick={() =>
                                handleRemoveProduct(item.productId)
                              }
                              title="Xóa sản phẩm"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="modal-footer">
            <div className="form-summary">
              <span>Tổng: {formData.items.length} sản phẩm</span>
              <span>
                Tổng số lượng:{" "}
                {formData.items.reduce(
                  (sum, item) => sum + (item.quantityToDispose || 0),
                  0
                )}
              </span>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={onClose}
                disabled={submitting}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="submit-btn"
                disabled={submitting || formData.items.length === 0}
              >
                {submitting ? "⏳ Đang xử lý..." : "✅ Tạo phiếu xuất hủy"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DisposalForm;
