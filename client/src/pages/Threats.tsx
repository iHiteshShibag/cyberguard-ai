import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, Shield, Zap, Eye } from "lucide-react";
import { useLocation } from "wouter";

const threatIcons: Record<string, React.ReactNode> = {
  phishing: <AlertTriangle className="h-5 w-5 text-orange-500" />,
  brute_force: <Zap className="h-5 w-5 text-red-500" />,
  malware: <Shield className="h-5 w-5 text-purple-500" />,
  lateral_movement: <Eye className="h-5 w-5 text-blue-500" />,
  data_exfiltration: <AlertTriangle className="h-5 w-5 text-red-600" />,
  privilege_escalation: <Zap className="h-5 w-5 text-orange-600" />,
  unknown: <Shield className="h-5 w-5 text-gray-500" />,
};

const severityColors: Record<string, string> = {
  critical: "bg-red-100 text-red-800 border-red-300",
  high: "bg-orange-100 text-orange-800 border-orange-300",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
  low: "bg-green-100 text-green-800 border-green-300",
};

export default function Threats() {
  const [, navigate] = useLocation();
  const [threats, setThreats] = useState<any[]>([]);
  const threatsQuery = trpc.threats.list.useQuery({ limit: 100, offset: 0 });

  useEffect(() => {
    if (threatsQuery.data) {
      setThreats(threatsQuery.data);
    }
  }, [threatsQuery.data]);

  const getRiskLevel = (score: number | null) => {
    if (!score) return "low";
    if (score >= 80) return "critical";
    if (score >= 60) return "high";
    if (score >= 40) return "medium";
    return "low";
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-5xl font-black tracking-tighter">Threat Detections</h1>
          <p className="tech-label">AI-Powered Security Analysis</p>
        </div>

        {threats.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Shield className="h-12 w-12 mx-auto mb-4 text-green-500 opacity-50" />
              <p className="text-lg font-semibold mb-2">No threats detected</p>
              <p className="text-sm text-muted-foreground">Upload security logs to begin analysis</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {threats.map((threat) => (
              <Card
                key={threat.id}
                className="blueprint-accent cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/threats/${threat.id}`)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="mt-1">
                        {threatIcons[threat.threatType || "unknown"]}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-lg capitalize">
                            {threat.threatType?.replace(/_/g, " ") || "Unknown Threat"}
                          </h3>
                          <Badge
                            className={`${severityColors[getRiskLevel(threat.riskScore ? Number(threat.riskScore) : 0)]}`}
                          >
                            {getRiskLevel(threat.riskScore ? Number(threat.riskScore) : 0).toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {threat.description || "No description available"}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {threat.mitreAttackIds && threat.mitreAttackIds.length > 0 && (
                            <div className="flex gap-1">
                              {threat.mitreAttackIds.slice(0, 3).map((id: string) => (
                                <Badge key={id} variant="outline" className="text-xs">
                                  {id}
                                </Badge>
                              ))}
                              {threat.mitreAttackIds.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{threat.mitreAttackIds.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-black">
                        {threat.riskScore ? Number(threat.riskScore).toFixed(0) : "0"}
                      </div>
                      <p className="text-xs text-muted-foreground">Risk Score</p>
                      <Button variant="ghost" size="sm" className="mt-3">
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
