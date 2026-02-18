import React, { useState, useEffect } from "react";
import { Container, Row, Col } from "react-bootstrap";
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
import UserQueries from "./pages/UserQueries";
import TotalRegistration from "./pages/TotalRegistration";
import { useAuth } from "../context/AuthContext";

// Use the same API URL as in TotalRegistration
const BASE_URL = "https://mahadevaaya.com/spindo/spindobackend";
const STAFF_API_URL = `${BASE_URL}/api/staffadmin/register/`;
const USER_QUERIES_API = `${BASE_URL}/api/customer/issue/`;
const STAFF_QUERIES_API = `${BASE_URL}/api/staffadmin/issue/`;
const USER_API_URL = `${BASE_URL}/api/customer/register/`;
const VENDOR_API_URL = `${BASE_URL}/api/vendor/register/`;
const SERVICE_API_URL = `${BASE_URL}/api/service-category/`;
const REQUEST_SERVICES_API = `${BASE_URL}/api/customer/requestservices/`;
const VENDOR_QUERIES_API = `${BASE_URL}/api/vendor/request/`;
const BILLS_API = `${BASE_URL}/api/bills/`;

const AdminDashBoard = () => {
  // Check device width
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  
  // Dashboard statistics
  const [staffCount, setStaffCount] = useState('--');
  const [userCount, setUserCount] = useState('--');
  const [vendorCount, setVendorCount] = useState('--');
  const [serviceCount, setServiceCount] = useState('--');
  const [requestServicesCount, setRequestServicesCount] = useState('--');
  const [userQueriesCount, setUserQueriesCount] = useState('--');
  const [staffQueriesCount, setStaffQueriesCount] = useState('--');
  const [vendorQueriesCount, setVendorQueriesCount] = useState('--');
  const [totalQueriesCount, setTotalQueriesCount] = useState('--');
  const [billCount, setBillCount] = useState('--');
  
  const { tokens } = useAuth();
  const navigate = useNavigate();

  // Fetch all dashboard data
  useEffect(() => {
    if (!tokens?.access) return;

    const fetchAllData = async () => {
      try {
        // Fetch Staff Count
        const staffRes = await axios.get(STAFF_API_URL, {
          headers: { Authorization: `Bearer ${tokens.access}` }
        });
        setStaffCount(staffRes.data.count || 0);

        // Fetch User Count
        const userRes = await axios.get(USER_API_URL, {
          headers: { Authorization: `Bearer ${tokens.access}` }
        });
        setUserCount(userRes.data.count || 0);

        // Fetch Vendor Count
        const vendorRes = await axios.get(VENDOR_API_URL, {
          headers: { Authorization: `Bearer ${tokens.access}` }
        });
        setVendorCount(vendorRes.data.count || 0);

        // Fetch Service Count
        const serviceRes = await axios.get(SERVICE_API_URL, {
          headers: { Authorization: `Bearer ${tokens.access}` }
        });
        setServiceCount(serviceRes.data.data?.length || 0);

        // Fetch Request Services Count
        const requestRes = await axios.get(REQUEST_SERVICES_API, {
          headers: { Authorization: `Bearer ${tokens.access}` }
        });
        setRequestServicesCount(requestRes.data.data?.length || 0);

        // Fetch User Queries Count
        const userQueriesRes = await axios.get(USER_QUERIES_API, {
          headers: { Authorization: `Bearer ${tokens.access}` }
        });
        const userQueriesData = userQueriesRes.data.data?.length || 0;
        setUserQueriesCount(userQueriesData);

        // Fetch Staff Queries Count
        const staffQueriesRes = await axios.get(STAFF_QUERIES_API, {
          headers: { Authorization: `Bearer ${tokens.access}` }
        });
        const staffQueriesData = staffQueriesRes.data.data?.length || 0;
        setStaffQueriesCount(staffQueriesData);

        // Fetch Vendor Queries Count
        const vendorQueriesRes = await axios.get(VENDOR_QUERIES_API, {
          headers: { Authorization: `Bearer ${tokens.access}` }
        });
        const vendorQueriesData = vendorQueriesRes.data.data?.length || 0;
        setVendorQueriesCount(vendorQueriesData);

        // Fetch Bills Count
        const billsRes = await axios.get(BILLS_API, {
          headers: { Authorization: `Bearer ${tokens.access}` }
        });
        const billsData = billsRes.data.data?.length || 0;
        setBillCount(billsData);

        // Set total queries
        setTotalQueriesCount(userQueriesData + staffQueriesData + vendorQueriesData);
      } catch (error) {
        console.log("Error fetching dashboard data:", error);
      }
    };

    fetchAllData();
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
            {/* Header Section */}
            <div className="dashboard-header-section">
              <h1 className="dashboard-main-title">📊 Dashboard Overview</h1>
              <p className="dashboard-subtitle">Welcome to Admin Dashboard - System Statistics & Management</p>
            </div>

            {/* Primary Statistics Row */}
            <div className="dashboard-section">
              <h2 className="section-title">User Management</h2>
              <div className="dashboard-cards-grid">
                {/* Registered Users Card */}
                <div className="card-wrapper" onClick={() => navigate('/RegisteredUsers')}>
                  <div className="dashboard-card card-users">
                    <div className="dashboard-card-icon users-icon">
                      <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
                        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
                        <path d="M2 20c0-2.5 4-4 10-4s10 1.5 10 4" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </div>
                    <div className="dashboard-card-title">Registered Users</div>
                    <div className="dashboard-card-value">{userCount}</div>
                    <div className="card-footer-text">View & Manage Users</div>
                  </div>
                </div>

                {/* Registered Vendors Card */}
                <div className="card-wrapper" onClick={() => navigate('/RegisteredVendor')}>
                  <div className="dashboard-card card-vendors">
                    <div className="dashboard-card-icon vendors-icon">
                      <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
                        <path d="M13 16h-2v-4h2v4z" stroke="currentColor" strokeWidth="2" fill="currentColor"/>
                        <path d="M21 19V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2z" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </div>
                    <div className="dashboard-card-title">Registered Vendors</div>
                    <div className="dashboard-card-value">{vendorCount}</div>
                    <div className="card-footer-text">View & Manage Vendors</div>
                  </div>
                </div>

                {/* Registered Staff Card */}
                <div className="card-wrapper" onClick={() => navigate('/TotalRegistration')}>
                  <div className="dashboard-card card-staff">
                    <div className="dashboard-card-icon staff-icon">
                      <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2"/>
                        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                        <path d="M23 21v-2a4 4 0 00-3-3.87" stroke="currentColor" strokeWidth="2"/>
                        <path d="M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </div>
                    <div className="dashboard-card-title">Registered Staff</div>
                    <div className="dashboard-card-value">{staffCount}</div>
                    <div className="card-footer-text">View & Manage Staff</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Services Section */}
            <div className="dashboard-section">
              <Row className="g-4">
                {/* Left Column - 8 cols */}
                <Col lg={8} md={12}>
                  <h2 className="section-title">Service Management</h2>
                  <div className="dashboard-cards-grid">
                    {/* Services Card */}
                    <div className="card-wrapper" onClick={() => navigate('/ServiceCategory')}>
                      <div className="dashboard-card card-services">
                        <div className="dashboard-card-icon services-icon">
                          <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
                            <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                            <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                            <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                            <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                        </div>
                        <div className="dashboard-card-title">Service Categories</div>
                        <div className="dashboard-card-value">{serviceCount}</div>
                        <div className="card-footer-text">Total Services Available</div>
                      </div>
                    </div>

                    {/* Service Requests Card */}
                    <div className="card-wrapper" onClick={() => navigate('/RequestServices')}>
                      <div className="dashboard-card card-requests">
                        <div className="dashboard-card-icon requests-icon">
                          <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
                            <path d="M9 12l2 2 4-4m7 0a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                        </div>
                        <div className="dashboard-card-title">Service Requests</div>
                        <div className="dashboard-card-value">{requestServicesCount}</div>
                        <div className="card-footer-text">Pending & Active Requests</div>
                      </div>
                    </div>
                  </div>
                </Col>

                {/* Right Column - 4 cols - Bills Card */}
                <Col lg={4} md={12}>
                  <h2 className="section-title">Bills</h2>
                  <div className="card-wrapper" onClick={() => navigate('/Bills')}>
                    <div className="dashboard-card card-bills">
                      <div className="dashboard-card-icon bills-icon">
                        <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
                          <path d="M9 12h6m-6 4h6m2-13H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      </div>
                      <div className="dashboard-card-title">Bills</div>
                      <div className="dashboard-card-value">{billCount}</div>
                      <div className="card-footer-text">Total Bills</div>
                    </div>
                  </div>
                </Col>
              </Row>
            </div>

            {/* Queries & Support Section */}
            <div className="dashboard-section">
              <h2 className="section-title">Queries & Support</h2>
              <div className="dashboard-cards-grid">
                {/* Total Queries Card */}
                <div className="card-wrapper" onClick={() => navigate('/OnlineQuery', { state: { tab: 'user' } })}>
                  <div className="dashboard-card card-total-queries">
                    <div className="dashboard-card-icon total-queries-icon">
                      <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
                        <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V4a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-5l-5 5v-5z" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </div>
                    <div className="dashboard-card-title">Total Queries</div>
                    <div className="dashboard-card-value">{totalQueriesCount}</div>
                    <div className="card-footer-text">All Support Tickets</div>
                  </div>
                </div>

                {/* User Queries Card */}
                <div className="card-wrapper" onClick={() => navigate('/OnlineQuery', { state: { tab: 'user' } })}>
                  <div className="dashboard-card card-user-queries">
                    <div className="dashboard-card-icon user-queries-icon">
                      <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
                        <path d="M13 16h-2v-4h2v4zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </div>
                    <div className="dashboard-card-title">User Queries</div>
                    <div className="dashboard-card-value">{userQueriesCount}</div>
                    <div className="card-footer-text">Feedback & Suggestions</div>
                  </div>
                </div>

                {/* Staff Queries Card */}
                <div className="card-wrapper" onClick={() => navigate('/OnlineQuery', { state: { tab: 'staff' } })}>
                  <div className="dashboard-card card-staff-queries">
                    <div className="dashboard-card-icon staff-queries-icon">
                      <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
                        <path d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </div>
                    <div className="dashboard-card-title">Staff Queries</div>
                    <div className="dashboard-card-value">{staffQueriesCount}</div>
                    <div className="card-footer-text">Internal Support</div>
                  </div>
                </div>

                {/* Vendor Queries Card */}
                <div className="card-wrapper" onClick={() => navigate('/OnlineQuery', { state: { tab: 'vendor' } })}>
                  <div className="dashboard-card card-vendor-queries">
                    <div className="dashboard-card-icon vendor-queries-icon">
                      <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
                        <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </div>
                    <div className="dashboard-card-title">Vendor Queries</div>
                    <div className="dashboard-card-value">{vendorQueriesCount}</div>
                    <div className="card-footer-text">Vendor Support</div>
                  </div>
                </div>
              </div>
            </div>

          </Container>
        </div>
      </div>
    </>
  );
};

export default AdminDashBoard;