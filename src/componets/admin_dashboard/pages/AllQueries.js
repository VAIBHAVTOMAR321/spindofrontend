import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Table, Button, Form, Modal, Nav, Tab } from "react-bootstrap";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import AdminHeader from "../AdminHeader";
import AdminLeftNav from "../AdminLeftNav";
import "../../../assets/css/admindashboard.css";

const BASE_URL = "https://mahadevaaya.com/spindo/spindobackend";
const USER_QUERIES_API = `${BASE_URL}/api/customer/issue/`;
const STAFF_QUERIES_API = `${BASE_URL}/api/staffadmin/issue/`;
const VENDOR_QUERIES_API = `${BASE_URL}/api/vendor/request/`;

const AllQueries = ({ showCardOnly = false }) => {
  // Get location state for tab routing
  const location = useLocation();
  const initialTab = location.state?.tab || "user";

  // Sidebar and device state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
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

  // Auth
  const { tokens } = useAuth();

  // Tab state
  const [activeTab, setActiveTab] = useState(initialTab);

  // Data state for User Queries
  const [userQueries, setUserQueries] = useState([]);
  const [userCount, setUserCount] = useState(0);
  const [userCurrentPage, setUserCurrentPage] = useState(1);
  
  // Data state for Staff Queries
  const [staffQueries, setStaffQueries] = useState([]);
  const [staffCount, setStaffCount] = useState(0);
  const [staffCurrentPage, setStaffCurrentPage] = useState(1);

  // Data state for Vendor Queries
  const [vendorQueries, setVendorQueries] = useState([]);
  const [vendorCount, setVendorCount] = useState(0);
  const [vendorCurrentPage, setVendorCurrentPage] = useState(1);

  const itemsPerPage = 10;

  // Image modal state
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // Status update state
  const [updatingId, setUpdatingId] = useState(null);
  const [updatingType, setUpdatingType] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState({});

  // Remark modal state
  const [showRemarkModal, setShowRemarkModal] = useState(false);
  const [remarkQueryId, setRemarkQueryId] = useState(null);
  const [remarkQueryType, setRemarkQueryType] = useState(null);
  const [remarkStatus, setRemarkStatus] = useState(null);
  const [remarkText, setRemarkText] = useState('');

  // Handle view image
  const handleViewImage = (imagePath) => {
    if (imagePath) {
      setSelectedImage(`${BASE_URL}${imagePath}`);
      setShowImageModal(true);
    }
  };

  // Update status for user queries
  const updateUserQueryStatus = async (id, newStatus) => {
    if (!tokens?.access) {
      alert('Authentication required. Please login again.');
      return;
    }
    
    // Show remark modal for accepted or rejected status
    if (newStatus === 'accepted' || newStatus === 'rejected') {
      setRemarkQueryId(id);
      setRemarkQueryType('user');
      setRemarkStatus(newStatus);
      setRemarkText('');
      setShowRemarkModal(true);
      return;
    }
    
    // Direct update for pending status
    await submitStatusUpdate(id, 'user', newStatus, '');
  };

  // Update status for staff queries
  const updateStaffQueryStatus = async (id, newStatus) => {
    if (!tokens?.access) {
      alert('Authentication required. Please login again.');
      return;
    }
    
    // Show remark modal for accepted or rejected status
    if (newStatus === 'accepted' || newStatus === 'rejected') {
      setRemarkQueryId(id);
      setRemarkQueryType('staff');
      setRemarkStatus(newStatus);
      setRemarkText('');
      setShowRemarkModal(true);
      return;
    }
    
    // Direct update for pending status
    await submitStatusUpdate(id, 'staff', newStatus, '');
  };

  // Update status for vendor queries
  const updateVendorQueryStatus = async (id, newStatus) => {
    if (!tokens?.access) {
      alert('Authentication required. Please login again.');
      return;
    }
    
    // Show remark modal for accepted or rejected status
    if (newStatus === 'accepted' || newStatus === 'rejected') {
      setRemarkQueryId(id);
      setRemarkQueryType('vendor');
      setRemarkStatus(newStatus);
      setRemarkText('');
      setShowRemarkModal(true);
      return;
    }
    
    // Direct update for pending status
    await submitStatusUpdate(id, 'vendor', newStatus, '');
  };

  // Submit status update with remark
  const submitStatusUpdate = async (id, queryType, status, remark) => {
    if (!tokens?.access) {
      alert('Authentication required. Please login again.');
      return;
    }

    setUpdatingId(id);
    setUpdatingType(queryType);
    
    try {
      // Construct payload with all three fields
      const payload = {
        id: id,
        status: status,
        extra_remark: remark || ''
      };

      let apiEndpoint = '';
      if (queryType === 'user') apiEndpoint = USER_QUERIES_API;
      else if (queryType === 'staff') apiEndpoint = STAFF_QUERIES_API;
      else if (queryType === 'vendor') apiEndpoint = VENDOR_QUERIES_API;

      const response = await axios.put(apiEndpoint, payload, {
        headers: { 
          Authorization: `Bearer ${tokens.access}`,
          'Content-Type': 'application/json'
        },
      });

      // Update local state with both status and remark
      const updatePayload = { 
        status: status,
        extra_remark: remark || ''
      };

      if (queryType === 'user') {
        setUserQueries(userQueries.map(q => q.id === id ? { ...q, ...updatePayload } : q));
      } else if (queryType === 'staff') {
        setStaffQueries(staffQueries.map(q => q.id === id ? { ...q, ...updatePayload } : q));
      } else if (queryType === 'vendor') {
        setVendorQueries(vendorQueries.map(q => q.id === id ? { ...q, ...updatePayload } : q));
      }

      alert('Status and remarks updated successfully');
      setShowRemarkModal(false);
      setRemarkText('');

      // Refetch all queries to verify backend saved the changes
      setTimeout(() => {
        if (queryType === 'user') fetchUserQueries();
        else if (queryType === 'staff') fetchStaffQueries();
        else if (queryType === 'vendor') fetchVendorQueries();
      }, 500);

    } catch (error) {
      alert('Failed to update status: ' + (error.response?.data?.message || error.message));
    } finally {
      setUpdatingId(null);
      setUpdatingType(null);
    }
  };

  // Fetch user queries
  const fetchUserQueries = async () => {
    if (!tokens?.access) return;
    try {
      const res = await axios.get(USER_QUERIES_API, {
        headers: { Authorization: `Bearer ${tokens.access}` },
      });
      setUserQueries(res.data.data || []);
      setUserCount(res.data.data?.length || 0);
    } catch (error) {
      setUserQueries([]);
      setUserCount(0);
    }
  };

  // Fetch staff queries
  const fetchStaffQueries = async () => {
    if (!tokens?.access) return;
    try {
      const res = await axios.get(STAFF_QUERIES_API, {
        headers: { Authorization: `Bearer ${tokens.access}` },
      });
      setStaffQueries(res.data.data || []);
      setStaffCount(res.data.data?.length || 0);
    } catch (error) {
      setStaffQueries([]);
      setStaffCount(0);
    }
  };

  // Fetch vendor queries
  const fetchVendorQueries = async () => {
    if (!tokens?.access) return;
    try {
      const res = await axios.get(VENDOR_QUERIES_API, {
        headers: { Authorization: `Bearer ${tokens.access}` },
      });
      setVendorQueries(res.data.data || []);
      setVendorCount(res.data.data?.length || 0);
    } catch (error) {
      setVendorQueries([]);
      setVendorCount(0);
    }
  };

  useEffect(() => {
    if (tokens?.access) {
      fetchUserQueries();
      fetchStaffQueries();
      fetchVendorQueries();
    }
    // eslint-disable-next-line
  }, [tokens]);

  // Calculate total count
  const totalCount = userCount + staffCount + vendorCount;

  if (showCardOnly) {
    return (
      <div className="dashboard-card">
        <div className="dashboard-card-icon query-icon" title="Online Query">
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="#6366f1" strokeWidth="2"/></svg>
        </div>
        <div className="dashboard-card-title">Online Query<br/>(feedback/Suggestion)</div>
        <div className="dashboard-card-value">{totalCount}</div>
      </div>
    );
  }

  // Full page with tabs
  return (
    <>
      <div className="dashboard-container">
        {/* Left Sidebar */}
        <AdminLeftNav
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          isMobile={isMobile}
          isTablet={isTablet}
        />
        {/* Main Content */}
        <div className="main-content-dash">
          <AdminHeader toggleSidebar={toggleSidebar} />
          <Container fluid className="dashboard-body dashboard-main-container">
            <div className="p-3">
              {/* Modern Responsive Header Row */}
              <div
                className="mb-4 d-flex align-items-center justify-content-between gap-3 flex-wrap totalreg-header-row"
                style={{
                  background: 'linear-gradient(90deg, #cffafe 60%, #a5f3fc 100%)',
                  borderRadius: 18,
                  boxShadow: '0 2px 12px 0 rgba(8, 145, 178, 0.10)',
                  padding: '18px 12px',
                  minHeight: 90,
                }}
              >
                <div className="flex-grow-1 d-flex justify-content-center">
                  <Card
                    className="text-center order-2"
                    style={{
                      minWidth: 180,
                      maxWidth: 260,
                      borderRadius: 16,
                      boxShadow: '0 2px 12px 0 rgba(6,182,212,0.10)',
                      border: '1px solid #e5e7eb',
                      background: '#fff',
                    }}
                  >
                    <h6 style={{ color: '#0891b2', fontWeight: 700, marginTop: 10 }}>Total Queries</h6>
                    <h2 style={{ color: '#164e63', fontWeight: 800, marginBottom: 10 }}>{totalCount}</h2>
                  </Card>
                </div>
              </div>

              {/* Tabs Section */}
              <Tab.Container id="queries-tabs" activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                <div style={{ background: '#fff', borderRadius: 12, padding: '0.5rem', marginBottom: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                  <Nav variant="pills" className="border-bottom" style={{ borderBottom: '2px solid #f1f5f9' }}>
                    <Nav.Item>
                      <Nav.Link 
                        eventKey="user" 
                        style={{
                          color: activeTab === 'user' ? '#fff' : '#000000',
                          backgroundColor: activeTab === 'user' ? '#6366f1' : '#cbd5e1',
                          border: 'none',
                          borderRadius: 8,
                          fontWeight: 700,
                          marginRight: 8,
                          padding: '10px 16px',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        User Queries ({userCount})
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link 
                        eventKey="staff"
                        style={{
                          color: activeTab === 'staff' ? '#fff' : '#000000',
                          backgroundColor: activeTab === 'staff' ? '#6366f1' : '#cbd5e1',
                          border: 'none',
                          borderRadius: 8,
                          fontWeight: 700,
                          marginRight: 8,
                          padding: '10px 16px',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        Staff Queries ({staffCount})
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link 
                        eventKey="vendor"
                        style={{
                          color: activeTab === 'vendor' ? '#fff' : '#000000',
                          backgroundColor: activeTab === 'vendor' ? '#6366f1' : '#cbd5e1',
                          border: 'none',
                          borderRadius: 8,
                          fontWeight: 700,
                          marginRight: 8,
                          padding: '10px 16px',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        Vendor Queries ({vendorCount})
                      </Nav.Link>
                    </Nav.Item>
                  </Nav>
                </div>

                <Tab.Content>
                  {/* User Queries Tab */}
                  <Tab.Pane eventKey="user">
                    <div className="table-responsive rounded-4 shadow-sm" style={{ background: '#fff', padding: '0.5rem 0.5rem 1rem 0.5rem', marginTop: '1rem' }}>
                      <Table className="align-middle mb-0" style={{ minWidth: 700 }}>
                        <thead style={{ background: '#f1f5f9' }}>
                          <tr style={{ fontWeight: 700, color: '#6366f1', fontSize: 15 }}>
                            <th>Query ID</th>
                            <th>Name</th>
                            <th>Unique ID</th>
                            <th>Title</th>
                            <th>Issue</th>
                            <th>Remark</th>
                            <th>Image</th>
                            <th>Status</th>
                            <th>Created</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userQueries
                            .slice((userCurrentPage - 1) * itemsPerPage, userCurrentPage * itemsPerPage)
                            .map((query) => (
                              <tr key={query.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                <td style={{ fontWeight: 600, color: '#6366f1' }}>{query.query_id}</td>
                                <td>{query.name || '--'}</td>
                                <td>{query.unique_id || '--'}</td>
                                <td>{query.title || '--'}</td>
                                <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{query.issue || '--'}</td>
                                <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{query.extra_remark || '--'}</td>
                                <td>
                                  {query.issue_image ? (
                                    <Button
                                      size="sm"
                                      variant="info"
                                      onClick={() => handleViewImage(query.issue_image)}
                                      style={{ borderRadius: 6, fontSize: 12, fontWeight: 600 }}
                                    >
                                      View
                                    </Button>
                                  ) : (
                                    <span style={{ color: '#9ca3af' }}>No Image</span>
                                  )}
                                </td>
                                <td>
                                  <Form.Select
                                    size="sm"
                                    value={query.status}
                                    onChange={(e) => updateUserQueryStatus(query.id, e.target.value)}
                                    disabled={updatingId === query.id}
                                    style={{
                                      borderRadius: 6,
                                      fontSize: 13,
                                      fontWeight: 600,
                                      backgroundColor: 
                                        query.status === 'pending' ? '#fef3c7' : 
                                        query.status === 'accepted' ? '#d1fae5' : 
                                        query.status === 'rejected' ? '#fee2e2' : '#fff',
                                      color: 
                                        query.status === 'pending' ? '#92400e' : 
                                        query.status === 'accepted' ? '#065f46' : 
                                        query.status === 'rejected' ? '#991b1b' : '#000',
                                      cursor: updatingId === query.id ? 'not-allowed' : 'pointer'
                                    }}
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="accepted">Accepted</option>
                                    <option value="rejected">Rejected</option>
                                  </Form.Select>
                                </td>
                                <td>{new Date(query.created_at).toLocaleDateString()}</td>
                              </tr>
                            ))}
                        </tbody>
                      </Table>
                      {/* Pagination Controls */}
                      <div className="d-flex justify-content-center align-items-center mt-3 gap-2">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          disabled={userCurrentPage === 1}
                          onClick={() => setUserCurrentPage((prev) => Math.max(prev - 1, 1))}
                          style={{ minWidth: 80 }}
                        >
                          Previous
                        </Button>
                        <span style={{ fontWeight: 600, fontSize: 15 }}>
                          Page {userCurrentPage} of {Math.ceil(userQueries.length / itemsPerPage) || 1}
                        </span>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          disabled={userCurrentPage === Math.ceil(userQueries.length / itemsPerPage) || userQueries.length === 0}
                          onClick={() => setUserCurrentPage((prev) => prev + 1)}
                          style={{ minWidth: 80 }}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </Tab.Pane>

                  {/* Staff Queries Tab */}
                  <Tab.Pane eventKey="staff">
                    <div className="table-responsive rounded-4 shadow-sm" style={{ background: '#fff', padding: '0.5rem 0.5rem 1rem 0.5rem', marginTop: '1rem' }}>
                      <Table className="align-middle mb-0" style={{ minWidth: 700 }}>
                        <thead style={{ background: '#f1f5f9' }}>
                          <tr style={{ fontWeight: 700, color: '#6366f1', fontSize: 15 }}>
                            <th>Query ID</th>
                            <th>Name</th>
                            <th>Unique ID</th>
                            <th>Title</th>
                            <th>Issue</th>
                            <th>Remark</th>
                            <th>Image</th>
                            <th>Status</th>
                            <th>Created</th>
                          </tr>
                        </thead>
                        <tbody>
                          {staffQueries
                            .slice((staffCurrentPage - 1) * itemsPerPage, staffCurrentPage * itemsPerPage)
                            .map((query) => (
                              <tr key={query.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                <td style={{ fontWeight: 600, color: '#6366f1' }}>{query.query_id}</td>
                                <td>{query.name || '--'}</td>
                                <td>{query.unique_id || '--'}</td>
                                <td>{query.title || '--'}</td>
                                <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{query.issue || '--'}</td>
                                <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{query.extra_remark || '--'}</td>
                                <td>
                                  {query.issue_image ? (
                                    <Button
                                      size="sm"
                                      variant="info"
                                      onClick={() => handleViewImage(query.issue_image)}
                                      style={{ borderRadius: 6, fontSize: 12, fontWeight: 600 }}
                                    >
                                      View
                                    </Button>
                                  ) : (
                                    <span style={{ color: '#9ca3af' }}>No Image</span>
                                  )}
                                </td>
                                <td>
                                  <Form.Select
                                    size="sm"
                                    value={query.status}
                                    onChange={(e) => updateStaffQueryStatus(query.id, e.target.value)}
                                    disabled={updatingId === query.id}
                                    style={{
                                      borderRadius: 6,
                                      fontSize: 13,
                                      fontWeight: 600,
                                      backgroundColor: 
                                        query.status === 'pending' ? '#fef3c7' : 
                                        query.status === 'accepted' ? '#d1fae5' : 
                                        query.status === 'rejected' ? '#fee2e2' : '#fff',
                                      color: 
                                        query.status === 'pending' ? '#92400e' : 
                                        query.status === 'accepted' ? '#065f46' : 
                                        query.status === 'rejected' ? '#991b1b' : '#000',
                                      cursor: updatingId === query.id ? 'not-allowed' : 'pointer'
                                    }}
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="accepted">Accepted</option>
                                    <option value="rejected">Rejected</option>
                                  </Form.Select>
                                </td>
                                <td>{new Date(query.created_at).toLocaleDateString()}</td>
                              </tr>
                            ))}
                        </tbody>
                      </Table>
                      {/* Pagination Controls */}
                      <div className="d-flex justify-content-center align-items-center mt-3 gap-2">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          disabled={staffCurrentPage === 1}
                          onClick={() => setStaffCurrentPage((prev) => Math.max(prev - 1, 1))}
                          style={{ minWidth: 80 }}
                        >
                          Previous
                        </Button>
                        <span style={{ fontWeight: 600, fontSize: 15 }}>
                          Page {staffCurrentPage} of {Math.ceil(staffQueries.length / itemsPerPage) || 1}
                        </span>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          disabled={staffCurrentPage === Math.ceil(staffQueries.length / itemsPerPage) || staffQueries.length === 0}
                          onClick={() => setStaffCurrentPage((prev) => prev + 1)}
                          style={{ minWidth: 80 }}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </Tab.Pane>

                  <Tab.Pane eventKey="vendor">
                    <div className="table-responsive rounded-4 shadow-sm" style={{ background: '#fff', padding: '0.5rem 0.5rem 1rem 0.5rem', marginTop: '1rem' }}>
                      <Table className="align-middle mb-0" style={{ minWidth: 700 }}>
                        <thead style={{ background: '#f1f5f9' }}>
                          <tr style={{ fontWeight: 700, color: '#6366f1', fontSize: 15 }}>
                            <th>Vendor ID</th>
                            <th>Vendor Name</th>
                            <th>Title</th>
                            <th>Description</th>
                            <th>Image</th>
                            <th>Status</th>
                            <th>Created</th>
                          </tr>
                        </thead>
                        <tbody>
                          {vendorQueries
                            .slice((vendorCurrentPage - 1) * itemsPerPage, vendorCurrentPage * itemsPerPage)
                            .map((query) => (
                              <tr key={query.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                <td style={{ fontWeight: 600, color: '#6366f1' }}>{query.vendor || '--'}</td>
                                <td>{query.username || '--'}</td>
                                <td>{query.title || '--'}</td>
                                <td style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{query.issue || '--'}</td>
                                <td>
                                  {query.issue_image ? (
                                    <Button
                                      size="sm"
                                      variant="info"
                                      onClick={() => handleViewImage(query.issue_image)}
                                      style={{ borderRadius: 6, fontSize: 12, fontWeight: 600 }}
                                    >
                                      View
                                    </Button>
                                  ) : (
                                    <span style={{ color: '#9ca3af' }}>No Image</span>
                                  )}
                                </td>
                                <td>
                                  <Form.Select
                                    size="sm"
                                    value={query.status}
                                    onChange={(e) => updateVendorQueryStatus(query.id, e.target.value)}
                                    disabled={updatingId === query.id}
                                    style={{
                                      borderRadius: 6,
                                      fontSize: 13,
                                      fontWeight: 600,
                                      backgroundColor: 
                                        query.status === 'pending' ? '#fef3c7' : 
                                        query.status === 'accepted' ? '#d1fae5' : 
                                        query.status === 'rejected' ? '#fee2e2' : '#fff',
                                      color: 
                                        query.status === 'pending' ? '#92400e' : 
                                        query.status === 'accepted' ? '#065f46' : 
                                        query.status === 'rejected' ? '#991b1b' : '#000',
                                      cursor: updatingId === query.id ? 'not-allowed' : 'pointer'
                                    }}
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="accepted">Accepted</option>
                                    <option value="rejected">Rejected</option>
                                  </Form.Select>
                                </td>
                                <td>{query.created_at ? new Date(query.created_at).toLocaleDateString() : '--'}</td>
                              </tr>
                            ))}
                        </tbody>
                      </Table>
                      {/* Pagination Controls */}
                      <div className="d-flex justify-content-center align-items-center mt-3 gap-2">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          disabled={vendorCurrentPage === 1}
                          onClick={() => setVendorCurrentPage((prev) => Math.max(prev - 1, 1))}
                          style={{ minWidth: 80 }}
                        >
                          Previous
                        </Button>
                        <span style={{ fontWeight: 600, fontSize: 15 }}>
                          Page {vendorCurrentPage} of {Math.ceil(vendorQueries.length / itemsPerPage) || 1}
                        </span>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          disabled={vendorCurrentPage === Math.ceil(vendorQueries.length / itemsPerPage) || vendorQueries.length === 0}
                          onClick={() => setVendorCurrentPage((prev) => prev + 1)}
                          style={{ minWidth: 80 }}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </Tab.Pane>
                </Tab.Content>
              </Tab.Container>

              {/* Remark Modal */}
              <Modal show={showRemarkModal} onHide={() => setShowRemarkModal(false)} centered>
                <Modal.Header closeButton style={{ background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>
                  <Modal.Title style={{ fontWeight: 700, color: '#1e293b' }}>
                    Add Remark for {remarkStatus === 'accepted' ? 'Accepted' : 'Rejected'} Status
                  </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ background: '#f8fafc', padding: '20px' }}>
                  <Form.Group>
                    <Form.Label style={{ fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>
                      Remarks (Optional)
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      placeholder="Enter your remarks for this status change..."
                      value={remarkText}
                      onChange={(e) => setRemarkText(e.target.value)}
                      style={{
                        borderRadius: 8,
                        borderColor: '#cbd5e1',
                        padding: '10px',
                        fontFamily: 'inherit'
                      }}
                    />
                    <Form.Text className="text-muted" style={{ marginTop: '8px', display: 'block' }}>
                      Add any additional remarks or feedback for this status change.
                    </Form.Text>
                  </Form.Group>
                </Modal.Body>
                <Modal.Footer style={{ background: '#f1f5f9', borderTop: '1px solid #e5e7eb' }}>
                  <Button 
                    variant="secondary" 
                    onClick={() => {
                      setShowRemarkModal(false);
                      setRemarkText('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => submitStatusUpdate(remarkQueryId, remarkQueryType, remarkStatus, remarkText)}
                    disabled={updatingId === remarkQueryId}
                    style={{
                      backgroundColor: '#6366f1',
                      borderColor: '#6366f1',
                      fontWeight: 600
                    }}
                  >
                    {updatingId === remarkQueryId ? 'Updating...' : 'Confirm Update'}
                  </Button>
                </Modal.Footer>
              </Modal>

              {/* Image Modal */}
              <Modal show={showImageModal} onHide={() => setShowImageModal(false)} centered size="lg">
                <Modal.Header closeButton style={{ background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>
                  <Modal.Title style={{ fontWeight: 700, color: '#1e293b' }}>View Image</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ background: '#f8fafc', display: 'flex', justifyContent: 'center', padding: '20px' }}>
                  {selectedImage && (
                    <img
                      src={selectedImage}
                      alt="Issue"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '500px',
                        borderRadius: 8,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                      }}
                    />
                  )}
                </Modal.Body>
                <Modal.Footer style={{ background: '#f1f5f9', borderTop: '1px solid #e5e7eb' }}>
                  <Button variant="secondary" onClick={() => setShowImageModal(false)}>
                    Close
                  </Button>
                </Modal.Footer>
              </Modal>
            </div>
          </Container>
        </div>
      </div>
    </>
  );
};

export default AllQueries;
