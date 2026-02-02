import React from "react";
import { useAuth } from "../../context/AuthContext";
import { Feature, hasFeature } from "../../utils/features";

interface ProGateProps {
  feature: Feature;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const ProGate: React.FC<ProGateProps> = ({
  feature,
  children,
  fallback = null,
}) => {
  const { user } = useAuth();

  if (hasFeature(user, feature)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

export default ProGate;
