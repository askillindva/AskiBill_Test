import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";

export default function Landing() {
  const [, setLocation] = useLocation();
  
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  const handleAuthPage = () => {
    setLocation("/auth");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Branding */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM8 13a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-text-primary">AskiBill</h1>
          <p className="text-text-secondary mt-2">Smart expense tracking for busy professionals</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-lg">
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-text-primary mb-2">Welcome to AskiBill</h2>
                <p className="text-sm text-text-secondary">
                  Track your expenses, manage your budget, and gain insights into your spending habits.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-sm text-text-secondary">
                  <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <span>Secure expense tracking</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-text-secondary">
                  <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <span>Monthly and annual insights</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-text-secondary">
                  <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <span>Personalized financial summary</span>
                </div>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={handleAuthPage}
                  className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-3 px-4 rounded-lg transition-all duration-200"
                  size="lg"
                >
                  Sign In with Mobile/Email
                </Button>
                <Button 
                  onClick={handleLogin}
                  variant="outline"
                  className="w-full font-medium py-3 px-4 rounded-lg transition-all duration-200"
                  size="lg"
                >
                  Continue with Replit
                </Button>
                <p className="text-xs text-center text-text-secondary">
                  New users will automatically create an account
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
