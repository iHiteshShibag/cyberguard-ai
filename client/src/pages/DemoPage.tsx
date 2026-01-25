import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert, ShieldCheck, Info, Loader2, FileText, AlertTriangle, Zap } from "lucide-react";

interface Storytelling {
  why_dangerous: string;
  if_ignored: string;
  mitigation: string;
}

interface IncidentReport {
  report_metadata: { report_id: string; timestamp: string; status: string };
  executive_summary: { overview: string; impact_level: string };
  technical_details: { detected_threat: string; ai_reasoning: string };
  remediation_plan: { immediate_action: string; long_term_strategy: string };
}

interface AnalysisResult {
  threat_type: string;
  risk_score: number;
  reasoning: string;
  recommendation: string;
  storytelling: Storytelling;
  report: IncidentReport;
}

export default function DemoPage() {
  const [logData, setLogData] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const handleAnalyze = async () => {
    if (!logData.trim()) return;
    setIsLoading(true);
    setResult(null);
    setShowReport(false);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logData }),
      });
      if (!response.ok) throw new Error("Analysis failed");
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Error analyzing logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const setSampleLog = () => {
    setLogData('Jan 24 10:15:03 auth-server sshd[1234]: Failed password for admin from 192.168.1.105 port 54321 ssh2\nJan 24 10:15:05 auth-server sshd[1234]: Failed password for admin from 192.168.1.105 port 54322 ssh2\nJan 24 10:15:07 auth-server sshd[1234]: Failed password for admin from 192.168.1.105 port 54323 ssh2');
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8 py-8">
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tighter uppercase">CyberGuard AI Demo</h1>
            <p className="text-muted-foreground">AI-Powered Security Operations Center (SOC) Simulation.</p>
          </div>
          <div className="bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
            <span className="text-xs font-bold text-primary flex items-center gap-1">
              <Zap className="h-3 w-3" /> Gemini Reasoning Active
            </span>
          </div>
        </div>

        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle>Log Input Stream</CardTitle>
            <CardDescription>Paste raw security logs for real-time AI classification.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea 
              placeholder="Paste logs here..." 
              className="min-h-[150px] font-mono text-sm bg-muted/30"
              value={logData}
              onChange={(e) => setLogData(e.target.value)}
            />
            <div className="flex gap-4">
              <Button onClick={handleAnalyze} disabled={isLoading || !logData.trim()} className="flex-1">
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing Patterns...</> : "Run AI Analysis"}
              </Button>
              <Button variant="outline" onClick={setSampleLog}>Load Attack Sample</Button>
            </div>
          </CardContent>
        </Card>

        {result && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* High Level Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className={result.risk_score > 50 ? "border-destructive/50 bg-destructive/5" : "border-green-500/50"}>
                <CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground">Threat Type</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-xl font-bold flex items-center gap-2">
                    {result.risk_score > 50 ? <ShieldAlert className="text-destructive" /> : <ShieldCheck className="text-green-500" />}
                    {result.threat_type}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground">Risk Score</CardTitle></CardHeader>
                <CardContent>
                  <div className={`text-2xl font-black ${result.risk_score > 70 ? 'text-destructive' : 'text-primary'}`}>{result.risk_score}/100</div>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setShowReport(!showReport)}>
                <CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground">Incident Report</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-lg font-bold flex items-center gap-2 text-primary">
                    <FileText className="h-5 w-5" /> {showReport ? "Hide Report" : "View Report"}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* AI Reasoning & Storytelling */}
            {!showReport ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <Alert className="bg-primary/5 border-primary/20">
                    <Zap className="h-4 w-4 text-primary" />
                    <AlertTitle className="font-bold">Gemini Reasoning Layer</AlertTitle>
                    <AlertDescription className="mt-2 text-sm leading-relaxed italic">
                      "{result.reasoning}"
                    </AlertDescription>
                  </Alert>
                  <Card className="bg-muted/30">
                    <CardHeader><CardTitle className="text-sm">Recommended Response</CardTitle></CardHeader>
                    <CardContent><p className="text-sm font-bold text-primary">{result.recommendation}</p></CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-lg border bg-card space-y-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-destructive">
                      <AlertTriangle className="h-4 w-4" /> Why is this dangerous?
                    </div>
                    <p className="text-sm text-muted-foreground">{result.storytelling.why_dangerous}</p>
                  </div>
                  <div className="p-4 rounded-lg border bg-card space-y-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-orange-500">
                      <Info className="h-4 w-4" /> What if ignored?
                    </div>
                    <p className="text-sm text-muted-foreground">{result.storytelling.if_ignored}</p>
                  </div>
                </div>
              </div>
            ) : (
              /* Lightweight Incident Report View */
              <Card className="border-2 border-primary/40 bg-slate-50 dark:bg-slate-900 font-mono text-xs">
                <CardHeader className="border-b bg-muted/50">
                  <div className="flex justify-between items-center">
                    <CardTitle>INCIDENT_REPORT_{result.report.report_metadata.report_id}</CardTitle>
                    <span className="bg-destructive text-white px-2 py-1 rounded">{result.report.report_metadata.status}</span>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <section>
                    <h4 className="font-bold text-primary mb-2 underline">EXECUTIVE SUMMARY</h4>
                    <p>{result.report.executive_summary.overview}</p>
                    <p className="mt-1">IMPACT: {result.report.executive_summary.impact_level}</p>
                  </section>
                  <section>
                    <h4 className="font-bold text-primary mb-2 underline">TECHNICAL ANALYSIS</h4>
                    <p>DETECTION: {result.report.technical_details.detected_threat}</p>
                    <p className="mt-2">AI_REASONING: {result.report.technical_details.ai_reasoning}</p>
                  </section>
                  <section>
                    <h4 className="font-bold text-primary mb-2 underline">REMEDIATION PLAN</h4>
                    <p>IMMEDIATE: {result.report.remediation_plan.immediate_action}</p>
                    <p className="mt-1">STRATEGY: {result.report.remediation_plan.long_term_strategy}</p>
                  </section>
                  <div className="pt-4 border-t text-[10px] text-muted-foreground">
                    GENERATED_BY: CYBERGUARD_AI_CORE // TIMESTAMP: {result.report.report_metadata.timestamp}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
