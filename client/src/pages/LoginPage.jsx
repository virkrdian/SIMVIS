import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import "./LoginPage.css";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("ar");
  const [employeeId, setEmployeeId] = useState(""); // NIP
  const [agentCode, setAgentCode] = useState(""); // Kode AR/SA
  const [loading, setLoading] = useState(false);
  const [leftLogoFailed, setLeftLogoFailed] = useState(false);
  const [rightLogoFailed, setRightLogoFailed] = useState(false);
  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
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

  const handleAuth = async () => {
    setLoading(true);
    const endpoint = isRegister ? "register" : "login";
    const body = isRegister
      ? { email, password, name, role, employeeId, agentCode }
      : { email, password };

    try {
      const res = await fetch(`${API_URL}/api/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.message || "Gagal");

      if (isRegister) {
        toast.success("Registrasi berhasil, silakan login");
        setIsRegister(false);
      } else {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);

        if (data.role === "ar" || data.role === "sales")
          navigate("/dashboard/ar");
        else if (data.role === "officer") navigate("/dashboard/officer");
        else if (data.role === "manager") navigate("/dashboard/manager");
        else toast.error("Role tidak dikenali");
      }
    } catch (err) {
      toast.error(
        "Gagal terhubung ke server. Pastikan backend berjalan dan URL API benar."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50 px-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-lg border border-gray-100">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={leftLogoFailed ? FALLBACK_LEFT_LOGO : BRAND_LEFT_LOGO_URL}
              alt="Logo kiri"
              className="h-10 w-10 object-contain"
              onError={() => setLeftLogoFailed(true)}
            />
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-900 truncate">
                SISTEM 
              </div>
              <div className="text-xs text-gray-500 truncate">
                MONITORING
              </div>
            </div>
          </div>
          <img
            src={rightLogoFailed ? FALLBACK_RIGHT_LOGO : BRAND_RIGHT_LOGO_URL}
            alt="Logo kanan"
            className="h-11 object-contain"
            onError={() => setRightLogoFailed(true)}
          />
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-bold text-blue-600">SIMVIS</h1>
          <p className="text-gray-500">
            {isRegister ? "Buat akun baru" : "Silakan login"}
          </p>
        </div>

        <div className="space-y-4">
          {isRegister && (
            <>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama Lengkap"
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ar">AR</option>
                <option value="sales">Sales</option>
                <option value="officer">Officer</option>
                <option value="manager">Manager</option>
              </select>

              {(role === "ar" || role === "sales") && (
                <input
                  type="text"
                  value={agentCode}
                  onChange={(e) => setAgentCode(e.target.value)}
                  placeholder="Kode AR/SA"
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}

              {(role === "officer" || role === "manager") && (
                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="Nomor Induk Pekerja (NIP)"
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </>
          )}

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={handleAuth}
            disabled={loading}
            className="w-full px-4 py-2 font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Loading..." : isRegister ? "Daftar Sekarang" : "Masuk"}
          </button>
        </div>

        <div className="text-center">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-sm text-blue-600 hover:underline"
          >
            {isRegister
              ? "Sudah punya akun? Login"
              : "Belum punya akun? Daftar"}
          </button>
        </div>

        {/* DEMO ACCOUNTS INFO REMOVED */}
      </div>
    </div>
  );
}
