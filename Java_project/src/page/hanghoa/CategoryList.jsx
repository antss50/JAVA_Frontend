import "./product.css";
import { useState, useEffect } from "react";
import ToastMessage from "../../component/ToastMessage";

const CategoryList = () => {
    const [categories, setCategories] = useState([]);
    const [categoryDetails, setCategoryDetails] = useState([]);

    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const size = 20;

    const [show, setShow] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const [newCategory, setNewCategory] = useState({
        name: "",
        description: "",
        Id: ""
    });

    // ✅ Toast state
    const [toastShow, setToastShow] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [toastVariant, setToastVariant] = useState("success");

    const showToast = (message, variant = "success") => {
        setToastMessage(message);
        setToastVariant(variant);
        setToastShow(true);
    };

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch(`http://localhost:8080/api/inventory/categories?page=${currentPage}&size=${size}`, {
                    headers: {
                        Authorization: `Bearer eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiJhZG1pbiIsInVzZXJJZCI6MSwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsImF1dGhvcml0aWVzIjpbIlJPTEVfQURNSU4iXSwiaWF0IjoxNzQ5ODkwODM5LCJleHAiOjE3NDk5NzcyMzl9.PXFgkGBcwJsCsP9h42_akOHeiwNwILaZXLZGM2XeQ41BrMWxzpaqpSSbaPA7Aob6`,
                        'Content-Type': 'application/json'
                    },
                    method: 'GET'
                });

                const result = await response.json();
                setCategories(result.content || []);
                setTotalPages(result.totalPages || 1)
            } catch (error) {
                console.error('Error fetching categories:', error);
            } finally {

            }
        };

        fetchCategories();
    }, []);

    const handleClickDetail = async (categoryId) => {
        try {
            const response = await fetch(`http://localhost:8080/api/inventory/categories/${categoryId}/products`, {
                headers: {
                    Authorization: `Bearer eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiJhZG1pbiIsInVzZXJJZCI6MSwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsImF1dGhvcml0aWVzIjpbIlJPTEVfQURNSU4iXSwiaWF0IjoxNzQ5ODkwODM5LCJleHAiOjE3NDk5NzcyMzl9.PXFgkGBcwJsCsP9h42_akOHeiwNwILaZXLZGM2XeQ41BrMWxzpaqpSSbaPA7Aob6`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                const products = result.content || []; // Chỉ lấy mảng sản phẩm
                setCategoryDetails(products);
                setShow(true);
                console.log("Products in category:", products);
            } else {
                console.error('Failed to fetch category details. Status:', response.status);
            }
        } catch (error) {
            console.error('Error fetching category details:', error);
        } finally {

        }
    };


    const handleSearch = async (name) => {

        try {
            const response = await fetch(`http://localhost:8080/api/inventory/categories/search?name=${encodeURIComponent(name)}`, {
                headers: {
                    Authorization: `Bearer eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiJhZG1pbiIsInVzZXJJZCI6MSwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsImF1dGhvcml0aWVzIjpbIlJPTEVfQURNSU4iXSwiaWF0IjoxNzQ5ODkwODM5LCJleHAiOjE3NDk5NzcyMzl9.PXFgkGBcwJsCsP9h42_akOHeiwNwILaZXLZGM2XeQ41BrMWxzpaqpSSbaPA7Aob6`,
                    'Content-Type': 'application/json'
                },
                method: 'GET'
            });

            if (response.ok) {
                const result = await response.json();
                setCategories(result.content || result);
            } else {
                console.error('Failed to search categories. Status:', response.status);
            }
        } catch (error) {
            console.error('Error searching categories:', error);
        } finally {

        }
    };


    const handleNewCategory = async () => {


        const payload = {
            name: newCategory.name,
            description: newCategory.description,
            parent: newCategory.parentId ? { id: parseInt(newCategory.parentId) } : null,
            isActive: true
        };

        try {
            const response = await fetch(`http://localhost:8080/api/inventory/categories`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiJhZG1pbiIsInVzZXJJZCI6MSwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsImF1dGhvcml0aWVzIjpbIlJPTEVfQURNSU4iXSwiaWF0IjoxNzQ5ODkwODM5LCJleHAiOjE3NDk5NzcyMzl9.PXFgkGBcwJsCsP9h42_akOHeiwNwILaZXLZGM2XeQ41BrMWxzpaqpSSbaPA7Aob6`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok || response.status === 201) {
                const result = await response.json();
                console.log("Tạo danh mục thành công!");
                showToast("Tạo danh mục thành công!", "success")
                setCategories((prev) => [...prev, result]);
                setShowCreateModal(false); // đóng modal sau khi tạo
                setNewCategory({ name: "", description: "", parentId: "" }); // reset form
            } else {
                console.log("Tạo không thành công. Status: " + response.status);
                showToast(`Tạo danh mục thất bại: ${errorData.message}`, "danger");
            }
        } catch (error) {
            console.error('Error creating category:', error);
        } finally {

        }
    };

    return (
        <>
            <div className="full-container">
                <div className="kiemkho-container">
                    <form className="kiemkho-search-box">
                        <h4>Tìm kiếm</h4>
                        <input
                            type="text"
                            placeholder="Nhập tên loại hàng"
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
                            <h2 className="kiemkho-title">DANH MỤC HÀNG HOÁ</h2>
                            <button
                                className="kiemkho-button btn btn-success p-2"
                                onClick={() => setShowCreateModal(true)}
                            >
                                + Tạo Loại Hàng
                            </button>
                        </div>

                        {showCreateModal && (
                            <div className="modal show fade d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                                <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "95vw" }}>
                                    <div className="modal-content mx-auto">
                                        <div className="modal-header">
                                            <h5 className="modal-title">Tạo Danh Mục Mới</h5>
                                            <button className="btn-close" onClick={() => setShowCreateModal(false)} />
                                        </div>
                                        <div className="modal-body">
                                            <div className="mb-3">
                                                <label className="form-label">Tên loại hàng</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={newCategory.name}
                                                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                                                />
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label">Mô tả</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={newCategory.description}
                                                    onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                                                />
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label">ID</label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    value={newCategory.parentId}
                                                    onChange={(e) => setNewCategory({ ...newCategory, parentId: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="modal-footer">
                                            <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                                                Hủy
                                            </button>
                                            <button className="btn btn-primary" onClick={handleNewCategory}>
                                                Tạo
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="table-responsive">
                            <table className="table table-hover mb-0 text-center">
                                <thead className="table-light">
                                    <tr>
                                        <th>Mã danh mục</th>
                                        <th>Tên danh mục</th>
                                        <th>Mô tả</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {categories.map((category) => (
                                        <tr
                                            key={category.id}
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => handleClickDetail(category.id)}
                                        >
                                            <td>
                                                <span className="badge bg-secondary">{category.id}</span>
                                            </td>
                                            <td className="fw-bold">{category.name}</td>
                                            <td>{category.description || "Không có mô tả"}</td>
                                            <td>
                                                <button
                                                    className="btn btn-warning fw-bold"
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // ngăn click row
                                                        handleClickDetail(category.id);
                                                    }}
                                                >
                                                    Xem
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
            </div>

            {show && categoryDetails && (
                <div className="modal show fade d-block fs-5" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered" role="document" style={{ maxWidth: "95vw" }}>
                        <div className="modal-content shadow-lg mx-auto">
                            <div className="modal-header">
                                <h5 className="modal-title">Danh sách sản phẩm</h5>
                                <button type="button" className="btn-close" onClick={() => setShow(false)}></button>
                            </div>
                            <div className="modal-body">
                                {categoryDetails.length === 0 ? (
                                    <p>Không có sản phẩm nào.</p>
                                ) : (
                                    <table className="table table-hover mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Mã SP</th>
                                                <th>Tên sản phẩm</th>
                                                <th>Đơn vị</th>
                                                <th>Giá nhập</th>
                                                <th>Giá bán</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {categoryDetails.map((product) => (
                                                <tr key={product.id}>
                                                    <td>
                                                        <span className="badge bg-secondary">{product.id}</span>
                                                    </td>
                                                    <td className="fw-bold">{product.name}</td>
                                                    <td>{product.unit || "cái"}</td>
                                                    <td>{product.purchasePrice?.toLocaleString()} ₫</td>
                                                    <td>{product.sellingPrice?.toLocaleString()} ₫</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-danger" onClick={() => setShow(false)}>
                                    Đóng
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <ToastMessage
                show={toastShow}
                onClose={() => setToastShow(false)}
                message={toastMessage}
                variant={toastVariant}
            />

        </>
    );
}
export default CategoryList;