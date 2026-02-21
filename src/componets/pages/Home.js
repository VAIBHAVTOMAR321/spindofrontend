import React from 'react'
import { Container, Row, Col, Carousel, Button } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import "../../assets/css/home.css"
import ServicesPage from './services/ServicesPage';
import HomeBg from "../../assets/images/home-img.jpg";
import AboutUs from './AboutUs';

function Home() {
  return (
    <div className="home-container">
      {/* Hero Carousel Section */}
      <div className="hero-carousel">
        <Carousel controls={true} indicators={true} interval={3000} pause={false}>
          <Carousel.Item>
            <div className="carousel-slide slide-1">
              <div className="carousel-overlay"></div>
              <Carousel.Caption className="carousel-caption-custom">
                <div className="caption-content">
                  <h1 className="carousel-title">Carpenter </h1>
                  <p className="carousel-subtitle"> Shaping, cutting, and installing wood for buildings or smaller structures involves a mix of precision, craftsmanship, and practical problem-solving. It starts with reading plans or measurements, selecting the right type of wood, and accurately cutting and shaping it using hand tools or power tools. Every cut matters—small errors can affect the strength, alignment, or appearance of the finished structure.</p>
                  <Link to="/ServicesPage">
                    <Button className="cta-button-carousel">View Services</Button>
                  </Link>
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
                  <Link to="/ServicesPage">
                    <Button className="cta-button-carousel">View Services</Button>
                  </Link>
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
                  <Link to="/ServicesPage">
                    <Button className="cta-button-carousel">Explore More</Button>
                  </Link>
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