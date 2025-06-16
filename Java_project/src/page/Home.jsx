import React from 'react';
import { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import '../App.css';

const Home = () => {
    const [doanhThu, setDoanhThu] = useState(0);
    const [soDonHang, setSoDonHang] = useState(0);
    const [productSalesChart, setProductSalesChart] = useState([]);
    useEffect(() => {
        const fetchDailySalesReport = async () => {
            try {
                const response = await fetch("http://localhost:8080/api/sales/reports/product-sales?page=0&size=10&sort=reportDate,desc", {
                    headers: {
                        Authorization: `Bearer <token>` // thay bằng token thật
                    }
                });

                const result = await response.json();
                const todayStr = new Date().toISOString().slice(0, 10);

                const todayReport = (result.content || []).find(
                    report => report.reportDate === todayStr && report.reportPeriod === "DAILY"
                );

                if (todayReport) {
                    setDoanhThu(todayReport.totalSalesAmount || 0);
                    setSoDonHang(todayReport.totalOrdersCount || 0);
                    setProductSalesChart(todayReport.productSales || []);
                } else {
                    setDoanhThu(0);
                    setSoDonHang(0);
                }
            } catch (error) {
                console.error("Lỗi khi gọi API báo cáo doanh thu:", error);
            }
        };

        fetchDailySalesReport();
    }, []);


    return (
        <div className="tong-quan full-container">
            <div>
                {/* Hộp 1: Kết quả bán hàng */}
                <div className="thong-ke-box">
                    <h2>KẾT QUẢ BÁN HÀNG HÔM NAY:</h2>
                    <div className="thong-ke-noi-dung">
                        <div className="item">
                            <p>Số đơn hàng</p>
                            <h3>{soDonHang}</h3>
                        </div>
                        <div className="item">
                            <p>Doanh thu</p>
                            <h3>{doanhThu.toLocaleString('vi-VN')}₫</h3>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                {/* Hộp 2: Doanh số hôm nay */}
                <div className="bieu-do-box">
                    <div className="bieu-do-header">
                        <h2>DOANH SỐ HÔM NAY</h2>
                        <div className="tong-doanh-thu-inline">
                            Tổng doanh thu: <strong>{doanhThu.toLocaleString('vi-VN')}₫</strong>
                        </div>
                    </div>

                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={productSalesChart}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="productName" tick={{ fontSize: 12 }} />
                            <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                            <Tooltip formatter={(value) => `${value.toLocaleString('vi-VN')}₫`} />
                            <Bar dataKey="salesAmount" fill="#007bff" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

        </div>
    );
};

export default Home;