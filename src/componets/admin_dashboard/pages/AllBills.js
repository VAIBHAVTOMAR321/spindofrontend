import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Table, Button, Form, Modal } from "react-bootstrap";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Import the common layout components
import AdminHeader from "../AdminHeader";
import AdminLeftNav from "../AdminLeftNav";
import "../../../assets/css/admindashboard.css";

// --- Constants for API ---
const BASE_URL = "https://mahadevaaya.com/spindo/spindobackend";
const API_URL = `${BASE_URL}/api/billing/`;

const AllBills = () => {
  // --- AdminDashBoard Structure & State ---
  // Check device width
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

  // --- AllBills Logic & State ---
  const { tokens } = useAuth();

  const [billsData, setBillsData] = useState([]);
  const [count, setCount] = useState(0);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter state
  const [filters, setFilters] = useState({
    bill_id: '',
    vendor_id: '',
    customer_name: '',
    cust_mobile: '',
    payment_id: '',
    service_type: ''
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  // Filtered data
  const filteredData = billsData.filter(bill =>
    (!filters.bill_id || bill.bill_id?.toString().toLowerCase().includes(filters.bill_id.toLowerCase())) &&
    (!filters.vendor_id || bill.vendor_id?.toString().toLowerCase().includes(filters.vendor_id.toLowerCase())) &&
    (!filters.customer_name || bill.customer_name?.toLowerCase().includes(filters.customer_name.toLowerCase())) &&
    (!filters.cust_mobile || bill.cust_mobile?.toString().toLowerCase().includes(filters.cust_mobile.toLowerCase())) &&
    (!filters.payment_id || bill.payment_id?.toString().toLowerCase().includes(filters.payment_id.toLowerCase())) &&
    (!filters.service_type || bill.service_type?.toLowerCase().includes(filters.service_type.toLowerCase()))
  );

  // PDF preview and download
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [showPdfModal, setShowPdfModal] = useState(false);

  const handleClosePdfModal = () => {
    setShowPdfModal(false);
    setPdfPreviewUrl(null);
  };

  const handleViewBillPDF = (billPdfUrl) => {
    if (billPdfUrl) {
      window.open(`${BASE_URL}${billPdfUrl}`, '_blank');
    }
  };

  const handleViewPDF = async () => {
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const headers = [["Bill ID", "Vendor ID", "Payment ID", "Customer Name", "Service Type", "Amount", "GST", "Total Payment", "Payment Type", "Status", "Date"]];
    const rows = filteredData.map(bill => [
      bill.bill_id,
      bill.vendor_id,
      bill.payment_id,
      bill.customer_name,
      bill.service_type,
      `Rs. ${parseFloat(bill.amount).toFixed(2)}`,
      `Rs. ${parseFloat(bill.gst).toFixed(2)}`,
      `Rs. ${parseFloat(bill.total_payment).toFixed(2)}`,
      bill.payment_type,
      bill.status,
      new Date(bill.bill_date_time).toLocaleDateString()
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
    const pdfUrl = URL.createObjectURL(pdfBlob);
    setPdfPreviewUrl(pdfUrl);
    setShowPdfModal(true);
  };

  // Fetch bills data
  const fetchBills = async () => {
    if (!tokens?.access) return;
    try {
      const res = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${tokens.access}` }
      });
      console.log("Bills Data:", res.data);
      const billsList = Array.isArray(res.data.data) ? res.data.data : (res.data.data ? [res.data.data] : []);
      setBillsData(billsList);
      setCount(billsList.length);
    } catch (error) {
      setBillsData([]);
      setCount(0);
      console.error("GET ERROR:", error.response?.data || error.message);
    }
  };

  useEffect(() => {
    fetchBills();
  }, [tokens]);

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
            {/* --- AllBills Content Starts Here --- */}
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
                    <h6 style={{ color: '#6366f1', fontWeight: 700, marginTop: 10 }}>Total Bills</h6>
                    <h2 style={{ color: '#1e293b', fontWeight: 800, marginBottom: 10 }}>{count}</h2>
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
                    name="vendor_id"
                    value={filters.vendor_id}
                    onChange={handleFilterChange}
                    placeholder="Filter Vendor ID"
                    style={{ maxWidth: 140, borderRadius: 8 }}
                  />
                  <Form.Control
                    name="payment_id"
                    value={filters.payment_id}
                    onChange={handleFilterChange}
                    placeholder="Filter Payment ID"
                    style={{ maxWidth: 140, borderRadius: 8 }}
                  />
                  <Form.Control
                    name="customer_name"
                    value={filters.customer_name}
                    onChange={handleFilterChange}
                    placeholder="Filter Customer Name"
                    style={{ maxWidth: 160, borderRadius: 8 }}
                  />
                  <Form.Control
                    name="cust_mobile"
                    value={filters.cust_mobile}
                    onChange={handleFilterChange}
                    placeholder="Filter Contact"
                    style={{ maxWidth: 130, borderRadius: 8 }}
                  />
                  <Form.Control
                    name="service_type"
                    value={filters.service_type}
                    onChange={handleFilterChange}
                    placeholder="Filter Service Type"
                    style={{ maxWidth: 150, borderRadius: 8 }}
                  />
                </Form>
              </div>

              {/* PDF Download Button */}
              <div className="mb-3 d-flex justify-content-end">
                <Button style={{ borderRadius: 10, fontWeight: 600, background: '#6366f1', borderColor: '#6366f1' }} onClick={handleViewPDF}>
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
                    <div className="text-center py-5">Generating PDF...</div>
                  )}
                </Modal.Body>
              </Modal>

              {/* Modern Table */}
              <div className="table-responsive rounded-4 shadow-sm" style={{ background: '#fff', padding: '0.5rem 0.5rem 1rem 0.5rem' }}>
                <Table className="align-middle mb-0" style={{ minWidth: 700 }}>
                  <thead className="table-thead" style={{ background: '#f1f5f9' }}>
                    <tr style={{ fontWeight: 700, color: '#6366f1', fontSize: 15 }}>
                      <th>Bill ID</th>
                      <th>Vendor ID</th>
                      <th>Payment ID</th>
                      <th>Customer Name</th>
                      <th>Contact</th>
                      <th>Service Type</th>
                      <th>Amount</th>
                      <th>GST</th>
                      <th>Total Payment</th>
                      <th>Payment Type</th>
                      <th>Status</th>
                      <th>Bill PDF</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData
                      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                      .map((bill) => (
                        <tr key={bill.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ fontWeight: 600, color: '#6366f1' }}>{bill.bill_id}</td>
                          <td>{bill.vendor_id}</td>
                          <td style={{ fontWeight: 600, color: '#6366f1' }}>{bill.payment_id}</td>
                          <td>{bill.customer_name}</td>
                          <td>{bill.cust_mobile}</td>
                          <td>{bill.service_type}</td>
                          <td>Rs. {parseFloat(bill.amount).toFixed(2)}</td>
                          <td>Rs. {parseFloat(bill.gst).toFixed(2)}</td>
                          <td style={{ fontWeight: 600 }}>Rs. {parseFloat(bill.total_payment).toFixed(2)}</td>
                          <td>
                            <span style={{
                              padding: '4px 12px',
                              borderRadius: 6,
                              fontSize: 13,
                              fontWeight: 600,
                              backgroundColor: bill.payment_type === 'UPI' ? '#dbeafe' : bill.payment_type === 'Cash' ? '#fef3c7' : '#d1fae5',
                              color: bill.payment_type === 'UPI' ? '#0369a1' : bill.payment_type === 'Cash' ? '#92400e' : '#065f46',
                            }}>
                              {bill.payment_type}
                            </span>
                          </td>
                          <td>
                            <span style={{
                              padding: '4px 12px',
                              borderRadius: 6,
                              fontSize: 13,
                              fontWeight: 600,
                              backgroundColor: bill.status === 'Paid' ? '#d1fae5' : '#fef3c7',
                              color: bill.status === 'Paid' ? '#065f46' : '#92400e',
                            }}>
                              {bill.status}
                            </span>
                          </td>
                          <td>
                            {bill.bill_pdf ? (
                              <Button
                                variant="info"
                                size="sm"
                                onClick={() => handleViewBillPDF(bill.bill_pdf)}
                                style={{
                                  backgroundColor: '#3b82f6',
                                  borderColor: '#3b82f6',
                                  borderRadius: 6,
                                  fontWeight: 600,
                                  fontSize: 12
                                }}
                              >
                                View PDF
                              </Button>
                            ) : (
                              <span style={{ color: '#999', fontSize: 12 }}>N/A</span>
                            )}
                          </td>
                          <td>{new Date(bill.bill_date_time).toLocaleDateString()}</td>
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
                    Page {currentPage} of {Math.ceil(filteredData.length / itemsPerPage) || 1}
                  </span>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    disabled={currentPage === Math.ceil(filteredData.length / itemsPerPage) || filteredData.length === 0}
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

export default AllBills;
