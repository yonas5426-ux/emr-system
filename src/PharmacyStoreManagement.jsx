import { useEffect, useState } from "react";
import { supabase } from "./supabase";

const STORE_TYPES = [
  { value: "Medical", label: "Medical Store", icon: "💊" },
  { value: "Supply", label: "Supply Store", icon: "📦" },
  { value: "Equipment", label: "Equipment Store", icon: "🩺" },
];

const SECTIONS = [
  { value: "entries", label: "Entries", icon: "📥", description: "Register received medicines, supplies and equipment." },
  { value: "entries-list", label: "Entries List", icon: "📋", description: "Review store receipt records." },
  { value: "requests", label: "Request List", icon: "📝", description: "Department stock requests." },
  { value: "issued", label: "Issued List", icon: "📤", description: "Issued stock records." },
  { value: "transfers", label: "Transfer Out List", icon: "🔁", description: "Transfers between stores." },
  { value: "bin-card", label: "Bin Card", icon: "📒", description: "Chronological stock movements." },
  { value: "stock-status", label: "Stock Status", icon: "📊", description: "Available, low, expired and near-expiry stock." },
  { value: "inventory", label: "Inventory", icon: "📦", description: "Physical count and system balance." },
  { value: "rrf", label: "RRF Form", icon: "🧾", description: "Requisition and report forms." },
];

const inputStyle = {
  width: "100%", boxSizing: "border-box", padding: "10px",
  border: "1px solid #cbd5e1", borderRadius: 7, fontSize: 14,
};
const labelStyle = {
  display: "block", fontWeight: 600, fontSize: 13,
  color: "#334155", marginBottom: 5,
};
const primaryButton = {
  background: "#2563eb", color: "white", border: 0,
  borderRadius: 7, padding: "11px 18px", fontWeight: 700,
  cursor: "pointer",
};

export default function PharmacyStoreManagement({ user }) {
  const [storeType, setStoreType] = useState("Medical");
  const [section, setSection] = useState("entries");
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [receiptLines, setReceiptLines] = useState({});
  const [binCardRows, setBinCardRows] = useState([]);
  const [stockStatusRows, setStockStatusRows] = useState([]);
  const [wasteRecords, setWasteRecords] = useState([]);
  const [wasteBalances, setWasteBalances] = useState([]);
  const [inventoryCounts, setInventoryCounts] = useState([]);
  const [inventoryCountItems, setInventoryCountItems] = useState([]);
  const [inventoryBalances, setInventoryBalances] = useState([]);
  const [discrepancyForm, setDiscrepancyForm] = useState({
    balance_index: "", count_date: new Date().toISOString().slice(0, 10),
    physical_quantity: "", variance_reason: "", notes: "",
  });
  const [wasteForm, setWasteForm] = useState({ balance_index: "", waste_date: new Date().toISOString().slice(0, 10), quantity: "1", waste_reason: "", notes: "" });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [showNewItem, setShowNewItem] = useState(false);
  const [inspectionReceipt, setInspectionReceipt] = useState(null);
  const [inspectionItems, setInspectionItems] = useState([]);
  const [selectedBinItem, setSelectedBinItem] = useState(null);
  const [binManageTab, setBinManageTab] = useState("view");

  const [itemForm, setItemForm] = useState({
    item_code: "", item_name: "", generic_name: "", category: "",
    unit_of_measure: "", manufacturer: "", minimum_stock: "0",
    maximum_stock: "0", reorder_level: "0",
    tracks_batch: true, tracks_expiry: true,
  });

  const [receiptForm, setReceiptForm] = useState({
    supplier_id: "", purchase_order_number: "", grn_number: "",
    invoice_number: "", delivery_note_number: "",
    received_date: new Date().toISOString().slice(0, 10),
    item_id: "", batch_number: "", manufacture_date: "",
    expiry_date: "", asset_code: "", serial_number: "",
    model_number: "", warranty_expiry: "",
    received_quantity: "1", accepted_quantity: "1",
    rejected_quantity: "0", unit_cost: "0",
    condition_status: "Good", inspection_notes: "", notes: "",
  });

  const [receiptItems, setReceiptItems] = useState([{
    item_id: "", batch_number: "", manufacture_date: "", expiry_date: "",
    asset_code: "", serial_number: "", model_number: "", warranty_expiry: "",
    received_quantity: "1", accepted_quantity: "1", rejected_quantity: "0",
    unit_cost: "0", condition_status: "Good", inspection_notes: "",
  }]);

  const currentStore = STORE_TYPES.find((s) => s.value === storeType);
  const currentSection = SECTIONS.find((s) => s.value === section);
  const selectedItem = items.find((i) => String(i.id) === String(receiptForm.item_id));

  const notify = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);
  };

  async function loadStoreData() {
    setLoading(true);
    setMessage("");

    const [itemResult, supplierResult, receiptResult, binResult, stockResult, wasteResult, balanceResult, inventoryResult, inventoryBalanceResult] = await Promise.all([
      supabase.from("pharmacy_store_items")
        .select("*").eq("store_type", storeType)
        .eq("is_active", true).order("item_name"),
      supabase.from("pharmacy_store_suppliers")
        .select("*").eq("is_active", true).order("supplier_name"),
      supabase.from("pharmacy_store_receipts")
        .select("*").eq("store_type", storeType)
        .order("created_at", { ascending: false }).limit(100),
      supabase.from("pharmacy_store_bin_card")
        .select("*").eq("store_type", storeType)
        .order("movement_date", { ascending: true }),
      supabase.from("pharmacy_store_stock_status")
        .select("*").eq("store_type", storeType)
        .order("item_name", { ascending: true }),
      supabase.from("pharmacy_store_waste_records")
        .select("*").eq("store_type", storeType)
        .order("created_at", { ascending: false }),
      supabase.from("pharmacy_store_stock_balances")
        .select("*").eq("store_type", storeType)
        .gt("stock_quantity", 0).order("item_name", { ascending: true }),
      supabase.from("pharmacy_store_inventory_counts")
        .select("*").eq("store_type", storeType)
        .order("created_at", { ascending: false }).limit(100),
      supabase.from("pharmacy_store_stock_balances")
        .select("*").eq("store_type", storeType)
        .order("item_name", { ascending: true }),
    ]);

    if (itemResult.error) notify(itemResult.error.message, "error");
    else setItems(itemResult.data || []);

    if (supplierResult.error) notify(supplierResult.error.message, "error");
    else setSuppliers(supplierResult.data || []);

    if (binResult.error) {
      setBinCardRows([]);
      notify("Bin Card could not load: " + binResult.error.message, "error");
    } else {
      setBinCardRows(binResult.data || []);
    }

    if (stockResult.error) {
      setStockStatusRows([]);
      notify("Stock Status could not load: " + stockResult.error.message, "error");
    } else {
      setStockStatusRows(stockResult.data || []);
    }

    if (wasteResult.error) {
      setWasteRecords([]);
      notify("Waste records could not load: " + wasteResult.error.message, "error");
    } else {
      setWasteRecords(wasteResult.data || []);
    }

    if (balanceResult.error) {
      setWasteBalances([]);
      notify("Stock balances for waste could not load: " + balanceResult.error.message, "error");
    } else {
      setWasteBalances(balanceResult.data || []);
    }

    if (inventoryBalanceResult.error) {
      setInventoryBalances([]);
      notify("Inventory stock balances could not load: " + inventoryBalanceResult.error.message, "error");
    } else {
      setInventoryBalances(inventoryBalanceResult.data || []);
    }

    if (inventoryResult.error) {
      setInventoryCounts([]);
      setInventoryCountItems([]);
      notify("Inventory counts could not load: " + inventoryResult.error.message, "error");
    } else {
      const countRows = inventoryResult.data || [];
      setInventoryCounts(countRows);
      if (countRows.length) {
        const countIds = countRows.map((row) => row.id);
        const countItemResult = await supabase
          .from("pharmacy_store_inventory_count_items")
          .select("*").in("inventory_count_id", countIds);
        if (countItemResult.error) {
          setInventoryCountItems([]);
          notify("Inventory count details could not load: " + countItemResult.error.message, "error");
        } else {
          setInventoryCountItems(countItemResult.data || []);
        }
      } else {
        setInventoryCountItems([]);
      }
    }

    if (receiptResult.error) notify(receiptResult.error.message, "error");
    else {
      const rows = receiptResult.data || [];
      setReceipts(rows);

      if (rows.length) {
        const ids = rows.map((r) => r.id);
        const lineResult = await supabase
          .from("pharmacy_store_receipt_items")
          .select("*").in("receipt_id", ids);

        if (lineResult.error) notify(lineResult.error.message, "error");
        else {
          const grouped = {};
          (lineResult.data || []).forEach((line) => {
            if (!grouped[line.receipt_id]) grouped[line.receipt_id] = [];
            grouped[line.receipt_id].push(line);
          });
          setReceiptLines(grouped);
        }
      } else {
        setReceiptLines({});
      }
    }

    setLoading(false);
  }

  useEffect(() => {
    loadStoreData();
  }, [storeType]);

  function updateReceipt(field, value) {
    setReceiptForm((old) => ({ ...old, [field]: value }));
  }

  function updateReceiptLine(index, field, value) {
    setReceiptItems((old) => old.map((line, i) =>
      i === index ? { ...line, [field]: value } : line
    ));
  }

  function addReceiptLine() {
    setReceiptItems((old) => [...old, {
      item_id: "", batch_number: "", manufacture_date: "", expiry_date: "",
      asset_code: "", serial_number: "", model_number: "", warranty_expiry: "",
      received_quantity: "1", accepted_quantity: "1", rejected_quantity: "0",
      unit_cost: "0", condition_status: "Good", inspection_notes: "",
    }]);
  }

  function removeReceiptLine(index) {
    setReceiptItems((old) => old.filter((_, i) => i !== index));
  }

  function updateItem(field, value) {
    setItemForm((old) => ({ ...old, [field]: value }));
  }

  async function saveNewItem(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const payload = {
      store_type: storeType,
      item_code: itemForm.item_code.trim(),
      item_name: itemForm.item_name.trim(),
      generic_name: itemForm.generic_name.trim() || null,
      category: itemForm.category.trim() || null,
      unit_of_measure: itemForm.unit_of_measure.trim(),
      manufacturer: itemForm.manufacturer.trim() || null,
      minimum_stock: Number(itemForm.minimum_stock || 0),
      maximum_stock: Number(itemForm.maximum_stock || 0),
      reorder_level: Number(itemForm.reorder_level || 0),
      tracks_batch: storeType === "Equipment" ? false : itemForm.tracks_batch,
      tracks_expiry: storeType === "Medical" ? itemForm.tracks_expiry : false,
      is_active: true,
    };

    const { data, error } = await supabase
      .from("pharmacy_store_items").insert(payload).select().single();

    if (error) {
      notify(`Item registration failed: ${error.message}`, "error");
    } else {
      setItems((old) => [...old, data].sort((a, b) => a.item_name.localeCompare(b.item_name)));
      setReceiptForm((old) => ({ ...old, item_id: String(data.id) }));
      setShowNewItem(false);
      setItemForm({
        item_code: "", item_name: "", generic_name: "", category: "",
        unit_of_measure: "", manufacturer: "", minimum_stock: "0",
        maximum_stock: "0", reorder_level: "0",
        tracks_batch: true, tracks_expiry: true,
      });
      notify("New store item registered successfully.");
    }

    setSaving(false);
  }

  async function saveReceipt(event) {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setMessage("");

    if (!receiptItems.length) {
      notify("Add at least one store item.", "error");
      setSaving(false);
      return;
    }

    const linePayloads = [];

    for (let index = 0; index < receiptItems.length; index++) {
      const line = receiptItems[index];
      const item = items.find((i) => String(i.id) === String(line.item_id));

      if (!item) {
        notify("Please select an item on line " + (index + 1) + ".", "error");
        setSaving(false);
        return;
      }

      const received = Number(line.received_quantity);
      const accepted = Number(line.accepted_quantity);
      const rejected = Number(line.rejected_quantity);
      const cost = Number(line.unit_cost);

      if (!Number.isFinite(received) || received <= 0 ||
          !Number.isFinite(accepted) || accepted < 0 ||
          !Number.isFinite(rejected) || rejected < 0 ||
          Math.abs(accepted + rejected - received) > 0.000001 ||
          !Number.isFinite(cost) || cost < 0) {
        notify("Check received, accepted, rejected quantities and unit cost on line " + (index + 1) + ".", "error");
        setSaving(false);
        return;
      }

      if (item.tracks_batch && !line.batch_number.trim()) {
        notify("Batch number is required on line " + (index + 1) + ".", "error");
        setSaving(false);
        return;
      }

      if (item.tracks_expiry && !line.expiry_date) {
        notify("Expiry date is required on line " + (index + 1) + ".", "error");
        setSaving(false);
        return;
      }

      if (line.manufacture_date && line.expiry_date &&
          line.expiry_date <= line.manufacture_date) {
        notify("Expiry Date must be later than Manufacture Date on line " + (index + 1) + ".", "error");
        setSaving(false);
        return;
      }

      linePayloads.push({
        item_id: Number(line.item_id),
        batch_number: line.batch_number.trim() || null,
        manufacture_date: line.manufacture_date || null,
        expiry_date: line.expiry_date || null,
        asset_code: line.asset_code.trim() || null,
        serial_number: line.serial_number.trim() || null,
        model_number: line.model_number.trim() || null,
        warranty_expiry: line.warranty_expiry || null,
        received_quantity: received,
        accepted_quantity: accepted,
        rejected_quantity: rejected,
        unit_cost: cost,
        condition_status: line.condition_status,
        inspection_notes: line.inspection_notes.trim() || null,
      });
    }

    const receiptPayload = {
      receipt_number: "RCV-" + Date.now(),
      store_type: storeType,
      supplier_id: receiptForm.supplier_id || null,
      purchase_order_number: receiptForm.purchase_order_number.trim() || null,
      grn_number: receiptForm.grn_number.trim() || null,
      invoice_number: receiptForm.invoice_number.trim() || null,
      delivery_note_number: receiptForm.delivery_note_number.trim() || null,
      received_date: receiptForm.received_date,
      inspection_status: "Pending",
      receipt_status: "Draft",
      received_by: user?.id || null,
      notes: receiptForm.notes.trim() || null,
    };

    const { data: receipt, error: receiptError } = await supabase
      .from("pharmacy_store_receipts")
      .insert(receiptPayload).select().single();

    if (receiptError) {
      notify("Receipt could not be created: " + receiptError.message, "error");
      setSaving(false);
      return;
    }

    const { error: lineError } = await supabase
      .from("pharmacy_store_receipt_items")
      .insert(linePayloads.map((line) => ({ ...line, receipt_id: receipt.id })));

    if (lineError) {
      notify(
        "Receipt " + receipt.id + " was created as Draft, but its item lines failed: " +
        lineError.message + ". Do not create another receipt until this draft is checked.",
        "error"
      );
    } else {
      notify("Receipt #" + receipt.id + " saved as Draft with " +
        linePayloads.length + " item line(s). Stock updates only after approval.");

      setReceiptForm((old) => ({
        ...old,
        supplier_id: "", purchase_order_number: "", grn_number: "",
        invoice_number: "", delivery_note_number: "",
        notes: "",
      }));

      setReceiptItems([{
        item_id: "", batch_number: "", manufacture_date: "", expiry_date: "",
        asset_code: "", serial_number: "", model_number: "", warranty_expiry: "",
        received_quantity: "1", accepted_quantity: "1", rejected_quantity: "0",
        unit_cost: "0", condition_status: "Good", inspection_notes: "",
      }]);

      await loadStoreData();
      setSection("entries-list");
    }

    setSaving(false);
  }

  function openInspection(receipt) {
    const lines = receiptLines[receipt.id] || [];
    setInspectionReceipt(receipt);
    setInspectionItems(lines.map((line) => ({ ...line })));
  }

  function updateInspectionLine(index, field, value) {
    setInspectionItems((old) => old.map((line, i) =>
      i === index ? { ...line, [field]: value } : line
    ));
  }

  async function submitInspection() {
    if (!inspectionReceipt || saving) return;
    if (!inspectionItems.length) {
      notify("This receipt has no item lines.", "error");
      return;
    }

    setSaving(true);
    setMessage("");

    for (let i = 0; i < inspectionItems.length; i++) {
      const line = inspectionItems[i];
      const received = Number(line.received_quantity);
      const accepted = Number(line.accepted_quantity);
      const rejected = Number(line.rejected_quantity);

      if (!Number.isFinite(accepted) || accepted < 0 ||
          !Number.isFinite(rejected) || rejected < 0 ||
          Math.abs(accepted + rejected - received) > 0.000001) {
        notify("Inspection quantities must add up to received quantity. Check line " + (i + 1) + ".", "error");
        setSaving(false);
        return;
      }
    }

    const acceptedTotal = inspectionItems.reduce((sum, line) => sum + Number(line.accepted_quantity), 0);
    const rejectedTotal = inspectionItems.reduce((sum, line) => sum + Number(line.rejected_quantity), 0);

    if (acceptedTotal === 0) {
      const { error } = await supabase.from("pharmacy_store_receipts")
        .update({ inspection_status: "Rejected", receipt_status: "Rejected" })
        .eq("id", inspectionReceipt.id);

      if (error) {
        notify("Could not reject receipt: " + error.message, "error");
        setSaving(false);
        return;
      }

      notify("Receipt inspection rejected. No stock was added.", "error");
      setInspectionReceipt(null);
      setInspectionItems([]);
      await loadStoreData();
      setSaving(false);
      return;
    }

    for (const line of inspectionItems) {
      const { error } = await supabase.from("pharmacy_store_receipt_items")
        .update({
          accepted_quantity: Number(line.accepted_quantity),
          rejected_quantity: Number(line.rejected_quantity),
          condition_status: line.condition_status,
          inspection_notes: line.inspection_notes || null,
        })
        .eq("id", line.id);

      if (error) {
        notify("Could not save inspection for item line #" + line.id + ": " + error.message, "error");
        setSaving(false);
        return;
      }
    }

    const inspectionStatus = rejectedTotal === 0 ? "Accepted" : "Partially Accepted";

    const { error: headerError } = await supabase.from("pharmacy_store_receipts")
      .update({
        inspection_status: inspectionStatus,
        receipt_status: "Submitted",
      })
      .eq("id", inspectionReceipt.id);

    if (headerError) {
      notify("Inspection lines saved, but submission failed: " + headerError.message, "error");
      setSaving(false);
      return;
    }

    notify("Inspection completed. Receipt submitted for approval.");
    setInspectionReceipt(null);
    setInspectionItems([]);
    await loadStoreData();
    setSaving(false);
  }

  async function approveReceipt(receipt) {
    if (saving) return;
    if (!window.confirm("Approve receipt #" + receipt.id + "? Only accepted quantities will enter stock.")) return;

    setSaving(true);
    setMessage("");

    const { data, error } = await supabase.rpc("approve_pharmacy_store_receipt", {
      p_receipt_id: Number(receipt.id),
    });

    if (error) {
      notify("Approval failed: " + error.message, "error");
    } else {
      notify(typeof data === "string" ? data : "Receipt approved successfully. Accepted quantities were posted to stock.");
      await loadStoreData();
    }

    setSaving(false);
  }

  async function saveWaste(event) {
    event.preventDefault();
    if (saving) return;

    const balance = wasteBalances[Number(wasteForm.balance_index)];
    const quantity = Number(wasteForm.quantity);

    if (!balance) {
      notify("Select the exact stock item, batch or asset.", "error");
      return;
    }
    if (!Number.isFinite(quantity) || quantity <= 0 || quantity > Number(balance.stock_quantity)) {
      notify("Waste quantity must be greater than zero and cannot exceed available stock.", "error");
      return;
    }
    if (!wasteForm.waste_reason.trim()) {
      notify("Enter the reason for waste.", "error");
      return;
    }

    setSaving(true);
    const payload = {
      store_type: storeType,
      waste_number: "WST-" + Date.now(),
      waste_date: wasteForm.waste_date,
      item_id: balance.item_id,
      batch_number: balance.batch_number || null,
      expiry_date: balance.expiry_date || null,
      asset_code: balance.asset_code || null,
      serial_number: balance.serial_number || null,
      quantity,
      waste_reason: wasteForm.waste_reason.trim(),
      notes: wasteForm.notes.trim() || null,
      waste_status: "Draft",
      recorded_by: user?.id || null,
    };

    const { error } = await supabase.from("pharmacy_store_waste_records").insert(payload);

    if (error) {
      notify("Waste record could not be saved: " + error.message, "error");
    } else {
      notify("Waste record saved as Draft. Stock has not been reduced.");
      setWasteForm({ balance_index: "", waste_date: new Date().toISOString().slice(0, 10), quantity: "1", waste_reason: "", notes: "" });
      await loadStoreData();
      setSection("waste-view");
    }
    setSaving(false);
  }

  async function submitWaste(record) {
    if (saving) return;
    if (!window.confirm("Submit waste record " + record.waste_number + " for approval?")) return;

    setSaving(true);
    const { data, error } = await supabase.rpc("submit_pharmacy_store_waste", {
      p_waste_id: Number(record.id),
    });

    if (error) notify("Waste submission failed: " + error.message, "error");
    else {
      notify(typeof data === "string" ? data : "Waste record submitted.");
      await loadStoreData();
    }
    setSaving(false);
  }

  async function approveWaste(record) {
    if (saving) return;
    if (!window.confirm("Approve " + record.waste_number + "? This will reduce the exact batch or asset stock.")) return;

    setSaving(true);
    const { data, error } = await supabase.rpc("approve_pharmacy_store_waste", {
      p_waste_id: Number(record.id),
    });

    if (error) notify("Waste approval failed: " + error.message, "error");
    else {
      notify(typeof data === "string" ? data : "Waste approved and stock adjusted.");
      await loadStoreData();
    }
    setSaving(false);
  }

  async function saveDiscrepancy(event) {
    event.preventDefault();
    if (saving) return;
    const balance = inventoryBalances[Number(discrepancyForm.balance_index)];
    const physical = Number(discrepancyForm.physical_quantity);
    if (!balance || Number(balance.item_id) !== Number(selectedBinItem?.id)) {
      notify("Select the exact batch or asset being counted.", "error");
      return;
    }
    if (!Number.isFinite(physical) || physical < 0) {
      notify("Physical quantity must be zero or greater.", "error");
      return;
    }
    const systemQuantity = Number(balance.stock_quantity || 0);
    const variance = physical - systemQuantity;
    if (Math.abs(variance) < 0.000001) {
      notify("There is no discrepancy: physical quantity equals system stock.", "error");
      return;
    }
    if (!discrepancyForm.variance_reason.trim()) {
      notify("Enter the reason for the stock discrepancy.", "error");
      return;
    }

    setSaving(true);
    const countNumber = "INV-" + Date.now();
    const { data: count, error: countError } = await supabase
      .from("pharmacy_store_inventory_counts")
      .insert({
        store_type: storeType,
        count_number: countNumber,
        count_date: discrepancyForm.count_date,
        count_type: "Spot Check",
        count_status: "Draft",
        counted_by: user?.id || null,
        notes: discrepancyForm.notes.trim() || null,
      })
      .select().single();

    if (countError) {
      notify("Discrepancy record could not be created: " + countError.message, "error");
      setSaving(false);
      return;
    }

    const { error: lineError } = await supabase
      .from("pharmacy_store_inventory_count_items")
      .insert({
        inventory_count_id: count.id,
        item_id: Number(balance.item_id),
        batch_number: balance.batch_number || null,
        expiry_date: balance.expiry_date || null,
        asset_code: balance.asset_code || null,
        serial_number: balance.serial_number || null,
        system_quantity: systemQuantity,
        physical_quantity: physical,
        variance,
        variance_reason: discrepancyForm.variance_reason.trim(),
        counted_by: user?.id || null,
        notes: discrepancyForm.notes.trim() || null,
      });

    if (lineError) {
      notify("Count #" + countNumber + " was created, but its discrepancy line failed: " + lineError.message + ". Check the Draft before creating another.", "error");
      setSaving(false);
      await loadStoreData();
      return;
    }

    notify("Discrepancy saved as Draft. Stock has not changed.");
    setDiscrepancyForm({
      balance_index: "", count_date: new Date().toISOString().slice(0, 10),
      physical_quantity: "", variance_reason: "", notes: "",
    });
    await loadStoreData();
    setBinManageTab("discrepancy-view");
    setSaving(false);
  }

  async function submitDiscrepancy(count) {
    if (saving) return;
    if (!window.confirm("Submit inventory count " + count.count_number + " for approval?")) return;
    setSaving(true);
    const { data, error } = await supabase.rpc("submit_pharmacy_store_inventory_count", {
      p_count_id: Number(count.id),
    });
    if (error) notify("Discrepancy submission failed: " + error.message, "error");
    else {
      notify(typeof data === "string" ? data : "Discrepancy submitted for approval.");
      await loadStoreData();
    }
    setSaving(false);
  }

  async function approveDiscrepancy(count) {
    if (saving) return;
    if (!window.confirm("Approve " + count.count_number + "? This posts the variance to the stock ledger.")) return;
    setSaving(true);
    const { data, error } = await supabase.rpc("approve_pharmacy_store_inventory_count", {
      p_count_id: Number(count.id),
    });
    if (error) notify("Discrepancy approval failed: " + error.message, "error");
    else {
      notify(typeof data === "string" ? data : "Discrepancy approved and stock adjusted.");
      await loadStoreData();
    }
    setSaving(false);
  }

  const field = (label, name, type = "text", required = false) => (
    <div>
      <label style={labelStyle}>{label}{required ? " *" : ""}</label>
      <input
        style={inputStyle}
        type={type}
        value={receiptForm[name]}
        required={required}
        onChange={(e) => updateReceipt(name, e.target.value)}
      />
    </div>
  );

  const selectField = (label, name, options, required = false) => (
    <div>
      <label style={labelStyle}>{label}{required ? " *" : ""}</label>
      <select
        style={inputStyle}
        value={receiptForm[name]}
        required={required}
        onChange={(e) => updateReceipt(name, e.target.value)}
      >
        <option value="">Select {label}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div style={{ padding: 20, color: "#172554", fontFamily: "Arial, sans-serif" }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: 12, marginBottom: 20
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24 }}>🏪 Pharmacy Store Management</h2>
          <p style={{ margin: "6px 0 0", color: "#64748b" }}>
            Store receipts, requests, issues, transfers and inventory.
          </p>
        </div>
        <strong style={{ background: "#eff6ff", color: "#1d4ed8", padding: "8px 13px", borderRadius: 20 }}>
          {currentStore?.icon} {currentStore?.label}
        </strong>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginBottom: 18 }}>
        {STORE_TYPES.map((store) => (
          <button key={store.value} type="button" onClick={() => setStoreType(store.value)}
            style={{
              padding: 15, borderRadius: 10, cursor: "pointer", textAlign: "left",
              border: storeType === store.value ? "2px solid #2563eb" : "1px solid #cbd5e1",
              background: storeType === store.value ? "#eff6ff" : "#fff",
              color: "#1e293b", fontWeight: 700,
            }}>
            <span style={{ fontSize: 22 }}>{store.icon}</span>
            <div style={{ marginTop: 6 }}>{store.label}</div>
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(155px,1fr))", gap: 8, marginBottom: 18 }}>
        {SECTIONS.map((item) => (
          <button key={item.value} type="button" onClick={() => setSection(item.value)}
            style={{
              padding: 12, borderRadius: 8, cursor: "pointer", textAlign: "left",
              border: section === item.value ? "1px solid #2563eb" : "1px solid #e2e8f0",
              background: section === item.value ? "#dbeafe" : "#fff",
              color: section === item.value ? "#1d4ed8" : "#334155",
              fontWeight: 700, minHeight: 52,
            }}>
            {item.icon} {item.label}
          </button>
        ))}
      </div>

      {message && (
        <div style={{
          padding: 12, marginBottom: 15, borderRadius: 8,
          background: messageType === "error" ? "#fee2e2" : "#dcfce7",
          color: messageType === "error" ? "#991b1b" : "#166534",
        }}>{message}</div>
      )}

      <div style={{ background: "#fff", border: "1px solid #dbe3ee", borderRadius: 12, padding: 20, minHeight: 260 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div>
            <h3 style={{ margin: "0 0 6px", fontSize: 20 }}>{currentSection?.icon} {currentSection?.label}</h3>
            <p style={{ color: "#64748b", marginTop: 0 }}>{currentSection?.description}</p>
          </div>
          <button type="button" onClick={loadStoreData} style={{ ...primaryButton, background: "#475569" }}>
            ↻ Refresh
          </button>
        </div>

        {loading ? <p>Loading store records...</p> : null}

        {section === "entries" && (
          <>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
              <button type="button" onClick={() => setShowNewItem(!showNewItem)}
                style={{ ...primaryButton, background: showNewItem ? "#475569" : "#0f766e" }}>
                {showNewItem ? "Close New Item Form" : "+ Register New Store Item"}
              </button>
              <span style={{ alignSelf: "center", color: "#64748b", fontSize: 13 }}>
                Catalog items: {items.length} | Suppliers: {suppliers.length}
              </span>
            </div>

            {showNewItem && (
              <form onSubmit={saveNewItem} style={{ background: "#f8fafc", padding: 16, borderRadius: 9, marginBottom: 20 }}>
                <h4>Register New {currentStore?.label} Item</h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 12 }}>
                  {[
                    ["Item Code", "item_code", true],
                    ["Item Name", "item_name", true],
                    ["Generic Name", "generic_name"],
                    ["Category", "category"],
                    ["Unit of Measure", "unit_of_measure", true],
                    ["Manufacturer", "manufacturer"],
                    ["Minimum Stock", "minimum_stock"],
                    ["Maximum Stock", "maximum_stock"],
                    ["Reorder Level", "reorder_level"],
                  ].map(([label, name, required]) => (
                    <div key={name}>
                      <label style={labelStyle}>{label}{required ? " *" : ""}</label>
                      <input style={inputStyle} required={!!required}
                        type={["minimum_stock", "maximum_stock", "reorder_level"].includes(name) ? "number" : "text"}
                        min={["minimum_stock", "maximum_stock", "reorder_level"].includes(name) ? 0 : undefined}
                        value={itemForm[name]} onChange={(e) => updateItem(name, e.target.value)} />
                    </div>
                  ))}
                </div>
                {storeType !== "Equipment" && (
                  <div style={{ display: "flex", gap: 20, margin: "14px 0", flexWrap: "wrap" }}>
                    <label><input type="checkbox" checked={itemForm.tracks_batch}
                      onChange={(e) => updateItem("tracks_batch", e.target.checked)} /> Track batch / lot</label>
                    {storeType === "Medical" && (
                      <label><input type="checkbox" checked={itemForm.tracks_expiry}
                        onChange={(e) => updateItem("tracks_expiry", e.target.checked)} /> Track expiry</label>
                    )}
                  </div>
                )}
                <button disabled={saving} style={primaryButton}> {saving ? "Saving..." : "Save Store Item"} </button>
              </form>
            )}

            <form onSubmit={saveReceipt}>
              <h4 style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: 9 }}>New Goods Receipt (Draft)</h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 12 }}>
                {selectField("Supplier", "supplier_id", suppliers.map((s) => ({ value: s.id, label: s.supplier_name })))}
                {field("Received Date", "received_date", "date", true)}
                {field("Purchase Order Number", "purchase_order_number")}
                {field("GRN Number", "grn_number")}
                {field("Invoice Number", "invoice_number")}
                {field("Delivery Note Number", "delivery_note_number")}
              </div>

              <div style={{ marginTop: 18, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                <h4 style={{ margin: 0 }}>Receipt Items ({receiptItems.length})</h4>
                <button type="button" onClick={addReceiptLine}
                  style={{ ...primaryButton, background: "#0f766e" }}>
                  + Add Item
                </button>
              </div>

              {receiptItems.map((line, index) => {
                const item = items.find((i) => String(i.id) === String(line.item_id));
                const lineInput = (label, name, type = "text", required = false) => (
                  <div>
                    <label style={labelStyle}>{label}{required ? " *" : ""}</label>
                    <input style={inputStyle} type={type} required={required}
                      min={type === "number" ? 0 : undefined}
                      step={type === "number" ? "any" : undefined}
                      value={line[name]}
                      onChange={(e) => updateReceiptLine(index, name, e.target.value)} />
                  </div>
                );

                return (
                  <div key={index} style={{
                    border: "1px solid #cbd5e1", borderRadius: 10,
                    padding: 15, marginTop: 12, background: "#f8fafc"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                      <strong>Item #{index + 1}</strong>
                      {receiptItems.length > 1 && (
                        <button type="button" onClick={() => removeReceiptLine(index)}
                          style={{ ...primaryButton, background: "#b91c1c", padding: "7px 12px" }}>
                          Remove Item
                        </button>
                      )}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 12, marginTop: 12 }}>
                      <div>
                        <label style={labelStyle}>Store Item *</label>
                        <select style={inputStyle} required value={line.item_id}
                          onChange={(e) => updateReceiptLine(index, "item_id", e.target.value)}>
                          <option value="">Select Store Item</option>
                          {items.map((i) => (
                            <option key={i.id} value={i.id}>{i.item_code} - {i.item_name}</option>
                          ))}
                        </select>
                      </div>

                      {item?.tracks_batch && lineInput("Batch / Lot Number", "batch_number", "text", true)}
                      {item?.tracks_expiry && lineInput("Expiry Date", "expiry_date", "date", true)}
                      {lineInput("Manufacture Date", "manufacture_date", "date")}
                      {storeType === "Equipment" && lineInput("Asset Code", "asset_code")}
                      {storeType === "Equipment" && lineInput("Serial Number", "serial_number")}
                      {storeType === "Equipment" && lineInput("Model Number", "model_number")}
                      {storeType === "Equipment" && lineInput("Warranty Expiry", "warranty_expiry", "date")}
                      {lineInput("Received Quantity", "received_quantity", "number", true)}
                      {lineInput("Accepted Quantity", "accepted_quantity", "number", true)}
                      {lineInput("Rejected Quantity", "rejected_quantity", "number", true)}
                      {lineInput("Unit Cost", "unit_cost", "number", true)}

                      <div>
                        <label style={labelStyle}>Condition</label>
                        <select style={inputStyle} value={line.condition_status}
                          onChange={(e) => updateReceiptLine(index, "condition_status", e.target.value)}>
                          <option value="Good">Good</option>
                          <option value="Damaged">Damaged</option>
                          <option value="Needs Repair">Needs Repair</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ marginTop: 12 }}>
                      <label style={labelStyle}>Inspection Notes</label>
                      <textarea style={{ ...inputStyle, minHeight: 55 }}
                        value={line.inspection_notes}
                        onChange={(e) => updateReceiptLine(index, "inspection_notes", e.target.value)} />
                    </div>
                  </div>
                );
              })}

              <div style={{ marginTop: 12 }}>
                <label style={labelStyle}>Receipt Notes</label>
                <textarea style={{ ...inputStyle, minHeight: 65 }} value={receiptForm.notes}
                  onChange={(e) => updateReceipt("notes", e.target.value)} />
              </div>

              <div style={{ marginTop: 18, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <button type="submit" disabled={saving || !items.length} style={primaryButton}>
                  {saving ? "Saving Receipt..." : "Save Receipt as Draft"}
                </button>
                {!items.length && <span style={{ color: "#b45309" }}>Register a store item first.</span>}
                <span style={{ fontSize: 12, color: "#64748b" }}>Draft receipts do not increase stock.</span>
              </div>
            </form>
          </>
        )}

        {section === "entries-list" && (
          <>
            <h4>Receipt Records ({receipts.length})</h4>

            {inspectionReceipt && (
              <div style={{ border: "1px solid #93c5fd", background: "#eff6ff", borderRadius: 10, padding: 16, marginBottom: 18 }}>
                <h4 style={{ marginTop: 0 }}>Inspect Receipt #{inspectionReceipt.id}</h4>
                <p style={{ color: "#475569", fontSize: 13 }}>
                  Confirm accepted and rejected quantities. Their total must equal the received quantity.
                </p>

                {inspectionItems.map((line, index) => {
                  const item = items.find((i) => String(i.id) === String(line.item_id));
                  return (
                    <div key={line.id} style={{ background: "#fff", border: "1px solid #cbd5e1", borderRadius: 8, padding: 12, marginBottom: 10 }}>
                      <strong>{item?.item_name || "Item #" + line.item_id}</strong>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 10, marginTop: 10 }}>
                        <label style={labelStyle}>Received
                          <input style={inputStyle} value={line.received_quantity} disabled />
                        </label>
                        <label style={labelStyle}>Accepted
                          <input style={inputStyle} type="number" min="0" max={line.received_quantity}
                            value={line.accepted_quantity}
                            onChange={(e) => updateInspectionLine(index, "accepted_quantity", e.target.value)} />
                        </label>
                        <label style={labelStyle}>Rejected
                          <input style={inputStyle} type="number" min="0" max={line.received_quantity}
                            value={line.rejected_quantity}
                            onChange={(e) => updateInspectionLine(index, "rejected_quantity", e.target.value)} />
                        </label>
                        <label style={labelStyle}>Condition
                          <select style={inputStyle} value={line.condition_status || "Good"}
                            onChange={(e) => updateInspectionLine(index, "condition_status", e.target.value)}>
                            {["Good", "Damaged", "Expired", "Poor", "Not Applicable"].map((v) => <option key={v} value={v}>{v}</option>)}
                          </select>
                        </label>
                      </div>
                      <label style={{ ...labelStyle, marginTop: 10 }}>Inspection Notes
                        <textarea style={inputStyle} rows="2" value={line.inspection_notes || ""}
                          onChange={(e) => updateInspectionLine(index, "inspection_notes", e.target.value)} />
                      </label>
                    </div>
                  );
                })}

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button type="button" disabled={saving} onClick={submitInspection} style={primaryButton}>
                    {saving ? "Saving..." : "Submit Inspection for Approval"}
                  </button>
                  <button type="button" disabled={saving} onClick={() => { setInspectionReceipt(null); setInspectionItems([]); }}
                    style={{ ...primaryButton, background: "#64748b" }}>Cancel</button>
                </div>
              </div>
            )}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#eff6ff", textAlign: "left" }}>
                    {["Receipt ID", "Date", "Supplier", "GRN", "Items", "Status", "Inspection", "Actions"].map((h) => (
                      <th key={h} style={{ padding: 10, borderBottom: "1px solid #cbd5e1" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {receipts.map((r) => {
                    const supplier = suppliers.find((s) => String(s.id) === String(r.supplier_id));
                    const lines = receiptLines[r.id] || [];
                    return (
                      <tr key={r.id}>
                        <td style={{ padding: 10, borderBottom: "1px solid #e2e8f0" }}>#{r.id}</td>
                        <td style={{ padding: 10, borderBottom: "1px solid #e2e8f0" }}>{r.received_date || "—"}</td>
                        <td style={{ padding: 10, borderBottom: "1px solid #e2e8f0" }}>{supplier?.supplier_name || "—"}</td>
                        <td style={{ padding: 10, borderBottom: "1px solid #e2e8f0" }}>{r.grn_number || "—"}</td>
                        <td style={{ padding: 10, borderBottom: "1px solid #e2e8f0" }}>
                          {lines.map((line) => {
                            const item = items.find((i) => String(i.id) === String(line.item_id));
                            return <div key={line.id}>{item?.item_name || `Item #${line.item_id}`} — Qty: {line.received_quantity}, Accepted: {line.accepted_quantity}</div>;
                          })}
                          {!lines.length && "No item lines"}
                        </td>
                        <td style={{ padding: 10, borderBottom: "1px solid #e2e8f0" }}>
                          <strong style={{ color: r.receipt_status === "Approved" ? "#15803d" : "#b45309" }}>{r.receipt_status}</strong>
                        </td>
                        <td style={{ padding: 10, borderBottom: "1px solid #e2e8f0" }}>{r.inspection_status}</td>
                        <td style={{ padding: 10, borderBottom: "1px solid #e2e8f0", minWidth: 145 }}>
                          {r.receipt_status === "Draft" && lines.length > 0 && (
                            <button type="button" disabled={saving} onClick={() => openInspection(r)}
                              style={{ ...primaryButton, padding: "7px 10px", marginBottom: 5 }}>
                              Inspect
                            </button>
                          )}
                          {r.receipt_status === "Submitted" && (
                            <button type="button" disabled={saving} onClick={() => approveReceipt(r)}
                              style={{ ...primaryButton, background: "#15803d", padding: "7px 10px" }}>
                              Approve Receipt
                            </button>
                          )}
                          {r.receipt_status === "Draft" && !lines.length && (
                            <span style={{ color: "#b45309" }}>No item lines</span>
                          )}
                          {r.receipt_status === "Approved" && (
                            <span style={{ color: "#15803d", fontWeight: 700 }}>Completed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {!receipts.length && <tr><td colSpan="8" style={{ padding: 20, textAlign: "center", color: "#64748b" }}>No receipt records found for this store.</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}

        {section === "bin-card" && (
          <div>
            {!selectedBinItem ? (
              <>
                <h4>{currentStore?.label} — Medicine / Item Bin Card</h4>
                <p style={{ color: "#64748b" }}>Select an item and open Manage to view its bin card and related functions.</p>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 750 }}>
                    <thead>
                      <tr style={{ background: "#eff6ff", textAlign: "left" }}>
                        {["Item Code", "Item Name", "Category", "Unit", "On Hand", "Stock Status", "Action"].map((h) => (
                          <th key={h} style={{ padding: 10, borderBottom: "1px solid #cbd5e1" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => {
                        const stock = stockStatusRows.find((r) => Number(r.item_id) === Number(item.id));
                        return (
                          <tr key={item.id}>
                            <td style={{ padding: 10, borderBottom: "1px solid #e2e8f0" }}>{item.item_code}</td>
                            <td style={{ padding: 10, borderBottom: "1px solid #e2e8f0", fontWeight: 700 }}>{item.item_name}</td>
                            <td style={{ padding: 10, borderBottom: "1px solid #e2e8f0" }}>{item.category || "—"}</td>
                            <td style={{ padding: 10, borderBottom: "1px solid #e2e8f0" }}>{item.unit_of_measure || "—"}</td>
                            <td style={{ padding: 10, borderBottom: "1px solid #e2e8f0", textAlign: "right" }}>{Number(stock?.stock_on_hand || 0).toLocaleString()}</td>
                            <td style={{ padding: 10, borderBottom: "1px solid #e2e8f0" }}>{stock?.stock_status || "No Stock"}</td>
                            <td style={{ padding: 10, borderBottom: "1px solid #e2e8f0" }}>
                              <button type="button" onClick={() => { setSelectedBinItem(item); setBinManageTab("view"); }}
                                style={{ ...primaryButton, padding: "7px 14px" }}>Manage</button>
                            </td>
                          </tr>
                        );
                      })}
                      {!items.length && <tr><td colSpan={7} style={{ padding: 20, textAlign: "center" }}>No items registered in this store.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <div>
                    <h4 style={{ marginBottom: 4 }}>{selectedBinItem.item_name} — Manage</h4>
                    <p style={{ marginTop: 0, color: "#64748b" }}>Code: {selectedBinItem.item_code} | {selectedBinItem.unit_of_measure || ""}</p>
                  </div>
                  <button type="button" onClick={() => setSelectedBinItem(null)}
                    style={{ ...primaryButton, background: "#64748b" }}>← Back to Item List</button>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "16px 0" }}>
                  {[
                    ["view", "View"],
                    ["top-transactions", "Top Transactions"],
                    ["waste-record", "Waste Record"],
                    ["waste-view", "Waste View"],
                    ["discrepancy-record", "Discrepancy Record"],
                    ["discrepancy-view", "Discrepancy View"],
                  ].map(([key, label]) => (
                    <button key={key} type="button" onClick={() => setBinManageTab(key)}
                      style={{
                        ...primaryButton,
                        background: binManageTab === key ? "#1d4ed8" : "#e2e8f0",
                        color: binManageTab === key ? "#fff" : "#1e293b",
                      }}>{label}</button>
                  ))}
                </div>

                {binManageTab === "view" && (
                  <div style={{ overflowX: "auto" }}>
                    <h4>Bin Card — {selectedBinItem.item_name}</h4>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 950 }}>
                      <thead><tr style={{ background: "#eff6ff", textAlign: "left" }}>
                        {["Date", "Movement", "Reference", "Batch", "Expiry", "Qty In", "Qty Out", "Balance", "Notes"].map((h) => (
                          <th key={h} style={{ padding: 10, borderBottom: "1px solid #cbd5e1" }}>{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {binCardRows.filter((r) => Number(r.item_id) === Number(selectedBinItem.id)).map((row) => (
                          <tr key={row.movement_id}>
                            <td style={{ padding: 9 }}>{row.movement_date ? new Date(row.movement_date).toLocaleString() : "—"}</td>
                            <td style={{ padding: 9 }}>{row.movement_type}</td>
                            <td style={{ padding: 9 }}>{row.reference_number || "—"}</td>
                            <td style={{ padding: 9 }}>{row.batch_number || "—"}</td>
                            <td style={{ padding: 9 }}>{row.expiry_date || "—"}</td>
                            <td style={{ padding: 9 }}>{Number(row.quantity_in || 0).toLocaleString()}</td>
                            <td style={{ padding: 9 }}>{Number(row.quantity_out || 0).toLocaleString()}</td>
                            <td style={{ padding: 9, fontWeight: 700 }}>{Number(row.running_balance || 0).toLocaleString()}</td>
                            <td style={{ padding: 9 }}>{row.notes || "—"}</td>
                          </tr>
                        ))}
                        {!binCardRows.some((r) => Number(r.item_id) === Number(selectedBinItem.id)) &&
                          <tr><td colSpan={9} style={{ padding: 20, textAlign: "center" }}>No transactions for this item.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                )}

                {binManageTab === "top-transactions" && (
                  <div style={{ overflowX: "auto" }}>
                    <h4>Top Transactions — {selectedBinItem.item_name}</h4>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead><tr style={{ background: "#eff6ff", textAlign: "left" }}>
                        {["Date", "Transaction", "Reference", "Batch", "Qty In", "Qty Out"].map((h) => <th key={h} style={{ padding: 10 }}>{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {[...binCardRows].filter((r) => Number(r.item_id) === Number(selectedBinItem.id))
                          .sort((a, b) => new Date(b.movement_date) - new Date(a.movement_date)).map((row) => (
                            <tr key={row.movement_id}>
                              <td style={{ padding: 9 }}>{row.movement_date ? new Date(row.movement_date).toLocaleString() : "—"}</td>
                              <td style={{ padding: 9 }}>{row.movement_type}</td>
                              <td style={{ padding: 9 }}>{row.reference_number || "—"}</td>
                              <td style={{ padding: 9 }}>{row.batch_number || "—"}</td>
                              <td style={{ padding: 9 }}>{Number(row.quantity_in || 0).toLocaleString()}</td>
                              <td style={{ padding: 9 }}>{Number(row.quantity_out || 0).toLocaleString()}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {binManageTab === "discrepancy-record" && (
                  <form onSubmit={saveDiscrepancy} style={{ padding: 16, background: "#f8fafc", borderRadius: 8, maxWidth: 850 }}>
                    <h4>Discrepancy Record — {selectedBinItem.item_name}</h4>
                    <p style={{ color: "#64748b" }}>Record a physical spot count against the exact batch or asset. Stock changes only after approval.</p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
                      <div>
                        <label style={labelStyle}>Batch / Asset / Serial *</label>
                        <select required style={inputStyle} value={discrepancyForm.balance_index}
                          onChange={(e) => setDiscrepancyForm((old) => ({ ...old, balance_index: e.target.value, physical_quantity: "" }))}>
                          <option value="">Select stock batch or asset</option>
                          {inventoryBalances.map((b, index) => ({ b, index }))
                            .filter(({ b }) => Number(b.item_id) === Number(selectedBinItem.id))
                            .map(({ b, index }) => (
                              <option key={index} value={index}>
                                {b.batch_number || b.asset_code || b.serial_number || "Unidentified stock"} | System: {Number(b.stock_quantity || 0).toLocaleString()}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Count Date *</label>
                        <input required type="date" style={inputStyle} value={discrepancyForm.count_date}
                          onChange={(e) => setDiscrepancyForm((old) => ({ ...old, count_date: e.target.value }))} />
                      </div>
                      <div>
                        <label style={labelStyle}>System Quantity</label>
                        <input readOnly style={{ ...inputStyle, background: "#e2e8f0" }}
                          value={discrepancyForm.balance_index !== "" && inventoryBalances[Number(discrepancyForm.balance_index)]
                            ? Number(inventoryBalances[Number(discrepancyForm.balance_index)].stock_quantity || 0)
                            : ""} />
                      </div>
                      <div>
                        <label style={labelStyle}>Physical Quantity *</label>
                        <input required type="number" min="0" step="any" style={inputStyle}
                          value={discrepancyForm.physical_quantity}
                          onChange={(e) => setDiscrepancyForm((old) => ({ ...old, physical_quantity: e.target.value }))} />
                      </div>
                      <div>
                        <label style={labelStyle}>Variance</label>
                        <input readOnly style={{ ...inputStyle, background: "#e2e8f0" }}
                          value={discrepancyForm.balance_index !== "" && discrepancyForm.physical_quantity !== "" && inventoryBalances[Number(discrepancyForm.balance_index)]
                            ? (Number(discrepancyForm.physical_quantity) - Number(inventoryBalances[Number(discrepancyForm.balance_index)].stock_quantity || 0)).toLocaleString()
                            : ""} />
                      </div>
                      <div>
                        <label style={labelStyle}>Reason for Discrepancy *</label>
                        <select required style={inputStyle} value={discrepancyForm.variance_reason}
                          onChange={(e) => setDiscrepancyForm((old) => ({ ...old, variance_reason: e.target.value }))}>
                          <option value="">Select reason</option>
                          {["Counting Error", "Unrecorded Issue", "Unrecorded Receipt", "Damage", "Loss", "Data Entry Error", "Other"].map((reason) => (
                            <option key={reason} value={reason}>{reason}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <label style={labelStyle}>Notes / Explanation</label>
                      <textarea rows="3" style={inputStyle} value={discrepancyForm.notes}
                        onChange={(e) => setDiscrepancyForm((old) => ({ ...old, notes: e.target.value }))} />
                    </div>
                    <button type="submit" disabled={saving} style={{ ...primaryButton, marginTop: 14, opacity: saving ? 0.6 : 1 }}>
                      {saving ? "Saving..." : "Save Discrepancy as Draft"}
                    </button>
                  </form>
                )}

                {binManageTab === "discrepancy-view" && (
                  <div style={{ overflowX: "auto" }}>
                    <h4>Discrepancy History — {selectedBinItem.item_name}</h4>
                    <p style={{ color: "#64748b" }}>Submitted counts require approval. Only approved variances are posted to the stock ledger.</p>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 1050 }}>
                      <thead><tr style={{ background: "#eff6ff", textAlign: "left" }}>
                        {["Count No.", "Date", "Batch / Asset", "System Qty", "Physical Qty", "Variance", "Reason", "Status", "Action"].map((h) => (
                          <th key={h} style={{ padding: 10, borderBottom: "1px solid #cbd5e1" }}>{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {inventoryCounts.filter((count) => inventoryCountItems.some((line) =>
                          Number(line.inventory_count_id) === Number(count.id) && Number(line.item_id) === Number(selectedBinItem.id)
                        )).map((count) => {
                          const lines = inventoryCountItems.filter((line) =>
                            Number(line.inventory_count_id) === Number(count.id) && Number(line.item_id) === Number(selectedBinItem.id)
                          );
                          return lines.map((line) => (
                            <tr key={line.id}>
                              <td style={{ padding: 9, borderBottom: "1px solid #e2e8f0" }}>{count.count_number}</td>
                              <td style={{ padding: 9, borderBottom: "1px solid #e2e8f0" }}>{count.count_date}</td>
                              <td style={{ padding: 9, borderBottom: "1px solid #e2e8f0" }}>{line.batch_number || line.asset_code || line.serial_number || "—"}</td>
                              <td style={{ padding: 9, borderBottom: "1px solid #e2e8f0", textAlign: "right" }}>{Number(line.system_quantity || 0).toLocaleString()}</td>
                              <td style={{ padding: 9, borderBottom: "1px solid #e2e8f0", textAlign: "right" }}>{Number(line.physical_quantity || 0).toLocaleString()}</td>
                              <td style={{ padding: 9, borderBottom: "1px solid #e2e8f0", textAlign: "right", fontWeight: 700, color: Number(line.variance) < 0 ? "#b91c1c" : "#15803d" }}>{Number(line.variance || 0).toLocaleString()}</td>
                              <td style={{ padding: 9, borderBottom: "1px solid #e2e8f0" }}>{line.variance_reason || "—"}</td>
                              <td style={{ padding: 9, borderBottom: "1px solid #e2e8f0", fontWeight: 700 }}>{count.count_status}</td>
                              <td style={{ padding: 9, borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>
                                {count.count_status === "Draft" && (
                                  <button type="button" disabled={saving} onClick={() => submitDiscrepancy(count)}
                                    style={{ ...primaryButton, padding: "7px 10px" }}>Submit</button>
                                )}
                                {count.count_status === "Submitted" && (
                                  <button type="button" disabled={saving} onClick={() => approveDiscrepancy(count)}
                                    style={{ ...primaryButton, background: "#15803d", padding: "7px 10px" }}>Approve</button>
                                )}
                                {count.count_status === "Approved" && <span style={{ color: "#15803d", fontWeight: 700 }}>Completed</span>}
                                {["Rejected", "Adjusted"].includes(count.count_status) && <span>{count.count_status}</span>}
                              </td>
                            </tr>
                          ));
                        })}
                        {!inventoryCountItems.some((line) => Number(line.item_id) === Number(selectedBinItem.id)) && (
                          <tr><td colSpan={9} style={{ padding: 20, textAlign: "center", color: "#64748b" }}>No discrepancy records for this item.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {section === "bin-card" && selectedBinItem && binManageTab === "waste-record" && (
          <form onSubmit={saveWaste} style={{ maxWidth: 760 }}>
            <h4>{currentStore?.label} — New Waste Record</h4>
            <p style={{ color: "#64748b" }}>Select the exact stock batch or asset. Stock is reduced only after approval.</p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
              <div>
                <label style={labelStyle}>Stock Item / Batch / Asset *</label>
                <select required style={inputStyle} value={wasteForm.balance_index}
                  onChange={(e) => setWasteForm((old) => ({ ...old, balance_index: e.target.value }))}>
                  <option value="">Select available stock</option>
                  {wasteBalances.map((b, index) => ({ b, index })).filter(({ b }) => Number(b.item_id) === Number(selectedBinItem?.id)).map(({ b, index }) => (
                    <option key={index} value={index}>
                      {b.item_name} | {b.batch_number || b.asset_code || b.serial_number || "No batch/asset"} | Available: {Number(b.stock_quantity).toLocaleString()} {b.unit_of_measure || ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Waste Date *</label>
                <input required type="date" style={inputStyle} value={wasteForm.waste_date}
                  onChange={(e) => setWasteForm((old) => ({ ...old, waste_date: e.target.value }))} />
              </div>

              <div>
                <label style={labelStyle}>Waste Quantity *</label>
                <input required type="number" min="0.001" step="any" style={inputStyle}
                  value={wasteForm.quantity}
                  onChange={(e) => setWasteForm((old) => ({ ...old, quantity: e.target.value }))} />
                {wasteForm.balance_index !== "" && wasteBalances[Number(wasteForm.balance_index)] && (
                  <small style={{ color: "#475569" }}>
                    Available: {Number(wasteBalances[Number(wasteForm.balance_index)].stock_quantity).toLocaleString()} {wasteBalances[Number(wasteForm.balance_index)].unit_of_measure || ""}
                  </small>
                )}
              </div>

              <div>
                <label style={labelStyle}>Waste Reason *</label>
                <select required style={inputStyle} value={wasteForm.waste_reason}
                  onChange={(e) => setWasteForm((old) => ({ ...old, waste_reason: e.target.value }))}>
                  <option value="">Select reason</option>
                  {["Expired", "Damaged", "Broken", "Lost", "Contaminated", "Other"].map((reason) => (
                    <option key={reason} value={reason}>{reason}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <label style={labelStyle}>Notes / Explanation</label>
              <textarea rows="3" style={inputStyle} value={wasteForm.notes}
                onChange={(e) => setWasteForm((old) => ({ ...old, notes: e.target.value }))} />
            </div>

            <button type="submit" disabled={saving} style={{ ...primaryButton, marginTop: 16, opacity: saving ? 0.6 : 1 }}>
              {saving ? "Saving..." : "Save Waste Record as Draft"}
            </button>
          </form>
        )}

        {section === "bin-card" && selectedBinItem && binManageTab === "waste-view" && (
          <div style={{ overflowX: "auto" }}>
            <h4>{currentStore?.label} — Waste Records</h4>
            <p style={{ color: "#64748b" }}>Only approved waste records reduce stock.</p>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 950 }}>
              <thead>
                <tr style={{ background: "#eff6ff", textAlign: "left" }}>
                  {["Waste No.", "Date", "Item", "Batch / Asset", "Expiry", "Quantity", "Reason", "Status", "Action"].map((h) => (
                    <th key={h} style={{ padding: 10, borderBottom: "1px solid #cbd5e1" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {wasteRecords.filter((record) => Number(record.item_id) === Number(selectedBinItem?.id)).map((record) => {
                  const item = items.find((i) => Number(i.id) === Number(record.item_id));
                  return (
                    <tr key={record.id}>
                      <td style={{ padding: 9, borderBottom: "1px solid #e2e8f0" }}>{record.waste_number}</td>
                      <td style={{ padding: 9, borderBottom: "1px solid #e2e8f0" }}>{record.waste_date}</td>
                      <td style={{ padding: 9, borderBottom: "1px solid #e2e8f0" }}>{item?.item_name || ("Item #" + record.item_id)}</td>
                      <td style={{ padding: 9, borderBottom: "1px solid #e2e8f0" }}>{record.batch_number || record.asset_code || record.serial_number || "—"}</td>
                      <td style={{ padding: 9, borderBottom: "1px solid #e2e8f0" }}>{record.expiry_date || "—"}</td>
                      <td style={{ padding: 9, borderBottom: "1px solid #e2e8f0" }}>{Number(record.quantity).toLocaleString()}</td>
                      <td style={{ padding: 9, borderBottom: "1px solid #e2e8f0" }}>{record.waste_reason}</td>
                      <td style={{ padding: 9, borderBottom: "1px solid #e2e8f0", fontWeight: 700 }}>{record.waste_status}</td>
                      <td style={{ padding: 9, borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>
                        {record.waste_status === "Draft" && (
                          <button type="button" disabled={saving} onClick={() => submitWaste(record)}
                            style={{ ...primaryButton, padding: "7px 10px" }}>Submit</button>
                        )}
                        {record.waste_status === "Submitted" && (
                          <button type="button" disabled={saving} onClick={() => approveWaste(record)}
                            style={{ ...primaryButton, background: "#15803d", padding: "7px 10px" }}>Approve</button>
                        )}
                        {record.waste_status === "Approved" && <span style={{ color: "#15803d" }}>Completed</span>}
                      </td>
                    </tr>
                  );
                })}
                {!wasteRecords.length && (
                  <tr><td colSpan={9} style={{ padding: 20, textAlign: "center", color: "#64748b" }}>No waste records found for this store.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {section === "stock-status" && (
          <div style={{ overflowX: "auto" }}>
            <h4>{currentStore?.label} — Stock Status</h4>
            <p style={{ color: "#64748b" }}>Current stock levels, reorder points, expired and near-expiry quantities.</p>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 1050 }}>
              <thead>
                <tr style={{ background: "#eff6ff", textAlign: "left" }}>
                  {["Item", "Code", "Category", "Unit", "Minimum", "Maximum", "Reorder Level", "On Hand", "Expired", "Near Expiry", "Status"].map((h) => (
                    <th key={h} style={{ padding: 10, borderBottom: "1px solid #cbd5e1" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stockStatusRows.map((row) => (
                  <tr key={row.item_id}>
                    <td style={{ padding: 9, borderBottom: "1px solid #e2e8f0", fontWeight: 700 }}>{row.item_name || "—"}</td>
                    <td style={{ padding: 9, borderBottom: "1px solid #e2e8f0" }}>{row.item_code || "—"}</td>
                    <td style={{ padding: 9, borderBottom: "1px solid #e2e8f0" }}>{row.category || "—"}</td>
                    <td style={{ padding: 9, borderBottom: "1px solid #e2e8f0" }}>{row.unit_of_measure || "—"}</td>
                    <td style={{ padding: 9, borderBottom: "1px solid #e2e8f0", textAlign: "right" }}>{Number(row.minimum_stock || 0).toLocaleString()}</td>
                    <td style={{ padding: 9, borderBottom: "1px solid #e2e8f0", textAlign: "right" }}>{Number(row.maximum_stock || 0).toLocaleString()}</td>
                    <td style={{ padding: 9, borderBottom: "1px solid #e2e8f0", textAlign: "right" }}>{Number(row.reorder_level || 0).toLocaleString()}</td>
                    <td style={{ padding: 9, borderBottom: "1px solid #e2e8f0", textAlign: "right", fontWeight: 700 }}>{Number(row.stock_on_hand || 0).toLocaleString()}</td>
                    <td style={{ padding: 9, borderBottom: "1px solid #e2e8f0", textAlign: "right" }}>{Number(row.expired_stock || 0).toLocaleString()}</td>
                    <td style={{ padding: 9, borderBottom: "1px solid #e2e8f0", textAlign: "right" }}>{Number(row.near_expiry_stock || 0).toLocaleString()}</td>
                    <td style={{ padding: 9, borderBottom: "1px solid #e2e8f0" }}>
                      <span style={{ display: "inline-block", padding: "4px 8px", borderRadius: 12, background: /expired|out|critical/i.test(row.stock_status || "") ? "#fee2e2" : /low|reorder|near/i.test(row.stock_status || "") ? "#fef3c7" : "#dcfce7", color: /expired|out|critical/i.test(row.stock_status || "") ? "#991b1b" : /low|reorder|near/i.test(row.stock_status || "") ? "#92400e" : "#166534", fontWeight: 700 }}>
                        {row.stock_status || "—"}
                      </span>
                    </td>
                  </tr>
                ))}
                {!stockStatusRows.length && (
                  <tr><td colSpan={11} style={{ padding: 20, textAlign: "center", color: "#64748b" }}>No stock status records found for this store.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {!["entries", "entries-list", "bin-card", "stock-status", "waste-record", "waste-view"].includes(section) && (
          <div style={{ background: "#f8fafc", border: "1px dashed #cbd5e1", borderRadius: 9, padding: 18, color: "#475569" }}>
            <strong>{currentStore?.label} — {currentSection?.label}</strong>
            <p style={{ marginBottom: 0 }}>This workflow is next in the implementation sequence. Entries and receipt records are now connected to the database.</p>
          </div>
        )}
      </div>
    </div>
  );
}
