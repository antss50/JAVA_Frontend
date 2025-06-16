import { useState, useEffect } from "react";

const Invoice = () => {
    const [invoices, setInvoices] = useState([]);
    const [invoiceDetails, setInvoiceDetails] = useState([]);
    const [orderLines, setOrderLines] = useState([]);
    const [show, setShow] = useState(false);
    const token = "eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiJhZG1pbiIsInVzZXJJZCI6MSwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsImF1dGhvcml0aWVzIjpbIlJPTEVfQURNSU4iXSwiaWF0IjoxNzQ5ODkwODM5LCJleHAiOjE3NDk5NzcyMzl9.PXFgkGBcwJsCsP9h42_akOHeiwNwILaZXLZGM2XeQ41BrMWxzpaqpSSbaPA7Aob6"
    useEffect(() => {
        const fetchInvoices = async () => {
            try {
                const response = await fetch(`http://localhost:8080/api/ar/invoices`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    method: 'GET'
                });

                const result = await response.json();

                setInvoices(result.content || []);
            } catch (error) {
                console.error('Error fetching invoices:', error);
            } finally {

            }
        };

        fetchInvoices();
    }, []);

    const handleClickDetail = async (invoiceId) => {

        try {
            const response = await fetch(`http://localhost:8080/api/ar/invoices/${invoiceId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                setInvoiceDetails(result);

                // 🔁 Gọi tiếp API lấy đơn hàng để có orderLines
                const orderRes = await fetch(`http://localhost:8080/api/sales/orders/${result.orderId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (orderRes.ok) {
                    const orderData = await orderRes.json();
                    setOrderLines(orderData.orderLines || []);
                }

                setShow(true);
            } else {
                console.error('Failed to fetch invoice details. Status:', response.status);
            }
        } catch (error) {
            console.error('Error fetching invoice details:', error);
        } finally {

        }
    };

    return (
        <div className="full-container">
            <div className="kiemkho-container">
                {/* <form className="kiemkho-search-box">
                    <h4>Tìm kiếm</h4>
                    <input
                        type="text"
                        placeholder="Nhập tên khách hàng"
                        className="kiemkho-input text-black"
                    
                </form> */}

                <div className="kiemkho-main-content m-0 container-fluid">
                    <div className="kiemkho-header">
                        <h2 className="kiemkho-title">HOÁ ĐƠN</h2>
                    </div>

                    {show && invoiceDetails && (
                        <div className="modal show fade d-block fs-5" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                            <div className="modal-dialog modal-lg modal-dialog-centered" role="document" style={{ maxWidth: "95vw" }}>
                                <div className="modal-content shadow-lg">
                                    <div className="modal-header">
                                        <h5 className="modal-title">Chi Tiết Hoá Đơn</h5>
                                        <button type="button" className="btn-close" onClick={() => setShow(false)}></button>
                                    </div>
                                    <div className="modal-body">
                                        <p><strong>Tên Khách Hàng:</strong> {invoiceDetails.customerName}</p>
                                        <p><strong>Mã Hoá Đơn:</strong> {invoiceDetails.invoiceNumber}</p>
                                        <p><strong>Ngày Lập:</strong> {invoiceDetails.invoiceDate}</p>
                                        <hr />
                                        <h5>Danh sách sản phẩm:</h5>
                                        <table className="table">
                                            <thead>
                                                <tr className="text-center">
                                                    <th>ID</th>
                                                    <th>Tên sản phẩm</th>
                                                    <th>Số lượng</th>
                                                    <th>Đơn giá</th>
                                                    <th>Thành tiền</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {orderLines.map((item, index) => (
                                                    <tr key={index} className="text-center">
                                                        <td>{item.productId}</td>
                                                        <td>{item.productName}</td>
                                                        <td>{item.quantity}</td>
                                                        <td>{item.unitPrice.toLocaleString()} VNĐ</td>
                                                        <td>{item.lineTotal.toLocaleString()} VNĐ</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>

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


                    <table className="kiemkho-table">
                        <thead>
                            <tr>
                                <th>Mã Hoá Đơn</th>
                                <th>Mã Khách Hàng</th>
                                <th>Tên Khách Hàng</th>
                                <th>Mã Đơn Hàng</th>
                                <th>Tổng giá trị</th>
                                <th>Ngày Lập</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map((invoice) => (
                                <tr key={invoice.id} onClick={() => handleClickDetail(invoice.id)} style={{ cursor: 'pointer' }}>
                                    <td>{invoice.invoiceNumber}</td>
                                    <td>{invoice.customerId}</td>
                                    <td>{invoice.customerName}</td>
                                    <td>{invoice.orderId}</td>
                                    <td>{invoice.totalAmount.toLocaleString()} VNĐ</td>
                                    <td>{new Date(invoice.invoiceDate).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
export default Invoice;