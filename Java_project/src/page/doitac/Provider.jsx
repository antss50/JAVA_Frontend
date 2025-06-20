import { useState, useEffect } from "react";

const Provider = () => {
    const [providers, setProviders] = useState([]);

    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const size = 20;
    const token = ""

    useEffect(() => {
        const fetchProviders = async () => {
            try {
                const response = await fetch(`http://localhost:8080/api/parties/type/SUPPLIER?page=${currentPage}&size=${size}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    method: 'GET'
                });

                const result = await response.json();
                if (Array.isArray(result)) {
                    setProviders(result);
                    setTotalPages(result.totalPages || 1);
                } else {
                    setProviders([]);
                    console.error("Expected array from API, got:", result);
                }
            } catch (error) {
                console.error('Error fetching providers:', error);
            } finally {

            }
        };

        fetchProviders();
    }, []);

    return (
        <div className="full-container">
            <div className="kiemkho-container">
                <div className="kiemkho-main-content m-0 container-fluid">
                    <div className="kiemkho-header">
                        <h2 className="kiemkho-title">NHÀ CUNG CẤP</h2>
                    </div>
                    <table className="table table-hover mb-0">
                        <thead className="table-light text-center">
                            <tr>
                                <th>Mã NCC</th>
                                <th>Tên nhà cung cấp</th>
                                <th>Số điện thoại</th>
                                <th>Email</th>
                                <th>Địa chỉ</th>
                            </tr>
                        </thead>
                        <tbody className="text-center">
                            {providers.map((provider) => (
                                <tr key={provider.id}>
                                    <td>
                                        <span className="badge bg-secondary">{provider.id}</span>
                                    </td>
                                    <td className="fw-bold">{provider.name}</td>
                                    <td>{provider.phone}</td>
                                    <td>{provider.email || "Chưa có email"}</td>
                                    <td>{provider.address || "Chưa có địa chỉ"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

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
    )
}
export default Provider;