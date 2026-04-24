import { Link } from "react-router-dom";

export default function LandingPage() {
  const BRAND_LEFT_LOGO_URL =
    process.env.REACT_APP_BRAND_LEFT_LOGO_URL || "/brand-left.png";
  const BRAND_RIGHT_LOGO_URL =
    process.env.REACT_APP_BRAND_RIGHT_LOGO_URL || "/brand-right.png";

  const FALLBACK_LEFT_LOGO = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="150" viewBox="0 0 300 150">
       <g transform="translate(10, 25)">
          <text x="5" y="90" font-family="Georgia, serif" font-weight="bold" font-size="100" fill="#2563EB">S</text>
          <text x="80" y="80" font-family="Arial, sans-serif" font-weight="bold" font-size="45" fill="#2563EB">IMVIS</text>
       </g>
    </svg>`
  )}`;

  const FALLBACK_RIGHT_LOGO = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 150">
       <style>
         .text { font-family: "Trebuchet MS", Arial, sans-serif; fill: #000000; }
         .bold { font-weight: bold; }
         .italic { font-style: italic; }
         .blue { fill: #2563EB; }
         .gray { stroke: #555555; stroke-width: 14; fill: none; }
       </style>
       <text x="10" y="55" class="text bold" font-size="52" fill="#2563EB">SIMVIS</text>
       <text x="10" y="105" class="text bold" font-size="52" fill="#2563EB">Dashboard</text>
       
       <g transform="translate(360, 75) scale(0.9)">
         <circle cx="0" cy="0" r="45" class="gray" />
       </g>
    </svg>`
  )}`;

  return (
    <div className="min-h-screen bg-white font-sans text-gray-800">
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md shadow-sm z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img
              src={BRAND_LEFT_LOGO_URL}
              onError={(e) => (e.target.src = FALLBACK_LEFT_LOGO)}
              alt="Logo"
              className="h-8 object-contain"
            />
            <span className="text-xl font-bold text-blue-600">SIMVIS</span>
          </div>
          <div className="hidden md:flex gap-8 text-sm font-medium">
            <a href="#features" className="hover:text-blue-600 transition">
              Fitur
            </a>
            <a href="#about" className="hover:text-blue-600 transition">
              Tentang
            </a>
            <a href="#contact" className="hover:text-blue-600 transition">
              Kontak
            </a>
          </div>
          <Link
            to="/login"
            className="bg-blue-600 text-white px-5 py-2 rounded-full font-medium hover:bg-blue-700 transition shadow-lg shadow-blue-600/30"
          >
            Login Dashboard
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight text-gray-900">
              Sistem Monitoring <br />
              <span className="text-blue-600">Visual & Sales</span>
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Optimalkan kinerja tim lapangan Anda dengan pelacakan real-time,
              analitik mendalam, dan manajemen tugas yang efisien dalam satu
              platform terpadu.
            </p>
            <div className="flex gap-4">
              <Link
                to="/login"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-600/30"
              >
                Mulai Sekarang
              </Link>
              <a
                href="#features"
                className="bg-gray-100 text-gray-700 px-8 py-3 rounded-lg font-bold hover:bg-gray-200 transition"
              >
                Pelajari Lebih Lanjut
              </a>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-100 to-purple-100 rounded-full blur-3xl opacity-50 -z-10"></div>
            <img
              src="https://img.freepik.com/free-vector/business-team-discussing-ideas-startup_74855-4380.jpg"
              alt="Hero Illustration"
              className="w-full rounded-2xl shadow-2xl transform rotate-2 hover:rotate-0 transition duration-500"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold mb-4">Fitur Unggulan</h2>
            <p className="text-gray-600">
              Dirancang khusus untuk kebutuhan monitoring sales dan task force
            Perusahaan.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl">📍</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Geo-Tagging Akurat</h3>
              <p className="text-gray-600">
                Pantau lokasi sales dan task force secara real-time dengan
                integrasi peta interaktif dan validasi radius.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Analitik Performa</h3>
              <p className="text-gray-600">
                Dashboard visual dengan grafik dan statistik untuk memantau
                produktivitas tim dan pencapaian target.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl">📱</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Mobile Responsive</h3>
              <p className="text-gray-600">
                Akses dari mana saja, kapan saja. Desain responsif yang nyaman
                digunakan di smartphone maupun desktop.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">100+</div>
              <div className="text-blue-100">Active Agents</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">50k+</div>
              <div className="text-blue-100">Tasks Completed</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">99%</div>
              <div className="text-blue-100">Uptime</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-blue-100">Monitoring</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <img
              src={BRAND_RIGHT_LOGO_URL}
              onError={(e) => (e.target.src = FALLBACK_RIGHT_LOGO)}
              alt="Logo Footer"
              className="h-8 opacity-80"
            />
          </div>
          <div className="text-sm">
            &copy; {new Date().getFullYear()} Perusahaan. All rights
            reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
