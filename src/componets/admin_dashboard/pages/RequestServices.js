import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Table, Button, Form, Modal } from "react-bootstrap";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import AdminHeader from "../AdminHeader";
import AdminLeftNav from "../AdminLeftNav";
import "../../../assets/css/admindashboard.css";

const BASE_URL = "https://mahadevaaya.com/spindo/spindobackend";
const API_URL = `${BASE_URL}/api/customer/requestservices/`;

const RequestServices = ({ showCardOnly = false }) => {
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
  const [requestData, setRequestData] = useState([]);
  const [count, setCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch request services
  const fetchRequestServices = async () => {
    if (!tokens?.access) return;
    try {
      const res = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${tokens.access}` },
      });
      setRequestData(res.data.data || []);
      setCount(res.data.data?.length || 0);
    } catch (error) {
      setRequestData([]);
      setCount(0);
      console.error("GET ERROR:", error.response?.data || error.message);
    }
  };

  useEffect(() => {
    fetchRequestServices();
    // eslint-disable-next-line
  }, [tokens]);

  if (showCardOnly) {
    return (
      <div className="dashboard-card">
        <div className="dashboard-card-icon request-icon" title="Request for services">
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path d="M12 20v-6m0 0l-3 3m3-3l3 3M4 8V6a2 2 0 012-2h12a2 2 0 012 2v2" stroke="#6366f1" strokeWidth="2"/></svg>
        </div>
        <div className="dashboard-card-title">Request for services</div>
        <div className="dashboard-card-value">{count}</div>
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
                  background: 'linear-gradient(90deg, #f8fafc 60%, #e0e7ff 100%)',
                  borderRadius: 18,
                  boxShadow: '0 2px 12px 0 rgba(60, 72, 88, 0.10)',
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
                      boxShadow: '0 2px 12px 0 rgba(99,102,241,0.10)',
                      border: '1px solid #e5e7eb',
                      background: '#fff',
                    }}
                  >
                    <h6 style={{ color: '#6366f1', fontWeight: 700, marginTop: 10 }}>Total Requests</h6>
                    <h2 style={{ color: '#1e293b', fontWeight: 800, marginBottom: 10 }}>{count}</h2>
                  </Card>
                </div>
              </div>
              {/* Modern Table */}
              <div className="table-responsive rounded-4 shadow-sm" style={{ background: '#fff', padding: '0.5rem 0.5rem 1rem 0.5rem' }}>
                <Table className="align-middle mb-0" style={{ minWidth: 700 }}>
                  <thead style={{ background: '#f1f5f9' }}>
                    <tr style={{ fontWeight: 700, color: '#6366f1', fontSize: 15 }}>
                      <th>Request ID</th>
                      <th>Username</th>
                      <th>Contact Number</th>
                      <th>Email</th>
                      <th>State</th>
                      <th>District</th>
                      <th>Schedule Date</th>
                      <th>Assigned To</th>
                      <th>Assigned By</th>
                      <th>Status</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requestData
                      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                      .map((request) => (
                        <tr key={request.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ fontWeight: 600, color: '#6366f1' }}>{request.request_id}</td>
                          <td>{request.username}</td>
                          <td>{request.contact_number}</td>
                          <td>{request.email}</td>
                          <td>{request.state}</td>
                          <td>{request.district}</td>
                          <td>{new Date(request.schedule_date).toLocaleDateString()}</td>
                          <td>{request.assigned_to_name || '--'}</td>
                          <td>{request.assigned_by_name || '--'}</td>
                          <td>
                            <span
                              style={{
                                padding: '4px 12px',
                                borderRadius: 6,
                                fontSize: 13,
                                fontWeight: 600,
                                backgroundColor: request.status === 'pending' ? '#fef3c7' : '#d1fae5',
                                color: request.status === 'pending' ? '#92400e' : '#065f46',
                              }}
                            >
                              {request.status?.charAt(0).toUpperCase() + request.status?.slice(1)}
                            </span>
                          </td>
                          <td>{new Date(request.created_at).toLocaleDateString()}</td>
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
                    Page {currentPage} of {Math.ceil(requestData.length / itemsPerPage) || 1}
                  </span>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    disabled={currentPage === Math.ceil(requestData.length / itemsPerPage) || requestData.length === 0}
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

export default RequestServices;
