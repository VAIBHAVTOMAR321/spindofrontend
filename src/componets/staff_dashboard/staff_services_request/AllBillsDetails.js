import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Spinner, Alert, Table, Button, Modal, Form } from "react-bootstrap";

import "../../../assets/css/admindashboard.css";
import { useAuth } from "../../context/AuthContext";

import StaffLeftNav from "../StaffLeftNav";
import StaffHeader from "../StaffHeader";

const AllBillsDetails = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bills, setBills] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const billsPerPage = 10;
  const { user, tokens } = useAuth();

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
    // Fetch all bills for this staff user
    const apiUrl = `https://mahadevaaya.com/spindo/spindobackend/api/billing/`;
    fetch(apiUrl, {
      headers: tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {}
    })
      .then((res) => res.json())
      .then((data) => {
        // Check if data is an array or has data property
        if (Array.isArray(data)) {
          setBills(data);
        } else if (data.status && Array.isArray(data.data)) {
          setBills(data.data);
        } else {
          // If single object is returned, wrap in array
          setBills([data]);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Error fetching bills.");
        setLoading(false);
      });
  }, [user, tokens]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleView = (bill) => {
    setSelectedBill(bill);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedBill(null);
  };

  // Handle search
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // Filtered and paginated bills - only search filter
  const filteredBills = bills.filter(bill => {
    // Apply search filter
    return searchQuery === '' || 
      Object.values(bill).some(value => 
        value && value.toString().toLowerCase().includes(searchQuery.toLowerCase())
      );
  });
  
  const totalPages = Math.ceil(filteredBills.length / billsPerPage);
  const paginatedBills = filteredBills.slice((currentPage - 1) * billsPerPage, currentPage * billsPerPage);

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Format date time for display
  const formatDateTime = (dateTime) => {
    if (!dateTime) return '-';
    try {
      const date = new Date(dateTime);
      return date.toLocaleString();
    } catch (e) {
      return dateTime;
    }
  };

  // Format currency with proper null checks
  const formatCurrency = (value) => {
    if (value === null || value === undefined || value === '') return '-';
    return `₹${parseFloat(value).toFixed(2)}`;
  };

  // Calculate total from bill_items if amount is null
  const calculateTotalFromItems = (billItems) => {
    if (!billItems || !Array.isArray(billItems)) return 0;
    return billItems.reduce((total, item) => {
      const itemTotal = parseFloat(item[4]) || 0; // Total is at index 4
      return total + itemTotal;
    }, 0);
  };

  // Format bill items for display in table
  const formatBillItems = (billItems) => {
    if (!billItems || !Array.isArray(billItems) || billItems.length === 0) {
      return '-';
    }
    
    // If only one item, display it
    if (billItems.length === 1) {
      const item = billItems[0];
      return `${item[0]} - ${item[1]}`;
    }
    
    // If multiple items, show first one with count
    const firstItem = billItems[0];
    return `${firstItem[0]} - ${firstItem[1]} (+${billItems.length - 1} more)`;
  };

  return (
    <div className="dashboard-container">
      <StaffLeftNav
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isMobile={isMobile}
        isTablet={isTablet}
      />
      <div className="main-content-dash">
        <StaffHeader toggleSidebar={toggleSidebar} />
        <Container fluid className="dashboard-body dashboard-main-container">
          <Row className="justify-content-center mt-4">
            <Col xs={12} lg={12}>
              <Card className="shadow-lg border-0 rounded-4 p-3 animate__animated animate__fadeIn" style={{ backgroundColor: "#f8f9fa" }}>
                <Card.Body>
                  <div className="text-center mb-4">
                    <h3 style={{ color: "#2b6777", fontWeight: 700, marginBottom: "0.5rem" }}>
                      <i className="bi bi-receipt" style={{ marginRight: "10px" }}></i>
                      All Bills
                    </h3>
                    <p style={{ color: "#6c757d", fontSize: "14px" }}>View all bills and their payment status.</p>
                  </div>
                  {loading && (
                    <div className="text-center"><Spinner animation="border" variant="primary" /></div>
                  )}
                  {error && (
                    <Alert variant="danger">{error}</Alert>
                  )}
                  {!loading && !error && (
                    <>
                      {/* Search Control */}
                      <div className="d-flex justify-content-start mb-3">
                        <div className="d-flex align-items-center">
                          <label className="me-2 fw-semibold" htmlFor="bill-search">Search:</label>
                          <Form.Control
                            type="text"
                            id="bill-search"
                            placeholder="Search all fields..."
                            value={searchQuery}
                            onChange={handleSearch}
                            style={{ width: '300px' }}
                          />
                        </div>
                      </div>
                      <div className="table-responsive">
                        <Table responsive bordered hover className="rounded-4 shadow-sm">
                          <thead className="table-thead">
                            <tr>
                              <th>#</th>
                              <th>Bill ID</th>
                              <th>Payment ID</th>
                              <th>Customer Name</th>
                              <th>Service Type</th>
                              <th>Bill Items</th>
                              <th>Amount</th>
                              <th>Total Payment</th>
                              <th>Status</th>
                              <th>Date</th>
                              <th>View</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedBills.length === 0 ? (
                              <tr>
                                <td colSpan={11} className="text-center">No bills found.</td>
                              </tr>
                            ) : (
                              paginatedBills.map((bill, idx) => {
                                // Calculate total from bill_items if total_payment is null
                                const totalPayment = bill.total_payment !== null ? 
                                  parseFloat(bill.total_payment) : 
                                  calculateTotalFromItems(bill.bill_items);
                                
                                return (
                                  <tr key={bill.id || idx}>
                                    <td>{(currentPage - 1) * billsPerPage + idx + 1}</td>
                                    <td>{bill.bill_id}</td>
                                    <td>{bill.payment_id || '-'}</td>
                                    <td>{bill.customer_name}</td>
                                    <td>{bill.service_type || '-'}</td>
                                    <td>
                                      <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {formatBillItems(bill.bill_items)}
                                      </div>
                                    </td>
                                    <td>{formatCurrency(bill.amount)}</td>
                                    <td>{formatCurrency(totalPayment)}</td>
                                    <td>
                                      <span style={{ fontWeight: 600, color: bill.status === 'Paid' ? '#52ab98' : bill.status === 'Unpaid' ? '#e53935' : '#2b6777' }}>
                                        {bill.status || 'Pending'}
                                      </span>
                                    </td>
                                    <td>{formatDateTime(bill.bill_date_time)}</td>
                                    <td>
                                      <Button variant="outline-primary" size="sm" onClick={() => handleView(bill)}>
                                        <i className="bi bi-eye"></i> View
                                      </Button>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </Table>
                      </div>
                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="d-flex justify-content-center align-items-center mt-3">
                          <nav>
                            <ul className="pagination mb-0">
                              <li className={`page-item${currentPage === 1 ? ' disabled' : ''}`}>
                                <button className="page-link" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>&laquo;</button>
                              </li>
                              {Array.from({ length: totalPages }, (_, i) => (
                                <li key={i + 1} className={`page-item${currentPage === i + 1 ? ' active' : ''}`}>
                                  <button className="page-link" onClick={() => handlePageChange(i + 1)}>{i + 1}</button>
                                </li>
                              ))}
                              <li className={`page-item${currentPage === totalPages ? ' disabled' : ''}`}>
                                <button className="page-link" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>&raquo;</button>
                              </li>
                            </ul>
                          </nav>
                        </div>
                      )}
                    </>
                  )}
                  {/* Modal for bill details */}
                  <Modal show={showModal} onHide={handleCloseModal} centered size="lg">
                    <Modal.Header closeButton>
                      <Modal.Title>Bill Details</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                       {selectedBill && (
                        <div>
                          <Row>
                            <Col md={6}>
                              <p><strong>Bill ID:</strong> {selectedBill.bill_id}</p>
                              <p><strong>Payment ID:</strong> {selectedBill.payment_id || '-'}</p>
                              <p><strong>Customer Name:</strong> {selectedBill.customer_name}</p>
                              <p><strong>Customer Mobile:</strong> {selectedBill.cust_mobile || '-'}</p>
                              <p><strong>Service Type:</strong> {selectedBill.service_type || '-'}</p>
                              <p><strong>Service Description:</strong> {selectedBill.service_des || '-'}</p>
                            </Col>
                            <Col md={6}>
                              <p><strong>Amount:</strong> {formatCurrency(selectedBill.amount)}</p>
                              <p><strong>GST:</strong> {formatCurrency(selectedBill.gst)}</p>
                              <p><strong>Total Payment:</strong> {formatCurrency(
                                selectedBill.total_payment !== null ? 
                                  selectedBill.total_payment : 
                                  calculateTotalFromItems(selectedBill.bill_items)
                              )}</p>
                              <p><strong>Payment Type:</strong> {selectedBill.payment_type || '-'}</p>
                              <p><strong>Status:</strong> <span style={{ fontWeight: 600, color: selectedBill.status === 'Paid' ? '#52ab98' : selectedBill.status === 'Unpaid' ? '#e53935' : '#2b6777' }}>{selectedBill.status || 'Pending'}</span></p>
                            </Col>
                          </Row>
                          
                          {/* Bill Items */}
                          {selectedBill.bill_items && selectedBill.bill_items.length > 0 && (
                            <Row className="mt-4">
                              <Col md={12}>
                                <h5 style={{ color: "#2b6777", fontWeight: 600, marginBottom: "1rem" }}>
                                  <i className="bi bi-list-check me-2"></i>Bill Items
                                </h5>
                                <Table responsive bordered size="sm" className="mb-3">
                                  <thead className="table-thead">
                                    <tr>
                                      <th>Category</th>
                                      <th>Description</th>
                                      <th>Amount</th>
                                      <th>GST</th>
                                      <th>Total</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {selectedBill.bill_items.map((item, index) => (
                                      <tr key={index}>
                                        <td>{item[0] || '-'}</td>
                                        <td>{item[1] || '-'}</td>
                                        <td>{formatCurrency(item[2])}</td>
                                        <td>{formatCurrency(item[3])}</td>
                                        <td>{formatCurrency(item[4])}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </Table>
                              </Col>
                            </Row>
                          )}

                          <Row>
                            <Col md={12}>
                              <p><strong>Bill Date & Time:</strong> {formatDateTime(selectedBill.bill_date_time)}</p>
                              {selectedBill.bill_pdf && (
                                <div className="mt-3">
                                  <Button 
                                    variant="primary" 
                                    href={
                                      selectedBill.bill_pdf.startsWith("http")
                                        ? selectedBill.bill_pdf
                                        : `https://mahadevaaya.com/spindo/spindobackend${selectedBill.bill_pdf}`
                                    }
                                    target="_blank"
                                  >
                                    <i className="bi bi-file-earmark-pdf"></i> View Bill PDF
                                  </Button>
                                </div>
                              )}
                            </Col>
                          </Row>
                        </div>
                      )}
                    </Modal.Body>
                  </Modal>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  );
};

export default AllBillsDetails;