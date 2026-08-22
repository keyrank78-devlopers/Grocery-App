import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Modal from "../../Modal";
import { useToast } from "../../../context/ToastContext";

// Leaflet assets & CSS
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Workaround for default marker icon path resolution in Vite bundling
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIconRetina from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIconRetina,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function WarehouseView() {
  const { showToast } = useToast();

  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [page, setPage] = useState(1);

  // ── Filters State ──────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filteredWarehouses = React.useMemo(() => {
    return warehouses.filter((wh) => {
      const matchSearch = 
        wh.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wh.contactNumber.includes(searchTerm) ||
        (wh.address?.city || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (wh.address?.pincode || "").includes(searchTerm) ||
        wh.warehouse_id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchStatus = 
        !statusFilter || 
        (statusFilter === "active" ? wh.isActive === true : wh.isActive === false);
        
      return matchSearch && matchStatus;
    });
  }, [warehouses, searchTerm, statusFilter]);

  // Address Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);

  // Staff lists & Assignments State
  const [staff, setStaff] = useState([]);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [assignWh, setAssignWh] = useState(null);
  const [selectedManagerId, setSelectedManagerId] = useState("");
  const [selectedAgentIds, setSelectedAgentIds] = useState([]);
  const [isAssigningStaff, setIsAssigningStaff] = useState(false);

  // viewMode can be: 'list', 'add', 'edit'
  const [viewMode, setViewMode] = useState("list");

  // Map state refs
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  // ── Add Form State ─────────────────────────────────────────────
  const [addForm, setAddForm] = useState({
    name: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    landmark: "",
    contactNumber: "",
    openingTime: "09:00 AM",
    closingTime: "09:00 PM",
    deliveryRangeKm: 5,
    longitude: "",
    latitude: "",
    isActive: true,
  });

  // ── Edit Form State ────────────────────────────────────────────
  const [editWh, setEditWh] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    landmark: "",
    contactNumber: "",
    openingTime: "",
    closingTime: "",
    deliveryRangeKm: "",
    longitude: "",
    latitude: "",
    isActive: true,
  });

  // ── Delete Confirm Modal ───────────────────────────────────────
  const [deleteWh, setDeleteWh] = useState(null);

  // ── Fetch List ──────────────────────────────────────────────────
  const fetchWarehousesAndStaff = async () => {
    setLoading(true);
    try {
      const [whRes, staffRes] = await Promise.all([
        axios.get(`${BASE_URL}/admin/get-warehouses`, { withCredentials: true }),
        axios.get(`${BASE_URL}/admin/get-staff`, { withCredentials: true }),
      ]);
      setWarehouses(whRes.data.data || []);
      setStaff(staffRes.data.data || []);
    } catch (err) {
      console.error(err);
      showToast("Failed to load warehouse data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehousesAndStaff();
  }, []);

  const [bypassMapCleanup, setBypassMapCleanup] = useState(false);

  // ── Map Initialization ──────────────────────────────────────────
  useEffect(() => {
    if (viewMode === "list") return;

    // Wait for the DOM element to mount
    const timer = setTimeout(() => {
      const mapContainer = document.getElementById("warehouse-map");
      if (!mapContainer) return;

      // Determine initial coordinates (Default to Delhi, India if empty)
      let initialLat = 28.7041;
      let initialLng = 77.1025;

      if (viewMode === "edit" && editForm.latitude && editForm.longitude) {
        initialLat = Number(editForm.latitude);
        initialLng = Number(editForm.longitude);
      } else if (viewMode === "add" && addForm.latitude && addForm.longitude) {
        initialLat = Number(addForm.latitude);
        initialLng = Number(addForm.longitude);
      }

      // 1. Create Leaflet Map Instance
      const map = L.map("warehouse-map").setView([initialLat, initialLng], 13);
      mapRef.current = map;

      // 2. Add OpenStreetMap Tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      // 3. Create initial marker if coordinates exist
      if (
        (viewMode === "edit" && editForm.latitude && editForm.longitude) ||
        (viewMode === "add" && addForm.latitude && addForm.longitude)
      ) {
        markerRef.current = L.marker([initialLat, initialLng], { draggable: true }).addTo(map);
        // Bind dragend event
        markerRef.current.on("dragend", async (event) => {
          const marker = event.target;
          const position = marker.getLatLng();
          await reverseGeocode(position.lat, position.lng);
        });
      }

      // 4. Click Event to place marker and fetch address
      map.on("click", async (e) => {
        const { lat, lng } = e.latlng;
        
        if (markerRef.current) {
          markerRef.current.setLatLng(e.latlng);
        } else {
          markerRef.current = L.marker(e.latlng, { draggable: true }).addTo(map);
          markerRef.current.on("dragend", async (event) => {
            const marker = event.target;
            const position = marker.getLatLng();
            await reverseGeocode(position.lat, position.lng);
          });
        }
        await reverseGeocode(lat, lng);
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markerRef.current = null;
    };
  }, [viewMode, editWh]);

  // ── Reverse Geocoding via Nominatim API ──────────────────────────
  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
        { withCredentials: false }
      );
      const address = res.data.address || {};
      const road = address.road || address.pedestrian || "";
      const neighbourhood = address.neighbourhood || address.suburb || "";
      const city = address.city || address.town || address.village || address.suburb || "";
      const state = address.state || "";
      const pincode = address.postcode || "";

      // Construct a clean Address Line 1
      const addressLine1 = [road, neighbourhood].filter(Boolean).join(", ") || res.data.display_name?.split(",")?.[0] || "Marker Location";

      if (viewMode === "add") {
        setAddForm((prev) => ({
          ...prev,
          longitude: lng.toFixed(6),
          latitude: lat.toFixed(6),
          addressLine1,
          city,
          state,
          pincode,
        }));
      } else if (viewMode === "edit") {
        setEditForm((prev) => ({
          ...prev,
          longitude: lng.toFixed(6),
          latitude: lat.toFixed(6),
          addressLine1,
          city,
          state,
          pincode,
        }));
      }
      showToast("Address details auto-filled from map!", "success");
    } catch (err) {
      console.error("Geocoding Error:", err);
      // Fallback: update coordinates only
      if (viewMode === "add") {
        setAddForm((prev) => ({ ...prev, longitude: lng.toFixed(6), latitude: lat.toFixed(6) }));
      } else if (viewMode === "edit") {
        setEditForm((prev) => ({ ...prev, longitude: lng.toFixed(6), latitude: lat.toFixed(6) }));
      }
      showToast("Updated coordinates. Address auto-fill unavailable.", "warning");
    }
  };

  // ── Address Search (Forward Geocoding) ───────────────────────────
  const handleSearchAddress = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearchingAddress(true);
    try {
      const res = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&q=${encodeURIComponent(
          searchQuery.trim()
        )}`,
        { withCredentials: false }
      );
      if (res.data.length === 0) {
        showToast("Address not found. Please try a different query.", "warning");
        return;
      }
      
      const result = res.data[0];
      const lat = Number(result.lat);
      const lng = Number(result.lon);

      // Pan map
      if (mapRef.current) {
        mapRef.current.setView([lat, lng], 15);
      }

      // Add/Update marker
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else if (mapRef.current) {
        markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(mapRef.current);
        markerRef.current.on("dragend", async (event) => {
          const marker = event.target;
          const position = marker.getLatLng();
          await reverseGeocode(position.lat, position.lng);
        });
      }

      // Parse address details
      const address = result.address || {};
      const road = address.road || address.pedestrian || "";
      const neighbourhood = address.neighbourhood || address.suburb || "";
      const city = address.city || address.town || address.village || address.suburb || "";
      const state = address.state || "";
      const pincode = address.postcode || "";

      const addressLine1 = [road, neighbourhood].filter(Boolean).join(", ") || result.display_name?.split(",")?.[0] || "";

      // Update state
      if (viewMode === "add") {
        setAddForm((prev) => ({
          ...prev,
          longitude: lng.toFixed(6),
          latitude: lat.toFixed(6),
          addressLine1,
          city,
          state,
          pincode,
        }));
      } else if (viewMode === "edit") {
        setEditForm((prev) => ({
          ...prev,
          longitude: lng.toFixed(6),
          latitude: lat.toFixed(6),
          addressLine1,
          city,
          state,
          pincode,
        }));
      }

      showToast("Location found and map updated!", "success");
    } catch (err) {
      console.error("Address Search Error:", err);
      showToast("Failed to search address", "error");
    } finally {
      setIsSearchingAddress(false);
    }
  };

  // ── Add Warehouse Submit ─────────────────────────────────────────
  const handleAddWarehouse = async (e) => {
    e.preventDefault();
    if (!addForm.latitude || !addForm.longitude) {
      showToast("Please pick a location on the map first", "error");
      return;
    }
    setIsAdding(true);
    try {
      const payload = {
        name: addForm.name,
        address: {
          addressLine1: addForm.addressLine1,
          addressLine2: addForm.addressLine2,
          city: addForm.city,
          state: addForm.state,
          pincode: addForm.pincode,
          landmark: addForm.landmark,
        },
        contactNumber: addForm.contactNumber,
        openingTime: addForm.openingTime,
        closingTime: addForm.closingTime,
        deliveryRangeKm: Number(addForm.deliveryRangeKm),
        longitude: Number(addForm.longitude),
        latitude: Number(addForm.latitude),
        isActive: addForm.isActive,
      };

      const res = await axios.post(`${BASE_URL}/admin/warehouses`, payload, {
        withCredentials: true,
      });

      setWarehouses((prev) => [res.data.data, ...prev]);
      setAddForm({
        name: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        pincode: "",
        landmark: "",
        contactNumber: "",
        openingTime: "09:00 AM",
        closingTime: "09:00 PM",
        deliveryRangeKm: 5,
        longitude: "",
        latitude: "",
        isActive: true,
      });
      setViewMode("list");
      showToast("Warehouse created successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to create warehouse", "error");
    } finally {
      setIsAdding(false);
    }
  };

  // ── Edit Warehouse Submit ────────────────────────────────────────
  const openEditPage = (wh) => {
    setEditWh(wh);
    setEditForm({
      name: wh.name || "",
      addressLine1: wh.address?.addressLine1 || "",
      addressLine2: wh.address?.addressLine2 || "",
      city: wh.address?.city || "",
      state: wh.address?.state || "",
      pincode: wh.address?.pincode || "",
      landmark: wh.address?.landmark || "",
      contactNumber: wh.contactNumber || "",
      openingTime: wh.openingTime || "",
      closingTime: wh.closingTime || "",
      deliveryRangeKm: wh.deliveryRangeKm || 5,
      longitude: wh.location?.coordinates?.[0] || "",
      latitude: wh.location?.coordinates?.[1] || "",
      isActive: wh.isActive,
    });
    setViewMode("edit");
  };

  const handleEditWarehouse = async (e) => {
    e.preventDefault();
    if (!editForm.latitude || !editForm.longitude) {
      showToast("Coordinates are required (pick on map)", "error");
      return;
    }
    setIsEditing(true);
    try {
      const payload = {
        name: editForm.name,
        address: {
          addressLine1: editForm.addressLine1,
          addressLine2: editForm.addressLine2,
          city: editForm.city,
          state: editForm.state,
          pincode: editForm.pincode,
          landmark: editForm.landmark,
        },
        contactNumber: editForm.contactNumber,
        openingTime: editForm.openingTime,
        closingTime: editForm.closingTime,
        deliveryRangeKm: Number(editForm.deliveryRangeKm),
        longitude: Number(editForm.longitude),
        latitude: Number(editForm.latitude),
        isActive: editForm.isActive,
      };

      const res = await axios.put(
        `${BASE_URL}/admin/update-warehouses/${editWh.warehouse_id}`,
        payload,
        { withCredentials: true }
      );

      setWarehouses((prev) =>
        prev.map((w) => (w.warehouse_id === editWh.warehouse_id ? res.data.data : w))
      );
      setEditWh(null);
      setViewMode("list");
      showToast("Warehouse updated successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to update warehouse", "error");
    } finally {
      setIsEditing(false);
    }
  };

  // ── Delete Warehouse ────────────────────────────────────────────
  const handleDeleteWarehouse = async () => {
    if (!deleteWh) return;
    setDeletingId(deleteWh.warehouse_id);
    try {
      await axios.delete(
        `${BASE_URL}/admin/delete-warehouses/${deleteWh.warehouse_id}`,
        { withCredentials: true }
      );
      setWarehouses((prev) => prev.filter((w) => w.warehouse_id !== deleteWh.warehouse_id));
      setDeleteWh(null);
      showToast("Warehouse deleted successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to delete warehouse", "error");
    } finally {
      setDeletingId(null);
    }
  };

  // ── Staff Assignment Helpers & Handlers ──────────────────────────
  const getAssignedStaffForWarehouse = (whId) => {
    const manager = staff.find(
      (s) => s.role === "warehouse_manager" && s.assignedWarehouse?.id === whId
    );
    const agents = staff.filter(
      (s) => s.role === "agent" && s.assignedWarehouse?.id === whId
    );

    return (
      <div style={{ fontSize: "12px", lineHeight: "1.4" }}>
        <div>Manager: <strong>{manager ? manager.name : "Unassigned"}</strong></div>
        <div style={{ color: "#6c757d", marginTop: "2px" }}>
          Agents: {agents.length > 0 ? (
            <strong>{agents.map((a) => a.name).join(", ")}</strong>
          ) : (
            "None"
          )}
        </div>
      </div>
    );
  };

  const handleOpenAssignModal = (wh) => {
    setAssignWh(wh);
    
    // Find who is currently assigned as manager to this warehouse
    const currentManager = staff.find(
      (s) => s.role === "warehouse_manager" && s.assignedWarehouse?.id === wh._id
    );
    setSelectedManagerId(currentManager ? currentManager.id : "");

    // Find all agents currently assigned to this warehouse
    const currentAgents = staff.filter(
      (s) => s.role === "agent" && s.assignedWarehouse?.id === wh._id
    );
    setSelectedAgentIds(currentAgents.map((a) => a.id));

    setIsAssignOpen(true);
  };

  const handleSaveStaffAssignment = async (e) => {
    e.preventDefault();
    setIsAssigningStaff(true);
    try {
      // 1. Manager Assignment Check
      const currentManager = staff.find(
        (s) => s.role === "warehouse_manager" && s.assignedWarehouse?.id === assignWh._id
      );
      const originalManagerId = currentManager ? currentManager.id : "";

      if (selectedManagerId !== originalManagerId) {
        // Unassign old manager if they existed
        if (originalManagerId) {
          await axios.put(
            `${BASE_URL}/admin/staff/${originalManagerId}/assign-warehouse`,
            { warehouseId: null },
            { withCredentials: true }
          );
        }
        // Assign new manager if selected
        if (selectedManagerId) {
          await axios.put(
            `${BASE_URL}/admin/staff/${selectedManagerId}/assign-warehouse`,
            { warehouseId: assignWh._id },
            { withCredentials: true }
          );
        }
      }

      // 2. Agents Assignment Check
      const originalAgents = staff.filter(
        (s) => s.role === "agent" && s.assignedWarehouse?.id === assignWh._id
      );
      const originalAgentIds = originalAgents.map((a) => a.id);

      // Agents to assign (selected now but not originally assigned)
      const agentsToAssign = selectedAgentIds.filter((id) => !originalAgentIds.includes(id));
      // Agents to unassign (originally assigned but deselected now)
      const agentsToUnassign = originalAgentIds.filter((id) => !selectedAgentIds.includes(id));

      // Call API for assignments
      for (const id of agentsToAssign) {
        await axios.put(
          `${BASE_URL}/admin/staff/${id}/assign-warehouse`,
          { warehouseId: assignWh._id },
          { withCredentials: true }
        );
      }

      // Call API for unassignments
      for (const id of agentsToUnassign) {
        await axios.put(
          `${BASE_URL}/admin/staff/${id}/assign-warehouse`,
          { warehouseId: null },
          { withCredentials: true }
        );
      }

      showToast("Staff assignments updated successfully!", "success");
      setIsAssignOpen(false);

      // Re-fetch staff data to update local assignments state
      const staffRes = await axios.get(`${BASE_URL}/admin/get-staff`, { withCredentials: true });
      setStaff(staffRes.data.data || []);
    } catch (err) {
      console.error("Staff Assignment Error:", err);
      showToast(err.response?.data?.message || "Failed to save staff assignments", "error");
    } finally {
      setIsAssigningStaff(false);
    }
  };

  // ── Toggle Status ──────────────────────────────────────────────
  const handleToggleStatus = async (wh) => {
    if (togglingId) return;
    setTogglingId(wh.warehouse_id);
    try {
      const res = await axios.patch(
        `${BASE_URL}/admin/warehouses/${wh.warehouse_id}/toggle-status`,
        {},
        { withCredentials: true }
      );
      const { isActive } = res.data.data;
      setWarehouses((prev) =>
        prev.map((w) => (w.warehouse_id === wh.warehouse_id ? { ...w, isActive } : w))
      );
      showToast(`Warehouse ${isActive ? "activated" : "deactivated"} successfully`, "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to update status", "error");
    } finally {
      setTogglingId(null);
    }
  };

  // ── Render Views ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="content-section active">
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
          <div style={{ textAlign: "center", color: "#6c757d" }}>
            <div style={{ width: "36px", height: "36px", border: "3px solid #dee2e6", borderTopColor: "#0d6efd", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
            <p style={{ fontSize: "14px" }}>Loading warehouses...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        </div>
      </div>
    );
  }

  // 1. LIST VIEW
  if (viewMode === "list") {
    return (
      <div className="content-section active">
        <div className="page-header">
          <div className="page-header-content">
            <h2>Warehouse Management</h2>
          </div>
          <button className="btn btn-primary" onClick={() => setViewMode("add")}>
            + Add Warehouse
          </button>
        </div>

        {/* ── Filter Toolbar ── */}
        <div style={{ display: "flex", gap: "16px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
          {/* Search */}
          <div style={{ flex: "1", minWidth: "200px", position: "relative" }}>
            <input
              type="text"
              placeholder="Search warehouses (name, city, pincode, phone)..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              style={{ width: "100%", padding: "10px 14px 10px 36px" }}
            />
            <svg width="16" height="16" fill="none" stroke="var(--text-muted)" viewBox="0 0 24 24" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Status Filter */}
          <div style={{ minWidth: "140px" }}>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              style={{ width: "100%", cursor: "pointer", height: "42px", padding: "10px 14px" }}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Clear Filters */}
          {(searchTerm || statusFilter) && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("");
                setPage(1);
              }}
              style={{ height: "42px", padding: "0 18px", borderRadius: "8px", border: "1px solid var(--border-color)", fontSize: "13px", fontWeight: "600", cursor: "pointer", backgroundColor: "var(--bg-secondary)" }}
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* ── Table ── */}
        <div className="card" style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Contact</th>
                <th>Timings</th>
                <th>Assigned Staff</th>
                <th>Range</th>
                <th>City / Pincode</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredWarehouses.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "48px", color: "#6c757d" }}>
                    No warehouses found. Try adjusting your filters!
                  </td>
                </tr>
              ) : (
                (() => {
                  const pageSize = 10;
                  const totalPages = Math.ceil(filteredWarehouses.length / pageSize);
                  const safePage = Math.min(page, Math.max(1, totalPages));
                  const start = (safePage - 1) * pageSize;
                  const paginated = filteredWarehouses.slice(start, start + pageSize);
                  return paginated.map((wh) => (
                    <tr key={wh._id}>
                      <td><span className="staff-id-badge">{wh.warehouse_id}</span></td>
                      <td><strong>{wh.name}</strong></td>
                      <td><span className="text-muted">{wh.contactNumber}</span></td>
                      <td><span className="text-sm">{wh.openingTime} - {wh.closingTime}</span></td>
                      <td>{getAssignedStaffForWarehouse(wh._id)}</td>
                      <td><span className="text-sm">{wh.deliveryRangeKm} Km</span></td>
                      <td><span className="text-sm">{wh.address?.city} ({wh.address?.pincode})</span></td>
                      <td>
                        <span className={`badge ${wh.isActive ? "badge-success" : "badge-error"}`}>
                          {wh.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="staff-actions">
                          <button className="btn btn-outline btn-xs" onClick={() => openEditPage(wh)}>
                            Edit
                          </button>
                          <button
                            className="btn btn-outline btn-xs"
                            style={{ color: "#4f46e5", borderColor: "#4f46e5" }}
                            onClick={() => handleOpenAssignModal(wh)}
                          >
                            Staff
                          </button>
                          <button
                            className={`btn btn-outline btn-xs ${wh.isActive ? "text-danger" : "text-success"}`}
                            onClick={() => handleToggleStatus(wh)}
                            disabled={togglingId === wh.warehouse_id}
                          >
                            {togglingId === wh.warehouse_id ? "..." : wh.isActive ? "Disable" : "Enable"}
                          </button>
                          <button
                            className="btn btn-outline btn-xs text-danger"
                            onClick={() => setDeleteWh(wh)}
                            disabled={deletingId === wh.warehouse_id}
                          >
                            {deletingId === wh.warehouse_id ? "..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ));
                })()
              )}
            </tbody>
          </table>

          {/* ── Table Pagination ── */}
          {(() => {
            const pageSize = 10;
            const totalPages = Math.ceil(filteredWarehouses.length / pageSize);
            const safePage = Math.min(page, Math.max(1, totalPages));
            if (totalPages <= 1) return null;
            return (
              <div className="table-pagination">
                <span className="pagination-info">
                  Page <strong>{safePage}</strong> of <strong>{totalPages}</strong>
                </span>
                <div className="pagination-actions">
                  <button
                    type="button"
                    className="pagination-btn"
                    onClick={() => setPage(prev => Math.max(1, prev - 1))}
                    disabled={safePage === 1}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="pagination-btn"
                    onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={safePage === totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            );
          })()}
        </div>

        {/* ── Delete Confirm Modal ── */}
        <Modal isOpen={!!deleteWh} onClose={() => setDeleteWh(null)} title="Delete Warehouse">
          <div style={{ textAlign: "center", padding: "8px 0 24px" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🗑️</div>
            <p style={{ fontSize: "15px", marginBottom: "8px" }}>
              Are you sure you want to delete warehouse <strong>"{deleteWh?.name}"</strong>?
            </p>
            <p className="text-muted text-sm">This action cannot be undone and will delete stock link associations.</p>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setDeleteWh(null)} disabled={!!deletingId}>
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteWarehouse}
              disabled={!!deletingId}
              style={{ background: "#dc3545", borderColor: "#dc3545", color: "#fff", padding: "8px 20px", borderRadius: "6px", border: "1px solid", cursor: "pointer", fontWeight: 500 }}
            >
              {deletingId ? "Deleting..." : "Yes, Delete"}
            </button>
          </div>
        </Modal>

        {/* ── Assign Staff Modal ── */}
        <Modal
          isOpen={isAssignOpen}
          onClose={() => setIsAssignOpen(false)}
          title={`Assign Staff to: ${assignWh?.name || ""}`}
        >
          <form onSubmit={handleSaveStaffAssignment}>
            <div className="form-group" style={{ marginBottom: "16px" }}>
              <label style={{ fontWeight: "600", display: "block", marginBottom: "6px", fontSize: "14px" }}>
                Warehouse Manager
              </label>
              <select
                value={selectedManagerId}
                onChange={(e) => setSelectedManagerId(e.target.value)}
                style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #dee2e6", outline: "none", fontSize: "14px" }}
              >
                <option value="">-- Select Manager --</option>
                {staff
                  .filter((s) => s.role === "warehouse_manager")
                  .map((m) => {
                    const assignedTo = m.assignedWarehouse && m.assignedWarehouse.id !== assignWh?._id
                      ? ` (Assigned to ${m.assignedWarehouse.name})`
                      : "";
                    return (
                      <option key={m.id} value={m.id}>
                        {m.name} {assignedTo}
                      </option>
                    );
                  })}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: "16px" }}>
              <label style={{ fontWeight: "600", display: "block", marginBottom: "6px", fontSize: "14px" }}>
                Delivery Agents
              </label>
              <div
                style={{
                  maxHeight: "180px",
                  overflowY: "auto",
                  border: "1px solid #dee2e6",
                  borderRadius: "6px",
                  padding: "10px",
                  background: "#fcfcfc",
                }}
              >
                {staff.filter((s) => s.role === "agent").length === 0 ? (
                  <p className="text-muted text-sm" style={{ margin: 0 }}>No delivery agents found.</p>
                ) : (
                  staff
                    .filter((s) => s.role === "agent")
                    .map((agent) => {
                      const isChecked = selectedAgentIds.includes(agent.id);
                      const assignedTo = agent.assignedWarehouse && agent.assignedWarehouse.id !== assignWh?._id
                        ? ` (Assigned to ${agent.assignedWarehouse.name})`
                        : "";

                      const handleToggleCheck = (e) => {
                        if (e.target.checked) {
                          setSelectedAgentIds((prev) => [...prev, agent.id]);
                        } else {
                          setSelectedAgentIds((prev) => prev.filter((id) => id !== agent.id));
                        }
                      };

                      return (
                        <div
                          key={agent.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "6px 0",
                            borderBottom: "1px solid #f1f1f1",
                          }}
                        >
                          <input
                            type="checkbox"
                            id={`agent-chk-${agent.id}`}
                            checked={isChecked}
                            onChange={handleToggleCheck}
                            style={{ cursor: "pointer" }}
                          />
                          <label htmlFor={`agent-chk-${agent.id}`} style={{ margin: 0, cursor: "pointer", fontSize: "14px" }}>
                            <strong>{agent.name}</strong> {assignedTo}
                          </label>
                        </div>
                      );
                    })
                )}
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: "24px" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsAssignOpen(false)}
                disabled={isAssigningStaff}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={isAssigningStaff}>
                {isAssigningStaff ? "Saving..." : "Save Assignments"}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  // 2. ADD / EDIT FULL-PAGE VIEW
  const isEditMode = viewMode === "edit";
  const currentForm = isEditMode ? editForm : addForm;
  const setForm = isEditMode ? setEditForm : setAddForm;

  return (
    <div className="content-section active">
      <div className="page-header" style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            className="btn btn-outline"
            style={{ padding: "6px 12px", fontSize: "14px" }}
            onClick={() => setViewMode("list")}
          >
            ← Back to List
          </button>
          <h2 style={{ margin: 0 }}>
            {isEditMode ? `Edit Warehouse (${editWh?.warehouse_id})` : "Add New Warehouse"}
          </h2>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "row", gap: "24px", alignItems: "flex-start" }}>
        {/* Form Container (Left) */}
        <div className="card" style={{ flex: 1, padding: "24px", maxWidth: "600px", margin: 0 }}>
          <form onSubmit={isEditMode ? handleEditWarehouse : handleAddWarehouse} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div className="form-group" style={{ gridColumn: "span 2" }}>
              <label>Warehouse Name <span className="text-danger">*</span></label>
              <input
                type="text"
                placeholder="e.g. West Delhi Fulfillment Center"
                value={currentForm.name}
                onChange={(e) => setForm({ ...currentForm, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Contact Number <span className="text-danger">*</span></label>
              <input
                type="text"
                placeholder="e.g. +91 9898989898"
                value={currentForm.contactNumber}
                onChange={(e) => setForm({ ...currentForm, contactNumber: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Delivery Range (Km) <span className="text-danger">*</span></label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 8"
                value={currentForm.deliveryRangeKm}
                onChange={(e) => setForm({ ...currentForm, deliveryRangeKm: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Opening Time <span className="text-danger">*</span></label>
              <input
                type="text"
                placeholder="e.g. 09:00 AM"
                value={currentForm.openingTime}
                onChange={(e) => setForm({ ...currentForm, openingTime: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Closing Time <span className="text-danger">*</span></label>
              <input
                type="text"
                placeholder="e.g. 09:00 PM"
                value={currentForm.closingTime}
                onChange={(e) => setForm({ ...currentForm, closingTime: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Longitude <span className="text-danger">*</span></label>
              <input
                type="number"
                step="any"
                value={currentForm.longitude}
                onChange={(e) => setForm({ ...currentForm, longitude: e.target.value })}
                placeholder="Pick on map"
                required
                disabled
                style={{ background: "#f8f9fa", cursor: "not-allowed" }}
              />
            </div>

            <div className="form-group">
              <label>Latitude <span className="text-danger">*</span></label>
              <input
                type="number"
                step="any"
                value={currentForm.latitude}
                onChange={(e) => setForm({ ...currentForm, latitude: e.target.value })}
                placeholder="Pick on map"
                required
                disabled
                style={{ background: "#f8f9fa", cursor: "not-allowed" }}
              />
            </div>

            {/* Address fields */}
            <div style={{ gridColumn: "span 2", borderTop: "1px solid #eee", padding: "12px 0 2px", fontWeight: "bold", fontSize: "14px", color: "#495057" }}>
              Address Details (Auto-filled by placing Pin on Map)
            </div>

            <div className="form-group" style={{ gridColumn: "span 2" }}>
              <label>Address Line 1 <span className="text-danger">*</span></label>
              <input
                type="text"
                placeholder="Select location on map to auto-fill"
                value={currentForm.addressLine1}
                onChange={(e) => setForm({ ...currentForm, addressLine1: e.target.value })}
                required
              />
            </div>

            <div className="form-group" style={{ gridColumn: "span 2" }}>
              <label>Address Line 2 (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Floor 2, Building B"
                value={currentForm.addressLine2}
                onChange={(e) => setForm({ ...currentForm, addressLine2: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>City <span className="text-danger">*</span></label>
              <input
                type="text"
                placeholder="City"
                value={currentForm.city}
                onChange={(e) => setForm({ ...currentForm, city: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>State <span className="text-danger">*</span></label>
              <input
                type="text"
                placeholder="State"
                value={currentForm.state}
                onChange={(e) => setForm({ ...currentForm, state: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Pincode <span className="text-danger">*</span></label>
              <input
                type="text"
                placeholder="Pincode"
                value={currentForm.pincode}
                onChange={(e) => setForm({ ...currentForm, pincode: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Landmark (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Near Big Temple"
                value={currentForm.landmark}
                onChange={(e) => setForm({ ...currentForm, landmark: e.target.value })}
              />
            </div>

            <div style={{ gridColumn: "span 2", display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setViewMode("list")}
                disabled={isAdding || isEditing}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={isAdding || isEditing}>
                {isEditMode
                  ? isEditing ? "Saving..." : "Save Changes"
                  : isAdding ? "Saving..." : "Save Warehouse"
                }
              </button>
            </div>
          </form>
        </div>

        {/* Map Container (Right) */}
        <div style={{ flex: 1.2, position: "sticky", top: "24px" }}>
          <div className="card" style={{ padding: "16px", margin: 0 }}>
            <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#495057" }}>
              📍 Click/Drag Pin on Map OR Type Address below to Search Location
            </h4>
            
            {/* Address Search Field */}
            <form onSubmit={handleSearchAddress} style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
              <input
                type="text"
                placeholder="Search address (e.g. Sector 18, Noida)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ flex: 1, padding: "8px 12px", border: "1px solid #dee2e6", borderRadius: "6px", fontSize: "14px", outline: "none" }}
              />
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: "8px 16px", borderRadius: "6px", fontSize: "13px", height: "38px" }}
                disabled={isSearchingAddress}
              >
                {isSearchingAddress ? "Searching..." : "Search"}
              </button>
            </form>

            <div
              id="warehouse-map"
              style={{
                height: "500px",
                width: "100%",
                borderRadius: "8px",
                border: "1px solid #dee2e6",
                zIndex: 1,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
