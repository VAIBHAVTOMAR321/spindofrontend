import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Button, Image } from 'react-bootstrap'
import "../../../assets/css/home.css";
import "../../../assets/css/services.css";

function ServicesPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch data from the API
    fetch('https://mahadevaaya.com/spindo/spindobackend/api/service-category/')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        if (data.status && data.data) {
          setServices(data.data);
        } else {
          setError('Invalid data format received from API');
        }
        setLoading(false);
      })
      .catch(error => {
        setError('Error fetching data: ' + error.message);
        setLoading(false);
      });
  }, []);

  const handleBookService = (serviceId) => {
    console.log('Booking service:', serviceId);
    // Add your booking logic here
  };

  // Function to get the correct image path
  const getImagePath = (imagePath) => {
    if (!imagePath) return null;
    
    // If the image path is already a full URL, return it as is
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // Otherwise, construct the full URL
    return `https://mahadevaaya.com/spindo/spindobackend/${imagePath}`;
  };

  return (
    <div className="home-container">
      <div className="home-background"></div>
      <div className="home-overlay"></div>
      
      <Container>
        <div className="home-content">
          <h1 className="home-title">Our Services</h1>
          
          {loading ? (
            <div className="text-center my-4">
              <div className="spinner-border text-primary" role="status">
                <span className="sr-only">Loading...</span>
              </div>
            </div>
          ) : error ? (
            <div className="alert alert-danger my-4">
              {error}
            </div>
          ) : (
            <Row className="my-4">
              {services.slice(0, 3).map(service => (
                <Col md={4} key={service.id} className="mb-4">
                  <Card className="service-card">
                    {/* Service Image */}
                    <div className="service-image-container">
                      {service.prod_img ? (
                        <Image 
                          src={getImagePath(service.prod_img)} 
                          alt={service.prod_name}
                          className="service-image img-fluid"
                          onError={(e) => {
                            // Fallback image if the main image fails to load
                            e.target.src = 'https://via.placeholder.com/300x200?text=Service+Image';
                          }}
                        />
                      ) : (
                        <div className="service-image-placeholder">
                          <i className="fas fa-image fa-3x"></i>
                        </div>
                      )}
                    </div>
                    
                    <Card.Body>
                      <Card.Title className="service-name">{service.prod_name}</Card.Title>
                      <Card.Text className="service-description">
                        {service.prod_desc}
                      </Card.Text>
                    </Card.Body>
                    <Card.Footer className="text-center">
                      <Button 
                        className="btn-book"
                        onClick={() => handleBookService(service.id)}
                      >
                        Book Now
                      </Button>
                    </Card.Footer>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </div>
      </Container>
    </div>
  )
}

export default ServicesPage;