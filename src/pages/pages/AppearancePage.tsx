// @ts-nocheck
// =====================================
// FLUX - Appearance & Theme Control (eo-n components)
// Last Updated: 00:46:31 Dec 08, 2025
// =====================================

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { Button, Card, Badge, Modal } from '@/components/ui';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from '@/components/ui/sheet';
import { useFluxStore } from '@/lib/store';
import {
  Mail,
  Plus,
  Trash2,
  Settings,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
} from 'lucide-react';

// Alias for Gmail icon (lucide-react doesn't have Gmail specifically)
const MailIcon = Mail;
import { cn } from '@/lib/utils';
import type { EmailAccount, EmailProvider, EmailAccountCreateInput } from '@/types';
import { integrationService } from '@/lib/integrations/service';
import { useNavigate, useSearchParams } from 'react-router-dom';

function EmailAccountSettings() {
  const {
    emailAccounts,
    fetchEmailAccounts,
    createEmailAccount,
    deleteEmailAccount,
    testEmailAccountConnection,
    syncEmailAccount,
    user,
  } = useFluxStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<EmailProvider>('gmail');
  const [isOAuthConnecting, setIsOAuthConnecting] = useState(false);
  const [formData, setFormData] = useState<Partial<EmailAccountCreateInput>>({
    emailAddress: '',
    displayName: '',
    smtpHost: '',
    smtpPort: 587,
    smtpUsername: '',
    smtpPassword: '',
    smtpUseTls: true,
    imapHost: '',
    imapPort: 993,
    imapUsername: '',
    imapPassword: '',
    imapUseTls: true,
    syncEnabled: true,
    syncFrequencyMinutes: 15,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testingAccountId, setTestingAccountId] = useState<string | null>(null);

  useEffect(() => {
    fetchEmailAccounts();
    
    // Check for OAuth callback from Google
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    
    if (code && state) {
      // This is an OAuth callback - handle it
      handleOAuthCallback(code, state);
    } else if (error) {
      setError(`OAuth error: ${error}. Please try again.`);
      // Clean up URL
      setSearchParams({});
    }
  }, []); // Only run on mount to handle OAuth callback

  // Separate effect to handle OAuth callback when params change
  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    
    if (code && state && !isOAuthConnecting) {
      handleOAuthCallback(code, state);
    }
  }, [searchParams]);

  const handleOAuthCallback = async (code: string, state: string) => {
    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    setIsOAuthConnecting(true);
    setError(null);

    try {
      // Handle OAuth callback through integration service
      const result = await integrationService.handleOAuthCallback('gmail', code, state);
      
      if (!result.success || !result.config) {
        throw new Error(result.error || 'OAuth callback failed');
      }

      // Get email from metadata
      const emailAddress = result.config.metadata?.accountEmail;
      if (!emailAddress) {
        throw new Error('Could not retrieve email address from OAuth response');
      }

      // Create email account with OAuth tokens
      const emailAccountInput: EmailAccountCreateInput = {
        provider: 'gmail',
        emailAddress,
        displayName: emailAddress.split('@')[0],
        // Use Gmail's default IMAP/SMTP settings
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        smtpUseTls: true,
        imapHost: 'imap.gmail.com',
        imapPort: 993,
        imapUseTls: true,
        // OAuth tokens from integration service
        oauthAccessToken: result.config.credentials.accessToken,
        oauthRefreshToken: result.config.credentials.refreshToken,
        syncEnabled: true,
        syncFrequencyMinutes: 15,
      };

      await createEmailAccount(emailAccountInput);
      
      // Clean up URL params
      setSearchParams({});
      setIsAddModalOpen(false);
      
      alert('Gmail account connected successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to connect Gmail account');
    } finally {
      setIsOAuthConnecting(false);
    }
  };

  const handleGmailOAuth = () => {
    if (!user?.id) {
      setError('User not authenticated. Please log in to connect your Gmail account.');
      return;
    }

    const authUrl = integrationService.getAuthorizationUrl('gmail', user.id);
    if (!authUrl) {
      setError(
        'Gmail OAuth is not configured. Please ensure the following environment variables are set:\n' +
        '- VITE_GOOGLE_CLIENT_ID\n' +
        '- VITE_GOOGLE_CLIENT_SECRET\n\n' +
        'You can create OAuth credentials at: https://console.cloud.google.com/apis/credentials'
      );
      return;
    }

    setIsOAuthConnecting(true);
    // Redirect to OAuth URL
    window.location.href = authUrl;
  };

  const providers: { id: EmailProvider; name: string; icon: typeof Mail; description: string }[] = [
    { id: 'gmail', name: 'Gmail', icon: Mail, description: 'Connect using OAuth or App Password' },
    { id: 'outlook', name: 'Outlook', icon: MailIcon, description: 'Connect using OAuth or App Password' },
    { id: 'custom_imap', name: 'IMAP', icon: MailIcon, description: 'Custom IMAP server' },
    { id: 'custom_pop3', name: 'POP3', icon: MailIcon, description: 'Custom POP3 server' },
    { id: 'custom_smtp', name: 'SMTP', icon: MailIcon, description: 'SMTP only (sending)' },
  ];

  const handleProviderSelect = (provider: EmailProvider) => {
    setSelectedProvider(provider);
    setError(null);
    
    // Set default values for common providers
    if (provider === 'gmail') {
      setFormData(prev => ({
        ...prev,
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        imapHost: 'imap.gmail.com',
        imapPort: 993,
      }));
    } else if (provider === 'outlook') {
      setFormData(prev => ({
        ...prev,
        smtpHost: 'smtp-mail.outlook.com',
        smtpPort: 587,
        imapHost: 'outlook.office365.com',
        imapPort: 993,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const input: EmailAccountCreateInput = {
        provider: selectedProvider,
        emailAddress: formData.emailAddress!,
        displayName: formData.displayName,
        smtpHost: formData.smtpHost,
        smtpPort: formData.smtpPort,
        smtpUsername: formData.smtpUsername,
        smtpPassword: formData.smtpPassword,
        smtpUseTls: formData.smtpUseTls,
        imapHost: formData.imapHost,
        imapPort: formData.imapPort,
        imapUsername: formData.imapUsername,
        imapPassword: formData.imapPassword,
        imapUseTls: formData.imapUseTls,
        syncEnabled: formData.syncEnabled,
        syncFrequencyMinutes: formData.syncFrequencyMinutes,
      };

      await createEmailAccount(input);
      setIsAddModalOpen(false);
      setFormData({
        emailAddress: '',
        displayName: '',
        smtpHost: '',
        smtpPort: 587,
        smtpUsername: '',
        smtpPassword: '',
        smtpUseTls: true,
        imapHost: '',
        imapPort: 993,
        imapUsername: '',
        imapPassword: '',
        imapUseTls: true,
        syncEnabled: true,
        syncFrequencyMinutes: 15,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to connect email account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async (accountId: string) => {
    setTestingAccountId(accountId);
    try {
      const result = await testEmailAccountConnection(accountId);
      if (result.success) {
        alert('Connection test successful!');
      } else {
        alert(`Connection test failed: ${result.error}`);
      }
    } catch (err: any) {
      alert(`Connection test failed: ${err.message}`);
    } finally {
      setTestingAccountId(null);
    }
  };

  const handleDelete = async (accountId: string) => {
    if (confirm('Are you sure you want to delete this email account? This will not delete emails from your actual email provider.')) {
      await deleteEmailAccount(accountId);
    }
  };

  const handleSync = async (accountId: string) => {
    setIsLoading(true);
    try {
      await syncEmailAccount(accountId);
      alert('Email sync started. Emails will appear in your inbox shortly.');
    } catch (err: any) {
      alert(`Sync failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Mail className="text-violet-500" />
            Email Accounts
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Connect your email accounts to sync emails into your inbox
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsAddModalOpen(true)}
          leftIcon={<Plus size={16} />}
        >
          Add Account
        </Button>
      </div>

      {emailAccounts.length === 0 ? (
        <Card padding="lg" className="text-center py-12">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail size={32} className="text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No email accounts connected</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Connect an email account to start syncing emails into your inbox
          </p>
          <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
            Connect Email Account
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {emailAccounts.map((account) => (
            <Card key={account.id} padding="md" className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                  <MailIcon className="text-violet-600 dark:text-violet-400" size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{account.emailAddress}</h3>
                    <Badge variant={account.connectionStatus === 'connected' ? 'default' : 'secondary'}>
                      {account.connectionStatus}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground capitalize">{account.provider}</p>
                  {account.lastSyncedAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Last synced: {new Date(account.lastSyncedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSync(account.id)}
                  disabled={isLoading}
                >
                  <RefreshCw size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleTestConnection(account.id)}
                  disabled={testingAccountId === account.id}
                >
                  {testingAccountId === account.id ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={16} />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(account.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Account Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setError(null);
        }}
        title="Connect Email Account"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Provider Selection */}
          <div>
            <label className="text-sm font-semibold mb-2 block">Email Provider</label>
            <div className="grid grid-cols-2 gap-3">
              {providers.map((provider) => {
                const Icon = provider.icon;
                return (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => handleProviderSelect(provider.id)}
                    className={cn(
                      "p-4 rounded-lg border-2 text-left transition-all",
                      selectedProvider === provider.id
                        ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20"
                        : "border-border hover:border-violet-300"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon size={20} />
                      <span className="font-semibold">{provider.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{provider.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold mb-1 block">Email Address *</label>
              <input
                type="email"
                required
                value={formData.emailAddress || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, emailAddress: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="your.email@example.com"
              />
            </div>

            <div>
              <label className="text-sm font-semibold mb-1 block">Display Name</label>
              <input
                type="text"
                value={formData.displayName || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="Your Name"
              />
            </div>
          </div>

          {/* SMTP Settings */}
          {(selectedProvider === 'custom_smtp' || selectedProvider === 'custom_imap' || selectedProvider === 'custom_pop3') && (
            <div className="space-y-4 border-t border-border pt-4">
              <h3 className="font-semibold">SMTP Settings (for sending emails)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold mb-1 block">SMTP Host</label>
                  <input
                    type="text"
                    value={formData.smtpHost || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, smtpHost: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="smtp.example.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-1 block">SMTP Port</label>
                  <input
                    type="number"
                    value={formData.smtpPort || 587}
                    onChange={(e) => setFormData(prev => ({ ...prev, smtpPort: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-1 block">SMTP Username</label>
                  <input
                    type="text"
                    value={formData.smtpUsername || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, smtpUsername: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-1 block">SMTP Password</label>
                  <input
                    type="password"
                    value={formData.smtpPassword || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, smtpPassword: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* IMAP/POP3 Settings */}
          {(selectedProvider === 'custom_imap' || selectedProvider === 'custom_pop3') && (
            <div className="space-y-4 border-t border-border pt-4">
              <h3 className="font-semibold">IMAP/POP3 Settings (for receiving emails)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold mb-1 block">IMAP Host</label>
                  <input
                    type="text"
                    value={formData.imapHost || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, imapHost: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="imap.example.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-1 block">IMAP Port</label>
                  <input
                    type="number"
                    value={formData.imapPort || 993}
                    onChange={(e) => setFormData(prev => ({ ...prev, imapPort: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-1 block">IMAP Username</label>
                  <input
                    type="text"
                    value={formData.imapUsername || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, imapUsername: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-1 block">IMAP Password</label>
                  <input
                    type="password"
                    value={formData.imapPassword || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, imapPassword: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* OAuth Option for Gmail */}
          {selectedProvider === 'gmail' && (
            <div className="space-y-4 border-t border-border pt-4">
              <div>
                <h3 className="font-semibold mb-2">Connect with OAuth (Recommended)</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  OAuth is the most secure way to connect your Gmail account. It uses Google's official authentication
                  and doesn't require an App Password. Click the button below to authorize FLUX to access your Gmail via IMAP/SMTP.
                </p>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 mb-4">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    <strong>What you'll authorize:</strong> FLUX will request access to your Gmail account using the 
                    <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">https://mail.google.com/</code> scope, 
                    which allows secure IMAP, POP, and SMTP access via XOAUTH2. This is the recommended method by Google.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleGmailOAuth}
                  disabled={isOAuthConnecting || isLoading}
                  className="w-full"
                >
                  {isOAuthConnecting ? 'Redirecting to Google...' : 'Connect with Google OAuth'}
                </Button>
                {isOAuthConnecting && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    You will be redirected to Google to authorize FLUX. After authorization, you'll be brought back here automatically.
                  </p>
                )}
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-700 dark:text-amber-300 mb-2">
                  <strong>Alternative: Use App Password</strong>
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  If you prefer not to use OAuth, you can use an App Password instead. Fill in your Gmail address below,
                  and use an App Password (not your regular password) for authentication. To create an App Password:
                </p>
                <ol className="text-xs text-amber-600 dark:text-amber-400 mt-2 ml-4 list-decimal space-y-1">
                  <li>Go to your Google Account settings</li>
                  <li>Navigate to Security → 2-Step Verification</li>
                  <li>Scroll down to App Passwords</li>
                  <li>Create a new app password for "Mail"</li>
                  <li>Use that password in the form below</li>
                </ol>
              </div>
            </div>
          )}

          {/* OAuth Note for Outlook */}
          {selectedProvider === 'outlook' && (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-700 dark:text-amber-300">
                <strong>Note:</strong> For Outlook, you can use OAuth (recommended) or an App Password.
                OAuth integration for Outlook will be available in a future update. For now, use your email address and an App Password.
              </p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 flex items-center gap-2">
              <AlertCircle size={16} className="text-red-600 dark:text-red-400" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsAddModalOpen(false);
                setError(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isLoading}>
              {isLoading ? 'Connecting...' : 'Connect Account'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function AppearancePage() {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'appearance' | 'email'>('appearance');

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 pt-16 space-y-8">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">
          Settings
        </p>
        <h1 className="text-3xl font-bold text-foreground">Appearance & Email</h1>
        <p className="text-muted-foreground max-w-2xl">
          Customize your theme and manage email account connections.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-border">
        <button
          onClick={() => setActiveTab('appearance')}
          className={cn(
            "px-4 py-3 text-sm font-medium transition-all relative",
            activeTab === 'appearance'
              ? "text-violet-600 dark:text-violet-400"
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          )}
        >
          Appearance
          {activeTab === 'appearance' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('email')}
          className={cn(
            "px-4 py-3 text-sm font-medium transition-all relative",
            activeTab === 'email'
              ? "text-violet-600 dark:text-violet-400"
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          )}
        >
          Email Accounts
          {activeTab === 'email' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600 rounded-full" />
          )}
        </button>
      </div>

      {/* Content */}
      {activeTab === 'appearance' ? (
        <>
          <Card padding="lg" className="space-y-6 shadow-floating">
            <div className="flex flex-wrap gap-3 items-center">
              <Button
                variant={theme === 'light' ? 'primary' : 'secondary'}
                onClick={() => setTheme('light')}
              >
                Light
              </Button>
              <Button
                variant={theme === 'dark' ? 'primary' : 'secondary'}
                onClick={() => setTheme('dark')}
              >
                Dark
              </Button>
              <Button
                variant={theme === 'system' ? 'primary' : 'secondary'}
                onClick={() => setTheme('system')}
              >
                System
              </Button>
              <Button variant="outline" onClick={toggleTheme}>
                Cycle (current: {theme})
              </Button>
              <span className="text-sm text-muted-foreground">
                Resolved: <span className="font-medium text-foreground">{resolvedTheme}</span>
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card padding="md" className="space-y-3 bg-card shadow-elevated">
                <h3 className="text-lg font-semibold">Surface preview</h3>
                <p className="text-sm text-muted-foreground">
                  Verify cards, text, and shadows align with the active palette.
                </p>
                <div className="flex gap-2">
                  <Button variant="primary">Primary</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="outline">Outline</Button>
                </div>
              </Card>

              <Card padding="md" className="space-y-3 shadow-elevated">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">eo-n Sheet preview</h3>
                    <p className="text-sm text-muted-foreground">
                      Opens a sheet with the current theme.
                    </p>
                  </div>
                  <Sheet>
                    <SheetTrigger>
                      <Button size="sm" variant="secondary">
                        Open
                      </Button>
                    </SheetTrigger>
                    <SheetContent
                      side="left"
                      className="data-[side=left]:max-w-[240px] data-[side=left]:w-[70vw]"
                    >
                      <SheetHeader>
                        <SheetTitle>Navigation Preview</SheetTitle>
                        <SheetDescription>Respects light/dark modes.</SheetDescription>
                      </SheetHeader>
                      <div className="flex flex-col gap-2 px-2 py-2">
                        {['Dashboard', 'Board', 'Service Desk', 'Automation'].map((label) => (
                          <Button key={label} variant="ghost" className="justify-start text-sm">
                            {label}
                          </Button>
                        ))}
                      </div>
                      <SheetClose>
                        <Button variant="outline" className="mt-4 w-full">
                          Close
                        </Button>
                      </SheetClose>
                    </SheetContent>
                  </Sheet>
                </div>
              </Card>
            </div>
          </Card>
        </>
      ) : (
        <EmailAccountSettings />
      )}

      <div className="text-xs text-slate-400 dark:text-slate-500 pt-4 border-t border-border">
        Settings page. Last updated 00:46:31 Dec 08, 2025.
      </div>
    </div>
  );
}

