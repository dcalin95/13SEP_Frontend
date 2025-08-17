// 🌍 Global styles (must be first)
import "react-toastify/dist/ReactToastify.css";
import "./styles/GlobalStyles.css";
import "./toastStyle.css";

// 🧠 Core React
import React, { useState, Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";

// 🧩 Layout & UI
import Header from "./components/Header";
import Footer from "./components/Footer";
import BoostedBanner from "./components/BoostedBanner";
import HeaderWalletInfo from "./context/HeaderWalletInfo";
import StarfieldBackground from "./components/StarfieldBackground";
import CustomCursor from "./components/CustomCursor";
import ErrorBoundary from "./components/ErrorBoundary";
import SidebarMenu from "./SidebarMenu/SidebarMenu";
import HamburgerButton from "./HamburgerButton/HamburgerButton";
import ThemeChecker from "./components/ThemeChecker";

// 🔄 State/Loading
import LoadingSpinner from "./components/LoadingSpinner";
import PWAInstallPrompt from "./components/PWAInstallPrompt";

// 📱 Mobile
import MobileUI from "./components/MobileUI";

// 📊 Analytics
import CryptoAnalyticsDashboard from "./components/CryptoAnalyticsDashboard";
import MarketingDashboard from "./components/MarketingDashboard";

// 🎛 UI/UX Enhancements
import UIControls from "./components/UIControls";
import AIPortfolioLauncher from "./components/AIPortfolioLauncher";

// 📈 Google Analytics
import GoogleAnalyticsWrapper from "./components/GoogleAnalyticsWrapper";

// 📄 Lazy Loaded Pages
const Home = lazy(() => import("./components/Home"));
const Whitepaper = lazy(() => import("./components/Whitepaper"));
const About = lazy(() => import("./components/About"));
const HowToBuy = lazy(() => import("./components/HowToBuy"));
const TokenomicsPage = lazy(() => import("./components/TokenomicsPage"));
const HowItWorks = lazy(() => import("./components/HowItWorks"));
const Roadmap = lazy(() => import("./components/Roadmap"));
const StakingPage = lazy(() => import("./Staking/StakingPage"));
const Scheme = lazy(() => import("./components/Scheme/Scheme"));
const AIBitSwapDEXAssistant = lazy(() => import("./openai/AIAssistantBox"));
const PresaleDashboard = lazy(() => import("./Presale/Timer/PresaleDashboard"));
const AdminPanel = lazy(() => import("./Presale/Timer/logic/AdminPanel"));
const SidebarDashboard = lazy(() => import("./SidebarMenu/SidebarDashboard"));
const PresaleHistory = lazy(() => import("./Presale/Timer/PresaleHistory"));

const PresalePage = lazy(() => import("./Presale/PresalePage"));
const PaymentBox = lazy(() => import("./Presale/PaymentBox/PaymentBox"));

const RewardsHub = lazy(() => import("./Presale/Rewards/Dashboard"));
const RewardDashboard = lazy(() => import("./components/RewardsDashboard/RewardsDashboard"));
const InvitePage = lazy(() => import("./components/Invite/InvitePage"));
const BitcoinAcademy = lazy(() => import("./components/BitcoinAcademy"));
const ProofOfTransferPage = lazy(() => import("./components/BitcoinAcademy/pages/ProofOfTransferPage"));
const EducationPage = lazy(() => import("./components/EducationPageModern"));
const AIPortfolioPage = lazy(() => import("./components/AIPortfolioPage"));
const STXPaperTrade = lazy(() => import("./papertrade/STXPaperTrade"));
const TokenPaperTrade = lazy(() => import("./papertrade/TokenPaperTrade"));

const TermsPart1 = lazy(() => import("./Legal/TermsPart1"));
const TermsPart2 = lazy(() => import("./Legal/TermsPart2"));
const TermsPart3 = lazy(() => import("./Legal/TermsPart3"));
const Privacy = lazy(() => import("./Legal/Privacy"));

const WalletTestComponent = lazy(() => import("./context/wallet/WalletTestComponent"));

const App = () => {
  const [amountPay, setAmountPay] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState("home");

  const toggleMenu = () => setMenuOpen((prev) => !prev);

  const handleSidebarSelect = (section) => {
    setCurrentSection(section);
    setMenuOpen(false);

    if (typeof window !== "undefined" && window.trackGoogleAnalytics) {
      window.trackGoogleAnalytics.trackEngagement("navigation", {
        section,
        navigation_type: "sidebar",
      });
    }
  };

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="dark"
        className="bits-toast-container"
        toastClassName="bits-toast"
      />

      <Router>
        <GoogleAnalyticsWrapper>
          <ErrorBoundary>
            <MobileUI>
              <div className="app-container">
                <CustomCursor />
                <StarfieldBackground />
                <Header />
                <BoostedBanner />
                <div className="header-spacer"></div>
                <HeaderWalletInfo />
                <ThemeChecker />

                <SidebarMenu
                  isMenuOpen={menuOpen}
                  setCurrentSection={handleSidebarSelect}
                  currentSection={currentSection}
                />
                <HamburgerButton
                  isMenuOpen={menuOpen}
                  toggleMenu={toggleMenu}
                />

                <div className="content-container">
                  <Suspense fallback={<LoadingSpinner />}>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/whitepaper" element={<Whitepaper />} />
                      <Route path="/how-to-buy" element={<HowToBuy />} />
                      <Route path="/staking" element={<StakingPage />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/tokenomics" element={<TokenomicsPage />} />
                      <Route path="/how-it-works" element={<HowItWorks />} />
                      <Route path="/roadmap" element={<Roadmap />} />
                      <Route path="/scheme-test" element={<Scheme />} />
                      <Route path="/ai-portfolio" element={<AIPortfolioPage />} />
                      <Route path="/ai-portfolio/:portfolioId" element={<AIPortfolioPage />} />
                      <Route path="/paper-trade/stx" element={<STXPaperTrade />} />
                      <Route path="/paper-trade/:symbol" element={<TokenPaperTrade />} />
                      <Route path="/ai-assistant" element={<AIBitSwapDEXAssistant />} />
                      <Route path="/presale" element={<PresalePage />} />
                      <Route path="/rewards-hub" element={<RewardsHub />} />
                      <Route path="/reward-dashboard" element={<RewardDashboard />} />
                      <Route path="/bitcoin-academy" element={<BitcoinAcademy />} />
                      <Route path="/proof-of-transfer" element={<ProofOfTransferPage />} />
                      <Route path="/education" element={<EducationPage />} />
                      <Route path="/admin-test" element={<AdminPanel />} />
                      <Route path="/test-dashboard" element={<PresaleDashboard />} />
                      <Route path="/dashboard" element={<SidebarDashboard />} />
                      <Route path="/admin/history" element={<PresaleHistory />} />
                      <Route path="/invite" element={<InvitePage />} />
                      <Route
                        path="/terms"
                        element={
                          <>
                            <TermsPart1 />
                            <TermsPart2 />
                            <TermsPart3 />
                          </>
                        }
                      />
                      <Route path="/privacy-policy" element={<Privacy />} />
                      <Route path="/wallet-test" element={<WalletTestComponent />} />
                      <Route
                        path="/test-payment"
                        element={
                          <PaymentBox
                            selectedToken="BNB"
                            selectedChain="BSC"
                            amountPay={amountPay}
                            setAmountPay={setAmountPay}
                            tokenPrices={{ BNB: { price: 650 } }}
                            pricesLoading={false}
                          />
                        }
                      />
                    </Routes>
                  </Suspense>
                </div>

                <Footer />
                <PWAInstallPrompt />
                <AIPortfolioLauncher />
              </div>
            </MobileUI>

            {/* Dashboards & Floating UI */}
            <CryptoAnalyticsDashboard />
            <MarketingDashboard />
            <UIControls position="bottom-right" />
          </ErrorBoundary>
        </GoogleAnalyticsWrapper>
      </Router>
    </>
  );
};

export default App;
