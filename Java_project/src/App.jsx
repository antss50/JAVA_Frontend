import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "./App.css";
import Layout from "./components/layout/Layout";
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./page/Home";
import Customer from "./page/doitac/Customer";
import Provider from "./page/doitac/Provider";
import CategoryList from "./page/hanghoa/CategoryList";
import ProductList from "./page/hanghoa/ProductList";
import Stock from "./page/hanghoa/Stock";
import Invoice from "./page/giaodich/Invoice";
import ReturnProduct from "./page/giaodich/ReturnProduct";
import ReturnList from "./page/giaodich/ReturnList";
import ImportProduct from "./page/giaodich/ImportProduct";
import ReturnImportedProduct from "./page/giaodich/returnImportProducts";
import CancelProduct from "./page/giaodich/CancelProduct";
import ProductReport from "./page/baocao/ProductReport";
import SaleOrder from "./page/phantich/SaleOrder";
import StockCheckManagement from "./page/hanghoa/stock-check/StockCheckManagement";
import StockCheckForm from "./page/hanghoa/stock-check/StockCheckForm";
import BillManagement from "./page/hanghoa/bill-management/BillManagement";
import BillDetails from "./page/hanghoa/bill-management/BillDetails";
import BillForm from "./page/hanghoa/bill-management/BillForm";
import PurchaseOrderForm from "./page/hanghoa/bill-management/PurchaseOrderForm";

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          {" "}
          <Route path="/" element={<Navigate to="/home" />} />
          <Route path="/home" element={<Home />} />
          <Route path="/hang-hoa/danh-muc" element={<CategoryList />} />
          <Route path="/hang-hoa/san-pham" element={<ProductList />} />
          <Route
            path="/hang-hoa/kho"
            element={
              <ErrorBoundary>
                <Stock />
              </ErrorBoundary>
            }
          />
          <Route path="/hang-hoa/kiem-kho" element={<StockCheckManagement />} />
          <Route path="/hang-hoa/kiem-kho-moi" element={<StockCheckForm />} />
          <Route path="/giao-dich/hoa-don" element={<Invoice />} />
          <Route path="/giao-dich/tra-hang-form" element={<ReturnProduct />} />
          <Route path="/giao-dich/tra-hang" element={<ReturnList />} />
          <Route path="/giao-dich/nhap-hang" element={<ImportProduct />} />
          <Route
            path="/giao-dich/tra-hang-nhap"
            element={<ReturnImportedProduct />}
          />
          <Route path="/giao-dich/xuat-huy" element={<CancelProduct />} />
          <Route path="/doi-tac/khach-hang" element={<Customer />} />
          <Route path="/doi-tac/nha-cung-cap" element={<Provider />} />
          <Route path="/bao-cao" element={<ProductReport />} />
          <Route path="/ban-hang" element={<SaleOrder />} />
          <Route
            path="/hang-hoa/bill-management"
            element={<BillManagement />}
          />
          <Route
            path="/hang-hoa/bill-management/:billId"
            element={<BillDetails />}
          />
          <Route path="/hang-hoa/bill-management/new" element={<BillForm />} />
          <Route
            path="/hang-hoa/bill-management/edit/:billId"
            element={<BillForm />}
          />
          <Route
            path="/hang-hoa/bill-management/purchase-order"
            element={<PurchaseOrderForm />}
          />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
