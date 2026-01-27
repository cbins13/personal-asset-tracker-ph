import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { authApi } from "../utils/api";
import { useAuth } from "../auth";
import { ErrorType } from "../utils/errorMessages";
import logoSmall from "../assets/savvi_logo.png";
import AnimatedContentWrapper from "../effects/AnimatedContentWrapper";

export default function LoginPage() {
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/login" });
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errorType, setErrorType] = useState<ErrorType | undefined>();
  const [canRetry, setCanRetry] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setErrorType(undefined);
    setCanRetry(false);
    setIsLoading(true);

    try {
      // Use auth.login() from context (as per TanStack Router docs)
      await auth.login(email, password);
      // Refresh auth state
      await auth.refresh();
      // Redirect to the redirect URL or dashboard
      navigate({ to: redirect || "/dashboard" });
    } catch (error) {
      // Check if error has errorType (from auth.login which uses apiRequest)
      const errorMessage = error instanceof Error ? error.message : "Login failed";
      setErrors({ submit: errorMessage });
      
      // Try to get error type from auth context if available
      if (auth.error) {
        // Auth context error handling - check if it's a network error
        if (errorMessage.includes('Network') || errorMessage.includes('fetch')) {
          setErrorType(ErrorType.NETWORK);
          setCanRetry(true);
        } else if (errorMessage.includes('session') || errorMessage.includes('expired')) {
          setErrorType(ErrorType.AUTHENTICATION);
          setCanRetry(false);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      return;
    }

    setIsLoading(true);
    setErrors({});
    setErrorType(undefined);
    setCanRetry(false);

    try {
      const response = await authApi.googleLogin(credentialResponse.credential);

      if (response.success && response.data) {
        // Refresh auth state
        await auth.refresh();
        // Redirect to the redirect URL or dashboard
        navigate({ to: redirect || "/dashboard" });
      } else {
        setErrors({ submit: response.error || "Google login failed" });
        setErrorType(response.errorType);
        setCanRetry(response.canRetry || false);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      setErrors({ submit: errorMessage });
      
      // Determine error type from error message
      if (errorMessage.includes('Network') || errorMessage.includes('fetch')) {
        setErrorType(ErrorType.NETWORK);
        setCanRetry(true);
      } else {
        setErrorType(ErrorType.UNKNOWN);
        setCanRetry(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    if (canRetry) {
      setErrors({});
      setErrorType(undefined);
      setCanRetry(false);
      // Retry the last action - for login form, resubmit
      const form = document.querySelector('form');
      if (form) {
        form.requestSubmit();
      }
    }
  };

  const handleGoogleError = () => {
    setErrors({ submit: "Google login failed. Please try again." });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <AnimatedContentWrapper delay={0.05} duration={0.8}>
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Link to="/" className="flex justify-center">
            <img
              src={logoSmall}
              alt="Savvi"
              className="h-[200px] w-[200px]"
            />
          </Link>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{" "}
            <Link
              to="/"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              return to home
            </Link>
          </p>
        </div>
      </AnimatedContentWrapper>

      <AnimatedContentWrapper delay={0.12} duration={0.9}>
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {errors.submit && (
              <div className={`rounded-md p-4 ${
                errorType === ErrorType.NETWORK || errorType === ErrorType.SERVER
                  ? 'bg-yellow-50 border border-yellow-200'
                  : errorType === ErrorType.AUTHENTICATION
                  ? 'bg-orange-50 border border-orange-200'
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {errorType === ErrorType.NETWORK || errorType === ErrorType.SERVER ? (
                      <svg className="h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    ) : errorType === ErrorType.AUTHENTICATION ? (
                      <svg className="h-5 w-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3 flex-1">
                    <p className={`text-sm font-medium ${
                      errorType === ErrorType.NETWORK || errorType === ErrorType.SERVER
                        ? 'text-yellow-800'
                        : errorType === ErrorType.AUTHENTICATION
                        ? 'text-orange-800'
                        : 'text-red-800'
                    }`}>
                      {errors.submit}
                    </p>
                    {errorType === ErrorType.AUTHENTICATION && (
                      <p className="mt-1 text-xs text-orange-700">
                        Please check your credentials and try again.
                      </p>
                    )}
                    {canRetry && (
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={handleRetry}
                          className={`text-sm font-medium underline ${
                            errorType === ErrorType.NETWORK || errorType === ErrorType.SERVER
                              ? 'text-yellow-800 hover:text-yellow-900'
                              : 'text-red-800 hover:text-red-900'
                          }`}
                        >
                          Try again
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a
                  href="#"
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  Forgot your password?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </button>
            </div>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex justify-center">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    useOneTap
                    shape="rectangular"
                    theme="outline"
                    size="large"
                    text="signin_with"
                  />
                </div>

                {/* <div className="flex items-center gap-3">
                  <div className="flex-1 border-t border-gray-300"></div>
                  <span className="text-sm text-gray-500">or</span>
                  <div className="flex-1 border-t border-gray-300"></div>
                </div>

                <button
                  type="button"
                  className="w-full inline-flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  <svg
                    className="h-5 w-5 mr-2"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  Continue with GitHub
                </button> */}
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <Link
                  to="/signup"
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </form>

          </div>
        </div>
      </AnimatedContentWrapper>
    </div>
  );
}
