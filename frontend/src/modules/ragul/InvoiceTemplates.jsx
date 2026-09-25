import React, { useState, useRef, useEffect } from "react";
import JSZip from "jszip";
import { Download, Printer, Archive, Plus, Edit3, X, Check } from "lucide-react";

function money(val) {
  return `₹${Number(val || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export const COLOR_PRESETS = [
  { label: "Royal Blue", header: "#1d4ed8", accent: "#2563eb" },
  { label: "Forest Pine", header: "#133832", accent: "#166534" },
  { label: "Deep Teal", header: "#0f766e", accent: "#0d9488" },
  { label: "Classic Navy", header: "#1e293b", accent: "#3b82f6" },
  { label: "Crimson Red", header: "#991b1b", accent: "#dc2626" },
  { label: "Sunset Amber", header: "#b45309", accent: "#d97706" },
  { label: "Regal Plum", header: "#6b21a8", accent: "#9333ea" },
  { label: "Slate Charcoal", header: "#0f172a", accent: "#475569" },
];

export const TEMPLATE_LAYOUTS = [
  { id: "wave", name: "Modern Wave", desc: "Curved dynamic header (Canva style)", icon: "🌊" },
  { id: "minimal", name: "Clean Minimal", desc: "Crisp typography & signature (Executive)", icon: "📄" },
  { id: "classic", name: "Classic Grid", desc: "Boxed tax invoice & official stamp", icon: "🏛️" },
  { id: "split", name: "Split Sidebar", desc: "Vertical accent pillar & modern cards", icon: "📑" },
  { id: "premium", name: "Premium Gold", desc: "Luxury framed card & verified seal", icon: "👑" },
];

export default function InvoiceTemplatesView({
  templates = [],
  selectedTemplateId,
  setSelectedTemplateId,
  activeTemplate,
  onSave,
  onSetDefault,
  showMessage,
}) {
  const fileInputRef = useRef(null);
  const [isZipping, setIsZipping] = useState(false);

  // Popup Modal visibility state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("edit"); // "create" | "edit"

  // Form state inside the modal
  const [formData, setFormData] = useState({
    id: activeTemplate?.id || "wave-blue",
    name: activeTemplate?.name || "Modern Wave (Canva Style)",
    layoutStyle: activeTemplate?.layoutStyle || "wave",
    businessName: activeTemplate?.businessName || "Sri Lakshmi Properties & Estates",
    address: activeTemplate?.address || "Plot 14, 100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038",
    gstin: activeTemplate?.gstin || "29AKLPP4821M1Z6",
    pan: activeTemplate?.pan || "AAKLP4821M",
    header: activeTemplate?.header || "#1d4ed8",
    accent: activeTemplate?.accent || "#2563eb",
    logo: activeTemplate?.logo || null,
    logoName: activeTemplate?.logoName || "company-logo.png",
    footer:
      activeTemplate?.footer ||
      "Bank: HDFC Bank, Indiranagar Branch - A/c 50200012345670 - IFSC HDFC0000123\nPayment terms: Due on the 5th of every month. Thank you for your business!",
    isDefault: Boolean(activeTemplate?.isDefault),
  });

  // Sync formData with activeTemplate when selection changes
  useEffect(() => {
    if (activeTemplate) {
      setFormData({
        id: activeTemplate.id,
        name: activeTemplate.name || "",
        layoutStyle: activeTemplate.layoutStyle || "wave",
        businessName: activeTemplate.businessName || "Sri Lakshmi Properties & Estates",
        address: activeTemplate.address || "Plot 14, 100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038",
        gstin: activeTemplate.gstin || "29AKLPP4821M1Z6",
        pan: activeTemplate.pan || "AAKLP4821M",
        header: activeTemplate.header || "#1d4ed8",
        accent: activeTemplate.accent || "#2563eb",
        logo: activeTemplate.logo || null,
        logoName: activeTemplate.logoName || "company-logo.png",
        footer:
          activeTemplate.footer ||
          "Bank: HDFC Bank, Indiranagar Branch - A/c 50200012345670 - IFSC HDFC0000123\nPayment terms: Due on the 5th of every month. Thank you for your business!",
        isDefault: Boolean(activeTemplate.isDefault),
      });
    }
  }, [activeTemplate]);

  // Open Modal for New Template
  function handleOpenCreateModal() {
    setModalMode("create");
    setFormData({
      id: `template-${Date.now()}`,
      name: `Custom Template ${templates.length + 1}`,
      layoutStyle: "wave",
      businessName: activeTemplate?.businessName || "Sri Lakshmi Properties & Estates",
      address: activeTemplate?.address || "Plot 14, 100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038",
      gstin: activeTemplate?.gstin || "29AKLPP4821M1Z6",
      pan: activeTemplate?.pan || "AAKLP4821M",
      header: "#1d4ed8",
      accent: "#2563eb",
      logo: activeTemplate?.logo || null,
      logoName: activeTemplate?.logoName || "logo.png",
      footer:
        "Bank: HDFC Bank - A/c 50200012345670 - IFSC HDFC0000123\nPayment terms: Due on 5th of every month.",
      isDefault: false,
    });
    setIsModalOpen(true);
  }

  // Open Modal to Customize / Edit Current Template
  function handleOpenEditModal() {
    setModalMode("edit");
    if (activeTemplate) {
      setFormData({
        id: activeTemplate.id,
        name: activeTemplate.name || "",
        layoutStyle: activeTemplate.layoutStyle || "wave",
        businessName: activeTemplate.businessName || "Sri Lakshmi Properties & Estates",
        address: activeTemplate.address || "Plot 14, 100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038",
        gstin: activeTemplate.gstin || "29AKLPP4821M1Z6",
        pan: activeTemplate.pan || "AAKLP4821M",
        header: activeTemplate.header || "#1d4ed8",
        accent: activeTemplate.accent || "#2563eb",
        logo: activeTemplate.logo || null,
        logoName: activeTemplate.logoName || "logo.png",
        footer: activeTemplate.footer || "",
        isDefault: Boolean(activeTemplate.isDefault),
      });
    }
    setIsModalOpen(true);
  }

  function handleCloseModal() {
    setIsModalOpen(false);
  }

  // Handle Logo Upload with 1MB size check
  function handleLogoFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(png|jpeg|jpg)$/)) {
      showMessage?.("Please select a valid PNG or JPG image file.");
      return;
    }

    if (file.size > 1024 * 1024) {
      showMessage?.("Logo file is too large. Maximum size allowed is 1MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({
        ...prev,
        logo: reader.result,
        logoName: `${file.name} (${Math.round(file.size / 1024)} KB)`,
      }));
      showMessage?.(`Uploaded logo "${file.name}"`);
    };
    reader.readAsDataURL(file);
  }

  // Apply a 1-click color preset
  function handleApplyPreset(preset) {
    setFormData((prev) => ({
      ...prev,
      header: preset.header,
      accent: preset.accent,
    }));
  }

  // Change layout style
  function handleSelectLayout(layoutId) {
    setFormData((prev) => ({
      ...prev,
      layoutStyle: layoutId,
    }));
  }

  // Submit Modal Form (Saves to database!)
  function handleFormSubmit(e) {
    e.preventDefault();
    if (!formData.name.trim()) {
      showMessage?.("Please enter a template name.");
      return;
    }

    onSave?.(formData, modalMode === "create");
    setIsModalOpen(false);
    showMessage?.(`✓ Template "${formData.name}" saved to database successfully!`);
  }

  // Download PDF / Print
  function handleDownloadPdf() {
    window.print();
  }

  // Bulk ZIP Download
  async function handleBulkZipDownload() {
    setIsZipping(true);
    showMessage?.("Generating bulk ZIP archive of landlord invoices...");

    try {
      const zip = new JSZip();
      const folderName = `Invoices_${(activeTemplate.businessName || "Landlord").replace(/\s+/g, "_")}`;
      const folder = zip.folder(folderName);

      const sampleTenants = [
        { invNo: "SLP/26-27/0011", unit: "Unit 301", tenant: "Brightpath Software Pvt Ltd", rent: 85000, maint: 6500 },
        { invNo: "SLP/26-27/0012", unit: "Unit 302", tenant: "Nexa Infotech Solutions", rent: 92000, maint: 7000 },
        { invNo: "SLP/26-27/0013", unit: "Unit 401", tenant: "CloudScale Labs India", rent: 110000, maint: 8500 },
      ];

      sampleTenants.forEach((item) => {
        const taxable = item.rent + item.maint;
        const cgst = taxable * 0.09;
        const sgst = taxable * 0.09;
        const total = taxable + cgst + sgst;

        const invHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${item.invNo} - ${item.tenant}</title>
  <style>
    body { font-family: sans-serif; background: #f8fafc; padding: 20px; }
    .card { max-width: 800px; margin: 0 auto; background: #fff; padding: 24px; border-radius: 8px; border: 1px solid #cbd5e1; }
    .header { background: ${activeTemplate.header}; color: #fff; padding: 20px; border-radius: 6px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: left; }
    .total { font-size: 18px; font-weight: bold; color: ${activeTemplate.accent}; text-align: right; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h2>${activeTemplate.businessName}</h2>
      <div>${activeTemplate.address}</div>
      <div>GSTIN: ${activeTemplate.gstin} | PAN: ${activeTemplate.pan}</div>
    </div>
    <div style="margin-top: 15px;">
      <p><strong>INVOICE NO:</strong> ${item.invNo} | <strong>DATE:</strong> 01 Sep 2026</p>
      <p><strong>TENANT:</strong> ${item.tenant} (${item.unit})</p>
    </div>
    <table>
      <thead><tr><th>Description</th><th>Amount</th></tr></thead>
      <tbody>
        <tr><td>Monthly Rent - September 2026</td><td>₹${item.rent.toLocaleString()}</td></tr>
        <tr><td>Maintenance Charges</td><td>₹${item.maint.toLocaleString()}</td></tr>
        <tr><td>CGST (9%)</td><td>₹${cgst.toLocaleString()}</td></tr>
        <tr><td>SGST (9%)</td><td>₹${sgst.toLocaleString()}</td></tr>
      </tbody>
    </table>
    <div style="margin-top: 20px;" class="total">Total Payable: ₹${total.toLocaleString()}</div>
    <p style="margin-top: 30px; font-size: 12px; color: #64748b;">${activeTemplate.footer}</p>
  </div>
</body>
</html>`;
        folder.file(`${item.invNo.replace(/\//g, "-")}_${item.tenant.replace(/\s+/g, "_")}.html`, invHtml);
      });

      folder.file(
        "Summary_Register.txt",
        `Landlord: ${activeTemplate.businessName}\nGSTIN: ${activeTemplate.gstin}\nTemplate: ${activeTemplate.name} (${activeTemplate.layoutStyle})\nTotal Invoices Generated: 3\nExport Date: ${new Date().toLocaleString()}\n`
      );

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Bulk_Invoices_${activeTemplate.businessName.replace(/\s+/g, "_")}.zip`;
      link.click();
      URL.revokeObjectURL(url);

      showMessage?.("✓ Bulk ZIP Download completed successfully!");
    } catch (err) {
      console.error(err);
      showMessage?.("Failed to generate bulk ZIP: " + err.message);
    } finally {
      setIsZipping(false);
    }
  }

  // Active rendering data
  const currentLayout = activeTemplate.layoutStyle || "wave";
  const currentHeader = activeTemplate.header || "#1d4ed8";
  const currentAccent = activeTemplate.accent || "#2563eb";

  return (
    <div className="template-editor-page">
      {/* Breadcrumbs */}
      <div className="mentor-breadcrumbs no-print">
        <span className="breadcrumb-parent">Billing</span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">Invoice Templates</span>
      </div>

      {/* CLEAN 2-COLUMN LAYOUT: TEMPLATES LIST (LEFT) + FULL PREVIEW (RIGHT) */}
      <div className="mentor-2col-layout">
        {/* =========================================================================
            COLUMN 1: TEMPLATES LIST (WITH "+ NEW TEMPLATE" BUTTON)
            ========================================================================= */}
        <div className="col-templates-list no-print">
          <div className="col-header-title">Templates ({templates.length})</div>

          <div className="template-items-wrap">
            {templates.map((tpl) => {
              const isSelected = tpl.id === selectedTemplateId;
              return (
                <div
                  key={tpl.id}
                  className={`template-tab-item ${isSelected ? "selected" : ""}`}
                  onClick={() => setSelectedTemplateId(tpl.id)}
                >
                  <div className="template-tab-meta">
                    <span className="template-tab-name">{tpl.name}</span>
                    <span className="template-layout-tag">
                      {tpl.layoutStyle || "wave"}
                    </span>
                  </div>
                  <div className="template-tab-badges">
                    <div
                      className="template-color-dot"
                      style={{ backgroundColor: tpl.header || "#1d4ed8" }}
                    />
                    {tpl.isDefault && <span className="template-default-indicator">●</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* "+ New template" Button: OPENS THE TEMPLATE & COLOR OPTION MODAL! */}
          <button
            type="button"
            className="btn-new-template-link"
            onClick={handleOpenCreateModal}
          >
            <Plus size={16} /> New template
          </button>
        </div>

        {/* =========================================================================
            COLUMN 2: LIVE PREVIEW & SINGLE CLEAN ACTION TOOLBAR
            ========================================================================= */}
        <div className="col-preview-card">
          <div className="preview-single-toolbar no-print">
            <div className="preview-toolbar-left">
              <span className="preview-template-name-title">{activeTemplate.name}</span>
              <span className="preview-style-badge">
                {currentLayout} style
              </span>
            </div>

            <div className="preview-toolbar-actions">
              {/* Customize / Edit Button: OPENS THE MODAL TO EDIT THIS TEMPLATE! */}
              <button
                type="button"
                className="btn-action-customize"
                onClick={handleOpenEditModal}
                title="Customize template layout, colors & details"
              >
                <Edit3 size={15} /> Customize
              </button>

              {/* Clean Download PDF Button */}
              <button
                type="button"
                className="btn-action-primary"
                onClick={handleDownloadPdf}
                title="Download or Print PDF"
              >
                <Download size={15} /> Download PDF
              </button>

              {/* Print Button */}
              <button
                type="button"
                className="btn-action-secondary"
                onClick={handleDownloadPdf}
                title="Print active invoice"
              >
                <Printer size={15} /> Print
              </button>

              {/* Bulk ZIP Button */}
              <button
                type="button"
                className="btn-action-zip"
                onClick={handleBulkZipDownload}
                disabled={isZipping}
                title="Download all tenant invoices in ZIP package"
              >
                <Archive size={15} /> {isZipping ? "Packing ZIP..." : "Bulk ZIP"}
              </button>
            </div>
          </div>

          {/* PRINTABLE A4 INVOICE SHEET (DYNAMIC 5 LAYOUT RENDERING) */}
          <div
            id="invoice-printable-sheet"
            className={`mentor-tax-invoice-paper layout-${currentLayout}`}
          >
            {/* -------------------------------------------------------------
                LAYOUT 1: MODERN WAVE (CANVA STYLE)
                ------------------------------------------------------------- */}
            {currentLayout === "wave" && (
              <div
                className="wave-header-wrap"
                style={{
                  backgroundColor: currentHeader,
                  background: `linear-gradient(135deg, ${currentHeader} 0%, ${currentAccent} 100%)`,
                }}
              >
                <div className="wave-header-content">
                  <div className="wave-brand-box">
                    <div className="wave-logo-circle" style={{ color: currentHeader }}>
                      {activeTemplate.logo ? (
                        <img src={activeTemplate.logo} alt="Logo" />
                      ) : (
                        <span>{(activeTemplate.businessName || "SL")[0]}</span>
                      )}
                    </div>
                    <div>
                      <h2 className="wave-title">{activeTemplate.businessName}</h2>
                      <div className="wave-subtitle">{activeTemplate.address}</div>
                    </div>
                  </div>

                  <div className="wave-meta-box">
                    <div className="wave-tax-badge">TAX INVOICE</div>
                    <div className="wave-invoice-num">SLP/26-27/0011</div>
                    <div className="wave-tax-ids">
                      GSTIN: {activeTemplate.gstin} · PAN: {activeTemplate.pan}
                    </div>
                  </div>
                </div>

                <svg className="wave-svg-curve" viewBox="0 0 500 40" preserveAspectRatio="none">
                  <path d="M0,0 C150,45 350,-20 500,25 L500,40 L0,40 Z" />
                </svg>
              </div>
            )}

            {/* -------------------------------------------------------------
                LAYOUT 2: CLEAN MINIMALIST (EXECUTIVE)
                ------------------------------------------------------------- */}
            {currentLayout === "minimal" && (
              <div className="minimal-header-wrap">
                <div className="minimal-top-row">
                  <div>
                    <div className="minimal-huge-title" style={{ color: currentHeader }}>
                      INVOICE
                    </div>
                    <div style={{ fontWeight: 700, fontSize: "16px", color: "#1e293b", marginTop: "4px" }}>
                      {activeTemplate.businessName}
                    </div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>{activeTemplate.address}</div>
                    <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "2px" }}>
                      GSTIN: <strong>{activeTemplate.gstin}</strong> | PAN: <strong>{activeTemplate.pan}</strong>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        width: "56px",
                        height: "56px",
                        borderRadius: "8px",
                        border: `2px solid ${currentAccent}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "22px",
                        fontWeight: 800,
                        color: currentAccent,
                        marginLeft: "auto",
                        marginBottom: "6px",
                        overflow: "hidden",
                      }}
                    >
                      {activeTemplate.logo ? (
                        <img src={activeTemplate.logo} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                      ) : (
                        <span>{(activeTemplate.businessName || "SL")[0]}</span>
                      )}
                    </div>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "2px 8px",
                        background: "#eff6ff",
                        color: currentAccent,
                        borderRadius: "4px",
                        fontWeight: 700,
                        fontSize: "11px",
                      }}
                    >
                      ORIGINAL FOR RECIPIENT
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    height: "3px",
                    background: `linear-gradient(to right, ${currentHeader}, ${currentAccent}, transparent)`,
                    margin: "12px 0 16px",
                  }}
                />

                <div className="minimal-meta-grid">
                  <div className="minimal-meta-item">
                    <label>Invoice Number</label>
                    <span style={{ color: currentAccent }}>SLP/26-27/0011</span>
                  </div>
                  <div className="minimal-meta-item">
                    <label>Invoice Date</label>
                    <span>01 Sep 2026</span>
                  </div>
                  <div className="minimal-meta-item">
                    <label>Payment Due</label>
                    <span>05 Sep 2026</span>
                  </div>
                </div>
              </div>
            )}

            {/* -------------------------------------------------------------
                LAYOUT 3: CLASSIC CORPORATE (BOXED GRID)
                ------------------------------------------------------------- */}
            {currentLayout === "classic" && (
              <>
                <div className="classic-header-band" style={{ backgroundColor: currentHeader }}>
                  <div>
                    <div className="classic-title">TAX INVOICE</div>
                    <div style={{ fontSize: "11.5px", opacity: 0.9 }}>
                      (Issued under Rule 46 of CGST Rules, 2017)
                    </div>
                  </div>
                  <div className="classic-stamp-text">ORIGINAL FOR RECIPIENT</div>
                </div>

                <div className="classic-boxed-grid">
                  <div className="classic-box-cell">
                    <div style={{ fontSize: "11px", fontWeight: 700, color: currentAccent, textTransform: "uppercase" }}>
                      LANDLORD / ISSUER
                    </div>
                    <div style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a", marginTop: "2px" }}>
                      {activeTemplate.businessName}
                    </div>
                    <div style={{ fontSize: "11.5px", color: "#475569" }}>{activeTemplate.address}</div>
                    <div style={{ fontSize: "11.5px", color: "#0f172a", marginTop: "4px" }}>
                      <strong>GSTIN:</strong> {activeTemplate.gstin} | <strong>PAN:</strong> {activeTemplate.pan}
                    </div>
                  </div>

                  <div className="classic-box-cell" style={{ background: "#f8fafc" }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                      INVOICE REFERENCE
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginTop: "4px", fontSize: "12px" }}>
                      <div><strong>Invoice #:</strong> SLP/26-27/0011</div>
                      <div><strong>Date:</strong> 01 Sep 2026</div>
                      <div><strong>Due Date:</strong> 05 Sep 2026</div>
                      <div><strong>State Code:</strong> 29 (KA)</div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* -------------------------------------------------------------
                LAYOUT 4: SPLIT SIDEBAR (VERTICAL ACCENT PILLAR)
                ------------------------------------------------------------- */}
            {currentLayout === "split" && (
              <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0" }}>
                <div
                  style={{
                    width: "12px",
                    background: `linear-gradient(to bottom, ${currentHeader}, ${currentAccent})`,
                    flexShrink: 0,
                  }}
                />

                <div style={{ flex: 1, padding: "20px 24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                      <div
                        style={{
                          width: "44px",
                          height: "44px",
                          borderRadius: "8px",
                          background: currentHeader,
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 800,
                          fontSize: "18px",
                          overflow: "hidden",
                        }}
                      >
                        {activeTemplate.logo ? (
                          <img src={activeTemplate.logo} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                        ) : (
                          <span>{(activeTemplate.businessName || "SL")[0]}</span>
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>
                          {activeTemplate.businessName}
                        </div>
                        <div style={{ fontSize: "11.5px", color: "#64748b" }}>{activeTemplate.address}</div>
                        <div style={{ fontSize: "11px", color: "#334155" }}>
                          GSTIN: {activeTemplate.gstin} · PAN: {activeTemplate.pan}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 10px",
                          borderRadius: "20px",
                          background: currentAccent,
                          color: "#ffffff",
                          fontSize: "11.5px",
                          fontWeight: 700,
                          letterSpacing: "0.5px",
                        }}
                      >
                        RENTAL INVOICE
                      </span>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", marginTop: "4px" }}>
                        # SLP/26-27/0011
                      </div>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>Date: 01 Sep 2026</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* -------------------------------------------------------------
                LAYOUT 5: PREMIUM ELEGANT (LUXURY GOLD & SIGNATURE)
                ------------------------------------------------------------- */}
            {currentLayout === "premium" && (
              <div className="premium-header-wrap" style={{ borderColor: currentAccent }}>
                <div className="premium-watermark">AUTHENTIC</div>
                <div className="premium-ornate-badge" style={{ color: currentAccent }}>
                  ✦ OFFICIAL TAX INVOICE ✦
                </div>
                <h1 style={{ fontSize: "22px", fontWeight: 800, color: currentHeader, margin: "2px 0 4px", letterSpacing: "1px" }}>
                  {activeTemplate.businessName}
                </h1>
                <div style={{ fontSize: "12px", color: "#64748b", maxWidth: "420px", margin: "0 auto" }}>
                  {activeTemplate.address}
                </div>
                <div style={{ fontSize: "11.5px", fontWeight: 600, color: "#475569", marginTop: "4px" }}>
                  GSTIN: {activeTemplate.gstin} · PAN: {activeTemplate.pan}
                </div>
                <div
                  style={{
                    display: "inline-flex",
                    gap: "16px",
                    marginTop: "10px",
                    padding: "4px 16px",
                    borderRadius: "20px",
                    background: "#ffffff",
                    border: `1px solid ${currentAccent}`,
                    fontSize: "11.5px",
                    fontWeight: 600,
                  }}
                >
                  <span>Invoice: <strong>SLP/26-27/0011</strong></span>
                  <span>•</span>
                  <span>Date: <strong>01 Sep 2026</strong></span>
                  <span>•</span>
                  <span>Due: <strong>05 Sep 2026</strong></span>
                </div>
              </div>
            )}

            {/* =============================================================
                COMMON BODY: PARTIES, ITEMS TABLE & TOTALS
                ============================================================= */}
            <div className="paper-body">
              <div className="parties-row">
                <div className="party-col">
                  <span className="section-small-title" style={{ color: currentAccent }}>
                    BILLED TO (TENANT)
                  </span>
                  <div className="party-name-strong">Brightpath Software Pvt Ltd</div>
                  <div className="party-line">Tower B, Indiranagar, Bengaluru, KA 560038</div>
                  <div className="party-line">GSTIN: 29ADBC6734Q1ZK</div>
                  <div className="party-line">Contact: billing@brightpath.io</div>
                </div>

                <div className="party-col">
                  <span className="section-small-title" style={{ color: currentAccent }}>
                    PROPERTY & LEASE DETAILS
                  </span>
                  <div className="party-name-strong">Lakshmi Towers · Commercial Unit 301</div>
                  <div className="party-line">Billing Period: September 2026</div>
                  <div className="party-line">Place of Supply: Karnataka (Code 29)</div>
                  <div className="party-line">Reverse Charge: No</div>
                </div>
              </div>

              {/* Items Table */}
              <table className="mentor-items-table">
                <thead>
                  <tr style={{ borderBottom: `2px solid ${currentAccent}` }}>
                    <th style={{ width: "24px" }}>#</th>
                    <th>DESCRIPTION</th>
                    <th style={{ width: "80px", textAlign: "center" }}>SAC</th>
                    <th style={{ width: "110px", textAlign: "right" }}>AMOUNT (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>1</td>
                    <td>
                      <strong>Monthly Rent - Commercial Unit 301</strong>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>
                        Rental fee for period 01 Sep 2026 to 30 Sep 2026
                      </div>
                    </td>
                    <td style={{ textAlign: "center" }}>997212</td>
                    <td className="col-amount">{money(85000)}</td>
                  </tr>
                  <tr>
                    <td>2</td>
                    <td>
                      <strong>Common Area Maintenance (CAM)</strong>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>
                        Power backup, security, and facility management
                      </div>
                    </td>
                    <td style={{ textAlign: "center" }}>997212</td>
                    <td className="col-amount">{money(6500)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Totals Section */}
              <div className="totals-section">
                <div className="tax-summary-rows">
                  <div className="tax-row">
                    <span>Taxable Amount</span>
                    <span>{money(91500)}</span>
                  </div>
                  <div className="tax-row">
                    <span>CGST (9%)</span>
                    <span>{money(8235)}</span>
                  </div>
                  <div className="tax-row">
                    <span>SGST (9%)</span>
                    <span>{money(8235)}</span>
                  </div>
                </div>

                <div
                  className="total-payable-callout"
                  style={{
                    borderLeftColor: currentAccent,
                    backgroundColor: `${currentAccent}0d`,
                  }}
                >
                  <span className="total-label">Total Payable</span>
                  <span className="total-val" style={{ color: currentAccent }}>
                    {money(107970)}
                  </span>
                </div>

                <div className="amount-in-words">
                  Amount in words: <strong>Rupees One Lakh Seven Thousand Nine Hundred Seventy Only</strong>
                </div>
              </div>

              {/* Payment Details & Signatory Footer */}
              <div className="paper-footer-section">
                <div className="payment-details-col">
                  <span className="footer-small-title" style={{ color: currentAccent }}>
                    PAYMENT TERMS & BANK DETAILS
                  </span>
                  <div className="terms-note">
                    {activeTemplate.footer ||
                      "Bank: HDFC Bank - A/c 50200012345670 - IFSC HDFC0000123\nPlease pay within 7 days of invoice date."}
                  </div>
                </div>

                <div className="signatory-col">
                  <div className="for-company-title">
                    For {activeTemplate.businessName || "Landlord"}
                  </div>
                  <div className="signatory-cursive">John Smith</div>
                  <div className="signatory-line" style={{ backgroundColor: currentAccent }} />
                  <div className="signatory-label">Authorized Signatory</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          POPUP MODAL: TEMPLATE DESIGN & COLOUR OPTIONS (OPENS ON "+ NEW TEMPLATE")
          ========================================================================= */}
      {isModalOpen && (
        <div className="template-modal-overlay no-print" onClick={handleCloseModal}>
          <div className="template-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="template-modal-header">
              <div className="template-modal-title">
                {modalMode === "create" ? "Create New Invoice Template" : `Customize: ${formData.name}`}
              </div>
              <button type="button" className="btn-close-modal" onClick={handleCloseModal}>
                <X size={18} />
              </button>
            </div>

            <div className="template-modal-body">
              {/* 1. SELECT TEMPLATE DESIGN (5 LAYOUTS) */}
              <div className="layout-selector-section">
                <div className="layout-selector-title">
                  <span>1. Template Design</span>
                  <span style={{ fontSize: "11px", color: "#2563eb", fontWeight: 600 }}>5 Styles</span>
                </div>

                <div className="layout-chips-grid">
                  {TEMPLATE_LAYOUTS.map((layout) => {
                    const isActive = formData.layoutStyle === layout.id;
                    return (
                      <button
                        key={layout.id}
                        type="button"
                        className={`layout-chip-btn ${isActive ? "active" : ""}`}
                        onClick={() => handleSelectLayout(layout.id)}
                      >
                        <span className="layout-chip-icon">{layout.icon}</span>
                        <div>
                          <div>{layout.name}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. COLOR OPTIONS */}
              <div className="color-option-section">
                <div className="color-option-title">
                  <span>2. Color Palette</span>
                  <span style={{ fontSize: "11px", color: formData.accent, fontWeight: 700 }}>
                    {formData.header.toUpperCase()}
                  </span>
                </div>

                {/* 8 Color Presets */}
                <div className="preset-palettes-wrap">
                  {COLOR_PRESETS.map((preset) => {
                    const isActive =
                      formData.header.toLowerCase() === preset.header.toLowerCase() &&
                      formData.accent.toLowerCase() === preset.accent.toLowerCase();
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        className={`preset-palette-btn ${isActive ? "active" : ""}`}
                        onClick={() => handleApplyPreset(preset)}
                      >
                        <div className="palette-bars">
                          <div className="palette-primary" style={{ backgroundColor: preset.header }} />
                          <div className="palette-accent" style={{ backgroundColor: preset.accent }} />
                        </div>
                        <span className="palette-label">{preset.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Pickers */}
                <div className="custom-color-controls">
                  <div className="custom-color-box">
                    <label className="custom-color-label">Header / Primary Color</label>
                    <div className="color-input-row">
                      <input
                        type="color"
                        className="custom-picker-well"
                        value={formData.header}
                        onChange={(e) => setFormData({ ...formData, header: e.target.value })}
                      />
                      <input
                        type="text"
                        className="custom-hex-input"
                        value={formData.header}
                        onChange={(e) => setFormData({ ...formData, header: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="custom-color-box">
                    <label className="custom-color-label">Accent / Highlight Color</label>
                    <div className="color-input-row">
                      <input
                        type="color"
                        className="custom-picker-well"
                        value={formData.accent}
                        onChange={(e) => setFormData({ ...formData, accent: e.target.value })}
                      />
                      <input
                        type="text"
                        className="custom-hex-input"
                        value={formData.accent}
                        onChange={(e) => setFormData({ ...formData, accent: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. TEMPLATE & BUSINESS FORM */}
              <form onSubmit={handleFormSubmit} className="mentor-edit-form">
                <div className="mentor-form-group">
                  <label className="mentor-label">Template Name</label>
                  <input
                    type="text"
                    required
                    className="mentor-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="mentor-form-group">
                  <label className="mentor-label">
                   Name on Invoice</label>
                  <input
                    type="text"
                    required
                    className="mentor-input"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  />
                </div>

                {/* Landlord Logo */}
                <div className="mentor-form-group">
                  <label className="mentor-label">Landlord Logo</label>
                  <div className="mentor-logo-box">
                    <div className="mentor-logo-left">
                      <div
                        className="mentor-logo-badge"
                        style={{ backgroundColor: formData.header || "#1d4ed8" }}
                      >
                        {formData.logo ? (
                          <img src={formData.logo} alt="Logo" className="mentor-logo-img" />
                        ) : (
                          <span>{(formData.businessName || "SL")[0]}</span>
                        )}
                      </div>
                      <div>
                        <div className="mentor-logo-filename">
                          {formData.logoName || "company-logo.png"}
                        </div>
                        <div className="mentor-logo-hint">PNG, JPG up to 1MB</div>
                      </div>
                    </div>

                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: "none" }}
                      accept="image/png, image/jpeg, image/jpg"
                      onChange={handleLogoFileChange}
                    />

                    <button
                      type="button"
                      className="btn-replace-logo"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Replace
                    </button>
                  </div>
                </div>

                {/* Payment Terms & Bank Details */}
                <div className="mentor-form-group">
                  <label className="mentor-label">Footer Text & Bank Details</label>
                  <textarea
                    className="mentor-textarea"
                    value={formData.footer}
                    onChange={(e) => setFormData({ ...formData, footer: e.target.value })}
                    placeholder="Bank name, IFSC, payment terms, or notes..."
                  />
                </div>

                <div className="mentor-checkbox-row">
                  <input
                    type="checkbox"
                    id="modal-default-toggle"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  />
                  <label htmlFor="modal-default-toggle" className="mentor-checkbox-label">
                    Set as Default Template
                  </label>
                </div>

                <div className="mentor-form-actions">
                  <button type="button" className="btn-mentor-cancel" onClick={handleCloseModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-mentor-save">
                    Save to Database
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
