import { useState, useEffect } from 'react';
import { HeaderBar } from '@/components/layout/HeaderBar';
import { SideNav } from '@/components/layout/SideNav';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Bell,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  Mail,
  Settings,
  Send,
  RefreshCw,
  Store,
  MessageSquare,
  Activity,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { useData } from '@/contexts/DataContext';
import emailService, { StoreAlert, AlertConfig } from '@/services/emailService';
import authService from '@/services/authService';

interface Alert {
  id: string;
  storeCode: string;
  storeName: string;
  state: string;
  city: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'positive';
  type: 'nps_drop' | 'detractor_spike' | 'trend_decline' | 'improvement';
  message: string;
  currentNPS: number;
  previousNPS: number;
  change: number;
  detractorCount: number;
  totalResponses: number;
  status: 'active' | 'investigating' | 'acknowledged' | 'resolved';
  timestamp: string;
  comments?: string[];
  reasons?: string[];
}

export default function Alerts() {
  const currentUser = authService.getCurrentUser();
  const [userRole] = useState<'admin' | 'user' | 'store_manager'>(
    currentUser?.role || 'user'
  );
  const [activeFilter, setActiveFilter] = useState('all');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [emailConfig, setEmailConfig] = useState<AlertConfig>(
    emailService.getConfig()
  );
  const [showSettings, setShowSettings] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [emailLog, setEmailLog] = useState<any[]>([]);

  const { filteredData: data, refreshData } = useData();

  const handleLogout = () => {
    console.log('Logout clicked');
  };

  // Analyze data and generate alerts
  useEffect(() => {
    if (data && data.length > 0) {
      analyzeAndGenerateAlerts();
    }
  }, [data]);

  // Load email log
  useEffect(() => {
    setEmailLog(emailService.getEmailLog());
  }, []);

  const DRIVER_COLUMNS: { key: string; label: string }[] = [
    {
      key: 'Please rate us on the following - Staff Friendliness & Service',
      label: 'Staff Friendliness',
    },
    {
      key: 'Please rate us on the following - Billing Experience',
      label: 'Billing Experience',
    },
    {
      key: 'Please rate us on the following - Product Size availability',
      label: 'Product Size Availability',
    },
    {
      key: 'Please rate us on the following - Store Ambience',
      label: 'Store Ambience',
    },
    {
      key: 'Please rate us on the following - Trial Room Experience',
      label: 'Trial Room Experience',
    },
    {
      key: 'Please rate us on the following - Product Options/ Variety',
      label: 'Product Options/Variety',
    },
  ];

  const analyzeAndGenerateAlerts = () => {
    setIsAnalyzing(true);

    try {
      // Group data by store
      const storeGroups = new Map<string, any[]>();

      data.forEach(record => {
        const storeCode =
          record.storeCode || record['Store Code'] || record['Store No'];
        if (storeCode) {
          if (!storeGroups.has(storeCode)) {
            storeGroups.set(storeCode, []);
          }
          storeGroups.get(storeCode)?.push(record);
        }
      });

      const newAlerts: Alert[] = [];

      // Analyze each store
      storeGroups.forEach((records, storeCode) => {
        if (records.length < 5) return; // Need minimum responses

        const storeName =
          records[0].storeName ||
          records[0]['Store Name'] ||
          records[0].Description ||
          storeCode;
        const state = records[0].state || records[0].State || 'Unknown';
        const city = records[0].city || records[0].City || 'Unknown';

        // Calculate NPS
        const scores = records
          .map(r => {
            const score =
              r.npsScore ??
              r['NPS Score'] ??
              r.nps ??
              r[
                'On a scale of 0 to 10, with 0 being the lowest and 10 being the highest rating - how likely are you to recommend Trends to friends and family'
              ];
            return typeof score === 'number'
              ? score
              : parseFloat(String(score || '').trim());
          })
          .filter(s => !isNaN(s) && s >= 0 && s <= 10);

        if (scores.length === 0) return;

        const promoters = scores.filter(s => s >= 9).length;
        const detractors = scores.filter(s => s <= 6).length;
        const currentNPS = Math.round(
          ((promoters - detractors) / scores.length) * 100
        );

        // Driver analysis: average and low-score share per driver
        const driverReasons: string[] = [];
        DRIVER_COLUMNS.forEach(({ key, label }) => {
          const vals = records
            .map(r => r[key])
            .map(v =>
              typeof v === 'number' ? v : parseFloat(String(v || '').trim())
            )
            .filter((v: number) => !isNaN(v) && v >= 0 && v <= 10);
          if (vals.length === 0) return;
          const avg =
            vals.reduce((a: number, b: number) => a + b, 0) / vals.length;
          const lowShare =
            (vals.filter((v: number) => v <= 6).length / vals.length) * 100;
          if (avg < 7.5 || lowShare >= 30) {
            driverReasons.push(
              `${label} low (avg ${avg.toFixed(1)}, ${lowShare.toFixed(0)}% ≤6)`
            );
          }
        });

        // Get recent comments
        const comments = records
          .map(r => r.comments || r.Comments || r['Any other feedback?'])
          .filter(c => c && c.trim())
          .slice(0, 5);

        // Determine severity
        let severity: Alert['severity'] = 'low';
        let type: Alert['type'] = 'nps_drop';
        let message = '';

        if (currentNPS < emailConfig.criticalThreshold) {
          severity = 'critical';
          type = 'nps_drop';
          message = `Critical NPS score of ${currentNPS}. Immediate intervention required.`;
        } else if (currentNPS < emailConfig.highThreshold) {
          severity = 'high';
          type = 'nps_drop';
          message = `Low NPS score of ${currentNPS}. Store needs attention.`;
        } else if (detractors / scores.length > 0.4) {
          severity = 'high';
          type = 'detractor_spike';
          message = `High detractor rate: ${((detractors / scores.length) * 100).toFixed(1)}%`;
        } else if (currentNPS > 50) {
          severity = 'positive';
          type = 'improvement';
          message = `Strong NPS performance at ${currentNPS}`;
        }

        // Create alert if significant
        if (severity !== 'low') {
          newAlerts.push({
            id: `${storeCode}-${Date.now()}`,
            storeCode,
            storeName,
            state,
            city,
            severity,
            type,
            message,
            currentNPS,
            previousNPS: currentNPS - 5,
            change: -5,
            detractorCount: detractors,
            totalResponses: scores.length,
            status: severity === 'critical' ? 'active' : 'acknowledged',
            timestamp: new Date().toISOString(),
            comments,
            reasons: driverReasons,
          });
        }
      });

      // Sort by severity
      newAlerts.sort((a, b) => {
        const severityOrder = {
          critical: 0,
          high: 1,
          medium: 2,
          low: 3,
          positive: 4,
        };
        return severityOrder[a.severity] - severityOrder[b.severity];
      });

      setAlerts(newAlerts);

      // Send email alerts for critical issues
      if (emailConfig.enabled) {
        const criticalAlerts = newAlerts.filter(a => a.severity === 'critical');
        criticalAlerts.forEach(alert => {
          const storeAlert: StoreAlert = {
            storeCode: alert.storeCode,
            storeName: alert.storeName,
            state: alert.state,
            city: alert.city,
            currentNPS: alert.currentNPS,
            previousNPS: alert.previousNPS,
            trend:
              alert.change < 0
                ? 'declining'
                : alert.change > 0
                  ? 'improving'
                  : 'stable',
            severity: alert.severity,
            detractorCount: alert.detractorCount,
            totalResponses: alert.totalResponses,
            recentComments: alert.comments || [],
            timestamp: new Date(alert.timestamp),
          };
          emailService.sendStoreAlert(storeAlert);
        });
      }

      toast.success(
        `Generated ${newAlerts.length} alerts from ${storeGroups.size} stores`
      );
    } catch (error) {
      console.error('Error generating alerts:', error);
      toast.error('Failed to generate alerts');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return (
          <Badge variant="destructive" className="bg-destructive/20">
            Critical
          </Badge>
        );
      case 'high':
        return (
          <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20">
            High
          </Badge>
        );
      case 'medium':
        return <Badge variant="secondary">Medium</Badge>;
      case 'positive':
        return (
          <Badge className="bg-nps-promoter/10 text-nps-promoter border-nps-promoter/20">
            Positive
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case 'investigating':
        return <Clock className="w-4 h-4 text-orange-500" />;
      case 'acknowledged':
        return <CheckCircle className="w-4 h-4 text-nps-promoter" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-muted-foreground" />;
      default:
        return <XCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const handleSaveEmailConfig = () => {
    emailService.saveConfig(emailConfig);
    toast.success('Email configuration saved');
    setShowSettings(false);
  };

  const handleSendTestEmail = async () => {
    const sent = await emailService.sendEmail({
      to: emailConfig.recipients,
      subject: '🧪 Test Alert Email',
      body: 'This is a test email from the NPS Alert System.',
      priority: 'normal',
    });

    if (sent) {
      toast.success('Test email sent successfully');
      setEmailLog(emailService.getEmailLog());
    } else {
      toast.error('Failed to send test email');
    }
  };

  const handleManualAlert = async (alert: Alert) => {
    const storeAlert: StoreAlert = {
      storeCode: alert.storeCode,
      storeName: alert.storeName,
      state: alert.state,
      city: alert.city,
      currentNPS: alert.currentNPS,
      previousNPS: alert.previousNPS,
      trend: alert.change < 0 ? 'declining' : 'improving',
      severity: alert.severity,
      detractorCount: alert.detractorCount,
      totalResponses: alert.totalResponses,
      recentComments: alert.comments || [],
      timestamp: new Date(alert.timestamp),
    };

    const sent = await emailService.sendStoreAlert(storeAlert);
    if (sent) {
      toast.success(`Alert email sent for ${alert.storeName}`);
      setEmailLog(emailService.getEmailLog());
    } else {
      toast.error('Failed to send alert email');
    }
  };

  const filteredAlerts =
    activeFilter === 'all'
      ? alerts
      : alerts.filter(a => a.severity === activeFilter);

  return (
    <div className="min-h-screen bg-background">
      <HeaderBar userRole={userRole} onLogout={handleLogout} />

      <div className="flex">
        <SideNav userRole={userRole} />

        <main className="flex-1 p-6 pr-0 space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="text-left">
              <h1 className="text-3xl font-bold">
                Alerts & Email Notifications
              </h1>
              <p className="text-muted-foreground">
                Real-time NPS alerts with automated email notifications for
                critical issues
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  refreshData();
                  analyzeAndGenerateAlerts();
                }}
                disabled={isAnalyzing}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`}
                />
                Refresh
              </Button>
              <Button variant="outline" onClick={() => setShowSettings(true)}>
                <Settings className="w-4 h-4 mr-2" />
                Email Settings
              </Button>
            </div>
          </div>

          <Tabs defaultValue="alerts" className="w-full">
            <TabsList>
              <TabsTrigger value="alerts">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Active Alerts ({alerts.length})
              </TabsTrigger>
              <TabsTrigger value="email-log">
                <Mail className="w-4 h-4 mr-2" />
                Email Log ({emailLog.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="alerts" className="space-y-4">
              {/* Filter Tabs */}
              <div className="flex gap-2">
                {['all', 'critical', 'high', 'medium', 'positive'].map(
                  filter => (
                    <Button
                      key={filter}
                      variant={activeFilter === filter ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveFilter(filter)}
                      className="capitalize"
                    >
                      {filter}
                      {filter !== 'all' && (
                        <Badge variant="secondary" className="ml-2">
                          {alerts.filter(a => a.severity === filter).length}
                        </Badge>
                      )}
                    </Button>
                  )
                )}
              </div>

              {/* Alerts Grid */}
              <div className="grid gap-4">
                {filteredAlerts.length === 0 ? (
                  <Card className="p-8 text-center">
                    <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      No {activeFilter !== 'all' ? activeFilter : ''} alerts
                      found. Click Refresh to analyze current data.
                    </p>
                  </Card>
                ) : (
                  filteredAlerts.map(alert => (
                    <Card
                      key={alert.id}
                      className="hover:shadow-lg transition-shadow"
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2">
                              <Store className="w-5 h-5" />
                              {alert.storeName} ({alert.storeCode})
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              {alert.city}, {alert.state}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            {getSeverityBadge(alert.severity)}
                            {getStatusIcon(alert.status)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="font-medium">{alert.message}</p>

                        {alert.reasons && alert.reasons.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Likely Causes</p>
                            <ul className="list-disc pl-5 text-sm text-muted-foreground">
                              {alert.reasons.slice(0, 3).map((r, i) => (
                                <li key={i}>{r}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Current NPS
                            </p>
                            <p
                              className="text-2xl font-bold"
                              style={{
                                color:
                                  alert.currentNPS < 0
                                    ? '#dc2626'
                                    : alert.currentNPS < 30
                                      ? '#f59e0b'
                                      : '#059669',
                              }}
                            >
                              {alert.currentNPS}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Change
                            </p>
                            <p className="text-2xl font-bold flex items-center">
                              {alert.change > 0 ? (
                                <TrendingUp className="w-5 h-5 mr-1 text-green-500" />
                              ) : (
                                <TrendingDown className="w-5 h-5 mr-1 text-red-500" />
                              )}
                              {Math.abs(alert.change)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Detractor Rate
                            </p>
                            <p className="text-2xl font-bold">
                              {(
                                (alert.detractorCount / alert.totalResponses) *
                                100
                              ).toFixed(1)}
                              %
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Responses
                            </p>
                            <p className="text-2xl font-bold">
                              {alert.totalResponses}
                            </p>
                          </div>
                        </div>

                        {alert.comments && alert.comments.length > 0 && (
                          <div className="border-t pt-4">
                            <p className="text-sm font-medium mb-2 flex items-center">
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Recent Comments
                            </p>
                            <ul className="space-y-1">
                              {alert.comments.slice(0, 3).map((comment, i) => (
                                <li
                                  key={i}
                                  className="text-sm text-muted-foreground"
                                >
                                  • {comment}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-4 border-t">
                          <p className="text-xs text-muted-foreground">
                            {formatTime(alert.timestamp)}
                          </p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedAlert(alert)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Details
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleManualAlert(alert)}
                              disabled={alert.severity === 'positive'}
                            >
                              <Mail className="w-4 h-4 mr-1" />
                              Send Alert
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="email-log" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Email History</CardTitle>
                  <CardDescription>
                    Recent email notifications sent by the system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    {emailLog.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No emails sent yet
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {emailLog
                          .slice()
                          .reverse()
                          .map((email, i) => (
                            <div key={i} className="border rounded-lg p-4">
                              <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                  <p className="font-medium">{email.subject}</p>
                                  <p className="text-sm text-muted-foreground">
                                    To: {email.to?.join(', ')}
                                  </p>
                                  <Badge
                                    variant={
                                      email.priority === 'high'
                                        ? 'destructive'
                                        : 'secondary'
                                    }
                                  >
                                    {email.priority || 'normal'}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(email.sentAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </ScrollArea>
                  {emailLog.length > 0 && (
                    <Button
                      variant="outline"
                      className="w-full mt-4"
                      onClick={() => {
                        emailService.clearEmailLog();
                        setEmailLog([]);
                        toast.success('Email log cleared');
                      }}
                    >
                      Clear Log
                    </Button>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Email Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Email Alert Configuration</DialogTitle>
            <DialogDescription>
              Configure automated email notifications for critical NPS issues
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="enabled">Enable Email Alerts</Label>
              <Switch
                id="enabled"
                checked={emailConfig.enabled}
                onCheckedChange={checked =>
                  setEmailConfig({ ...emailConfig, enabled: checked })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Recipient Emails (comma-separated)</Label>
              <Input
                value={emailConfig.recipients.join(', ')}
                onChange={e =>
                  setEmailConfig({
                    ...emailConfig,
                    recipients: e.target.value.split(',').map(e => e.trim()),
                  })
                }
                placeholder="admin@trends.com, manager@trends.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Critical NPS Threshold</Label>
                <Input
                  type="number"
                  value={emailConfig.criticalThreshold}
                  onChange={e =>
                    setEmailConfig({
                      ...emailConfig,
                      criticalThreshold: parseInt(e.target.value),
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  NPS below this is critical
                </p>
              </div>

              <div className="space-y-2">
                <Label>High Priority Threshold</Label>
                <Input
                  type="number"
                  value={emailConfig.highThreshold}
                  onChange={e =>
                    setEmailConfig({
                      ...emailConfig,
                      highThreshold: parseInt(e.target.value),
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  NPS below this needs attention
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Check Interval (minutes)</Label>
              <Input
                type="number"
                value={emailConfig.checkInterval}
                onChange={e =>
                  setEmailConfig({
                    ...emailConfig,
                    checkInterval: parseInt(e.target.value),
                  })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleSendTestEmail}>
              <Send className="w-4 h-4 mr-2" />
              Send Test Email
            </Button>
            <Button onClick={handleSaveEmailConfig}>Save Configuration</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Details Dialog */}
      {selectedAlert && (
        <Dialog
          open={!!selectedAlert}
          onOpenChange={() => setSelectedAlert(null)}
        >
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>
                Alert Details: {selectedAlert.storeName}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Store Code</p>
                  <p className="font-medium">{selectedAlert.storeCode}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">
                    {selectedAlert.city}, {selectedAlert.state}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current NPS</p>
                  <p className="text-2xl font-bold">
                    {selectedAlert.currentNPS}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Severity</p>
                  {getSeverityBadge(selectedAlert.severity)}
                </div>
              </div>

              {selectedAlert.reasons && selectedAlert.reasons.length > 0 && (
                <div>
                  <p className="font-medium mb-2">Likely Causes</p>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground">
                    {selectedAlert.reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedAlert.comments && selectedAlert.comments.length > 0 && (
                <div>
                  <p className="font-medium mb-2">All Customer Comments:</p>
                  <ScrollArea className="h-[200px] border rounded p-4">
                    <ul className="space-y-2">
                      {selectedAlert.comments.map((comment, i) => (
                        <li key={i} className="text-sm">
                          {i + 1}. {comment}
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() =>
                  (window.location.href = `/stores?storeCode=${selectedAlert.storeCode}`)
                }
              >
                View Store Dashboard
              </Button>
              <Button onClick={() => handleManualAlert(selectedAlert)}>
                Send Alert Email
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
