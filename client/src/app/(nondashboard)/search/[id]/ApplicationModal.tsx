"use client";

import { CustomFormField } from "@/components/FormField";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { ApplicationFormData, applicationSchema } from "@/lib/schemas";
import { useCreateApplicationWithFilesMutation, useGetAuthUserQuery } from "@/state/api";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const ApplicationModal = ({
  isOpen,
  onClose,
  propertyId,
  onApplicationSubmitted,
}: ApplicationModalProps) => {
  const [createApplicationWithFiles] = useCreateApplicationWithFilesMutation();
  const { data: authUser } = useGetAuthUserQuery();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      // Personal Information
      name: "",
      email: "",
      phoneNumber: "",
      preferredMoveInDate: undefined,
      desiredLeaseDuration: "",
      gender: "",
      dateOfBirth: undefined,
      nationality: "",
      maritalStatus: "",
      idType: "",
      idDocumentUrl: undefined,
      durationAtCurrentAddress: "",
      
      // Employment Details
      employmentStatus: "",
      occupation: "",
      employerName: "",
      workAddress: "",
      monthlyIncome: undefined,
      durationAtCurrentJob: "",
      incomeProofUrl: undefined,
      reasonForLeaving: "",
      
      // Consent & Declaration
      consentToInformation: false,
      consentToVerification: false,
      consentToTenancyTerms: false,
      consentToPrivacyPolicy: false,
    },
  });

  const onSubmit = async (data: ApplicationFormData) => {
    if (!authUser || authUser.userRole !== "tenant") {
      toast.error("You must be logged in as a tenant to submit an application");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      
      // Add application data
      formData.append('applicationDate', new Date().toISOString());
      formData.append('status', 'Pending');
      formData.append('propertyId', propertyId.toString());
      formData.append('tenantCognitoId', authUser.cognitoInfo.userId);
      formData.append('name', data.name);
      formData.append('email', data.email);
      formData.append('phoneNumber', data.phoneNumber);
      
      if (data.preferredMoveInDate) {
        formData.append('preferredMoveInDate', new Date(data.preferredMoveInDate).toISOString());
      }
      if (data.desiredLeaseDuration) {
        formData.append('desiredLeaseDuration', data.desiredLeaseDuration);
      }
      if (data.gender) formData.append('gender', data.gender);
      if (data.dateOfBirth) {
        formData.append('dateOfBirth', new Date(data.dateOfBirth).toISOString());
      }
      if (data.nationality) formData.append('nationality', data.nationality);
      if (data.maritalStatus) formData.append('maritalStatus', data.maritalStatus);
      if (data.idType) formData.append('idType', data.idType);
      if (data.durationAtCurrentAddress) formData.append('durationAtCurrentAddress', data.durationAtCurrentAddress);
      
      // Employment details
      if (data.employmentStatus) formData.append('employmentStatus', data.employmentStatus);
      if (data.occupation) formData.append('occupation', data.occupation);
      if (data.employerName) formData.append('employerName', data.employerName);
      if (data.workAddress) formData.append('workAddress', data.workAddress);
      if (data.monthlyIncome) formData.append('monthlyIncome', data.monthlyIncome.toString());
      if (data.durationAtCurrentJob) formData.append('durationAtCurrentJob', data.durationAtCurrentJob);
      if (data.reasonForLeaving) formData.append('reasonForLeaving', data.reasonForLeaving);
      
      // Consent fields
      formData.append('consentToInformation', data.consentToInformation.toString());
      formData.append('consentToVerification', data.consentToVerification.toString());
      formData.append('consentToTenancyTerms', data.consentToTenancyTerms.toString());
      formData.append('consentToPrivacyPolicy', data.consentToPrivacyPolicy.toString());
      
      // Add files if they exist
      if (data.idDocumentUrl && data.idDocumentUrl instanceof File) {
        formData.append('idDocument', data.idDocumentUrl);
      }
      if (data.incomeProofUrl && data.incomeProofUrl instanceof File) {
        formData.append('incomeProof', data.incomeProofUrl);
      }

      await createApplicationWithFiles(formData).unwrap();
      
      onClose();
      if (onApplicationSubmitted) {
        onApplicationSubmitted();
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mb-4">
          <DialogTitle>Submit Application for this Property</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Lease Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Lease Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CustomFormField
                  name="preferredMoveInDate"
                  label="Preferred Move-in Date"
                  type="date"
                  placeholder="Select move-in date"
                />
                <CustomFormField
                  name="desiredLeaseDuration"
                  label="Desired Lease Duration"
                  type="select"
                  options={[
                    { value: "6 months", label: "6 months" },
                    { value: "1 year", label: "1 year" },
                    { value: "2 years", label: "2 years" },
                    { value: "Other", label: "Other" },
                  ]}
                />
              </div>
            </div>
            
            <Separator />
            
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CustomFormField
                  name="name"
                  label="Full Name"
                  type="text"
                  placeholder="Enter your full name"
                />
                <CustomFormField
                  name="phoneNumber"
                  label="Phone Number"
                  type="text"
                  placeholder="Enter your phone number"
                />
                <CustomFormField
                  name="email"
                  label="Email Address"
                  type="email"
                  placeholder="Enter your email address"
                />
                <CustomFormField
                  name="gender"
                  label="Gender"
                  type="select"
                  options={[
                    { value: "Male", label: "Male" },
                    { value: "Female", label: "Female" },
                    { value: "Prefer not to say", label: "Prefer not to say" },
                  ]}
                />
                <CustomFormField
                  name="dateOfBirth"
                  label="Date of Birth"
                  type="date"
                  placeholder="Select date of birth"
                />
                <CustomFormField
                  name="nationality"
                  label="Nationality"
                  type="text"
                  placeholder="Enter your nationality"
                />
                <CustomFormField
                  name="maritalStatus"
                  label="Marital Status"
                  type="select"
                  options={[
                    { value: "Single", label: "Single" },
                    { value: "Married", label: "Married" },
                    { value: "Divorced", label: "Divorced" },
                    { value: "Widowed", label: "Widowed" },
                  ]}
                />
                <CustomFormField
                  name="idType"
                  label="ID Type"
                  type="select"
                  options={[
                    { value: "National ID", label: "National ID" },
                    { value: "Voter's Card", label: "Voter's Card" },
                    { value: "Driver's License", label: "Driver's License" },
                    { value: "International Passport", label: "International Passport" },
                  ]}
                />
                <CustomFormField
                  name="idDocumentUrl"
                  label="Upload Valid ID"
                  type="file"
                  accept="image/*"
                />
                <CustomFormField
                  name="durationAtCurrentAddress"
                  label="Duration at Current Address"
                  type="select"
                  options={[
                    { value: "<6 months", label: "<6 months" },
                    { value: "6–12 months", label: "6–12 months" },
                    { value: "1–2 years", label: "1–2 years" },
                    { value: "Over 2 years", label: "Over 2 years" },
                  ]}
                />
              </div>
            </div>
            
            <Separator />
            
            {/* Current Employment */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Current Employment</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CustomFormField
                  name="employmentStatus"
                  label="Employment Status"
                  type="select"
                  options={[
                    { value: "Employed", label: "Employed" },
                    { value: "Self-employed", label: "Self-employed" },
                    { value: "Unemployed", label: "Unemployed" },
                    { value: "Student", label: "Student" },
                    { value: "Retired", label: "Retired" },
                  ]}
                />
                <CustomFormField
                  name="occupation"
                  label="Occupation / Job Title"
                  type="text"
                  placeholder="Enter your job title"
                />
                <CustomFormField
                  name="employerName"
                  label="Employer / Company Name"
                  type="text"
                  placeholder="Enter your employer name"
                />
                <CustomFormField
                  name="workAddress"
                  label="Work Address"
                  type="text"
                  placeholder="Enter your work address"
                />
                <CustomFormField
                  name="monthlyIncome"
                  label="Monthly Income (₦)"
                  type="number"
                  placeholder="Enter your monthly income"
                />
                <CustomFormField
                  name="durationAtCurrentJob"
                  label="Duration at Current Job"
                  type="select"
                  options={[
                    { value: "<6 months", label: "<6 months" },
                    { value: "6–12 months", label: "6–12 months" },
                    { value: "1–2 years", label: "1–2 years" },
                    { value: "Over 2 years", label: "Over 2 years" },
                  ]}
                />
                <div className="md:col-span-2">
                  <CustomFormField
                    name="incomeProofUrl"
                    label="Upload Proof of Income (payslip, bank statement)"
                    type="file"
                    accept="application/pdf,image/*"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Additional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <CustomFormField
                    name="reasonForLeaving"
                    label="Reason for Leaving Current Residence"
                    type="textarea"
                    placeholder="Enter reason for leaving"
                  />
                </div>
              </div>
            </div>
            
            <Separator />
            
            {/* Consent & Declaration */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Consent & Declaration</h3>
              <div className="space-y-2">
                <CustomFormField
                  name="consentToInformation"
                  label="I confirm that the information provided is true and complete."
                  type="switch"
                />
                <CustomFormField
                  name="consentToVerification"
                  label="I authorize HomeMatch and the landlord to verify this information."
                  type="switch"
                />
                <CustomFormField
                  name="consentToTenancyTerms"
                  label="I understand this application does not guarantee tenancy until approved and signed."
                  type="switch"
                />
                <CustomFormField
                  name="consentToPrivacyPolicy"
                  label="I agree to HomeMatch's terms and privacy policy."
                  type="switch"
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="bg-primary-700 text-white w-full" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting Application...
                </>
              ) : (
                "Submit Application"
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ApplicationModal;
