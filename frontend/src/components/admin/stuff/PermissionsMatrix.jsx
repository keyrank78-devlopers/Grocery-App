import React from 'react';

const MODULES = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'categories', label: 'Categories' },
  { id: 'subcategories', label: 'Subcategories' },
  { id: 'products', label: 'Products' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'orders', label: 'Orders' },
  { id: 'customers', label: 'Customers' },
  { id: 'staff', label: 'Staff Management' },
  { id: 'warehouses', label: 'Warehouses' },
  { id: 'banners', label: 'Banners' },
  { id: 'coupons', label: 'Coupons' },
  { id: 'faq', label: 'FAQs' },
  { id: 'tickets', label: 'Support Tickets' },
  { id: 'policies', label: 'Policies' },
  { id: 'notifications', label: 'Notifications' },
];

export default function PermissionsMatrix({ permissions, setPermissions }) {
  const handleToggle = (module, action) => {
    setPermissions(prev => {
      const currentModule = prev[module] || {};
      const newModule = { ...currentModule, [action]: !currentModule[action] };
      // If turning off View, turn off Edit/Delete as well
      if (action === 'canView' && !newModule.canView) {
        newModule.canEdit = false;
        newModule.canDelete = false;
      }
      // If turning on Edit/Delete, ensure View is turned on
      if ((action === 'canEdit' || action === 'canDelete') && newModule[action]) {
        newModule.canView = true;
      }
      return { ...prev, [module]: newModule };
    });
  };

  return (
    <div style={{ marginTop: '20px' }}>
      <h3 className="section-title">Module Permissions</h3>
      <div style={{ overflowX: 'auto', border: '1px solid #dee2e6', borderRadius: '8px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead style={{ background: '#f8f9fa' }}>
            <tr>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Module</th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>View</th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>Edit</th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>Delete</th>
            </tr>
          </thead>
          <tbody>
            {MODULES.map(mod => {
              const p = permissions[mod.id] || {};
              return (
                <tr key={mod.id} style={{ borderBottom: '1px solid #dee2e6', background: '#fff' }}>
                  <td style={{ padding: '12px' }}><strong>{mod.label}</strong></td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <input type="checkbox" checked={!!p.canView} onChange={() => handleToggle(mod.id, 'canView')} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <input type="checkbox" checked={!!p.canEdit} onChange={() => handleToggle(mod.id, 'canEdit')} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <input type="checkbox" checked={!!p.canDelete} onChange={() => handleToggle(mod.id, 'canDelete')} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
