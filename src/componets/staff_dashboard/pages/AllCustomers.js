import React, { useState, useEffect } from "react";
import { Container, Table, Button, Spinner, Alert, Row, Col } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import StaffLeftNav from "../StaffLeftNav";
import StaffHeader from "../StaffHeader";
import { useAuth } from "../../context/AuthContext";
import "../../../assets/css/table.css";

const AllCustomers = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
        <div style={{ width: '100%', borderBottom: '1px solid #e0e0e0', marginBottom: 12, padding: '2px 0 2px 0', background: 'transparent', minHeight: 0, display: 'flex', alignItems: 'center' }} className="responsive-admin-header">
          <span style={{ fontSize: 'clamp(12px, 5vw, 18px)', fontWeight: 600, color: '#222', letterSpacing: '0.5px', paddingLeft: 4 }}>All Customers</span>
        </div>
        <Container fluid className="dashboard-body dashboard-main-container">
          <Row className="mb-3">
            <Col xs={12} sm={6}>
              <Button 
                variant="outline-secondary" 
                onClick={() => navigate('/StaffDashBoard')}
                className="me-2"
              >
                <i className="bi bi-arrow-left me-2"></i> Back to Dashboard
              </Button>
            </Col>
            <Col xs={12} sm={6} className="text-end">
              <small className="text-muted">Filter: {filter === "all" ? "All Customers" : filter === "active" ? "Active" : "Inactive"}</small>
            </Col>
          </Row>

          {loading ? (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
              <Spinner animation="border" variant="primary" />
            </div>
          ) : error ? (
            <Alert variant="danger">{error}</Alert>
          ) : customers.length === 0 ? (
            <Alert variant="info">No customers found</Alert>
          ) : (
            <div className="table-responsive">
              <Table striped bordered hover>
                <thead style={{ backgroundColor: '#2b6777', color: 'white' }}>
                  <tr>
                    <th>#</th>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Mobile</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer, index) => (
                    <tr key={customer.unique_id}>
                      <td>{index + 1}</td>
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
                      <td>{new Date(customer.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Container>
      </div>
    </div>
  );
};

export default AllCustomers;
