"use client";

import SettingsForm from "@/components/SettingsForm";
import {
  useGetAuthUserQuery,
  useUpdateAgentSettingsMutation,
} from "@/state/api";
import React from "react";

const AgentSettings = () => {
  const { data: authUser, isLoading } = useGetAuthUserQuery();
  const [updateAgent] = useUpdateAgentSettingsMutation();

  if (isLoading) return <>Loading...</>;

  const initialData = {
    name: authUser?.userInfo.name,
    email: authUser?.userInfo.email,
    phoneNumber: authUser?.userInfo.phoneNumber,
  };

  const handleSubmit = async (data: typeof initialData) => {
    await updateAgent({
      cognitoId: authUser?.cognitoInfo?.userId,
      ...data,
    });
  };

  return (
    <SettingsForm
      initialData={initialData}
      onSubmit={handleSubmit}
      userType="agent"
    />
  );
};

export default AgentSettings;