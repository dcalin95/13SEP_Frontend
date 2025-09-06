import React from "react";
import { useSpring, animated } from "@react-spring/web";
import { useNavigate } from "react-router-dom";
import "./HowToBuy.css";

const HowToBuy = ({ setCurrentSection }) => {
  const navigate = useNavigate();

  const cardData = [
    {
      imageSrc: "https://cdn.pixabay.com/photo/2017/08/06/08/05/bitcoin-2592145_960_720.jpg",
      title: "Step 1: Connect Your Wallet",
      description: "Choose a trusted wallet like MetaMask, TrustWallet, or Ledger. This ensures your funds are stored securely.",
    },
    {
      imageSrc: "https://cdn.pixabay.com/photo/2018/10/15/18/37/bitcoin-3748224_960_720.jpg",
      title: "Step 2: Select Payment Method",
      description: "Pay with BNB, USDT, or USDC. Our platform supports multiple payment options for your convenience.",
    },
    {
      imageSrc: "https://cdn.pixabay.com/photo/2020/04/08/20/38/cryptocurrency-5026238_960_720.jpg",
      title: "Step 3: Enter Purchase Amount",
      description: "Decide the amount of $BITS you want to buy and confirm your transaction in seconds.",
    },
    {
      imageSrc: "https://cdn.pixabay.com/photo/2021/05/31/16/29/artificial-intelligence-6292681_960_720.jpg",
      title: "Step 4: Discover AI Analytics",
      description: "Access AI-powered predictions and analytics to optimize your trading decisions.",
    },
    {
      imageSrc: "https://cdn.pixabay.com/photo/2022/06/12/12/13/artificial-intelligence-7252235_960_720.jpg",
      title: "Step 5: Advanced Portfolio Tools",
      description: "Leverage AI-driven portfolio management tools to track and grow your investments.",
    },
    {
      imageSrc: "https://cdn.pixabay.com/photo/2019/06/11/18/56/artificial-intelligence-4263702_960_720.jpg",
      title: "Step 6: Enjoy Lightning-Fast Transactions",
      description: "Experience secure and seamless transactions with zero delays, backed by blockchain technology.",
    },
  ];

  const InteractiveCard = ({ imageSrc, title, description }) => {
    const [springProps, api] = useSpring(() => ({
      scale: 1,
      rotateX: 0,
      rotateY: 0,
      config: { mass: 1, tension: 300, friction: 20 },
    }));

    const handleMouseMove = (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const rotateX = -(y / rect.height - 0.5) * 15;
      const rotateY = (x / rect.width - 0.5) * 15;

      api.start({
        scale: 1.05,
        rotateX,
        rotateY,
      });
    };

    const handleMouseLeave = () => {
      api.start({
        scale: 1,
        rotateX: 0,
        rotateY: 0,
      });
    };

    return (
      <animated.div
        className="info-card"
        style={{
          transform: springProps.scale.to(
            (s) =>
              `scale(${s}) rotateX(${springProps.rotateX.get()}deg) rotateY(${springProps.rotateY.get()}deg)`
          ),
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <img className="info-image" src={imageSrc} alt={title} />
        <div className="info-content">
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </animated.div>
    );
  };

  const ctaSpring = useSpring({
    from: { scale: 1 },
    to: async (next) => {
      while (true) {
        await next({ scale: 1.1 });
        await next({ scale: 1 });
      }
    },
    config: { mass: 1, tension: 200, friction: 10 },
  });

  const handleClick = () => {
    if (typeof setCurrentSection === "function") {
      setCurrentSection("presale"); // ✅ doar schimbă secțiunea
    } else {
      navigate("/presale"); // ✅ doar dacă ești în altă pagină
    }
  };

  return (
    <div className="how-to-buy-container">
      {/* Header */}
      <header className="how-to-buy-header">
        <div className="header-bg">
          <h1 className="header-title">
            Your Guide to <span className="highlight">$BITS</span> Transactions
          </h1>
          <p className="header-subtitle">
            Secure, intelligent, and fast trading backed by AI-powered tools.
          </p>
        </div>
      </header>

      {/* Info Section */}
      <div className="info-section">
        {cardData.map((card, index) => (
          <InteractiveCard
            key={index}
            imageSrc={card.imageSrc}
            title={card.title}
            description={card.description}
          />
        ))}
      </div>

      {/* CTA */}
      <div className="cta-section">
        <h2 className="cta-title">Start Your Crypto Journey Today</h2>
        <animated.button
          className="cta-button"
          style={{
            transform: ctaSpring.scale.to((s) => `scale(${s})`),
          }}
          onClick={handleClick}
        >
          Get Started
        </animated.button>
      </div>
    </div>
  );
};

export default HowToBuy;
