import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const DashboardLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    return (
        <div className="flex h-screen bg-blue-100 overflow-hidden">
            <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
            <div className="flex-1 flex flex-col overflow-hidden relative">
                <Header />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50/50">
                    <div className="container mx-auto px-6 py-8">
                       <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
