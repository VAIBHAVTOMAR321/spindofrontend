import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Table, Button, Form, Modal } from "react-bootstrap";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import AdminHeader from "../AdminHeader";
import AdminLeftNav from "../AdminLeftNav";
import "../../../assets/css/admindashboard.css";

const BASE_URL = "https://mahadevaaya.com/spindo/spindobackend";
const API_URL = `${BASE_URL}/api/customer/issue/`;

const UserQueries = ({ showCardOnly = false }) => {
  // Sidebar and device state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
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

  // Auth
  const { tokens } = useAuth();

  // Data state
  const [userData, setUserData] = useState([]);
  const [count, setCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch user queries
  const fetchUserQueries = async () => {
    if (!tokens?.access) return;
    try {
      const res = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${tokens.access}` },
      });
      setUserData(res.data.data || []);
      setCount(res.data.data?.length || 0);
    } catch (error) {
      setUserData([]);
      setCount(0);
      console.error("GET ERROR:", error.response?.data || error.message);
    }
  };

  useEffect(() => {
    fetchUserQueries();
    // eslint-disable-next-line
  }, [tokens]);

  if (showCardOnly) {
    return (
      <div className="dashboard-card" style={{ background: 'linear-gradient(135deg, #ede9fe 60%, #ddd6fe 100%)', boxShadow: '0 2px 12px 0 rgba(139, 92, 246, 0.10)' }}>
        <div className="dashboard-card-icon query-icon" title="Online Query">
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="#8b5cf6" strokeWidth="2"/></svg>
        </div>
        <div className="dashboard-card-title">Online Query<br/>(feedback/Suggestion)</div>
        <div className="dashboard-card-value" style={{ color: '#8b5cf6' }}>{count}</div>
      </div>
    );
  }

  // Full page with table
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
            <div className="p-3">
              {/* Modern Responsive Header Row */}
              <div
                className="mb-4 d-flex align-items-center justify-content-between gap-3 flex-wrap totalreg-header-row"
                style={{
                  background: 'linear-gradient(90deg, #ede9fe 60%, #ddd6fe 100%)',
                  borderRadius: 18,
                  boxShadow: '0 2px 12px 0 rgba(139, 92, 246, 0.10)',
                  padding: '18px 12px',
                  minHeight: 90,
                }}
              >
                <div className="flex-grow-1 d-flex justify-content-center">
                  <Card
                    className="text-center order-2"
                    style={{
                      minWidth: 180,
                      maxWidth: 260,
                      borderRadius: 16,
                      boxShadow: '0 2px 12px 0 rgba(139,92,246,0.10)',
                      border: '1px solid #e5e7eb',
                      background: '#fff',
                    }}
                  >
                    <h6 style={{ color: '#8b5cf6', fontWeight: 700, marginTop: 10 }}>Total Queries</h6>
                    <h2 style={{ color: '#581c87', fontWeight: 800, marginBottom: 10 }}>{count}</h2>
                  </Card>
                </div>
              </div>
              {/* Modern Table */}
              <div className="table-responsive rounded-4 shadow-sm" style={{ background: '#fff', padding: '0.5rem 0.5rem 1rem 0.5rem' }}>
                <Table className="align-middle mb-0" style={{ minWidth: 700 }}>
                  <thead style={{ background: '#ede9fe' }}>
                    <tr style={{ fontWeight: 700, color: '#8b5cf6', fontSize: 15 }}>
                      <th>Query ID</th>
                      <th>Name</th>
                      <th>Unique ID</th>
                      <th>Title</th>
                      <th>Issue</th>
                      <th>Remark</th>
                      <th>Status</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userData
                      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                      .map((query) => (
                        <tr key={query.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ fontWeight: 600, color: '#6366f1' }}>{query.query_id}</td>
                          <td>{query.name || '--'}</td>
                          <td>{query.unique_id || '--'}</td>
                          <td>{query.title || '--'}</td>
                          <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{query.issue || '--'}</td>
                          <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{query.extra_remark || '--'}</td>
                          <td>
                            <span
                              style={{
                                padding: '4px 12px',
                                borderRadius: 6,
                                fontSize: 13,
                                fontWeight: 600,
                                backgroundColor: 
                                  query.status === 'pending' ? '#fef3c7' : 
                                  query.status === 'approved' ? '#d1fae5' : 
                                  '#fee2e2',
                                color: 
                                  query.status === 'pending' ? '#92400e' : 
                                  query.status === 'approved' ? '#065f46' : 
                                  '#991b1b',
                              }}
                            >
                              {query.status?.charAt(0).toUpperCase() + query.status?.slice(1)}
                            </span>
                          </td>
                          <td>{new Date(query.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                  </tbody>
                </Table>
                {/* Pagination Controls */}
                <div className="d-flex justify-content-center align-items-center mt-3 gap-2">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    style={{ minWidth: 80 }}
                  >
                    Previous
                  </Button>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>
                    Page {currentPage} of {Math.ceil(userData.length / itemsPerPage) || 1}
                  </span>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    disabled={currentPage === Math.ceil(userData.length / itemsPerPage) || userData.length === 0}
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                    style={{ minWidth: 80 }}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </Container>
        </div>
      </div>
    </>
  );
};

export default UserQueries;
