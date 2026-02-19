import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Table, Button, Form, Modal } from "react-bootstrap";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import VendorHeader from "./VendorHeader";
import VendorLeftNav from "./VendorLeftNav";
import "../../assets/css/admindashboard.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useLocation } from "react-router-dom";

const BASE_URL = "https://mahadevaaya.com/spindo/spindobackend";

const VendorAllBills = ({ showCardOnly = false }) => {
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
  const { tokens, user, refreshAccessToken, logout } = useAuth();

  // Data state
  const [billsData, setBillsData] = useState([]);
  const [count, setCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showModal, setShowModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [formError, setFormError] = useState("");

  // Filter state
  const { state } = useLocation(); // For dashboard card filter
  const [filters, setFilters] = useState({
    bill_id: "",
    customer_name: "",
    cust_mobile: "",
    service_type: "",
    payment_type: "",
    status: state?.filter ? state.filter : "",
  });
  const [cardFilter, setCardFilter] = useState(""); // Card click filter

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
    if (name === "status") setCardFilter(""); // Reset card filter if dropdown used
  };

  // Filtered data
  const filteredData = billsData.filter(
    (bill) =>
      (!filters.bill_id ||
        bill.bill_id
          ?.toString()
          .toLowerCase()
          .includes(filters.bill_id.toLowerCase())) &&
      (!filters.customer_name ||
        bill.customer_name
          ?.toLowerCase()
          .includes(filters.customer_name.toLowerCase())) &&
      (!filters.cust_mobile ||
        bill.cust_mobile
          ?.toString()
          .includes(filters.cust_mobile)) &&
      (!filters.service_type ||
        bill.service_type
          ?.toLowerCase()
          .includes(filters.service_type.toLowerCase())) &&
      (!filters.payment_type ||
        bill.payment_type
          ?.toLowerCase()
          .includes(filters.payment_type.toLowerCase())) &&
      (!filters.status ||
        (filters.status === "Paid" && bill.status?.toLowerCase() === "paid") ||
        (filters.status === "Unpaid" && bill.status?.toLowerCase() === "unpaid") ||
        (filters.status === ""))
  );

  // Handle view details button click
  const handleViewDetails = (bill) => {
    setSelectedBill(bill);
    setShowModal(true);
  };

  // PDF preview and download
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [showPdfModal, setShowPdfModal] = useState(false);

  const handleViewPDF = async () => {
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const headers = [
      [
        "Bill ID",
        "Customer",
        "Contact",
        "Service Type",
        "Amount",
        "GST",
        "Total",
        "Payment Type",
        "Status",
      ],
    ];
    const rows = filteredData.map((bill) => [
      bill.bill_id,
      bill.customer_name,
      bill.cust_mobile,
      bill.service_type,
      `₹${parseFloat(bill.amount).toFixed(2)}`,
      `₹${parseFloat(bill.gst).toFixed(2)}`,
      `₹${parseFloat(bill.total_payment).toFixed(2)}`,
      bill.payment_type,
      bill.status,
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
      link.download = "VendorBills.pdf";
      link.click();
    }
    setShowPdfModal(false);
    setPdfPreviewUrl(null);
  };

  const handleClosePdfModal = () => {
    setShowPdfModal(false);
    setPdfPreviewUrl(null);
  };

  // Download bill PDF from server
  const handleDownloadBillPDF = async (bill) => {
    if (bill.bill_pdf) {
      try {
        // Construct the full URL for the bill PDF
        const pdfUrl = bill.bill_pdf.startsWith("http")
          ? bill.bill_pdf
          : `${BASE_URL}${bill.bill_pdf}`;

        // Open PDF in new tab
        window.open(pdfUrl, "_blank");
      } catch (error) {
        console.error("Error opening bill PDF:", error);
        alert("Failed to open bill PDF");
      }
    }
  };

  // Reset modal
  const resetForm = () => {
    setShowModal(false);
    setSelectedBill(null);
    setFormError("");
  };

  // Fetch bills
  const fetchBills = async () => {
    if (!tokens?.access || !user?.uniqueId) return;
    try {
      const API_URL = `${BASE_URL}/api/billing/?vendor_id=${user.uniqueId}`;
      const res = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${tokens.access}` },
      });
      // console.log("[VendorAllBills] Bills response:", res.data); // Removed for production
      setBillsData(res.data.data || []);
      setCount(res.data.count || res.data.data?.length || 0);
    } catch (error) {
      setBillsData([]);
      setCount(0);
      console.error("[VendorAllBills] GET ERROR:", error.response?.data || error.message);
    }
  };

  useEffect(() => {
    fetchBills();
    // eslint-disable-next-line
  }, [tokens, user]);

  if (showCardOnly) {
    return (
      <div className="dashboard-card">
        <div
          className="dashboard-card-icon user-icon"
          title="Number Of Bills"
        >
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
            <path
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              stroke="#6366f1"
              strokeWidth="2"
            />
          </svg>
        </div>
        <div className="dashboard-card-title">Total Bills</div>
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
                      Total Bills
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
                    name="bill_id"
                    value={filters.bill_id}
                    onChange={handleFilterChange}
                    placeholder="Filter Bill ID"
                    style={{ maxWidth: 140, borderRadius: 8 }}
                  />
                  <Form.Control
                    name="customer_name"
                    value={filters.customer_name}
                    onChange={handleFilterChange}
                    placeholder="Filter Customer"
                    style={{ maxWidth: 140, borderRadius: 8 }}
                  />
                  <Form.Control
                    name="cust_mobile"
                    value={filters.cust_mobile}
                    onChange={handleFilterChange}
                    placeholder="Filter Contact"
                    style={{ maxWidth: 140, borderRadius: 8 }}
                  />
                  <Form.Control
                    name="service_type"
                    value={filters.service_type}
                    onChange={handleFilterChange}
                    placeholder="Filter Service"
                    style={{ maxWidth: 140, borderRadius: 8 }}
                  />
                  <Form.Control
                    name="payment_type"
                    value={filters.payment_type}
                    onChange={handleFilterChange}
                    placeholder="Filter Payment Type"
                    style={{ maxWidth: 140, borderRadius: 8 }}
                  />
                  <Form.Select
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    style={{ maxWidth: 140, borderRadius: 8 }}
                  >
                    <option value="">All Bills</option>
                    <option value="Paid">Paid</option>
                    <option value="Unpaid">Unpaid</option>
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
                id="vendor-bills-table-pdf"
              >
                <Table className="align-middle mb-0" style={{ minWidth: 1000 }}>
                  <thead className="table-thead" style={{ background: "#f1f5f9" }}>
                    <tr
                      style={{
                        fontWeight: 700,
                        color: "#6366f1",
                        fontSize: 15,
                      }}
                    >
                      <th>Bill ID</th>
                      <th>Customer Name</th>
                      <th>Contact</th>
                      <th>Service Type</th>
                      <th>Amount</th>
                      <th>GST</th>
                      <th>Total Payment</th>
                      <th>Payment Type</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData
                      .slice(
                        (currentPage - 1) * itemsPerPage,
                        currentPage * itemsPerPage
                      )
                      .map((bill) => (
                        <tr
                          key={bill.id}
                          style={{ borderBottom: "1px solid #e5e7eb" }}
                        >
                          <td style={{ fontWeight: 500 }}>{bill.bill_id}</td>
                          <td>{bill.customer_name}</td>
                          <td>{bill.cust_mobile}</td>
                          <td>{bill.service_type}</td>
                          <td>₹{parseFloat(bill.amount).toFixed(2)}</td>
                          <td>₹{parseFloat(bill.gst).toFixed(2)}</td>
                          <td style={{ fontWeight: 600, color: "#059669" }}>
                            ₹{parseFloat(bill.total_payment).toFixed(2)}
                          </td>
                          <td>
                            <span
                              style={{
                                padding: "4px 8px",
                                borderRadius: 6,
                                backgroundColor:
                                  bill.payment_type === "UPI"
                                    ? "#fce7f3"
                                    : "#c7d2fe",
                                color:
                                  bill.payment_type === "UPI"
                                    ? "#831843"
                                    : "#3730a3",
                                fontWeight: 600,
                                fontSize: 12,
                              }}
                            >
                              {bill.payment_type}
                            </span>
                          </td>
                          <td>
                            <span
                              style={{
                                padding: "4px 8px",
                                borderRadius: 6,
                                backgroundColor:
                                  bill.status === "Paid"
                                    ? "#dcfce7"
                                    : bill.status === "Pending"
                                    ? "#fef3c7"
                                    : "#fee2e2",
                                color:
                                  bill.status === "Paid"
                                    ? "#166534"
                                    : bill.status === "Pending"
                                    ? "#92400e"
                                    : "#991b1b",
                                fontWeight: 600,
                                fontSize: 12,
                              }}
                            >
                              {bill.status}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex gap-2">
                              <Button
                                size="sm"
                                variant="info"
                                onClick={() => handleViewDetails(bill)}
                                style={{
                                  borderRadius: 8,
                                  fontWeight: 600,
                                }}
                              >
                                View
                              </Button>
                              {bill.bill_pdf && (
                                <Button
                                  size="sm"
                                  variant="warning"
                                  onClick={() => handleDownloadBillPDF(bill)}
                                  style={{
                                    borderRadius: 8,
                                    fontWeight: 600,
                                  }}
                                >
                                  PDF
                                </Button>
                              )}
                            </div>
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
                    Bill Details - {selectedBill?.bill_id}
                  </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ background: "#f8fafc" }}>
                  {selectedBill && (
                    <div className="p-3">
                      <Row className="mb-3">
                        <Col md="6">
                          <h6 style={{ fontWeight: 700, color: "#6366f1" }}>
                            Customer Information
                          </h6>
                          <p>
                            <strong>Name:</strong> {selectedBill.customer_name}
                          </p>
                          <p>
                            <strong>Contact:</strong> {selectedBill.cust_mobile}
                          </p>
                          <p>
                            <strong>Payment ID:</strong> {selectedBill.payment_id}
                          </p>
                        </Col>
                        <Col md="6">
                          <h6 style={{ fontWeight: 700, color: "#6366f1" }}>
                            Bill Information
                          </h6>
                          <p>
                            <strong>Bill ID:</strong> {selectedBill.bill_id}
                          </p>
                          <p>
                            <strong>Bill Date:</strong>{" "}
                            {new Date(
                              selectedBill.bill_date_time
                            ).toLocaleDateString()}{" "}
                            {new Date(
                              selectedBill.bill_date_time
                            ).toLocaleTimeString()}
                          </p>
                          <p>
                            <strong>Status:</strong> {selectedBill.status}
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
                            <strong>Service Type:</strong>{" "}
                            {selectedBill.service_type}
                          </p>
                          <p>
                            <strong>Service Description:</strong>{" "}
                            {selectedBill.service_des}
                          </p>
                        </Col>
                      </Row>

                      <hr />

                      <Row className="mb-3">
                        <Col md="6">
                          <h6 style={{ fontWeight: 700, color: "#6366f1" }}>
                            Payment Information
                          </h6>
                          <p>
                            <strong>Payment Type:</strong>{" "}
                            {selectedBill.payment_type}
                          </p>
                          <p>
                            <strong>Amount:</strong> ₹
                            {parseFloat(selectedBill.amount).toFixed(2)}
                          </p>
                          <p>
                            <strong>GST (18%):</strong> ₹
                            {parseFloat(selectedBill.gst).toFixed(2)}
                          </p>
                        </Col>
                        <Col md="6">
                          <h6 style={{ fontWeight: 700, color: "#6366f1" }}>
                            Total Amount
                          </h6>
                          <p
                            style={{
                              fontSize: 24,
                              fontWeight: 800,
                              color: "#059669",
                              marginTop: 10,
                            }}
                          >
                            ₹{parseFloat(selectedBill.total_payment).toFixed(2)}
                          </p>
                        </Col>
                      </Row>

                      {selectedBill.bill_pdf && (
                        <Row className="mt-3">
                          <Col md="12">
                            <Button
                              variant="warning"
                              onClick={() => handleDownloadBillPDF(selectedBill)}
                              style={{
                                width: "100%",
                                fontWeight: 600,
                                borderRadius: 8,
                              }}
                            >
                              Download Bill PDF
                            </Button>
                          </Col>
                        </Row>
                      )}
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

export default VendorAllBills;
