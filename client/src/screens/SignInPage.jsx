import { SignIn, useAuth } from "@clerk/react";
import { Navigate } from "react-router-dom";
import { Check } from "lucide-react";
import "./SignInPage.css";

export default function SignInPage() {
  const { isLoaded, userId } = useAuth();

  if (isLoaded && userId) {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="signin-layout">
      {/* Left Pane */}
      <div className="signin-left">
        <div className="signin-left-content">
          <div className="signin-logo-container">
            <div className="signin-logo-icon">
              {/* Using a placeholder SVG similar to the SentinelNexus logo */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="signin-logo-text">The Shelf</span>
          </div>

          <h1 className="signin-heading">Welcome back to The Shelf</h1>
          
          <p className="signin-description">
            Your agentic curator built to actively forge your potential. Ensure your Identity Ledger is aligned with your future self.
          </p>

          <div className="signin-divider"></div>

          <ul className="signin-features">
            <li>
              <Check className="signin-check" size={18} />
              <span>Agentic Curation</span>
            </li>
            <li>
              <Check className="signin-check" size={18} />
              <span>Divergence Tracking</span>
            </li>
            <li>
              <Check className="signin-check" size={18} />
              <span>Auditable AI Models</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Right Pane */}
      <div className="signin-right">
        <div className="signin-clerk-container">
          <SignIn 
            path="/login"
            routing="path"
            forceRedirectUrl="/app" 
            fallbackRedirectUrl="/app" 
            signUpForceRedirectUrl="/app"
            appearance={{
              variables: {
                colorPrimary: '#8b5cf6',
                colorText: '#111827',
                colorTextSecondary: '#4b5563',
                colorBackground: '#ffffff',
                colorInputBackground: '#ffffff',
                colorInputText: '#111827',
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
