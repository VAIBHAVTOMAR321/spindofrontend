import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Table, Button, Form, Modal } from "react-bootstrap";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import VendorHeader from "./VendorHeader";
import VendorLeftNav from "./VendorLeftNav";
import "../../assets/css/admindashboard.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const BASE_URL = "https://mahadevaaya.com/spindo/spindobackend";
const API_URL = `${BASE_URL}/api/customer/requestservices/`;

const CompletedRequests = ({ showCardOnly = false }) => {
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
  const { tokens, refreshAccessToken, logout } = useAuth();

  // Data state
  const [requestData, setRequestData] = useState([]);
  const [count, setCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [formError, setFormError] = useState("");

  // Filter state
  const [filters, setFilters] = useState({
    request_id: "",
    username: "",
    contact_number: "",
    email: "",
    state: "",
    district: "",
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  // Filtered data - only show completed requests
  const filteredData = requestData
    .filter((request) => request.status === "completed")
    .filter(
      (request) =>
        (!filters.request_id ||
          request.request_id
            ?.toString()
            .toLowerCase()
            .includes(filters.request_id.toLowerCase())) &&
        (!filters.username ||
          request.username
            ?.toLowerCase()
            .includes(filters.username.toLowerCase())) &&
        (!filters.contact_number ||
          request.contact_number
            ?.toString()
            .includes(filters.contact_number)) &&
        (!filters.email ||
          request.email?.toLowerCase().includes(filters.email.toLowerCase())) &&
        (!filters.state ||
          request.state?.toLowerCase().includes(filters.state.toLowerCase())) &&
        (!filters.district ||
          request.district
            ?.toLowerCase()
            .includes(filters.district.toLowerCase()))
    );

  // Handle view details button click
  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setShowModal(true);
  };

  // PDF preview and download
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [showPdfModal, setShowPdfModal] = useState(false);

  const handleViewPDF = async () => {
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const headers = [
      [
        "Request ID",
        "Name",
        "Contact",
        "Email",
        "State",
        "District",
        "Schedule Date",
        "Completed On",
      ],
    ];
    const rows = filteredData.map((request) => [
      request.request_id,
      request.username,
      request.contact_number,
      request.email || "N/A",
      request.state,
      request.district,
      new Date(request.schedule_date).toLocaleDateString(),
      new Date(request.updated_at).toLocaleDateString(),
    ]);
    autoTable(pdf, {
      head: headers,
      body: rows,
      startY: 10,
      margin: { top: 10, right: 10, left: 10, bottom: 10 },
      theme: "grid",
      headStyles: {
        fillColor: [99, 102, 241],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      bodyStyles: { textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
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
      link.download = "CompletedRequests.pdf";
      link.click();
    }
    setShowPdfModal(false);
    setPdfPreviewUrl(null);
  };

  const handleClosePdfModal = () => {
    setShowPdfModal(false);
    setPdfPreviewUrl(null);
  };

  // Reset modal
  const resetForm = () => {
    setShowModal(false);
    setSelectedRequest(null);
    setFormError("");
  };

  // Fetch requests
  const fetchRequests = async () => {
    if (!tokens?.access) return;
    try {
      const res = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${tokens.access}` },
      });
      setRequestData(res.data.data || []);
      setCount(
        (res.data.data || []).filter((req) => req.status === "completed").length
      );
    } catch (error) {
      setRequestData([]);
      setCount(0);
      console.error("GET ERROR:", error.response?.data || error.message);
    }
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line
  }, [tokens]);

  if (showCardOnly) {
    return (
      <div className="dashboard-card">
        <div
          className="dashboard-card-icon user-icon"
          title="Number Of Completed Requests"
        >
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
            <path
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              stroke="#6366f1"
              strokeWidth="2"
            />
          </svg>
        </div>
        <div className="dashboard-card-title">Completed Requests</div>
        <div className="dashboard-card-value">{count}</div>
      </div>
    );
  }

  // Full page with table
  return (
    <>
      <div className="dashboard-container">
        {/* Left Sidebar */}
        <VendorLeftNav
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          isMobile={isMobile}
          isTablet={isTablet}
        />
        {/* Main Content */}
        <div className="main-content-dash">
          <VendorHeader toggleSidebar={toggleSidebar} />
          <Container fluid className="dashboard-body dashboard-main-container">
            <div className="p-3">
              {/* Modern Responsive Header Row */}
              <div
                className="mb-4 d-flex align-items-center justify-content-between gap-3 flex-wrap totalreg-header-row"
                style={{
                  background: "linear-gradient(90deg, #f8fafc 60%, #e0e7ff 100%)",
                  borderRadius: 18,
                  boxShadow: "0 2px 12px 0 rgba(60, 72, 88, 0.10)",
                  padding: "18px 12px",
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
                      boxShadow: "0 2px 12px 0 rgba(99,102,241,0.10)",
                      border: "1px solid #e5e7eb",
                      background: "#fff",
                      padding: "8px",
                    }}
                  >
                    <h6
                      style={{
                        color: "#6366f1",
                        fontWeight: 700,
                        marginTop: 10,

                      }}
                    >
                      Total Completed Requests
                    </h6>
                    <h2
                      style={{
                        color: "#1e293b",
                        fontWeight: 800,
                        marginBottom: 10,
                      }}
                    >
                      {count}
                    </h2>
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
                    placeholder="Filter Name"
                    style={{ maxWidth: 140, borderRadius: 8 }}
                  />
                  <Form.Control
                    name="contact_number"
                    value={filters.contact_number}
                    onChange={handleFilterChange}
                    placeholder="Filter Mobile"
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
                    name="state"
                    value={filters.state}
                    onChange={handleFilterChange}
                    placeholder="Filter State"
                    style={{ maxWidth: 140, borderRadius: 8 }}
                  />
                  <Form.Control
                    name="district"
                    value={filters.district}
                    onChange={handleFilterChange}
                    placeholder="Filter District"
                    style={{ maxWidth: 140, borderRadius: 8 }}
                  />
                </Form>
              </div>

              {/* PDF Download Button */}
              <div className="mb-3 d-flex justify-content-end">
                <Button
                  variant="success"
                  onClick={handleViewPDF}
                  style={{ borderRadius: 10, fontWeight: 600 }}
                >
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
              <div
                className="table-responsive rounded-4 shadow-sm"
                style={{
                  background: "#fff",
                  padding: "0.5rem 0.5rem 1rem 0.5rem",
                }}
                id="completed-requests-table-pdf"
              >
                <Table className="align-middle mb-0" style={{ minWidth: 900 }}>
                  <thead style={{ background: "#f1f5f9" }}>
                    <tr
                      style={{
                        fontWeight: 700,
                        color: "#6366f1",
                        fontSize: 15,
                      }}
                    >
                      <th>Request ID</th>
                      <th>Customer Name</th>
                      <th>Contact</th>
                      <th>Email</th>
                      <th>State</th>
                      <th>District</th>
                      <th>Schedule Date</th>
                      <th>Completed On</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.length > 0 ? (
                      filteredData
                        .slice(
                          (currentPage - 1) * itemsPerPage,
                          currentPage * itemsPerPage
                        )
                        .map((request) => (
                          <tr
                            key={request.id}
                            style={{ borderBottom: "1px solid #e5e7eb" }}
                          >
                            <td style={{ fontWeight: 500 }}>
                              {request.request_id}
                            </td>
                            <td>{request.username}</td>
                            <td>{request.contact_number}</td>
                            <td>{request.email || "N/A"}</td>
                            <td>{request.state}</td>
                            <td>{request.district}</td>
                            <td>
                              {new Date(
                                request.schedule_date
                              ).toLocaleDateString()}
                            </td>
                            <td>
                              {new Date(
                                request.updated_at
                              ).toLocaleDateString()}
                            </td>
                            <td>
                              <Button
                                size="sm"
                                variant="info"
                                onClick={() => handleViewDetails(request)}
                                style={{
                                  borderRadius: 8,
                                  fontWeight: 600,
                                }}
                              >
                                View
                              </Button>
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan="9" className="text-center py-4">
                          <p style={{ color: "#6b7280", fontSize: 16 }}>
                            No completed requests found
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>

                {/* Pagination Controls */}
                {filteredData.length > 0 && (
                  <div className="d-flex justify-content-center align-items-center mt-3 gap-2">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      style={{ minWidth: 80 }}
                    >
                      Previous
                    </Button>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>
                      Page {currentPage} of{" "}
                      {Math.ceil(filteredData.length / itemsPerPage) || 1}
                    </span>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      disabled={
                        currentPage ===
                          Math.ceil(filteredData.length / itemsPerPage) ||
                        filteredData.length === 0
                      }
                      onClick={() => setCurrentPage((prev) => prev + 1)}
                      style={{ minWidth: 80 }}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>

              {/* Details Modal */}
              <Modal show={showModal} onHide={resetForm} centered size="lg">
                <Modal.Header
                  closeButton
                  style={{
                    background: "#f1f5f9",
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  <Modal.Title style={{ fontWeight: 700, color: "#333" }}>
                    Request Details - {selectedRequest?.request_id}
                  </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ background: "#f8fafc" }}>
                  {selectedRequest && (
                    <div className="p-3">
                      <Row className="mb-3">
                        <Col md="6">
                          <h6 style={{ fontWeight: 700, color: "#6366f1" }}>
                            Customer Information
                          </h6>
                          <p>
                            <strong>Name:</strong> {selectedRequest.username}
                          </p>
                          <p>
                            <strong>Contact:</strong>{" "}
                            {selectedRequest.contact_number}
                          </p>
                          <p>
                            <strong>Alternate Contact:</strong>{" "}
                            {selectedRequest.alternate_contact_number || "N/A"}
                          </p>
                          <p>
                            <strong>Email:</strong>{" "}
                            {selectedRequest.email || "N/A"}
                          </p>
                          <p>
                            <strong>Unique ID:</strong>{" "}
                            {selectedRequest.unique_id}
                          </p>
                        </Col>
                        <Col md="6">
                          <h6 style={{ fontWeight: 700, color: "#6366f1" }}>
                            Location Information
                          </h6>
                          <p>
                            <strong>State:</strong> {selectedRequest.state}
                          </p>
                          <p>
                            <strong>District:</strong>{" "}
                            {selectedRequest.district}
                          </p>
                          <p>
                            <strong>Block:</strong> {selectedRequest.block}
                          </p>
                          <p>
                            <strong>Address:</strong> {selectedRequest.address}
                          </p>
                        </Col>
                      </Row>

                      <hr />

                      <Row className="mb-3">
                        <Col md="12">
                          <h6 style={{ fontWeight: 700, color: "#6366f1" }}>
                            Service Details
                          </h6>
                          <p>
                            <strong>Services Requested:</strong>
                          </p>
                          <ul>
                            {selectedRequest.request_for_services &&
                              selectedRequest.request_for_services.map(
                                (service, index) => (
                                  <li key={index}>{service}</li>
                                )
                              )}
                          </ul>
                          <p>
                            <strong>Description:</strong>{" "}
                            {selectedRequest.description}
                          </p>
                        </Col>
                      </Row>

                      <hr />

                      <Row className="mb-3">
                        <Col md="6">
                          <h6 style={{ fontWeight: 700, color: "#6366f1" }}>
                            Schedule Information
                          </h6>
                          <p>
                            <strong>Schedule Date:</strong>{" "}
                            {new Date(
                              selectedRequest.schedule_date
                            ).toLocaleDateString()}
                          </p>
                          <p>
                            <strong>Schedule Time:</strong>{" "}
                            {selectedRequest.schedule_time}
                          </p>
                        </Col>
                        <Col md="6">
                          <h6 style={{ fontWeight: 700, color: "#6366f1" }}>
                            Assignment Information
                          </h6>
                          <p>
                            <strong>Status:</strong> {selectedRequest.status}
                          </p>
                          <p>
                            <strong>Assigned To:</strong>{" "}
                            {selectedRequest.assigned_to_name || "N/A"}
                          </p>
                          <p>
                            <strong>Assigned By:</strong>{" "}
                            {selectedRequest.assigned_by_name || "N/A"}
                          </p>
                        </Col>
                      </Row>
                    </div>
                  )}
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="secondary" onClick={resetForm}>
                    Close
                  </Button>
                </Modal.Footer>
              </Modal>
            </div>
          </Container>
        </div>
      </div>
    </>
  );
};

export default CompletedRequests;
