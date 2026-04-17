import { Outlet } from "react-router-dom";
import Navbar from "../components/user/Navbar";
import Footer from "../components/user/Footer";

export default function PageLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />
      <main className="flex-1 pt-24 pb-16 px-6">
        <Outlet /> 
      </main>
      <Footer />
    </div>
  );
}
