import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import './TongQuan.css';

const TongQuan = () => {
  const soDonHang = 35;
  const doanhThu = 12500000;

  const data = [
    { hour: '08:00', revenue: 500000 },
    { hour: '09:00', revenue: 800000 },
    { hour: '10:00', revenue: 600000 },
    { hour: '11:00', revenue: 1000000 },
    { hour: '12:00', revenue: 1200000 },
    { hour: '13:00', revenue: 950000 },
    { hour: '14:00', revenue: 400000 },
    { hour: '15:00', revenue: 300000 },
    { hour: '16:00', revenue: 700000 },
    { hour: '17:00', revenue: 900000 },
  ];

  return (
    <div className="tong-quan">
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

      {/* Hộp 2: Doanh số hôm nay */}
      <div className="bieu-do-box">
        <div className="bieu-do-header">
          <h2>DOANH SỐ HÔM NAY</h2>
          <div className="tong-doanh-thu-inline">
            Tổng doanh thu: <strong>{doanhThu.toLocaleString('vi-VN')}₫</strong>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" />
            <YAxis tickFormatter={(value) => `${value / 1000}k`} />
            <Tooltip formatter={(value) => `${value.toLocaleString('vi-VN')}₫`} />
            <Bar dataKey="revenue" fill="#007bff" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TongQuan;