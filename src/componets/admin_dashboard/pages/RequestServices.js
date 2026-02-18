import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Table, Button, Form, Modal } from "react-bootstrap";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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

  // Filter state
  const [filters, setFilters] = useState({
    request_id: '',
    username: '',
    contact_number: '',
    state: '',
    district: '',
    schedule_date: '',
    assigned_to_name: '',
    assigned_by_name: '',
    status: ''
  });

  // PDF preview state
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [showPdfModal, setShowPdfModal] = useState(false);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  // Filtered data
  const filteredData = requestData.filter(request =>
    (!filters.request_id || request.request_id?.toString().includes(filters.request_id)) &&
    (!filters.username || request.username?.toLowerCase().includes(filters.username.toLowerCase())) &&
    (!filters.contact_number || request.contact_number?.includes(filters.contact_number)) &&
    (!filters.state || request.state?.toLowerCase().includes(filters.state.toLowerCase())) &&
    (!filters.district || request.district?.toLowerCase().includes(filters.district.toLowerCase())) &&
    (!filters.schedule_date || request.schedule_date?.includes(filters.schedule_date)) &&
    (!filters.assigned_to_name || request.assigned_to_name?.toLowerCase().includes(filters.assigned_to_name.toLowerCase())) &&
    (!filters.assigned_by_name || request.assigned_by_name?.toLowerCase().includes(filters.assigned_by_name.toLowerCase())) &&
    (!filters.status || request.status?.toLowerCase() === filters.status.toLowerCase())
  );

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

  const handleViewPDF = () => {
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const headers = [["Request ID", "Username", "Contact", "State", "District", "Schedule Date", "Assigned To", "Assigned By", "Status"]];
    const rows = filteredData.map(request => [
      request.request_id,
      request.username,
      request.contact_number,
      request.state,
      request.district,
      new Date(request.schedule_date).toLocaleDateString(),
      request.assigned_to_name || '--',
      request.assigned_by_name || '--',
      request.status
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
      link.download = "RequestServices.pdf";
      link.click();
    }
    setShowPdfModal(false);
    setPdfPreviewUrl(null);
  };

  const handleClosePdfModal = () => {
    setShowPdfModal(false);
    setPdfPreviewUrl(null);
  };

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
                  background: 'linear-gradient(90deg, #fef3c7 60%, #fed7aa 100%)',
                  borderRadius: 18,
                  boxShadow: '0 2px 12px 0 rgba(217, 119, 6, 0.10)',
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
                    <h6 style={{ color: '#d97706', fontWeight: 700, marginTop: 10 }}>Total Requests</h6>
                    <h2 style={{ color: '#92400e', fontWeight: 800, marginBottom: 10 }}>{count}</h2>
                  </Card>
                </div>
              </div>

              {/* Filter Inputs */}
              <div className="mb-3">
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
                    placeholder="Filter Username"
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
                    name="state"
                    value={filters.state}
                    onChange={handleFilterChange}
                    placeholder="Filter State"
                    style={{ maxWidth: 120, borderRadius: 8 }}
                  />
                  <Form.Control
                    name="district"
                    value={filters.district}
                    onChange={handleFilterChange}
                    placeholder="Filter District"
                    style={{ maxWidth: 130, borderRadius: 8 }}
                  />
                  <Form.Control
                    name="assigned_to_name"
                    value={filters.assigned_to_name}
                    onChange={handleFilterChange}
                    placeholder="Filter Assigned To"
                    style={{ maxWidth: 140, borderRadius: 8 }}
                  />
                  <Form.Control
                    name="assigned_by_name"
                    value={filters.assigned_by_name}
                    onChange={handleFilterChange}
                    placeholder="Filter Assigned By"
                    style={{ maxWidth: 140, borderRadius: 8 }}
                  />
                  <Form.Select
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    style={{ maxWidth: 140, borderRadius: 8 }}
                  >
                    <option value="">All Status</option>
                    <option value="assigned">Assigned</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="cancelled">Cancelled</option>
                  </Form.Select>
                </Form>
              </div>

              {/* PDF Button */}
              <div className="mb-3 d-flex justify-content-end">
                <Button style={{ borderRadius: 10, fontWeight: 600, background: '#d97706', borderColor: '#d97706' }} onClick={handleViewPDF}>
                  View Table as PDF
                </Button>
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

              {/* Modern Table */}
              <div className="table-responsive rounded-4 shadow-sm" style={{ background: '#fff', padding: '0.5rem 0.5rem 1rem 0.5rem' }}>
                <Table className="align-middle mb-0" style={{ minWidth: 700 }}>
                  <thead style={{ background: '#fef3c7' }}>
                    <tr style={{ fontWeight: 700, color: '#92400e', fontSize: 15 }}>
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
                    {filteredData.length > 0 ? (
                      filteredData
                        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                        .map((request) => (
                        <tr key={request.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ fontWeight: 600, color: '#d97706' }}>{request.request_id}</td>
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
                      ))
                    ) : (
                      <tr>
                        <td colSpan="11" className="text-center">No requests found</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
                {/* Pagination Controls */}
                <div className="d-flex justify-content-center align-items-center mt-3 gap-2">
                  <Button
                    style={{ minWidth: 80, borderColor: '#d97706', color: '#d97706' }}
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  >
                    Previous
                  </Button>
                  <span style={{ fontWeight: 600, fontSize: 15, color: '#92400e' }}>
                    Page {currentPage} of {Math.ceil(filteredData.length / itemsPerPage) || 1}
                  </span>
                  <Button
                    style={{ minWidth: 80, borderColor: '#d97706', color: '#d97706' }}
                    variant="outline"
                    size="sm"
                    disabled={currentPage === Math.ceil(filteredData.length / itemsPerPage) || filteredData.length === 0}
                    onClick={() => setCurrentPage((prev) => prev + 1)}
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
