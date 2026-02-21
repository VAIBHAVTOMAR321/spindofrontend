
import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Spinner, Alert } from "react-bootstrap";
import "../../assets/css/admindashboard.css";
import VendorHeader from "./VendorHeader";
import VendorLeftNav from "./VendorLeftNav";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const VendorDashBoard = () => {
  // Device width state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
  const [completedRequestCount, setCompletedRequestCount] = useState(0);
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const [assignedRequestCount, setAssignedRequestCount] = useState(0);
  const [billCount, setBillCount] = useState(0);
  const [paidBillCount, setPaidBillCount] = useState(0);
  const [unpaidBillCount, setUnpaidBillCount] = useState(0);
  const [cancelledRequestCount, setCancelledRequestCount] = useState(0);
  const [queryCount, setQueryCount] = useState(0);
  const [approvedQueryCount, setApprovedQueryCount] = useState(0);
  const [pendingQueryCount, setPendingQueryCount] = useState(0);
  const [rejectedQueryCount, setRejectedQueryCount] = useState(0);
  const { user, tokens } = useAuth();

  // Fetch counts from other components
  useEffect(() => {
    if (!user?.uniqueId) {
      setError("Vendor not logged in or missing unique ID.");
      setLoading(false);
      return;
    }
    setLoading(true);
    // Profile
    fetch(`https://mahadevaaya.com/spindo/spindobackend/api/vendor/register/?unique_id=${user.uniqueId}`, {
      headers: tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {}
    })
      .then(res => res.json())
      .then(data => {
        if (data.status && data.data) {
          setProfile(data.data);
        } else {
          setError("Failed to load vendor profile.");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Error fetching vendor profile.");
        setLoading(false);
      });
    // Requests (reference VendorRequests logic)
    fetch(`https://mahadevaaya.com/spindo/spindobackend/api/customer/requestservices/?vendor_id=${user.uniqueId}`, {
      headers: tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {}
    })
      .then(res => res.json())
      .then(data => {
        if (data.data && Array.isArray(data.data)) {
          const vendorId = user.uniqueId;
          // Count requests based on assignment status for this vendor
          setCompletedRequestCount(data.data.filter(r => Array.isArray(r.assignments) && r.assignments.some(a => Array.isArray(a) && a[1] === vendorId && (a[3] || '').toLowerCase() === 'completed')).length);
          setPendingRequestCount(data.data.filter(r => Array.isArray(r.assignments) && r.assignments.some(a => Array.isArray(a) && a[1] === vendorId && (a[3] || '').toLowerCase() === 'pending')).length);
          setAssignedRequestCount(data.data.filter(r => Array.isArray(r.assignments) && r.assignments.some(a => Array.isArray(a) && a[1] === vendorId && (a[3] || '').toLowerCase() === 'assigned')).length);
          setCancelledRequestCount(data.data.filter(r => Array.isArray(r.assignments) && r.assignments.some(a => Array.isArray(a) && a[1] === vendorId && (a[3] || '').toLowerCase() === 'cancelled')).length);
        } else {
          setCompletedRequestCount(0);
          setPendingRequestCount(0);
          setAssignedRequestCount(0);
          setCancelledRequestCount(0);
        }
      })
      .catch(() => {
        setCompletedRequestCount(0);
        setPendingRequestCount(0);
        setAssignedRequestCount(0);
        setCancelledRequestCount(0);
      });
    // Bills (fetch from /api/billing/?vendor_id=...)
    fetch(`https://mahadevaaya.com/spindo/spindobackend/api/billing/?vendor_id=${user.uniqueId}`, {
      headers: tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {}
    })
      .then(res => res.json())
      .then(data => {
        if (data.data && Array.isArray(data.data)) {
          setBillCount(data.data.length);
          setPaidBillCount(data.data.filter(b => (b.status || '').toLowerCase() === 'paid').length);
          setUnpaidBillCount(data.data.filter(b => (b.status || '').toLowerCase() === 'unpaid').length);
        } else {
          setBillCount(0);
          setPaidBillCount(0);
          setUnpaidBillCount(0);
        }
      })
      .catch(() => {
        setBillCount(0);
        setPaidBillCount(0);
        setUnpaidBillCount(0);
      });
    // Queries
    fetch(`https://mahadevaaya.com/spindo/spindobackend/api/vendor/request/?unique_id=${user.uniqueId}`, {
      headers: tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {}
    })
      .then(res => res.json())
      .then(data => {
        if (data.status && Array.isArray(data.data)) {
          setQueryCount(data.data.length);
          setApprovedQueryCount(data.data.filter(q => (q.status || '').toLowerCase() === 'approved').length);
          setPendingQueryCount(data.data.filter(q => (q.status || '').toLowerCase() === 'pending').length);
          setRejectedQueryCount(data.data.filter(q => (q.status || '').toLowerCase() === 'rejected').length);
        } else {
          setQueryCount(0);
          setApprovedQueryCount(0);
          setPendingQueryCount(0);
          setRejectedQueryCount(0);
        }
      })
      .catch(() => {
        setQueryCount(0);
        setApprovedQueryCount(0);
        setPendingQueryCount(0);
        setRejectedQueryCount(0);
      });
  }, [user, tokens]);

  // Show most recent 3 queries
  const [recentQueries, setRecentQueries] = useState([]);
  useEffect(() => {
    // Fetch recent queries
    if (!user?.uniqueId) return;
    fetch(`https://mahadevaaya.com/spindo/spindobackend/api/vendor/request/?unique_id=${user.uniqueId}`, {
      headers: tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {}
    })
      .then(res => res.json())
      .then(data => {
        if (data.status && Array.isArray(data.data)) {
          const sorted = [...data.data].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
          setRecentQueries(sorted.slice(0, 3));
        } else {
          setRecentQueries([]);
        }
      })
      .catch(() => setRecentQueries([]));
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
      <VendorLeftNav
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isMobile={isMobile}
        isTablet={isTablet}
      />
      <div className="main-content-dash">
        <VendorHeader toggleSidebar={toggleSidebar} />
        {/* Thin header line with 'Vendor' text, styled like admin dashboard */}
        <div style={{ width: '100%', borderBottom: '1px solid #e0e0e0', marginBottom: 12, padding: '2px 0 2px 0', background: 'transparent', minHeight: 0, display: 'flex', alignItems: 'center' }} className="responsive-admin-header">
          <span style={{ fontSize: 'clamp(12px, 5vw, 18px)', fontWeight: 600, color: '#222', letterSpacing: '0.5px', paddingLeft: 4 }}>Vendor</span>
        </div>
        <Container fluid className="dashboard-body dashboard-main-container">
          {/* Profile | Requests & Bills layout */}
          <Row className=" g-2" style={{ margin: 0, width: '100%' }}>
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
                        {(() => {
                          let vendorImageUrl = "";
                          if (profile.vendor_image) {
                            if (profile.vendor_image.startsWith("http")) {
                              vendorImageUrl = profile.vendor_image;
                            } else if (profile.vendor_image.startsWith("/media/")) {
                              vendorImageUrl = `https://mahadevaaya.com/spindo/spindobackend${profile.vendor_image}`;
                            } else {
                              vendorImageUrl = `https://mahadevaaya.com/spindo/spindobackend/media/vendor_images/${profile.vendor_image}`;
                            }
                          }
                          if (vendorImageUrl) {
                            return (
                              <img
                                src={vendorImageUrl}
                                alt="Profile"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            );
                          } else {
                            return (
                              <span className="d-flex align-items-center justify-content-center h-100 w-100" style={{ color: '#aaa', fontSize: 32 }}>
                                <i className="bi bi-person-circle"></i>
                              </span>
                            );
                          }
                        })()}
                      </div>
                      <h6 className="fw-bold mb-1 text-center" style={{ fontSize: 'clamp(13px, 2vw, 15px)' }}>Welcome, {profile.username || "Vendor"}!</h6>
                      <div className="text-muted mb-1" style={{ fontSize: 'clamp(10px, 1.8vw, 12px)' }}>{profile.email}</div>
                      <div className="mb-0" style={{ fontSize: 'clamp(10px, 1.8vw, 12px)' }}><b>Mobile:</b> {profile.mobile_number}</div>
                      <div className="mb-2" style={{ fontSize: 'clamp(10px, 1.8vw, 12px)' }}><b>Location:</b> {profile.state}, {profile.district}, {profile.block}</div>
                      <Link to="/VendorProfile">
                        <Button variant="outline-primary" size="sm" className="mt-1" style={{ fontSize: 'clamp(11px, 2vw, 13px)' }}>View Profile</Button>
                      </Link>
                      {/* Quick Actions below profile */}
                      <div className="w-100 mt-3">
                        <Card
                          className="quick-actions-card h-100 border-0"
                          style={(!isMobile && !isTablet) ? { marginTop: '60px' } : {}}
                        >
                          <Card.Body className="d-flex flex-column align-items-center justify-content-center p-2">
                            <h6 className="mb-2 fw-bold" style={{ fontSize: 'clamp(12px, 2vw, 14px)' }}>Quick Actions</h6>
                            <Link to="/GenerateVendorQuery" className="w-100 mb-1" style={{ textDecoration: 'none' }}>
                              <Button variant="primary" className="w-100" size="sm" style={{ fontSize: 'clamp(11px, 2vw, 13px)', padding: '6px 8px' }}>
                                <i className="bi bi-plus-circle me-1"></i> New Query
                              </Button>
                            </Link>
                            <Link to="/VendorAllQueries" className="w-100 mb-1" style={{ textDecoration: 'none' }}>
                              <Button variant="outline-primary" className="w-100" size="sm" style={{ fontSize: 'clamp(11px, 2vw, 13px)', padding: '6px 8px' }}>
                                <i className="bi bi-list-task me-1"></i> View Queries
                              </Button>
                            </Link>
                            <Link to="/VendorProfile" className="w-100" style={{ textDecoration: 'none' }}>
                              <Button variant="outline-secondary" className="w-100" size="sm" style={{ fontSize: 'clamp(11px, 2vw, 13px)', padding: '6px 8px' }}>
                                <i className="bi bi-person me-1"></i> Edit Profile
                              </Button>
                            </Link>
                          </Card.Body>
                        </Card>
                      </div>
                    </>
                  ) : null}
                </Card.Body>
              </Card>
            </Col>

            {/* Requests & Bills stacked in right column */}
            <Col xs={12} sm={12} md={6} lg={8}>
              {/* Requests Section */}
              <div className="mb-3">
                  <h6 className="fw-bold mb-2" style={{ color: '#2b6777', letterSpacing: 0.5, fontSize: 'clamp(13px, 2.5vw, 16px)' }}>Requests</h6>
                  <Row className="g-2 mb-2" style={{ margin: 0 }}>
                    <Col xs={12} sm={6} md={6} lg={3}>
                      <Link to="/VendorRequests" state={{ filter: 'Completed' }} style={{ textDecoration: 'none' }}>
                        <Card className="stat-card text-center animate__animated animate__fadeIn border-0" style={{ cursor: 'pointer', minHeight: 95, padding: '10px 8px' }}>
                          <Card.Body className="d-flex flex-column align-items-center justify-content-center p-1">
                            <div className="stat-icon mb-1 d-flex align-items-center justify-content-center" style={{ background: '#e3fcec', color: '#28a745', width: 28, height: 28, borderRadius: '50%' }}>
                              <i className="bi bi-check-circle" style={{ fontSize: 14 }}></i>
                            </div>
                            <div className="stat-title fw-semibold mb-1" style={{ fontSize: 'clamp(10px, 1.8vw, 12px)' }}>Completed</div>
                            <div className="stat-value fw-bold" style={{ fontSize: 'clamp(14px, 2.5vw, 18px)', color: '#1a73e8' }}>{completedRequestCount}</div>
                          </Card.Body>
                        </Card>
                      </Link>
                    </Col>
                    <Col xs={12} sm={6} md={6} lg={3}>
                      <Link to="/VendorRequests" state={{ filter: 'Pending' }} style={{ textDecoration: 'none' }}>
                        <Card className="stat-card text-center animate__animated animate__fadeIn border-0" style={{ cursor: 'pointer', minHeight: 95, padding: '10px 8px' }}>
                          <Card.Body className="d-flex flex-column align-items-center justify-content-center p-1">
                            <div className="stat-icon mb-1 d-flex align-items-center justify-content-center" style={{ background: '#fff3cd', color: '#ff9800', width: 28, height: 28, borderRadius: '50%' }}>
                              <i className="bi bi-hourglass-split" style={{ fontSize: 14 }}></i>
                            </div>
                            <div className="stat-title fw-semibold mb-1" style={{ fontSize: 'clamp(10px, 1.8vw, 12px)' }}>Pending</div>
                            <div className="stat-value fw-bold" style={{ fontSize: 'clamp(14px, 2.5vw, 18px)', color: '#1a73e8' }}>{pendingRequestCount}</div>
                          </Card.Body>
                        </Card>
                      </Link>
                    </Col>
                    <Col xs={12} sm={6} md={6} lg={3}>
                      <Link to="/VendorRequests" state={{ filter: 'Assigned' }} style={{ textDecoration: 'none' }}>
                        <Card className="stat-card text-center animate__animated animate__fadeIn border-0" style={{ cursor: 'pointer', minHeight: 95, padding: '10px 8px' }}>
                          <Card.Body className="d-flex flex-column align-items-center justify-content-center p-1">
                            <div className="stat-icon mb-1 d-flex align-items-center justify-content-center" style={{ background: '#c7d2fe', color: '#3730a3', width: 28, height: 28, borderRadius: '50%' }}>
                              <i className="bi bi-person-check" style={{ fontSize: 14 }}></i>
                            </div>
                            <div className="stat-title fw-semibold mb-1" style={{ fontSize: 'clamp(10px, 1.8vw, 12px)' }}>Assigned</div>
                            <div className="stat-value fw-bold" style={{ fontSize: 'clamp(14px, 2.5vw, 18px)', color: '#1a73e8' }}>{assignedRequestCount}</div>
                          </Card.Body>
                        </Card>
                      </Link>
                    </Col>
                    <Col xs={12} sm={6} md={6} lg={3}>
                      <Link to="/VendorRequests" state={{ filter: 'Cancelled' }} style={{ textDecoration: 'none' }}>
                        <Card className="stat-card text-center animate__animated animate__fadeIn border-0" style={{ cursor: 'pointer', minHeight: 95, padding: '10px 8px' }}>
                          <Card.Body className="d-flex flex-column align-items-center justify-content-center p-1">
                            <div className="stat-icon mb-1 d-flex align-items-center justify-content-center" style={{ background: '#ffe3e3', color: '#e53935', width: 28, height: 28, borderRadius: '50%' }}>
                              <i className="bi bi-x-circle" style={{ fontSize: 14 }}></i>
                            </div>
                            <div className="stat-title fw-semibold mb-1" style={{ fontSize: 'clamp(10px, 1.8vw, 12px)' }}>Cancelled</div>
                            <div className="stat-value fw-bold" style={{ fontSize: 'clamp(14px, 2.5vw, 18px)', color: '#1a73e8' }}>{cancelledRequestCount}</div>
                          </Card.Body>
                        </Card>
                      </Link>
                    </Col>
                  </Row>
                  <Row className="mb-1 g-2 justify-content-center" style={{ margin: 0 }}>
                 
                    <Col xs={12} sm={6} md={6} lg={6} className="mb-0">
                      <Link to="/VendorRequests" style={{ textDecoration: 'none' }}>
                        <Button variant="outline-primary" className="w-100" size="sm" style={{ fontSize: 'clamp(11px, 2vw, 13px)', padding: '6px 8px' }}>
                          <i className="bi bi-list-task me-1"></i> View Requests
                        </Button>
                      </Link>
                    </Col>
                  </Row>
                </div>
              {/* Bills Section */}
              <div className="mb-3">
                <h6 className="fw-bold mb-2" style={{ color: '#2b6777', letterSpacing: 0.5, fontSize: 'clamp(13px, 2.5vw, 16px)' }}>Bills</h6>
                <Row className="g-2 mb-2" style={{ margin: 0 }}>
                  <Col xs={12} sm={6} md={4}>
                    <Link to="/VendorAllBills" state={{ filter: 'Paid' }} style={{ textDecoration: 'none' }}>
                      <Card className="stat-card text-center border-0" style={{ cursor: 'pointer', minHeight: 95, padding: '10px 8px' }}>
                        <Card.Body className="d-flex flex-column align-items-center justify-content-center p-1">
                          <div className="stat-icon mb-1 d-flex align-items-center justify-content-center" style={{ background: '#e3fcec', color: '#28a745', width: 28, height: 28, borderRadius: '50%' }}>
                            <i className="bi bi-currency-rupee" style={{ fontSize: 14 }}></i>
                          </div>
                          <div className="stat-title fw-semibold mb-1" style={{ fontSize: 'clamp(10px, 1.8vw, 12px)' }}>Paid</div>
                          <div className="stat-value fw-bold" style={{ fontSize: 'clamp(14px, 2.5vw, 18px)', color: '#1a73e8' }}>{paidBillCount}</div>
                        </Card.Body>
                      </Card>
                    </Link>
                  </Col>
                  <Col xs={12} sm={6} md={4}>
                    <Link to="/VendorAllBills" state={{ filter: 'Unpaid' }} style={{ textDecoration: 'none' }}>
                      <Card className="stat-card text-center border-0" style={{ cursor: 'pointer', minHeight: 95, padding: '10px 8px' }}>
                        <Card.Body className="d-flex flex-column align-items-center justify-content-center p-1">
                          <div className="stat-icon mb-1 d-flex align-items-center justify-content-center" style={{ background: '#ffe3e3', color: '#e53935', width: 28, height: 28, borderRadius: '50%' }}>
                            <i className="bi bi-currency-rupee" style={{ fontSize: 14 }}></i>
                          </div>
                          <div className="stat-title fw-semibold mb-1" style={{ fontSize: 'clamp(10px, 1.8vw, 12px)' }}>Unpaid</div>
                          <div className="stat-value fw-bold" style={{ fontSize: 'clamp(14px, 2.5vw, 18px)', color: '#1a73e8' }}>{unpaidBillCount}</div>
                        </Card.Body>
                      </Card>
                    </Link>
                  </Col>
                  <Col xs={12} sm={6} md={4}>
                    <Link to="/VendorAllBills" style={{ textDecoration: 'none' }}>
                      <Card className="stat-card text-center border-0" style={{ cursor: 'pointer', minHeight: 95, padding: '10px 8px' }}>
                        <Card.Body className="d-flex flex-column align-items-center justify-content-center p-1">
                          <div className="stat-icon mb-1 d-flex align-items-center justify-content-center" style={{ background: '#fff3cd', color: '#ff9800', width: 28, height: 28, borderRadius: '50%' }}>
                            <i className="bi bi-currency-rupee" style={{ fontSize: 14 }}></i>
                          </div>
                          <div className="stat-title fw-semibold mb-1" style={{ fontSize: 'clamp(10px, 1.8vw, 12px)' }}>Total Bills</div>
                          <div className="stat-value fw-bold" style={{ fontSize: 'clamp(14px, 2.5vw, 18px)', color: '#1a73e8' }}>{billCount}</div>
                        </Card.Body>
                      </Card>
                    </Link>
                  </Col>
                </Row>
              </div>
              {/* Queries Section */}
              <div>
                <h6 className="fw-bold mb-2" style={{ color: '#2b6777', letterSpacing: 0.5, fontSize: 'clamp(13px, 2.5vw, 16px)' }}>Queries</h6>
                <Row className="g-2" style={{ margin: 0 }}>
                  <Col xs={12} sm={6} md={4}>
                    <Link to="/VendorAllQueries" state={{ filter: 'Approved' }} style={{ textDecoration: 'none' }}>
                      <Card className="stat-card text-center border-0" style={{ cursor: 'pointer', minHeight: 95, padding: '10px 8px' }}>
                        <Card.Body className="d-flex flex-column align-items-center justify-content-center p-1">
                          <div className="stat-icon mb-1 d-flex align-items-center justify-content-center" style={{ background: '#e3fcec', color: '#28a745', width: 28, height: 28, borderRadius: '50%' }}>
                            <i className="bi bi-check-circle" style={{ fontSize: 14 }}></i>
                          </div>
                          <div className="stat-title fw-semibold mb-1" style={{ fontSize: 'clamp(10px, 1.8vw, 12px)' }}>Approved</div>
                          <div className="stat-value fw-bold" style={{ fontSize: 'clamp(14px, 2.5vw, 18px)', color: '#1a73e8' }}>{approvedQueryCount}</div>
                        </Card.Body>
                      </Card>
                    </Link>
                  </Col>
                  <Col xs={12} sm={6} md={4}>
                    <Link to="/VendorAllQueries" state={{ filter: 'Pending' }} style={{ textDecoration: 'none' }}>
                      <Card className="stat-card text-center border-0" style={{ cursor: 'pointer', minHeight: 95, padding: '10px 8px' }}>
                        <Card.Body className="d-flex flex-column align-items-center justify-content-center p-1">
                          <div className="stat-icon mb-1 d-flex align-items-center justify-content-center" style={{ background: '#fff3cd', color: '#ff9800', width: 28, height: 28, borderRadius: '50%' }}>
                            <i className="bi bi-hourglass-split" style={{ fontSize: 14 }}></i>
                          </div>
                          <div className="stat-title fw-semibold mb-1" style={{ fontSize: 'clamp(10px, 1.8vw, 12px)' }}>Pending</div>
                          <div className="stat-value fw-bold" style={{ fontSize: 'clamp(14px, 2.5vw, 18px)', color: '#1a73e8' }}>{pendingQueryCount}</div>
                        </Card.Body>
                      </Card>
                    </Link>
                  </Col>
                  <Col xs={12} sm={6} md={4}>
                    <Link to="/VendorAllQueries" state={{ filter: 'Rejected' }} style={{ textDecoration: 'none' }}>
                      <Card className="stat-card text-center border-0" style={{ cursor: 'pointer', minHeight: 95, padding: '10px 8px' }}>
                        <Card.Body className="d-flex flex-column align-items-center justify-content-center p-1">
                          <div className="stat-icon mb-1 d-flex align-items-center justify-content-center" style={{ background: '#ffe3e3', color: '#e53935', width: 28, height: 28, borderRadius: '50%' }}>
                            <i className="bi bi-x-circle" style={{ fontSize: 14 }}></i>
                          </div>
                          <div className="stat-title fw-semibold mb-1" style={{ fontSize: 'clamp(10px, 1.8vw, 12px)' }}>Rejected</div>
                          <div className="stat-value fw-bold" style={{ fontSize: 'clamp(14px, 2.5vw, 18px)', color: '#1a73e8' }}>{rejectedQueryCount}</div>
                        </Card.Body>
                      </Card>
                    </Link>
                  </Col>
                </Row>
              </div>
            </Col>
          </Row>

          {/* Quick Actions - Mobile & Tablet Only (below Profile) */}
          {/* Removed: Quick Actions from below profile for mobile/tablet, now shown below profile for all devices */}

          {/* Recent Activity & Quick Actions */}
          <Row className="mt-2 g-2" style={{ margin: 0 }}>
            <Col xs={12} md={12} sm={12}>
              <Card className="recent-orders-card h-100 border-0">
                <Card.Body className="p-2">
                  <h6 className="mb-2 fw-bold" style={{ fontSize: 'clamp(12px, 2vw, 14px)' }}>Recent Queries</h6>
                  {recentQueries.length === 0 ? (
                    <div className="text-muted" style={{ fontSize: 'clamp(10px, 2vw, 12px)' }}>No recent queries.</div>
                  ) : (
                    <>
                      <ul className="list-group list-group-flush">
                        {recentQueries.map(q => (
                          <li key={q.id} className="list-group-item d-flex justify-content-between align-items-center px-0 py-1 flex-wrap gap-1">
                            <div style={{ flex: '1 1 auto', minWidth: 0 }}>
                              <div className="fw-semibold" style={{ fontSize: 'clamp(11px, 1.8vw, 13px)' }}>{q.title || q.issue}</div>
                              <div className="small text-muted" style={{ fontSize: 'clamp(9px, 1.5vw, 11px)' }}>{q.created_at ? new Date(q.created_at).toLocaleDateString() : ''}</div>
                            </div>
                            <span className={`badge rounded-pill ${((q.status || '').toLowerCase() === 'approved') ? 'bg-success' : ((q.status || '').toLowerCase() === 'rejected') ? 'bg-danger' : 'bg-warning text-dark'}`} style={{ fontSize: 'clamp(9px, 1.5vw, 10px)' }}>{q.status || 'Pending'}</span>
                          </li>
                        ))}
                      </ul>
                      {queryCount > 3 && (
                        <div className="text-end mt-1">
                          <Link to="/VendorAllQueries" style={{ textDecoration: 'none', fontWeight: 500, fontSize: 'clamp(10px, 1.8vw, 12px)' }}>
                            More...
                          </Link>
                        </div>
                      )}
                    </>
                  )}
                </Card.Body>
              </Card>
            </Col>
            {/* Removed duplicate Quick Actions card from desktop view */}
          </Row>
        </Container>
      </div>
    </div>
  );
};

export default VendorDashBoard;