import React from 'react'
import { Container, Row, Col, Card } from 'react-bootstrap'
import "../../assets/css/home.css";
import Payment from "../../assets/images/payment_qr.png";
import { Link } from 'react-router-dom';

function PaymentQR() {
  return (
    <>
   
  
        <div className="Contact-banner">
          <div className="site-breadcrumb-wpr">
            <h2 className="breadcrumb-title">Payment QR</h2>
            <ul className="breadcrumb-menu clearfix">
              <li><Link className="breadcrumb-home" to="/" data-discover="true">Home</Link></li>
              <li className="px-2">/</li>
              <li><Link className="breadcrumb-contact" to="#" data-discover="true">Payment QR</Link></li>
            </ul>
          </div>
        </div>
   
  
      <Container className="my-2 container-box ">
       <div className='qr-heading'>
        <h1>For Booking Confirmation make Payment</h1>
        <div className='d-flex justify-content-center'>
        <img src={Payment} alt='Payment QR Code' className='img-fluid'></img>
        </div>
       </div>
         
      </Container>
    </>
  )
}

export default PaymentQR