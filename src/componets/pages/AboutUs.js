import React from 'react'
import { Container, Row, Col, Card } from 'react-bootstrap'
import "../../assets/css/home.css"

function AboutUs() {
  return (
    <>
     <div className="Contact-banner">
        <div className="site-breadcrumb-wpr">
          <h2 className="breadcrumb-title">About Us</h2>
          <ul className="breadcrumb-menu clearfix">
            <li><a className="breadcrumb-home" href="/" data-discover="true">Home</a></li>
            <li className="px-2">/</li>
            <li><a className="breadcrumb-contact" href="/contact" data-discover="true">About Us</a></li>
          </ul>
        </div>
      </div>
  
    <div className="home-container">
      <div className="home-background"></div>
      <div className="home-overlay"></div>
      
      <Container>
        <div className="home-content">
          <h1 className="home-title text-center mb-5">OUR VISION, MISSION, PHILOSOPHY</h1>
          
        
          
         
          
         
          
          <Row className="g-4 mb-5">
            <Col md={4}>
              <Card className="vision-card h-100 border-0 shadow-sm">
                <div className="card-header-custom text-center py-3">
                  <div className="icon-wrapper mb-3">
                    <i className="fas fa-eye fa-2x"></i>
                  </div>
                  <h3 className="card-title-custom">Our Vision</h3>
                </div>
                <Card.Body className="p-4">
                  <Card.Text className="card-text-custom">
                    To make it convenient for professionals to provide their services and enhance the overall customer experience through our innovative technology platform.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={4}>
              <Card className="mission-card h-100 border-0 shadow-sm">
                <div className="card-header-custom text-center py-3">
                  <div className="icon-wrapper mb-3">
                    <i className="fas fa-rocket fa-2x"></i>
                  </div>
                  <h3 className="card-title-custom">Our Mission</h3>
                </div>
                <Card.Body className="p-4">
                  <Card.Text className="card-text-custom">
                    To revolutionize the home service industry by connecting skilled professionals with customers through a seamless digital experience, ensuring quality, reliability, and convenience for all.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={4}>
              <Card className="philosophy-card h-100 border-0 shadow-sm">
                <div className="card-header-custom text-center py-3">
                  <div className="icon-wrapper mb-3">
                    <i className="fas fa-lightbulb fa-2x"></i>
                  </div>
                  <h3 className="card-title-custom">Our Philosophy</h3>
                </div>
                <Card.Body className="p-4">
                  <Card.Text className="card-text-custom">
                    We believe in empowering our service partners with the right tools, training, and technology to deliver exceptional services. By creating a symbiotic relationship between customers and service providers, we aim to build a community where quality services are accessible to everyone.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </div>
      </Container>
      
      {/* Add this CSS to your home.css file */}
      <style jsx>{`
        .vision-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .vision-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }
        
        .mission-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .mission-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }
        
        .philosophy-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .philosophy-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }
        
        .card-header-custom {
          background: linear-gradient(135deg, #1b4a8f 0%, #1b4a8f 100%);
          border-bottom: none;
          border-radius: 0.25rem 0.25rem 0 0 !important;
        }
        
        .icon-wrapper {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background-color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        .vision-card .icon-wrapper {
          color: #4e73df;
        }
        
        .mission-card .icon-wrapper {
          color: #1cc88a;
        }
        
        .philosophy-card .icon-wrapper {
          color: #f6c23e;
        }
        
        .card-title-custom {
          font-weight: 600;
          margin: 0;
          color: #fff;
        }
        
        .card-text-custom {
          color: #5a5c69;
          line-height: 1.6;
          text-align: justify;
        }
      `}</style>
    </div>
      </>
  )
}

export default AboutUs