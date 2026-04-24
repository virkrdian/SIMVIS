exports.mapMitraData = (mitraRow) => ({
  name: mitraRow.nama || mitraRow.full_name,
  email: mitraRow.email,
  role: mitraRow.role || "arsales",
  // normalisasi field lain sesuai kebutuhan
});
