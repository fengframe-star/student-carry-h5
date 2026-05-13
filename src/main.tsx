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
import MessagesPage from "./pages/MessagesPage";
import ChatDetailPage from "./pages/ChatDetailPage";
import RequestDetailPage from "./pages/RequestDetailPage";
import CarryDetailPage from "./pages/CarryDetailPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<App />}>
          <Route index element={<LandingPage />} />
          <Route path="market" element={<MarketPage />} />
          <Route path="market/request/:id" element={<RequestDetailPage />} />
          <Route path="market/carry/:id" element={<CarryDetailPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="messages/:conversationId" element={<ChatDetailPage />} />
          <Route path="my" element={<MyPage />} />
          <Route path="post-request" element={<PostRequestPage />} />
          <Route path="carry-earn" element={<CarryEarnPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="terms" element={<TermsPage />} />
          <Route path="privacy" element={<PrivacyPolicyPage />} />
          <Route path="admin" element={<AdminDashboardPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
