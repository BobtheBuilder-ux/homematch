import * as z from "zod";
import { PropertyTypeEnum } from "@/lib/constants";

export const propertySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  pricePerYear: z.coerce.number().positive().min(0).int(),
  isPetsAllowed: z.boolean(),
  isParkingIncluded: z.boolean(),
  photoUrls: z
    .array(z.instanceof(File))
    .min(1, "At least one photo is required"),
  amenities: z.string().min(1, "Amenities are required"),
  highlights: z.string().min(1, "Highlights are required"),
  beds: z.coerce.number().positive().min(0).max(10).int(),
  baths: z.coerce.number().positive().min(0).max(10).int(),
  squareFeet: z.coerce.number().int().positive(),
  propertyType: z.nativeEnum(PropertyTypeEnum),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  country: z.string().min(1, "Country is required"),
  postalCode: z.string().min(1, "Postal code is required"),
});

export type PropertyFormData = z.infer<typeof propertySchema>;

export const applicationSchema = z.object({
  // Personal Information
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  preferredMoveInDate: z.date().optional(),
  desiredLeaseDuration: z.string().optional(),
  gender: z.string().optional(),
  dateOfBirth: z.date().optional(),
  nationality: z.string().optional(),
  maritalStatus: z.string().optional(),
  idType: z.string().optional(),
  idDocumentUrl: z.instanceof(File).optional(),
  durationAtCurrentAddress: z.string().optional(),
  
  // Employment Details
  employmentStatus: z.string().optional(),
  occupation: z.string().optional(),
  employerName: z.string().optional(),
  workAddress: z.string().optional(),
  monthlyIncome: z.coerce.number().positive().optional(),
  durationAtCurrentJob: z.string().optional(),
  incomeProofUrl: z.instanceof(File).optional(),
  
  // Additional Information
  reasonForLeaving: z.string().optional(),
  
  // Consent & Declaration
  consentToInformation: z.boolean().refine(val => val === true, {
    message: "You must confirm that the information provided is true and complete",
  }),
  consentToVerification: z.boolean().refine(val => val === true, {
    message: "You must authorize verification of this information",
  }),
  consentToTenancyTerms: z.boolean().refine(val => val === true, {
    message: "You must understand and agree to the tenancy terms",
  }),
  consentToPrivacyPolicy: z.boolean().refine(val => val === true, {
    message: "You must agree to the privacy policy",
  }),
});

export type ApplicationFormData = z.infer<typeof applicationSchema>;

export const settingsSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
});

export type SettingsFormData = z.infer<typeof settingsSchema>;
