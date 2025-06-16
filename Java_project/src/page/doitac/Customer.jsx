import { useState, useEffect } from "react";

const Customer = () => {
    const [customers, setCustomers] = useState([]);
    const token = "eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiJhZG1pbiIsInVzZXJJZCI6MSwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsImF1dGhvcml0aWVzIjpbIlJPTEVfQURNSU4iXSwiaWF0IjoxNzQ5ODkwODM5LCJleHAiOjE3NDk5NzcyMzl9.PXFgkGBcwJsCsP9h42_akOHeiwNwILaZXLZGM2XeQ41BrMWxzpaqpSSbaPA7Aob6"

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const response = await fetch(`http://localhost:8080/api/parties/type/CUSTOMER`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    method: 'GET'
                });

                const result = await response.json();
                if (Array.isArray(result)) {
                    setCustomers(result);
                } else {
                    setCustomers([]);
                    console.error("Expected array from API, got:", result);
                }
            } catch (error) {
                console.error('Error fetching invoices:', error);
            } finally {

            }
        };

        fetchCustomers();
    }, []);
    return (
        <div className="full-container">
            <div className="kiemkho-container">
                <div className="kiemkho-main-content m-0 container-fluid">
                    <div className="kiemkho-header">
                        <h2 className="kiemkho-title">KHÁCH HÀNG</h2>
                    </div>

                    <table className="kiemkho-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Tên Khách Hàng</th>
                                <th>Số điện thoại</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.map((customer) => (
                                <tr key={customer.id}>
                                    <td>{customer.id}</td>
                                    <td>{customer.name}</td>
                                    <td>{customer.phone}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
export default Customer;