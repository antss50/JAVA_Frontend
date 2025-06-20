import { useState, useEffect } from "react";

const Customer = () => {
    const [customers, setCustomers] = useState([]);
    const [totalsMap, setTotalsMap] = useState({});

    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const size = 20;
    const token = "";

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch danh sách khách hàng
                const customerRes = await fetch(`http://localhost:8080/api/parties?partyType=CUSTOMER?page=${currentPage}&size=${size}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                const customerList = await customerRes.json();
                setCustomers(Array.isArray(customerList) ? customerList : []);
                setTotalPages(result.totalPages || 1);
                // Fetch hóa đơn
                const invoiceRes = await fetch(`http://localhost:8080/api/ar/invoices`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                const invoiceData = await invoiceRes.json();
                const invoices = invoiceData.content || [];

                // Gộp tổng tiền theo customerId
                const totals = {};
                invoices.forEach(inv => {
                    const id = inv.customerId;
                    if (!totals[id]) totals[id] = 0;
                    totals[id] += inv.totalAmount;
                });
                setTotalsMap(totals);
            } catch (error) {
                console.error('Lỗi khi lấy dữ liệu khách hàng hoặc hóa đơn:', error);
            }
        };

        fetchData();
    }, []);

    return (
        <div className="full-container">
            <div className="kiemkho-container">
                <div className="kiemkho-main-content m-0 container-fluid">
                    <div className="kiemkho-header">
                        <h2 className="kiemkho-title">KHÁCH HÀNG</h2>
                    </div>

                    <table className="table table-hover mb-0">
                        <thead className="table-primary text-center">
                            <tr>
                                <th>Mã KH</th>
                                <th>Tên khách hàng</th>
                                <th>Số điện thoại</th>
                                <th>Tổng tiền đã mua</th>
                            </tr>
                        </thead>
                        <tbody className="text-center">
                            {customers.map((customer) => (
                                <tr key={customer.id}>
                                    <td>
                                        <span className="badge bg-secondary">{customer.id}</span>
                                    </td>
                                    <td className="fw-bold">{customer.name}</td>
                                    <td>{customer.phone}</td>
                                    <td className="fw-bold text-success">
                                        {(totalsMap[customer.id] || 0).toLocaleString()} VNĐ
                                    </td>
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
    );
};

export default Customer;
