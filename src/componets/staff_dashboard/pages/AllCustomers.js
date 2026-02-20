import React, { useState, useEffect } from "react";
import { Container, Table, Button, Spinner, Alert, Row, Col, Form, Card, Modal } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import StaffLeftNav from "../StaffLeftNav";
import StaffHeader from "../StaffHeader";
import { useAuth } from "../../context/AuthContext";
import "../../../assets/css/table.css";
import "../../../assets/css/admindashboard.css";

const AllCustomers = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const customersPerPage = 10;
  const [showModal, setShowModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const { user, tokens } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const filter = location.state?.filter || "all";

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
      setError("Not logged in");
      setLoading(false);
      return;
    }
    
    setLoading(true);
    fetch(`https://mahadevaaya.com/spindo/spindobackend/api/customer/register/`, {
      headers: tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {}
    })
      .then(res => res.json())
      .then(data => {
        if (data.status && Array.isArray(data.data)) {
          let filteredCustomers = data.data;
          if (filter === "active") {
            filteredCustomers = data.data.filter(c => c.is_active);
          } else if (filter === "inactive") {
            filteredCustomers = data.data.filter(c => !c.is_active);
          }
          setCustomers(filteredCustomers);
        } else {
          setCustomers([]);
        }
        setLoading(false);
      })
      .catch(err => {
        setError("Failed to load customers");
        setLoading(false);
      });
  }, [user, tokens, filter]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleView = (customer) => {
    setSelectedCustomer(customer);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCustomer(null);
  };

  // Handle search
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // Filtered and paginated customers
  const filteredCustomers = customers.filter(customer => {
    return searchQuery === '' || 
      Object.values(customer).some(value => 
        value && value.toString().toLowerCase().includes(searchQuery.toLowerCase())
      );
  });
  
  const totalPages = Math.ceil(filteredCustomers.length / customersPerPage);
  const paginatedCustomers = filteredCustomers.slice((currentPage - 1) * customersPerPage, currentPage * customersPerPage);

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Format date for display
  const formatDate = (date) => {
    if (!date) return '-';
    try {
      const formattedDate = new Date(date);
      return formattedDate.toLocaleDateString();
    } catch (e) {
      return date;
    }
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
                      <i className="bi bi-people" style={{ marginRight: "10px" }}></i>
                      All Customers
                    </h3>
                    <p style={{ color: "#6c757d", fontSize: "14px" }}>View all registered customers and their details.</p>
                    <small className="text-muted">Filter: {filter === "all" ? "All Customers" : filter === "active" ? "Active" : "Inactive"}</small>
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
                          <label className="me-2 fw-semibold" htmlFor="customer-search">Search:</label>
                          <Form.Control
                            type="text"
                            id="customer-search"
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
                              <th>Image</th>
                              <th>Name</th>
                              <th>Email</th>
                              <th>Mobile</th>
                              <th>Location</th>
                              <th>Status</th>
                              <th>Created</th>
                              <th>View</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedCustomers.length === 0 ? (
                              <tr>
                                <td colSpan={9} className="text-center">No customers found.</td>
                              </tr>
                            ) : (
                              paginatedCustomers.map((customer, index) => (
                                <tr key={customer.unique_id}>
                                  <td>{(currentPage - 1) * customersPerPage + index + 1}</td>
                                  <td>
                                    {customer.image ? (
                                      <img
                                        src={
                                          customer.image.startsWith('http')
                                            ? customer.image
                                            : `https://mahadevaaya.com/spindo/spindobackend/media/customer_images/${customer.image}`
                                        }
                                        alt="customer"
                                        style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }}
                                      />
                                    ) : (
                                      <i className="bi bi-person-circle" style={{ fontSize: 24 }}></i>
                                    )}
                                  </td>
                                  <td>{customer.username}</td>
                                  <td>{customer.email}</td>
                                  <td>{customer.mobile_number}</td>
                                  <td>{customer.state}, {customer.district}</td>
                                  <td>
                                    <span className={`badge ${customer.is_active ? 'bg-success' : 'bg-danger'}`}>
                                      {customer.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                  </td>
                                  <td>{formatDate(customer.created_at)}</td>
                                  <td>
                                    <Button variant="outline-primary" size="sm" onClick={() => handleView(customer)}>
                                      <i className="bi bi-eye"></i> View
                                    </Button>
                                  </td>
                                </tr>
                              ))
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
                  {!loading && !error && customers.length === 0 && (
                    <Alert variant="info">No customers found</Alert>
                  )}

                  {/* Modal for customer details */}
                  <Modal show={showModal} onHide={handleCloseModal} centered size="lg">
                    <Modal.Header closeButton>
                      <Modal.Title>Customer Details</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                      {selectedCustomer && (
                        <div>
                          <Row>
                            <Col md={6}>
                              <p><strong>Name:</strong> {selectedCustomer.username}</p>
                              <p><strong>Email:</strong> {selectedCustomer.email}</p>
                              <p><strong>Mobile:</strong> {selectedCustomer.mobile_number}</p>
                              <p><strong>Location:</strong> {selectedCustomer.state}, {selectedCustomer.district}</p>
                              <p><strong>Status:</strong> <span className={`badge ${selectedCustomer.is_active ? 'bg-success' : 'bg-danger'}`}>
                                {selectedCustomer.is_active ? 'Active' : 'Inactive'}
                              </span></p>
                            </Col>
                            <Col md={6}>
                              <p><strong>Created At:</strong> {formatDate(selectedCustomer.created_at)}</p>
                              {selectedCustomer.image && (
                                <div className="mt-3">
                                  <img
                                    src={
                                      selectedCustomer.image.startsWith('http')
                                        ? selectedCustomer.image
                                        : `https://mahadevaaya.com/spindo/spindobackend/media/customer_images/${selectedCustomer.image}`
                                    }
                                    alt="Customer"
                                    style={{ width: '100px', height: '100px', borderRadius: '8px', objectFit: 'cover' }}
                                  />
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

export default AllCustomers;
