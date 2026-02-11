import React from 'react';

interface ApiKeyModalProps {
  onSaved: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onSaved }) => {
  // API Key is managed via process.env.API_KEY as per guidelines.
  // No UI is required.
  return null;
};