import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import TongQuan from "./pages/TongQuan";

// Báo cáo
import CuoiNgay from "./pages/baocao/CuoiNgay";
import BaoCaoHangHoa from "./pages/baocao/BaoCaoHangHoa";

// Đối tác
import KhachHang from "./pages/doitac/KhachHang";
import NhaCungCap from "./pages/doitac/NhaCungCap";

// Giao dịch
import HoaDon from "./pages/giaodich/HoaDon";
import TraHang from "./pages/giaodich/TraHang";
import NhapHang from "./pages/giaodich/NhapHang.jsx";
import TraHangNhap from "./pages/giaodich/TraHangNhap.jsx";
import XuatHuy from "./pages/giaodich/XuatHuy";

// Hàng hoá
import DanhMuc from "./pages/hanghoa/DanhMuc";
import KiemKho from "./pages/hanghoa/KiemKho";
import KiemKhoChiTiet from "./pages/hanghoa/KiemKhoChiTiet";


// Phân tích
import BanHang from "./pages/phantich/BanHang";
import PhanTichHangHoa from "./pages/phantich/PhanTichHangHoa";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<TongQuan />} />
          <Route path="tong-quan" element={<TongQuan />} />

          {/* Hàng hoá */}
          <Route path="hang-hoa" element={<DanhMuc />} />
          <Route path="hang-hoa/danh-muc" element={<DanhMuc />} />
          <Route path="hang-hoa/kiem-kho" element={<KiemKho />} />
          <Route path="hang-hoa/kiem-kho-chi-tiet" element={<KiemKhoChiTiet />} />

          {/* Giao dịch */}
          <Route path="giao-dich/hoa-don" element={<HoaDon />} />
          <Route path="giao-dich/tra-hang" element={<TraHang />} />
          <Route path="giao-dich/nhap-hang" element={<NhapHang />} />
          <Route path="giao-dich/tra-hang-nhap" element={<TraHangNhap />} />
          <Route path="giao-dich/xuat-huy" element={<XuatHuy />} />

          {/* Đối tác */}
          <Route path="doi-tac/khach-hang" element={<KhachHang />} />
          <Route path="doi-tac/nha-cung-cap" element={<NhaCungCap />} />

          {/* Báo cáo */}
          <Route path="bao-cao/cuoi-ngay" element={<CuoiNgay />} />
          <Route path="bao-cao/hang-hoa" element={<BaoCaoHangHoa />} />

          {/* Phân tích */}
          <Route path="phan-tich/ban-hang" element={<BanHang />} />
          <Route path="phan-tich/hang-hoa" element={<PhanTichHangHoa />} />
        </Route>
      </Routes>
    </Router>
    
  );
}

export default App;