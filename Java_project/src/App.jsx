import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css'
import Home from './page/Home';
import Customer from './page/doitac/Customer';
import Provider from './page/doitac/Provider';
import CategoryList from './page/hanghoa/CategoryList';
import ProductList from './page/hanghoa/ProductList';
import InventoryChecking from './page/hanghoa/InventoryChecking'
import Invoice from './page/giaodich/Invoice';
import ReturnProduct from './page/giaodich/ReturnProduct';
import ImportProduct from './page/giaodich/ImportProduct';
import ReturnImportedProduct from './page/giaodich/ReTurnImportedProduct';
import CancelProduct from './page/giaodich/CancelProduct';
import DailyReport from './page/baocao/DailyReport';
import ProductReport from './page/baocao/ProductReport';
import ProductAnalyze from './page/phantich/ProductAnalyze';
import SaleAnalyze from './page/phantich/SaleAnalyze';
function App() {

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/home" />} />
        <Route path="/home" element={<Home />} />
        <Route path="/hang-hoa/danh-muc" element={<CategoryList />} />
        <Route path="/hang-hoa/san-pham" element={<ProductList />} />
        <Route path="/hang-hoa/kiem-kho" element={<InventoryChecking />} />
        <Route path="/giao-dich/hoa-don" element={<Invoice />} />
        <Route path="/giao-dich/tra-hang" element={<ReturnProduct />} />
        <Route path="/giao-dich/nhap-hang" element={<ImportProduct />} />
        <Route path="/giao-dich/tra-hang-nhap" element={<ReturnImportedProduct />} />
        <Route path="/giao-dich/xuat-huy" element={<CancelProduct />} />
        <Route path="/doi-tac/khach-hang" element={<Customer />} />
        <Route path="/doi-tac/nha-cung-cap" element={<Provider />} />
        <Route path="/bao-cao/cuoi-ngay" element={<DailyReport />} />
        <Route path="/bao-cao/hang-hoa" element={<ProductReport />} />
        <Route path="/phan-tich/ban-hang" element={<SaleAnalyze />} />
        <Route path="/phan-tich/hang-hoa" element={<ProductAnalyze />} />
      </Routes>
    </Router>
  )
}

export default App;
