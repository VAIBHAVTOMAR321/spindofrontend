import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import { Button } from 'react-bootstrap';
import { FaEnvelope, FaPhone, FaFacebook, FaTwitter, FaLinkedin, FaInstagram } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import "../../assets/css/NavBar.css";
import Logo from "../../assets/images/splogo.png";    

function NavBar() {
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fetch services from API
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch('https://mahadevaaya.com/spindo/spindobackend/api/service-category/');
        if (!response.ok) {
          throw new Error('Failed to fetch services');
        }
        const data = await response.json();
        if (data.status) {
          setServices(data.data);
        } else {
          setError('Failed to load services');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    console.log('Selected Service for Vendor List:', service);
    // Navigate to vendor list page with the selected service
    navigate('/VendorList', { 
      state: { 
        service: {
          id: service.id,
          prod_name: service.prod_name
        } 
      } 
    });
  };

  return (
    <>
      {/* Top bar with contact info and social links */}
      <div className="top-bar bg-dark text-white py-2 d-none d-lg-block">
        <div className="d-flex justify-content-between align-items-center nav-p">
          <div className="contact-info">
            <span className="me-3"><FaEnvelope /> contact@example.com</span>
            <span><FaPhone /> +1 (123) 456-7890</span>
          </div>
          <div className="social-links">
            <Link to="#" className="text-white me-3"><FaFacebook /></Link>
            <Link to="#" className="text-white me-3"><FaTwitter /></Link>
            <Link to="#" className="text-white me-3"><FaLinkedin /></Link>
            <Link to="#" className="text-white"><FaInstagram /></Link>
          </div>
        </div>
      </div>
      
      {/* Main navigation */}
      <Navbar expand="lg" className="bg-body-tertiary sticky-top">
        <Container>
          <Navbar.Brand href="#home">
            <div className="d-flex align-items-center">
              <Link to="/"> <img src={Logo} alt="Spindo Logo" className="spi-logo img-fluid me-2" /></Link>
            </div>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            {/* Left side navigation items */}
            <Nav className="me-auto">
              <Nav.Link href="/" className='custom-nav-link'>HOME</Nav.Link>
              <Nav.Link href="/AboutUs" className='custom-nav-link'>ABOUT</Nav.Link>
              
              <NavDropdown title="SERVICES" id="basic-nav-dropdown" className='custom-nav-link'>
                {loading ? (
                  <NavDropdown.Item>Loading...</NavDropdown.Item>
                ) : error ? (
                  <NavDropdown.Item>Error: {error}</NavDropdown.Item>
                ) : (
                  services.map((service) => (
                    <NavDropdown.Item 
                      key={service.id} 
                      onClick={() => handleServiceSelect(service)}
                    >
                      {service.prod_name.toUpperCase()}
                    </NavDropdown.Item>
                  ))
                )}
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={() => handleServiceSelect({ prod_name: 'OTHER SERVICES' })}>
                  OTHER SERVICES
                </NavDropdown.Item>
              </NavDropdown>

              <Nav.Link href="/ContactUs" className='custom-nav-link'>Get in Touch</Nav.Link>
              <Nav.Link href="#payment" className='custom-nav-link'>Payment</Nav.Link>
              <Nav.Link href="/Login" className='custom-nav-link'>Book Services</Nav.Link>
            </Nav>
            
            {/* Right side - Only Register and Login buttons */}
            <Nav className="ms-auto">
              <Link to="/Registration">
                <Button variant="outline-primary" className="me-2">
                  Register
                </Button>
              </Link>
              <Link to="/Login">
                <Button variant="primary">
                  Login
                </Button>
              </Link>
            </Nav>
            
            {/* Mobile contact info - only shows in mobile view */}
            <Nav className="mobile-contact d-lg-none">
              <Nav.Link href="mailto:contact@example.com" className='custom-nav-link'><FaEnvelope /> Email</Nav.Link>
              <Nav.Link href="tel:+11234567890" className='custom-nav-link'><FaPhone /> Phone</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </>
  );
}

export default NavBar;