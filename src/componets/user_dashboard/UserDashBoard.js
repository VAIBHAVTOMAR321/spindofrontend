
import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Spinner, Alert } from "react-bootstrap";
import { Link } from "react-router-dom";
import "../../assets/css/admindashboard.css";
import UserLeftNav from "./UserLeftNav";
import UserHeader from "./UserHeader";
import { useAuth } from "../context/AuthContext";

const UserDashBoard = () => {
  // Device width state

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
  const [queries, setQueries] = useState([]);
  // Always call hooks at the top level
  const { user, tokens } = useAuth();
  // Service requests state
  const [serviceLoading, setServiceLoading] = useState(true);
  const [serviceError, setServiceError] = useState("");
  const [serviceRequests, setServiceRequests] = useState([]);
  // Fetch service requests for dashboard
  useEffect(() => {
    if (!user?.uniqueId) {
      setServiceError("User not logged in or missing unique ID.");
      setServiceLoading(false);
      return;
    }
    setServiceLoading(true);
    fetch(`https://mahadevaaya.com/spindo/spindobackend/api/customer/requestservices/?unique_id=${user.uniqueId}`, {
      headers: tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {}
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status && Array.isArray(data.data)) {
          setServiceRequests(data.data);
        } else {
          setServiceRequests([]);
        }
        setServiceLoading(false);
      })
      .catch(() => {
        setServiceError("Error fetching service requests.");
        setServiceRequests([]);
        setServiceLoading(false);
      });
  }, [user, tokens]);
  // Service stats (Approved, Pending, Rejected only, case-insensitive)
  const approvedServices = serviceRequests.filter(s => (s.status || '').toLowerCase() === "approved").length;
  const pendingServices = serviceRequests.filter(s => (s.status || '').toLowerCase() === "pending").length;
  const rejectedServices = serviceRequests.filter(s => (s.status || '').toLowerCase() === "rejected").length;

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
    // Fetch user profile and issues
    if (!user?.uniqueId) {
      setError("User not logged in or missing unique ID.");
      setLoading(false);
      return;
    }
    setLoading(true);
    // Fetch profile (single user object)
    const profileUrl = `https://mahadevaaya.com/spindo/spindobackend/api/customer/register/?unique_id=${user.uniqueId}`;
    fetch(profileUrl, {
      headers: tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {}
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status && data.data) {
          setProfile(data.data);
        } else {
          setError("Failed to load user profile.");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Error fetching user profile.");
        setLoading(false);
      });

    // Fetch issues for this user
    const issuesUrl = `https://mahadevaaya.com/spindo/spindobackend/api/customer/issue/?unique_id=${user.uniqueId}`;
    fetch(issuesUrl, {
      headers: tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {}
    })
      .then((res) => res.json())
      .then((data) => {
        // If API returns a list of issues in data, set it; else fallback to empty array
        if (data.status && Array.isArray(data.data)) {
          setQueries(data.data);
        } else if (data.status && data.data && Array.isArray(data.data.issues)) {
          setQueries(data.data.issues);
        } else {
          setQueries([]);
        }
      })
      .catch(() => {
        setError("Error fetching user issues.");
        setQueries([]);
      });
  }, [user, tokens]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Stats (Approved, Pending, Rejected only, case-insensitive)
  const approvedQueries = queries.filter(q => (q.status || '').toLowerCase() === "approved").length;
  const pendingQueries = queries.filter(q => (q.status || '').toLowerCase() === "pending").length;
  const rejectedQueries = queries.filter(q => (q.status || '').toLowerCase() === "rejected").length;
  // Show most recent 3 queries (no status filter)
  const sortedQueries = [...queries].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  const recentQueries = sortedQueries.slice(0, 3);

  return (
    <div className="dashboard-container">
      <UserLeftNav
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isMobile={isMobile}
        isTablet={isTablet}
      />
      <div className="main-content-dash">
        <UserHeader toggleSidebar={toggleSidebar} />
        <Container fluid className="dashboard-body dashboard-main-container">
          {/* Profile | Services & Queries layout */}
          <Row className="mt-2 g-2" style={{ margin: 0, width: '100%' }}>
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
                        {profile.image ? (
                          <img
                            src={
                              profile.image.startsWith('http')
                                ? profile.image
                                : profile.image.startsWith('/media/customer_images/')
                                  ? `https://mahadevaaya.com/spindo/spindobackend${profile.image}`
                                  : `https://mahadevaaya.com/spindo/spindobackend/media/customer_images/${profile.image}`
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
                      <h6 className="fw-bold mb-1 text-center" style={{ fontSize: 'clamp(13px, 2vw, 15px)' }}>Welcome, {profile.username || "User"}!</h6>
                      <div className="text-muted mb-1" style={{ fontSize: 'clamp(10px, 1.8vw, 12px)' }}>{profile.email}</div>
                      <div className="mb-0" style={{ fontSize: 'clamp(10px, 1.8vw, 12px)' }}><b>Mobile:</b> {profile.mobile_number}</div>
                      <div className="mb-2" style={{ fontSize: 'clamp(10px, 1.8vw, 12px)' }}><b>Location:</b> {profile.state}, {profile.district}, {profile.block}</div>
                      <Link to="/UserProfile">
                        <Button variant="outline-primary" size="sm" className="mt-1" style={{ fontSize: 'clamp(11px, 2vw, 13px)' }}>View Profile</Button>
                      </Link>
                    </>
                  ) : null}
                </Card.Body>
              </Card>
            </Col>

            {/* Services & Queries stacked in right column */}
            <Col xs={12} sm={12} md={6} lg={8}>
              {/* Services Section */}
              <div className="mb-3">
                <h6 className="fw-bold mb-2" style={{ color: '#2b6777', letterSpacing: 0.5, fontSize: 'clamp(13px, 2.5vw, 16px)' }}>Services</h6>
                <Row className="g-2 mb-2" style={{ margin: 0 }}>
                  <Col xs={12} sm={6} md={6} lg={4}>
                    <Link to="/ViewRequestService" state={{ filter: 'Approved' }} style={{ textDecoration: 'none' }}>
                      <Card className="stat-card text-center animate__animated animate__fadeIn border-0" style={{ cursor: 'pointer', minHeight: 95, padding: '10px 8px' }}>
                        <Card.Body className="d-flex flex-column align-items-center justify-content-center p-1">
                          <div className="stat-icon mb-1 d-flex align-items-center justify-content-center" style={{ background: '#e3fcec', color: '#28a745', width: 28, height: 28, borderRadius: '50%' }}>
                            <i className="bi bi-check-circle" style={{ fontSize: 14 }}></i>
                          </div>
                          <div className="stat-title fw-semibold mb-1" style={{ fontSize: 'clamp(10px, 1.8vw, 12px)' }}>Approved</div>
                          <div className="stat-value fw-bold" style={{ fontSize: 'clamp(14px, 2.5vw, 18px)', color: '#1a73e8' }}>{serviceLoading ? <Spinner size="sm" /> : approvedServices}</div>
                        </Card.Body>
                      </Card>
                    </Link>
                  </Col>
                  <Col xs={12} sm={6} md={6} lg={4}>
                    <Link to="/ViewRequestService" state={{ filter: 'Pending' }} style={{ textDecoration: 'none' }}>
                      <Card className="stat-card text-center animate__animated animate__fadeIn border-0" style={{ cursor: 'pointer', minHeight: 95, padding: '10px 8px' }}>
                        <Card.Body className="d-flex flex-column align-items-center justify-content-center p-1">
                          <div className="stat-icon mb-1 d-flex align-items-center justify-content-center" style={{ background: '#fff3cd', color: '#ff9800', width: 28, height: 28, borderRadius: '50%' }}>
                            <i className="bi bi-hourglass-split" style={{ fontSize: 14 }}></i>
                          </div>
                          <div className="stat-title fw-semibold mb-1" style={{ fontSize: 'clamp(10px, 1.8vw, 12px)' }}>Pending</div>
                          <div className="stat-value fw-bold" style={{ fontSize: 'clamp(14px, 2.5vw, 18px)', color: '#1a73e8' }}>{serviceLoading ? <Spinner size="sm" /> : pendingServices}</div>
                        </Card.Body>
                      </Card>
                    </Link>
                  </Col>
                  <Col xs={12} sm={6} md={6} lg={4}>
                    <Link to="/ViewRequestService" state={{ filter: 'Rejected' }} style={{ textDecoration: 'none' }}>
                      <Card className="stat-card text-center animate__animated animate__fadeIn border-0" style={{ cursor: 'pointer', minHeight: 95, padding: '10px 8px' }}>
                        <Card.Body className="d-flex flex-column align-items-center justify-content-center p-1">
                          <div className="stat-icon mb-1 d-flex align-items-center justify-content-center" style={{ background: '#ffe3e3', color: '#e53935', width: 28, height: 28, borderRadius: '50%' }}>
                            <i className="bi bi-x-circle" style={{ fontSize: 14 }}></i>
                          </div>
                          <div className="stat-title fw-semibold mb-1" style={{ fontSize: 'clamp(10px, 1.8vw, 12px)' }}>Rejected</div>
                          <div className="stat-value fw-bold" style={{ fontSize: 'clamp(14px, 2.5vw, 18px)', color: '#1a73e8' }}>{serviceLoading ? <Spinner size="sm" /> : rejectedServices}</div>
                        </Card.Body>
                      </Card>
                    </Link>
                  </Col>
                </Row>
                <Row className="mb-3 g-2" style={{ margin: 0 }}>
                  <Col xs={12} sm={6} md={6} lg={6} className="mb-0">
                    <Link to="/RequestService" style={{ textDecoration: 'none' }}>
                      <Button variant="primary" className="w-100" size="sm" style={{ fontSize: 'clamp(11px, 2vw, 13px)', padding: '6px 8px' }}>
                        <i className="bi bi-plus-circle me-1"></i> Add Request
                      </Button>
                    </Link>
                  </Col>
                  <Col xs={12} sm={6} md={6} lg={6} className="mb-0">
                    <Link to="/ViewRequestService" style={{ textDecoration: 'none' }}>
                      <Button variant="outline-primary" className="w-100" size="sm" style={{ fontSize: 'clamp(11px, 2vw, 13px)', padding: '6px 8px' }}>
                        <i className="bi bi-list-task me-1"></i> View Requests
                      </Button>
                    </Link>
                  </Col>
                </Row>
              </div>
              {/* Queries Section */}
              <div>
                <h6 className="fw-bold mb-2" style={{ color: '#2b6777', letterSpacing: 0.5, fontSize: 'clamp(13px, 2.5vw, 16px)' }}>Queries</h6>
                <Row className="g-2" style={{ margin: 0 }}>
                  <Col xs={12} sm={6} md={4}>
                    <Link to="/UserAllQuery" state={{ filter: 'Approved' }} style={{ textDecoration: 'none' }}>
                      <Card className="stat-card text-center border-0" style={{ cursor: 'pointer', minHeight: 95, padding: '10px 8px' }}>
                        <Card.Body className="d-flex flex-column align-items-center justify-content-center p-1">
                          <div className="stat-icon mb-1 d-flex align-items-center justify-content-center" style={{ background: '#e3fcec', color: '#28a745', width: 28, height: 28, borderRadius: '50%' }}>
                            <i className="bi bi-check-circle" style={{ fontSize: 14 }}></i>
                          </div>
                          <div className="stat-title fw-semibold mb-1" style={{ fontSize: 'clamp(10px, 1.8vw, 12px)' }}>Approved</div>
                          <div className="stat-value fw-bold" style={{ fontSize: 'clamp(14px, 2.5vw, 18px)', color: '#1a73e8' }}>{approvedQueries}</div>
                        </Card.Body>
                      </Card>
                    </Link>
                  </Col>
                  <Col xs={12} sm={6} md={4}>
                    <Link to="/UserAllQuery" state={{ filter: 'Pending' }} style={{ textDecoration: 'none' }}>
                      <Card className="stat-card text-center border-0" style={{ cursor: 'pointer', minHeight: 95, padding: '10px 8px' }}>
                        <Card.Body className="d-flex flex-column align-items-center justify-content-center p-1">
                          <div className="stat-icon mb-1 d-flex align-items-center justify-content-center" style={{ background: '#fff3cd', color: '#ff9800', width: 28, height: 28, borderRadius: '50%' }}>
                            <i className="bi bi-hourglass-split" style={{ fontSize: 14 }}></i>
                          </div>
                          <div className="stat-title fw-semibold mb-1" style={{ fontSize: 'clamp(10px, 1.8vw, 12px)' }}>Pending</div>
                          <div className="stat-value fw-bold" style={{ fontSize: 'clamp(14px, 2.5vw, 18px)', color: '#1a73e8' }}>{pendingQueries}</div>
                        </Card.Body>
                      </Card>
                    </Link>
                  </Col>
                  <Col xs={12} sm={6} md={4}>
                    <Link to="/UserAllQuery" state={{ filter: 'Rejected' }} style={{ textDecoration: 'none' }}>
                      <Card className="stat-card text-center border-0" style={{ cursor: 'pointer', minHeight: 95, padding: '10px 8px' }}>
                        <Card.Body className="d-flex flex-column align-items-center justify-content-center p-1">
                          <div className="stat-icon mb-1 d-flex align-items-center justify-content-center" style={{ background: '#ffe3e3', color: '#e53935', width: 28, height: 28, borderRadius: '50%' }}>
                            <i className="bi bi-x-circle" style={{ fontSize: 14 }}></i>
                          </div>
                          <div className="stat-title fw-semibold mb-1" style={{ fontSize: 'clamp(10px, 1.8vw, 12px)' }}>Rejected</div>
                          <div className="stat-value fw-bold" style={{ fontSize: 'clamp(14px, 2.5vw, 18px)', color: '#1a73e8' }}>{rejectedQueries}</div>
                        </Card.Body>
                      </Card>
                    </Link>
                  </Col>
                </Row>
              </div>
            </Col>
          </Row>

          {/* Quick Actions - Mobile & Tablet Only (below Profile) */}
          <Row className="mt-2 g-2 d-md-none" style={{ margin: 0 }}>
            <Col xs={12} sm={12}>
              <Card className="quick-actions-card h-100 border-0">
                <Card.Body className="d-flex flex-column align-items-center justify-content-center p-2">
                  <h6 className="mb-2 fw-bold" style={{ fontSize: 'clamp(12px, 2vw, 14px)' }}>Quick Actions</h6>
                  <Link to="/UserQuery" className="w-100 mb-1" style={{ textDecoration: 'none' }}>
                    <Button variant="primary" className="w-100" size="sm" style={{ fontSize: 'clamp(11px, 2vw, 13px)', padding: '6px 8px' }}>
                      <i className="bi bi-plus-circle me-1"></i> New Query
                    </Button>
                  </Link>
                  <Link to="/UserAllQuery" className="w-100 mb-1" style={{ textDecoration: 'none' }}>
                    <Button variant="outline-primary" className="w-100" size="sm" style={{ fontSize: 'clamp(11px, 2vw, 13px)', padding: '6px 8px' }}>
                      <i className="bi bi-list-task me-1"></i> View Queries
                    </Button>
                  </Link>
                  <Link to="/UserProfile" className="w-100" style={{ textDecoration: 'none' }}>
                    <Button variant="outline-secondary" className="w-100" size="sm" style={{ fontSize: 'clamp(11px, 2vw, 13px)', padding: '6px 8px' }}>
                      <i className="bi bi-person me-1"></i> Edit Profile
                    </Button>
                  </Link>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Recent Activity & Quick Actions */}
          <Row className="mt-2 g-2" style={{ margin: 0 }}>
            <Col xs={12} md={7} sm={12}>
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
                      {queries.length > 3 && (
                        <div className="text-end mt-1">
                          <Link to="/UserAllQuery" style={{ textDecoration: 'none', fontWeight: 500, fontSize: 'clamp(10px, 1.8vw, 12px)' }}>
                            More...
                          </Link>
                        </div>
                      )}
                    </>
                  )}
                </Card.Body>
              </Card>
            </Col>
            <Col xs={12} md={5} sm={12} className="d-none d-md-block">
              <Card className="quick-actions-card h-100 border-0">
                <Card.Body className="d-flex flex-column align-items-center justify-content-center p-2">
                  <h6 className="mb-2 fw-bold" style={{ fontSize: 'clamp(12px, 2vw, 14px)' }}>Quick Actions</h6>
                  <Link to="/UserQuery" className="w-100 mb-1" style={{ textDecoration: 'none' }}>
                    <Button variant="primary" className="w-100" size="sm" style={{ fontSize: 'clamp(11px, 2vw, 13px)', padding: '6px 8px' }}>
                      <i className="bi bi-plus-circle me-1"></i> New Query
                    </Button>
                  </Link>
                  <Link to="/UserAllQuery" className="w-100 mb-1" style={{ textDecoration: 'none' }}>
                    <Button variant="outline-primary" className="w-100" size="sm" style={{ fontSize: 'clamp(11px, 2vw, 13px)', padding: '6px 8px' }}>
                      <i className="bi bi-list-task me-1"></i> View Queries
                    </Button>
                  </Link>
                  <Link to="/UserProfile" className="w-100" style={{ textDecoration: 'none' }}>
                    <Button variant="outline-secondary" className="w-100" size="sm" style={{ fontSize: 'clamp(11px, 2vw, 13px)', padding: '6px 8px' }}>
                      <i className="bi bi-person me-1"></i> Edit Profile
                    </Button>
                  </Link>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  );
};

export default UserDashBoard;