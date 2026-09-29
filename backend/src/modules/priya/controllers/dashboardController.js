const dbAdapter = require('../../../config/dbAdapter');

/**
 * GET /api/priya/dashboard/admin
 * Admin-only comprehensive system analytics, summary cards, and charts data.
 */
const getAdminDashboard = async (req, res) => {
  try {
    const [allLandlords, allProperties, allTenants, allInvoices, allUsers] = await Promise.all([
      dbAdapter.getLandlords(),
      dbAdapter.getProperties(),
      dbAdapter.getTenants(),
      dbAdapter.getInvoices(),
      dbAdapter.getUsers()
    ]);

    // 1. Summary Cards
    const totalLandlords = allLandlords.length;
    const totalProperties = allProperties.length;
    const totalTenants = allTenants.length;
    const totalInvoices = allInvoices.length;

    // Total Revenue (sum of generated and sent invoices)
    const finalizedInvoices = allInvoices.filter(i => ['Generated', 'Sent'].includes(i.status));
    const totalRevenue = finalizedInvoices.reduce((acc, curr) => acc + Number(curr.total_amount || 0), 0);

    // Pending Landlords (users with role Landlord and status PENDING)
    const pendingLandlordUsers = allUsers.filter(u => u.role === 'Landlord' && u.status?.toUpperCase() === 'PENDING');
    const pendingApprovalsCount = pendingLandlordUsers.length;

    // 2. Charts Data
    // Chart 1: Monthly Revenue Trend & Invoices Count
    const monthlyRevenueMap = {};
    allInvoices.forEach(inv => {
      const period = inv.billing_period || 'Unknown';
      if (!monthlyRevenueMap[period]) {
        monthlyRevenueMap[period] = {
          period,
          billed: 0,
          collected: 0,
          count: 0,
          invoicesGenerated: 0,
          draftCount: 0,
          finalizedCount: 0,
          rent: 0,
          maintenance: 0,
          parking: 0,
          gst: 0
        };
      }
      monthlyRevenueMap[period].billed += Number(inv.total_amount || 0);
      if (inv.status === 'Sent') {
        monthlyRevenueMap[period].collected += Number(inv.total_amount || 0);
      }
      monthlyRevenueMap[period].count += 1;
      monthlyRevenueMap[period].invoicesGenerated += 1;
      if (inv.status === 'Draft') {
        monthlyRevenueMap[period].draftCount += 1;
      } else {
        monthlyRevenueMap[period].finalizedCount += 1;
      }
      monthlyRevenueMap[period].rent += Number(inv.rent_amount || 0);
      monthlyRevenueMap[period].maintenance += Number(inv.maintenance_charges || 0);
      monthlyRevenueMap[period].parking += Number(inv.parking_charges || 0);
      monthlyRevenueMap[period].gst += Number(inv.gst_amount || 0);
    });
    const monthlyRevenueChart = Object.values(monthlyRevenueMap).sort((a, b) => a.period.localeCompare(b.period));

    // Chart 2: Invoice Status Distribution
    const invoiceStatusCounts = {
      Draft: allInvoices.filter(i => i.status === 'Draft').length,
      Generated: allInvoices.filter(i => i.status === 'Generated').length,
      Sent: allInvoices.filter(i => i.status === 'Sent').length
    };

    // Chart 3: Properties Overview (Commercial vs Residential & Area sqft)
    const getArea = (p) => Number(p.area_sqft || p.total_area || p.area || 0);
    const commercialProps = allProperties.filter(p => (p.property_type || '').toLowerCase() === 'commercial');
    const residentialProps = allProperties.filter(p => (p.property_type || '').toLowerCase() === 'residential');
    const commercialAreaSqft = commercialProps.reduce((acc, curr) => acc + getArea(curr), 0);
    const residentialAreaSqft = residentialProps.reduce((acc, curr) => acc + getArea(curr), 0);
    const totalAreaSqft = commercialAreaSqft + residentialAreaSqft;

    const propertyTypeCounts = {
      Commercial: commercialProps.length,
      Residential: residentialProps.length
    };

    const propertyArea = {
      commercialAreaSqft,
      residentialAreaSqft,
      totalAreaSqft,
      commercialCount: commercialProps.length,
      residentialCount: residentialProps.length,
      properties: allProperties.map(p => ({
        id: p.id,
        name: p.property_name || p.name,
        type: p.property_type,
        area: getArea(p),
        landlord: p.landlord_name
      }))
    };

    // Chart 4: Tenant Status Overview
    const tenantStatusCounts = {
      Active: allTenants.filter(t => t.status === 'Active').length,
      NoticePeriod: allTenants.filter(t => t.status === 'Notice Period').length,
      Vacated: allTenants.filter(t => t.status === 'Vacated').length
    };

    // Chart 5: Charges Breakdown (Maintenance, Parking, Rent, GST)
    const totalGst = allInvoices.reduce((acc, curr) => acc + Number(curr.gst_amount || 0), 0);
    const taxableRent = allInvoices.reduce((acc, curr) => acc + Number(curr.rent_amount || 0), 0);
    const maintenanceCharges = allInvoices.reduce((acc, curr) => acc + Number(curr.maintenance_charges || 0), 0);
    const parkingCharges = allInvoices.reduce((acc, curr) => acc + Number(curr.parking_charges || 0), 0);
    const additionalCharges = allInvoices.reduce((acc, curr) => acc + Number(curr.additional_charges || 0), 0);
    const grandTotal = taxableRent + additionalCharges + totalGst;

    const chargesBreakdown = {
      rent: taxableRent,
      maintenance: maintenanceCharges,
      parking: parkingCharges,
      otherCharges: Math.max(0, additionalCharges - (maintenanceCharges + parkingCharges)),
      gst: totalGst,
      grandTotal
    };

    return res.status(200).json({
      success: true,
      data: {
        summaryCards: {
          totalLandlords,
          totalProperties,
          totalTenants,
          totalInvoices,
          totalRevenue,
          totalBilled: grandTotal,
          pendingApprovalsCount
        },
        charts: {
          monthlyRevenue: monthlyRevenueChart,
          invoiceStatus: invoiceStatusCounts,
          propertyTypes: propertyTypeCounts,
          totalAreaSqft,
          propertyArea,
          tenantStatus: tenantStatusCounts,
          gstSummary: {
            taxableRent,
            additionalCharges,
            maintenanceCharges,
            parkingCharges,
            totalGst,
            grandTotal
          },
          chargesBreakdown
        },
        recentInvoices: [...allInvoices].sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0) || new Date(b.created_at || 0) - new Date(a.created_at || 0))
      }
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load admin dashboard analytics.' });
  }
};

/**
 * GET /api/priya/dashboard/landlord
 * Landlord-only self-scoped metrics and charts data.
 */
const getLandlordDashboard = async (req, res) => {
  try {
    const landlordId = req.user.landlord_id;

    if (!landlordId) {
      return res.status(403).json({
        success: false,
        message: 'No landlord record linked to this user account.'
      });
    }

    const [landlordInfo, properties, tenants, invoices] = await Promise.all([
      dbAdapter.getLandlordById(landlordId),
      dbAdapter.getProperties(landlordId),
      dbAdapter.getTenants(landlordId),
      dbAdapter.getInvoices({ landlordId })
    ]);

    // Summary Cards for Landlord
    const myPropertiesCount = properties.length;
    const myTenantsCount = tenants.length;
    const myInvoicesCount = invoices.length;
    const pendingInvoicesCount = invoices.filter(i => i.status === 'Draft').length;

    // Revenue for this landlord
    const myRevenue = invoices
      .filter(i => ['Generated', 'Sent'].includes(i.status))
      .reduce((acc, curr) => acc + Number(curr.total_amount || 0), 0);

    // Occupancy Rate: tenants occupying properties
    const occupiedProperties = new Set(tenants.map(t => t.property_id)).size;
    const occupancyRate = myPropertiesCount > 0 ? Math.round((occupiedProperties / myPropertiesCount) * 100) : 0;

    // Monthly revenue for this landlord
    const monthlyRevenueMap = {};
    invoices.forEach(inv => {
      const period = inv.billing_period || 'Unknown';
      if (!monthlyRevenueMap[period]) {
        monthlyRevenueMap[period] = {
          period,
          billed: 0,
          count: 0,
          invoicesGenerated: 0,
          rent: 0,
          maintenance: 0,
          parking: 0,
          gst: 0
        };
      }
      monthlyRevenueMap[period].billed += Number(inv.total_amount || 0);
      monthlyRevenueMap[period].count += 1;
      monthlyRevenueMap[period].invoicesGenerated += 1;
      monthlyRevenueMap[period].rent += Number(inv.rent_amount || 0);
      monthlyRevenueMap[period].maintenance += Number(inv.maintenance_charges || 0);
      monthlyRevenueMap[period].parking += Number(inv.parking_charges || 0);
      monthlyRevenueMap[period].gst += Number(inv.gst_amount || 0);
    });
    const monthlyRevenueChart = Object.values(monthlyRevenueMap).sort((a, b) => a.period.localeCompare(b.period));

    // Charges Breakdown for this landlord
    const totalRent = invoices.reduce((acc, curr) => acc + Number(curr.rent_amount || 0), 0);
    const totalMaintenance = invoices.reduce((acc, curr) => acc + Number(curr.maintenance_charges || 0), 0);
    const totalParking = invoices.reduce((acc, curr) => acc + Number(curr.parking_charges || 0), 0);
    const totalGst = invoices.reduce((acc, curr) => acc + Number(curr.gst_amount || 0), 0);
    const grandTotal = totalRent + totalMaintenance + totalParking + totalGst;

    const chargesBreakdown = {
      rent: totalRent,
      maintenance: totalMaintenance,
      parking: totalParking,
      gst: totalGst,
      grandTotal
    };

    // Status breakdown
    const invoiceStatus = {
      Draft: invoices.filter(i => i.status === 'Draft').length,
      Generated: invoices.filter(i => i.status === 'Generated').length,
      Sent: invoices.filter(i => i.status === 'Sent').length
    };

    return res.status(200).json({
      success: true,
      data: {
        landlord: {
          id: landlordInfo ? landlordInfo.id : landlordId,
          name: landlordInfo ? landlordInfo.name : (req.user.landlord_name || req.user.full_name),
          email: landlordInfo?.email || req.user.email || '',
          phone: landlordInfo?.contact_details || landlordInfo?.phone || '',
          pan: landlordInfo?.pan || '',
          gstin: landlordInfo?.gstin || '',
          billing_address: landlordInfo?.billing_address || '',
          default_invoice_template: landlordInfo?.default_invoice_template || 'Template A (Standard)',
          gst_registered: landlordInfo ? Boolean(landlordInfo.gst_registered) : false,
          status: landlordInfo?.status || req.user.status || 'Active'
        },
        summaryCards: {
          myProperties: myPropertiesCount,
          myTenants: myTenantsCount,
          myInvoices: myInvoicesCount,
          pendingInvoices: pendingInvoicesCount,
          occupancyRate,
          myRevenue,
          myTotalBilled: grandTotal
        },
        charts: {
          monthlyRevenue: monthlyRevenueChart,
          invoiceStatus,
          chargesBreakdown
        },
        invoices: invoices.slice(0, 5),
        properties: properties.slice(0, 5),
        tenants: tenants.slice(0, 5)
      }
    });
  } catch (err) {
    console.error('Landlord dashboard error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load landlord dashboard data.' });
  }
};

/**
 * Backward compatibility summary endpoint
 */
const getInvoiceSummary = async (req, res) => {
  if (req.user.role === 'Admin') {
    return getAdminDashboard(req, res);
  }
  return getLandlordDashboard(req, res);
};

module.exports = {
  getAdminDashboard,
  getLandlordDashboard,
  getInvoiceSummary
};
