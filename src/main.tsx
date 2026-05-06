import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import App from "./App";
import LandingPage from "./pages/LandingPage";
import PostRequestPage from "./pages/PostRequestPage";
import CarryEarnPage from "./pages/CarryEarnPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import RegisterPage from "./pages/RegisterPage";
import MarketPage from "./pages/MarketPage";
import MyPage from "./pages/MyPage";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<App />}>
          <Route index element={<LandingPage />} />
          <Route path="market" element={<MarketPage />} />
          <Route path="my" element={<MyPage />} />
          <Route path="post-request" element={<PostRequestPage />} />
          <Route path="carry-earn" element={<CarryEarnPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="admin" element={<AdminDashboardPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
