import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { Shield, Upload, Zap, FileText, MessageCircle } from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const isDev = import.meta.env.MODE === "development";

  if (isAuthenticated) {
    navigate("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8" />
              <h1 className="text-2xl font-black">CyberGuard AI</h1>
            </div>
            {isDev ? (
              <Button onClick={() => navigate("/dashboard")}>Enter Dashboard (Dev Mode)</Button>
            ) : (
              <Button onClick={() => (window.location.href = getLoginUrl())}>Sign In</Button>
            )}
          </div>
        </div>
      </header>

      <section className="flex-1 container py-20">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="space-y-4 text-center">
            <h1 className="text-6xl font-black tracking-tighter">AI-Powered SOC Copilot</h1>
            <p className="text-xl text-muted-foreground">
              Detect threats, understand attacks, and respond faster with artificial intelligence
            </p>
          </div>

          <div className="flex justify-center gap-4">
            {isDev ? (
              <Button size="lg" onClick={() => navigate("/dashboard")}>
                Get Started (Dev Mode)
              </Button>
            ) : (
              <Button size="lg" onClick={() => (window.location.href = getLoginUrl())}>
                Get Started
              </Button>
            )}
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12">
            <Card className="blueprint-accent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Log Ingestion
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Upload CSV, JSON, or syslog files. Automatic normalization and parsing.
                </p>
              </CardContent>
            </Card>

            <Card className="blueprint-accent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Threat Detection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  AI-powered threat classification with MITRE ATT&CK mapping and risk scoring.
                </p>
              </CardContent>
            </Card>

            <Card className="blueprint-accent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  SOC Copilot
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Ask natural language questions about your security logs and threats.
                </p>
              </CardContent>
            </Card>

            <Card className="blueprint-accent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Report Generation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Generate executive and technical reports with PDF export.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-6">
        <div className="container text-center text-sm text-muted-foreground">
          <p>CyberGuard AI - Enterprise Security Operations Center Platform</p>
        </div>
      </footer>
    </div>
  );
}
