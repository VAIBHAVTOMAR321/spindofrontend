import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import { Button } from 'react-bootstrap';
import { FaEnvelope, FaPhone, FaFacebook, FaTwitter, FaLinkedin, FaInstagram, FaThumbsUp } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import "../../assets/css/NavBar.css";
import Logo from "../../assets/images/splogo.png";    

function NavBar() {
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
       
          <Navbar.Brand href="#home">
            <div className="d-flex align-items-center">
            <Link to="/"> <img src={Logo} alt="Spindo Logo" className="spi-logo img-fluid me-2" /></Link>
          
             
            </div>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
         
          <Navbar.Collapse id="basic-navbar-nav">
            {/* Left side navigation items */}
              <Container>
            <Nav className="me-auto">
              <Nav.Link href="/">HOME</Nav.Link>
              <Nav.Link href="/AboutUs">ABOUT</Nav.Link>
              <NavDropdown title="SERVICES" id="basic-nav-dropdown">
                <NavDropdown.Item href="/VendorList">PLUMBER</NavDropdown.Item>
                <NavDropdown.Item href="#electrician">ELECTRICIAN</NavDropdown.Item>
                <NavDropdown.Item href="#carpenter">CARPENTER</NavDropdown.Item>
                <NavDropdown.Item href="#painter">PAINTER</NavDropdown.Item>
                <NavDropdown.Item href="#cleaning">CLEANING</NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item href="#other">OTHER SERVICES</NavDropdown.Item>
              </NavDropdown>
              <Nav.Link href="/ContactUs">Get in Touch</Nav.Link>
              <Nav.Link href="#payment">Payment</Nav.Link>
              <Nav.Link href="/Login">Book Services</Nav.Link>
            </Nav>
            </Container>
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
            <Nav className="mobile-contact">
              <Nav.Link href="mailto:contact@example.com"><FaEnvelope /> Email</Nav.Link>
              <Nav.Link href="tel:+11234567890"><FaPhone /> Phone</Nav.Link>
            </Nav>
          </Navbar.Collapse>
     
      </Navbar>
    </>
  );
}

export default NavBar;