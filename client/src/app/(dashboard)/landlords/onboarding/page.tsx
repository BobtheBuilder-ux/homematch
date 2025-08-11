"use client";

import { CustomFormField } from "@/components/FormField";
import Loading from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { LandlordOnboardingFormData, landlordOnboardingSchema } from "@/lib/schemas";
import { useGetAuthUserQuery, useCompleteLandlordOnboardingMutation } from "@/state/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle, User, MapPin, Phone, CreditCard, Building, Shield, UserCheck, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const LandlordOnboarding = () => {
  const { data: authUser, isLoading } = useGetAuthUserQuery();
  const [completeLandlordOnboarding] = useCompleteLandlordOnboardingMutation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<LandlordOnboardingFormData>({
    resolver: zodResolver(landlordOnboardingSchema),
    defaultValues: {
      name: authUser?.userInfo.name || '',
      email: authUser?.userInfo.email || '',
      phoneNumber: authUser?.userInfo.phoneNumber || '',
      dateOfBirth: undefined,
      nationality: '',
      occupation: '',
      currentAddress: '',
      city: '',
      state: '',
      country: 'Nigeria',
      postalCode: '',
      bankName: '',
      accountNumber: '',
      accountName: '',
      businessName: '',
      businessType: '',
      taxId: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      agreeToTerms: false,
      agreeToPrivacyPolicy: false,
    },
  });

  if (isLoading) return <Loading />;

  const onSubmit = async (data: LandlordOnboardingFormData) => {
    if (!authUser?.cognitoInfo?.userId) {
      toast.error("Authentication required");
      return;
    }

    setIsSubmitting(true);
    try {
      await completeLandlordOnboarding({
        cognitoId: authUser.cognitoInfo.userId,
        ...data,
        isOnboardingComplete: true,
        onboardedAt: new Date().toISOString(),
      }).unwrap();
      
      toast.success("Onboarding completed successfully!");
      router.push("/landlords/dashboard");
    } catch (error) {
      console.error("Onboarding error:", error);
      toast.error("Failed to complete onboarding. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 p-4 bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center">
            <Building className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-primary-800 mb-2">
            Complete Your Landlord Profile
          </h1>
          <p className="text-lg text-primary-600 mb-6">
            Help us verify your identity and set up your account for property management
          </p>
          
          {/* Progress Steps */}
          <div className="flex justify-center items-center space-x-4 mb-8">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <span className="ml-2 text-sm text-primary-700">Personal Info</span>
            </div>
            <div className="w-8 h-1 bg-primary-200"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <span className="ml-2 text-sm text-primary-700">Address & Bank</span>
            </div>
            <div className="w-8 h-1 bg-primary-200"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <span className="ml-2 text-sm text-primary-700">Verification</span>
            </div>
          </div>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl text-primary-800">Landlord Information</CardTitle>
            <CardDescription className="text-primary-600">
              Please provide accurate information for account verification and property management
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
                    />
                    
                    <CustomFormField 
                      name="email" 
                      label="Email Address" 
                      type="email"
                      placeholder="your.email@example.com"
                      disabled
                    />
                    
                    <CustomFormField 
                      name="phoneNumber" 
                      label="Phone Number" 
                      placeholder="+234 xxx xxx xxxx"
                    />
                    
                    <CustomFormField 
                      name="dateOfBirth" 
                      label="Date of Birth" 
                      type="date"
                    />
                    
                    <CustomFormField 
                      name="nationality" 
                      label="Nationality" 
                      placeholder="e.g., Nigerian"
                    />
                    
                    <CustomFormField 
                      name="occupation" 
                      label="Occupation" 
                      placeholder="Your profession"
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
                      />
                    </div>
                    
                    <CustomFormField 
                      name="city" 
                      label="City" 
                      placeholder="Lagos"
                    />
                    
                    <CustomFormField 
                      name="state" 
                      label="State" 
                      placeholder="Lagos State"
                    />
                    
                    <CustomFormField 
                      name="country" 
                      label="Country" 
                      placeholder="Nigeria"
                    />
                    
                    <CustomFormField 
                      name="postalCode" 
                      label="Postal Code" 
                      placeholder="100001"
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
                    />
                    

                    
                    <CustomFormField 
                      name="accountNumber" 
                      label="Account Number" 
                      placeholder="1234567890"
                    />
                    
                    <CustomFormField 
                      name="accountName" 
                      label="Account Name" 
                      placeholder="Account holder name"
                    />
                  </div>
                </div>

                <Separator />

                {/* Business Information Section (Optional) */}
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
                    />
                    
                    <CustomFormField 
                      name="taxId" 
                      label="Tax ID / TIN" 
                      placeholder="Tax identification number"
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
                    />
                    
                    <CustomFormField 
                      name="emergencyContactPhone" 
                      label="Emergency Contact Phone" 
                      placeholder="+234 xxx xxx xxxx"
                    />
                  </div>
                </div>

                <Separator />

                {/* Terms and Conditions */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-2 text-gray-700 mb-4">
                    <Shield className="h-5 w-5" />
                    <span className="font-medium text-lg">Terms & Conditions</span>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <Checkbox 
                        id="agreeToTerms"
                        checked={form.watch("agreeToTerms")}
                        onCheckedChange={(checked) => form.setValue("agreeToTerms", !!checked)}
                      />
                      <label htmlFor="agreeToTerms" className="text-sm text-gray-700 leading-relaxed">
                        I agree to the <a href="/terms" className="text-primary-600 hover:underline">Terms and Conditions</a> and confirm that all information provided is accurate and complete.
                      </label>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Checkbox 
                        id="agreeToPrivacyPolicy"
                        checked={form.watch("agreeToPrivacyPolicy")}
                        onCheckedChange={(checked) => form.setValue("agreeToPrivacyPolicy", !!checked)}
                      />
                      <label htmlFor="agreeToPrivacyPolicy" className="text-sm text-gray-700 leading-relaxed">
                        I agree to the <a href="/privacy" className="text-primary-600 hover:underline">Privacy Policy</a> and consent to the processing of my personal data for account verification and property management services.
                      </label>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-6">
                  <Button 
                    type="submit" 
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white py-4 text-lg font-medium"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Completing Profile...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 w-5 h-5" />
                        Complete Profile & Start Managing Properties
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Your information is secure and encrypted. You can update these details anytime in your settings.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandlordOnboarding;