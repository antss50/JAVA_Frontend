// src/components/Header.jsx
import React from "react";
import "../App.css";

const Header = () => {
  return (
    <div className="header d-flex justify-content-between p-4">
      <h2 className="ms-5">PHẦN MỀM QUẢN LÝ HÀNG HOÁ</h2>
      <button className="login-btn rounded-2 me-5">Tài khoản</button>
    </div>
  );
};

export default Header;