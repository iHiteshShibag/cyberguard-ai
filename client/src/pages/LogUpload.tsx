import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function LogUpload() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [sourceType, setSourceType] = useState<string>("firewall");
  const [isUploading, setIsUploading] = useState(false);
  const [logData, setLogData] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

 const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
   const file = e.target.files?.[0];
   if (!file) return;
 
   const reader = new FileReader();
   reader.onload = () => {
     setLogData(reader.result as string);
   };
   reader.readAsText(file);
 };

  const uploadMutation = trpc.logs.upload.useMutation({
    onSuccess: (data) => {
      toast.success(`Successfully uploaded ${data.logsCreated} logs`);
      setFile(null);
      setIsUploading(false);
    },
    onError: (error) => {
      toast.error(`Upload failed: ${error.message}`);
      setIsUploading(false);
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    setIsUploading(true);
    const content = await file.text();

    uploadMutation.mutate({
      sourceType: sourceType as any,
      logData: content,
      fileName: file.name,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-5xl font-black tracking-tighter">Upload Security Logs</h1>
          <p className="tech-label">CSV, JSON, or syslog format supported</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Area */}
          <div className="lg:col-span-2">
            <Card className="blueprint-accent">
              <CardHeader>
                <CardTitle>Select Log File</CardTitle>
                <CardDescription>Drag and drop or click to browse</CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                    dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-semibold mb-2">Drag logs here</p>
                  <p className="text-sm text-gray-500 mb-4">or</p>
                  <label>
                    <input
                      type="file"
                      accept=".csv,.json,.log,.txt"
                      onChange={handleChange}
                      className="hidden"
                    />
                    <Button variant="outline" className="cursor-pointer">
                      Browse Files
                    </Button>
                  </label>
                </div>

                {file && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{file.name}</p>
                      <p className="text-xs text-gray-600">{(file.size / 1024).toFixed(2)} KB</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFile(null)}
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Configuration */}
          <div className="space-y-4">
            <Card className="blueprint-accent">
              <CardHeader>
                <CardTitle className="text-lg">Log Source</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Source Type</label>
                  <Select value={sourceType} onValueChange={setSourceType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="firewall">Firewall</SelectItem>
                      <SelectItem value="ids">IDS/IPS</SelectItem>
                      <SelectItem value="auth_server">Auth Server</SelectItem>
                      <SelectItem value="endpoint">Endpoint</SelectItem>
                      <SelectItem value="siem">SIEM</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleUpload}
                  disabled={!file || isUploading}
                  className="w-full"
                >
                  {isUploading ? "Uploading..." : "Upload & Analyze"}
                </Button>
              </CardContent>
            </Card>

            {/* Info Box */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Supported Formats
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p>• CSV with headers</p>
                <p>• JSON arrays</p>
                <p>• Syslog format</p>
                <p>• Plain text logs</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
