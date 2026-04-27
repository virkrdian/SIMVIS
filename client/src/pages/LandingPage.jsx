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
              SIMVIS membantu tim lapangan bekerja lebih terarah: absensi
              berbasis lokasi, manajemen tugas end-to-end, pelaporan dengan bukti
              kunjungan, serta analitik performa yang mudah dibaca—semua dalam
              satu dashboard.
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
              Dibangun untuk operasional harian tim lapangan: cepat dipakai,
              rapi di laporan, dan jelas untuk monitoring.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl">📍</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Geo-Tagging Akurat</h3>
              <p className="text-gray-600">
                Rekam lokasi dan akurasi GPS saat absensi dan kunjungan, lalu
                tampilkan di peta serta rekap kehadiran untuk officer/manager.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Analitik Performa</h3>
              <p className="text-gray-600">
                Dashboard visual dengan grafik dan statistik untuk memantau
                produktivitas, reward, dan prospek. Cocok untuk evaluasi dan
                pengambilan keputusan cepat.
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

      {/* About Section */}
      <section id="about" className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Tentang SIMVIS</h2>
            <p className="text-gray-600 leading-relaxed">
              SIMVIS (Sales & Visual Monitoring System) adalah platform untuk
              mengelola aktivitas tim lapangan secara terukur. Mulai dari
              pembagian task, update progres, absensi berbasis lokasi, hingga
              pelaporan dengan bukti kunjungan—semuanya terdokumentasi rapi dan
              siap diekspor menjadi laporan.
            </p>
          </div>
        </div>
      </section>

      {/* Testimoni / Stats Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold mb-3">Ringkasan Operasional</h2>
            <p className="text-blue-100">
              Gambaran singkat performa dan stabilitas sistem untuk monitoring
              harian.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">15</div>
              <div className="text-blue-100">Active Agents</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">45</div>
              <div className="text-blue-100">Tasks</div>
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

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-3xl font-bold mb-3">Kontak</h2>
            <p className="text-gray-600">
              Untuk kolaborasi, demo, atau pengembangan lanjutan, hubungi saya:
            </p>
          </div>
          <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
                <div className="text-xs font-bold text-gray-500 mb-1">Email</div>
                <div className="font-semibold text-gray-800 break-words">
                  vrikifadrian@gmail.com
                </div>
              </div>
              <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
                <div className="text-xs font-bold text-gray-500 mb-1">GitHub</div>
                <a
                  href="https://github.com/virkrdian"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-blue-600 hover:underline break-words"
                >
                  virkrdian
                </a>
              </div>
              <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
                <div className="text-xs font-bold text-gray-500 mb-1">
                  Instagram
                </div>
                <a
                  href="https://instagram.com/_vrkifdrn11"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-blue-600 hover:underline break-words"
                >
                  _vrkifdrn11
                </a>
              </div>
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
            &copy; {new Date().getFullYear()} VirTech. All rights
            reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
