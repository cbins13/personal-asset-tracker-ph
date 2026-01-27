import { Link } from '@tanstack/react-router'
import logoSmall from '../assets/savvi_logo.png'
import sampleHeroImage from '../assets/sample-hero.png'
import { useAuth } from '../auth'
import BlurText from '../effects/BlurText'
import AnimatedContentWrapper from '../effects/AnimatedContentWrapper'

export default function LandingPage() {
  const { isAuthenticated } = useAuth()
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col ">
      {/* Header */}
      <header className="border-b border-gray-200">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="shrink-0">
              <Link to="/" className="inline-flex items-center gap-3">
                <img
                  src={logoSmall}
                  alt="Savvi"
                  className="w-[80px] h-[80px]"
                />
                <span className="sr-only">Savvi</span>
              </Link>
            </div>
            <div className="hidden md:block">
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated && (
                <Link
                  to="/dashboard"
                  className="text-gray-600 hover:text-gray-900 px-4 py-2 text-sm font-medium"
                >
                  Dashboard
                </Link>
              )}
              {!isAuthenticated && (
                <>
                  <Link
                    to="/login"
                    search={{ redirect: '/dashboard' }}
                    className="text-gray-600 hover:text-gray-900 px-4 py-2 text-sm font-bold"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="bg-primary-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-primary-700 transition-colors"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex items-center justify-center flex-1">
        <div className="grid md:grid-cols-1 lg:grid-cols-2 h-full gap-12 items-center">
          <AnimatedContentWrapper delay={0.1} duration={0.9}>
            <div>
              <h1 className="text-5xl font-bold leading-tight mb-6">
                <BlurText
                  text="Savvi"
                  delay={0.2}
                  animateBy="letters"
                  direction="top"
                  className="text-gray-900"
                />
                <span className="text-primary-600">
                  {' '}
                  <BlurText
                    text="Personal Asset Tracker"
                    delay={0.45}
                    animateBy="letters"
                    className="text-primary-600 italic"
                  />
                </span>
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Savvi helps you list down your financial assets and track your net worth in one place.
              </p>
              {!isAuthenticated ? (
                <Link
                  to="/signup"
                  className="inline-block bg-primary-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-primary-700 transition-colors"
                >
                  Get Started
                </Link>
              ) : (
                <Link
                  to="/dashboard"
                  className="inline-block bg-primary-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-primary-700 transition-colors"
                >
                  Go to Dashboard
                </Link>
              )}
            </div>
          </AnimatedContentWrapper>

          <AnimatedContentWrapper delay={0.3} duration={0.9} direction="horizontal" reverse>
            <div className="">
              <div className="shadow-2xl rounded-xl overflow-hidden">
                <img
                  src={sampleHeroImage}
                  alt="Asset tracking illustration"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </AnimatedContentWrapper>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-gray-400 text-sm text-center">
            Copyright © {new Date().getFullYear()} Savvi. All rights reserved
          </p>
        </div>
      </footer>
    </div>
  )
}
