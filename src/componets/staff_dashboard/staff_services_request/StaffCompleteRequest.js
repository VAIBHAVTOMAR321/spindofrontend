import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Table, Button, Form, Modal } from "react-bootstrap";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

import "../../../assets/css/admindashboard.css";
import StaffLeftNav from "../StaffLeftNav";
import StaffHeader from "../StaffHeader";

const BASE_URL = "https://mahadevaaya.com/spindo/spindobackend";
const API_URL = `${BASE_URL}/api/customer/requestservices/`;
const COMPLETE_REQUEST_URL = `${BASE_URL}/api/assign-vendor/`;

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
  const [requestData, setRequestData] = useState([]);
  const [count, setCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Complete request state
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [vendorUniqueId, setVendorUniqueId] = useState("");
  const [completeLoading, setCompleteLoading] = useState(false);

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

  // Complete request function
  const completeRequest = async () => {
    if (!selectedRequest || !vendorUniqueId) return;
    
    setCompleteLoading(true);
    try {
      const res = await axios.post(
        COMPLETE_REQUEST_URL,
        {
          request_id: selectedRequest.request_id,
          vendor_unique_id: vendorUniqueId,
        },
        {
          headers: { Authorization: `Bearer ${tokens.access}` },
        }
      );

      if (res.data.success) {
        // Refresh the request data to show the updated status
        fetchRequestServices();
        setShowCompleteModal(false);
        setVendorUniqueId("");
        setSelectedRequest(null);
      }
    } catch (error) {
      console.error("COMPLETE ERROR:", error.response?.data || error.message);
    } finally {
      setCompleteLoading(false);
    }
  };

  // Handle complete modal open
  const handleCompleteRequest = (request) => {
    setSelectedRequest(request);
    setShowCompleteModal(true);
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
                      <th>Action</th>
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
                                backgroundColor: request.status === 'pending' ? '#fef3c7' : request.status === 'completed' ? '#d1fae5' : '#fef3c7',
                                color: request.status === 'pending' ? '#92400e' : request.status === 'completed' ? '#065f46' : '#92400e',
                              }}
                            >
                              {request.status?.charAt(0).toUpperCase() + request.status?.slice(1)}
                            </span>
                          </td>
                          <td>{new Date(request.created_at).toLocaleDateString()}</td>
                          <td>
                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={() => handleCompleteRequest(request)}
                              disabled={request.status === 'completed'}
                            >
                              {request.status === 'completed' ? 'Completed' : 'Complete Request'}
                            </Button>
                          </td>
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

          {/* Complete Request Modal */}
          <Modal
            show={showCompleteModal}
            onHide={() => setShowCompleteModal(false)}
            centered
            size="lg"
          >
            <Modal.Header closeButton>
              <Modal.Title style={{ color: '#6366f1', fontWeight: 700 }}>
                Complete Request {selectedRequest?.request_id}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontWeight: 600 }}>Vendor Unique ID</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter vendor unique ID (e.g., VENDOR-001)"
                    value={vendorUniqueId}
                    onChange={(e) => setVendorUniqueId(e.target.value)}
                    required
                  />
                  <Form.Text className="text-muted">
                    Please enter the unique vendor ID to mark this request as complete.
                  </Form.Text>
                </Form.Group>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="outline-secondary" onClick={() => setShowCompleteModal(false)}>
                Cancel
              </Button>
              <Button
                variant="success"
                onClick={completeRequest}
                disabled={completeLoading || !vendorUniqueId}
              >
                {completeLoading ? 'Completing...' : 'Complete Request'}
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
      </div>
    </>
  );
};

export default StaffCompleteRequest;
