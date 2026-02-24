import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Spinner, Alert, Table, Button, Modal } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import "../../../assets/css/admindashboard.css";
import { useAuth } from "../../context/AuthContext";

import StaffLeftNav from "../StaffLeftNav";
import StaffHeader from "../StaffHeader";

const AllBillsDetails = () => {
  // Result Modal state for success/error messages
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultType, setResultType] = useState(""); // 'success' or 'error'
  const [resultMessage, setResultMessage] = useState("");
  const navigate = useNavigate();
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
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [billPdf, setBillPdf] = useState(null);
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
    const apiUrl = `https://mahadevaaya.com/spindo/spindobackend/api/billing/`;
    fetch(apiUrl, {
      headers: tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {}
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setBills(data);
        } else if (data.status && Array.isArray(data.data)) {
          setBills(data.data);
        } else {
          setBills([data]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching bills:", err);
        setError("Error fetching bills.");
        setLoading(false);
      });
  }, [user, tokens]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Construct full PDF URL
  const constructPdfUrl = (billPdfPath) => {
    if (!billPdfPath) return null;
    if (billPdfPath.startsWith("http")) return billPdfPath;
    return `https://mahadevaaya.com/spindo/spindobackend${billPdfPath}`;
  };

  const handleView = async (bill) => {
    setLoadingDetails(true);
    try {
      const invoiceNo = bill.invoice_no?.[0] || "";
      const response = await fetch(`https://mahadevaaya.com/spindo/spindobackend/api/billing/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {})
        }
      });
      const data = await response.json();
      
      // Find the specific bill with matching invoice number
      let foundBill = bill;
      if (Array.isArray(data)) {
        const matchedBill = data.find(b => b.invoice_no?.[0] === invoiceNo);
        if (matchedBill) foundBill = matchedBill;
      } else if (data.status && Array.isArray(data.data)) {
        const matchedBill = data.data.find(b => b.invoice_no?.[0] === invoiceNo);
        if (matchedBill) foundBill = matchedBill;
      }
      
      setSelectedBill(foundBill);
      if (foundBill.bill_pdf) setBillPdf(constructPdfUrl(foundBill.bill_pdf));
      setShowModal(true);
    } catch (err) {
      console.error("Error fetching bill details:", err);
      setResultType("error");
      setResultMessage("Error loading bill details. Please try again");
      setShowResultModal(true);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedBill(null);
    setBillPdf(null);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const filteredBills = bills.filter(bill => {
    if (searchQuery === '') return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      bill.invoice_no?.[0]?.toLowerCase().includes(searchLower) ||
      bill.address_1?.[0]?.toLowerCase().includes(searchLower) ||
      bill.mode_of_pay?.toLowerCase().includes(searchLower)
    );
  });

  const totalPages = Math.ceil(filteredBills.length / billsPerPage);
  const paginatedBills = filteredBills.slice((currentPage - 1) * billsPerPage, currentPage * billsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const calculateTotals = (bill) => {
    if (!bill.bill_item || !Array.isArray(bill.bill_item)) {
      return { amount: "0.00", gst: "0.00", igst: "0.00", grand_total: "0.00" };
    }

    let totalAmount = 0, totalGST = 0, totalIGST = 0;
    
    bill.bill_item.forEach(item => {
      if (Array.isArray(item) && item.length >= 10) {
        // Format: [item_name, hsn, qty, rate, amount, gst%, gst_amount, igst%, igst_amount, unit]
        totalAmount += parseFloat(item[4]) || 0;
        totalGST += parseFloat(item[6]) || 0;
        totalIGST += parseFloat(item[8]) || 0;
      }
    });

    const grandTotal = totalAmount + totalGST + totalIGST;

    return {
      amount: totalAmount.toFixed(2),
      gst: totalGST.toFixed(2),
      igst: totalIGST.toFixed(2),
      grand_total: grandTotal.toFixed(2)
    };
  };

  return (
    <div className="dashboard-container">
      <StaffLeftNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} isMobile={isMobile} isTablet={isTablet} />
      <div className="main-content-dash">
        <StaffHeader toggleSidebar={toggleSidebar} />
        <Container fluid className="dashboard-body dashboard-main-container">
          <Row className="mt-4">
            <Col xs={12}>
              <div className="mb-4">
                <h3 style={{ color: "#2b6777", fontWeight: 700 }}>
                  <i className="bi bi-file-earmark-pdf me-2"></i>All Invoices
                </h3>
              </div>

              {error && <Alert variant="danger" onClose={() => setError("")} dismissible>{error}</Alert>}

              {loading ? (
                <div className="text-center">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-3">Loading invoices...</p>
                </div>
              ) : (
                <>
                  <Card className="mb-4">
                    <Card.Body>
                      <input
                        type="text"
                        placeholder="Search by Invoice Number, Address, or Payment Mode..."
                        value={searchQuery}
                        onChange={handleSearch}
                        className="form-control"
                        style={{ borderColor: "#52ab98" }}
                      />
                    </Card.Body>
                  </Card>

                  {paginatedBills.length === 0 ? (
                    <Alert variant="info">No invoices found.</Alert>
                  ) : (
                    <>
                      <div className="table-responsive rounded-4 shadow-sm" style={{ background: "#fff", padding: "0.5rem" }}>
                        <Table className="align-middle mb-0" style={{ minWidth: 700 }}>
                          <thead className="table-thead" style={{ background: "#f1f5f9" }}>
                            <tr style={{ fontWeight: 700, color: "#2b6777", fontSize: 15 }}>
                              <th>Invoice No</th>
                              <th>Address</th>
                              <th>Inv. Date</th>
                              <th>Payment Mode</th>
                              <th>Amount</th>
                              <th>GST/IGST</th>
                              <th>Grand Total</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedBills.map((bill, index) => {
                              const totals = calculateTotals(bill);
                              const invoiceNo = bill.invoice_no?.join("-") || "N/A";
                              const address = bill.address_1?.[0] || "N/A";
                              const invDate = bill.dated_date ? new Date(bill.dated_date).toLocaleDateString() : "N/A";
                              const paymentMode = bill.mode_of_pay || "N/A";

                              return (
                                <tr key={index} style={{ borderBottom: "1px solid #e5e7eb" }}>
                                  <td style={{ fontWeight: 600, color: "#2b6777" }}>{invoiceNo}</td>
                                  <td>{address}</td>
                                  <td>{invDate}</td>
                                  <td>
                                    <span style={{
                                      padding: "4px 12px",
                                      borderRadius: 6,
                                      fontSize: 13,
                                      fontWeight: 600,
                                      backgroundColor: "#dbeafe",
                                      color: "#0369a1"
                                    }}>
                                      {paymentMode}
                                    </span>
                                  </td>
                                  <td style={{ fontWeight: 600 }}>₹{totals.amount}</td>
                                  <td>₹{parseFloat(totals.gst) + parseFloat(totals.igst)}</td>
                                  <td style={{ fontWeight: 700, color: "#2b6777" }}>₹{totals.grand_total}</td>
                                  <td>
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      onClick={() => handleView(bill)}
                                      style={{
                                        backgroundColor: "#2b6777",
                                        borderColor: "#2b6777",
                                        borderRadius: 6,
                                        fontWeight: 600,
                                        fontSize: 12
                                      }}
                                    >
                                      View Details
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </Table>
                      </div>

                      {/* Pagination */}
                      <div className="d-flex justify-content-center align-items-center mt-3 gap-2">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          disabled={currentPage === 1}
                          onClick={() => handlePageChange(currentPage - 1)}
                          style={{ minWidth: 80 }}
                        >
                          Previous
                        </Button>
                        <span style={{ fontWeight: 600, fontSize: 15 }}>
                          Page {currentPage} of {totalPages || 1}
                        </span>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          disabled={currentPage === totalPages || totalPages === 0}
                          onClick={() => handlePageChange(currentPage + 1)}
                          style={{ minWidth: 80 }}
                        >
                          Next
                        </Button>
                      </div>
                    </>
                  )}
                </>
              )}
            </Col>
          </Row>

          {/* Result Modal */}
          <Modal show={showResultModal} onHide={() => setShowResultModal(false)} centered>
            <Modal.Header closeButton>
              <Modal.Title>
                {resultType === "success" ? (
                  <span style={{ color: "#28a745" }}>
                    <i className="bi bi-check-circle me-2"></i>Success
                  </span>
                ) : (
                  <span style={{ color: "#dc3545" }}>
                    <i className="bi bi-exclamation-circle me-2"></i>Error
                  </span>
                )}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div style={{ padding: "20px 0", textAlign: "center" }}>
                {resultType === "success" ? (
                  <div>
                    <div style={{ fontSize: "48px", color: "#28a745", marginBottom: "15px" }}>
                      <i className="bi bi-check-circle"></i>
                    </div>
                    <p style={{ fontSize: "16px", color: "#333" }}>
                      {resultMessage}
                    </p>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: "48px", color: "#dc3545", marginBottom: "15px" }}>
                      <i className="bi bi-exclamation-circle"></i>
                    </div>
                    <p style={{ fontSize: "16px", color: "#333" }}>
                      {resultMessage}
                    </p>
                  </div>
                )}
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant={resultType === "success" ? "success" : "danger"}
                onClick={() => setShowResultModal(false)}
              >
                {resultType === "success" ? "Continue" : "Close"}
              </Button>
            </Modal.Footer>
          </Modal>

          {/* Invoice Details Modal */}
          <Modal show={showModal} onHide={handleCloseModal} size="xl" centered>
            <Modal.Header closeButton>
              <Modal.Title style={{ color: "#ffffff", fontWeight: 700 }}>Invoice Details</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ maxHeight: "70vh", overflowY: "auto" }}>
              {loadingDetails ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-3">Loading invoice details...</p>
                </div>
              ) : (
                selectedBill && (
                  <div style={{ backgroundColor: "#fff", padding: "20px", border: "1px solid #ddd", borderRadius: "8px" }}>
                    {/* Bill PDF View */}
                    {billPdf && (
                      <div className="mb-4" style={{ backgroundColor: "#f8f9fa", padding: "15px", borderRadius: "8px", border: "1px solid #dee2e6" }}>
                        <h6 style={{ color: "#2b6777", fontWeight: 700, marginBottom: "10px" }}>
                          <i className="bi bi-file-pdf me-2"></i>Bill PDF
                        </h6>
                        <iframe
                          src={billPdf}
                          title="Bill PDF"
                          width="100%"
                          height="300px"
                          style={{ border: "1px solid #dee2e6", borderRadius: "4px" }}
                        />
                        <a href={billPdf} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary mt-2">
                          <i className="bi bi-download me-1"></i>Download PDF
                        </a>
                      </div>
                    )}

                     {/* Seller Address & Invoice Info */}
                    <Row className="mb-4">
                      <Col md={6}>
                        <Card style={{ backgroundColor: "#f0f9ff", border: "1px solid #2b6777" }}>
                          <Card.Body>
                            <h6 style={{ color: "#2b6777", fontWeight: 700, marginBottom: "10px" }}>
                              <i className="bi bi-geo-alt me-2"></i>Seller Address
                            </h6>
                            <p style={{ fontSize: "13px", marginBottom: "5px" }}><strong>Name:</strong> {selectedBill.address_1?.[0] || "N/A"}</p>
                            <p style={{ fontSize: "13px", marginBottom: "5px" }}><strong>Address:</strong> {Array.isArray(selectedBill.address_1?.[1]) ? selectedBill.address_1[1].join(", ") : selectedBill.address_1?.[1] || "N/A"}</p>
                            <p style={{ fontSize: "13px", marginBottom: "5px" }}><strong>GSTIN:</strong> {selectedBill.address_1?.[2] || "N/A"}</p>
                            <p style={{ fontSize: "13px", marginBottom: "5px" }}><strong>Phone:</strong> {Array.isArray(selectedBill.address_1?.[3]) ? selectedBill.address_1[3].join(", ") : selectedBill.address_1?.[3] || "N/A"}</p>
                            <p style={{ fontSize: "13px" }}><strong>Email:</strong> {selectedBill.address_1?.[4] || "N/A"}</p>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={6}>
                        <Card style={{ backgroundColor: "#f0f9ff", border: "1px solid #2b6777" }}>
                          <Card.Body>
                            <h6 style={{ color: "#2b6777", fontWeight: 700, marginBottom: "10px" }}>
                              <i className="bi bi-file-text me-2"></i>Invoice Information
                            </h6>
                            <p style={{ fontSize: "13px", marginBottom: "5px" }}><strong>Invoice No:</strong> {selectedBill.invoice_no?.join("-") || "N/A"}</p>
                            <p style={{ fontSize: "13px", marginBottom: "5px" }}><strong>Invoice Date:</strong> {selectedBill.dated_date ? new Date(selectedBill.dated_date).toLocaleDateString() : "N/A"}</p>
                            <p style={{ fontSize: "13px" }}><strong>Payment Mode:</strong> {selectedBill.mode_of_pay || "N/A"}</p>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>
                    
                    {/* Ship To Address */}
                    <Row className="mb-4">
                      <Col md={6}>
                        <Card style={{ backgroundColor: "#fff5e6", border: "1px solid #ffa500" }}>
                          <Card.Body>
                            <h6 style={{ color: "#ff8c00", fontWeight: 700, marginBottom: "10px" }}>
                              <i className="bi bi-truck me-2"></i>Ship To Address
                            </h6>
                            <p style={{ fontSize: "13px", marginBottom: "5px" }}><strong>Name:</strong> {selectedBill.address_2?.[0] || "N/A"}</p>
                            <p style={{ fontSize: "13px", marginBottom: "5px" }}><strong>Address:</strong> {Array.isArray(selectedBill.address_2?.[1]) ? selectedBill.address_2[1].join(", ") : selectedBill.address_2?.[1] || "N/A"}</p>
                            <p style={{ fontSize: "13px", marginBottom: "5px" }}><strong>GSTIN:</strong> {selectedBill.address_2?.[2] || "N/A"}</p>
                            <p style={{ fontSize: "13px", marginBottom: "5px" }}><strong>State:</strong> {selectedBill.address_2?.[3] || "N/A"}</p>
                            <p style={{ fontSize: "13px" }}><strong>State Code:</strong> {selectedBill.address_2?.[4] || "N/A"}</p>
                          </Card.Body>
                        </Card>
                      </Col>
                      
                      {/* Bill To Address */}
                      <Col md={6}>
                        <Card style={{ backgroundColor: "#e6f3ff", border: "1px solid #0369a1" }}>
                          <Card.Body>
                            <h6 style={{ color: "#0369a1", fontWeight: 700, marginBottom: "10px" }}>
                              <i className="bi bi-building me-2"></i>Bill To Address
                            </h6>
                            <p style={{ fontSize: "13px", marginBottom: "5px" }}><strong>Name:</strong> {selectedBill.address_3?.[0] || "N/A"}</p>
                            <p style={{ fontSize: "13px", marginBottom: "5px" }}><strong>Address:</strong> {Array.isArray(selectedBill.address_3?.[1]) ? selectedBill.address_3[1].join(", ") : selectedBill.address_3?.[1] || "N/A"}</p>
                            <p style={{ fontSize: "13px", marginBottom: "5px" }}><strong>GSTIN:</strong> {selectedBill.address_3?.[2] || "N/A"}</p>
                            <p style={{ fontSize: "13px", marginBottom: "5px" }}><strong>State:</strong> {selectedBill.address_3?.[3] || "N/A"}</p>
                            <p style={{ fontSize: "13px" }}><strong>State Code:</strong> {selectedBill.address_3?.[4] || "N/A"}</p>
                          </Card.Body>
                        </Card>
                       </Col>
                     </Row>

                    {/* Additional Details */}
                    <Row className="mb-4">
                      <Col md={6}>
                        <Card style={{ backgroundColor: "#fff5e6", border: "1px solid #ffa500" }}>
                          <Card.Body>
                            <h6 style={{ color: "#ff8c00", fontWeight: 700, marginBottom: "10px" }}>
                              <i className="bi bi-truck me-2"></i>Delivery Information
                            </h6>
                            <p style={{ fontSize: "13px", marginBottom: "5px" }}><strong>Delivery Note:</strong> {selectedBill.delv_note || "N/A"}</p>
                            <p style={{ fontSize: "13px", marginBottom: "5px" }}><strong>Delivery Date:</strong> {selectedBill.del_note_date ? new Date(selectedBill.del_note_date).toLocaleDateString() : "N/A"}</p>
                            <p style={{ fontSize: "13px" }}><strong>Dispatch Doc No:</strong> {selectedBill.dispatch_doc_no || "N/A"}</p>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={6}>
                        <Card style={{ backgroundColor: "#e6f3ff", border: "1px solid #0369a1" }}>
                          <Card.Body>
                            <h6 style={{ color: "#0369a1", fontWeight: 700, marginBottom: "10px" }}>
                              <i className="bi bi-receipt me-2"></i>Reference Information
                            </h6>
                            <p style={{ fontSize: "13px", marginBottom: "5px" }}><strong>Ref No Date:</strong> {selectedBill.ref_no_date ? new Date(selectedBill.ref_no_date).toLocaleDateString() : "N/A"}</p>
                            <p style={{ fontSize: "13px", marginBottom: "5px" }}><strong>Buyer's Order No:</strong> {selectedBill.buyer_ord_no || "N/A"}</p>
                            <p style={{ fontSize: "13px" }}><strong>Other Reference:</strong> {selectedBill.other_ref || "N/A"}</p>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>

                    {/* Line Items */}
                    <h6 style={{ color: "#2b6777", fontWeight: 700, marginTop: "20px", marginBottom: "15px" }}>
                      <i className="bi bi-list-check me-2"></i>Line Items
                    </h6>
                    <div className="table-responsive mb-4">
                      <Table bordered size="sm">
                        <thead style={{ backgroundColor: "#e8f4f8" }}>
                          <tr style={{ fontWeight: 700, color: "#2b6777" }}>
                            <th>Item Name</th>
                            <th>HSN</th>
                            <th>Qty</th>
                            <th>Rate</th>
                            <th>Amount</th>
                            <th>GST %</th>
                            <th>GST Amt</th>
                            <th>IGST %</th>
                            <th>IGST Amt</th>
                            <th>Unit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedBill.bill_item && Array.isArray(selectedBill.bill_item) ? (
                            selectedBill.bill_item.map((item, idx) => (
                              <tr key={idx} style={{ fontSize: "13px" }}>
                                <td>{Array.isArray(item) ? item[0] : item.item_name}</td>
                                <td>{Array.isArray(item) ? item[1] : item.hsn}</td>
                                <td>{Array.isArray(item) ? item[2] : item.qty}</td>
                                <td>₹{Array.isArray(item) ? item[3] : item.rate}</td>
                                <td>₹{Array.isArray(item) ? item[4] : item.amount}</td>
                                <td>{Array.isArray(item) ? item[5] : item.gst_percentage}%</td>
                                <td>₹{Array.isArray(item) ? item[6] : item.gst_amount}</td>
                                <td>{Array.isArray(item) ? item[7] : item.igst_percentage}%</td>
                                <td>₹{Array.isArray(item) ? item[8] : item.igst_amount}</td>
                                <td>{Array.isArray(item) ? item[9] : item.unit}</td>
                              </tr>
                            ))
                          ) : (
                            <tr><td colSpan="10" className="text-center">No items</td></tr>
                          )}
                        </tbody>
                      </Table>
                    </div>

                    {/* Totals */}
                    {(() => {
                      const totals = calculateTotals(selectedBill);
                      return (
                        <Row className="mb-4">
                          <Col md={{ span: 6, offset: 6 }}>
                            <Card style={{ backgroundColor: "#e8f4f8", border: "2px solid #2b6777" }}>
                              <Card.Body>
                                <Row className="mb-2">
                                  <Col xs={8}><strong>Subtotal:</strong></Col>
                                  <Col xs={4} className="text-end">₹{totals.amount}</Col>
                                </Row>
                                <Row className="mb-2">
                                  <Col xs={8}><strong>SGST/CGST:</strong></Col>
                                  <Col xs={4} className="text-end">₹{totals.gst}</Col>
                                </Row>
                                <Row className="mb-2">
                                  <Col xs={8}><strong>IGST:</strong></Col>
                                  <Col xs={4} className="text-end">₹{totals.igst}</Col>
                                </Row>
                                <Row style={{ borderTop: "2px solid #2b6777", paddingTop: "10px" }}>
                                  <Col xs={8}><strong style={{ fontSize: "16px" }}>Grand Total:</strong></Col>
                                  <Col xs={4} className="text-end" style={{ fontSize: "16px", fontWeight: "bold", color: "#2b6777" }}>₹{totals.grand_total}</Col>
                                </Row>
                              </Card.Body>
                            </Card>
                          </Col>
                        </Row>
                      );
                    })()}

                    {/* Bank Details */}
                    {selectedBill.bank_detail && selectedBill.bank_detail.length > 0 && (
                      <>
                        <h6 style={{ color: "#2b6777", fontWeight: 700, marginTop: "20px", marginBottom: "15px" }}>
                          <i className="bi bi-bank me-2"></i>Bank Details
                        </h6>
                        <div style={{ backgroundColor: "#f8f9fa", padding: "15px", borderRadius: "6px", marginBottom: "20px", border: "1px solid #dee2e6" }}>
                          {selectedBill.bank_detail.map((detail, idx) => (
                            <p key={idx} style={{ margin: "8px 0", fontSize: "13px" }}>{detail}</p>
                          ))}
                        </div>
                      </>
                    )}

                    {/* Amount in Words & Signature */}
                    <Row>
                      <Col md={6}>
                        <Card style={{ backgroundColor: "#f0f9ff", border: "1px solid #2b6777" }}>
                          <Card.Body>
                            <h6 style={{ color: "#2b6777", fontWeight: 700, marginBottom: "10px" }}>
                              <i className="bi bi-type me-2"></i>Amount in Words
                            </h6>
                            <p style={{ fontSize: "13px" }}>{selectedBill.amount_in_words || "N/A"}</p>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={6}>
                        <Card style={{ backgroundColor: "#f0f9ff", border: "1px solid #2b6777" }}>
                          <Card.Body>
                            <h6 style={{ color: "#2b6777", fontWeight: 700, marginBottom: "10px" }}>
                              <i className="bi bi-pen me-2"></i>Authorized Signatory
                            </h6>
                            <p style={{ fontSize: "13px" }}>{selectedBill.authorized_name || "N/A"}</p>
                          </Card.Body>
                        </Card>
                      </Col>
                     </Row>
                    </div>
                  )
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleCloseModal}>
                Close
              </Button>
            </Modal.Footer>
          </Modal>
        </Container>
      </div>
    </div>
  );
};

export default AllBillsDetails;
