import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { useLocation, Link, useNavigate } from 'react-router-dom';

function VendorList() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const location = useLocation();
  const navigate = useNavigate(); // Added useNavigate hook
  const selectedService = location.state?.service;

  const formatDisplayValue = (value) => {
    if (value === null || value === undefined || value === '') {
      return 'Not specified';
    }
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : 'Not specified';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return value;
  };

  const toLowerCaseString = (value) => {
    return value ? value.toString().toLowerCase() : '';
  };

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('https://mahadevaaya.com/spindo/spindobackend/api/vendor/list/');
        if (!response.ok) {
          throw new Error('Failed to fetch vendors');
        }
        
        const data = await response.json();
        if (data.status) {
          console.log('Selected Service:', selectedService);
          console.log('All Vendors:', data.data);
          
          const selectedProdName = toLowerCaseString(selectedService?.prod_name);
          
          const filteredVendors = data.data.filter(vendor => {
            const vendorCategory = toLowerCaseString(vendor.category);
            const vendorSubCategory = toLowerCaseString(vendor.sub_cate);
            const vendorService = toLowerCaseString(vendor.service);
            const vendorName = toLowerCaseString(vendor.username || vendor.name);
            const vendorCompany = toLowerCaseString(vendor.company_name);
            
            let parsedCategories = [];
            if (vendorCategory) {
              try {
                const parsed = JSON.parse(vendor.category || '');
                if (Array.isArray(parsed)) {
                  parsedCategories = parsed.map(category => toLowerCaseString(category));
                } else if (typeof parsed === 'string') {
                  parsedCategories = [toLowerCaseString(parsed)];
                }
              } catch (error) {
                parsedCategories = [vendorCategory];
              }
            }
            
            const matchesCategory = parsedCategories.some(category => 
              category === selectedProdName || category.includes(selectedProdName)
            );
            
            const matchesOtherFields = vendorSubCategory === selectedProdName || 
                                      vendorService === selectedProdName ||
                                      vendorName === selectedProdName ||
                                      vendorCompany === selectedProdName ||
                                      vendorSubCategory.includes(selectedProdName) ||
                                      vendorService.includes(selectedProdName) ||
                                      vendorName.includes(selectedProdName) ||
                                      vendorCompany.includes(selectedProdName);
            
            return matchesCategory || matchesOtherFields;
          });
          
          setDebugInfo({
            totalVendors: data.data.length,
            filteredVendors: filteredVendors.length,
            selectedService: selectedService?.prod_name || 'N/A',
            selectedServiceLower: selectedProdName,
            sampleVendor: data.data[0],
            vendorCategoryInfo: data.data.slice(0, 3).map(vendor => ({
              id: vendor.unique_id || vendor.id,
              username: vendor.username,
              rawCategory: vendor.category,
              parsedCategories: (() => {
                try {
                  const parsed = JSON.parse(vendor.category || '');
                  return Array.isArray(parsed) ? parsed : [vendor.category];
                } catch (e) {
                  return [vendor.category];
                }
              })()
            }))
          });
          
          setVendors(filteredVendors);
          
        } else {
          setError('Failed to load vendors');
        }
      } catch (err) {
        console.error('Error in fetchVendors:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (selectedService && selectedService.prod_name) {
      fetchVendors();
    } else {
      setLoading(false);
      setError('No service selected or service has no product name');
    }
  }, [selectedService]);

  if (!selectedService) {
    return (
      <Container className="my-5">
        <Alert variant="warning">
          <Alert.Heading>No Service Selected</Alert.Heading>
          <p>Please select a service from the navigation menu to view vendors.</p>
          <hr />
          <Link to="/" className="btn btn-primary">Return to Home</Link>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="my-2 container-box">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold">Vendors for {selectedService.prod_name}</h2>
        </div>
        <Link to="/" className="btn btn-outline-secondary">← Back to Services</Link>
      </div>
      
      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading vendors...</span>
          </Spinner>
          <p className="mt-3">Fetching vendors for {selectedService.prod_name}...</p>
        </div>
      ) : error ? (
        <Alert variant="danger">
          <Alert.Heading>Error Loading Vendors</Alert.Heading>
          <p>{error}</p>
            {debugInfo && (
              <div className="mt-3">
                <details>
                  <summary className="cursor-pointer">Debug Information</summary>
                  <div className="mt-2">
                    <small>
                      <strong>Selected Service:</strong> {debugInfo.selectedService}<br />
                      <strong>Selected Service (Lowercase):</strong> {debugInfo.selectedServiceLower}<br />
                      <strong>Total Vendors Available:</strong> {debugInfo.totalVendors}<br />
                      <strong>Vendors Matching:</strong> {debugInfo.filteredVendors}<br />
                      <strong>Vendor Category Info (First 3 Vendors):</strong><br />
                      {debugInfo.vendorCategoryInfo.map((vendor, index) => (
                        <div key={index} className="mt-1">
                          <strong>{vendor.username}:</strong><br />
                          <small>
                            Raw: {vendor.rawCategory}<br />
                            Parsed: {JSON.stringify(vendor.parsedCategories)}
                          </small>
                        </div>
                      ))}
                      {debugInfo.sampleVendor && (
                        <>
                          <strong>Sample Vendor Structure:</strong><br />
                          <pre className="mt-1 p-2 bg-light rounded">
                            {JSON.stringify(debugInfo.sampleVendor, null, 2)}
                          </pre>
                        </>
                      )}
                    </small>
                  </div>
                </details>
              </div>
            )}
          <hr />
          <div className="d-flex justify-content-end">
            <Button 
              variant="outline-danger" 
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        </Alert>
      ) : vendors.length === 0 ? (
        <Alert variant="info">
          <Alert.Heading>No Vendors Found</Alert.Heading>
          <p>
            Not found {selectedService.prod_name} at the moment.
          </p>
          <hr />
          <div className="d-flex justify-content-between">
            <Link to="/ContactUs" className="btn btn-primary">Contact Us</Link>
            <Link to="/" className="btn btn-outline-secondary">Browse Other Services</Link>
          </div>
        </Alert>
      ) : (
        <>
          <div className="mb-3">
            <p className="text-muted">
              Showing {vendors.length} vendor{vendors.length !== 1 ? 's' : ''} for {selectedService.prod_name}
            </p>
          </div>
          <Row>
            {vendors.map((vendor) => (
              <Col md={4} className="mb-4" key={vendor.unique_id || vendor.id || Math.random()}>
                <Card className="h-100 vendor-card shadow-sm border-0 overflow-hidden">
                  <div className="card-header py-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <h5 className="mb-0 fw-bold">
                        {formatDisplayValue(vendor.username || vendor.name || vendor.company_name)}
                      </h5>
                      {vendor.verified && (
                        <Badge bg="light" text="dark" className="ms-2">Verified</Badge>
                      )}
                    </div>
                  </div>
                  <Card.Body className="p-4">
                    <div className="mb-3">
                      <div className="d-flex align-items-center mb-2">
                        <i className="bi bi-geo-alt-fill text-primary me-2"></i>
                        <strong>Address:</strong> 
                      </div>
                      <p className="ms-4 mb-0 text-muted">{formatDisplayValue(vendor.address)}</p>
                    </div>
                    
                    {vendor.phone && (
                      <div className="mb-3">
                        <div className="d-flex align-items-center mb-2">
                          <i className="bi bi-telephone-fill text-primary me-2"></i>
                          <strong>Phone:</strong> 
                        </div>
                        <a href={`tel:${vendor.phone}`} className="ms-4 text-decoration-none">
                          {vendor.phone}
                        </a>
                      </div>
                    )}
                    
                    {vendor.email && (
                      <div className="mb-3">
                        <div className="d-flex align-items-center mb-2">
                          <i className="bi bi-envelope-fill text-primary me-2"></i>
                          <strong>Email:</strong> 
                        </div>
                        <a href={`mailto:${vendor.email}`} className="ms-4 text-decoration-none">
                          {vendor.email}
                        </a>
                      </div>
                    )}
                    
                    {vendor.rating && (
                      <div className="mb-3">
                        <div className="d-flex align-items-center mb-2">
                          <i className="bi bi-star-fill text-warning me-2"></i>
                          <strong>Rating:</strong> 
                        </div>
                        <div className="ms-4">
                          <span className="text-warning">{'★'.repeat(Math.floor(vendor.rating))}</span>
                          <span className="text-muted ms-1">({vendor.rating})</span>
                        </div>
                      </div>
                    )}
                  </Card.Body>
                  <Card.Footer className="bg-light py-3">
                    <div className="d-grid gap-2">
                      <Button 
                        variant="primary" 
                        className="fw-bold btn-book"
                        onClick={() => navigate('/login')} // Added onClick handler to navigate to login
                      >
                        Book Now
                      </Button>
                      {vendor.profile_url && (
                        <Button variant="outline-secondary" size="sm">
                          View Profile
                        </Button>
                      )}
                    </div>
                  </Card.Footer>
                </Card>
              </Col>
            ))}
          </Row>
        </>
      )}
    </Container>
  );
}

export default VendorList;