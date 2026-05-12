import { Outlet } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import BottomNav from "./components/BottomNav";
import { LanguageProvider } from "./lib/language";
import { ThemeProvider, useTheme } from "./lib/theme";

export default function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AppShell />
      </ThemeProvider>
    </LanguageProvider>
  );
}

function AppShell() {
  const { theme } = useTheme();

  return (
    <div className={`theme-${theme} app-shell min-h-screen text-white`}>
      <Header />
      <main className="app-main min-h-[calc(100vh-132px)] pb-24 sm:pb-8">
        <Outlet />
      </main>
      <BottomNav />
      <Footer />
    </div>
  );
}
