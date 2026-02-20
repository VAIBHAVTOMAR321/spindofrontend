import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Table, Button, Modal } from "react-bootstrap";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

  // Navigate to StaffBill with request data
  const handleCreateBill = (request) => {
    navigate('/StaffBill', { 
      state: { 
        customer_name: request.username,
        cust_mobile: request.contact_number,
        email: request.email,
        state: request.state,
        district: request.district,
        request_id: request.request_id,
        service_type: request.service_type || '',
        assigned_to: request.assigned_to_name
      } 
    });
  };

  // Data state
  const [requestData, setRequestData] = useState([]); // Holds all requests from API
  const [count, setCount] = useState(0); // Count of ASSIGNED requests
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Detail view state
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Fetch all request services
  const fetchRequestServices = async () => {
    if (!tokens?.access) return;
    try {
      const res = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${tokens.access}` },
      });
      const allRequests = res.data.data || [];
      // Filter to get only requests that have assignments
      const assignedRequests = allRequests.filter(req => Array.isArray(req.assignments) && req.assignments.length > 0);
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
  const assignedRequests = requestData.filter(req => Array.isArray(req.assignments) && req.assignments.length > 0);

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
            <div className="mb-3">
              <Button 
                variant="outline-secondary" 
                onClick={() => navigate('/StaffDashBoard')}
                className="me-2"
              >
                <i className="bi bi-arrow-left me-2"></i> Back to Dashboard
              </Button>
            </div>
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
                      <th>Assignments</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Action</th>
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
                            <td>
                              {Array.isArray(request.assignments) && request.assignments.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                  {request.assignments.slice(0, 2).map((assignment, idx) => {
                                    if (Array.isArray(assignment) && assignment.length >= 3) {
                                      const vendorName = assignment[2];
                                      const assignmentStatus = assignment[3] || "assigned";
                                      return (
                                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                          <span style={{ fontSize: 12, fontWeight: 600, color: '#065f46' }}>
                                            {vendorName}
                                          </span>
                                          <span
                                            style={{
                                              padding: '2px 8px',
                                              borderRadius: 3,
                                              fontSize: 10,
                                              fontWeight: 600,
                                              backgroundColor: assignmentStatus === "completed" ? "#d4edda" : assignmentStatus === "assigned" ? "#cfe2ff" : "#f8f9fa",
                                              color: assignmentStatus === "completed" ? "#155724" : assignmentStatus === "assigned" ? "#004085" : "#6c757d"
                                            }}
                                          >
                                            {assignmentStatus}
                                          </span>
                                        </div>
                                      );
                                    }
                                    return null;
                                  })}
                                  {request.assignments.length > 2 && (
                                    <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
                                      +{request.assignments.length - 2} more
                                    </span>
                                  )}
                                  <Button
                                    variant="link"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedRequest(request);
                                      setShowDetailModal(true);
                                    }}
                                    style={{ padding: 0, textDecoration: 'none', color: '#6366f1', fontWeight: 600, fontSize: 11, marginTop: 2 }}
                                  >
                                    View All
                                  </Button>
                                </div>
                              ) : (
                                <span style={{ color: '#94a3b8' }}>--</span>
                              )}
                            </td>
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
                            <td>
                              {request.status === 'completed' && (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleCreateBill(request)}
                                  style={{
                                    backgroundColor: '#6366f1',
                                    borderColor: '#6366f1',
                                  }}
                                >
                                  Create Bill
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
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

      {/* Detail View Modal - All Assignments */}
      <Modal
        show={showDetailModal}
        onHide={() => setShowDetailModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
          <Modal.Title style={{ color: '#1e293b', fontWeight: 700 }}>
            All Vendor Assignments
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: '2rem' }}>
          {selectedRequest && (
            <div>
              <h6 style={{ color: '#475569', fontWeight: 600, marginBottom: '1rem' }}>Vendor Assignments</h6>
              {Array.isArray(selectedRequest.assignments) && selectedRequest.assignments.length > 0 ? (
                <div>
                  {selectedRequest.assignments.map((assignment, aIdx) => (
                    <div key={aIdx} className="p-3 border rounded mb-3" style={{ backgroundColor: '#f8fafc' }}>
                      {(() => {
                        if (Array.isArray(assignment) && assignment.length >= 3) {
                          const services = assignment[0];
                          const vendorName = assignment[2];
                          const assignmentStatus = assignment[3] || "assigned";
                          const serviceList = Array.isArray(services) ? services : [services];
                          return (
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                <h6 style={{ color: '#6366f1', fontWeight: 700, margin: 0 }}>{vendorName}</h6>
                                <span
                                  style={{
                                    padding: '4px 10px',
                                    borderRadius: 4,
                                    fontSize: 12,
                                    fontWeight: 600,
                                    backgroundColor: assignmentStatus === "completed" ? "#d4edda" : assignmentStatus === "assigned" ? "#cfe2ff" : "#f8f9fa",
                                    color: assignmentStatus === "completed" ? "#155724" : assignmentStatus === "assigned" ? "#004085" : "#6c757d"
                                  }}
                                >
                                  {assignmentStatus.charAt(0).toUpperCase() + assignmentStatus.slice(1)}
                                </span>
                              </div>
                              <div className="d-flex flex-wrap gap-2">
                                {serviceList.map((service, sIdx) => (
                                  <span key={sIdx}>
                                    <span
                                      style={{
                                        padding: '6px 12px',
                                        borderRadius: 4,
                                        fontSize: 13,
                                        fontWeight: 600,
                                        backgroundColor: '#d1fae5',
                                        color: '#065f46',
                                      }}
                                    >
                                      {service}
                                    </span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        return '--';
                      })()}
                    </div>
                  ))}
                </div>
              ) : (
                <span style={{ color: '#94a3b8' }}>No assignments yet</span>
              )}
            </div>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
};

export default StaffCompleteRequest;