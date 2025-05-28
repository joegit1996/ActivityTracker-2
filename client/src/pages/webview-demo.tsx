import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Smartphone, MessageCircle } from 'lucide-react';

export default function WebViewDemo() {
  const [messages, setMessages] = useState<Array<{id: number, type: string, data: any, timestamp: string}>>([]);
  const [notificationStatus, setNotificationStatus] = useState<'denied' | 'granted' | 'default'>('default');

  useEffect(() => {
    // Listen for messages from the embedded webview
    const handleMessage = (event: MessageEvent) => {
      const message = {
        id: Date.now(),
        type: event.data.type,
        data: event.data,
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [message, ...prev.slice(0, 9)]); // Keep last 10 messages
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const simulateNotificationResponse = (enabled: boolean) => {
    const iframe = document.querySelector('iframe') as HTMLIFrameElement;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({
        type: 'NOTIFICATION_PERMISSION_RESPONSE',
        enabled: enabled,
        permission: enabled ? 'granted' : 'denied'
      }, '*');
      setNotificationStatus(enabled ? 'granted' : 'denied');
    }
  };

  const handlePermissionRequest = () => {
    // Simulate asking user for permission
    const userGranted = window.confirm('Allow streak app to send you notifications?');
    simulateNotificationResponse(userGranted);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <Smartphone className="w-8 h-8 text-blue-600" />
            WebView Integration Demo
          </h1>
          <p className="text-gray-600">
            This demonstrates how your streak app communicates with the parent mobile app
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          
          {/* Left Side - Parent App Simulator */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                Mobile App (Parent)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Notification Status */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  <span className="font-medium">Notification Status:</span>
                </div>
                <Badge variant={notificationStatus === 'granted' ? 'default' : 'secondary'}>
                  {notificationStatus}
                </Badge>
              </div>

              {/* Controls */}
              <div className="space-y-2">
                <Button 
                  onClick={handlePermissionRequest}
                  className="w-full"
                  variant="outline"
                >
                  Simulate Permission Dialog
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    onClick={() => simulateNotificationResponse(true)}
                    size="sm"
                    variant="default"
                  >
                    Grant Permission
                  </Button>
                  <Button 
                    onClick={() => simulateNotificationResponse(false)}
                    size="sm"
                    variant="destructive"
                  >
                    Deny Permission
                  </Button>
                </div>
              </div>

              {/* Message Log */}
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Messages from WebView:
                </h4>
                <div className="max-h-64 overflow-y-auto space-y-2 bg-gray-50 p-3 rounded-lg">
                  {messages.length === 0 ? (
                    <p className="text-gray-500 text-sm">No messages yet...</p>
                  ) : (
                    messages.map(msg => (
                      <div key={msg.id} className="text-xs bg-white p-2 rounded border">
                        <div className="flex justify-between items-start mb-1">
                          <Badge variant="outline" className="text-xs">
                            {msg.type}
                          </Badge>
                          <span className="text-gray-500">{msg.timestamp}</span>
                        </div>
                        <pre className="text-gray-700 whitespace-pre-wrap">
                          {JSON.stringify(msg.data, null, 2)}
                        </pre>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right Side - Embedded WebView */}
          <Card>
            <CardHeader>
              <CardTitle>Embedded Streak App (WebView)</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <iframe
                src="/en/progress/1"
                className="w-full h-[600px] border-0 rounded-lg"
                title="Streak App WebView"
              />
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-medium text-blue-600">1. Detection</h4>
                <p className="text-gray-600">
                  The streak app automatically detects when it's running inside a webview by checking the user agent.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-green-600">2. Communication</h4>
                <p className="text-gray-600">
                  When the user toggles notifications, the webview sends a message to the parent app using postMessage API.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-purple-600">3. Response</h4>
                <p className="text-gray-600">
                  The parent app handles the notification request and sends back the permission status to update the UI.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}