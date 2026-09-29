import React from 'react';

function money(val) {
  return `₹${Number(val || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function numberToIndianWords(num) {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  if ((num = num.toString()).length > 9) return 'Overflow';
  const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return ''; 
  let str = '';
  str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
  str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
  str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
  str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
  str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
  return str.trim() + ' Only';
}

export default function InvoiceTemplateRenderer({ invoice, template }) {
  const currentLayout = template?.layoutStyle || "wave";
  const currentHeader = template?.header || "#1d4ed8";
  const currentAccent = template?.accent || "#2563eb";
  
  const landlordName = invoice?.landlord_name || (invoice ? '' : template?.businessName || '');
  const landlordAddress = invoice?.landlord_address || (invoice ? '' : template?.address || '');
  const landlordGstin = invoice?.landlord_gstin || (invoice ? 'N/A' : template?.gstin || 'N/A');
  const landlordPan = invoice?.landlord_pan || (invoice ? 'N/A' : template?.pan || 'N/A');
    const landlordPhone = invoice?.landlord_phone || '';
    const landlordEmail = invoice?.landlord_email || '';
  
  const invNumber = invoice?.invoice_number || '';
  const invDate = invoice?.invoice_date || '';
  const dueDate = invoice?.due_date || invDate; 
  const billingPeriod = invoice?.billing_period || '';
  
  const tenantName = invoice?.tenant_name || 'Unassigned Tenant';
  const tenantAddress = invoice?.tenant_address || 'N/A';
  const tenantGstin = invoice?.tenant_gstin || 'N/A';
  
  const propertyName = invoice?.property_name || '';
  const propertyAddress = invoice?.property_address || '';
  
  const rent = parseFloat(invoice?.rent_amount || 0);
  const maint = parseFloat(invoice?.maintenance_charges || 0);
  const parking = parseFloat(invoice?.parking_charges || 0);
  const additional = parseFloat(invoice?.additional_charges || 0);
  
  const taxable = rent + maint + parking + additional;
  
  const gstRate = parseFloat(invoice?.gst_rate || 0);
  const isInterState = invoice?.tax_supply_type === 'inter_state';
  
  const cgst = isInterState ? 0 : parseFloat(invoice?.cgst_amount || 0);
  const sgst = isInterState ? 0 : parseFloat(invoice?.sgst_amount || 0);
  const igst = isInterState ? parseFloat(invoice?.igst_amount || 0) : 0;
  
  const total = taxable + cgst + sgst + igst;
  const totalWords = numberToIndianWords(Math.round(total));

  return (
    <div className={`mentor-tax-invoice-paper layout-${currentLayout}`} style={{ margin: 0, padding: 0 }}>
       {/* LAYOUT 1: MODERN WAVE */}
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
                 {template?.logo ? (
                   <img src={template.logo} alt="Logo" />
                 ) : (
                   <span>{(landlordName || "L")[0]}</span>
                 )}
               </div>
               <div>
                 <h2 className="wave-title">{landlordName}</h2>
                 <div className="wave-subtitle">{landlordAddress}</div>
               </div>
             </div>

             <div className="wave-meta-box">
               <div className="wave-tax-badge">TAX INVOICE</div>
               <div className="wave-invoice-num">{invNumber}</div>
               <div className="wave-tax-ids">
                 GSTIN: {landlordGstin} · PAN: {landlordPan}
               </div>
             </div>
           </div>

           <svg className="wave-svg-curve" viewBox="0 0 500 40" preserveAspectRatio="none">
             <path d="M0,0 C150,45 350,-20 500,25 L500,40 L0,40 Z" />
           </svg>
         </div>
       )}

       {/* LAYOUT 2: CLEAN MINIMALIST */}
       {currentLayout === "minimal" && (
         <div className="minimal-header-wrap">
           <div className="minimal-top-row">
             <div>
               <div className="minimal-huge-title" style={{ color: currentHeader }}>
                 INVOICE
               </div>
               <div style={{ fontWeight: 700, fontSize: "16px", color: "#1e293b", marginTop: "4px" }}>
                 {landlordName}
               </div>
               <div style={{ fontSize: "12px", color: "#64748b" }}>{landlordAddress}</div>
               <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "2px" }}>
                 GSTIN: <strong>{landlordGstin}</strong> | PAN: <strong>{landlordPan}</strong>
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
                 {template?.logo ? (
                   <img src={template.logo} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                 ) : (
                   <span>{(landlordName || "L")[0]}</span>
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
               <span style={{ color: currentAccent }}>{invNumber}</span>
             </div>
             <div className="minimal-meta-item">
               <label>Invoice Date</label>
               <span>{invDate}</span>
             </div>
             <div className="minimal-meta-item">
               <label>Payment Due</label>
               <span>{dueDate}</span>
             </div>
           </div>
         </div>
       )}

       {/* LAYOUT 3: CLASSIC CORPORATE */}
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
                 {landlordName}
               </div>
               <div style={{ fontSize: "11.5px", color: "#475569" }}>{landlordAddress}</div>
               <div style={{ fontSize: "11.5px", color: "#0f172a", marginTop: "4px" }}>
                 <strong>GSTIN:</strong> {landlordGstin} | <strong>PAN:</strong> {landlordPan}
               </div>
             </div>

             <div className="classic-box-cell" style={{ background: "#f8fafc" }}>
               <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                 INVOICE REFERENCE
               </div>
               <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginTop: "4px", fontSize: "12px" }}>
                 <div><strong>Invoice #:</strong> {invNumber}</div>
                 <div><strong>Date:</strong> {invDate}</div>
                 <div><strong>Due Date:</strong> {dueDate}</div>
                 <div><strong>State Code:</strong> 29 (KA)</div>
               </div>
             </div>
           </div>
         </>
       )}

       {/* LAYOUT 4: SPLIT SIDEBAR */}
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
                   {template?.logo ? (
                     <img src={template.logo} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                   ) : (
                     <span>{(landlordName || "L")[0]}</span>
                   )}
                 </div>
                 <div>
                   <div style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>
                     {landlordName}
                   </div>
                   <div style={{ fontSize: "11.5px", color: "#64748b" }}>{landlordAddress}</div>
                   <div style={{ fontSize: "11px", color: "#334155" }}>
                     GSTIN: {landlordGstin} · PAN: {landlordPan}
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
                   # {invNumber}
                 </div>
                 <div style={{ fontSize: "11px", color: "#64748b" }}>Date: {invDate}</div>
               </div>
             </div>
           </div>
         </div>
       )}

       {/* LAYOUT 5: PREMIUM ELEGANT */}
       {currentLayout === "premium" && (
         <div className="premium-header-wrap" style={{ borderColor: currentAccent }}>
           <div className="premium-watermark">AUTHENTIC</div>
           <div className="premium-ornate-badge" style={{ color: currentAccent }}>
             ✦ OFFICIAL TAX INVOICE ✦
           </div>
           <h1 style={{ fontSize: "22px", fontWeight: 800, color: currentHeader, margin: "2px 0 4px", letterSpacing: "1px" }}>
             {landlordName}
           </h1>
           <div style={{ fontSize: "12px", color: "#64748b", maxWidth: "420px", margin: "0 auto" }}>
             {landlordAddress}
           </div>
           <div style={{ fontSize: "11.5px", fontWeight: 600, color: "#475569", marginTop: "4px" }}>
             GSTIN: {landlordGstin} · PAN: {landlordPan}
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
             <span>Invoice: <strong>{invNumber}</strong></span>
             <span>•</span>
             <span>Date: <strong>{invDate}</strong></span>
             <span>•</span>
             <span>Due: <strong>{dueDate}</strong></span>
           </div>
         </div>
       )}

       {/* COMMON BODY */}
       <div className="paper-body">
         <div className="parties-row">
           <div className="party-col">
             <span className="section-small-title" style={{ color: currentAccent }}>
               BILLED TO (TENANT)
             </span>
             <div className="party-name-strong">{tenantName}</div>
             <div className="party-line">{tenantAddress}</div>
             {tenantGstin && tenantGstin !== 'N/A' && <div className="party-line">GSTIN: {tenantGstin}</div>}
           </div>

           <div className="party-col">
             <span className="section-small-title" style={{ color: currentAccent }}>
               PROPERTY & LEASE DETAILS
             </span>
             <div className="party-name-strong">{propertyName}</div>
             <div className="party-line">{propertyAddress}</div>
             <div className="party-line">Billing Period: {billingPeriod}</div>
           </div>
         </div>

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
             {rent > 0 && (
               <tr>
                 <td>1</td>
                 <td>
                   <strong>Monthly Rent - {propertyName}</strong>
                   <div style={{ fontSize: "11px", color: "#64748b" }}>
                     Rental fee for period {billingPeriod}
                   </div>
                 </td>
                 <td style={{ textAlign: "center" }}>997212</td>
                 <td className="col-amount">{money(rent)}</td>
               </tr>
             )}
             {maint > 0 && (
               <tr>
                 <td>{rent > 0 ? 2 : 1}</td>
                 <td>
                   <strong>Common Area Maintenance (CAM)</strong>
                 </td>
                 <td style={{ textAlign: "center" }}>997212</td>
                 <td className="col-amount">{money(maint)}</td>
               </tr>
             )}
             {parking > 0 && (
               <tr>
                 <td>{(rent > 0 ? 1 : 0) + (maint > 0 ? 1 : 0) + 1}</td>
                 <td>
                   <strong>Parking Charges</strong>
                 </td>
                 <td style={{ textAlign: "center" }}>997212</td>
                 <td className="col-amount">{money(parking)}</td>
               </tr>
             )}
           </tbody>
         </table>

         <div className="totals-section">
           <div className="tax-summary-rows">
             <div className="tax-row">
               <span>Taxable Amount</span>
               <span>{money(taxable)}</span>
             </div>
             {!isInterState && cgst > 0 && (
               <div className="tax-row">
                 <span>CGST ({gstRate/2}%)</span>
                 <span>{money(cgst)}</span>
               </div>
             )}
             {!isInterState && sgst > 0 && (
               <div className="tax-row">
                 <span>SGST ({gstRate/2}%)</span>
                 <span>{money(sgst)}</span>
               </div>
             )}
             {isInterState && igst > 0 && (
               <div className="tax-row">
                 <span>IGST ({gstRate}%)</span>
                 <span>{money(igst)}</span>
               </div>
             )}
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
               {money(total)}
             </span>
           </div>

           <div className="amount-in-words">
             Amount in words: <strong>Rupees {totalWords}</strong>
           </div>
         </div>

         <div className="paper-footer-section">
           <div className="payment-details-col">
             <span className="footer-small-title" style={{ color: currentAccent }}>
               PAYMENT TERMS & BANK DETAILS
             </span>
             <div className="terms-note" style={{ whiteSpace: "pre-line" }}>
               {template?.footer ||
                 "Bank: HDFC Bank - A/c 50200012345670 - IFSC HDFC0000123\nPlease pay within 7 days of invoice date."}
             </div>
           </div>

           <div className="signatory-col">
             <div className="for-company-title">
               For {landlordName}
             </div>
             <div className="signatory-cursive">{landlordName ? landlordName.split(' ')[0] : 'Landlord'}</div>
             <div className="signatory-line" style={{ backgroundColor: currentAccent }} />
             <div className="signatory-label">Authorized Signatory</div>
           </div>
         </div>
       </div>
    </div>
  );
}
