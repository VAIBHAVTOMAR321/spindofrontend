import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Spinner, Alert, Table, Button, Modal, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import "../../../assets/css/admindashboard.css";
import { useAuth } from "../../context/AuthContext";

import StaffLeftNav from "../StaffLeftNav";
import StaffHeader from "../StaffHeader";

const AllBillsDetails = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bills, setBills] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [selectedBillItems, setSelectedBillItems] = useState(null);
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
        // Debug: Log the API response
        console.log("API Response:", data);
        
        // Check if data is an array or has data property
        if (Array.isArray(data)) {
          // Debug: Log first bill to check structure
          if (data.length > 0) {
            console.log("First bill structure:", data[0]);
            console.log("Bill items structure:", data[0].bill_items);
          }
          setBills(data);
        } else if (data.status && Array.isArray(data.data)) {
          // Debug: Log first bill to check structure
          if (data.data.length > 0) {
            console.log("First bill structure:", data.data[0]);
            console.log("Bill items structure:", data.data[0].bill_items);
          }
          setBills(data.data);
        } else {
          // If single object is returned, wrap in array
          console.log("Single bill structure:", data);
          console.log("Bill items structure:", data.bill_items);
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

  const handleView = (bill) => {
    setSelectedBill(bill);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedBill(null);
  };

  const handleViewItems = (bill) => {
    setSelectedBillItems(bill);
    setShowItemsModal(true);
  };

  const handleCloseItemsModal = () => {
    setShowItemsModal(false);
    setSelectedBillItems(null);
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
    if (value === null || value === undefined || value === '' || isNaN(parseFloat(value))) return '₹0.00';
    return `₹${parseFloat(value).toFixed(2)}`;
  };

  // Calculate total from bill_items if amount is null
  const calculateTotalFromItems = (billItems) => {
    if (!billItems || !Array.isArray(billItems)) return 0;
    return billItems.reduce((total, item) => {
      let itemTotal = 0;
      let amount = 0;
      let gstAmount = 0;
      
      if (Array.isArray(item)) {
        // Check if item has total at index 4
        if (item.length > 4) {
          const storedTotal = parseFloat(item[4]);
          if (!isNaN(storedTotal)) {
            itemTotal = storedTotal;
          } else {
            // Calculate total if stored total is invalid
            amount = parseFloat(item[2]) || 0;
            const gstValue = parseFloat(item[3]) || 0;
            
            if (gstValue > 0 && gstValue <= 100) {
              gstAmount = (amount * gstValue) / 100;
            } else if (gstValue > 100) {
              gstAmount = gstValue;
            }
            
            itemTotal = amount + gstAmount;
          }
        } else if (item.length > 3) {
          // Calculate total from amount and GST
          amount = parseFloat(item[2]) || 0;
          const gstValue = parseFloat(item[3]) || 0;
          
          if (gstValue > 0 && gstValue <= 100) {
            gstAmount = (amount * gstValue) / 100;
          } else if (gstValue > 100) {
            gstAmount = gstValue;
          }
          
          itemTotal = amount + gstAmount;
        }
      } else if (typeof item === 'object' && item !== null) {
        // If item has total property, use it
        const storedTotal = parseFloat(item.total) || parseFloat(item.Total);
        if (!isNaN(storedTotal)) {
          itemTotal = storedTotal;
        } else {
          // Calculate total from amount and GST
          amount = parseFloat(item.amount) || parseFloat(item.Amount) || 0;
          const gstValue = parseFloat(item.gst) || parseFloat(item.GST) || parseFloat(item.tax) || 0;
          
          if (gstValue > 0 && gstValue <= 100) {
            gstAmount = (amount * gstValue) / 100;
          } else if (gstValue > 100) {
            gstAmount = gstValue;
          }
          
          itemTotal = amount + gstAmount;
        }
      }
      
      return total + itemTotal;
    }, 0);
  };

  // Calculate GST percentage from bill_items
  const calculateGSTPercentageFromItems = (billItems) => {
    if (!billItems || !Array.isArray(billItems)) {
      return 0;
    }
    
    // Get unique GST percentage from items (assuming all items have same GST)
    let gstPercentage = 0;
    
    for (let index = 0; index < billItems.length; index++) {
      const item = billItems[index];
      
      if (Array.isArray(item)) {
        // Check if index 3 contains GST (could be amount or percentage)
        if (item.length > 3) {
          const gstValue = parseFloat(item[3]) || 0;
          // Determine if it's a percentage (typically 0-100) 
          if (gstValue > 0 && gstValue <= 100) {
            gstPercentage = gstValue;
            break; // Use first valid GST percentage
          }
        }
      } else if (typeof item === 'object' && item !== null) {
        // Check if item has GST (could be amount or percentage)
        const gstValue = parseFloat(item.gst) || parseFloat(item.GST) || parseFloat(item.tax) || 0;
        // Determine if it's a percentage (typically 0-100) 
        if (gstValue > 0 && gstValue <= 100) {
          gstPercentage = gstValue;
          break; // Use first valid GST percentage
        }
      }
    }
    
    return gstPercentage;
  };

  // Calculate GST from bill_items - Enhanced version with better logging
  const calculateGSTFromItems = (billItems) => {
    if (!billItems || !Array.isArray(billItems)) {
      console.log("GST: No bill items or not an array");
      return 0;
    }
    
    console.log("GST: Processing bill items:", billItems);
    
    const totalGST = billItems.reduce((total, item, index) => {
      let gstAmount = 0;
      let amount = 0;
      
      if (Array.isArray(item)) {
        // Get amount from index 2
        if (item.length > 2) {
          amount = parseFloat(item[2]) || 0;
        }
        
        // Check if index 3 contains GST (could be amount or percentage)
        if (item.length > 3) {
          const gstValue = parseFloat(item[3]) || 0;
          console.log(`GST Item ${index}: Array format, amount=${amount}, gstValue=${gstValue}`);
          
          // Determine if it's a percentage (typically 0-100) or amount
          if (gstValue > 0 && gstValue <= 100) {
            // It's a percentage, calculate GST amount
            gstAmount = (amount * gstValue) / 100;
            console.log(`GST Item ${index}: Calculated as percentage (${gstValue}%) = ${gstAmount}`);
          } else if (gstValue > 100) {
            // It's already an amount (greater than 100 implies rupees)
            gstAmount = gstValue;
            console.log(`GST Item ${index}: Treated as fixed amount = ${gstAmount}`);
          } else {
            console.log(`GST Item ${index}: Invalid GST value (${gstValue})`);
          }
        }
      } else if (typeof item === 'object' && item !== null) {
        // Get amount from object
        amount = parseFloat(item.amount) || parseFloat(item.Amount) || 0;
        
        // Check if item has GST (could be amount or percentage)
        const gstValue = parseFloat(item.gst) || parseFloat(item.GST) || parseFloat(item.tax) || 0;
        console.log(`GST Item ${index}: Object format, amount=${amount}, gstValue=${gstValue}`);
        
        // Determine if it's a percentage (typically 0-100) or amount
        if (gstValue > 0 && gstValue <= 100) {
          // It's a percentage, calculate GST amount
          gstAmount = (amount * gstValue) / 100;
          console.log(`GST Item ${index}: Calculated as percentage (${gstValue}%) = ${gstAmount}`);
        } else if (gstValue > 100) {
          // It's already an amount
          gstAmount = gstValue;
          console.log(`GST Item ${index}: Treated as fixed amount = ${gstAmount}`);
        } else {
          console.log(`GST Item ${index}: Invalid GST value (${gstValue})`);
        }
      }
      
      return total + gstAmount;
    }, 0);
    
    console.log(`GST: Total calculated GST = ${totalGST}`);
    return totalGST;
  };

  // Calculate amount from bill_items (sum of all amounts without GST)
  const calculateAmountFromItems = (billItems) => {
    if (!billItems || !Array.isArray(billItems)) return 0;
    
    return billItems.reduce((total, item) => {
      let amount = 0;
      
      if (Array.isArray(item)) {
        // Extract amount directly from array (index 2)
        if (item.length > 2) {
          amount = parseFloat(item[2]) || 0;
        }
      } else if (typeof item === 'object' && item !== null) {
        // Extract amount directly from object
        amount = parseFloat(item.amount) || parseFloat(item.Amount) || 0;
      }
      
      return total + amount;
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
      if (Array.isArray(item)) {
        return `${item[0] || 'N/A'} - ${item[1] || 'N/A'}`;
      } else if (typeof item === 'object' && item !== null) {
        return `${item.category || item.Category || 'N/A'} - ${item.description || item.Description || 'N/A'}`;
      }
      return 'N/A';
    }
    
    // If multiple items, show first one with count
    const firstItem = billItems[0];
    if (Array.isArray(firstItem)) {
      return `${firstItem[0] || 'N/A'} - ${firstItem[1] || 'N/A'} (+${billItems.length - 1} more)`;
    } else if (typeof firstItem === 'object' && firstItem !== null) {
      return `${firstItem.category || firstItem.Category || 'N/A'} - ${firstItem.description || firstItem.Description || 'N/A'} (+${billItems.length - 1} more)`;
    }
    return 'N/A';
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
            <div className="mb-3">
              <Button 
                variant="outline-secondary" 
                onClick={() => navigate('/StaffDashBoard')}
                className="me-2"
              >
                <i className="bi bi-arrow-left me-2"></i> Back to Dashboard
              </Button>
            </div>
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
                              <th>GST</th>
                              <th>Total Payment</th>
                              <th>Status</th>
                              <th>Date</th>
                              <th>View</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedBills.length === 0 ? (
                              <tr>
                                <td colSpan={12} className="text-center">No bills found.</td>
                              </tr>
                            ) : (
                              paginatedBills.map((bill, idx) => {
                                // Calculate GST percentage from bill_items
                                const calculatedGSTPercentage = calculateGSTPercentageFromItems(bill.bill_items);
                                
                                // Calculate amount from bill_items if null
                                const calculatedAmount = bill.amount !== null && bill.amount !== undefined ? 
                                  parseFloat(bill.amount) : 
                                  calculateAmountFromItems(bill.bill_items);
                                
                                // Calculate total from bill_items if null
                                const calculatedTotal = bill.total_payment !== null && bill.total_payment !== undefined ? 
                                  parseFloat(bill.total_payment) : 
                                  calculateTotalFromItems(bill.bill_items);
                                
                                // Enhanced debug logging
                                console.log(`=== Bill ${bill.bill_id} ===`);
                                console.log(`Raw bill.gst:`, bill.gst);
                                console.log(`Calculated GST percentage from items:`, calculatedGSTPercentage);
                                console.log(`Final GST value to display:`, calculatedGSTPercentage);
                                console.log(`Bill items:`, bill.bill_items);
                                console.log(`========================`);
                                
                                return (
                                  <tr key={bill.id || idx}>
                                    <td>{(currentPage - 1) * billsPerPage + idx + 1}</td>
                                    <td>{bill.bill_id}</td>
                                    <td>{bill.payment_id || '-'}</td>
                                    <td>{bill.customer_name}</td>
                                    <td>{bill.service_type || '-'}</td>
                                    <td 
                                      onClick={() => bill.bill_items && bill.bill_items.length > 0 && handleViewItems(bill)}
                                      style={{ 
                                        maxWidth: '200px', 
                                        overflow: 'hidden', 
                                        textOverflow: 'ellipsis', 
                                        whiteSpace: 'nowrap',
                                        cursor: bill.bill_items && bill.bill_items.length > 0 ? 'pointer' : 'default',
                                        color: bill.bill_items && bill.bill_items.length > 0 ? '#2b6777' : 'inherit',
                                        textDecoration: bill.bill_items && bill.bill_items.length > 0 ? 'underline' : 'none'
                                      }}
                                    >
                                      {formatBillItems(bill.bill_items)}
                                    </td>
                                    <td>{formatCurrency(calculatedAmount)}</td>
                                    <td style={{ 
                                      backgroundColor: '#f0f8ff',
                                      fontWeight: calculatedGSTPercentage > 0 ? '600' : 'normal',
                                      color: calculatedGSTPercentage > 0 ? '' : '#6c757d'
                                    }}>
                                      {calculatedGSTPercentage > 0 ? `${calculatedGSTPercentage}%` : '0%'}
                                      {calculatedGSTPercentage > 0 && (
                                        <i className=" ms-1" 
                                           title={`GST calculated from ${bill.bill_items ? bill.bill_items.length : 0} items`}
                                           
                                        />
                                      )}
                                    </td>
                                    <td>{formatCurrency(calculatedTotal)}</td>
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
                    <Modal.Header closeButton style={{ backgroundColor: '#2b6777', color: 'white' }}>
                      <Modal.Title>
                        <i className="bi bi-receipt me-2"></i>
                        Bill Details
                      </Modal.Title>
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
                              <p><strong>Amount:</strong> {formatCurrency(
                                selectedBill.amount !== null && selectedBill.amount !== undefined ? 
                                  selectedBill.amount : 
                                  calculateAmountFromItems(selectedBill.bill_items)
                              )}</p>
                              <p><strong>GST:</strong> {formatCurrency(
                                calculateGSTFromItems(selectedBill.bill_items)
                              )}</p>
                              <p><strong>Total Payment:</strong> {formatCurrency(
                                selectedBill.total_payment !== null && selectedBill.total_payment !== undefined ? 
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
                                      <th>#</th>
                                      <th>Category</th>
                                      <th>Description</th>
                                      <th>Amount</th>
                                      <th>GST</th>
                                      <th>Total</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                     {selectedBill.bill_items.map((item, index) => {
                                      // Extract values based on item structure
                                      let category = '-';
                                      let description = '-';
                                      let amount = 0;
                                      let gst = 0;
                                      let total = 0;
                                      
                                      if (Array.isArray(item)) {
                                        category = item[0] || '-';
                                        description = item[1] || '-';
                                        amount = parseFloat(item[2]) || 0;
                                        const gstValue = parseFloat(item[3]) || 0;
                                        
                                        // Determine if GST is percentage or amount
                                        if (gstValue > 0 && gstValue <= 100) {
                                          gst = (amount * gstValue) / 100;
                                        } else if (gstValue > 100) {
                                          gst = gstValue;
                                        }
                                        
                                        total = parseFloat(item[4]) || (amount + gst);
                                      } else if (typeof item === 'object' && item !== null) {
                                        category = item.category || item.Category || '-';
                                        description = item.description || item.Description || '-';
                                        amount = parseFloat(item.amount) || parseFloat(item.Amount) || 0;
                                        const gstValue = parseFloat(item.gst) || parseFloat(item.GST) || 0;
                                        
                                        // Determine if GST is percentage or amount
                                        if (gstValue > 0 && gstValue <= 100) {
                                          gst = (amount * gstValue) / 100;
                                        } else if (gstValue > 100) {
                                          gst = gstValue;
                                        }
                                        
                                        total = parseFloat(item.total) || parseFloat(item.Total) || (amount + gst);
                                      }
                                      
                                      return (
                                        <tr key={index}>
                                          <td>{index + 1}</td>
                                          <td>{category}</td>
                                          <td>{description}</td>
                                          <td>{formatCurrency(amount)}</td>
                                          <td>{formatCurrency(gst)}</td>
                                          <td>{formatCurrency(total)}</td>
                                        </tr>
                                        
                                      );
                                    })}
                                    <tr style={{ backgroundColor: '#f8f9fa', fontWeight: 600 }}>
                                      <td colSpan={3} className="text-end">Subtotal:</td>
                                      <td>{formatCurrency(
                                        calculateAmountFromItems(selectedBill.bill_items)
                                      )}</td>
                                      <td>{formatCurrency(
                                        calculateGSTFromItems(selectedBill.bill_items)
                                      )}</td>
                                      <td>{formatCurrency(
                                        calculateTotalFromItems(selectedBill.bill_items)
                                      )}</td>
                                    </tr>
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
                    <Modal.Footer>
                      <Button variant="secondary" onClick={handleCloseModal}>
                        <i className="bi bi-x-circle me-2"></i>
                        Close
                      </Button>
                    </Modal.Footer>
                  </Modal>

                  {/* Modal for bill items only */}
                  <Modal show={showItemsModal} onHide={handleCloseItemsModal} centered size="lg">
                    <Modal.Header closeButton style={{ backgroundColor: '#52ab98', color: 'white' }}>
                      <Modal.Title>
                        <i className="bi bi-list-check me-2"></i>
                        Bill Items - {selectedBillItems?.bill_id}
                      </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                      {selectedBillItems && (
                        <div>
                          <Row className="mb-3">
                            <Col md={12}>
                              <p><strong>Customer Name:</strong> {selectedBillItems.customer_name}</p>
                              <p><strong>Bill Date:</strong> {formatDateTime(selectedBillItems.bill_date_time)}</p>
                            </Col>
                          </Row>
                          {selectedBillItems.bill_items && selectedBillItems.bill_items.length > 0 ? (
                            <Table responsive bordered hover>
                              <thead className="table-thead">
                                <tr>
                                  <th>#</th>
                                  <th>Category</th>
                                  <th>Description</th>
                                  <th>Amount</th>
                                  <th>GST</th>
                                  <th>Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                 {selectedBillItems.bill_items.map((item, index) => {
                                  // Extract values based on item structure
                                  let category = '-';
                                  let description = '-';
                                  let amount = 0;
                                  let gst = 0;
                                  let total = 0;
                                  
                                  if (Array.isArray(item)) {
                                    category = item[0] || '-';
                                    description = item[1] || '-';
                                    amount = parseFloat(item[2]) || 0;
                                    const gstValue = parseFloat(item[3]) || 0;
                                    
                                    // Determine if GST is percentage or amount
                                    if (gstValue > 0 && gstValue <= 100) {
                                      gst = (amount * gstValue) / 100;
                                    } else if (gstValue > 100) {
                                      gst = gstValue;
                                    }
                                    
                                    total = parseFloat(item[4]) || (amount + gst);
                                  } else if (typeof item === 'object' && item !== null) {
                                    category = item.category || item.Category || '-';
                                    description = item.description || item.Description || '-';
                                    amount = parseFloat(item.amount) || parseFloat(item.Amount) || 0;
                                    const gstValue = parseFloat(item.gst) || parseFloat(item.GST) || 0;
                                    
                                    // Determine if GST is percentage or amount
                                    if (gstValue > 0 && gstValue <= 100) {
                                      gst = (amount * gstValue) / 100;
                                    } else if (gstValue > 100) {
                                      gst = gstValue;
                                    }
                                    
                                    total = parseFloat(item.total) || parseFloat(item.Total) || (amount + gst);
                                  }
                                  
                                  return (
                                    <tr key={index}>
                                      <td>{index + 1}</td>
                                      <td>{category}</td>
                                      <td>{description}</td>
                                      <td>{formatCurrency(amount)}</td>
                                      <td>{formatCurrency(gst)}</td>
                                      <td style={{ fontWeight: 600 }}>{formatCurrency(total)}</td>
                                    </tr>
                                  );
                                })}
                                <tr style={{ backgroundColor: '#f8f9fa', fontWeight: 600 }}>
                                  <td colSpan={3} className="text-end">Total:</td>
                                  <td>{formatCurrency(
                                    calculateAmountFromItems(selectedBillItems.bill_items)
                                  )}</td>
                                  <td>{formatCurrency(
                                    calculateGSTFromItems(selectedBillItems.bill_items)
                                  )}</td>
                                  <td>{formatCurrency(
                                    calculateTotalFromItems(selectedBillItems.bill_items)
                                  )}</td>
                                </tr>
                              </tbody>
                            </Table>
                          ) : (
                            <Alert variant="info">
                              <i className="bi bi-info-circle me-2"></i>
                              No bill items found for this bill.
                            </Alert>
                          )}
                        </div>
                      )}
                    </Modal.Body>
                    <Modal.Footer>
                      <Button variant="secondary" onClick={handleCloseItemsModal}>
                        <i className="bi bi-x-circle me-2"></i>
                        Close
                      </Button>
                    </Modal.Footer>
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