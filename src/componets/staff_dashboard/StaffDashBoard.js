import React, { useState, useEffect } from "react";
import { Container, Table, Spinner, Alert, Row, Col, Card, Button, Dropdown, Modal, Form } from "react-bootstrap";
import "../../assets/css/admindashboard.css";
import StaffLeftNav from "./StaffLeftNav";
import StaffHeader from "./StaffHeader";
import "../../assets/css/table.css";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const StaffDashBoard = () => {
  // Check device width
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  
  // Vendor and Customer data state
  const [vendors, setVendors] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTable, setShowTable] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [activeTable, setActiveTable] = useState("vendors"); // "vendors" or "customers"
  
  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentVendor, setCurrentVendor] = useState(null);
  const [editForm, setEditForm] = useState({
    username: "",
    mobile_number: "",
    email: "",
    state: "",
    district: "",
    block: "",
    is_active: true,
    category: ""
  });
  
  // Get auth context
  const { tokens, isLoading: authLoading, refreshAccessToken, logout } = useAuth();

  // API URLs
  const VENDOR_API_URL = "https://mahadevaaya.com/spindo/spindobackend/api/vendor/register/";
  const CUSTOMER_API_URL = "https://mahadevaaya.com/spindo/spindobackend/api/customer/register/";
  const VENDOR_UPDATE_URL = "https://mahadevaaya.com/spindo/spindobackend/api/vendor/register/";
  const VENDOR_DELETE_URL = "https://mahadevaaya.com/spindo/spindobackend/api/vendor/register/";

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

  // Fetch vendor and customer data from APIs
  const fetchData = async () => {
    if (!tokens?.access || !tokens?.refresh) {
      setLoading(false);
      setError("Authentication required. Please log in.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Set up authorization headers
      const headers = {
        headers: { Authorization: `Bearer ${tokens.access}` }
      };

      // Fetch vendors using axios
      const vendorResponse = await axios.get(VENDOR_API_URL, headers);
      
      if (vendorResponse.data.status) {
        setVendors(vendorResponse.data.data || []);
      } else {
        throw new Error("Failed to fetch vendor data");
      }

      // Fetch customers using axios
      const customerResponse = await axios.get(CUSTOMER_API_URL, headers);
      
      if (customerResponse.data.status) {
        setCustomers(customerResponse.data.data || []);
      } else {
        throw new Error("Failed to fetch customer data");
      }
    } catch (err) {
      console.error("FETCH ERROR:", err.response?.data || err.message);
      
      // Check if access token is expired (status code 401)
      if (err.response?.status === 401) {
        console.log("Access token expired, attempting to refresh...");
        const newAccessToken = await refreshAccessToken(tokens.refresh);
        
        if (newAccessToken) {
          // Retry fetch with new access token
          return fetchData();
        } else {
          setError("Session expired. Please log in again.");
        }
      } else {
        setError(err.response?.data?.detail || err.message || "Failed to fetch data");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchData();
    }
  }, [tokens.access, authLoading]);

  // Calculate counts for cards
  const totalVendors = vendors.length;
  const activeVendors = vendors.filter(vendor => vendor.is_active).length;
  const inactiveVendors = totalVendors - activeVendors;
  
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(customer => customer.is_active).length;
  const inactiveCustomers = totalCustomers - activeCustomers;
  
  // Handle card click
  const handleCardClick = (tableType) => {
    setActiveTable(tableType);
    setShowTable(true);
    setActiveFilter("all"); // Reset filter when switching tables
  };
  
  // Handle filter change
  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setShowTable(true);
  };
  
  // Filter data based on active filter and table type
  const filteredData = activeTable === "vendors" 
    ? (activeFilter === "all" 
       ? vendors 
       : activeFilter === "active"
       ? vendors.filter(vendor => vendor.is_active)
       : vendors.filter(vendor => !vendor.is_active))
    : (activeFilter === "all" 
       ? customers 
       : activeFilter === "active"
       ? customers.filter(customer => customer.is_active)
       : customers.filter(customer => !customer.is_active));

  // Refresh data function
  const handleRefresh = () => {
    fetchData();
  };

  // Handle edit button click
  const handleEditClick = (vendor) => {
    setCurrentVendor(vendor);
    setEditForm({
      username: vendor.username,
      mobile_number: vendor.mobile_number,
      email: vendor.email,
      state: vendor.state,
      district: vendor.district,
      block: vendor.block,
      is_active: vendor.is_active,
      category: vendor.category?.id || ""
    });
    setShowEditModal(true);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle save changes in edit modal
  const handleSaveChanges = async () => {
    if (!currentVendor) return;
    
    try {
      const headers = {
        headers: { Authorization: `Bearer ${tokens.access}` }
      };
      
      // Send unique_id in request body for PUT request
      const response = await axios.put(
        `${VENDOR_UPDATE_URL}`, 
        { ...editForm, unique_id: currentVendor.unique_id }, 
        headers
      );
      
      if (response.data.status) {
        // Update vendor in state
        setVendors(prev => prev.map(vendor => 
          vendor.unique_id === currentVendor.unique_id 
            ? { ...vendor, ...editForm }
            : vendor
        ));
        
        setShowEditModal(false);
        // Show success message
        alert("Vendor updated successfully!");
      } else {
        throw new Error("Failed to update vendor");
      }
    } catch (err) {
      console.error("UPDATE ERROR:", err.response?.data || err.message);
      
      // Check if access token is expired (status code 401)
      if (err.response?.status === 401) {
        console.log("Access token expired, attempting to refresh...");
        const newAccessToken = await refreshAccessToken(tokens.refresh);
        
        if (newAccessToken) {
          // Retry update with new access token
          return handleSaveChanges();
        } else {
          setError("Session expired. Please log in again.");
        }
      } else {
        setError(err.response?.data?.detail || err.message || "Failed to update vendor");
      }
    }
  };

  // Handle delete button click
  const handleDeleteClick = async (vendorUniqueId) => {
    if (window.confirm("Are you sure you want to delete this vendor?")) {
      try {
        const headers = {
          headers: { Authorization: `Bearer ${tokens.access}` }
        };
        
        // Send unique_id in request body for DELETE request
        const response = await axios.delete(
          `${VENDOR_DELETE_URL}`, 
          { 
            ...headers,
            data: { unique_id: vendorUniqueId }
          }
        );
        
        if (response.data.status) {
          // Remove vendor from state using unique_id
          setVendors(prev => prev.filter(vendor => vendor.unique_id !== vendorUniqueId));
          // Show success message
          alert("Vendor deleted successfully!");
        } else {
          throw new Error("Failed to delete vendor");
        }
      } catch (err) {
        console.error("DELETE ERROR:", err.response?.data || err.message);
        
        // Check if access token is expired (status code 401)
        if (err.response?.status === 401) {
          console.log("Access token expired, attempting to refresh...");
          const newAccessToken = await refreshAccessToken(tokens.refresh);
          
          if (newAccessToken) {
            // Retry delete with new access token
            return handleDeleteClick(vendorUniqueId);
          } else {
            setError("Session expired. Please log in again.");
          }
        } else {
          setError(err.response?.data?.detail || err.message || "Failed to delete vendor");
        }
      }
    }
  };

  return (
    <>
      <style type="text/css">
        {`
          .dashboard-card {
            border-radius: 15px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
            overflow: hidden;
            position: relative;
            background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
            border: none;
          }
          
          .dashboard-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          }
          
          .dashboard-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 5px;
            background: linear-gradient(90deg, #4e73df 0%, #224abe 100%);
          }
          
          .card-title {
            font-size: 1.1rem;
            font-weight: 600;
            color: #5a5c69;
            margin-bottom: 0.5rem;
          }
          
          .card-number {
            font-size: 2.5rem;
            font-weight: 700;
            color: #4e73df;
            margin: 0.5rem 0;
          }
          
          .action-btn {
            padding: 0.25rem 0.5rem;
            font-size: 0.8rem;
            margin: 0 0.25rem;
          }
          
          .table-thead {
            background-color: #4e73df;
            color: white;
          }
          
          .cursor-pointer {
            cursor: pointer;
          }
          
          .vendor-card-icon {
            position: absolute;
            top: 15px;
            right: 15px;
            font-size: 2rem;
            opacity: 0.2;
            color: #4e73df;
          }
          
          .customer-card-icon {
            position: absolute;
            top: 15px;
            right: 15px;
            font-size: 2rem;
            opacity: 0.2;
            color: #36b9cc;
          }
          
          .customer-card::before {
            background: linear-gradient(90deg, #36b9cc 0%, #258391 100%);
          }
          
          .customer-card .card-number {
            color: #36b9cc;
          }
        `}
      </style>
      
      <div className="dashboard-container">
        {/* Left Sidebar */}
        <StaffLeftNav
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          isMobile={isMobile}
          isTablet={isTablet}
        />

        {/* Main Content */}
        <div className="main-content-dash">
          <StaffHeader toggleSidebar={toggleSidebar} />

          <Container fluid className="dashboard-body dashboard-main-container">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2>Vendor Dashboard</h2>
              <Button variant="outline-primary" size="sm" onClick={handleRefresh}>
                <i className="bi bi-arrow-clockwise me-2"></i>
                Refresh Data
              </Button>
            </div>
            
            {/* Auth Loading State */}
            {authLoading && (
              <div className="d-flex justify-content-center align-items-center" style={{ height: '200px' }}>
                <Spinner animation="border" variant="primary" />
                <span style={{ marginLeft: '10px' }}>Loading session...</span>
              </div>
            )}

            {/* Data Loading State */}
            {!authLoading && loading && (
              <div className="d-flex justify-content-center align-items-center" style={{ height: '200px' }}>
                <Spinner animation="border" variant="primary" />
                <span style={{ marginLeft: '10px' }}>Loading data...</span>
              </div>
            )}

            {/* Error State */}
            {error && (
              <Alert variant="danger" className="mt-4">
                <Alert.Heading>Error fetching data</Alert.Heading>
                <p>{error}</p>
                <hr />
                <div className="d-flex justify-content-end">
                  <Button onClick={handleRefresh} variant="outline-danger">
                    Try Again
                  </Button>
                </div>
              </Alert>
            )}

            {/* Dashboard Cards with Filter Dropdown */}
            {!authLoading && !loading && !error && (
              <>
                <Row className="mb-4">
                  <Col md={6} className="mb-3">
                    <Card 
                      className="dashboard-card h-100 cursor-pointer"
                      onClick={() => handleCardClick("vendors")}
                    >
                      <i className="bi bi-shop vendor-card-icon"></i>
                      <Card.Body className="text-center">
                        <Card.Title className="card-title">Total Vendors</Card.Title>
                        <h2 className="card-number">{totalVendors}</h2>
                        <div className="mt-2">
                          <span className="text-success me-3">Active: {activeVendors}</span>
                          <span className="text-danger">Inactive: {inactiveVendors}</span>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  
                  <Col md={6} className="mb-3">
                    <Card 
                      className="dashboard-card customer-card h-100 cursor-pointer"
                      onClick={() => handleCardClick("customers")}
                    >
                      <i className="bi bi-people customer-card-icon"></i>
                      <Card.Body className="text-center">
                        <Card.Title className="card-title">Total Customers</Card.Title>
                        <h2 className="card-number">{totalCustomers}</h2>
                        <div className="mt-2">
                          <span className="text-success me-3">Active: {activeCustomers}</span>
                          <span className="text-danger">Inactive: {inactiveCustomers}</span>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
                
                <Row className="mb-4">
                  <Col md={6} className="mb-3">
                    <Dropdown>
                      <Dropdown.Toggle variant="primary" id="filter-dropdown">
                        Filter: {activeFilter === "all" ? `All ${activeTable === "vendors" ? "Vendors" : "Customers"}` : 
                               activeFilter === "active" ? `Active ${activeTable === "vendors" ? "Vendors" : "Customers"}` : `Inactive ${activeTable === "vendors" ? "Vendors" : "Customers"}`}
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item onClick={() => handleFilterChange("all")}>
                          All {activeTable === "vendors" ? "Vendors" : "Customers"}
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => handleFilterChange("active")}>
                          Active {activeTable === "vendors" ? "Vendors" : "Customers"}
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => handleFilterChange("inactive")}>
                          Inactive {activeTable === "vendors" ? "Vendors" : "Customers"}
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </Col>
                </Row>

                {/* Data Table */}
                {showTable && (
                  <>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h3>
                        {activeFilter === "all" && `All ${activeTable === "vendors" ? "Vendors" : "Customers"}`}
                        {activeFilter === "active" && `Active ${activeTable === "vendors" ? "Vendors" : "Customers"}`}
                        {activeFilter === "inactive" && `Inactive ${activeTable === "vendors" ? "Vendors" : "Customers"}`}
                      </h3>
                      <Button 
                        variant="outline-secondary" 
                        size="sm"
                        onClick={() => setShowTable(false)}
                      >
                        Close Table
                      </Button>
                    </div>
                    
                    {filteredData.length > 0 ? (
                      <Table striped bordered hover responsive>
                        <thead className="table-thead">
                          <tr>
                            <th>#</th>
                            <th>Unique ID</th>
                            <th>Username</th>
                            <th>Mobile Number</th>
                            <th>State</th>
                            <th>District</th>
                            <th>Block</th>
                            {activeTable === "vendors" && (
                              <>
                                <th>Email</th>
                                <th>Category</th>
                                <th>Aadhar Card</th>
                                <th>Actions</th>
                              </>
                            )}
                            <th>Active</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredData.map((item, index) => (
                            <tr key={item.unique_id}>
                              <td>{index + 1}</td>
                              <td>{item.unique_id}</td>
                              <td>{item.username}</td>
                              <td>{item.mobile_number}</td>
                              <td>{item.state}</td>
                              <td>{item.district}</td>
                              <td>{item.block}</td>
                                 {activeTable === "vendors" && (
                                  <>
                                    <td>{item.email}</td>
                                    <td>{item.category?.type || 'N/A'}</td>
                                    <td>
                                      {item.aadhar_card ? (
                                       <img 
      src={item.aadhar_card.startsWith('http') 
        ? item.aadhar_card 
        : `https://mahadevaaya.com/spindo/spindobackend${item.aadhar_card.startsWith('/') ? item.aadhar_card : '/' + item.aadhar_card}`} 
      alt="Aadhar Card" 
      style={{ 
        width: '80px', 
        height: 'auto', 
        borderRadius: '4px',
        objectFit: 'cover'
      }} 
    />
                                      ) : (
                                        <span className="text-muted">No Image</span>
                                      )}
                                    </td>
                                    <td>
                                    <Button 
                                      variant="primary" 
                                      size="sm" 
                                      className="action-btn"
                                      onClick={() => handleEditClick(item)}
                                    >
                                      <i className="bi bi-pencil"></i> Edit
                                    </Button>
                                    <Button 
                                      variant="danger" 
                                      size="sm" 
                                      className="action-btn"
                                      onClick={() => handleDeleteClick(item.unique_id)}
                                    >
                                      <i className="bi bi-trash"></i> Delete
                                    </Button>
                                  </td>
                                </>
                              )}
                              <td>
                                <span className={`badge ${item.is_active ? 'bg-success' : 'bg-danger'}`}>
                                  {item.is_active ? 'Yes' : 'No'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    ) : (
                      <Alert variant="info">
                        No {activeTable === "vendors" ? "vendors" : "customers"} found for the selected filter.
                      </Alert>
                    )}
                  </>
                )}
              </>
            )}
          </Container>
        </div>
      </div>

      {/* Edit Vendor Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Vendor</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    type="text"
                    name="username"
                    value={editForm.username}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Mobile Number</Form.Label>
                  <Form.Control
                    type="text"
                    name="mobile_number"
                    value={editForm.mobile_number}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={editForm.email}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>State</Form.Label>
                  <Form.Control
                    type="text"
                    name="state"
                    value={editForm.state}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>District</Form.Label>
                  <Form.Control
                    type="text"
                    name="district"
                    value={editForm.district}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Block</Form.Label>
                  <Form.Control
                    type="text"
                    name="block"
                    value={editForm.block}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Category</Form.Label>
                  <Form.Control
                    type="text"
                    name="category"
                    value={editForm.category}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    name="is_active"
                    label="Active"
                    checked={editForm.is_active}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveChanges}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default StaffDashBoard;