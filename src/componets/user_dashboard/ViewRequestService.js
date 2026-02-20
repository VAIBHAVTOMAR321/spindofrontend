import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Container, Card, Table, Spinner, Alert, Row, Col, Badge, Form, Button, Modal } from "react-bootstrap";
import UserLeftNav from "../user_dashboard/UserLeftNav";
import UserHeader from "../user_dashboard/UserHeader";
import Footer from "../footer/Footer";
import { useAuth } from "../context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import "../../assets/css/admindashboard.css";

const statusColors = {
  pending: "warning",
  approved: "success",
  rejected: "danger"
};

const ViewRequestService = () => {
  const { user, tokens } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 10;
  // Filter state
  const [filters, setFilters] = useState({
    request_id: '',
    username: '',
    email: '',
    contact_number: '',
    alternate_contact_number: ''
  });

  // Filtered and paginated data
  const filteredRequests = (statusFilter === "all"
    ? requests
    : requests.filter(r => (r.status || "").toLowerCase() === statusFilter)
  ).filter(r =>
    (!filters.request_id || (r.request_id || '').toString().toLowerCase().includes(filters.request_id.toLowerCase())) &&
    (!filters.username || (r.username || '').toLowerCase().includes(filters.username.toLowerCase())) &&
    (!filters.email || (r.email || '').toLowerCase().includes(filters.email.toLowerCase())) &&
    (!filters.contact_number || (r.contact_number || '').toString().toLowerCase().includes(filters.contact_number.toLowerCase())) &&
    (!filters.alternate_contact_number || (r.alternate_contact_number || '').toString().toLowerCase().includes(filters.alternate_contact_number.toLowerCase()))
  );
  const totalPages = Math.ceil(filteredRequests.length / entriesPerPage);
  const paginatedRequests = filteredRequests.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);

  // PDF preview and download
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [showPdfModal, setShowPdfModal] = useState(false);

  const handleViewPDF = async () => {
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const headers = [["Request ID", "Name", "Email", "Contact", "Alternate Contact", "Address", "Service(s)", "Schedule", "Description", "Status"]];
    const rows = filteredRequests.map(req => [
      req.request_id,
      req.username,
      req.email,
      req.contact_number,
      req.alternate_contact_number || '-',
      req.address,
      Array.isArray(req.request_for_services) ? req.request_for_services.join(", ") : req.request_for_services,
      `${req.schedule_date} ${req.schedule_time}`,
      req.description,
      req.status
    ]);
    autoTable(pdf, {
      head: headers,
      body: rows,
      startY: 10,
      margin: { top: 10, right: 10, left: 10, bottom: 10 },
      theme: "grid",
      headStyles: { fillColor: [99, 102, 241], textColor: [255, 255, 255], fontStyle: "bold" },
      bodyStyles: { textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });
    const pdfBlob = pdf.output("blob");
    const url = URL.createObjectURL(pdfBlob);
    setPdfPreviewUrl(url);
    setShowPdfModal(true);
  };

  const handleDownloadPDF = () => {
    if (pdfPreviewUrl) {
      const link = document.createElement("a");
      link.href = pdfPreviewUrl;
      link.download = "ServiceRequests.pdf";
      link.click();
    }
    setShowPdfModal(false);
    setPdfPreviewUrl(null);
  };

  const handleClosePdfModal = () => {
    setShowPdfModal(false);
    setPdfPreviewUrl(null);
  };
    // Handle filter change
    const handleFilterChange = (e) => {
      const { name, value } = e.target;
      setFilters((prev) => ({ ...prev, [name]: value }));
      setCurrentPage(1);
    };
  const location = useLocation();

  // Set statusFilter from navigation state (e.g., from dashboard cards)
  useEffect(() => {
    if (location && location.state && location.state.filter) {
      const filter = location.state.filter.toLowerCase();
      if (["approved", "pending", "rejected"].includes(filter)) {
        setStatusFilter(filter);
      }
    }
    // eslint-disable-next-line
  }, [location.state]);

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
      <UserLeftNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} isMobile={isMobile} isTablet={isTablet} />
      <div className="main-content-dash">
        <UserHeader toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="p-3">
          <Button 
            variant="outline-secondary" 
            onClick={() => navigate('/UserDashBoard')}
            className="me-2"
          >
            <i className="bi bi-arrow-left me-2"></i> Back to Dashboard
          </Button>
        </div>
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
                      {/* Filters Row */}
                      <div className="mb-3 d-flex flex-wrap gap-2 align-items-center justify-content-between">
                        <Form className="d-flex flex-wrap gap-2">
                          <Form.Control
                            name="request_id"
                            value={filters.request_id}
                            onChange={handleFilterChange}
                            placeholder="Filter Request ID"
                            style={{ maxWidth: 140, borderRadius: 8 }}
                          />
                          <Form.Control
                            name="username"
                            value={filters.username}
                            onChange={handleFilterChange}
                            placeholder="Filter Name"
                            style={{ maxWidth: 140, borderRadius: 8 }}
                          />
                          <Form.Control
                            name="email"
                            value={filters.email}
                            onChange={handleFilterChange}
                            placeholder="Filter Email"
                            style={{ maxWidth: 140, borderRadius: 8 }}
                          />
                          <Form.Control
                            name="contact_number"
                            value={filters.contact_number}
                            onChange={handleFilterChange}
                            placeholder="Filter Contact"
                            style={{ maxWidth: 140, borderRadius: 8 }}
                          />
                          <Form.Control
                            name="alternate_contact_number"
                            value={filters.alternate_contact_number}
                            onChange={handleFilterChange}
                            placeholder="Filter Alternate Contact"
                            style={{ maxWidth: 140, borderRadius: 8 }}
                          />
                        </Form>
                        <div className="d-flex gap-2">
                          <Button variant="success" onClick={handleViewPDF} style={{ borderRadius: 10, fontWeight: 600 }}>
                            View Table as PDF
                          </Button>
                        </div>
                      </div>
                      {/* Status Filter and Pagination Info */}
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
                                            {/* PDF Preview Modal */}
                                            <Modal show={showPdfModal} onHide={handleClosePdfModal} size="lg" centered>
                                              <Modal.Header closeButton>
                                                <Modal.Title>PDF Preview</Modal.Title>
                                              </Modal.Header>
                                              <Modal.Body style={{ minHeight: 500 }}>
                                                {pdfPreviewUrl ? (
                                                  <iframe
                                                    src={pdfPreviewUrl}
                                                    title="PDF Preview"
                                                    width="100%"
                                                    height="500px"
                                                    style={{ border: "none" }}
                                                  />
                                                ) : (
                                                  <div>Loading PDF...</div>
                                                )}
                                              </Modal.Body>
                                              <Modal.Footer>
                                                <Button variant="primary" onClick={handleDownloadPDF}>
                                                  Download PDF
                                                </Button>
                                                <Button variant="secondary" onClick={handleClosePdfModal}>
                                                  Close
                                                </Button>
                                              </Modal.Footer>
                                            </Modal>
                      <div className="table-responsive">
                        <Table bordered hover className="align-middle text-center">
                        <thead className="table-thead">
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
      </div>
    </div>
  );
};

export default ViewRequestService;
