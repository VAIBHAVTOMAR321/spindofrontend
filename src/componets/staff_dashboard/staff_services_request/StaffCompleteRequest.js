import React, { useState, useEffect } from "react";
import { Container, Card, Table, Spinner, Alert, Row, Col, Badge, Form, Button } from "react-bootstrap";

import Footer from "../../footer/Footer";
import { useAuth } from "../../context/AuthContext";
import "../../../assets/css/admindashboard.css";
import StaffHeader from "../StaffHeader";
import StaffLeftNav from "../StaffLeftNav";

const statusColors = {
  pending: "warning",
  approved: "success",
  rejected: "danger"
};

const StaffCompleteRequest = () => {
  const { user, tokens } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 10;
  // Filtered and paginated data
  const filteredRequests = statusFilter === "all"
    ? requests
    : requests.filter(r => (r.status || "").toLowerCase() === statusFilter);
  const totalPages = Math.ceil(filteredRequests.length / entriesPerPage);
  const paginatedRequests = filteredRequests.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);

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

  useEffect(() => {
    if (!user?.uniqueId) {
      setError("User not logged in or missing unique ID.");
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`https://mahadevaaya.com/spindo/spindobackend/api/customer/requestservices/?unique_id=${user.uniqueId}`, {
      headers: tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {}
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Server error: ${res.status} ${res.statusText}. Response: ${text}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.status && data.data) {
          setRequests(data.data);
        } else {
          setError(data.message || "No service requests found or failed to load service requests.");
        }
        setLoading(false);
      })
      .catch((err) => {
        setError("Could not fetch service requests. " + (err.message || "Please check your internet connection or try again later."));
        setLoading(false);
      });
  }, [user]);

  return (
    <div className="dashboard-container">
      <StaffLeftNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} isMobile={isMobile} isTablet={isTablet} />
      <div className="main-content-dash">
        <StaffHeader toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <Container fluid className="dashboard-body dashboard-main-container">
          <Row className="justify-content-center mt-4">
            <Col xs={12}>
              <Card className="animate__animated animate__fadeIn">
                <Card.Body>
                  <h3 className="mb-4 text-center" style={{ color: '#2b6777', fontWeight: 700, letterSpacing: 1 }}>My Service Requests</h3>
                  {loading && <div className="text-center"><Spinner animation="border" variant="primary" /></div>}
                  {error && <Alert variant="danger">{error}</Alert>}
                  {!loading && !error && (
                    <>
                      <div className="d-flex flex-wrap align-items-center justify-content-between mb-3">
                        <div>
                          <Form.Select
                            style={{ width: 200, display: 'inline-block' }}
                            value={statusFilter}
                            onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                          >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                          </Form.Select>
                        </div>
                        <div>
                          <span style={{ color: '#2b6777', fontWeight: 500 }}>
                            Showing {filteredRequests.length === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1}
                            -{Math.min(currentPage * entriesPerPage, filteredRequests.length)} of {filteredRequests.length}
                          </span>
                        </div>
                      </div>
                      <div className="table-responsive">
                        <Table bordered hover className="align-middle text-center">
                        <thead>
                          <tr style={{ background: 'linear-gradient(90deg, #2b6777 60%, #52ab98 100%)', color: '#fff', fontWeight: 600, fontSize: 16, letterSpacing: 1 }}>
                            <th style={{ borderRight: '1px solid #fff' }}>#</th>
                            <th style={{ borderRight: '1px solid #fff' }}>Request ID</th>
                            <th style={{ borderRight: '1px solid #fff' }}>Name</th>
                            <th style={{ borderRight: '1px solid #fff' }}>Email</th>
                            <th style={{ borderRight: '1px solid #fff' }}>Contact</th>
                            <th style={{ borderRight: '1px solid #fff' }}>Alternate Contact</th>
                            <th style={{ borderRight: '1px solid #fff' }}>Address</th>
                            <th style={{ borderRight: '1px solid #fff' }}>Service(s)</th>
                            <th style={{ borderRight: '1px solid #fff' }}>Schedule</th>
                            <th style={{ borderRight: '1px solid #fff' }}>Description</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedRequests.length === 0 ? (
                            <tr><td colSpan={10}>No service requests found.</td></tr>
                          ) : (
                            paginatedRequests.map((req, idx) => (
                              <tr key={req.id}>
                                <td>{(currentPage - 1) * entriesPerPage + idx + 1}</td>
                                <td>{req.request_id}</td>
                                <td>{req.username}</td>
                                <td>{req.email}</td>
                                <td>{req.contact_number}</td>
                                <td>{req.alternate_contact_number || '-'}</td>
                                <td>{req.address}</td>
                                <td>
                                  {Array.isArray(req.request_for_services) ? req.request_for_services.map((s, i) => (
                                    <Badge key={i} bg="info" className="me-1">{s}</Badge>
                                  )) : req.request_for_services}
                                </td>
                                <td>
                                  {req.schedule_date} <br />
                                  <span style={{ fontSize: 12 }}>{req.schedule_time}</span>
                                </td>
                                <td style={{ maxWidth: 200, whiteSpace: 'pre-line', wordBreak: 'break-word' }}>{req.description}</td>
                                <td>
                                  <Badge bg={statusColors[req.status?.toLowerCase()] || "secondary"} style={{ fontSize: 14, textTransform: 'capitalize' }}>{req.status}</Badge>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </Table>
                      </div>
                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                        <div className="d-flex justify-content-center align-items-center mt-3">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-2"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          >
                            Previous
                          </Button>
                          <span style={{ fontWeight: 500, color: '#2b6777' }}>Page {currentPage} of {totalPages}</span>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="ms-2"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          >
                            Next
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
        <Footer />
      </div>
    </div>
  );
};

export default StaffCompleteRequest;
