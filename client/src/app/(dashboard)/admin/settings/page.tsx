"use client";

import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useGetAdminSettingsQuery, useUpdateAdminSettingsMutation } from "@/state/api";
import { useState } from "react";

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
            <div className="flex items-center space-x-2">
              <Switch
                id="maintenanceMode"
                checked={formData.maintenanceMode}
                onCheckedChange={(checked) => setFormData({ ...formData, maintenanceMode: checked })}
              />
              <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
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