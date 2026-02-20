import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Spinner, Alert, Table, Button, Modal } from "react-bootstrap";

import "../../../assets/css/admindashboard.css";
import { useAuth } from "../../context/AuthContext";

import StaffLeftNav from "../StaffLeftNav";
import StaffHeader from "../StaffHeader";

const StaffQueryView = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [queries, setQueries] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const location = useLocation();
  // Initialize filter from navigation state if present (convert to lowercase for consistency)
  const initialFilter = location.state && location.state.filter && location.state.filter !== 'all' ? location.state.filter.toLowerCase() : 'all';
  const [filter, setFilter] = useState(initialFilter);
  const [currentPage, setCurrentPage] = useState(1);
  const queriesPerPage = 10;
  const { user, tokens } = useAuth();

  useEffect(() => {
    // If navigation state changes (e.g., user clicks a dashboard card), update filter
    if (location.state && location.state.filter && location.state.filter !== filter) {
      setFilter(location.state.filter);
      setCurrentPage(1);
    }
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
    // Fetch all queries for this staff user
    const apiUrl = `https://mahadevaaya.com/spindo/spindobackend/api/staffadmin/issue/?unique_id=${user.uniqueId}`;
    fetch(apiUrl, {
      headers: tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {}
    })
      .then((res) => res.json())
      .then((data) => {
        // Check if data is an array or has data property
        if (Array.isArray(data)) {
          setQueries(data);
        } else if (data.status && Array.isArray(data.data)) {
          setQueries(data.data);
        } else {
          // If single object is returned, wrap in array
          setQueries([data]);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Error fetching user queries.");
        setLoading(false);
      });
  }, [user, tokens]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleView = (query) => {
    setSelectedQuery(query);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedQuery(null);
  };

  // Filtered and paginated queries
  const filteredQueries = filter === 'all' ? queries : queries.filter(q => (q.status || 'pending').toLowerCase() === filter.toLowerCase());
  const totalPages = Math.ceil(filteredQueries.length / queriesPerPage);
  const paginatedQueries = filteredQueries.slice((currentPage - 1) * queriesPerPage, currentPage * queriesPerPage);

  // Handle filter change
  const handleFilterChange = (e) => {
    setFilter(e.target.value);
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
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
                      <i className="bi bi-list-task" style={{ marginRight: "10px" }}></i>
                      All Your Queries
                    </h3>
                    <p style={{ color: "#6c757d", fontSize: "14px" }}>View all your submitted queries and their status.</p>
                  </div>
                  {loading && (
                    <div className="text-center"><Spinner animation="border" variant="primary" /></div>
                  )}
                  {error && (
                    <Alert variant="danger">{error}</Alert>
                  )}
                  {!loading && !error && (
                    <>
                      {/* Filter Dropdown */}
                      <div className="d-flex justify-content-end mb-3">
                        <label className="me-2 fw-semibold" htmlFor="query-filter">Filter by Status:</label>
                        <select id="query-filter" className="form-select w-auto" value={filter} onChange={handleFilterChange}>
                          <option value="all">All</option>
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                      <Table responsive bordered hover className="rounded-4 shadow-sm">
                        <thead className="table-thead">
                          <tr>
                            <th>#</th>
                            <th>Title</th>
                            <th>Issue</th>
                            <th>Remark</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>View</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedQueries.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="text-center">No queries found.</td>
                            </tr>
                          ) : (
                            paginatedQueries.map((q, idx) => (
                              <tr key={q.id || idx}>
                                <td>{(currentPage - 1) * queriesPerPage + idx + 1}</td>
                                <td>{q.title}</td>
                                <td style={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{q.issue}</td>
                                <td style={{ maxWidth: 150, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {q.remark ? (
                                    <span title={q.remark}>
                                      {q.remark.length > 20 ? `${q.remark.substring(0, 20)}...` : q.remark}
                                    </span>
                                  ) : (
                                    <span style={{ color: '#999', fontStyle: 'italic' }}>No remark</span>
                                  )}
                                </td>
                                <td>
                                  <span style={{ fontWeight: 600, color: q.status === 'Approved' ? '#52ab98' : q.status === 'Rejected' ? '#e53935' : '#2b6777' }}>
                                    {q.status || 'Pending'}
                                  </span>
                                </td>
                                <td>{q.created_at ? new Date(q.created_at).toLocaleString() : '-'}</td>
                                <td>
                                  <Button variant="outline-primary" size="sm" onClick={() => handleView(q)}>
                                    <i className="bi bi-eye"></i> View
                                  </Button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </Table>
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
                  {/* Modal for query details */}
                  <Modal show={showModal} onHide={handleCloseModal} centered size="lg">
                    <Modal.Header closeButton>
                      <Modal.Title>Query Details</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                      {selectedQuery && (
                        <div>
                          <Row>
                            <Col md={6}>
                              <p><strong>Title:</strong> {selectedQuery.title}</p>
                            </Col>
                            <Col md={6}>
                              <p><strong>Status:</strong> <span style={{ fontWeight: 600, color: selectedQuery.status === 'resolved' ? '#52ab98' : '#2b6777' }}>{selectedQuery.status || 'Pending'}</span></p>
                            </Col>
                          </Row>
                          <Row>
                            <Col md={12}>
                              <p><strong>Issue:</strong></p>
                              <div className="bg-light p-3 rounded mb-3" style={{ borderLeft: '4px solid #2b6777' }}>
                                {selectedQuery.issue}
                              </div>
                            </Col>
                          </Row>
                          <Row>
                            <Col md={12}>
                              <p><strong>Remark:</strong></p>
                              <div className="bg-light p-3 rounded mb-3" style={{ borderLeft: '4px solid #52ab98' }}>
                                {selectedQuery.remark ? (
                                  selectedQuery.remark
                                ) : (
                                  <span style={{ color: '#999', fontStyle: 'italic' }}>No remark provided</span>
                                )}
                              </div>
                            </Col>
                          </Row>
                          <Row>
                            <Col md={6}>
                              <p><strong>Date:</strong> {selectedQuery.created_at ? new Date(selectedQuery.created_at).toLocaleString() : '-'}</p>
                            </Col>
                            {selectedQuery.updated_at && (
                              <Col md={6}>
                                <p><strong>Last Updated:</strong> {new Date(selectedQuery.updated_at).toLocaleString()}</p>
                              </Col>
                            )}
                          </Row>
                          {selectedQuery.issue_image && (
                            <Row>
                              <Col md={12}>
                                <p><strong>Attached Image:</strong></p>
                                <div className="text-center mb-3">
                                  <img
                                    src={
                                      selectedQuery.issue_image.startsWith("http")
                                        ? selectedQuery.issue_image
                                        : `https://mahadevaaya.com/spindo/spindobackend${selectedQuery.issue_image}`
                                    }
                                    alt="Query"
                                    style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                                    className="img-fluid"
                                  />
                                </div>
                              </Col>
                            </Row>
                          )}
                        </div>
                      )}
                    </Modal.Body>
                    <Modal.Footer>
                      <Button variant="secondary" onClick={handleCloseModal}>
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

export default StaffQueryView;