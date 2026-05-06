import { Outlet } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import BottomNav from "./components/BottomNav";

export default function App() {
  return (
    <div className="min-h-screen bg-[#050918] text-white">
      <Header />
      <main className="min-h-[calc(100vh-132px)] bg-[radial-gradient(circle_at_22%_6%,rgba(56,189,248,0.28),transparent_34%),radial-gradient(circle_at_85%_18%,rgba(32,199,255,0.14),transparent_30%),#050918] pb-24 sm:pb-8">
        <Outlet />
      </main>
      <BottomNav />
      <Footer />
    </div>
  );
}
