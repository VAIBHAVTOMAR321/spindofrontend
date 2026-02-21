import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Carousel, Button } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import "../../assets/css/home.css"
import ServicesPage from './services/ServicesPage';
import HomeBg from "../../assets/images/home-img.jpg";
import AboutUs from './AboutUs';

function Home() {
  const [carouselItems, setCarouselItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch service categories from API
    fetch('https://mahadevaaya.com/spindo/spindobackend/api/service-category/')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        if (data.status && data.data) {
          // Filter published or accepted services and get first 5 items
          const filteredServices = data.data
            .filter(service => service.status === 'published' || service.status === 'accepted')
            .slice(0, 5);
          setCarouselItems(filteredServices);
        } else {
          console.error('Invalid data format received from API');
        }
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching carousel data:', error);
        setError(error.message);
        setLoading(false);
      });
  }, []);

  // Function to get the correct image path
  const getImagePath = (imagePath) => {
    if (!imagePath) return null;
    
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    return `https://mahadevaaya.com/spindo/spindobackend/${imagePath}`;
  };

  // Function to get slide style with background image
  const getSlideStyle = (imageUrl) => {
    if (!imageUrl) return {};
    return {
      backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('${imageUrl}')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    };
  };

  return (
    <div className="home-container">
      {/* Hero Carousel Section */}
      <div className="hero-carousel">
        {loading ? (
          <div className="carousel-loading">
            <div className="spinner-border text-light" role="status">
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        ) : error ? (
          <div className="carousel-error">
            <p>Error loading carousel: {error}</p>
          </div>
        ) : carouselItems.length > 0 ? (
          <Carousel controls={true} indicators={true} interval={3000} pause={false}>
            {carouselItems.map((service, index) => (
              <Carousel.Item key={service.id}>
                <div 
                  className={`carousel-slide slide-${index + 1}`}
                  style={getSlideStyle(getImagePath(service.prod_img))}
                >
                  <div className="carousel-overlay"></div>
                  <Carousel.Caption className="carousel-caption-custom">
                    <div className="caption-content">
                      <h1 className="carousel-title">{service.prod_name}</h1>
                      <p className="carousel-subtitle">
                        {service.prod_desc}
                      </p>
                      <Link to="/ServicesPage">
                        <Button className="cta-button-carousel">View Services</Button>
                      </Link>
                    </div>
                  </Carousel.Caption>
                </div>
              </Carousel.Item>
            ))}
          </Carousel>
        ) : (
          <div className="carousel-empty">
            <p>No carousel items available</p>
          </div>
        )}
      </div>

      {/* Main Content Section */}
      <Container className="content-section">
        <div className="home-content">
          <h1 className="home-title">Overview</h1>
          
          <p className="home-text intro-paragraph">
            SPINDO is revolutionizing the service industry through its innovative technology platform, offering a wide range of home services. From beauty treatments to cleaning, plumbing, carpentry, appliance repair, computer hardware solutions, painting, and customized security services, customers can conveniently book these services through our platform and enjoy them in the comfort of their homes, at their preferred time. At the heart of the SPINDO revolution are our service professionals. Every partner in our network undergoes a rigorous multi-step vetting process, including comprehensive background checks and verification of licenses and skills. We believe that by empowering these experts, we ensure that our customers receive nothing less than exceptional, trustworthy, and courteous service.
             Our Home Maintenance experts tackle everything from a leaky faucet and electrical issues to full-scale plumbing and carpentry projects. When your appliances fail, our Repair Specialists are on hand to diagnose and fix the problem. We also provide Tech Support for your computer hardware needs, professional Painting Services to refresh your space, and customized Security Solutions to give you peace of mind. No matter the task, we have a trusted professional ready to help.
          </p>
          
         
          
          <div className="image-text-section">
            <Row className="align-items-center">
              <Col md={6} className="image-column">
                <div className="image-container">
                  <img src={HomeBg} alt="Our Services" className="service-image" />
                </div>
              </Col>
              <Col md={6} className="text-column">
                <p className="home-text">
                  We are committed to delivering a consistently high-quality, standardized, and reliable service experience to our customers. To fulfil this commitment, we collaborate closely with our hand-picked service partners. We empower them with cutting-edge technology, comprehensive training, quality products, specialized tools, financial support, insurance coverage, and the strength of our brand. By doing so, we enable our partners to succeed and uphold our promise of excellence in service delivery.
                </p>
                <Link to="/ServicesPage">
                  <Button className="cta-button mt-3">Learn More</Button>
                </Link>
              </Col>
            </Row>
          </div>
        </div>
      </Container>
      
      <AboutUs showBanner={false} />
      <ServicesPage />
    </div>
  )
}

export default Home;