import React, { useState, useEffect } from "react";
import { Container, Form, Button, Row, Col, Card, Spinner, Alert, InputGroup, Table, Dropdown } from "react-bootstrap";
import { useLocation } from "react-router-dom";

import "../../../assets/css/admindashboard.css";
import "../../../assets/css/service-multiselect.css";
import { useAuth } from "../../context/AuthContext";
import StaffLeftNav from "../StaffLeftNav";
import StaffHeader from "../StaffHeader";

const StaffBill = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { user, tokens } = useAuth();
  const location = useLocation();

  // State for categories
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // State for vendors
  const [vendors, setVendors] = useState([]);
  const [vendorsLoading, setVendorsLoading] = useState(true);

  // State for the bill form
  const [billData, setBillData] = useState({
    vendor_id: "",
    payment_id: "",
    customer_name: "",
    cust_mobile: "",
    service_type: "",
    service_des: "",
    amount: "",
    gst: "18", // Default GST percentage
    total_payment: "0.00",
    payment_type: "UPI",
    bill_date_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
    status: "Paid",
  });

  // State for bill items
  const [billItems, setBillItems] = useState([
    {
      category: [],
      description: "",
      amount: "",
      gst: "18",
      total: "0.00"
    }
  ]);

  // Auto-fill form with data from location state
  useEffect(() => {
    if (location.state) {
      const { customer_name, cust_mobile, service_type } = location.state;
      setBillData(prev => ({
        ...prev,
        customer_name: customer_name || prev.customer_name,
        cust_mobile: cust_mobile || prev.cust_mobile,
        service_type: service_type || prev.service_type,
      }));
    }
  }, [location.state]);

  // Device detection effect
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

  // Effect to fetch service categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("https://mahadevaaya.com/spindo/spindobackend/api/get-service/categories/", {
          headers: {
            ...(tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {}),
          },
        });
        const data = await response.json();
        if (data.status && data.data) {
          const allCategories = data.data.flatMap(cat => cat.subcategories);
          setCategories(allCategories);
        } else {
          setError("Failed to load service categories.");
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError("Error fetching service categories.");
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, [tokens]);

  // Effect to fetch vendors
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        setVendorsLoading(true);
        const response = await fetch("https://mahadevaaya.com/spindo/spindobackend/api/vendor/list/", {
          headers: {
            ...(tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {}),
          },
        });
        const data = await response.json();
        if (data.status && data.data) {
          setVendors(data.data);
        } else {
          setError("Failed to load vendor list.");
        }
      } catch (err) {
        console.error("Error fetching vendors:", err);
        setError("Error fetching vendor list.");
      } finally {
        setVendorsLoading(false);
      }
    };
    fetchVendors();
  }, [tokens]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBillData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle bill item changes
  const handleBillItemChange = (index, field, value) => {
    const updatedItems = [...billItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Calculate total for this item
    const amount = parseFloat(updatedItems[index].amount) || 0;
    const gstPercentage = parseFloat(updatedItems[index].gst) || 0;
    const gstAmount = (amount * gstPercentage) / 100;
    const total = amount + gstAmount;
    updatedItems[index].total = total.toFixed(2);
    
    setBillItems(updatedItems);
  };

  // Handle category selection for bill items
  const handleCategorySelect = (index, category) => {
    const updatedItems = [...billItems];
    if (!updatedItems[index].category.includes(category)) {
      updatedItems[index].category = [...updatedItems[index].category, category];
      setBillItems(updatedItems);
    }
  };

  // Handle category removal for bill items
  const handleCategoryRemove = (index, categoryToRemove) => {
    const updatedItems = [...billItems];
    updatedItems[index].category = updatedItems[index].category.filter(category => category !== categoryToRemove);
    setBillItems(updatedItems);
  };

  // Add new bill item
  const addBillItem = () => {
    setBillItems([...billItems, {
      category: [],
      description: "",
      amount: "",
      gst: "18",
      total: "0.00"
    }]);
  };

  // Remove bill item
  const removeBillItem = (index) => {
    if (billItems.length > 1) {
      setBillItems(billItems.filter((_, i) => i !== index));
    }
  };

  // Calculate total bill amount from all items
  const calculateTotalBill = () => {
    const total = billItems.reduce((sum, item) => sum + parseFloat(item.total || 0), 0);
    return total.toFixed(2);
  };

  const handleAmountChange = (e) => {
    const { name, value } = e.target;
    const amount = parseFloat(value) || 0;
    const gstPercentage = parseFloat(billData.gst) || 0;
    const gstAmount = (amount * gstPercentage) / 100;
    const total = amount + gstAmount;

    setBillData((prev) => ({
      ...prev,
      [name]: value,
      gst: name === 'amount' ? prev.gst : value, // Update gst if gst field changes
      total_payment: total.toFixed(2),
    }));
  };

  const generatePaymentId = () => {
    const randomId = "PAY-" + Math.random().toString(36).substr(2, 9).toUpperCase();
    setBillData((prev) => ({ ...prev, payment_id: randomId }));
  };

  const validateForm = () => {
    if (!billData.customer_name.trim()) {
      setError("Customer Name is required.");
      return false;
    }
    if (!/^\d{10}$/.test(billData.cust_mobile)) {
      setError("Please enter a valid 10-digit mobile number.");
      return false;
    }
    if (!billData.service_type) {
      setError("Please select a service type.");
      return false;
    }
    if (!billData.vendor_id) {
      setError("Please select a vendor.");
      return false;
    }
    
    // Validate bill items
    const invalidItems = billItems.filter(item => 
      !item.category || !item.description || !item.amount || parseFloat(item.amount) <= 0
    );
    
    if (invalidItems.length > 0) {
      setError("Please fill in all required fields for all bill items.");
      return false;
    }
    
    setError("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Prepare bill items in the required format
      const formattedBillItems = billItems.map(item => [
        item.category,
        item.description,
        parseFloat(item.amount).toFixed(2),
        (parseFloat(item.amount) * parseFloat(item.gst) / 100).toFixed(2),
        item.total
      ]);

      const payload = {
        ...billData,
        amount: calculateTotalBill(), // Set main amount to grand total
        gst: "0.00", // GST is calculated per item, so main GST can be 0
        total_payment: calculateTotalBill(),
        bill_items: formattedBillItems
      };

      console.log("Payload being sent:", JSON.stringify(payload, null, 2));

      const response = await fetch("https://mahadevaaya.com/spindo/spindobackend/api/billing/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Response data:", data);

      if (response.ok && data.status) {
        setSuccess("Bill created successfully!");
        // Reset form after successful submission
        setBillData({
          vendor_id: "",
          payment_id: "",
          customer_name: "",
          cust_mobile: "",
          service_type: "",
          service_des: "",
          amount: "",
          gst: "18",
          total_payment: "0.00",
          payment_type: "UPI",
          bill_date_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
          status: "Paid",
        });
        // Reset bill items
        setBillItems([
          {
            category: "",
            description: "",
            amount: "",
            gst: "18",
            total: "0.00"
          }
        ]);
      } else {
        setError(data.message || `Failed to create bill. Status: ${response.status}. Please check console for details.`);
      }
    } catch (err) {
      console.error("Error submitting bill:", err);
      setError("An error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setBillData({
      vendor_id: "",
      payment_id: "",
      customer_name: "",
      cust_mobile: "",
      service_type: "",
      service_des: "",
      amount: "",
      gst: "18",
      total_payment: "0.00",
      payment_type: "UPI",
      bill_date_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
      status: "Paid",
    });
    setBillItems([
      {
        category: "",
        description: "",
        amount: "",
        gst: "18",
        total: "0.00"
      }
    ]);
    setError("");
    setSuccess("");
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="dashboard-container">
      <StaffLeftNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} isMobile={isMobile} isTablet={isTablet} />
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
                      Create New Bill
                    </h3>
                    <p style={{ color: "#6c757d", fontSize: "14px" }}>Fill in the details below to generate a new bill.</p>
                  </div>

                  {error && <Alert variant="danger" onClose={() => setError("")} dismissible><i className="bi bi-exclamation-circle me-2"></i>{error}</Alert>}
                  {success && <Alert variant="success" onClose={() => setSuccess("")} dismissible><i className="bi bi-check-circle me-2"></i>{success}</Alert>}

                  {categoriesLoading || vendorsLoading ? (
                    <div className="text-center"><Spinner animation="border" variant="primary" /><p className="mt-2">Loading form data...</p></div>
                  ) : (
                    <Form onSubmit={handleSubmit} autoComplete="off">
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3" controlId="customer_name">
                            <Form.Label style={{ color: "#2b6777", fontWeight: 600 }}><i className="bi bi-person me-2"></i>Customer Name</Form.Label>
                            <Form.Control type="text" name="customer_name" value={billData.customer_name} onChange={handleChange} required style={{ backgroundColor: "#e8f4f8", borderColor: "#52ab98" }} placeholder="Enter customer's full name" />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3" controlId="cust_mobile">
                            <Form.Label style={{ color: "#2b6777", fontWeight: 600 }}><i className="bi bi-phone me-2"></i>Customer Mobile</Form.Label>
                            <Form.Control type="text" name="cust_mobile" value={billData.cust_mobile} onChange={handleChange} required maxLength={10} style={{ backgroundColor: "#e8f4f8", borderColor: "#52ab98" }} placeholder="Enter 10-digit mobile number" />
                          </Form.Group>
                        </Col>
                      </Row>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3" controlId="vendor_id">
                            <Form.Label style={{ color: "#2b6777", fontWeight: 600 }}><i className="bi bi-shop me-2"></i>Vendor</Form.Label>
                            <Form.Select name="vendor_id" value={billData.vendor_id} onChange={handleChange} required disabled={vendorsLoading} style={{ backgroundColor: "#e8f4f8", borderColor: "#52ab98" }}>
                              <option value="" disabled>-- Select Vendor --</option>
                              {vendors.map((vendor) => (
                                <option key={vendor.unique_id} value={vendor.unique_id}>
                                  {vendor.username} ({vendor.unique_id})
                                </option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3" controlId="payment_id">
                            <Form.Label style={{ color: "#2b6777", fontWeight: 600 }}><i className="bi bi-credit-card me-2"></i>Payment ID</Form.Label>
                            <InputGroup>
                              <Form.Control type="text" name="payment_id" value={billData.payment_id} onChange={handleChange} required style={{ backgroundColor: "#e8f4f8", borderColor: "#52ab98" }} placeholder="e.g., PAY-789456" />
                              <Button variant="outline-secondary" onClick={generatePaymentId}><i className="bi bi-arrow-clockwise"></i></Button>
                            </InputGroup>
                          </Form.Group>
                        </Col>
                      </Row>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3" controlId="service_type">
                            <Form.Label style={{ color: "#2b6777", fontWeight: 600 }}><i className="bi bi-gear me-2"></i>Service Type</Form.Label>
                            <Form.Select name="service_type" value={billData.service_type} onChange={handleChange} required style={{ backgroundColor: "#e8f4f8", borderColor: "#52ab98" }}>
                              <option value="">-- Select Service --</option>
                              {categories.map((cat, index) => <option key={index} value={cat}>{cat}</option>)}
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3" controlId="payment_type">
                            <Form.Label style={{ color: "#2b6777", fontWeight: 600 }}><i className="bi bi-wallet2 me-2"></i>Payment Type</Form.Label>
                            <Form.Select name="payment_type" value={billData.payment_type} onChange={handleChange} required style={{ backgroundColor: "#e8f4f8", borderColor: "#52ab98" }}>
                              <option value="UPI">UPI</option>
                              <option value="Cash">Cash</option>
                              <option value="Card">Card</option>
                              <option value="Net Banking">Net Banking</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                      </Row>
                      <Row>
                        <Col md={12}>
                          <Form.Group className="mb-3" controlId="service_des">
                            <Form.Label style={{ color: "#2b6777", fontWeight: 600 }}><i className="bi bi-card-text me-2"></i>Service Description</Form.Label>
                            <Form.Control as="textarea" rows={2} name="service_des" value={billData.service_des} onChange={handleChange} style={{ borderColor: "#52ab98", resize: "none" }} placeholder="Brief description of the service provided" />
                          </Form.Group>
                        </Col>
                      </Row>
                      {/* Bill Items Section */}
                      <Row className="mb-4">
                        <Col md={12}>
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 style={{ color: "#2b6777", fontWeight: 600 }}>
                              <i className="bi bi-list-check me-2"></i>Bill Items
                            </h5>
                            <Button variant="outline-primary" size="sm" onClick={addBillItem}>
                              <i className="bi bi-plus-circle me-1"></i> Add Item
                            </Button>
                          </div>
                          
                          <Table responsive bordered size="sm" className="mb-3">
                            <thead className="table-thead">
                              <tr>
                                <th>Category</th>
                                <th>Description</th>
                                <th>Amount</th>
                                <th>GST (%)</th>
                                <th>Total</th>
                                <th>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {billItems.map((item, index) => (
                                <tr key={index}>
                                  <td>
                                    <Form.Select 
                                      value={item.category} 
                                      onChange={(e) => handleBillItemChange(index, 'category', e.target.value)}
                                      required
                                      style={{ backgroundColor: "#e8f4f8", borderColor: "#52ab98", fontSize: "14px" }}
                                    >
                                      <option value="">-- Select --</option>
                                      {categories.map((cat, idx) => <option key={idx} value={cat}>{cat}</option>)}
                                    </Form.Select>
                                  </td>
                                  {/* <td>
                                    <Form.Control 
                                      type="text" 
                                      value={item.description} 
                                      onChange={(e) => handleBillItemChange(index, 'description', e.target.value)}
                                      required
                                      style={{ backgroundColor: "#e8f4f8", borderColor: "#52ab98", fontSize: "14px" }}
                                      placeholder="Item description"
                                    />
                                  </td> */}
                                  <td>
                                    <Form.Control 
                                      type="number" 
                                      value={item.amount} 
                                      onChange={(e) => handleBillItemChange(index, 'amount', e.target.value)}
                                      required
                                      step="0.01"
                                      min="0"
                                      style={{ backgroundColor: "#e8f4f8", borderColor: "#52ab98", fontSize: "14px" }}
                                      placeholder="0.00"
                                    />
                                  </td>
                                  <td>
                                    <Form.Control 
                                      type="number" 
                                      value={item.gst} 
                                      onChange={(e) => handleBillItemChange(index, 'gst', e.target.value)}
                                      required
                                      step="0.01"
                                      min="0"
                                      style={{ backgroundColor: "#e8f4f8", borderColor: "#52ab98", fontSize: "14px" }}
                                      placeholder="18"
                                    />
                                  </td>
                                  <td>
                                    <Form.Control 
                                      type="text" 
                                      value={item.total} 
                                      readOnly
                                      style={{ backgroundColor: "#dee2e6", borderColor: "#ced4da", fontWeight: 'bold', fontSize: "14px" }}
                                    />
                                  </td>
                                  <td>
                                    <Button 
                                      variant="outline-danger" 
                                      size="sm" 
                                      onClick={() => removeBillItem(index)}
                                      disabled={billItems.length === 1}
                                    >
                                      <i className="bi bi-trash"></i>
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>

                          {/* Total Bill Amount */}
                          <div className="d-flex justify-content-end align-items-center">
                            <h5 style={{ color: "#2b6777", fontWeight: 600, marginRight: "1rem" }}>
                              Grand Total:
                            </h5>
                            <h4 style={{ color: "#52ab98", fontWeight: 700 }}>
                              ₹{calculateTotalBill()}
                            </h4>
                          </div>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={3}>
                          <Form.Group className="mb-3" controlId="status">
                            <Form.Label style={{ color: "#2b6777", fontWeight: 600 }}><i className="bi bi-flag me-2"></i>Status</Form.Label>
                            <Form.Select name="status" value={billData.status} onChange={handleChange} required style={{ backgroundColor: "#e8f4f8", borderColor: "#52ab98" }}>
                              <option value="Paid">Paid</option>
                              <option value="Unpaid">Unpaid</option>
                              <option value="Pending">Pending</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                      </Row>

                      <div className="d-flex justify-content-center gap-3 mt-5">
                        <Button variant="primary" type="submit" className="px-5 py-2 rounded-pill" disabled={loading} style={{ background: "linear-gradient(90deg, #2b6777 0%, #52ab98 100%)", border: "none", fontWeight: 600, boxShadow: "0 4px 8px rgba(43, 103, 119, 0.2)" }}>
                          {loading ? <><Spinner size="sm" animation="border" className="me-2" />Creating...</> : <><i className="bi bi-check-circle me-2"></i>Create Bill</>}
                        </Button>
                        <Button variant="outline-secondary" type="button" className="px-5 py-2 rounded-pill" onClick={handleReset} disabled={loading} style={{ fontWeight: 600 }}>
                          <i className="bi bi-arrow-counterclockwise me-2"></i>Reset
                        </Button>
                      </div>
                    </Form>
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

export default StaffBill;
