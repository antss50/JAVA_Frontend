import React from 'react';
import Navbar from './Navbar';
import Header from '../../component/Header';
const Layout = ({ children }) => {
    return (
        <div className="app-container">
            <Header></Header>
            <Navbar />
            <main className="main-content">
                {children}
            </main>
        </div>
    );
};

export default Layout; 