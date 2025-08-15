const Footer: React.FC = () => {
  return (
    <footer className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 pt-16 pb-8 px-4 sm:px-6 lg:px-8 border-t border-gray-100 dark:border-gray-700">
      <div className="max-w-7xl mx-auto">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div className="space-y-6">
            <div className="flex items-center">
              <img
                src="https://res.cloudinary.com/doxgutilx/image/upload/v1718330642/site/logo.svg"
                alt="Logo"
                className="h-8 w-auto"
              />
              <span className="ml-3 text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
                Mehedi
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              Crafting digital experiences with clean code and thoughtful design. Let's build something amazing
              together.
            </p>
            <div className="flex space-x-4">
              {["facebook", "twitter", "linkedin", "github", "instagram"].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300"
                  aria-label={social}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    {/* Social media icons would go here */}
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          <div className="space-y-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900 dark:text-white">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {["Home", "About", "Projects", "Blog", "Contact"].map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors duration-300"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900 dark:text-white">Services</h3>
            <ul className="space-y-3">
              {["Web Development", "UI/UX Design", "Mobile Apps", "SEO", "Consulting"].map((service) => (
                <li key={service}>
                  <a
                    href="#"
                    className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors duration-300"
                  >
                    {service}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900 dark:text-white">Contact</h3>
            <address className="not-italic text-gray-600 dark:text-gray-300 space-y-3">
              <div className="flex items-start">
                <svg
                  className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span>Dhaka, Bangladesh</span>
              </div>
              <div className="flex items-start">
                <svg
                  className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <a
                  href="mailto:hello@mehedi.com"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300"
                >
                  hello@mehedi.com
                </a>
              </div>
              <div className="flex items-start">
                <svg
                  className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <a
                  href="tel:+8801234567890"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300"
                >
                  +880 1234 567890
                </a>
              </div>
            </address>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-16 border-t border-gray-200 dark:border-gray-700"></div>

        {/* Bottom Footer */}
        <div className="mt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center md:text-left">
            © {new Date().getFullYear()} Md Mehedi Hasan. All rights reserved.
          </p>

          <div className="mt-4 md:mt-0 flex space-x-6">
            <a
              href="#"
              className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 transition-colors duration-300"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 transition-colors duration-300"
            >
              Terms of Service
            </a>
            <a
              href="#"
              className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 transition-colors duration-300"
            >
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
