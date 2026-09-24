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
    // Chart 1: Monthly Revenue Trend
    const monthlyRevenueMap = {};
    allInvoices.forEach(inv => {
      const period = inv.billing_period || 'Unknown';
      if (!monthlyRevenueMap[period]) {
        monthlyRevenueMap[period] = { period, billed: 0, collected: 0, count: 0 };
      }
      monthlyRevenueMap[period].billed += Number(inv.total_amount || 0);
      if (inv.status === 'Sent') {
        monthlyRevenueMap[period].collected += Number(inv.total_amount || 0);
      }
      monthlyRevenueMap[period].count += 1;
    });
    const monthlyRevenueChart = Object.values(monthlyRevenueMap).sort((a, b) => a.period.localeCompare(b.period));

    // Chart 2: Invoice Status Distribution
    const invoiceStatusCounts = {
      Draft: allInvoices.filter(i => i.status === 'Draft').length,
      Generated: allInvoices.filter(i => i.status === 'Generated').length,
      Sent: allInvoices.filter(i => i.status === 'Sent').length
    };

    // Chart 3: Properties Overview (Commercial vs Residential)
    const propertyTypeCounts = {
      Commercial: allProperties.filter(p => p.property_type === 'Commercial').length,
      Residential: allProperties.filter(p => p.property_type === 'Residential').length
    };
    const totalAreaSqft = allProperties.reduce((acc, curr) => acc + Number(curr.area_sqft || 0), 0);

    // Chart 4: Tenant Status Overview
    const tenantStatusCounts = {
      Active: allTenants.filter(t => t.status === 'Active').length,
      NoticePeriod: allTenants.filter(t => t.status === 'Notice Period').length,
      Vacated: allTenants.filter(t => t.status === 'Vacated').length
    };

    // Chart 5: GST Collection Summary
    const totalGst = allInvoices.reduce((acc, curr) => acc + Number(curr.gst_amount || 0), 0);
    const taxableRent = allInvoices.reduce((acc, curr) => acc + Number(curr.rent_amount || 0), 0);
    const additionalCharges = allInvoices.reduce((acc, curr) => acc + Number(curr.additional_charges || 0), 0);

    return res.status(200).json({
      success: true,
      data: {
        summaryCards: {
          totalLandlords,
          totalProperties,
          totalTenants,
          totalInvoices,
          totalRevenue,
          pendingApprovalsCount
        },
        charts: {
          monthlyRevenue: monthlyRevenueChart,
          invoiceStatus: invoiceStatusCounts,
          propertyTypes: propertyTypeCounts,
          totalAreaSqft,
          tenantStatus: tenantStatusCounts,
          gstSummary: {
            taxableRent,
            additionalCharges,
            totalGst,
            grandTotal: taxableRent + additionalCharges + totalGst
          }
        },
        recentInvoices: allInvoices.slice(0, 5)
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
        monthlyRevenueMap[period] = { period, billed: 0, count: 0 };
      }
      monthlyRevenueMap[period].billed += Number(inv.total_amount || 0);
      monthlyRevenueMap[period].count += 1;
    });
    const monthlyRevenueChart = Object.values(monthlyRevenueMap).sort((a, b) => a.period.localeCompare(b.period));

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
          myRevenue
        },
        charts: {
          monthlyRevenue: monthlyRevenueChart,
          invoiceStatus
        },
        invoices: invoices.slice(0, 5)
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
