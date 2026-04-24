import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Wizard from "./pages/Wizard";
import OrderStatus from "./pages/OrderStatus";
import Download from "./pages/Download";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Cookies from "./pages/Cookies";
import DeleteMyData from "./pages/DeleteMyData";
import Admin from "./pages/Admin";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";

export default function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/wizard" element={<Wizard />} />
          <Route path="/orders/:orderId/status" element={<OrderStatus />} />
          <Route path="/orders/:orderId/download" element={<Download />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/cookies" element={<Cookies />} />
          <Route path="/delete-my-data" element={<DeleteMyData />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
