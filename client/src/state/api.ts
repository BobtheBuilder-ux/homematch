import { cleanParams, createNewUserInDatabase, withToast } from "@/lib/utils";
import {
  Application,
  Lease,
  Landlord,
  Payment,
  Property,
  Tenant,
} from "@/types/prismaTypes";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { fetchAuthSession, getCurrentUser } from "aws-amplify/auth";
import { FiltersState } from ".";

export const api = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
    prepareHeaders: async (headers) => {
      const session = await fetchAuthSession();
      const { idToken } = session.tokens ?? {};
      if (idToken) {
        headers.set("Authorization", `Bearer ${idToken}`);
      }
      return headers;
    },
  }),
  reducerPath: "api",
  tagTypes: [
    "Landlords",
    "Tenants",
    "Properties",
    "PropertyDetails",
    "Leases",
    "Payments",
    "Applications",
    "AdminAnalytics",
    "AllUsers",
    "AllProperties",
    "AdminSettings",
    "AgentLeads",
    "AgentClients",
    "AgentTasks",
    "LandlordRegistrations",
    "AdminTasks",
    "AdminTaskStats",

  ],
  endpoints: (build) => ({
    getAuthUser: build.query<User, void>({
      queryFn: async (_, _queryApi, _extraoptions, fetchWithBQ) => {
        try {
          const session = await fetchAuthSession();
          const { idToken } = session.tokens ?? {};
          const user = await getCurrentUser();
          const userRole = idToken?.payload["custom:role"] as string;

          let endpoint: string;
          switch (userRole?.toLowerCase()) {
            case "landlord":
              endpoint = `/landlords/${user.userId}`;
              break;
            case "admin":
              endpoint = `/admin/admins/${user.userId}`;
              break;
            case "agent":
              endpoint = `/admin/agents/${user.userId}`;
              break;
            case "tenant":
            default:
              endpoint = `/tenants/${user.userId}`;
              break;
          }

          let userDetailsResponse = await fetchWithBQ(endpoint);

          // if user doesn't exist, create new user (but skip for admin and agent roles)
          if (
            userDetailsResponse.error &&
            userDetailsResponse.error.status === 404 &&
            userRole?.toLowerCase() !== "admin" &&
            userRole?.toLowerCase() !== "agent"
          ) {
            userDetailsResponse = await createNewUserInDatabase(
              user,
              idToken,
              userRole,
              fetchWithBQ
            );
          }

          return {
            data: {
              cognitoInfo: { ...user },
              userInfo: userDetailsResponse.data as Tenant | Landlord,
              userRole,
            },
          };
        } catch (error: any) {
          return { error: error.message || "Could not fetch user data" };
        }
      },
    }),

    // property related endpoints
    getProperties: build.query<Property[], Partial<FiltersState & { name?: string }>>({      
      query: (filters) => {
        const params = cleanParams({
          location: filters.location,
          priceMin: filters.priceRange?.[0],
          priceMax: filters.priceRange?.[1],
          beds: filters.beds,
          baths: filters.baths,
          propertyType: filters.propertyType,
          squareFeetMin: filters.squareFeet?.[0],
          squareFeetMax: filters.squareFeet?.[1],
          amenities: filters.amenities?.join(","),
          availableFrom: filters.availableFrom,
          favoriteIds: (filters as any).favoriteIds?.join(","),
          latitude: filters.coordinates?.[1],
          longitude: filters.coordinates?.[0],
          name: filters.name,
        });

        return { url: "properties", params };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Properties" as const, id })),
              { type: "Properties", id: "LIST" },
            ]
          : [{ type: "Properties", id: "LIST" }],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to fetch properties.",
        });
      },
    }),

    getProperty: build.query<Property, number>({
      query: (id) => `properties/${id}`,
      providesTags: (result, error, id) => [{ type: "PropertyDetails", id }],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to load property details.",
        });
      },
    }),

    // tenant related endpoints
    getTenant: build.query<Tenant, string>({
      query: (cognitoId) => `tenants/${cognitoId}`,
      providesTags: (result) => [{ type: "Tenants", id: result?.id }],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to load tenant profile.",
        });
      },
    }),

    getCurrentResidences: build.query<Property[], string>({
      query: (cognitoId) => `tenants/${cognitoId}/current-residences`,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Properties" as const, id })),
              { type: "Properties", id: "LIST" },
            ]
          : [{ type: "Properties", id: "LIST" }],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to fetch current residences.",
        });
      },
    }),

    updateTenantSettings: build.mutation<
      Tenant,
      { cognitoId: string } & Partial<Tenant>
    >({
      query: ({ cognitoId, ...updatedTenant }) => ({
        url: `tenants/${cognitoId}`,
        method: "PUT",
        body: updatedTenant,
      }),
      invalidatesTags: (result) => [{ type: "Tenants", id: result?.id }],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Settings updated successfully!",
          error: "Failed to update settings.",
        });
      },
    }),

    addFavoriteProperty: build.mutation<
      Tenant,
      { cognitoId: string; propertyId: number }
    >({
      query: ({ cognitoId, propertyId }) => ({
        url: `tenants/${cognitoId}/favorites/${propertyId}`,
        method: "POST",
      }),
      invalidatesTags: (result) => [
        { type: "Tenants", id: result?.id },
        { type: "Properties", id: "LIST" },
      ],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Added to favorites!!",
          error: "Failed to add to favorites",
        });
      },
    }),

    removeFavoriteProperty: build.mutation<
      Tenant,
      { cognitoId: string; propertyId: number }
    >({
      query: ({ cognitoId, propertyId }) => ({
        url: `tenants/${cognitoId}/favorites/${propertyId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result) => [
        { type: "Tenants", id: result?.id },
        { type: "Properties", id: "LIST" },
      ],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Removed from favorites!",
          error: "Failed to remove from favorites.",
        });
      },
    }),

    // landlord related endpoints
    getLandlordProperties: build.query<Property[], string>({
      query: (cognitoId) => `landlords/${cognitoId}/properties`,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Properties" as const, id })),
              { type: "Properties", id: "LIST" },
            ]
          : [{ type: "Properties", id: "LIST" }],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to load landlord profile.",
        });
      },
    }),

    updateLandlordSettings: build.mutation<
      Landlord,
      { cognitoId: string } & Partial<Landlord>
    >({
      query: ({ cognitoId, ...updatedLandlord }) => ({
        url: `landlords/${cognitoId}`,
        method: "PUT",
        body: updatedLandlord,
      }),
      invalidatesTags: (result) => [{ type: "Landlords", id: result?.id }],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Settings updated successfully!",
          error: "Failed to update settings.",
        });
      },
    }),

    createProperty: build.mutation<Property, FormData>({
      query: (newProperty) => ({
        url: `properties`,
        method: "POST",
        body: newProperty,
      }),
      invalidatesTags: (result) => [
        { type: "Properties", id: "LIST" },
        { type: "Landlords", id: result?.landlord?.id },
      ],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Property created successfully!",
          error: "Failed to create property.",
        });
      },
    }),

    // lease related enpoints
    getLeases: build.query<Lease[], number>({
      query: () => "leases",
      providesTags: ["Leases"],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to fetch leases.",
        });
      },
    }),

    getPropertyLeases: build.query<Lease[], number>({
      query: (propertyId) => `properties/${propertyId}/leases`,
      providesTags: ["Leases"],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to fetch property leases.",
        });
      },
    }),

    getPayments: build.query<Payment[], number>({
      query: (leaseId) => `leases/${leaseId}/payments`,
      providesTags: ["Payments"],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to fetch payment info.",
        });
      },
    }),

    initializePayment: build.mutation<
      { authorization_url: string; access_code: string; reference: string },
      { leaseId: number; amount: number; email: string; paymentType: string }
    >({
      query: (paymentData) => ({
        url: "payments/initialize",
        method: "POST",
        body: paymentData,
      }),
      invalidatesTags: ["Payments"],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Payment initialized successfully",
          error: "Failed to initialize payment",
        });
      },
    }),

    verifyPayment: build.query<
      { status: string; data: any },
      string
    >({
      query: (reference) => `payments/verify/${reference}`,
      providesTags: ["Payments"],
    }),

    getPaymentHistory: build.query<Payment[], number>({
      query: (leaseId) => `payments/history/${leaseId}`,
      providesTags: ["Payments"],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to fetch payment history",
        });
      },
    }),

    createPayment: build.mutation<
      Payment,
      { leaseId: number; amount: number; paymentType: string; reference?: string }
    >({
      query: (paymentData) => ({
        url: "payments/create",
        method: "POST",
        body: paymentData,
      }),
      invalidatesTags: ["Payments"],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Payment recorded successfully",
          error: "Failed to record payment",
        });
      },
    }),

    // application related endpoints
    getApplications: build.query<
      Application[],
      { userId?: string; userType?: string }
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.userId) {
          queryParams.append("userId", params.userId.toString());
        }
        if (params.userType) {
          queryParams.append("userType", params.userType);
        }
        return `applications?${queryParams.toString()}`;
      },
      providesTags: ["Applications"],
    }),

    getApplication: build.query<Application, number>({
      query: (id) => `applications/${id}`,
      providesTags: (_, __, id) => [{ type: "Applications", id }],
    }),

    updateApplicationStatus: build.mutation<
      Application & { lease?: Lease },
      { id: number; status: string; userType: string }
    >({
      query: ({ id, status, userType }) => ({
        url: `applications/${id}/status`,
        method: "PUT",
        body: { status, userType },
      }),
      invalidatesTags: ["Applications", "Leases"],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Application status updated successfully!",
          error: "Failed to update application settings.",
        });
      },
    }),

    createApplication: build.mutation<Application, Partial<Application>>({
      query: (body) => ({
        url: `applications`,
        method: "POST",
        body: body,
      }),
      invalidatesTags: ["Applications"],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Application created successfully!",
          error: "Failed to create applications.",
        });
      },
    }),

    // Admin endpoints
    getAdminAnalytics: build.query<any, void>({
      query: () => "admin/analytics",
      providesTags: ["AdminAnalytics"],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to fetch analytics data.",
        });
      },
    }),

    getAllUsers: build.query<any[], void>({
      query: () => "admin/users",
      providesTags: ["AllUsers"],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to fetch users.",
        });
      },
    }),

    getAllProperties: build.query<any[], void>({
      query: () => "admin/properties",
      providesTags: ["AllProperties"],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to fetch properties.",
        });
      },
    }),

    updateUserStatus: build.mutation<any, { userId: string; status: string }>({
      query: ({ userId, status }) => ({
        url: `admin/users/${userId}/status`,
        method: "PUT",
        body: { status },
      }),
      invalidatesTags: ["AllUsers"],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "User status updated successfully!",
          error: "Failed to update user status.",
        });
      },
    }),

    deleteUser: build.mutation<any, string>({
      query: (userId) => ({
        url: `admin/users/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AllUsers"],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "User deleted successfully!",
          error: "Failed to delete user.",
        });
      },
    }),

    updatePropertyStatus: build.mutation<any, { propertyId: number; status: string }>({
      query: ({ propertyId, status }) => ({
        url: `admin/properties/${propertyId}/status`,
        method: "PUT",
        body: { status },
      }),
      invalidatesTags: ["AllProperties"],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Property status updated successfully!",
          error: "Failed to update property status.",
        });
      },
    }),

    deleteProperty: build.mutation<any, number>({
      query: (propertyId) => ({
        url: `admin/properties/${propertyId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AllProperties"],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Property deleted successfully!",
          error: "Failed to delete property.",
        });
      },
    }),

    getAdminSettings: build.query<any, void>({
      query: () => "admin/settings",
      providesTags: ["AdminSettings"],
    }),

    updateAdminSettings: build.mutation<any, any>({
      query: (settings) => ({
        url: "admin/settings",
        method: "PUT",
        body: settings,
      }),
      invalidatesTags: ["AdminSettings"],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Settings updated successfully!",
          error: "Failed to update settings.",
        });
      },
    }),

    // Agent endpoints
    getAgentLeads: build.query<any[], void>({
      query: () => "agent/leads",
      providesTags: ["AgentLeads"],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to fetch leads.",
        });
      },
    }),

    getAgentClients: build.query<any[], void>({
      query: () => "agent/clients",
      providesTags: ["AgentClients"],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to fetch clients.",
        });
      },
    }),

    getAgentTasks: build.query<any[], void>({
      query: () => "agent/tasks",
      providesTags: ["AgentTasks"],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to fetch tasks.",
        });
      },
    }),

    updateLeadStatus: build.mutation<any, { leadId: number; status: string }>({
      query: ({ leadId, status }) => ({
        url: `agent/leads/${leadId}/status`,
        method: "PUT",
        body: { status },
      }),
      invalidatesTags: ["AgentLeads"],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Lead status updated successfully!",
          error: "Failed to update lead status.",
        });
      },
    }),

    updateTaskStatus: build.mutation<any, { taskId: number; status?: string; description?: string }>({
      query: ({ taskId, status, description }) => ({
        url: `agent/tasks/${taskId}/status`,
        method: "PUT",
        body: { status, description },
      }),
      invalidatesTags: ["AgentTasks"],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Task updated successfully!",
          error: "Failed to update task.",
        });
      },
    }),

    updateAgentSettings: build.mutation<any, { cognitoId: string } & Partial<any>>({
      query: ({ cognitoId, ...updatedAgent }) => ({
        url: `agent/${cognitoId}`,
        method: "PUT",
        body: updatedAgent,
      }),
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Settings updated successfully!",
          error: "Failed to update settings.",
        });
      },
    }),

    registerLandlordWithCode: build.mutation<
      Landlord,
      { cognitoId: string; name: string; email: string; phoneNumber: string; registrationCode: string }
    >({
      query: (body) => ({
        url: "landlords/register-with-code",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Landlords", "LandlordRegistrations"],
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch (error) {
          console.error("Error registering landlord with code:", error);
        }
      },
    }),

    getLandlordRegistrations: build.query<
      any[],
      { codeFilter?: string; usedFilter?: string }
    >({
      query: (params) => {
        const cleanedParams = cleanParams(params);
        return {
          url: "admin/landlord-registrations",
          params: cleanedParams,
        };
      },
      providesTags: ["LandlordRegistrations"],
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch (error) {
          console.error("Error fetching landlord registrations:", error);
        }
      },
    }),

    getLandlordRegistrationStats: build.query<any, void>({
      query: () => "admin/landlord-registration-stats",
      providesTags: ["LandlordRegistrations"],
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch (error) {
          console.error("Error fetching landlord registration stats:", error);
        }
      },
    }),

    // Admin Task Management endpoints
    getAdminTasks: build.query<any[], { status?: string; priority?: string; agentId?: string }>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.status) queryParams.append("status", params.status);
        if (params.priority) queryParams.append("priority", params.priority);
        if (params.agentId) queryParams.append("agentId", params.agentId);
        return `admin/tasks?${queryParams.toString()}`;
      },
      providesTags: ["AdminTasks"],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to fetch tasks.",
        });
      },
    }),

    getAdminTaskStats: build.query<any, void>({
      query: () => "admin/task-stats",
      providesTags: ["AdminTaskStats"],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to fetch task statistics.",
        });
      },
    }),

    createAdminTask: build.mutation<any, { title: string; description: string; agentId: number; priority: string; dueDate?: string }>({
      query: (taskData) => ({
        url: "admin/tasks",
        method: "POST",
        body: taskData,
      }),
      invalidatesTags: ["AdminTasks", "AdminTaskStats"],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Task created successfully!",
          error: "Failed to create task.",
        });
      },
    }),

    updateAdminTask: build.mutation<any, { id: number; title?: string; description?: string; status?: string; priority?: string; dueDate?: string }>({
      query: ({ id, ...taskData }) => ({
        url: `admin/tasks/${id}`,
        method: "PUT",
        body: taskData,
      }),
      invalidatesTags: ["AdminTasks", "AdminTaskStats"],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Task updated successfully!",
          error: "Failed to update task.",
        });
      },
    }),

    deleteAdminTask: build.mutation<any, number>({
      query: (taskId) => ({
        url: `admin/tasks/${taskId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AdminTasks", "AdminTaskStats"],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Task deleted successfully!",
          error: "Failed to delete task.",
        });
      },
    }),


  }),
});

export const {
  useGetAuthUserQuery,
  useUpdateTenantSettingsMutation,
  useUpdateLandlordSettingsMutation,
  useGetPropertiesQuery,
  useGetPropertyQuery,
  useGetCurrentResidencesQuery,
  useGetLandlordPropertiesQuery,
  useCreatePropertyMutation,
  useGetTenantQuery,
  useAddFavoritePropertyMutation,
  useRemoveFavoritePropertyMutation,
  useGetLeasesQuery,
  useGetPropertyLeasesQuery,
  useGetPaymentsQuery,
  useInitializePaymentMutation,
  useVerifyPaymentQuery,
  useGetPaymentHistoryQuery,
  useCreatePaymentMutation,
  useGetApplicationsQuery,
  useGetApplicationQuery,
  useUpdateApplicationStatusMutation,
  useCreateApplicationMutation,
  // Admin hooks
  useGetAdminAnalyticsQuery,
  useGetAllUsersQuery,
  useGetAllPropertiesQuery,
  useUpdateUserStatusMutation,
  useDeleteUserMutation,
  useUpdatePropertyStatusMutation,
  useDeletePropertyMutation,
  useGetAdminSettingsQuery,
  useUpdateAdminSettingsMutation,
  // Agent hooks
  useGetAgentLeadsQuery,
  useGetAgentClientsQuery,
  useGetAgentTasksQuery,
  useUpdateLeadStatusMutation,
  useUpdateTaskStatusMutation,
  useUpdateAgentSettingsMutation,
  useRegisterLandlordWithCodeMutation,
  useGetLandlordRegistrationsQuery,
  useGetLandlordRegistrationStatsQuery,
  // Admin Task Management hooks
  useGetAdminTasksQuery,
  useGetAdminTaskStatsQuery,
  useCreateAdminTaskMutation,
  useUpdateAdminTaskMutation,
  useDeleteAdminTaskMutation,

} = api;
