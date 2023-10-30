const organizerScannerData = {
  superAdmin: [
    {
      id: 'super_admin1',
    },
    {
      id: 'super_admin2',
    },
  ],
  gate: [
    {
      id: 'gateSuper_super_admin1',
      superAdminId: 'super_admin1',
    },
    {
      id: 'gate1_super_admin1',
      superAdminId: 'super_admin1',
    },
    {
      id: 'gate2_super_admin1',
      superAdminId: 'super_admin1',
    },
    {
      id: 'gate3_super_admin1',
      superAdminId: 'super_admin1',
    },
    {
      id: 'gateSuper_super_admin2',
      superAdminId: 'super_admin2',
    },
    {
      id: 'gate1_super_admin2',
      superAdminId: 'super_admin2',
    },
    {
      id: 'gate2_super_admin2',
      superAdminId: 'super_admin2',
    },
  ],
};

module.exports = organizerScannerData;
