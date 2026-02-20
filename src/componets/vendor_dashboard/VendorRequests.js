import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
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

const VendorRequests = ({ showCardOnly = false }) => {
  // Sidebar and device state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const { state } = useLocation(); // For dashboard card filter
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
  const { tokens, refreshAccessToken, logout, user } = useAuth();

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
    status: state?.filter ? state.filter.toLowerCase() : "",
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  // Filtered data - only show requests assigned to this vendor
  const filteredData = requestData
    .filter((request) => {
      // Check if request has an assignment for this vendor
      const vendorUniqueId = user?.uniqueId || tokens?.unique_id;
      if (Array.isArray(request.assignments) && vendorUniqueId) {
        return request.assignments.some(
          (a) => Array.isArray(a) && a[1] === vendorUniqueId && (a[3] === "assigned" || a[3] === "completed")
        );
      }
      return false;
    })
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
            .includes(filters.district.toLowerCase())) &&
        (!filters.status ||
          (() => {
            const vendorUniqueId = user?.uniqueId || tokens?.unique_id;
            if (Array.isArray(request.assignments) && vendorUniqueId) {
              for (const assignment of request.assignments) {
                if (Array.isArray(assignment) && assignment[1] === vendorUniqueId) {
                  return assignment[3]?.toLowerCase() === filters.status.toLowerCase();
                }
              }
            }
            return false;
          })())
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
        "Status",
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
      request.status,
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
      link.download = "VendorRequests.pdf";
      link.click();
    }
    setShowPdfModal(false);
    setPdfPreviewUrl(null);
  };

  const handleClosePdfModal = () => {
    setShowPdfModal(false);
    setPdfPreviewUrl(null);
  };

  // Handle status change
  const handleStatusChange = async (requestId, newStatus) => {
    if (!tokens?.access) return;
    try {
      const payload = {
        request_id: requestId,
        vendor_unique_id: user?.uniqueId || tokens?.unique_id,
        status: newStatus,
      };
      await axios.put(API_URL, payload, {
        headers: { Authorization: `Bearer ${tokens.access}` },
      });
      // Refresh data after successful update
      fetchRequests();
    } catch (error) {
      console.error("Status update error:", error.response?.data || error.message);
      alert("Failed to update status. Please try again.");
    }
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
      setCount(res.data.count || res.data.data?.length || 0);
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
          title="Number Of Requests"
        >
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
            <path
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              stroke="#6366f1"
              strokeWidth="2"
            />
          </svg>
        </div>
        <div className="dashboard-card-title">Total Requests</div>
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
          {/* Breadcrumb: Back to Dashboard */}
          <div style={{ width: '100%', borderBottom: '1px solid #e0e0e0', marginBottom: 8, padding: '2px 0', background: 'transparent', minHeight: 0, display: 'flex', alignItems: 'center' }}>
            <a href="/VendorDashBoard" style={{ fontSize: 'clamp(12px, 2vw, 15px)', color: '#1976d2', textDecoration: 'none', fontWeight: 500 }}>&larr; Back to Dashboard</a>
          </div>
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
                    }}
                  >
                    <h6
                      style={{
                        color: "#6366f1",
                        fontWeight: 700,
                        marginTop: 10,
                      }}
                    >
                      Total Requests
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
                  <Form.Select
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    style={{ maxWidth: 140, borderRadius: 8 }}
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="assigned">Assigned</option>
                    <option value="completed">Completed</option>
                  </Form.Select>
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
                id="vendor-requests-table-pdf"
              >
                <Table className="align-middle mb-0" style={{ minWidth: 900 }}>
                  <thead className="table-thead" style={{ background: "#f1f5f9" }}>
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
                      <th>Time</th>
                      <th>Status</th>
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
                        .map((request) => {
                          // Get vendor unique_id from AuthContext
                          const vendorUniqueId = user?.uniqueId || tokens?.unique_id;
                          let assignmentStatus = "Not Assigned";
                          
                          // Find status from assignments for this vendor
                          if (Array.isArray(request.assignments) && vendorUniqueId) {
                            for (const assignment of request.assignments) {
                              if (Array.isArray(assignment) && assignment[1] === vendorUniqueId) {
                                assignmentStatus = assignment[3] || "assigned";
                                break;
                              }
                            }
                          }
                          
                          return (
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
                              <td>{request.schedule_time}</td>
                              <td>
                                {assignmentStatus === "completed" ? (
                                  <span
                                    style={{
                                      padding: "4px 8px",
                                      borderRadius: 6,
                                      backgroundColor: "#dcfce7",
                                      color: "#166534",
                                      fontWeight: 600,
                                      fontSize: 12,
                                    }}
                                  >
                                    {assignmentStatus}
                                  </span>
                                ) : (
                                  <Form.Select
                                    value={assignmentStatus}
                                    onChange={(e) =>
                                      handleStatusChange(
                                        request.request_id,
                                        e.target.value
                                      )
                                    }
                                    size="sm"
                                    style={{
                                      borderRadius: 6,
                                      fontSize: 12,
                                      fontWeight: 600,
                                    }}
                                  >
                                    <option value="assigned">Assigned</option>
                                    <option value="completed">Completed</option>
                                  </Form.Select>
                                )}
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
                          );
                        })
                    ) : (
                      <tr>
                        <td colSpan="10" className="text-center py-4">
                          <p style={{ color: "#6b7280", fontSize: 16 }}>
                            No requests assigned to you
                          </p>
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
                            <strong>Assigned Services (to you):</strong>
                          </p>
                          <ul>
                            {(() => {
                              // Get vendor unique_id from AuthContext (following VendorProfile.js pattern)
                              const vendorUniqueId = user?.uniqueId || tokens?.unique_id;
                              const assignments = selectedRequest.assignments;
                              
                              if (Array.isArray(assignments) && vendorUniqueId) {
                                // Loop through assignments to find matching vendor
                                for (const assignment of assignments) {
                                  // assignment structure: [[services], vendor_id, vendor_name, status]
                                  if (Array.isArray(assignment) && assignment.length >= 2) {
                                    const services = Array.isArray(assignment[0]) ? assignment[0] : [];
                                    const assignedVendorId = assignment[1];
                                    
                                    if (assignedVendorId === vendorUniqueId) {
                                      return services.length > 0
                                        ? services.map((service, idx) => <li key={idx}>{service}</li>)
                                        : <li>No services in this assignment</li>;
                                    }
                                  }
                                }
                                return <li>No services assigned to you</li>;
                              }
                              return <li>Unable to retrieve vendor information</li>;
                            })()}
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
                            <strong>Assignment Status:</strong>{" "}
                            {(() => {
                              const vendorUniqueId = user?.uniqueId || tokens?.unique_id;
                              const assignments = selectedRequest.assignments;
                              
                              if (Array.isArray(assignments) && vendorUniqueId) {
                                for (const assignment of assignments) {
                                  if (Array.isArray(assignment) && assignment[1] === vendorUniqueId) {
                                    const assignmentStatus = assignment[3] || "assigned";
                                    return (
                                      <span
                                        style={{
                                          padding: "4px 12px",
                                          borderRadius: "6px",
                                          fontSize: "13px",
                                          fontWeight: 600,
                                          backgroundColor: assignmentStatus === "completed" ? 
                                            "#d4edda" : assignmentStatus === "assigned" ? 
                                            "#cfe2ff" : "#f8f9fa",
                                          color: assignmentStatus === "completed" ? 
                                            "#155724" : assignmentStatus === "assigned" ? 
                                            "#004085" : "#6c757d"
                                        }}
                                      >
                                        {assignmentStatus.charAt(0).toUpperCase() + assignmentStatus.slice(1)}
                                      </span>
                                    );
                                  }
                                }
                              }
                              return <span>Unable to retrieve status</span>;
                            })()}
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

export default VendorRequests;
