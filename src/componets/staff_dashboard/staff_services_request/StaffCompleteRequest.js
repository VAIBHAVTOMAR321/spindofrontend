import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Table, Button } from "react-bootstrap";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

import "../../../assets/css/admindashboard.css";
import StaffHeader from "../StaffHeader";
import StaffLeftNav from "../StaffLeftNav";

const BASE_URL = "https://mahadevaaya.com/spindo/spindobackend";
const API_URL = `${BASE_URL}/api/customer/requestservices/`;

const StaffCompleteRequest = ({ showCardOnly = false }) => {
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
  const [requestData, setRequestData] = useState([]); // Holds all requests from API
  const [count, setCount] = useState(0); // Count of ASSIGNED requests
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch all request services
  const fetchRequestServices = async () => {
    if (!tokens?.access) return;
    try {
      const res = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${tokens.access}` },
      });
      const allRequests = res.data.data || [];
      // Filter to get only requests that have been assigned
      const assignedRequests = allRequests.filter(req => req.assigned_to_name && req.assigned_to_name.trim() !== '');
      setRequestData(allRequests); // Keep all requests in state
      setCount(assignedRequests.length); // Set count to only assigned requests
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
        <div className="dashboard-card-icon request-icon" title="Assigned Services">
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#52ab98" strokeWidth="2"/></svg>
        </div>
        <div className="dashboard-card-title">Assigned Services</div>
        <div className="dashboard-card-value">{count}</div>
      </div>
    );
  }

  // --- Main Component Render ---
  // Filter the requests to only show assigned ones for the table
  const assignedRequests = requestData.filter(req => req.assigned_to_name && req.assigned_to_name.trim() !== '');

  return (
    <>
      <div className="dashboard-container">
        {/* Left Sidebar */}
        <StaffLeftNav
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          isMobile={isMobile}
          isTablet={isTablet}
        />
        {/* Main Content */}
        <div className="main-content-dash">
          <StaffHeader toggleSidebar={toggleSidebar} />
          <Container fluid className="dashboard-body dashboard-main-container">
            <div className="p-3">
              {/* Header Row - Simplified to show only Assigned Requests count */}
              <div
                className="mb-4 d-flex align-items-center justify-content-center"
                style={{
                  background: 'linear-gradient(90deg, #f8fafc 60%, #e0e7ff 100%)',
                  borderRadius: 18,
                  boxShadow: '0 2px 12px 0 rgba(60, 72, 88, 0.10)',
                  padding: '18px 12px',
                  minHeight: 90,
                }}
              >
                <Card
                  className="text-center"
                  style={{
                    minWidth: 220,
                    maxWidth: 300,
                    borderRadius: 16,
                    boxShadow: '0 2px 12px 0 rgba(99,102,241,0.10)',
                    border: '1px solid #e5e7eb',
                    background: '#fff',
                  }}
                >
                  <h6 style={{ color: '#6366f1', fontWeight: 700, marginTop: 10 }}>
                    Assigned Service Requests
                  </h6>
                  <h2 style={{ color: '#1e293b', fontWeight: 800, marginBottom: 10 }}>
                    {count}
                  </h2>
                </Card>
              </div>
              
              {/* Modern Table for Assigned Requests */}
              <div className="table-responsive rounded-4 shadow-sm" style={{ background: '#fff', padding: '0.5rem 0.5rem 1rem 0.5rem' }}>
                <Table className="align-middle mb-0" style={{ minWidth: 900 }}>
                  <thead className="table-thead">
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
                      {/* Action column removed */}
                    </tr>
                  </thead>
                  <tbody>
                    {assignedRequests.length > 0 ? (
                      assignedRequests
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
                            {/* Action column cell removed */}
                          </tr>
                        ))
                    ) : (
                      <tr>
                        {/* Updated colSpan from 12 to 11 */}
                        <td colSpan="11" className="text-center text-muted py-4">
                          No assigned service requests found.
                        </td>
                      </tr>
                    )}
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
                    Page {currentPage} of {Math.ceil(assignedRequests.length / itemsPerPage) || 1}
                  </span>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    disabled={currentPage === Math.ceil(assignedRequests.length / itemsPerPage) || assignedRequests.length === 0}
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

export default StaffCompleteRequest;