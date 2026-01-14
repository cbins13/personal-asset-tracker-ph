import { Link } from '@tanstack/react-router'
import logoSmall from '../assets/savvi_logo.png'
import coinsHeroImage from '../assets/coins-hero-image.jpg'
import { useAuth } from '../auth'
import BlurText from '../effects/BlurText'
import AnimatedContent from '../effects/AnimatedContent'

export default function LandingPage() {
  const { isAuthenticated } = useAuth()
  return (
    <div className="min-h-screen bg-white">
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
              <div className="ml-10 flex items-baseline space-x-8">
                <a href="#features" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                  Features
                </a>
                <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                  How It Works
                </a>
                <a href="#benefits" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                  Benefits
                </a>
              </div>
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
                    className="text-gray-600 hover:text-gray-900 px-4 py-2 text-sm font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="bg-primary-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
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
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <AnimatedContent delay={0.1} duration={0.9}>
            <div>
              <h1 className="text-5xl font-bold leading-tight mb-6">
                <BlurText
                  text="Track Your Assets"
                  delay={300}
                  animateBy="words"
                  direction="top"
                  className="text-gray-900"
                />
                <span className="text-primary-600">
                  {' '}
                  <BlurText
                    text="with Confidence"
                    delay={450}
                    animateBy="words"
                    direction="top"
                    className="text-primary-600"
                  />
                </span>
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Savvi helps you organize, track, and manage all your personal assets in one place. From valuable items to important documents, keep everything organized and easily accessible.
              </p>
              {!isAuthenticated ? (
                <Link
                  to="/signup"
                  className="inline-block bg-primary-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                >
                  Get Started Free
                </Link>
              ) : (
                <Link
                  to="/dashboard"
                  className="inline-block bg-primary-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                >
                  Go to Dashboard
                </Link>
              )}
            </div>
          </AnimatedContent>

          <AnimatedContent delay={0.2} duration={0.9} direction="horizontal" reverse>
            <div className="hidden md:block">
              <div className="rounded-lg overflow-hidden">
                <img
                  src={coinsHeroImage}
                  alt="Asset tracking illustration"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </AnimatedContent>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedContent delay={0.05} duration={0.8}>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Key Features</h2>
              <p className="text-gray-600">Everything you need to manage your personal assets effectively</p>
            </div>
          </AnimatedContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                ),
                title: 'Easy Asset Entry',
                description: 'Quickly add and categorize your assets with detailed information and photos.',
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                ),
                title: 'Real-time Tracking',
                description: 'Monitor your asset values and status in real-time with comprehensive dashboards.',
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                ),
                title: 'Secure & Private',
                description: 'Your data is encrypted and stored securely. Your privacy is our priority.',
              },
            ].map((feature, i) => (
              <AnimatedContent key={i} delay={0.1 + i * 0.08} duration={0.8}>
                <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4 text-primary-600">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </AnimatedContent>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedContent delay={0.05} duration={0.8}>
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Why Choose Savvi for Asset Tracking?
              </h2>
              <p className="text-gray-600 text-lg">Perfect for individuals who want to stay organized and informed</p>
            </div>
          </AnimatedContent>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'For Homeowners',
                description: 'Track valuable items, appliances, electronics, and home inventory for insurance and organization purposes.',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                ),
              },
              {
                title: 'For Collectors',
                description: 'Organize your collections, track values, and maintain detailed records of your collectibles and antiques.',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                ),
              },
              {
                title: 'For Professionals',
                description: 'Manage business assets, equipment, and important documents with professional-grade organization tools.',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                ),
              },
            ].map((item, i) => (
              <AnimatedContent key={i} delay={0.1 + i * 0.1} duration={0.85}>
                <div className="bg-white border border-gray-200 rounded-lg p-8 hover:shadow-lg transition-shadow">
                  <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center mb-6 text-primary-600">
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              </AnimatedContent>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-600 py-20">
        <AnimatedContent delay={0.05} duration={0.9}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold text-white mb-6">
              Start Tracking Your Assets Today
            </h2>
            <p className="text-primary-100 text-lg mb-8">
              Join thousands of users who trust Savvi to keep their assets organized and secure.
            </p>
            {!isAuthenticated ? (
              <Link
                to="/signup"
                className="inline-block bg-white text-primary-600 px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Get Started Free
              </Link>
            ) : (
              <Link
                to="/dashboard"
                className="inline-block bg-white text-primary-600 px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Go to Dashboard
              </Link>
            )}
          </div>
        </AnimatedContent>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="mb-4">
                <img
                  src={logoSmall}
                  alt="Savvi"
                  className="h-8 w-auto"
                />
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Copyright © {new Date().getFullYear()} Savvi. All rights reserved
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">About us</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Contact us</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">Testimonials</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Help center</a></li>
                <li><a href="#" className="hover:text-white">Terms of service</a></li>
                <li><a href="#" className="hover:text-white">Legal</a></li>
                <li><a href="#" className="hover:text-white">Privacy policy</a></li>
                <li><a href="#" className="hover:text-white">Status</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Stay up to date</h4>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Your email address"
                  className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-l-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500"
                />
                <button className="bg-primary-600 text-white px-6 py-2 rounded-r-lg hover:bg-primary-700 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
