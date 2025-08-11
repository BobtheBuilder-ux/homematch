"use client";

import { CustomFormField } from "@/components/FormField";
import Loading from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AgentOnboardingFormData, agentOnboardingSchema } from "@/lib/schemas";
import { useGetAuthUserQuery, useUpdateAgentSettingsMutation } from "@/state/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle, User, MapPin, Phone } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useForm } from "react-hook-form";

const AgentOnboarding = () => {
  const { data: authUser, isLoading } = useGetAuthUserQuery();
  const [updateAgent] = useUpdateAgentSettingsMutation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<AgentOnboardingFormData>({
    resolver: zodResolver(agentOnboardingSchema),
    defaultValues: {
      name: authUser?.userInfo.name || '',
      email: authUser?.userInfo.email || '',
      phoneNumber: authUser?.userInfo.phoneNumber || '',
      address: authUser?.userInfo.address || '',
    },
  });

  if (isLoading) return <Loading />;

  const handleSubmit = async (data: AgentOnboardingFormData) => {
    if (!authUser?.cognitoInfo?.userId) {
      console.error("Cognito User ID is undefined. Cannot update agent settings.");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateAgent({
        cognitoId: authUser.cognitoInfo.userId,
        ...data,
      });
      
      // Redirect to agent leads page after successful onboarding
      router.push('/agent/leads');
    } catch (error) {
      console.error('Error updating agent profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to the Agent Portal!
          </h1>
          <p className="text-lg text-gray-600">
            Complete your profile to get started with managing properties and clients.
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="bg-primary-50 rounded-t-lg">
            <CardTitle className="text-xl font-semibold text-primary-800">
              Complete Your Agent Profile
            </CardTitle>
            <CardDescription className="text-primary-600">
              Please provide your complete information to help clients and landlords connect with you.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-gray-700 mb-4">
                    <User className="h-5 w-5" />
                    <span className="font-medium">Personal Information</span>
                  </div>
                  
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
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-gray-700 mb-4">
                    <Phone className="h-5 w-5" />
                    <span className="font-medium">Contact Information</span>
                  </div>
                  
                  <CustomFormField 
                    name="phoneNumber" 
                    label="Phone Number" 
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-gray-700 mb-4">
                    <MapPin className="h-5 w-5" />
                    <span className="font-medium">Location Information</span>
                  </div>
                  
                  <CustomFormField 
                    name="address" 
                    label="Business Address" 
                    placeholder="123 Main Street, City, State, ZIP"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-800 mb-2">
                    Why do we need this information?
                  </h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Your full name will be displayed to clients and landlords</li>
                    <li>• Phone number enables direct communication with prospects</li>
                    <li>• Address helps clients find your office location</li>
                    <li>• Complete profiles build trust and credibility</li>
                  </ul>
                </div>

                <div className="pt-6">
                  <Button 
                    type="submit" 
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 text-lg font-medium"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Completing Profile...' : 'Complete Profile & Continue'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            You can update this information anytime in your settings.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AgentOnboarding;