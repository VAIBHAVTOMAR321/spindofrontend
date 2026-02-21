import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Table, Button, Form, Modal } from "react-bootstrap";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useAuth } from "../../context/AuthContext";
import AdminHeader from "../AdminHeader";
import AdminLeftNav from "../AdminLeftNav";
import "../../../assets/css/admindashboard.css";

const BASE_URL = "https://mahadevaaya.com/spindo/spindobackend";
const API_URL = `${BASE_URL}/api/solar-query/`;

const SolarQuery = ({ showCardOnly = false }) => {
  // Sidebar and device state
  const navigate = useNavigate();
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
  const [queryData, setQueryData] = useState([]);
  const [count, setCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter state
  const [filters, setFilters] = useState({
    full_name: '',
    email: '',
    mobile_number: '',
    address: '',
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
  const filteredData = queryData.filter(query =>
    (!filters.full_name || query.full_name?.toLowerCase().includes(filters.full_name.toLowerCase())) &&
    (!filters.email || query.email?.toLowerCase().includes(filters.email.toLowerCase())) &&
    (!filters.mobile_number || query.mobile_number?.includes(filters.mobile_number)) &&
    (!filters.address || query.address?.toLowerCase().includes(filters.address.toLowerCase()))
  );

  // Fetch solar queries
  const fetchSolarQueries = async () => {
    if (!tokens?.access) return;
    try {
      const res = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${tokens.access}` },
      });
      const data = Array.isArray(res.data) ? res.data : res.data.data || [];
      setQueryData(data);
      setCount(data.length || 0);
    } catch (error) {
      setQueryData([]);
      setCount(0);
      console.error("GET ERROR:", error.response?.data || error.message);
    }
  };

  useEffect(() => {
    fetchSolarQueries();
    // eslint-disable-next-line
  }, [tokens]);

  const handleDeleteQuery = async (id) => {
    if (!window.confirm("Are you sure you want to delete this query?")) return;
    
    try {
      await axios.delete(API_URL, {
        data: { id: id },
        headers: { Authorization: `Bearer ${tokens.access}` },
      });
      fetchSolarQueries();
      alert("Query deleted successfully!");
    } catch (error) {
      console.error("DELETE ERROR:", error.response?.data || error.message);
      alert("Failed to delete query");
    }
  };

  const handleViewPDF = () => {
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const headers = [["Query ID", "Full Name", "Email", "Mobile Number", "Address", "Created Date"]];
    const rows = filteredData.map(query => [
      query.query_id,
      query.full_name,
      query.email,
      query.mobile_number,
      query.address,
      new Date(query.created_at).toLocaleDateString(),
    ]);
    autoTable(pdf, {
      head: headers,
      body: rows,
      startY: 10,
      margin: { top: 10, right: 10, left: 10, bottom: 10 },
      theme: "grid",
      headStyles: { fillColor: [255, 152, 0], textColor: [255, 255, 255], fontStyle: "bold" },
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
      link.download = "SolarQueries.pdf";
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
        <div className="dashboard-card-icon solar-icon" title="Solar Queries">
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="5" stroke="#ff9800" strokeWidth="2"/>
            <line x1="12" y1="1" x2="12" y2="3" stroke="#ff9800" strokeWidth="2"/>
            <line x1="12" y1="21" x2="12" y2="23" stroke="#ff9800" strokeWidth="2"/>
          </svg>
        </div>
        <div className="dashboard-card-title">Solar Queries</div>
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
          <div className="p-3">
            <Button 
              variant="outline-secondary" 
              onClick={() => navigate('/AdminDashBoard')}
              className="me-2"
            >
              <i className="bi bi-arrow-left me-2"></i> Back to Dashboard
            </Button>
          </div>
          <Container fluid className="dashboard-body dashboard-main-container">
            <div className="p-3">
              {/* Modern Responsive Header Row */}
              <div
                className="mb-4 d-flex align-items-center justify-content-between gap-3 flex-wrap totalreg-header-row"
                style={{
                  background: 'linear-gradient(90deg, #ffe0b2 60%, #ffd699 100%)',
                  borderRadius: 18,
                  boxShadow: '0 2px 12px 0 rgba(255, 152, 0, 0.10)',
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
                      boxShadow: '0 2px 12px 0 rgba(255,152,0,0.10)',
                      border: '1px solid #e5e7eb',
                      background: '#fff',
                    }}
                  >
                    <h6 style={{ color: '#ff9800', fontWeight: 700, marginTop: 10 }}>Total Solar Queries</h6>
                    <h2 style={{ color: '#e65100', fontWeight: 800, marginBottom: 10 }}>{count}</h2>
                  </Card>
                </div>
              </div>

              {/* Filter Inputs */}
              <div className="mb-3">
                <Form className="d-flex flex-wrap gap-2">
                  <Form.Control
                    name="full_name"
                    value={filters.full_name}
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
                    name="mobile_number"
                    value={filters.mobile_number}
                    onChange={handleFilterChange}
                    placeholder="Filter Mobile"
                    style={{ maxWidth: 140, borderRadius: 8 }}
                  />
                  <Form.Control
                    name="address"
                    value={filters.address}
                    onChange={handleFilterChange}
                    placeholder="Filter Address"
                    style={{ maxWidth: 140, borderRadius: 8 }}
                  />
                </Form>
              </div>

              {/* PDF Button */}
              <div className="mb-3 d-flex justify-content-end">
                <Button style={{ borderRadius: 10, fontWeight: 600, background: '#ff9800', borderColor: '#ff9800' }} onClick={handleViewPDF}>
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
                  <thead style={{ background: '#ffe0b2' }}>
                    <tr style={{ fontWeight: 700, color: '#e65100', fontSize: 15 }}>
                      <th>Query ID</th>
                      <th>Full Name</th>
                      <th>Email</th>
                      <th>Mobile Number</th>
                      <th>Address</th>
                      <th>Created Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.length > 0 ? (
                      filteredData
                        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                        .map((query) => (
                        <tr key={query.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ fontWeight: 600, color: '#ff9800' }}>{query.query_id}</td>
                          <td>{query.full_name}</td>
                          <td>{query.email}</td>
                          <td>{query.mobile_number}</td>
                          <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {query.address}
                          </td>
                          <td>{new Date(query.created_at).toLocaleDateString()}</td>
                          <td>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeleteQuery(query.id)}
                              style={{ borderRadius: 4, fontSize: 12 }}
                            >
                              Delete
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center">No solar queries found</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
                {/* Pagination Controls */}
                <div className="d-flex justify-content-center align-items-center mt-3 gap-2">
                  <Button
                    style={{ minWidth: 80, borderColor: '#ff9800', color: '#ff9800' }}
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  >
                    Previous
                  </Button>
                  <span style={{ fontWeight: 600, fontSize: 15, color: '#e65100' }}>
                    Page {currentPage} of {Math.ceil(filteredData.length / itemsPerPage) || 1}
                  </span>
                  <Button
                    style={{ minWidth: 80, borderColor: '#ff9800', color: '#ff9800' }}
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

export default SolarQuery;
