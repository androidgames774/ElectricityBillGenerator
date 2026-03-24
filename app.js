const STORAGE_KEY = 'tenant-electricity-bill-app-v3';

const state = {
  settings: {
    propertyName: 'Sample Commercial Building',
    unitPrice: 34,
    fixedCharge: 1600,
    sscAmount: 1979.03,
    dueDays: 14,
    billNotes: 'Please pay within the due period. Share proof of payment after transfer.'
  },
  rows: [],
  selectedTenantId: ''
};

const els = {
  propertyName: document.getElementById('propertyName'),
  unitPrice: document.getElementById('unitPrice'),
  fixedCharge: document.getElementById('fixedCharge'),
  sscAmount: document.getElementById('sscRate'),
  dueDays: document.getElementById('dueDays'),
  billNotes: document.getElementById('billNotes'),
  tbody: document.querySelector('#readingsTable tbody'),
  tenantPicker: document.getElementById('tenantPicker'),
  totalUnits: document.getElementById('totalUnits'),
  totalEnergy: document.getElementById('totalEnergy'),
  totalFixed: document.getElementById('totalFixed'),
  totalSsc: document.getElementById('totalSsc'),
  totalBilled: document.getElementById('totalBilled'),
  billProperty: document.getElementById('billProperty'),
  billTenantLine: document.getElementById('billTenantLine'),
  billIssueDate: document.getElementById('billIssueDate'),
  billDueDate: document.getElementById('billDueDate'),
  billStartDate: document.getElementById('billStartDate'),
  billEndDate: document.getElementById('billEndDate'),
  billMeterNo: document.getElementById('billMeterNo'),
  billStartReading: document.getElementById('billStartReading'),
  billEndReading: document.getElementById('billEndReading'),
  billUnits: document.getElementById('billUnits'),
  billUnitPrice: document.getElementById('billUnitPrice'),
  billEnergy: document.getElementById('billEnergy'),
  billFixedShare: document.getElementById('billFixedShare'),
  billSsc: document.getElementById('billSsc'),
  billTotal: document.getElementById('billTotal'),
  formulaEnergy: document.getElementById('formulaEnergy'),
  formulaFixed: document.getElementById('formulaFixed'),
  formulaSsc: document.getElementById('formulaSsc'),
  billNotesPreview: document.getElementById('billNotesPreview')
};

function currency(value) {
  return `Rs. ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function number(value) {
  return Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toISOString().slice(0, 10);
}

function addDays(dateStr, days) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  d.setDate(d.getDate() + Number(days || 0));
  return d.toISOString().slice(0, 10);
}

function getComputedRows() {
  const totalUnits = state.rows.reduce((sum, row) => sum + Math.max(0, Number(row.endReading || 0) - Number(row.startReading || 0)), 0);

  return state.rows.map((row) => {
    const units = Math.max(0, Number(row.endReading || 0) - Number(row.startReading || 0));
    const energyCharge = units * Number(state.settings.unitPrice || 0);
    const fixedShare = totalUnits > 0 ? Number(state.settings.fixedCharge || 0) * (units / totalUnits) : 0;
    const sscLevy = totalUnits > 0 ? Number(state.settings.sscAmount || 0) * (units / totalUnits) : 0;
    const totalDue = energyCharge + fixedShare + sscLevy;
    return { ...row, units, energyCharge, fixedShare, sscLevy, totalDue, totalUnits };
  });
}

function syncSettingsFromInputs() {
  state.settings.propertyName = els.propertyName.value.trim();
  state.settings.unitPrice = Number(els.unitPrice.value || 0);
  state.settings.fixedCharge = Number(els.fixedCharge.value || 0);
  state.settings.sscAmount = Number(els.sscAmount.value || 0);
  state.settings.dueDays = Number(els.dueDays.value || 0);
  state.settings.billNotes = els.billNotes.value.trim();
}

function renderSettings() {
  els.propertyName.value = state.settings.propertyName;
  els.unitPrice.value = state.settings.unitPrice;
  els.fixedCharge.value = state.settings.fixedCharge;
  els.sscAmount.value = state.settings.sscAmount;
  els.dueDays.value = state.settings.dueDays;
  els.billNotes.value = state.settings.billNotes;
}

function createEmptyRow() {
  return {
    tenantId: '',
    tenantName: '',
    unit: '',
    meterNo: '',
    startDate: '',
    startReading: '',
    endDate: '',
    endReading: ''
  };
}

function updateRowComputedDisplays() {
  const computedRows = getComputedRows();
  Array.from(els.tbody.querySelectorAll('tr')).forEach((tr, index) => {
    const row = computedRows[index];
    if (!row) return;
    tr.querySelector('[data-field="units"]').textContent = number(row.units);
    tr.querySelector('[data-field="energyCharge"]').textContent = currency(row.energyCharge);
    tr.querySelector('[data-field="fixedShare"]').textContent = currency(row.fixedShare);
    tr.querySelector('[data-field="sscLevy"]').textContent = currency(row.sscLevy);
    tr.querySelector('[data-field="totalDue"]').textContent = currency(row.totalDue);
  });
}

function renderTable() {
  els.tbody.innerHTML = '';

  if (!state.rows.length) {
    state.rows.push(createEmptyRow());
  }

  const computedRows = getComputedRows();
  computedRows.forEach((row, index) => {
    const tpl = document.getElementById('rowTemplate').content.cloneNode(true);
    const tr = tpl.querySelector('tr');

    tr.querySelectorAll('input[data-field]').forEach((input) => {
      const field = input.dataset.field;
      input.value = row[field] ?? '';
      input.addEventListener('input', (e) => {
        state.rows[index][field] = e.target.value;
        syncSettingsFromInputs();
        updateRowComputedDisplays();
        renderSummary();
        renderPicker();
        renderBill();
      });
    });

    tr.querySelector('[data-field="units"]').textContent = number(row.units);
    tr.querySelector('[data-field="energyCharge"]').textContent = currency(row.energyCharge);
    tr.querySelector('[data-field="fixedShare"]').textContent = currency(row.fixedShare);
    tr.querySelector('[data-field="sscLevy"]').textContent = currency(row.sscLevy);
    tr.querySelector('[data-field="totalDue"]').textContent = currency(row.totalDue);

    tr.querySelector('[data-action="delete"]').addEventListener('click', () => {
      state.rows.splice(index, 1);
      if (state.selectedTenantId === row.tenantId) {
        state.selectedTenantId = state.rows[0]?.tenantId || '';
      }
      refresh();
    });

    els.tbody.appendChild(tr);
  });
}

function renderSummary() {
  const computedRows = getComputedRows();
  const totalUnits = computedRows.reduce((sum, row) => sum + row.units, 0);
  const totalEnergy = computedRows.reduce((sum, row) => sum + row.energyCharge, 0);
  const totalFixed = computedRows.reduce((sum, row) => sum + row.fixedShare, 0);
  const totalSsc = computedRows.reduce((sum, row) => sum + row.sscLevy, 0);
  const totalBilled = computedRows.reduce((sum, row) => sum + row.totalDue, 0);

  els.totalUnits.textContent = number(totalUnits);
  els.totalEnergy.textContent = currency(totalEnergy);
  els.totalFixed.textContent = currency(totalFixed);
  els.totalSsc.textContent = currency(totalSsc);
  els.totalBilled.textContent = currency(totalBilled);
}

function renderPicker() {
  const computedRows = getComputedRows();
  const validRows = computedRows.filter(r => r.tenantId || r.tenantName);

  if (!state.selectedTenantId && validRows[0]) {
    state.selectedTenantId = validRows[0].tenantId;
  }
  if (state.selectedTenantId && !validRows.find(r => r.tenantId === state.selectedTenantId)) {
    state.selectedTenantId = validRows[0]?.tenantId || '';
  }

  const currentOptions = Array.from(els.tenantPicker.options).map(opt => ({ value: opt.value, text: opt.textContent }));
  const nextOptions = validRows.map(row => ({
    value: row.tenantId,
    text: `${row.tenantId || '(No ID)'} - ${row.tenantName || 'Unnamed tenant'}`
  }));

  if (!nextOptions.length) {
    nextOptions.push({ value: '', text: 'No tenant rows yet' });
  }

  const sameOptions = currentOptions.length === nextOptions.length
    && currentOptions.every((opt, idx) => opt.value === nextOptions[idx].value && opt.text === nextOptions[idx].text);

  if (!sameOptions) {
    els.tenantPicker.innerHTML = '';
    nextOptions.forEach((item) => {
      const opt = document.createElement('option');
      opt.value = item.value;
      opt.textContent = item.text;
      els.tenantPicker.appendChild(opt);
    });
  }

  els.tenantPicker.value = state.selectedTenantId || nextOptions[0]?.value || '';
}

function renderBill() {
  const computedRows = getComputedRows();
  const row = computedRows.find(r => r.tenantId === state.selectedTenantId) || computedRows[0];
  const today = new Date().toISOString().slice(0, 10);

  els.billProperty.textContent = state.settings.propertyName || '-';
  if (!row) {
    els.billTenantLine.textContent = 'Add tenant readings to preview a bill.';
    return;
  }

  els.billTenantLine.textContent = `${row.tenantName || 'Unnamed tenant'} • ${row.unit || '-'} • ${row.tenantId || '-'}`;
  els.billIssueDate.textContent = today;
  els.billDueDate.textContent = formatDate(addDays(row.endDate, state.settings.dueDays));
  els.billStartDate.textContent = formatDate(row.startDate);
  els.billEndDate.textContent = formatDate(row.endDate);
  els.billMeterNo.textContent = row.meterNo || '-';
  els.billStartReading.textContent = number(row.startReading);
  els.billEndReading.textContent = number(row.endReading);
  els.billUnits.textContent = number(row.units);
  els.billUnitPrice.textContent = currency(state.settings.unitPrice);
  els.billEnergy.textContent = currency(row.energyCharge);
  els.billFixedShare.textContent = currency(row.fixedShare);
  els.billSsc.textContent = currency(row.sscLevy);
  els.billTotal.textContent = currency(row.totalDue);
  els.formulaEnergy.textContent = `Energy Charge = ${number(row.units)} × ${currency(state.settings.unitPrice)} = ${currency(row.energyCharge)}`;
  els.formulaFixed.textContent = `Fixed Share = ${currency(state.settings.fixedCharge)} × (${number(row.units)} / ${number(row.totalUnits)}) = ${currency(row.fixedShare)}`;
  els.formulaSsc.textContent = `SSC Levy Share = ${currency(state.settings.sscAmount)} × (${number(row.units)} / ${number(row.totalUnits)}) = ${currency(row.sscLevy)}`;
  els.billNotesPreview.textContent = state.settings.billNotes || '-';
}

function refresh() {
  syncSettingsFromInputs();
  renderTable();
  renderSummary();
  renderPicker();
  renderBill();
}

function saveToBrowser() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  alert('Saved in your browser.');
}

function loadFromBrowser() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;
  try {
    const saved = JSON.parse(raw);
    Object.assign(state.settings, saved.settings || {});
    state.rows = Array.isArray(saved.rows) ? saved.rows : [];
    state.selectedTenantId = saved.selectedTenantId || '';
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}

function loadSampleData() {
  state.settings = {
    propertyName: 'Sample Commercial Building',
    unitPrice: 34,
    fixedCharge: 1600,
    sscAmount: 1979.03,
    dueDays: 14,
    billNotes: 'Please pay within the due period. Share proof of payment after transfer.'
  };
  state.rows = [
    { tenantId: 'T001', tenantName: 'Ground Floor Shop', unit: 'GF-01', meterNo: 'MTR-001', startDate: '2026-02-19', startReading: 209822, endDate: '2026-03-20', endReading: 212045 },
    { tenantId: 'T002', tenantName: 'First Floor Office', unit: 'FF-02', meterNo: 'MTR-002', startDate: '2026-02-19', startReading: 87650, endDate: '2026-03-20', endReading: 89100 },
    { tenantId: 'T003', tenantName: 'Rear Office', unit: 'RO-03', meterNo: 'MTR-003', startDate: '2026-02-19', startReading: 43120, endDate: '2026-03-20', endReading: 44100 }
  ];
  state.selectedTenantId = 'T001';
  renderSettings();
  refresh();
}

function exportCsv() {
  const rows = getComputedRows();
  const header = ['Tenant ID','Tenant Name','Unit','Meter No.','Start Date','Start Reading','End Date','End Reading','Units','Energy Charge','Fixed Share','SSC Levy','Total Due'];
  const lines = [header.join(',')];
  rows.forEach((row) => {
    lines.push([
      row.tenantId,
      row.tenantName,
      row.unit,
      row.meterNo,
      row.startDate,
      row.startReading,
      row.endDate,
      row.endReading,
      row.units,
      row.energyCharge.toFixed(2),
      row.fixedShare.toFixed(2),
      row.sscLevy.toFixed(2),
      row.totalDue.toFixed(2)
    ].map((value) => `"${String(value ?? '').replaceAll('"','""')}"`).join(','));
  });
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'tenant-electricity-bills.csv';
  a.click();
  URL.revokeObjectURL(url);
}

document.getElementById('addRowBtn').addEventListener('click', () => {
  state.rows.push(createEmptyRow());
  refresh();
});

document.getElementById('saveBtn').addEventListener('click', saveToBrowser);
document.getElementById('loadSampleBtn').addEventListener('click', loadSampleData);
document.getElementById('exportCsvBtn').addEventListener('click', exportCsv);
document.getElementById('printBtn').addEventListener('click', () => window.print());

els.tenantPicker.addEventListener('change', (e) => {
  state.selectedTenantId = e.target.value;
  renderBill();
});

[els.propertyName, els.unitPrice, els.fixedCharge, els.sscAmount, els.dueDays, els.billNotes].forEach((el) => {
  el.addEventListener('input', () => {
    syncSettingsFromInputs();
    updateRowComputedDisplays();
    renderSummary();
    renderPicker();
    renderBill();
  });
});

if (!loadFromBrowser()) {
  loadSampleData();
} else {
  renderSettings();
  refresh();
}
