import { useState } from "react";

export default function CompleteTaskForm({ taskId, onSuccess }) {
  const [formData, setFormData] = useState({
    picName: "",
    picPhone: "",
    notes: "",
    prospects: "",
  });
  const [evidenceFront, setEvidenceFront] = useState(null);
  const [evidenceSide, setEvidenceSide] = useState(null);
  const [evidenceWithPic, setEvidenceWithPic] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitNotice, setSubmitNotice] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

    if (isSubmitting) return;
    setIsSubmitting(true);
    setSubmitNotice("Mengirim laporan...");

    const data = new FormData();
    data.append("picName", formData.picName);
    data.append("picPhone", formData.picPhone);
    data.append("notes", formData.notes);
    data.append("prospects", formData.prospects);
    if (evidenceFront) data.append("evidenceFront", evidenceFront);
    if (evidenceSide) data.append("evidenceSide", evidenceSide);
    if (evidenceWithPic) data.append("evidenceWithPic", evidenceWithPic);

    try {
      const res = await fetch(`${API_URL}/api/tasks/${taskId}/complete`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: data,
      });
      if (res.ok) {
        setSubmitNotice("Berhasil ✓ Data tersimpan dan tersinkron");
        setFormData({ picName: "", picPhone: "", notes: "", prospects: "" });
        setEvidenceFront(null);
        setEvidenceSide(null);
        setEvidenceWithPic(null);
        if (onSuccess) {
          onSuccess();
          setTimeout(onSuccess, 800);
        }
      } else {
        const err = await res.json().catch(() => ({}));
        setSubmitNotice(
          err.message ? `Gagal: ${err.message}` : "Gagal mengirim laporan"
        );
      }
    } catch (err) {
      console.error(err);
      setSubmitNotice("Terjadi kesalahan jaringan");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-2 space-y-2 p-2 bg-gray-50 rounded text-sm"
    >
      <div>
        <input
          name="picName"
          placeholder="Nama PIC"
          required
          value={formData.picName}
          className="w-full border rounded px-2 py-1"
          onChange={handleChange}
        />
      </div>
      <div>
        <input
          name="picPhone"
          placeholder="No HP PIC"
          required
          value={formData.picPhone}
          className="w-full border rounded px-2 py-1"
          onChange={handleChange}
        />
      </div>
      <div>
        <input
          name="prospects"
          type="number"
          placeholder="Jml Prespek/Pelanggan"
          value={formData.prospects}
          className="w-full border rounded px-2 py-1"
          onChange={handleChange}
        />
      </div>
      <div>
        <textarea
          name="notes"
          placeholder="Keterangan"
          value={formData.notes}
          className="w-full border rounded px-2 py-1"
          onChange={handleChange}
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">
          Tambahkan gambar bangunan depan:
        </label>
        <input
          type="file"
          accept="image/*"
          required
          onChange={(e) => setEvidenceFront(e.target.files?.[0] || null)}
          className="w-full text-xs"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">
          Tambahkan gambar bangunan samping:
        </label>
        <input
          type="file"
          accept="image/*"
          required
          onChange={(e) => setEvidenceSide(e.target.files?.[0] || null)}
          className="w-full text-xs"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">
          Tambahkan gambar bersama PIC:
        </label>
        <input
          type="file"
          accept="image/*"
          required
          onChange={(e) => setEvidenceWithPic(e.target.files?.[0] || null)}
          className="w-full text-xs"
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full py-1 rounded font-medium ${
          isSubmitting
            ? "bg-green-300 text-white cursor-not-allowed"
            : "bg-green-500 text-white hover:bg-green-600"
        }`}
      >
        {isSubmitting ? "Mengirim..." : "Kirim Laporan"}
      </button>
      {submitNotice && (
        <div className="text-xs text-gray-600">{submitNotice}</div>
      )}
    </form>
  );
}
