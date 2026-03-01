/**
 * Settings Tab - Channel connection and auto-publish settings
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { PLATFORM_CONFIG, type Channel } from './types';

interface SettingsTabProps {
  channels: Channel[];
  onConnectPlatform: (platform: string) => void;
}

export function SettingsTab({ channels, onConnectPlatform }: SettingsTabProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Cài đặt kênh</h2>
      
      <Card>
        <CardHeader>
          <CardTitle>Kết nối nền tảng</CardTitle>
          <CardDescription>Kết nối tài khoản social media để đăng tự động</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(PLATFORM_CONFIG).map(([key, config]) => {
            const channel = channels.find(c => c.platform === key);
            
            return (
              <div key={key} className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${config.bgColor} text-2xl`}>
                    {config.emoji}
                  </div>
                  <div>
                    <p className="font-medium">{config.name}</p>
                    {channel?.isConnected ? (
                      <p className="text-sm text-green-500">{channel.handle}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Chưa kết nối</p>
                    )}
                  </div>
                </div>
                <Button 
                  variant={channel?.isConnected ? 'outline' : 'default'}
                  onClick={() => onConnectPlatform(key)}
                >
                  {channel?.isConnected ? 'Quản lý' : 'Kết nối'}
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cài đặt Auto-Publish</CardTitle>
          <CardDescription>Cấu hình tự động đăng nội dung</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Bật Auto-Publish</p>
              <p className="text-sm text-muted-foreground">Tự động đăng theo lịch</p>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Thông báo trước khi đăng</p>
              <p className="text-sm text-muted-foreground">Nhận thông báo 1 giờ trước</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">AI tối ưu nội dung</p>
              <p className="text-sm text-muted-foreground">AI tự động điều chỉnh cho từng platform</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
