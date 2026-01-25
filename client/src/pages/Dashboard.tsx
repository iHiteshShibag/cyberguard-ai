import { analyzeLogs } from "@/lib/api";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, BarChart3, Shield, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const metricsQuery = trpc.dashboard.metrics.useQuery();
  const [logData, setLogData] = useState("");
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
	
  async function handleAnalyzeThreats() {
    if (!logData.trim()) {
      setError("Please paste log data");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const result = await analyzeLogs(logData);
      setAnalysis(result);
    } catch (e) {
      setError("Failed to analyze logs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (metricsQuery.data) {
      setMetrics(metricsQuery.data);
    }
  }, [metricsQuery.data]);

  const threatCount = metrics?.threatCount || 0;
  const avgRiskScore = metrics?.avgRiskScore || 0;
  const criticalThreats = metrics?.criticalThreats || 0;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-5xl font-black tracking-tighter">CyberGuard AI</h1>
          <p className="tech-label">Security Operations Center Copilot</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Risk Score Card */}
          <Card className="blueprint-accent">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Average Risk Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-black">{avgRiskScore.toFixed(1)}</div>
                <TrendingUp className="h-8 w-8 text-orange-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Out of 100</p>
            </CardContent>
          </Card>

          {/* Total Threats Card */}
          <Card className="blueprint-accent">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Threats Detected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-black">{threatCount}</div>
                <BarChart3 className="h-8 w-8 text-blue-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">All time</p>
            </CardContent>
          </Card>

          {/* Critical Threats Card */}
          <Card className="blueprint-accent border-red-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-red-600">Critical Threats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-black text-red-600">{criticalThreats}</div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Risk score ≥ 80</p>
            </CardContent>
          </Card>

          {/* Security Status Card */}
          <Card className="blueprint-accent">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Security Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-lg font-bold">{criticalThreats === 0 ? "Secure" : "Alert"}</div>
                <Shield className="h-8 w-8 text-green-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Real-time monitoring</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="h-24 text-lg font-semibold" variant="outline">
              📤 Upload Logs
            </Button>
            <Button className="h-24 text-lg font-semibold" variant="outline" onClick={handleAnalyzeThreats}>
              🔍 Analyze Threats
            </Button>
            <Button className="h-24 text-lg font-semibold" variant="outline">
              📊 Generate Report
            </Button>
          </div>
        </div>

        {/* Threat Analysis Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Threat Analysis</CardTitle>
            <CardDescription>
              Paste raw security logs for AI-powered threat detection
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <textarea
              className="w-full min-h-[120px] rounded-md border p-3"
              placeholder="Paste security logs here..."
              value={logData}
              onChange={(e) => setLogData(e.target.value)}
            />

            <Button onClick={handleAnalyzeThreats} disabled={loading}>
              {loading ? "Analyzing..." : "Run AI Analysis"}
            </Button>

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            {analysis && (
              <div className="border rounded p-4 space-y-2">
                <p><b>Threat Type:</b> {analysis.threat_type}</p>
                <p><b>Risk Score:</b> {analysis.risk_score}/100</p>
                <p><b>Reasoning:</b> {analysis.reasoning}</p>
                <p>
                  <b>Immediate Action:</b>{" "}
                  {analysis.recommendation}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Recent Activity</h2>
          <Card>
            <CardHeader>
              <CardTitle>Latest Threats</CardTitle>
              <CardDescription>Most recent security incidents detected</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <p>No recent threats detected</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
