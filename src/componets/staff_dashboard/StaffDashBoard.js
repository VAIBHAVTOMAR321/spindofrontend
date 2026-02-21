import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Spinner, Alert } from "react-bootstrap";
import { Link } from "react-router-dom";
import "../../assets/css/admindashboard.css";
import StaffLeftNav from "./StaffLeftNav";
import StaffHeader from "./StaffHeader";
import { useAuth } from "../context/AuthContext";

const StaffDashBoard = () => {
  // Device width state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
  const [vendorCount, setVendorCount] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);
  const [totalRequests, setTotalRequests] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [completedRequests, setCompletedRequests] = useState(0);
  const [totalStaffQueries, setTotalStaffQueries] = useState(0);
  const [acceptedStaffQueries, setAcceptedStaffQueries] = useState(0);
  const [pendingStaffQueries, setPendingStaffQueries] = useState(0);
  const [rejectedStaffQueries, setRejectedStaffQueries] = useState(0);
  const { user, tokens } = useAuth();

  // Fetch counts from APIs
  useEffect(() => {
    if (!user?.uniqueId) {
      setError("Staff not logged in or missing unique ID.");
      setLoading(false);
      return;
    }
    setLoading(true);
    
    // Profile
    fetch(`https://mahadevaaya.com/spindo/spindobackend/api/staffadmin/register/?unique_id=${user.uniqueId}`, {
      headers: tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {}
    })
      .then(res => res.json())
      .then(data => {
        if (data.status && data.data) {
          setProfile(data.data);
        } else {
          setError("Failed to load staff profile.");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Error fetching staff profile.");
        setLoading(false);
      });
    
    // Vendors count
    fetch(`https://mahadevaaya.com/spindo/spindobackend/api/vendor/register/`, {
      headers: tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {}
    })
      .then(res => res.json())
      .then(data => {
        if (data.status && Array.isArray(data.data)) {
          setVendorCount(data.data.length);
        } else {
          setVendorCount(0);
        }
      })
      .catch(() => {
        setVendorCount(0);
      });
    
    // Customers count
    fetch(`https://mahadevaaya.com/spindo/spindobackend/api/customer/register/`, {
      headers: tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {}
    })
      .then(res => res.json())
      .then(data => {
        if (data.status && Array.isArray(data.data)) {
          setCustomerCount(data.data.length);
        } else {
          setCustomerCount(0);
        }
      })
      .catch(() => {
        setCustomerCount(0);
      });
    
    // Service Requests
    fetch(`https://mahadevaaya.com/spindo/spindobackend/api/customer/requestservices/`, {
      headers: tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {}
    })
      .then(res => res.json())
      .then(data => {
        if (data.data && Array.isArray(data.data)) {
          setTotalRequests(data.data.length);
          setPendingRequests(data.data.filter(r => (r.status || '').toLowerCase() === 'pending').length);
          setCompletedRequests(data.data.filter(r => (r.status || '').toLowerCase() === 'completed').length);
        } else {
          setTotalRequests(0);
          setPendingRequests(0);
          setCompletedRequests(0);
        }
      })
      .catch(() => {
        setTotalRequests(0);
        setPendingRequests(0);
        setCompletedRequests(0);
      });
    
    // Queries - Staff Queries
    fetch(`https://mahadevaaya.com/spindo/spindobackend/api/staffadmin/issue/?unique_id=${user.uniqueId}`, {
      headers: tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {}
    })
      .then(res => res.json())
      .then(data => {
        // Check if data is an array or has data property
        let queriesData = [];
        if (Array.isArray(data)) {
          queriesData = data;
        } else if (data.status && Array.isArray(data.data)) {
          queriesData = data.data;
        } else {
          // If single object is returned, wrap in array
          queriesData = [data];
        }
        
        setTotalStaffQueries(queriesData.length);
                setAcceptedStaffQueries(queriesData.filter(q => (q.status || '').toLowerCase() === 'accepted').length);
        setPendingStaffQueries(queriesData.filter(q => (q.status || '').toLowerCase() === 'pending').length);
        setRejectedStaffQueries(queriesData.filter(q => (q.status || '').toLowerCase() === 'rejected').length);
      })
      .catch(() => {
        setTotalStaffQueries(0);
         setAcceptedStaffQueries(0);
        setPendingStaffQueries(0);
        setRejectedStaffQueries(0);
      });
  }, [user, tokens]);

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
        {/* Minimal Header Row */}
        <div style={{ width: '100%', borderBottom: '1px solid #e0e0e0', marginBottom: 12, padding: '2px 0 2px 0', background: 'transparent', minHeight: 0, display: 'flex', alignItems: 'center' }} className="responsive-admin-header">
          <span style={{ fontSize: 'clamp(12px, 5vw, 18px)', fontWeight: 600, color: '#222', letterSpacing: '0.5px', paddingLeft: 4 }}>Staff</span>
        </div>
        <Container fluid className="dashboard-body dashboard-main-container">
          {/* Profile | Vendors & Customers layout */}
          <Row className="g-2" style={{ margin: 0, width: '100%' }}>
            {/* Profile Card - left column */}
            <Col xs={12} sm={12} md={6} lg={4}>
              <Card className="shadow-sm border-0 rounded-3 p-2 h-100 animate__animated animate__fadeIn">
                <Card.Body className="d-flex flex-column align-items-center p-2">
                  {loading ? (
                    <Spinner animation="border" variant="primary" size="sm" />
                  ) : error ? (
                    <Alert variant="danger" className="mb-2" style={{ fontSize: 'clamp(11px, 2vw, 13px)' }}>{error}</Alert>
                  ) : profile ? (
                    <>
                      <div style={{ width: 'clamp(50px, 12vw, 70px)', height: 'clamp(50px, 12vw, 70px)', borderRadius: '50%', overflow: 'hidden', border: '2px solid #2b6777', marginBottom: 8 }}>
                        {profile.staff_image ? (
                          <img
                            src={
                              profile.staff_image.startsWith('http')
                                ? profile.staff_image
                                : profile.staff_image.startsWith('/media/')
                                  ? `https://mahadevaaya.com/spindo/spindobackend${profile.staff_image}`
                                  : `https://mahadevaaya.com/spindo/spindobackend/media/staff_images/${profile.staff_image}`
                            }
                            alt="Profile"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <span className="d-flex align-items-center justify-content-center h-100 w-100" style={{ color: '#aaa', fontSize: 32 }}>
                            <i className="bi bi-person-circle"></i>
                          </span>
                        )}
                      </div>
                      <h6 className="fw-bold mb-1 text-center" style={{ fontSize: 'clamp(13px, 2vw, 15px)' }}>Welcome, {profile.can_name || profile.username || "Staff"}!</h6>
                      <div className="text-muted mb-1" style={{ fontSize: 'clamp(10px, 1.8vw, 12px)' }}>{profile.email}</div>
                      <div className="mb-0" style={{ fontSize: 'clamp(10px, 1.8vw, 12px)' }}><b>Mobile:</b> {profile.mobile_number}</div>
                      <div className="mb-2" style={{ fontSize: 'clamp(10px, 1.8vw, 12px)' }}>
                        <b>Location:</b> {profile.address || (profile.state && profile.district && profile.block ? `${profile.state}, ${profile.district}, ${profile.block}` : profile.state || profile.district || profile.block || 'N/A')}
                      </div>
                      <Link to="/StaffProfile">
                        <Button variant="outline-primary" size="sm" className="mt-1" style={{ fontSize: 'clamp(11px, 2vw, 13px)' }}>View Profile</Button>
                      </Link>
                       <Link to="/VendorRegistration">
                    <Button variant="primary" size="sm" style={{ fontSize: 'clamp(11px, 2vw, 13px)' }} className="mt-4">
                      <i className="bi bi-plus-circle me-1"></i> Add Vendor
                    </Button>
                  </Link>
                    </>
                  ) : null}
                </Card.Body>
              </Card>
            </Col>

            {/* Vendors & Requests stacked in right column */}
            <Col xs={12} sm={12} md={6} lg={8}>
               {/* Vendors Section */}
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="fw-bold" style={{ color: '#2b6777', letterSpacing: 0.5, fontSize: 'clamp(13px, 2.5vw, 16px)' }}>Users Management</h6>
                 
                </div>
                <Row className="g-2 mb-2" style={{ margin: 0 }}>
                  <Col xs={12} sm={6} md={6} lg={6}>
                    <Link to="/AllVendors" state={{ viewType: 'vendors' }} style={{ textDecoration: 'none' }}>
                      <Card className="stat-card text-center animate__animated animate__fadeIn border-0" style={{ cursor: 'pointer', minHeight: 95, padding: '10px 8px' }}>
                        <Card.Body className="d-flex flex-column align-items-center justify-content-center p-1">
                          <div className="stat-icon mb-1 d-flex align-items-center justify-content-center" style={{ background: '#e3fcec', color: '#28a745', width: 28, height: 28, borderRadius: '50%' }}>
                            <i className="bi bi-shop" style={{ fontSize: 14 }}></i>
                          </div>
                          <div className="stat-title fw-semibold mb-1" style={{ fontSize: 'clamp(10px, 1.8vw, 12px)' }}>Total Vendors</div>
                          <div className="stat-value fw-bold" style={{ fontSize: 'clamp(14px, 2.5vw, 18px)', color: '#1a73e8' }}>{vendorCount}</div>
                        </Card.Body>
                      </Card>
                    </Link>
                  </Col>
                  <Col xs={12} sm={6} md={6} lg={6}>
                    <Link to="/AllCustomers" style={{ textDecoration: 'none' }}>
                      <Card className="stat-card text-center animate__animated animate__fadeIn border-0" style={{ cursor: 'pointer', minHeight: 95, padding: '10px 8px' }}>
                        <Card.Body className="d-flex flex-column align-items-center justify-content-center p-1">
                          <div className="stat-icon mb-1 d-flex align-items-center justify-content-center" style={{ background: '#fff3cd', color: '#ff9800', width: 28, height: 28, borderRadius: '50%' }}>
                            <i className="bi bi-people" style={{ fontSize: 14 }}></i>
                          </div>
                          <div className="stat-title fw-semibold mb-1" style={{ fontSize: 'clamp(10px, 1.8vw, 12px)' }}>Total Customers</div>
                          <div className="stat-value fw-bold" style={{ fontSize: 'clamp(14px, 2.5vw, 18px)', color: '#1a73e8' }}>{customerCount}</div>
                        </Card.Body>
                      </Card>
                    </Link>
                  </Col>
                </Row>
              </div>

              {/* Requests Section */}
              <div className="mb-3">
                <h6 className="fw-bold mb-2" style={{ color: '#2b6777', letterSpacing: 0.5, fontSize: 'clamp(13px, 2.5vw, 16px)' }}>Service Requests</h6>
                <Row className="g-2 mb-2" style={{ margin: 0 }}>
                  <Col xs={12} sm={6} md={6} lg={4}>
                    <Link to="/StaffServicesRequest" style={{ textDecoration: 'none' }}>
                      <Card className="stat-card text-center border-0" style={{ cursor: 'pointer', minHeight: 95, padding: '10px 8px' }}>
                        <Card.Body className="d-flex flex-column align-items-center justify-content-center p-1">
                          <div className="stat-icon mb-1 d-flex align-items-center justify-content-center" style={{ background: '#fff3cd', color: '#ff9800', width: 28, height: 28, borderRadius: '50%' }}>
                            <i className="bi bi-list-task" style={{ fontSize: 14 }}></i>
                          </div>
                          <div className="stat-title fw-semibold mb-1" style={{ fontSize: 'clamp(10px, 1.8vw, 12px)' }}>Total Requests</div>
                          <div className="stat-value fw-bold" style={{ fontSize: 'clamp(14px, 2.5vw, 18px)', color: '#1a73e8' }}>{totalRequests}</div>
                        </Card.Body>
                      </Card>
                    </Link>
                  </Col>
                  <Col xs={12} sm={6} md={6} lg={4}>
                    <Link to="/StaffServicesRequest" state={{ filter: 'Pending' }} style={{ textDecoration: 'none' }}>
                      <Card className="stat-card text-center border-0" style={{ cursor: 'pointer', minHeight: 95, padding: '10px 8px' }}>
                        <Card.Body className="d-flex flex-column align-items-center justify-content-center p-1">
                          <div className="stat-icon mb-1 d-flex align-items-center justify-content-center" style={{ background: '#c7d2fe', color: '#3730a3', width: 28, height: 28, borderRadius: '50%' }}>
                            <i className="bi bi-hourglass-split" style={{ fontSize: 14 }}></i>
                          </div>
                          <div className="stat-title fw-semibold mb-1" style={{ fontSize: 'clamp(10px, 1.8vw, 12px)' }}>Pending</div>
                          <div className="stat-value fw-bold" style={{ fontSize: 'clamp(14px, 2.5vw, 18px)', color: '#1a73e8' }}>{pendingRequests}</div>
                        </Card.Body>
                      </Card>
                    </Link>
                  </Col>
                  <Col xs={12} sm={6} md={6} lg={4}>
                    <Link to="/StaffCompleteRequest" style={{ textDecoration: 'none' }}>
                      <Card className="stat-card text-center border-0" style={{ cursor: 'pointer', minHeight: 95, padding: '10px 8px' }}>
                        <Card.Body className="d-flex flex-column align-items-center justify-content-center p-1">
                          <div className="stat-icon mb-1 d-flex align-items-center justify-content-center" style={{ background: '#e3fcec', color: '#28a745', width: 28, height: 28, borderRadius: '50%' }}>
                            <i className="bi bi-check-circle" style={{ fontSize: 14 }}></i>
                          </div>
                          <div className="stat-title fw-semibold mb-1" style={{ fontSize: 'clamp(10px, 1.8vw, 12px)' }}>Completed</div>
                          <div className="stat-value fw-bold" style={{ fontSize: 'clamp(14px, 2.5vw, 18px)', color: '#1a73e8' }}>{completedRequests}</div>
                        </Card.Body>
                      </Card>
                    </Link>
                  </Col>
                </Row>
              </div>

              {/* Queries Section */}
              <div>
                <h6 className="fw-bold mb-2" style={{ color: '#2b6777', letterSpacing: 0.5, fontSize: 'clamp(13px, 2.5vw, 16px)' }}>Staff Queries</h6>
                <Row className="g-2" style={{ margin: 0 }}>
                   <Col xs={12} sm={6} md={4}>
                    <Link to="/StaffQueryView" state={{ filter: 'Accepted' }} style={{ textDecoration: 'none' }}>
                      <Card className="stat-card text-center border-0" style={{ cursor: 'pointer', minHeight: 95, padding: '10px 8px' }}>
                        <Card.Body className="d-flex flex-column align-items-center justify-content-center p-1">
                          <div className="stat-icon mb-1 d-flex align-items-center justify-content-center" style={{ background: '#e3fcec', color: '#28a745', width: 28, height: 28, borderRadius: '50%' }}>
                            <i className="bi bi-check-circle" style={{ fontSize: 14 }}></i>
                          </div>
                          <div className="stat-title fw-semibold mb-1" style={{ fontSize: 'clamp(10px, 1.8vw, 12px)' }}>Accepted</div>
                          <div className="stat-value fw-bold" style={{ fontSize: 'clamp(14px, 2.5vw, 18px)', color: '#1a73e8' }}>{acceptedStaffQueries}</div>
                        </Card.Body>
                      </Card>
                    </Link>
                  </Col>
                  <Col xs={12} sm={6} md={4}>
                    <Link to="/StaffQueryView" state={{ filter: 'Pending' }} style={{ textDecoration: 'none' }}>
                      <Card className="stat-card text-center border-0" style={{ cursor: 'pointer', minHeight: 95, padding: '10px 8px' }}>
                        <Card.Body className="d-flex flex-column align-items-center justify-content-center p-1">
                          <div className="stat-icon mb-1 d-flex align-items-center justify-content-center" style={{ background: '#fff3cd', color: '#ff9800', width: 28, height: 28, borderRadius: '50%' }}>
                            <i className="bi bi-hourglass-split" style={{ fontSize: 14 }}></i>
                          </div>
                          <div className="stat-title fw-semibold mb-1" style={{ fontSize: 'clamp(10px, 1.8vw, 12px)' }}>Pending</div>
                          <div className="stat-value fw-bold" style={{ fontSize: 'clamp(14px, 2.5vw, 18px)', color: '#1a73e8' }}>{pendingStaffQueries}</div>
                        </Card.Body>
                      </Card>
                    </Link>
                  </Col>
                  <Col xs={12} sm={6} md={4}>
                    <Link to="/StaffQueryView" state={{ filter: 'Rejected' }} style={{ textDecoration: 'none' }}>
                      <Card className="stat-card text-center border-0" style={{ cursor: 'pointer', minHeight: 95, padding: '10px 8px' }}>
                        <Card.Body className="d-flex flex-column align-items-center justify-content-center p-1">
                          <div className="stat-icon mb-1 d-flex align-items-center justify-content-center" style={{ background: '#ffe3e3', color: '#e53935', width: 28, height: 28, borderRadius: '50%' }}>
                            <i className="bi bi-x-circle" style={{ fontSize: 14 }}></i>
                          </div>
                          <div className="stat-title fw-semibold mb-1" style={{ fontSize: 'clamp(10px, 1.8vw, 12px)' }}>Rejected</div>
                          <div className="stat-value fw-bold" style={{ fontSize: 'clamp(14px, 2.5vw, 18px)', color: '#1a73e8' }}>{rejectedStaffQueries}</div>
                        </Card.Body>
                      </Card>
                    </Link>
                  </Col>
                </Row>
              </div>
            </Col>
          </Row>

          {/* Quick Stats Summary */}
          <Row className="mt-3 g-2" style={{ margin: 0 }}>
            <Col xs={12}>
              <Card className="border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <Card.Body className="p-3">
                  <Row className="text-center">
                    <Col xs={6} sm={6} md={3}>
                      <Link to="/StaffQueryView" state={{ filter: 'all' }} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div className="mb-1" style={{ fontSize: 'clamp(12px, 2vw, 14px)', fontWeight: 600, cursor: 'pointer' }}>All Queries</div>
                        <div style={{ fontSize: 'clamp(16px, 3vw, 22px)', fontWeight: 700, cursor: 'pointer' }}>{totalStaffQueries}</div>
                      </Link>
                    </Col>
                    <Col xs={6} sm={6} md={3}>
                      <Link to="/StaffQueryView" state={{ filter: 'pending' }} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div className="mb-1" style={{ fontSize: 'clamp(12px, 2vw, 14px)', fontWeight: 600, cursor: 'pointer' }}>Pending</div>
                        <div style={{ fontSize: 'clamp(16px, 3vw, 22px)', fontWeight: 700, cursor: 'pointer' }}>{pendingStaffQueries}</div>
                      </Link>
                    </Col>
                    <Col xs={6} sm={6} md={3}>
                      <Link to="/StaffQueryView" state={{ filter: 'accepted' }} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div className="mb-1" style={{ fontSize: 'clamp(12px, 2vw, 14px)', fontWeight: 600, cursor: 'pointer' }}>Accepted</div>
                        <div style={{ fontSize: 'clamp(16px, 3vw, 22px)', fontWeight: 700, cursor: 'pointer' }}>{acceptedStaffQueries}</div>
                      </Link>
                    </Col>
                    <Col xs={6} sm={6} md={3}>
                      <Link to="/StaffQueryView" state={{ filter: 'rejected' }} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div className="mb-1" style={{ fontSize: 'clamp(12px, 2vw, 14px)', fontWeight: 600, cursor: 'pointer' }}>Rejected</div>
                        <div style={{ fontSize: 'clamp(16px, 3vw, 22px)', fontWeight: 700, cursor: 'pointer' }}>{rejectedStaffQueries}</div>
                      </Link>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  );
};

export default StaffDashBoard;
