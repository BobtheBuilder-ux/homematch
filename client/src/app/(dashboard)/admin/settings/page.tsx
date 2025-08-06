"use client";

import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { useGetAdminSettingsQuery, useUpdateAdminSettingsMutation } from "@/state/api";
import { useState, useEffect } from "react";

const AdminSettings = () => {
  const { data: settings, isLoading } = useGetAdminSettingsQuery();
  const [updateSettings] = useUpdateAdminSettingsMutation();
  const [formData, setFormData] = useState({
    siteName: "",
    siteDescription: "",
    maintenanceMode: false,
    allowRegistration: true,
    maxPropertiesPerLandlord: 50,
    commissionRate: 5,
    emailNotifications: true,
    smsNotifications: false,
  });

  // Update form data when settings are loaded
  useEffect(() => {
    if (settings) {
      setFormData({
        siteName: settings.siteName || "",
        siteDescription: settings.siteDescription || "",
        maintenanceMode: settings.maintenanceMode || false,
        allowRegistration: settings.allowRegistration ?? true,
        maxPropertiesPerLandlord: settings.maxPropertiesPerLandlord || 50,
        commissionRate: settings.commissionRate || 5,
        emailNotifications: settings.emailNotifications ?? true,
        smsNotifications: settings.smsNotifications || false,
      });
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings(formData);
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="dashboard-container">
      <Header
        title="Admin Settings"
        subtitle="Configure platform settings and preferences"
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="siteName">Site Name</Label>
              <Input
                id="siteName"
                value={formData.siteName}
                onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                placeholder="Enter site name"
              />
            </div>
            <div>
              <Label htmlFor="siteDescription">Site Description</Label>
              <Textarea
                id="siteDescription"
                value={formData.siteDescription}
                onChange={(e) => setFormData({ ...formData, siteDescription: e.target.value })}
                placeholder="Enter site description"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="maintenanceMode"
                  checked={formData.maintenanceMode}
                  onCheckedChange={(checked) => setFormData({ ...formData, maintenanceMode: checked })}
                />
                <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
              </div>
              {formData.maintenanceMode && (
                <div className="flex items-center space-x-2 text-sm text-orange-600 bg-orange-50 p-2 rounded-md">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Site is currently in maintenance mode. Only admins can access the dashboard.</span>
                </div>
              )}
              {!formData.maintenanceMode && (
                <div className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 p-2 rounded-md">
                  <CheckCircle className="h-4 w-4" />
                  <span>Site is operational and accessible to all users.</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="allowRegistration"
                checked={formData.allowRegistration}
                onCheckedChange={(checked) => setFormData({ ...formData, allowRegistration: checked })}
              />
              <Label htmlFor="allowRegistration">Allow New Registrations</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Business Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="maxProperties">Max Properties per Landlord</Label>
              <Input
                id="maxProperties"
                type="number"
                value={formData.maxPropertiesPerLandlord}
                onChange={(e) => setFormData({ ...formData, maxPropertiesPerLandlord: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="commissionRate">Commission Rate (%)</Label>
              <Input
                id="commissionRate"
                type="number"
                value={formData.commissionRate}
                onChange={(e) => setFormData({ ...formData, commissionRate: parseFloat(e.target.value) })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="emailNotifications"
                checked={formData.emailNotifications}
                onCheckedChange={(checked) => setFormData({ ...formData, emailNotifications: checked })}
              />
              <Label htmlFor="emailNotifications">Email Notifications</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="smsNotifications"
                checked={formData.smsNotifications}
                onCheckedChange={(checked) => setFormData({ ...formData, smsNotifications: checked })}
              />
              <Label htmlFor="smsNotifications">SMS Notifications</Label>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="bg-primary-700 text-white">
          Save Settings
        </Button>
      </form>
    </div>
  );
};

export default AdminSettings;