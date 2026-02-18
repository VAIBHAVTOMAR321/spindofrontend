import React, { useState, useEffect } from "react";
import { Container } from "react-bootstrap";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../assets/css/admindashboard.css";
import AdminHeader from "./AdminHeader";
import AdminLeftNav from "./AdminLeftNav";
import RegisteredUsers from "./pages/RegisteredUsers";
import RegisteredVendor from "./pages/RegisteredVendor";
import NumberOfServices from "./pages/NumberOfServices";
import RequestServicesCount from "./pages/RequestServicesCount";
import AllQueries from "./pages/AllQueries";
import { useAuth } from "../context/AuthContext";

// Use the same API URL as in TotalRegistration
const BASE_URL = "https://mahadevaaya.com/spindo/spindobackend";
const STAFF_API_URL = `${BASE_URL}/api/staffadmin/register/`;
const USER_QUERIES_API = `${BASE_URL}/api/customer/issue/`;
const STAFF_QUERIES_API = `${BASE_URL}/api/staffadmin/issue/`;



const AdminDashBoard = () => {
  // Check device width
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [staffCount, setStaffCount] = useState('--');
  const [onlineQueryCount, setOnlineQueryCount] = useState(0);
  const { tokens } = useAuth();
  const navigate = useNavigate();
  // Fetch registered staff count using the same logic as TotalRegistration
  useEffect(() => {
    const fetchStaffCount = async () => {
      if (!tokens?.access) return;
      try {
        const res = await axios.get(STAFF_API_URL, {
          headers: { Authorization: `Bearer ${tokens.access}` }
        });
        setStaffCount(res.data.count || 0);
      } catch (error) {
        setStaffCount('--');
        console.log("Error fetching staff count:", error);
      }
    };
    fetchStaffCount();
  }, [tokens]);

  // Fetch online query count (User + Staff)
  useEffect(() => {
    const fetchOnlineQueryCount = async () => {
      if (!tokens?.access) return;
      try {
        const userRes = await axios.get(USER_QUERIES_API, {
          headers: { Authorization: `Bearer ${tokens.access}` }
        });
        const staffRes = await axios.get(STAFF_QUERIES_API, {
          headers: { Authorization: `Bearer ${tokens.access}` }
        });
        const userCount = userRes.data.data?.length || 0;
        const staffCount = staffRes.data.data?.length || 0;
        setOnlineQueryCount(userCount + staffCount);
      } catch (error) {
        setOnlineQueryCount(0);
        console.log("Error fetching online query count:", error);
      }
    };
    fetchOnlineQueryCount();
  }, [tokens]);
  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      setSidebarOpen(width >= 1024);
    };
    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);


  return (
    <>
      <div className="dashboard-container">
        {/* Left Sidebar */}
        <AdminLeftNav
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          isMobile={isMobile}
          isTablet={isTablet}
        />

        {/* Main Content */}
        <div className="main-content-dash">
          <AdminHeader toggleSidebar={toggleSidebar} />

          <Container fluid className="dashboard-body dashboard-main-container">
            <div className="dashboard-cards-row">
              {/* Registered Users Card */}
              <div style={{ cursor: 'pointer' }} onClick={() => navigate('/RegisteredUsers')}>
                <RegisteredUsers showCardOnly />
              </div>
              {/* Registered Vendor Card */}
              <div style={{ cursor: 'pointer' }} onClick={() => navigate('/RegisteredVendor')}>
                <RegisteredVendor showCardOnly />
              </div>
              <div className="dashboard-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/TotalRegistration')}>
                <div className="dashboard-card-icon staff-icon" title="Registered Staff">
                  <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" stroke="#6366f1" strokeWidth="2"/><path d="M2 20c0-2.5 4-4 10-4s10 1.5 10 4" stroke="#6366f1" strokeWidth="2"/></svg>
                </div>
                <div className="dashboard-card-title">Registered Staff</div>
                <div className="dashboard-card-value">{staffCount}</div>
              </div>
              {/* Number Of Services Card */}
              <div style={{ cursor: 'pointer' }} onClick={() => navigate('/ServiceCategory')}>
                <NumberOfServices showCardOnly />
              </div>
              {/* Request for services Card */}
              <div style={{ cursor: 'pointer' }} onClick={() => navigate('/RequestServices')}>
                <RequestServicesCount showCardOnly />
              </div>
              {/* Online Query Card */}
              <div style={{ cursor: 'pointer' }} onClick={() => navigate('/OnlineQuery')}>
                <AllQueries showCardOnly />
              </div>
              <div className="dashboard-card">
                <div className="dashboard-card-icon bill-icon" title="Generated Bills">
                  <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4" stroke="#6366f1" strokeWidth="2"/><path d="M8 8h8M8 12h8M8 16h4" stroke="#6366f1" strokeWidth="2"/></svg>
                </div>
                <div className="dashboard-card-title">Generated Bills</div>
                <div className="dashboard-card-value">35</div>
              </div>
            </div>
          </Container>
        </div>
      </div>

   
    </>
  );
};

export default AdminDashBoard;