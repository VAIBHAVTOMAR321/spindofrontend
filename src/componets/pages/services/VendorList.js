import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { useLocation, Link } from 'react-router-dom';

function VendorList() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const location = useLocation();
  const selectedService = location.state?.service;

  // Helper function to safely convert to lowercase string
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
          // Log the data for debugging
          console.log('Selected Service:', selectedService);
          console.log('All Vendors:', data.data);
          
          // Safely get the selected product name
          const selectedProdName = toLowerCaseString(selectedService?.prod_name);
          
          // Filter vendors where category matches the selected service prod_name
          const filteredVendors = data.data.filter(vendor => {
            // Safely convert all vendor fields to lowercase strings
            const vendorCategory = toLowerCaseString(vendor.category);
            const vendorSubCategory = toLowerCaseString(vendor.sub_cate);
            const vendorService = toLowerCaseString(vendor.service);
            const vendorName = toLowerCaseString(vendor.username || vendor.name);
            const vendorCompany = toLowerCaseString(vendor.company_name);
            
            // Match against multiple fields with strict comparison
            return vendorCategory === selectedProdName || 
                   vendorSubCategory === selectedProdName || 
                   vendorService === selectedProdName ||
                   vendorName === selectedProdName ||
                   vendorCompany === selectedProdName ||
                   vendorCategory.includes(selectedProdName) ||
                   vendorSubCategory.includes(selectedProdName) ||
                   vendorService.includes(selectedProdName) ||
                   vendorName.includes(selectedProdName) ||
                   vendorCompany.includes(selectedProdName);
          });
          
          // Set debug info
          setDebugInfo({
            totalVendors: data.data.length,
            filteredVendors: filteredVendors.length,
            selectedService: selectedService?.prod_name || 'N/A',
            sampleVendor: data.data[0] // Show first vendor for debugging
          });
          
          setVendors(filteredVendors);
          
          // If no vendors found after filtering, set a message
          if (filteredVendors.length === 0) {
            setError(`No vendors found for "${selectedService?.prod_name || 'Unknown Service'}"`);
          }
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
    <Container className="my-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Vendors for {selectedService.prod_name}</h2>
          {debugInfo && (
            <small className="text-muted">
              Found {debugInfo.filteredVendors} of {debugInfo.totalVendors} vendors
            </small>
          )}
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
                    <strong>Total Vendors Available:</strong> {debugInfo.totalVendors}<br />
                    <strong>Vendors Matching:</strong> {debugInfo.filteredVendors}<br />
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
          <Alert.Heading>No Vendors Available</Alert.Heading>
          <p>
            We couldn't find any vendors for "{selectedService.prod_name}" at the moment.
            Please check back later or contact us for assistance.
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
                <Card className="h-100 vendor-card shadow-sm">
                  <Card.Body className="d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <Card.Title as="h5" className="mb-0">
                        {vendor.username || vendor.name || vendor.company_name || 'Vendor Name'}
                      </Card.Title>
                      {vendor.verified && (
                        <Badge bg="success" className="ms-2">Verified</Badge>
                      )}
                    </div>
                    <Card.Subtitle className="mb-3 text-muted">
                      ID: {vendor.unique_id || vendor.id || 'N/A'}
                    </Card.Subtitle>
                    <Card.Text className="flex-grow-1">
                      <div className="mb-2">
                        <strong>Category:</strong> 
                        <span className="ms-1">{vendor.category || vendor.service || 'Not specified'}</span>
                      </div>
                      {vendor.sub_cate && (
                        <div className="mb-2">
                          <strong>Sub-Category:</strong> 
                          <span className="ms-1">{vendor.sub_cate}</span>
                        </div>
                      )}
                      <div className="mb-2">
                        <strong>Address:</strong> 
                        <span className="ms-1">{vendor.address || 'Not provided'}</span>
                      </div>
                      {vendor.phone && (
                        <div className="mb-2">
                          <strong>Phone:</strong> 
                          <a href={`tel:${vendor.phone}`} className="ms-1 text-decoration-none">
                            {vendor.phone}
                          </a>
                        </div>
                      )}
                      {vendor.email && (
                        <div className="mb-2">
                          <strong>Email:</strong> 
                          <a href={`mailto:${vendor.email}`} className="ms-1 text-decoration-none">
                            {vendor.email}
                          </a>
                        </div>
                      )}
                      {vendor.rating && (
                        <div className="mb-2">
                          <strong>Rating:</strong> 
                          <span className="ms-1">{'★'.repeat(Math.floor(vendor.rating))}</span>
                          <span className="text-muted">({vendor.rating})</span>
                        </div>
                      )}
                    </Card.Text>
                    <div className="mt-auto d-grid gap-2">
                      <Button variant="primary" className="w-100">
                        Contact Vendor
                      </Button>
                      {vendor.profile_url && (
                        <Button variant="outline-secondary" size="sm" className="w-100">
                          View Profile
                        </Button>
                      )}
                    </div>
                  </Card.Body>
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