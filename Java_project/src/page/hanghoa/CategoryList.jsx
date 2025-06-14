import Header from "../../component/Header";
import Navbar from "../../component/Navbar";
import "./product.css";
import { useState, useEffect } from "react";
const CategoryList = () => {
    const [categories, setCategories] = useState([]);
    const [categoryDetails, setCategoryDetails] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [show, setShow] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newCategory, setNewCategory] = useState({
        name: "",
        description: "",
        Id: ""
    });

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
                setLoading(false);
            }
        };

        fetchCategories();
    }, []);

    const handleClickDetail = async (categoryId) => {
        setLoading(true);
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
            setLoading(false);
        }
    };


    const handleSearch = async (name) => {
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:8080/api/inventory/categories/search?name=${encodeURIComponent(name)}`, {
                headers: {
                    Authorization: `Bearer eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiJhZG1pbiIsInVzZXJJZCI6MSwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsImF1dGhvcml0aWVzIjpbIlJPTEVfQURNSU4iXSwiaWF0IjoxNzQ5ODkwODM5LCJleHAiOjE3NDk5NzcyMzl9.PXFgkGBcwJsCsP9h42_akOHeiwNwILaZXLZGM2XeQ41BrMWxzpaqpSSbaPA7Aob6`,
                    'Content-Type': 'application/json'
                }
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
            setLoading(false);
        }
    };


    const handleNewCategory = async () => {
        setLoading(true);

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
                setCategories((prev) => [...prev, result]);
                setShowCreateModal(false); // đóng modal sau khi tạo
                setNewCategory({ name: "", description: "", parentId: "" }); // reset form
            } else {
                console.log("Tạo không thành công. Status: " + response.status);
            }
        } catch (error) {
            console.error('Error creating category:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="full-container">
                <Header></Header>
                <Navbar></Navbar>
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
                                <div className="modal-dialog modal-dialog-centered">
                                    <div className="modal-content">
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

                        <table className="kiemkho-table">
                            <thead>
                                <tr>
                                    <th>Mã loại hàng</th>
                                    {/* <th>Thời gian nhập</th> */}
                                    <th>Tên loại hàng</th>
                                    <th>Mô tả</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categories.map((category) => (
                                    <tr key={category.id} onClick={() => handleClickDetail(category.id)} style={{ cursor: 'pointer' }}>
                                        <td>{category.id}</td>
                                        {/* <td>{new Date(category.createdAt).toLocaleString()}</td> */}
                                        <td>{category.name}</td>
                                        <td>{category.description}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {show && categoryDetails && (
                <div className="modal show fade d-block fs-5" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
                        <div className="modal-content shadow-lg">
                            <div className="modal-header">
                                <h5 className="modal-title">Danh sách sản phẩm</h5>
                                <button type="button" className="btn-close" onClick={() => setShow(false)}></button>
                            </div>
                            <div className="modal-body">
                                {categoryDetails.length === 0 ? (
                                    <p>Không có sản phẩm nào.</p>
                                ) : (
                                    <table className="table table-bordered table-hover">
                                        <thead className="table-light">
                                            <tr>
                                                <th>SKU</th>
                                                <th>Tên sản phẩm</th>
                                                <th>Đơn vị</th>
                                                <th>Giá bán</th>
                                                <th>Tồn kho</th>
                                                <th>Trạng thái</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {categoryDetails.map((product) => (
                                                <tr key={product.id}>
                                                    <td>{product.sku}</td>
                                                    <td>{product.name}</td>
                                                    <td>{product.unit}</td>
                                                    <td>{product.sellingPrice}</td>
                                                    <td>{product.quantityInStock}</td>
                                                    <td>
                                                        {(product.isActive && product.quantityInStock > 0) ? (
                                                            <span className="badge bg-success">Còn Hàng</span>
                                                        ) : (
                                                            <span className="badge bg-secondary">Hết Hàng</span>
                                                        )}
                                                    </td>
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


        </>
    );
}
export default CategoryList;