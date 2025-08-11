"use client";

import { CustomFormField } from "@/components/FormField";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LandlordOnboardingFormData, landlordOnboardingSchema } from "@/lib/schemas";
import { useGetAuthUserQuery, useCompleteLandlordOnboardingMutation } from "@/state/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, MapPin, CreditCard, Building, UserCheck, Edit, Save, X } from "lucide-react";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const LandlordSettings = () => {
  const { data: authUser, isLoading } = useGetAuthUserQuery();
  const [updateLandlord] = useCompleteLandlordOnboardingMutation();
  const [editMode, setEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LandlordOnboardingFormData>({
    resolver: zodResolver(landlordOnboardingSchema),
    defaultValues: {
      name: authUser?.userInfo.name || '',
      email: authUser?.userInfo.email || '',
      phoneNumber: authUser?.userInfo.phoneNumber || '',
      dateOfBirth: authUser?.userInfo.dateOfBirth ? new Date(authUser.userInfo.dateOfBirth) : undefined,
      nationality: authUser?.userInfo.nationality || '',
      occupation: authUser?.userInfo.occupation || '',
      currentAddress: authUser?.userInfo.currentAddress || '',
      city: authUser?.userInfo.city || '',
      state: authUser?.userInfo.state || '',
      country: authUser?.userInfo.country || 'Nigeria',
      postalCode: authUser?.userInfo.postalCode || '',
      bankName: authUser?.userInfo.bankName || '',
      accountNumber: authUser?.userInfo.accountNumber || '',
      accountName: authUser?.userInfo.accountName || '',
      businessName: authUser?.userInfo.businessName || '',
      businessType: authUser?.userInfo.businessType || '',
      taxId: authUser?.userInfo.taxId || '',
      emergencyContactName: authUser?.userInfo.emergencyContactName || '',
      emergencyContactPhone: authUser?.userInfo.emergencyContactPhone || '',
      agreeToTerms: true,
      agreeToPrivacyPolicy: true,
    },
  });

  if (isLoading) return <div className="flex justify-center items-center min-h-screen">Loading...</div>;

  const toggleEditMode = () => {
    setEditMode(!editMode);
    if (editMode) {
      form.reset();
    }
  };

  const onSubmit = async (data: LandlordOnboardingFormData) => {
    if (!authUser?.cognitoInfo?.userId) {
      toast.error("Authentication required");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateLandlord({
        cognitoId: authUser.cognitoInfo.userId,
        ...data,
      }).unwrap();
      
      toast.success("Settings updated successfully!");
      setEditMode(false);
    } catch (error) {
      console.error("Settings update error:", error);
      toast.error("Failed to update settings. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Landlord Settings
              </h1>
              <p className="text-gray-600">
                Manage your account information and preferences
              </p>
            </div>
            <Button
              type="button"
              onClick={toggleEditMode}
              className={editMode ? "bg-gray-500 hover:bg-gray-600" : "bg-primary-600 hover:bg-primary-700"}
            >
              {editMode ? (
                <>
                  <X className="mr-2 w-4 h-4" />
                  Cancel
                </>
              ) : (
                <>
                  <Edit className="mr-2 w-4 h-4" />
                  Edit Profile
                </>
              )}
            </Button>
          </div>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-xl text-gray-800">Profile Information</CardTitle>
            <CardDescription className="text-gray-600">
              {editMode ? "Update your profile information below" : "View your current profile information"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                
                {/* Personal Information Section */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-2 text-gray-700 mb-4">
                    <User className="h-5 w-5" />
                    <span className="font-medium text-lg">Personal Information</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <CustomFormField 
                      name="name" 
                      label="Full Name" 
                      placeholder="Enter your full name"
                      disabled={!editMode}
                    />
                    
                    <CustomFormField 
                      name="email" 
                      label="Email Address" 
                      type="email"
                      placeholder="your.email@example.com"
                      disabled={true}
                    />
                    
                    <CustomFormField 
                      name="phoneNumber" 
                      label="Phone Number" 
                      placeholder="+234 xxx xxx xxxx"
                      disabled={!editMode}
                    />
                    
                    <CustomFormField 
                      name="dateOfBirth" 
                      label="Date of Birth" 
                      type="date"
                      disabled={!editMode}
                    />
                    
                    <CustomFormField 
                      name="nationality" 
                      label="Nationality" 
                      placeholder="e.g., Nigerian"
                      disabled={!editMode}
                    />
                    
                    <CustomFormField 
                      name="occupation" 
                      label="Occupation" 
                      placeholder="Your profession"
                      disabled={!editMode}
                    />
                  </div>
                </div>

                <Separator />

                {/* Address Information Section */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-2 text-gray-700 mb-4">
                    <MapPin className="h-5 w-5" />
                    <span className="font-medium text-lg">Current Address</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <CustomFormField 
                        name="currentAddress" 
                        label="Street Address" 
                        placeholder="123 Main Street, Area"
                        disabled={!editMode}
                      />
                    </div>
                    
                    <CustomFormField 
                      name="city" 
                      label="City" 
                      placeholder="Lagos"
                      disabled={!editMode}
                    />
                    
                    <CustomFormField 
                      name="state" 
                      label="State" 
                      placeholder="Lagos State"
                      disabled={!editMode}
                    />
                    
                    <CustomFormField 
                      name="country" 
                      label="Country" 
                      placeholder="Nigeria"
                      disabled={!editMode}
                    />
                    
                    <CustomFormField 
                      name="postalCode" 
                      label="Postal Code" 
                      placeholder="100001"
                      disabled={!editMode}
                    />
                  </div>
                </div>

                <Separator />

                {/* Bank Details Section */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-2 text-gray-700 mb-4">
                    <CreditCard className="h-5 w-5" />
                    <span className="font-medium text-lg">Bank Details</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Bank details are required for rent collection and property management payments.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <CustomFormField 
                      name="bankName" 
                      label="Bank Name" 
                      placeholder="e.g., First Bank of Nigeria"
                      disabled={!editMode}
                    />
                    

                    
                    <CustomFormField 
                      name="accountNumber" 
                      label="Account Number" 
                      placeholder="1234567890"
                      disabled={!editMode}
                    />
                    
                    <CustomFormField 
                      name="accountName" 
                      label="Account Name" 
                      placeholder="Account holder name"
                      disabled={!editMode}
                    />
                  </div>
                </div>

                <Separator />

                {/* Business Information Section */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-2 text-gray-700 mb-4">
                    <Building className="h-5 w-5" />
                    <span className="font-medium text-lg">Business Information (Optional)</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <CustomFormField 
                      name="businessName" 
                      label="Business Name" 
                      placeholder="Your business name (if applicable)"
                      disabled={!editMode}
                    />
                    
                    <CustomFormField 
                      name="businessType" 
                      label="Business Type" 
                      type="select"
                      options={[
                        { value: "Individual", label: "Individual" },
                        { value: "Sole Proprietorship", label: "Sole Proprietorship" },
                        { value: "Partnership", label: "Partnership" },
                        { value: "Limited Liability Company", label: "Limited Liability Company" },
                        { value: "Corporation", label: "Corporation" },
                      ]}
                      disabled={!editMode}
                    />
                    
                    <CustomFormField 
                      name="taxId" 
                      label="Tax ID / TIN" 
                      placeholder="Tax identification number"
                      disabled={!editMode}
                    />
                  </div>
                </div>

                <Separator />

                {/* Emergency Contact Section */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-2 text-gray-700 mb-4">
                    <UserCheck className="h-5 w-5" />
                    <span className="font-medium text-lg">Emergency Contact</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <CustomFormField 
                      name="emergencyContactName" 
                      label="Emergency Contact Name" 
                      placeholder="Full name of emergency contact"
                      disabled={!editMode}
                    />
                    
                    <CustomFormField 
                      name="emergencyContactPhone" 
                      label="Emergency Contact Phone" 
                      placeholder="+234 xxx xxx xxxx"
                      disabled={!editMode}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                {editMode && (
                  <div className="pt-6">
                    <Button 
                      type="submit" 
                      className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 text-lg font-medium"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Saving Changes...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 w-5 h-5" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Your information is secure and encrypted. Changes are saved automatically.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandlordSettings;
