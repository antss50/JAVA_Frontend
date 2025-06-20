import "./product.css";
import { useState, useEffect } from "react";
import ToastMessage from "../../component/ToastMessage";

const ProductList = () => {
    const [products, setProducts] = useState([]);
    const [editProductId, setEditProductId] = useState(null);
    const [categories, setCategories] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const initialProduct = {
        categoryId: "",
        name: "",
        unit: "",
        purchasePrice: 0,
        sellingPrice: 0,
        reorderLevel: 0
    };

    const [newProduct, setNewProduct] = useState(initialProduct);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const size = 20;

    // ✅ Toast state
    const [toastShow, setToastShow] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [toastVariant, setToastVariant] = useState("success");

    const token = ""

    useEffect(() => {
        const fetchPagedProducts = async () => {
            try {
                const response = await fetch(`http://localhost:8080/api/inventory/products?page=${currentPage}&size=${size}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                const result = await response.json();
                setProducts(result.content || []);
                setTotalPages(result.totalPages || 1);
            } catch (error) {
                console.error("Lỗi khi tải trang sản phẩm:", error);
            }
        };

        fetchPagedProducts();
    }, [currentPage]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch(`http://localhost:8080/api/inventory/categories`, {
                    headers: {
                        Authorization: `Bearer eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiJhZG1pbiIsInVzZXJJZCI6MSwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsImF1dGhvcml0aWVzIjpbIlJPTEVfQURNSU4iXSwiaWF0IjoxNzQ5ODkwODM5LCJleHAiOjE3NDk5NzcyMzl9.PXFgkGBcwJsCsP9h42_akOHeiwNwILaZXLZGM2XeQ41BrMWxzpaqpSSbaPA7Aob6`,
                        'Content-Type': 'application/json'
                    },
                    method: 'GET'
                });

                const result = await response.json();

                setCategories(result.content || []);
            } catch (error) {
                console.error('Error fetching categories:', error);
            } finally {
            }
        };

        fetchCategories();
    }, []);

    const handleSearch = async (name) => {
        try {
            const response = await fetch(`http://localhost:8080/api/inventory/products/search?query=${encodeURIComponent(name)}`, {
                headers: {
                    Authorization: `Bearer eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiJhZG1pbiIsInVzZXJJZCI6MSwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsImF1dGhvcml0aWVzIjpbIlJPTEVfQURNSU4iXSwiaWF0IjoxNzQ5ODkwODM5LCJleHAiOjE3NDk5NzcyMzl9.PXFgkGBcwJsCsP9h42_akOHeiwNwILaZXLZGM2XeQ41BrMWxzpaqpSSbaPA7Aob6`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                setProducts(result.content || result);
            } else {
                console.error('Failed to search product. Status:', response.status);
            }
        } catch (error) {
            console.error('Error searching product:', error);
        } finally {
        }
    };


    const handleNewProduct = async () => {

        const payload = newProduct;

        try {
            const response = await fetch(`http://localhost:8080/api/inventory/products`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiJhZG1pbiIsInVzZXJJZCI6MSwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsImF1dGhvcml0aWVzIjpbIlJPTEVfQURNSU4iXSwiaWF0IjoxNzQ5ODkwODM5LCJleHAiOjE3NDk5NzcyMzl9.PXFgkGBcwJsCsP9h42_akOHeiwNwILaZXLZGM2XeQ41BrMWxzpaqpSSbaPA7Aob6`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok || response.status === 201) {
                const result = await response.json();
                const category = categories.find(cat => cat.id === result.categoryId);
                showToast("Tạo sản phẩm thành công!", "success");
                setProducts((prev) => [...prev, result]);
                setShowCreateModal(false);
                setNewProduct(initialProduct);
            } else {
                console.log("Tạo không thành công. Status: " + response.status);
                showToast(`Tạo sản phẩm thất bại: ${errorData.message}`, "danger");
            }
        } catch (error) {
            console.error('Error creating product:', error);
        } finally {
        }
    };

    // const handleDeteleProduct = async (productId) => {
    //     try {
    //         const response = await fetch(`http://localhost:8080/api/inventory/products/${productId}`, {
    //             headers: {
    //                 Authorization: `Bearer eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiJhZG1pbiIsInVzZXJJZCI6MSwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsImF1dGhvcml0aWVzIjpbIlJPTEVfQURNSU4iXSwiaWF0IjoxNzQ5ODkwODM5LCJleHAiOjE3NDk5NzcyMzl9.PXFgkGBcwJsCsP9h42_akOHeiwNwILaZXLZGM2XeQ41BrMWxzpaqpSSbaPA7Aob6`,
    //                 'Content-Type': 'application/json'
    //             },
    //             method: 'DELETE'
    //         });
    //         if (response.ok) {
    //             setProducts((prev) => prev.filter(p => p.id !== productId));
    //             showToast("Xoá sản phẩm thành công!", "success");
    //         } else {
    //             console.error('Xoá không thành công. Status:', response.status);
    //             showToast(`Xoá sản phẩm thất bại: ${errorData.message}`, "danger");
    //         }
    //     } catch (error) {
    //         console.error('Error deleting product:', error);
    //     } finally {
    //     }
    // }

    const handleEditProduct = async (productId) => {
        const updatedProduct = {
            categoryId: newProduct.categoryId,
            name: newProduct.name,
            unit: newProduct.unit,
            purchasePrice: newProduct.purchasePrice,
            sellingPrice: newProduct.sellingPrice,
            reorderLevel: newProduct.reorderLevel
        };
        console.log("Dữ liệu gửi cập nhật:", updatedProduct);
        console.log("productId:", productId)
        try {
            const response = await fetch(`http://localhost:8080/api/inventory/products/${productId}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiJhZG1pbiIsInVzZXJJZCI6MSwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsImF1dGhvcml0aWVzIjpbIlJPTEVfQURNSU4iXSwiaWF0IjoxNzQ5ODkwODM5LCJleHAiOjE3NDk5NzcyMzl9.PXFgkGBcwJsCsP9h42_akOHeiwNwILaZXLZGM2XeQ41BrMWxzpaqpSSbaPA7Aob6`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(updatedProduct)
            });

            if (!response.ok) {
                showToast(`Cập nhật sản phẩm thất bại: ${errorData.message}`, "danger");
            }

            const updated = await response.json();


            setProducts(products.map(p => p.id === productId ? updated : p));
            setShowCreateModal(false);
            showToast("Cập nhật sản phẩm thành công!", "success");
            setNewProduct(initialProduct);
            setEditProductId(null);
        } catch (error) {
            console.error("Lỗi cập nhật:", error);

        }
    };

    const showToast = (message, variant = "success") => {
        setToastMessage(message);
        setToastVariant(variant);
        setToastShow(true);
    };

    return (
        <div className="full-container">
            <div className="kiemkho-container d-flex">
                <form className="kiemkho-search-box">
                    <h4>Tìm kiếm</h4>
                    <input
                        type="text"
                        placeholder="Nhập tên sản phẩm"
                        className="kiemkho-input text-black"
                        value={searchTerm}
                        onChange={(e) => {
                            const value = e.target.value;
                            setSearchTerm(value);
                            handleSearch(value);
                        }}
                    />
                </form>

                <div className="kiemkho-main-content">
                    <div className="kiemkho-header">
                        <h2 className="kiemkho-title">DANH SÁCH SẢN PHẨM</h2>
                        <button
                            className="kiemkho-button btn btn-success p-2 fw-bold"
                            onClick={() => setShowCreateModal(true)}
                        >
                            + Tạo Sản Phẩm
                        </button>
                    </div>

                    {showCreateModal && (
                        <div className="modal show fade d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                            <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "95vw" }}>
                                <div className="modal-content mx-auto">
                                    <div className="modal-header">
                                        <button className="btn-close" onClick={() => setShowCreateModal(false)} />
                                    </div>
                                    <div className="modal-body">
                                        <div className="mb-3">
                                            <label className="form-label">Tên Sản Phẩm</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={newProduct.name}
                                                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Phân Loại</label>
                                            <select
                                                className="form-select"
                                                value={newProduct.categoryId}
                                                onChange={(e) =>
                                                    setNewProduct({
                                                        ...newProduct,
                                                        categoryId: parseInt(e.target.value, 10)
                                                    }
                                                    )
                                                }
                                            >
                                                <option value="">Chọn loại hàng</option>
                                                {categories.map((cat) => (
                                                    <option key={cat.id} value={cat.id}>
                                                        {cat.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Đơn Vị Tính</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={newProduct.unit}
                                                onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Giá Nhập</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={newProduct.purchasePrice}
                                                onChange={(e) => setNewProduct({ ...newProduct, purchasePrice: parseFloat(e.target.value) || 0 })}
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Giá Bán</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={newProduct.sellingPrice}
                                                onChange={(e) => setNewProduct({ ...newProduct, sellingPrice: parseFloat(e.target.value) || 0 })}
                                            />
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button
                                            className="btn btn-secondary"
                                            onClick={() => {
                                                setShowCreateModal(false);
                                                setEditProductId(null);
                                                setNewProduct(initialProduct);
                                            }}
                                        >
                                            Hủy
                                        </button>
                                        <button
                                            className="btn btn-primary"
                                            onClick={editProductId ? () => handleEditProduct(editProductId) : handleNewProduct}
                                        >
                                            {editProductId ? "Lưu" : "Tạo"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="table-responsive">
                        <table className="table table-hover mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>Mã SP</th>
                                    <th>Tên sản phẩm</th>
                                    <th>Danh mục</th>
                                    <th>Đơn vị</th>
                                    <th>Giá nhập</th>
                                    <th>Giá bán</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((product) => (
                                    <tr key={product.id}>
                                        <td>
                                            <span className="badge bg-secondary">{product.id || "N/A"}</span>
                                        </td>
                                        <td>
                                            <div className="fw-bold">{product.name || "Tên không xác định"}</div>
                                        </td>
                                        <td>
                                            <span className="badge bg-light text-dark">
                                                {product.categoryName || product.category?.name || "Chưa phân loại"}
                                            </span>
                                        </td>
                                        <td>{product.unit || "cái"}</td>
                                        <td>{product.purchasePrice?.toLocaleString()} VNĐ</td>
                                        <td>{product.sellingPrice?.toLocaleString()} VNĐ</td>
                                        <td>
                                            <button
                                                className="btn btn-warning fw-bold"
                                                onClick={() => {
                                                    setEditProductId(product.id);
                                                    setNewProduct({
                                                        categoryId: product.categoryId,
                                                        name: product.name,
                                                        unit: product.unit,
                                                        purchasePrice: product.purchasePrice,
                                                        sellingPrice: product.sellingPrice,
                                                    });
                                                    setShowCreateModal(true);
                                                }}
                                            >
                                                Cập Nhật
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <nav className="mt-3">
                        <ul className="pagination justify-content-center">
                            {[...Array(totalPages).keys()].map((page) => (
                                <li key={page} className={`page-item ${page === currentPage ? "active" : ""}`}>
                                    <button className="page-link" onClick={() => setCurrentPage(page)}>
                                        {page + 1}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </div>
            </div>
            <ToastMessage
                show={toastShow}
                onClose={() => setToastShow(false)}
                message={toastMessage}
                variant={toastVariant}
            />
        </div>
    );
}
export default ProductList;