import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Spinner, Alert, Table, Button, Modal } from "react-bootstrap";
import UserLeftNav from "./UserLeftNav";
import UserHeader from "./UserHeader";
import "../../assets/css/admindashboard.css";
import { useAuth } from "../context/AuthContext";

const UserAllQuery = () => {
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
  // Initialize filter from navigation state if present
  const initialFilter = location.state && location.state.filter && location.state.filter !== 'all' ? location.state.filter : 'all';
  const [filter, setFilter] = useState(initialFilter);
  const [currentPage, setCurrentPage] = useState(1);
  const queriesPerPage = 10;
  const { user, tokens } = useAuth();

  // Fetch queries function - can be called multiple times
  const fetchQueries = () => {
    if (!user?.uniqueId) {
      setError("User not logged in or missing unique ID.");
      setLoading(false);
      return;
    }
    setLoading(true);
    // Fetch all queries for this user
    const apiUrl = `https://mahadevaaya.com/spindo/spindobackend/api/customer/issue/?unique_id=${user.uniqueId}`;
    fetch(apiUrl, {
      headers: tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {}
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status && Array.isArray(data.data)) {
          setQueries(data.data);
          setError("");
        } else {
          setError("Failed to load user queries.");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Error fetching user queries.");
        setLoading(false);
      });
  };

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
    fetchQueries();
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
  const filteredQueries = filter === 'all' ? queries : queries.filter(q => (q.status || 'Pending').toLowerCase() === filter.toLowerCase());
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
      <UserLeftNav
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isMobile={isMobile}
        isTablet={isTablet}
      />
      <div className="main-content-dash">
        <UserHeader toggleSidebar={toggleSidebar} />
        <div className="p-3">
          <Button 
            variant="outline-secondary" 
            onClick={() => navigate('/UserDashBoard')}
            className="me-2"
          >
            <i className="bi bi-arrow-left me-2"></i> Back to Dashboard
          </Button>
        </div>
        <Container fluid className="dashboard-body dashboard-main-container">
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
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div className="d-flex align-items-center">
                          <label className="me-2 fw-semibold" htmlFor="query-filter">Filter by Status:</label>
                          <select id="query-filter" className="form-select w-auto" value={filter} onChange={handleFilterChange}>
                            <option value="all">All</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Accepted</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </div>
                        <Button 
                          variant="outline-primary" 
                          size="sm" 
                          onClick={fetchQueries}
                          style={{ fontWeight: 600 }}
                        >
                          <i className="bi bi-arrow-clockwise me-2"></i>Refresh
                        </Button>
                      </div>
                      <Table responsive bordered hover className="rounded-4 shadow-sm">
                        <thead className="table-thead" style={{ background: "linear-gradient(90deg, #2b6777 0%, #52ab98 100%)", color: "#fff" }}>
                          <tr>
                            <th>#</th>
                            <th>Title</th>
                            <th>Issue</th>
                            <th>Remarks</th>
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
                                <td style={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{q.extra_remark || '--'}</td>
                                <td>
                                  <span style={{ fontWeight: 600, color: q.status === 'approved' ? '#52ab98' : q.status === 'rejected' ? '#e53935' : '#2b6777' }}>
                                    {q.status ? q.status.charAt(0).toUpperCase() + q.status.slice(1) : 'Pending'}
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
                  <Modal show={showModal} onHide={handleCloseModal} centered>
                    <Modal.Header closeButton>
                      <Modal.Title>Query Details</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                      {selectedQuery && (
                        <div>
                          <p><strong>Title:</strong> {selectedQuery.title}</p>
                          <p><strong>Issue:</strong> {selectedQuery.issue}</p>
                          <p><strong>Remarks:</strong> {selectedQuery.extra_remark || '--'}</p>
                          <p><strong>Status:</strong> <span style={{ fontWeight: 600, color: selectedQuery.status === 'approved' ? '#52ab98' : selectedQuery.status === 'rejected' ? '#e53935' : '#2b6777' }}>{selectedQuery.status ? selectedQuery.status.charAt(0).toUpperCase() + selectedQuery.status.slice(1) : 'Pending'}</span></p>
                          <p><strong>Date:</strong> {selectedQuery.created_at ? new Date(selectedQuery.created_at).toLocaleString() : '-'}</p>
                          {selectedQuery.issue_image && (
                            <div className="mb-2">
                              <strong>Image:</strong><br />
                              <img
                                src={
                                  selectedQuery.issue_image.startsWith("http")
                                    ? selectedQuery.issue_image
                                    : `https://mahadevaaya.com/spindo/spindobackend${selectedQuery.issue_image}`
                                }
                                alt="Query"
                                style={{ maxWidth: 200, borderRadius: 6 }}
                              />
                            </div>
                          )}
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

export default UserAllQuery;
