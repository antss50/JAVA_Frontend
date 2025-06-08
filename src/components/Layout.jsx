import React from "react";
import { Outlet } from "react-router-dom";
import Topbar from "./Topbar";
import Navbar from "./Navbar";
import "./Layout.css";

const Layout = () => {
  return (
    <>
      <Topbar />
      <Navbar />
      <main>
        <Outlet /> {}
      </main>
    </>
  );
};

export default Layout;