import React from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Navbar from "../components/Navbar";
import "../App.css";

const Layout = () => {
    return (
        <>
            <Header />
            <Navbar />
            <main>
                <Outlet /> { }
            </main>
        </>
    );
};

export default Layout;