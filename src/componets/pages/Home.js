import React from 'react'
import { Container, Row, Col, Carousel, Button } from 'react-bootstrap'
import "../../assets/css/home.css"
import ServicesPage from './services/ServicesPage';
import HomeBg from "../../assets/images/home-img.jpg";
import AboutUs from './AboutUs';

function Home() {
  return (
    <div className="home-container">
      {/* Hero Carousel Section */}
      <div className="hero-carousel">
        <Carousel fade controls={true} indicators={true} interval={2000}>
          <Carousel.Item>
            <div className="carousel-slide slide-1">
              <div className="carousel-overlay"></div>
              <Carousel.Caption className="carousel-caption-custom">
                <div className="caption-content">
                  <h1 className="carousel-title">Carpenter </h1>
                  <p className="carousel-subtitle"> Shaping, cutting, and installing wood for buildings or smaller structures involves a mix of precision, craftsmanship, and practical problem-solving. It starts with reading plans or measurements, selecting the right type of wood, and accurately cutting and shaping it using hand tools or power tools. Every cut matters—small errors can affect the strength, alignment, or appearance of the finished structure.</p>
                  <Button className="cta-button-carousel">View Services</Button>
                </div>
              </Carousel.Caption>
            </div>
          </Carousel.Item>
          
          <Carousel.Item>
            <div className="carousel-slide slide-2">
              <div className="carousel-overlay"></div>
              <Carousel.Caption className="carousel-caption-custom">
                <div className="caption-content">
                  <h1 className="carousel-title">Electrician </h1>
                  <p className="carousel-subtitle"> Electricians offer a range of services including electrical inspections, installations, appliance installations, fault finding and repair and so on.              </p>
                  <Button className="cta-button-carousel">View Services</Button>
                </div>
              </Carousel.Caption>
            </div>
          </Carousel.Item>
          
          <Carousel.Item>
            <div className="carousel-slide slide-3">
              <div className="carousel-overlay"></div>
              <Carousel.Caption className="carousel-caption-custom">
                <div className="caption-content">
                  <h1 className="carousel-title">Plumber </h1>
                  <p className="carousel-subtitle"> Plumbing service is drain services, which generally involves cleaning the traps and piping of a variety of drain types, including sewer drains, toilet drains, sink drains, and grease traps.</p>
                  <Button className="cta-button-carousel">Explore More</Button>
                </div>
              </Carousel.Caption>
            </div>
          </Carousel.Item>
        </Carousel>
      </div>

      {/* Main Content Section */}
      <Container className="content-section">
        <div className="home-content">
          <h1 className="home-title">Overview</h1>
          
          <p className="home-text intro-paragraph">
            SPINDO is revolutionizing the service industry through its innovative technology platform, offering a wide range of home services. From beauty treatments to cleaning, plumbing, carpentry, appliance repair, computer hardware solutions, painting, and customized security services, customers can conveniently book these services through our platform and enjoy them in the comfort of their homes, at their preferred time.
          </p>
          
          <div className="service-highlights">
            <span className="service-tag">Beauty Treatments</span>
            <span className="service-tag">Cleaning</span>
            <span className="service-tag">Plumbing</span>
            <span className="service-tag">Carpentry</span>
            <span className="service-tag">Appliance Repair</span>
            <span className="service-tag">Computer Hardware</span>
            <span className="service-tag">Painting</span>
            <span className="service-tag">Security Services</span>
          </div>
          
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
                <Button className="cta-button mt-3">Learn More</Button>
              </Col>
            </Row>
          </div>
        </div>
      </Container>
      
      <AboutUs />
      <ServicesPage />
    </div>
  )
}

export default Home;