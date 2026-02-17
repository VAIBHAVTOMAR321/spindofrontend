import React from 'react'
import { Container } from 'react-bootstrap'
import "../../assets/css/home.css"

function AboutUs() {
  return (
    <div className="home-container">
      <div className="home-background"></div>
      <div className="home-overlay"></div>
      
      <Container>
        <div className="home-content">
          <h1 className="home-title">OUR VISION, MISSION, PHILOSOPHY</h1>
          
          <p className="home-text">
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
          
          <p className="home-text">
            We are committed to delivering a consistently high-quality, standardized, and reliable service experience to our customers. To fulfil this commitment, we collaborate closely with our hand-picked service partners. We empower them with cutting-edge technology, comprehensive training, quality products, specialized tools, financial support, insurance coverage, and the strength of our brand. By doing so, we enable our partners to succeed and uphold our promise of excellence in service delivery.
          </p>
          
          <h2 className="home-subtitle">Our Vision</h2>
          <p className="home-text">
            To make it convenient for professionals to provide their services and enhance the overall customer experience through our innovative technology platform.
          </p>
          
          <h2 className="home-subtitle">Our Mission</h2>
          <p className="home-text">
            To revolutionize the home service industry by connecting skilled professionals with customers through a seamless digital experience, ensuring quality, reliability, and convenience for all.
          </p>
          
          <h2 className="home-subtitle">Our Philosophy</h2>
          <p className="home-text">
            We believe in empowering our service partners with the right tools, training, and technology to deliver exceptional services. By creating a symbiotic relationship between customers and service providers, we aim to build a community where quality services are accessible to everyone.
          </p>
        </div>
      </Container>
    </div>
  )
}

export default AboutUs