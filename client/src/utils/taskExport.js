import jsPDF from "jspdf";

const joinUrl = (base, path) => {
  const b = String(base || "").replace(/\/+$/, "");
  const p = String(path || "")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "");
  return b && p ? `${b}/${p}` : b || p;
};

const normalizeFileNamePart = (value) => {
  const s = String(value || "").trim();
  const normalized = s.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "");
  return normalized || "task";
};

export const getEvidenceLinks = (task, apiUrl) => {
  const build = (p) => (p ? joinUrl(apiUrl, p) : null);
  const links = [];
  const taskId = task?._id;
  const token = (() => {
    try {
      return localStorage.getItem("token");
    } catch {
      return null;
    }
  })();
  const byApi = (field) => {
    if (!taskId) return null;
    const url = joinUrl(apiUrl, `api/tasks/${taskId}/evidence/${field}`);
    return token ? `${url}?token=${encodeURIComponent(token)}` : url;
  };

  const front =
    task?.evidenceFrontFile?.contentType || task?.evidenceFrontFile?.filename
      ? byApi("evidenceFront")
      : build(task?.evidenceFront);
  const side =
    task?.evidenceSideFile?.contentType || task?.evidenceSideFile?.filename
      ? byApi("evidenceSide")
      : build(task?.evidenceSide);
  const withPic =
    task?.evidenceWithPicFile?.contentType || task?.evidenceWithPicFile?.filename
      ? byApi("evidenceWithPic")
      : build(task?.evidenceWithPic);
  const legacy =
    task?.evidenceFile?.contentType || task?.evidenceFile?.filename
      ? byApi("evidence")
      : build(task?.evidence);

  if (front) links.push({ label: "Depan", url: front });
  if (side) links.push({ label: "Samping", url: side });
  if (withPic) links.push({ label: "PIC", url: withPic });
  if (links.length === 0 && legacy) links.push({ label: "Bukti", url: legacy });

  return links;
};

const formatUser = (u) => {
  if (!u) return "-";
  const parts = [];
  if (u.name) parts.push(String(u.name));
  if (u.role) parts.push(String(u.role));
  if (u.employeeId) parts.push(`employeeId:${u.employeeId}`);
  if (u.agentCode) parts.push(`agentCode:${u.agentCode}`);
  if (u.email) parts.push(String(u.email));
  return parts.length ? parts.join(" | ") : "-";
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
};

const formatReportData = (reportData) => {
  if (!reportData || typeof reportData !== "object") return "-";
  const keys = Object.keys(reportData || {});
  if (keys.length === 0) return "-";
  try {
    return JSON.stringify(reportData, null, 2);
  } catch {
    return String(reportData);
  }
};

const getImageDataUrl = async (url) => {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error("Failed to load image", url, err);
    return null;
  }
};

const buildTaskText = (task, apiUrl, header) => {
  const t = task || {};
  const evidenceLinks = getEvidenceLinks(t, apiUrl);
  const evidenceText =
    evidenceLinks.length > 0
      ? evidenceLinks.map((l) => `${l.label}: ${l.url}`).join("\n")
      : "-";

  const completedBy = t.completedBy || t.assignedTo;

  return [
    header,
    "",
    `Judul: ${t.title || "-"}`,
    `Deskripsi: ${t.description || "-"}`,
    `Segment: ${t.segment || "-"}`,
    `Lokasi: ${t.location || "-"}`,
    `Latitude: ${typeof t.latitude === "number" ? t.latitude : "-"}`,
    `Longitude: ${typeof t.longitude === "number" ? t.longitude : "-"}`,
    `Reward: ${typeof t.reward === "number" ? t.reward : "-"}`,
    `Status: ${t.status || "-"}`,
    `Dibuat: ${formatDateTime(t.createdAt)}`,
    `Diupdate: ${formatDateTime(t.updatedAt)}`,
    "",
    `Assigned To: ${formatUser(t.assignedTo)}`,
    `Completed By: ${formatUser(completedBy)}`,
    `Completed At: ${formatDateTime(t.completedAt)}`,
    "",
    `Report Type: ${t.reportType || "-"}`,
    "Report Data:",
    formatReportData(t.reportData),
    "",
    `PIC Name: ${t.picName || "-"}`,
    `PIC Phone: ${t.picPhone || "-"}`,
    `Prospects: ${
      typeof t.prospects === "number" ? t.prospects : t.prospects ?? 0
    }`,
    `Notes: ${t.notes || "-"}`,
    "",
    "Bukti (Link):",
    evidenceText,
    "",
  ].join("\n");
};

export const downloadTaskTXT = (task, apiUrl, options = {}) => {
  const titlePart = normalizeFileNamePart(task?.title).slice(0, 40);
  const fileNamePrefix = normalizeFileNamePart(
    options.fileNamePrefix || "task"
  );
  const fileName = `${fileNamePrefix}_${titlePart}.txt`;
  const header = options.header || "LAPORAN TASK";

  const content = buildTaskText(task, apiUrl, header);
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
};

const convertLogoToPng = (logoUrl) => {
  return new Promise((resolve) => {
    if (!logoUrl) return resolve(null);
    
    // If it's already a data URI but not SVG, return as is (assuming PNG/JPG)
    if (logoUrl.startsWith("data:image/") && !logoUrl.includes("svg+xml")) {
      return resolve(logoUrl);
    }

    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        // Set canvas size to match image (or larger for quality)
        // For SVGs, img.width/height might depend on the viewBox or width/height attr
        canvas.width = img.width || 500;
        canvas.height = img.height || 150;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/png");
        resolve(dataUrl);
      } catch (e) {
        console.warn("Canvas export failed", e);
        resolve(null);
      }
    };
    img.onerror = (e) => {
      console.warn("Logo image load failed", e);
      resolve(null);
    };
    img.src = logoUrl;
  });
};

export const downloadTaskPDF = async (task, apiUrl, options = {}) => {
  const titlePart = normalizeFileNamePart(task?.title).slice(0, 40);
  const fileNamePrefix = normalizeFileNamePart(
    options.fileNamePrefix || "task"
  );
  const fileName = `${fileNamePrefix}_${titlePart}.pdf`;
  const header = options.header || "LAPORAN TASK";

  // Use A4 size (210mm x 297mm)
  const doc = new jsPDF("p", "mm", "a4");

  // --- 1. HEADER & LOGO ---
  let y = 20;

  // Add Logo if available
  if (options.logoUrl) {
    try {
      // Convert SVG to PNG first to ensure jsPDF can render it
      const pngLogo = await convertLogoToPng(options.logoUrl);
      if (pngLogo) {
        // Aspect ratio: assume the logo is roughly 3.33:1 (500x150)
        // We want it roughly 40mm wide -> height approx 12mm
        doc.addImage(pngLogo, "PNG", 14, 10, 40, 12); 
      } else {
         throw new Error("Logo conversion failed");
      }
    } catch (e) {
      // Fallback: draw a simple red square if logo fails
      // doc.setFillColor(225, 29, 72); 
      // doc.rect(14, 10, 20, 20, "F");
      // User requested logo, if fails, better leave blank or text?
      // Let's print text fallback
      doc.setFontSize(10);
      doc.text("TELKOM INDONESIA", 14, 20);
    }
  }

  // Header Text (Right aligned or Centered relative to content)
  // Since logo is on left (Telkom Indonesia logo has text included), 
  // we might want the "LAPORAN TASK" to be below or to the right.
  // The user's image 2 shows:
  // [Logo/RedBox]  TELKOM INDONESIA (Title)
  //                LAPORAN TASK - OFFICER (Subtitle)
  
  // If we use the Full Logo (which contains text "Telkom Indonesia"), 
  // we don't need to duplicate "TELKOM INDONESIA" text next to it if the logo is large.
  // BUT the user's design shows [Red Box] [TELKOM INDONESIA Text].
  // IF we replace Red Box with the FULL LOGO (Text+Graphic), it might look redundant.
  // HOWEVER, the user said "kotak merah ganti jadi logo" (replace red box with logo).
  // AND the logo I made has the text "Telkom Indonesia" inside it.
  
  // Let's adjust layout:
  // If logo is used, maybe we don't need the big "TELKOM INDONESIA" text again?
  // Or maybe the logo should be just the GRAPHIC?
  // The user said "ganti yang kiri tapi yang kanan" -> "use the right logo".
  // The "Right Logo" I made includes the text.
  
  // Let's just place the logo (which has text) and then the "LAPORAN TASK" below it?
  // OR place logo left, and "LAPORAN TASK" right?
  
  // User Image 2:
  // [Red Box]  TELKOM INDONESIA
  //            LAPORAN TASK - OFFICER
  
  // If I replace Red Box with the Full Logo (Text+Icon), it will look like:
  // [Telkom Indonesia Icon+Text]  TELKOM INDONESIA
  //                               LAPORAN TASK...
  // Double text.
  
  // Decision: The "Right Logo" I created is the full brand block. 
  // I will position it where the Red Box + "TELKOM INDONESIA" text was.
  // So I will REMOVE the hardcoded "TELKOM INDONESIA" text from the PDF generation 
  // if the logo is present, OR just put the "LAPORAN TASK" title.
  
  // Let's place the Logo (40x12mm) at top left.
  // Then "LAPORAN TASK" below it?
  
  // Actually, let's keep the layout simple:
  // Logo (Top Left)
  // [Line]
  
  // But wait, the previous code had:
  // doc.text("TELKOM INDONESIA", 40, 18);
  // doc.text(header, 40, 26);
  
  // I will CHANGE this.
  // I will put the Logo at x=14, y=10.
  // And put the header "LAPORAN TASK..." at x=14, y=28 (below logo).
  
  // Removing the separate "TELKOM INDONESIA" text since the logo has it.
  
  doc.setFontSize(14);
  doc.setFont(undefined, "bold");
  // doc.text("TELKOM INDONESIA", 40, 18); // Removed to avoid duplication
  
  // Align Header to Right or Left? User Image 2 has it Left aligned next to box.
  // If I put logo (width 40), I can put header to the right of it?
  // Logo ends at x=14+40=54.
  // Let's put header at x=60.
  
  doc.text(header, 60, 18); // "LAPORAN TASK - OFFICER"

  // Line separator
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(14, 30, 196, 30);

  y = 40;

  // --- 2. TASK DETAILS (Table-like Layout) ---
  const t = task || {};
  const completedBy = t.completedBy || t.assignedTo;

  const labels = [
    { label: "Judul Task", value: t.title || "-" },
    { label: "Deskripsi", value: t.description || "-" },
    { label: "Segment", value: t.segment || "-" },
    { label: "Lokasi", value: t.location || "-" },
    {
      label: "Koordinat",
      value: `${t.latitude || "-"}, ${t.longitude || "-"}`,
    },
    {
      label: "Reward",
      value:
        typeof t.reward === "number" ? `Rp ${t.reward.toLocaleString()}` : "-",
    },
    { label: "Status", value: (t.status || "-").toUpperCase() },
    { label: "Waktu Dibuat", value: formatDateTime(t.createdAt) },
    { label: "Assigned To", value: formatUser(t.assignedTo) },
    { label: "Completed By", value: formatUser(completedBy) },
    { label: "Completed At", value: formatDateTime(t.completedAt) },
    { label: "PIC Name", value: t.picName || "-" },
    { label: "PIC Phone", value: t.picPhone || "-" },
    { label: "Prospects", value: String(t.prospects ?? 0) },
    { label: "Report Type", value: t.reportType || "-" },
    { label: "Notes", value: t.notes || "-" },
  ];

  doc.setFontSize(10);

  labels.forEach((item) => {
    // Check page break
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    doc.setFont(undefined, "bold");
    doc.text(`${item.label}:`, 14, y);

    doc.setFont(undefined, "normal");
    // Handle multiline value
    const valueLines = doc.splitTextToSize(String(item.value), 130);
    doc.text(valueLines, 60, y);

    y += Math.max(6, valueLines.length * 5); // spacing based on lines
  });

  // Report Data JSON (if any)
  if (t.reportData && Object.keys(t.reportData).length > 0) {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }
    y += 5;
    doc.setFont(undefined, "bold");
    doc.text("Report Data (Detail):", 14, y);
    y += 6;
    doc.setFont(undefined, "normal");
    const jsonStr = formatReportData(t.reportData);
    const jsonLines = doc.splitTextToSize(jsonStr, 180);
    doc.text(jsonLines, 14, y);
    y += jsonLines.length * 5;
  }

  // Evidence Links Text
  const evidenceLinks = getEvidenceLinks(t, apiUrl);
  // REMOVED: Text links for evidence
  // if (evidenceLinks.length > 0) {
  //   y += 5;
  //   if (y > 270) {
  //     doc.addPage();
  //     y = 20;
  //   }
  //   doc.setFont(undefined, "bold");
  //   doc.text("Link Bukti:", 14, y);
  //   y += 6;
  //   doc.setFont(undefined, "normal");
  //   evidenceLinks.forEach((l) => {
  //     doc.text(`${l.label}: ${l.url}`, 14, y);
  //     y += 5;
  //   });
  // }

  // --- 3. EMBEDDED IMAGES ---
  if (evidenceLinks.length > 0) {
    // Start images on a new page usually looks cleaner, or continue if space
    doc.addPage();
    y = 20;

    doc.setFontSize(14);
    doc.setFont(undefined, "bold");
    doc.text("Lampiran Gambar", 14, y);
    y += 10;
    doc.setLineWidth(0.5);
    doc.line(14, y, 196, y);
    y += 10;

    for (const link of evidenceLinks) {
      const imgData = await getImageDataUrl(link.url);
      if (imgData) {
        if (y > 220) {
          // Check if enough space for image + label
          doc.addPage();
          y = 20;
        }

        doc.setFontSize(11);
        doc.setFont(undefined, "bold");
        doc.text(`${link.label}`, 14, y);
        y += 5;

        try {
          // Fit image to page width (180mm) with max height 100mm
          doc.addImage(imgData, "JPEG", 14, y, 160, 100);
          y += 110;
        } catch (e) {
          doc.setFontSize(10);
          doc.setTextColor(255, 0, 0);
          doc.text("[Gagal memuat gambar - format tidak didukung]", 14, y);
          doc.setTextColor(0, 0, 0);
          y += 10;
        }
      }
    }
  }

  doc.save(fileName);
};
