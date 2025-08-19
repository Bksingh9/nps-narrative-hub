interface EmailConfig {
  to: string[];
  subject: string;
  body: string;
  html?: string;
  priority?: 'high' | 'normal' | 'low';
}

interface AlertConfig {
  enabled: boolean;
  recipients: string[];
  criticalThreshold: number; // NPS below this is critical
  highThreshold: number; // NPS below this is high priority
  checkInterval: number; // Minutes between checks
}

interface StoreAlert {
  storeCode: string;
  storeName: string;
  state: string;
  city: string;
  currentNPS: number;
  previousNPS: number;
  trend: 'improving' | 'declining' | 'stable';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'positive';
  detractorCount: number;
  totalResponses: number;
  recentComments: string[];
  timestamp: Date;
}

class EmailService {
  private alertConfig: AlertConfig;
  private lastAlertSent: Map<string, Date> = new Map();
  private alertCooldown = 3600000; // 1 hour cooldown per store

  constructor() {
    // Load config from localStorage or use defaults
    const savedConfig = localStorage.getItem('email_alert_config');
    this.alertConfig = savedConfig ? JSON.parse(savedConfig) : {
      enabled: true,
      recipients: ['admin@trends.com', 'manager@trends.com'],
      criticalThreshold: 0, // NPS < 0 is critical
      highThreshold: 30, // NPS < 30 is high priority
      checkInterval: 30 // Check every 30 minutes
    };
  }

  // Save configuration
  saveConfig(config: Partial<AlertConfig>) {
    this.alertConfig = { ...this.alertConfig, ...config };
    localStorage.setItem('email_alert_config', JSON.stringify(this.alertConfig));
  }

  // Get current configuration
  getConfig(): AlertConfig {
    return this.alertConfig;
  }

  // Send email (simulated for demo - in production, use backend API)
  async sendEmail(config: EmailConfig): Promise<boolean> {
    try {
      // In production, this would call your backend API
      // For demo, we'll simulate sending and log to console
      console.log('📧 Sending Email:', {
        to: config.to,
        subject: config.subject,
        priority: config.priority || 'normal'
      });

      // Store in localStorage for tracking
      const emailLog = JSON.parse(localStorage.getItem('email_log') || '[]');
      emailLog.push({
        ...config,
        sentAt: new Date().toISOString(),
        status: 'sent'
      });
      
      // Keep only last 100 emails
      if (emailLog.length > 100) {
        emailLog.splice(0, emailLog.length - 100);
      }
      
      localStorage.setItem('email_log', JSON.stringify(emailLog));

      // Show notification
      const notification = new Notification('NPS Alert Email Sent', {
        body: config.subject,
        icon: '/alert-icon.png'
      });

      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  // Check if alert should be sent (cooldown logic)
  shouldSendAlert(storeCode: string): boolean {
    const lastSent = this.lastAlertSent.get(storeCode);
    if (!lastSent) return true;
    
    const timeSinceLastAlert = Date.now() - lastSent.getTime();
    return timeSinceLastAlert > this.alertCooldown;
  }

  // Send critical NPS alert for a store
  async sendStoreAlert(alert: StoreAlert): Promise<boolean> {
    if (!this.alertConfig.enabled) return false;
    if (!this.shouldSendAlert(alert.storeCode)) return false;

    const subject = `🚨 ${alert.severity.toUpperCase()} NPS Alert: ${alert.storeName} (${alert.storeCode})`;
    
    const body = `
Critical NPS Alert for Store ${alert.storeCode}

Store Details:
- Name: ${alert.storeName}
- Location: ${alert.city}, ${alert.state}
- Current NPS: ${alert.currentNPS} (Previous: ${alert.previousNPS})
- Trend: ${alert.trend}
- Severity: ${alert.severity}

Response Metrics:
- Detractors: ${alert.detractorCount} out of ${alert.totalResponses} responses
- Detractor Rate: ${((alert.detractorCount / alert.totalResponses) * 100).toFixed(1)}%

Recent Customer Comments:
${alert.recentComments.slice(0, 5).map((c, i) => `${i + 1}. ${c}`).join('\n')}

Immediate Action Required:
1. Contact store manager immediately
2. Review recent customer feedback
3. Implement corrective measures
4. Schedule follow-up in 24 hours

View Dashboard: http://localhost:8081/stores?storeCode=${alert.storeCode}
    `;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; }
    .alert-header { 
      background: ${alert.severity === 'critical' ? '#dc2626' : '#f59e0b'}; 
      color: white; 
      padding: 20px; 
      border-radius: 8px 8px 0 0;
    }
    .content { padding: 20px; background: #f9fafb; }
    .metrics { 
      display: grid; 
      grid-template-columns: repeat(2, 1fr); 
      gap: 15px; 
      margin: 20px 0;
    }
    .metric-card { 
      background: white; 
      padding: 15px; 
      border-radius: 8px;
      border-left: 4px solid ${alert.severity === 'critical' ? '#dc2626' : '#f59e0b'};
    }
    .comments { 
      background: #fff; 
      padding: 15px; 
      border-radius: 8px; 
      margin: 20px 0;
    }
    .action-items { 
      background: #fef2f2; 
      padding: 15px; 
      border-radius: 8px;
      border-left: 4px solid #dc2626;
    }
    .cta-button {
      display: inline-block;
      padding: 12px 24px;
      background: #3b82f6;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="alert-header">
    <h1>🚨 ${alert.severity.toUpperCase()} NPS Alert</h1>
    <h2>${alert.storeName} (${alert.storeCode})</h2>
  </div>
  
  <div class="content">
    <div class="metrics">
      <div class="metric-card">
        <h3>Current NPS</h3>
        <p style="font-size: 24px; font-weight: bold; color: ${alert.currentNPS < 0 ? '#dc2626' : '#059669'};">
          ${alert.currentNPS}
        </p>
        <p>Previous: ${alert.previousNPS}</p>
      </div>
      <div class="metric-card">
        <h3>Trend</h3>
        <p style="font-size: 24px; font-weight: bold;">
          ${alert.trend === 'declining' ? '📉' : alert.trend === 'improving' ? '📈' : '➡️'} ${alert.trend}
        </p>
      </div>
      <div class="metric-card">
        <h3>Detractor Rate</h3>
        <p style="font-size: 24px; font-weight: bold;">
          ${((alert.detractorCount / alert.totalResponses) * 100).toFixed(1)}%
        </p>
        <p>${alert.detractorCount} of ${alert.totalResponses} responses</p>
      </div>
      <div class="metric-card">
        <h3>Location</h3>
        <p>${alert.city}, ${alert.state}</p>
      </div>
    </div>
    
    <div class="comments">
      <h3>Recent Customer Comments</h3>
      <ul>
        ${alert.recentComments.slice(0, 5).map(c => `<li>${c}</li>`).join('')}
      </ul>
    </div>
    
    <div class="action-items">
      <h3>⚠️ Immediate Actions Required</h3>
      <ol>
        <li>Contact store manager immediately</li>
        <li>Review all recent customer feedback</li>
        <li>Implement corrective measures</li>
        <li>Schedule follow-up review in 24 hours</li>
        <li>Report status to regional manager</li>
      </ol>
    </div>
    
    <a href="http://localhost:8081/stores?storeCode=${alert.storeCode}" class="cta-button">
      View Store Dashboard →
    </a>
  </div>
</body>
</html>
    `;

    const sent = await this.sendEmail({
      to: this.alertConfig.recipients,
      subject,
      body,
      html,
      priority: alert.severity === 'critical' ? 'high' : 'normal'
    });

    if (sent) {
      this.lastAlertSent.set(alert.storeCode, new Date());
    }

    return sent;
  }

  // Send batch alerts summary
  async sendBatchAlerts(alerts: StoreAlert[]): Promise<void> {
    const criticalAlerts = alerts.filter(a => a.severity === 'critical');
    const highAlerts = alerts.filter(a => a.severity === 'high');

    if (criticalAlerts.length === 0 && highAlerts.length === 0) return;

    const subject = `📊 NPS Alert Summary: ${criticalAlerts.length} Critical, ${highAlerts.length} High Priority`;
    
    const body = `
NPS Alert Summary Report
Generated: ${new Date().toLocaleString()}

CRITICAL ALERTS (${criticalAlerts.length}):
${criticalAlerts.map(a => `- ${a.storeName} (${a.storeCode}): NPS ${a.currentNPS}`).join('\n')}

HIGH PRIORITY ALERTS (${highAlerts.length}):
${highAlerts.map(a => `- ${a.storeName} (${a.storeCode}): NPS ${a.currentNPS}`).join('\n')}

Total Stores Monitored: ${alerts.length}
Requiring Immediate Action: ${criticalAlerts.length + highAlerts.length}

View Full Dashboard: http://localhost:8081/alerts
    `;

    await this.sendEmail({
      to: this.alertConfig.recipients,
      subject,
      body,
      priority: criticalAlerts.length > 0 ? 'high' : 'normal'
    });
  }

  // Get email log
  getEmailLog(): any[] {
    return JSON.parse(localStorage.getItem('email_log') || '[]');
  }

  // Clear email log
  clearEmailLog(): void {
    localStorage.removeItem('email_log');
    this.lastAlertSent.clear();
  }
}

export default new EmailService();
export type { EmailConfig, AlertConfig, StoreAlert }; 