import React, { useState, useMemo, useEffect } from "react";
import "./product.css";
import { useProductWithStock } from "../../hooks/useProductWithStock";
import ToastMessage from "../../component/ToastMessage";

const Stock = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name_asc");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const itemsPerPage = 20;

  // Toast state
  const [toastShow, setToastShow] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastVariant, setToastVariant] = useState("success");

  const showToast = (message, variant = "success") => {
    setToastMessage(message);
    setToastVariant(variant);
    setToastShow(true);
  };
  // Use the custom hook for products with stock
  const {
    allProducts = [],
    filteredProducts = [],
    allProductsLoading,
    allProductsError,
    totalProducts = 0,
    lowStockCount = 0,
    outOfStockCount = 0,
    totalInventoryValue = 0,
    searchProducts,
    sortProducts,
    getProductsByStatus,
    refreshData,
    clearError,
  } = useProductWithStock({
    autoFetch: true,
    pageSize: 1000,
  });
  // Filter and sort products based on current filters
  const displayedProducts = useMemo(() => {
    // Ensure we have valid array data
    const sourceProducts = Array.isArray(filteredProducts)
      ? filteredProducts
      : [];
    let products = sourceProducts;

    // Apply status filter
    if (filterStatus !== "all" && typeof getProductsByStatus === "function") {
      try {
        const statusProducts = getProductsByStatus(filterStatus);
        products = Array.isArray(statusProducts) ? statusProducts : [];
      } catch (error) {
        console.error("Error filtering by status:", error);
        products = sourceProducts;
      }
    }

    // Apply search filter if not already handled by the hook
    if (searchTerm && searchTerm.trim()) {
      const lowercaseQuery = searchTerm.toLowerCase().trim();
      products = products.filter((product) => {
        try {
          return (
            (product?.name &&
              product.name.toLowerCase().includes(lowercaseQuery)) ||
            (product?.id && product.id.toString().includes(lowercaseQuery)) ||
            (product?.sku &&
              product.sku.toLowerCase().includes(lowercaseQuery)) ||
            (product?.category?.name &&
              product.category.name.toLowerCase().includes(lowercaseQuery))
          );
        } catch (error) {
          console.error("Error filtering product:", product, error);
          return false;
        }
      });
    }

    // Apply sorting
    try {
      const sorted = [...products].sort((a, b) => {
        if (!a || !b) return 0;

        switch (sortBy) {
          case "name_asc":
            return (a.name || "").localeCompare(b.name || "", "vi", {
              sensitivity: "base",
            });
          case "name_desc":
            return (b.name || "").localeCompare(a.name || "", "vi", {
              sensitivity: "base",
            });
          case "stock_asc":
            return (a.currentStock || 0) - (b.currentStock || 0);
          case "stock_desc":
            return (b.currentStock || 0) - (a.currentStock || 0);
          case "price_asc":
            return (a.sellingPrice || 0) - (b.sellingPrice || 0);
          case "price_desc":
            return (b.sellingPrice || 0) - (a.sellingPrice || 0);
          case "status_priority":
            return (
              (a.stockStatus?.priority || 999) -
              (b.stockStatus?.priority || 999)
            );
          default:
            return (a.name || "").localeCompare(b.name || "", "vi", {
              sensitivity: "base",
            });
        }
      });
      return sorted;
    } catch (error) {
      console.error("Error sorting products:", error);
      return products;
    }
  }, [filteredProducts, filterStatus, searchTerm, sortBy, getProductsByStatus]);

  // Pagination
  const totalPages = Math.ceil(displayedProducts.length / itemsPerPage);
  const paginatedProducts = displayedProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  // Handle search
  const handleSearch = async (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
    if (value.trim() && typeof searchProducts === "function") {
      try {
        await searchProducts(value);
      } catch (error) {
        console.error("Search error:", error);
        showToast("Lỗi khi tìm kiếm", "error");
      }
    }
  };
  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Clear any existing errors first
      if (typeof clearError === "function") {
        clearError();
      }

      // Attempt to refresh data
      if (typeof refreshData === "function") {
        await refreshData();
        showToast("Dữ liệu đã được cập nhật!", "success");
      } else {
        throw new Error("Refresh function not available");
      }
    } catch (error) {
      console.error("Refresh error:", error);
      showToast(
        `Không thể cập nhật dữ liệu: ${error?.message || "Lỗi không xác định"}`,
        "error"
      );
    } finally {
      setIsRefreshing(false);
    }
  };
  // Format currency safely
  const formatCurrency = (amount) => {
    try {
      const numAmount = Number(amount) || 0;
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(numAmount);
    } catch (error) {
      console.error("Currency formatting error:", error);
      return "0 ₫";
    }
  };

  // Get status badge class safely
  const getStatusBadgeClass = (status) => {
    if (!status || typeof status !== "object") {
      return "badge bg-secondary";
    }

    switch (status.status) {
      case "out_of_stock":
        return "badge bg-danger";
      case "low_stock":
        return "badge bg-warning text-dark";
      case "overstocked":
        return "badge bg-info";
      default:
        return "badge bg-success";
    }
  };
  if (allProductsLoading || isRefreshing) {
    return (
      <div className="full-container">
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ height: "50vh" }}
        >
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Đang tải...</span>
            </div>
            <div className="mt-3">
              <p className="text-muted">
                {isRefreshing ? "Đang làm mới dữ liệu..." : "Đang tải..."}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (allProductsError) {
    return (
      <div className="full-container">
        <div className="alert alert-danger m-4">
          <h4>Lỗi tải dữ liệu</h4>
          <p>{allProductsError}</p>
          <button className="btn btn-primary" onClick={handleRefresh}>
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="full-container">
      {/* Search Sidebar */}
      <div className="danhmuc-search-box">
        <h4>Tìm kiếm kho</h4>
        <input
          type="text"
          className="danhmuc-input"
          placeholder="Tìm theo tên, mã sản phẩm..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
        />

        <div className="mb-3">
          <label className="form-label fw-bold">Trạng thái kho:</label>
          <select
            className="form-select form-select-sm"
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">Tất cả</option>
            <option value="normal">Bình thường</option>
            <option value="low_stock">Sắp hết</option>
            <option value="out_of_stock">Hết hàng</option>
            <option value="overstocked">Tồn kho cao</option>
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label fw-bold">Sắp xếp:</label>
          <select
            className="form-select form-select-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="name_asc">Tên A-Z</option>
            <option value="name_desc">Tên Z-A</option>
            <option value="stock_asc">Tồn kho tăng dần</option>
            <option value="stock_desc">Tồn kho giảm dần</option>
            <option value="price_asc">Giá tăng dần</option>
            <option value="price_desc">Giá giảm dần</option>
            <option value="status_priority">Ưu tiên cảnh báo</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div className="kiemkho-main-content">
        {" "}
        {/* Header with Statistics */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold">Quản lý Kho</h2>
          <button
            className="btn btn-primary"
            onClick={handleRefresh}
            disabled={isRefreshing || allProductsLoading}
          >
            <i
              className={`fas ${isRefreshing ? "fa-spinner fa-spin" : "fa-sync-alt"
                } me-2`}
            ></i>
            {isRefreshing ? "Đang làm mới..." : "Làm mới"}
          </button>
        </div>
        {/* Statistics Cards */}
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card text-dark">
              <div className="card-body">
                <h5 className="card-title">Tổng sản phẩm</h5>
                <h3 className="text-primary">{totalProducts}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-dark">
              <div className="card-body">
                <h5 className="card-title">Sắp hết hàng</h5>
                <h3 className="text-warning">{lowStockCount}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-white">
              <div className="card-body">
                <h5 className="card-title text-dark">Hết hàng</h5>
                <h3 className="text-danger">{outOfStockCount}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-dark">
              <div className="card-body">
                <h5 className="card-title">Giá trị tồn kho</h5>
                <h6 className="text-success">{formatCurrency(totalInventoryValue)}</h6>
              </div>
            </div>
          </div>
        </div>
        {/* Products Table */}
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              Danh sách tồn kho ({displayedProducts.length} sản phẩm)
            </h5>
          </div>
          <div className="card-body p-0">
            {displayedProducts.length === 0 ? (
              <div className="text-center py-5">
                <i className="fas fa-box-open fa-3x text-muted mb-3"></i>
                <h5 className="text-muted">Không tìm thấy sản phẩm nào</h5>
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Mã SP</th>
                        <th>Tên sản phẩm</th>
                        <th>Danh mục</th>
                        <th>Tồn kho</th>
                        <th>Đơn vị</th>
                        <th>Giá bán</th>
                        <th>Trạng thái</th>
                        <th>Giá trị tồn</th>
                      </tr>
                    </thead>{" "}
                    <tbody>
                      {paginatedProducts.map((product) => {
                        // Safety check for product data
                        if (!product || typeof product !== "object") {
                          return null;
                        }

                        return (
                          <tr key={product.id || Math.random()}>
                            <td>
                              <span className="badge bg-secondary">
                                {product.id || "N/A"}
                              </span>
                            </td>
                            <td>
                              <div className="fw-bold">
                                {product.name || "Tên không xác định"}
                              </div>
                            </td>
                            <td>
                              <span className="badge bg-light text-dark">
                                {product.category?.name || "Chưa phân loại"}
                              </span>
                            </td>
                            <td>
                              <span
                                className={`fw-bold ${(product.currentStock || 0) <= 0
                                    ? "text-danger"
                                    : (product.currentStock || 0) <=
                                      (product.reorderLevel || 0)
                                      ? "text-warning"
                                      : "text-success"
                                  }`}
                              >
                                {product.stockDisplay ||
                                  (product.currentStock || 0).toString()}
                              </span>
                            </td>
                            <td>
                              {product.stockUnit || product.unit || "Cái"}
                            </td>
                            <td>{formatCurrency(product.sellingPrice || 0)}</td>
                            <td>
                              <span
                                className={getStatusBadgeClass(
                                  product.stockStatus
                                )}
                              >
                                {product.stockStatus?.label || "Không xác định"}
                              </span>
                            </td>{" "}
                            <td>
                              <span className="fw-bold">
                                {formatCurrency(
                                  (product.sellingPrice || 0) *
                                  (product.currentStock || 0)
                                )}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="d-flex justify-content-center p-3">
                    <nav>
                      <ul className="pagination mb-0">
                        <li
                          className={`page-item ${currentPage === 1 ? "disabled" : ""
                            }`}
                        >
                          <button
                            className="page-link"
                            onClick={() => setCurrentPage(currentPage - 1)}
                            disabled={currentPage === 1}
                          >
                            Trước
                          </button>
                        </li>
                        {Array.from(
                          { length: totalPages },
                          (_, i) => i + 1
                        ).map((page) => (
                          <li
                            key={page}
                            className={`page-item ${currentPage === page ? "active" : ""
                              }`}
                          >
                            <button
                              className="page-link"
                              onClick={() => setCurrentPage(page)}
                            >
                              {page}
                            </button>
                          </li>
                        ))}
                        <li
                          className={`page-item ${currentPage === totalPages ? "disabled" : ""
                            }`}
                        >
                          <button
                            className="page-link"
                            onClick={() => setCurrentPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                          >
                            Sau
                          </button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Toast Message */}
      <ToastMessage
        show={toastShow}
        onClose={() => setToastShow(false)}
        message={toastMessage}
        variant={toastVariant}
      />
    </div>
  );
};

export default Stock;
