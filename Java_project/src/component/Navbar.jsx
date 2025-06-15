import React from "react";
import { NavLink } from "react-router-dom";
import "../App.css";

const Navbar = () => {
  return (
    <nav className="navbar d-flex justify-content-around mb-4">
      {/* Tổng quan không submenu */}
      <NavLink to="/home" className="nav-link p-2">
        <span style={{fontWeight: '500'}}>Tổng Quan</span>
      </NavLink>

      {/* Hàng hoá */}
      <div className="nav-link dropdown">
        <span>Hàng hoá</span>
        <div className="dropdown-content">
          <NavLink to="/hang-hoa/danh-muc" className="dropdown-item">
            Danh mục
          </NavLink>
          <NavLink to="/hang-hoa/san-pham" className="dropdown-item">
            Sản Phẩm
          </NavLink>
          <NavLink to="/hang-hoa/kiem-kho" className="dropdown-item">
            Kiểm kho
          </NavLink>
        </div>
      </div>

      {/* Giao dịch */}
      <div className="nav-link dropdown">
        <span>Giao dịch</span>
        <div className="dropdown-content">
          <NavLink to="/giao-dich/hoa-don" className="dropdown-item">
            Hoá đơn
          </NavLink>
          <NavLink to="/giao-dich/tra-hang" className="dropdown-item">
            Trả hàng
          </NavLink>
          <NavLink to="/giao-dich/nhap-hang" className="dropdown-item">
            Nhập hàng
          </NavLink>
          <NavLink to="/giao-dich/tra-hang-nhap" className="dropdown-item">
            Trả hàng nhập
          </NavLink>
          <NavLink to="/giao-dich/xuat-huy" className="dropdown-item">
            Xuất huỷ
          </NavLink>
        </div>
      </div>

      {/* Đối tác */}
      <div className="nav-link dropdown">
        <span>Đối tác</span>
        <div className="dropdown-content">
          <NavLink to="/doi-tac/khach-hang" className="dropdown-item">
            Khách hàng
          </NavLink>
          <NavLink to="/doi-tac/nha-cung-cap" className="dropdown-item">
            Nhà cung cấp
          </NavLink>
        </div>
      </div>

      {/* Báo cáo */}
      <div className="nav-link dropdown">
        <span>Báo cáo</span>
        <div className="dropdown-content">
          <NavLink to="/bao-cao/cuoi-ngay" className="dropdown-item">
            Cuối ngày
          </NavLink>
          <NavLink to="/bao-cao/hang-hoa" className="dropdown-item">
            Hàng hoá
          </NavLink>
        </div>
      </div>

      {/* Phân tích */}
       <NavLink to="/ban-hang" className="nav-link p-2">
        <span style={{fontWeight: '500'}}>Nhận Đơn</span>
      </NavLink>
    </nav>
  );
};

export default Navbar;