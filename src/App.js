import "./App.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fontsource/poppins";
import "bootstrap-icons/font/bootstrap-icons.css";
// import "../src/componets/custom/style.css";
import {
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import Home from "./componets/pages/Home";
import AdminDashBoard from "./componets/admin_dashboard/AdminDashBoard";
import NavBar from "./componets/navbar/NavBar";
import Login from "./componets/login/Login";
import Registration from "./register/Registration";
import UserDashBoard from "./componets/user_dashboard/UserDashBoard";
import UserProfile from "./componets/user_dashboard/UserProfile";
import UserQuery from "./componets/user_dashboard/UserQuery";
import UserAllQuery from "./componets/user_dashboard/UserAllQuery";
import RequestService from "./componets/user_dashboard/RequestService";
import ViewRequestService from "./componets/user_dashboard/ViewRequestService";
import VendorDashBoard from "./componets/vendor_dashboard/VendorDashBoard";
import StaffDashBoard from "./componets/staff_dashboard/StaffDashBoard";
import AboutUs from "./componets/pages/AboutUs";
import VendorRegistration from "./componets/staff_dashboard/vendor_reg/VendorRegistration";
import TotalRegistration from "./componets/admin_dashboard/pages/TotalRegistration";
import ServiceCategory from "./componets/admin_dashboard/service-category/ServiceCategory";
import Protected from "./componets/protected/Protected";
import ManageServiceCategory from "./componets/admin_dashboard/service-category/ManageServiceCategory";

function App() {
  const location = useLocation();

  const hiddenPaths = new Set([
    "/AdminDashBoard",
    "/UserDashBoard",
    "/StaffDashBoard",
    "/VendorDashBoard",
    "/VendorRegistration",
    "/TotalRegistration",
    "/ServiceCategory",
    "/ManageServiceCategory",
    "/UserProfile",
    "/UserQuery",
    "/UserAllQuery",
    "/RequestService",
    "/ViewRequestService",
    "/RegisteredUsers",
    "/RegisteredVendor",
    "/RequestServices",
    "/OnlineQuery"
  ]);

  const shouldHideNavbar = hiddenPaths.has(location.pathname);
  
  return (
    <div className="app-container">
      {!shouldHideNavbar && <NavBar />}
      
      <main className="main-content">
        <Routes>
          {/* Public Route */}
          <Route path="/" element={<Home />} />
          <Route path="/Registration" element={<Registration />} />
          <Route path="/Login" element={<Login />} />
          <Route path="/AboutUs" element={<AboutUs />} />
          <Route path="/ServicesPage" element={<ServicesPage />} />
          <Route path="/VendorList" element={<VendorList />} />

          {/* Protected Routes */}
          <Route 
            path="/AdminDashBoard" 
            element={
              <Protected allowedRoles={['admin']}>
                <AdminDashBoard />
              </Protected>
            } 
          />
          <Route 
            path="/UserDashBoard" 
            element={
              <Protected allowedRoles={['customer']}>
                <UserDashBoard />
              </Protected>
            } 
          />
            <Route
            path="/UserProfile"
            element={
              <Protected allowedRoles={['customer']}>
                <UserProfile />
              </Protected>
            } 
          />
          <Route
            path="/UserQuery"
            element={
              <Protected allowedRoles={['customer']}>
                <UserQuery />
              </Protected>
            } 
          />
          <Route
            path="/UserAllQuery"
            element={
              <Protected allowedRoles={['customer']}>
                <UserAllQuery />
              </Protected>
            } 
          />
          <Route
            path="/RequestService"
            element={
              <Protected allowedRoles={['customer']}>
                <RequestService />
              </Protected>
            } 
          />
          <Route
            path="/ViewRequestService"
            element={
              <Protected allowedRoles={['customer']}>
                <ViewRequestService />
              </Protected>
            } 
          />
          <Route 
            path="/StaffDashBoard" 
            element={
              <Protected allowedRoles={['staffadmin']}>
                <StaffDashBoard />
              </Protected>
            } 
          />
          <Route 
            path="/VendorDashBoard" 
            element={
              <Protected allowedRoles={['vendor']}>
                <VendorDashBoard />
              </Protected>
            } 
          />
          <Route 
            path="/VendorRegistration" 
            element={
              <Protected allowedRoles={['staffadmin']}>
                <VendorRegistration />
              </Protected>
            } 
          />
          <Route 
            path="/TotalRegistration" 
            element={
              <Protected allowedRoles={['admin']}>
                <TotalRegistration />
              </Protected>
            } 
          />
          <Route 
            path="/ServiceCategory" 
            element={
              <Protected allowedRoles={['admin']}>
                <ServiceCategory />
              </Protected>
            } 
          />
            <Route 
            path="/ManageServiceCategory" 
            element={
              <Protected allowedRoles={['admin']}>
                <ManageServiceCategory />
              </Protected>
            } 
          />
          <Route 
            path="/RegisteredUsers" 
            element={
              <Protected allowedRoles={['admin']}>
                <RegisteredUsers />
              </Protected>
            } 
          />
          <Route 
            path="/RegisteredVendor" 
            element={
              <Protected allowedRoles={['admin']}>
                <RegisteredVendor />
              </Protected>
            } 
          />
          <Route 
            path="/RequestServices" 
            element={
              <Protected allowedRoles={['admin']}>
                <RequestServices />
              </Protected>
            } 
          />
          <Route 
            path="/OnlineQuery" 
            element={
              <Protected allowedRoles={['admin']}>
                <AllQueries />
              </Protected>
            } 
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
