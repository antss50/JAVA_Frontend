import Header from "../../component/Header";
import Navbar from "../../component/Navbar";
import "./product.css";
import { useState, useEffect } from "react";

const ProductList = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const initialProduct = {
        categoryId: "",
        sku: "",
        name: "",
        unit: "",
        purchasePrice: 0,
        sellingPrice: 0,
        vatRate: 0,
        isActive: true,
        quantityInStock: 0,
        reorderLevel: 0
    };

    const [newProduct, setNewProduct] = useState(initialProduct);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await fetch(`http://localhost:8080/api/inventory/products`, {
                    headers: {
                        Authorization: `Bearer eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiJhZG1pbiIsInVzZXJJZCI6MSwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsImF1dGhvcml0aWVzIjpbIlJPTEVfQURNSU4iXSwiaWF0IjoxNzQ5ODAwNjAzLCJleHAiOjE3NDk4ODcwMDN9.Y_hR2gezGc7wYOmGGLnK5i8G0wg2c4NZgNMbDFb_W7Ge6KQ8FFEhhZBXHeAlOmei`,
                        'Content-Type': 'application/json'
                    },
                    method: 'GET'
                });

                const result = await response.json();

                setProducts(result.content || []);
            } catch (error) {
                console.error('Error fetching products:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch(`http://localhost:8080/api/inventory/categories`, {
                    headers: {
                        Authorization: `Bearer eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiJhZG1pbiIsInVzZXJJZCI6MSwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsImF1dGhvcml0aWVzIjpbIlJPTEVfQURNSU4iXSwiaWF0IjoxNzQ5ODAwNjAzLCJleHAiOjE3NDk4ODcwMDN9.Y_hR2gezGc7wYOmGGLnK5i8G0wg2c4NZgNMbDFb_W7Ge6KQ8FFEhhZBXHeAlOmei`,
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

    // const handleSearch = async (name, SKU) => {
    //     setLoading(true);
    //     try {
    //         const response = await fetch(`http://localhost:8080/api/inventory/categories/search?name=${encodeURIComponent(name)}`, {
    //             headers: {
    //                 Authorization: `Bearer eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiJhZG1pbiIsInVzZXJJZCI6MSwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsImF1dGhvcml0aWVzIjpbIlJPTEVfQURNSU4iXSwiaWF0IjoxNzQ5ODAwNjAzLCJleHAiOjE3NDk4ODcwMDN9.Y_hR2gezGc7wYOmGGLnK5i8G0wg2c4NZgNMbDFb_W7Ge6KQ8FFEhhZBXHeAlOmei`,
    //                 'Content-Type': 'application/json'
    //             }
    //         });

    //         if (response.ok) {
    //             const result = await response.json();
    //             setCategories(result.content || result);
    //         } else {
    //             console.error('Failed to search categories. Status:', response.status);
    //         }
    //     } catch (error) {
    //         console.error('Error searching categories:', error);
    //     } finally {
    //         setLoading(false);
    //     }
    // };


    const handleNewProduct = async () => {
        setLoading(true);

        const payload = newProduct;

        try {
            const response = await fetch(`http://localhost:8080/api/inventory/products`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiJhZG1pbiIsInVzZXJJZCI6MSwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsImF1dGhvcml0aWVzIjpbIlJPTEVfQURNSU4iXSwiaWF0IjoxNzQ5ODAwNjAzLCJleHAiOjE3NDk4ODcwMDN9.Y_hR2gezGc7wYOmGGLnK5i8G0wg2c4NZgNMbDFb_W7Ge6KQ8FFEhhZBXHeAlOmei`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok || response.status === 201) {
                const result = await response.json();
                const category = categories.find(cat => cat.id === result.categoryId);
                const fullProduct = {
                    ...result,
                    buyPrice: result.purchasePrice,
                    sellPrice: result.sellingPrice,
                    quantityInStock: result.quantityInStock || 0,
                    category,
                };

                console.log("Tạo sản phẩm thành công!", fullProduct);
                setProducts((prev) => [...prev, fullProduct]);
                setShowCreateModal(false);
                setNewProduct(initialProduct);
            } else {
                console.log("Tạo không thành công. Status: " + response.status);
            }
        } catch (error) {
            console.error('Error creating product:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeteleProduct = async (productId) => {
        try {
            const response = await fetch(`http://localhost:8080/api/inventory/products/${productId}`, {
                headers: {
                    Authorization: `Bearer eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiJhZG1pbiIsInVzZXJJZCI6MSwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsImF1dGhvcml0aWVzIjpbIlJPTEVfQURNSU4iXSwiaWF0IjoxNzQ5ODAwNjAzLCJleHAiOjE3NDk4ODcwMDN9.Y_hR2gezGc7wYOmGGLnK5i8G0wg2c4NZgNMbDFb_W7Ge6KQ8FFEhhZBXHeAlOmei`,
                    'Content-Type': 'application/json'
                },
                method: 'DELETE'
            });
            if (response.ok) {

                setProducts((prev) => prev.filter(p => p.id !== productId));
            } else {
                console.error('Xoá không thành công. Status:', response.status);
            }
        } catch (error) {
            console.error('Error deleting product:', error);
        } finally {
            setLoading(false);
        }
    }
    return (
        <div className="full-container">
            <Header></Header>
            <Navbar></Navbar>
            <div className="kiemkho-container">
                <form className="kiemkho-search-box">
                    <h4>Tìm kiếm</h4>
                    <input
                        type="text"
                        placeholder="Nhập tên sản phẩm"
                        className="kiemkho-input text-black"
                    // value={searchTerm}
                    //     onChange={(e) => {
                    //         const value = e.target.value;
                    //         setSearchTerm(value);
                    //         handleSearch(value);
                    //     }}
                    />
                </form>

                <div className="kiemkho-main-content">
                    <div className="kiemkho-header">
                        <h2 className="kiemkho-title">DANH SÁCH SẢN PHẨM</h2>
                        <button
                            className="kiemkho-button btn btn-success p-2"
                            onClick={() => setShowCreateModal(true)}
                        >
                            + Tạo Sản Phẩm
                        </button>
                    </div>

                    {showCreateModal && (
                        <div className="modal show fade d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                            <div className="modal-dialog modal-dialog-centered">
                                <div className="modal-content">
                                    <div className="modal-header">
                                        <h5 className="modal-title">Tạo Sản Phẩm Mới</h5>
                                        <button className="btn-close" onClick={() => setShowCreateModal(false)} />
                                    </div>
                                    <div className="modal-body">
                                        <div className="mb-3">
                                            <label className="form-label">Mã Sản Phẩm</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={newProduct.sku}
                                                onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                                            />
                                        </div>
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
                                        <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                                            Hủy
                                        </button>
                                        <button className="btn btn-primary" onClick={handleNewProduct}>
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
                                <th>Id</th>
                                <th>Mã Sản Phẩm</th>
                                <th>Tên Sản Phẩm</th>
                                <th>Phân Loại</th>
                                <th>Đơn Vị</th>
                                <th>Giá Nhập</th>
                                <th>Giá Bán</th>
                                <th>Tồn Kho</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product) => (
                                <tr key={product.id}>
                                    <td>{product.id}</td>
                                    <td>{product.sku}</td>
                                    <td>{product.name}</td>
                                    <td>{product.category.name}</td>
                                    <td>{product.unit}</td>
                                    <td>{product.buyPrice}</td>
                                    <td>{product.sellPrice}</td>
                                    <td>{product.quantityInStock}</td>
                                    <td><button className="btn btn-danger" onClick={() => handleDeteleProduct(product.id)}>Xoá</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
export default ProductList;