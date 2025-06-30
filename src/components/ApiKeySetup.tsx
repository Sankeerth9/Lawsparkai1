import React, { useState } from 'react';
import { Key, AlertCircle, CheckCircle, ExternalLink, Eye, EyeOff } from 'lucide-react';

interface ApiKeySetupProps {
  onApiKeySet?: (apiKey: string) => void;
  currentApiKey?: string;
}

const ApiKeySetup: React.FC<ApiKeySetupProps> = ({ onApiKeySet, currentApiKey }) => {
  const [apiKey, setApiKey] = useState(currentApiKey || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{ isValid: boolean; message: string } | null>(null);

  const validateApiKey = async (key: string) => {
    if (!key.trim()) {
      return { isValid: false, message: 'API key is required' };
    }

    if (key.length < 20) {
      return { isValid: false, message: 'API key appears to be too short' };
    }

    if (!key.startsWith('AI')) {
      return { isValid: false, message: 'Gemini API keys typically start with "AI"' };
    }

    // In a real implementation, you might want to test the API key with a simple request
    return { isValid: true, message: 'API key format appears valid' };
  };

  const handleValidateKey = async () => {
    setIsValidating(true);
    const result = await validateApiKey(apiKey);
    setValidationResult(result);
    setIsValidating(false);

    if (result.isValid && onApiKeySet) {
      onApiKeySet(apiKey);
    }
  };

  const isConfigured = !!import.meta.env.VITE_GEMINI_API_KEY;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex p-3 bg-blue-100 rounded-xl mb-4">
            <Key className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Gemini Pro API Setup</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            To use AI-powered legal analysis, you need to configure your Google Gemini Pro API key.
          </p>
        </div>

        {isConfigured ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-semibold text-green-800">API Key Configured</span>
            </div>
            <p className="text-green-700 text-sm mt-1">
              Your Gemini Pro API key is configured and ready to use.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <span className="font-semibold text-yellow-800">API Key Required</span>
                  <p className="text-yellow-700 text-sm mt-1">
                    You need a Gemini Pro API key to use AI features. The key should be added to your environment variables.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">
                Gemini Pro API Key
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  id="apiKey"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your Gemini Pro API key..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showApiKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              
              {validationResult && (
                <div className={`flex items-center space-x-2 text-sm ${
                  validationResult.isValid ? 'text-green-600' : 'text-red-600'
                }`}>
                  {validationResult.isValid ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <span>{validationResult.message}</span>
                </div>
              )}

              <button
                onClick={handleValidateKey}
                disabled={!apiKey.trim() || isValidating}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
              >
                {isValidating ? 'Validating...' : 'Validate API Key'}
              </button>
            </div>
          </div>
        )}

        <div className="bg-gray-50 rounded-lg p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">How to get your Gemini Pro API Key:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
            <li>Visit the Google AI Studio</li>
            <li>Sign in with your Google account</li>
            <li>Create a new API key for Gemini Pro</li>
            <li>Copy the API key and add it to your .env file as VITE_GEMINI_API_KEY</li>
            <li>Restart your development server</li>
          </ol>
          <a
            href="https://makersuite.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <span>Get API Key from Google AI Studio</span>
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <span className="font-semibold text-red-800">Security Notice</span>
              <p className="text-red-700 text-sm mt-1">
                Never share your API key publicly or commit it to version control. 
                Always use environment variables for API keys in production.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeySetup;