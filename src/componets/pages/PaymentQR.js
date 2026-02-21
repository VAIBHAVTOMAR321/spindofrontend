import React from 'react'
import { Container, Row, Col, Card } from 'react-bootstrap'
import "../../assets/css/home.css";
import Payment from "../../assets/images/payment_qr.png";

function PaymentQR() {
  return (
    <>
   
  
        <div className="Contact-banner">
          <div className="site-breadcrumb-wpr">
            <h2 className="breadcrumb-title">Payment QR</h2>
            <ul className="breadcrumb-menu clearfix">
              <li><a className="breadcrumb-home" href="/" data-discover="true">Home</a></li>
              <li className="px-2">/</li>
              <li><a className="breadcrumb-contact" href="/contact" data-discover="true">Payment QR</a></li>
            </ul>
          </div>
        </div>
   
  
      <Container className="my-2 container-box ">
       <div className='qr-heading'>
        <h1>For Booking Confirmation make Payment</h1>
        <img src={Payment} alt='Payment QR Code' className='img-fluid'></img>
       </div>
         
      </Container>
    </>
  )
}

export default PaymentQR