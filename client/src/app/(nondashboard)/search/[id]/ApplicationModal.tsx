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
import { useCreateApplicationMutation, useGetAuthUserQuery } from "@/state/api";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import { Separator } from "@/components/ui/separator";

const ApplicationModal = ({
  isOpen,
  onClose,
  propertyId,
}: ApplicationModalProps) => {
  const [createApplication] = useCreateApplicationMutation();
  const { data: authUser } = useGetAuthUserQuery();

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
      console.error(
        "You must be logged in as a tenant to submit an application"
      );
      return;
    }
    
    // Convert date strings to Date objects for API
    const formattedData = {
      ...data,
      preferredMoveInDate: data.preferredMoveInDate ? new Date(data.preferredMoveInDate).toISOString() : undefined,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString() : undefined,
      // Handle file uploads - in a real implementation, these would be uploaded to a storage service
      // and the URLs would be stored in the database
      idDocumentUrl: data.idDocumentUrl ? "uploaded-id-document-url" : undefined,
      incomeProofUrl: data.incomeProofUrl ? "uploaded-income-proof-url" : undefined,
    };

    await createApplication({
      ...formattedData,
      applicationDate: new Date().toISOString(),
      status: "Pending",
      propertyId: propertyId,
      tenantCognitoId: authUser.cognitoInfo.userId,
    });
    onClose();
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
            
            <Button type="submit" className="bg-primary-700 text-white w-full">
              Submit Application
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ApplicationModal;
