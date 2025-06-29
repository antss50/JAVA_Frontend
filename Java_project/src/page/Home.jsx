import React from "react";
import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import "../App.css";
import useProductReports from "../hooks/useProductReport";

const Home = () => {
  const [doanhThu, setDoanhThu] = useState(0);
  const [soDonHang, setSoDonHang] = useState(0);
  const [productSalesChart, setProductSalesChart] = useState([]);

  // Use the custom hook to get the daily report for today
  const todayStr = new Date().toISOString().slice(0, 10);
  const { currentReport, loading, error } = useProductReports({
    reportType: "daily",
    selectedDate: todayStr,
  });

  useEffect(() => {
    if (currentReport) {
      setDoanhThu(
        currentReport.totalSalesAmount || currentReport.totalSales || 0
      );
      setProductSalesChart(
        (currentReport.productSalesDetails &&
          currentReport.productSalesDetails.map((p) => ({
            productName: p.productName,
            salesAmount: p.totalRevenue || 0,
          }))) ||
          []
      );
    } else {
      setDoanhThu(0);
      setProductSalesChart([]);
    }
  }, [currentReport]);

  useEffect(() => {
    const fetchDailyOrderCount = async () => {
      try {
        // This token is for demonstration and should be managed securely
        const token =
          "eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiJhZG1pbiIsInVzZXJJZCI6MSwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsImF1dGhvcml0aWVzIjpbIlJPTEVfQURNSU4iXSwiaWF0IjoxNzQ5ODkwODM5LCJleHAiOjE3NDk5NzcyMzl9.PXFgkGBcwJsCsP9h42_akOHeiwNwILaZXLZGM2XeQ41BrMWxzpaqpSSbaPA7Aob6";
        const response = await fetch(`http://localhost:8080/api/ar/invoices`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch invoices for order count");
        }
        const data = await response.json();
        const todayStr = new Date().toISOString().slice(0, 10);
        const dailyInvoices = (data.content || []).filter(
          (invoice) =>
            invoice.invoiceDate && invoice.invoiceDate.startsWith(todayStr)
        );
        setSoDonHang(dailyInvoices.length);
      } catch (err) {
        console.error("Error fetching daily order count:", err);
        setSoDonHang(0); // Reset on error
      }
    };

    fetchDailyOrderCount();
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
              <h3>{doanhThu.toLocaleString("vi-VN")}</h3>
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
              Tổng doanh thu:{" "}
              <strong>{doanhThu.toLocaleString("vi-VN")}</strong>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={productSalesChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="productName" tick={{ fontSize: 12 }} />
              <YAxis
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value) => `${value.toLocaleString("vi-VN")}`}
              />
              <Bar dataKey="salesAmount" fill="#007bff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Home;
