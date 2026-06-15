/**
 * جمعية الهدى لتحفيظ القرآن الكريم
 * الدورة الصيفية 2026
 * Main Application Script
 */

// ===================== DATA STORE =====================
const STORE_KEY = 'alhuda_2026_participants';
const SETTINGS_KEY = 'alhuda_2026_settings';

let participants = [];
let deleteTarget = null;
let currentFilter = 'all';

const GROUPS = {
  'ذكر': [
    'الزبير بن العوام رضي الله عنه',
    'عبد الله بن مسعود رضي الله عنه'
  ],
  'أنثى': [
    'أم المؤمنين عائشة رضي الله عنها',
    'أم المؤمنين أم سلمة رضي الله عنها'
  ]
};

const DEFAULT_REG_FEE = 100;
const DEFAULT_BUS_FEE = 300;

// ===================== INIT =====================
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  updateDashboard();
  calcFinance();
  updateGroups();
  setRegNum();
  renderList();
  renderBus();
  renderFinance();
  renderReports();
});

// ===================== STORAGE =====================
function loadData() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    participants = raw ? JSON.parse(raw) : [];
  } catch (e) {
    participants = [];
  }
}

function saveData() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(participants));
  } catch (e) {
    showToast('خطأ في حفظ البيانات', 'error');
  }
}

// ===================== NAVIGATION =====================
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const page = document.getElementById('page-' + name);
  if (page) page.classList.add('active');
  const nav = document.querySelector(`.nav-btn[onclick="showPage('${name}')"]`);
  if (nav) nav.classList.add('active');

  if (name === 'list') renderList();
  if (name === 'bus') renderBus();
  if (name === 'finance') { renderFinance(); setTimeout(drawCharts, 100); }
  if (name === 'reports') renderReports();
  if (name === 'home') updateDashboard();
  if (name === 'register') { resetForm(); setRegNum(); }

  window.scrollTo(0, 0);
}

// ===================== DASHBOARD =====================
function updateDashboard() {
  const total = participants.length;
  const males = participants.filter(p => p.gender === 'ذكر').length;
  const females = participants.filter(p => p.gender === 'أنثى').length;
  const busCount = participants.filter(p => p.bus === 'نعم').length;

  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-males').textContent = males;
  document.getElementById('stat-females').textContent = females;
  document.getElementById('stat-bus').textContent = busCount;

  renderRecentList();
}

function renderRecentList() {
  const container = document.getElementById('recent-list');
  const last5 = [...participants].reverse().slice(0, 5);

  if (last5.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <p>لا توجد تسجيلات بعد</p>
        <button onclick="showPage('register')" class="btn-primary">تسجيل مشارك جديد</button>
      </div>`;
    return;
  }

  container.innerHTML = last5.map(p => `
    <div class="recent-item">
      <div class="recent-avatar">${p.gender === 'ذكر' ? '👦' : '👧'}</div>
      <div class="recent-info">
        <div class="recent-name">${p.name}</div>
        <div class="recent-meta">${p.group} • ${p.level || 'غير محدد'}</div>
      </div>
      <div class="recent-regnum">${p.regNum}</div>
    </div>
  `).join('');
}

// ===================== REGISTRATION =====================
function setRegNum() {
  const editId = document.getElementById('edit-id').value;
  if (editId) return;
  const year = 2026;
  const next = participants.length + 1;
  const num = String(next).padStart(4, '0');
  document.getElementById('f-regnum').value = `${year}-${num}`;
}

function updateGroups() {
  const gender = document.querySelector('input[name="gender"]:checked')?.value;
  const select = document.getElementById('f-group');
  const current = select.value;
  select.innerHTML = '<option value="">-- اختر الحلقة --</option>';
  if (gender && GROUPS[gender]) {
    GROUPS[gender].forEach(g => {
      const opt = document.createElement('option');
      opt.value = g;
      opt.textContent = g;
      if (g === current) opt.selected = true;
      select.appendChild(opt);
    });
  } else {
    Object.values(GROUPS).flat().forEach(g => {
      const opt = document.createElement('option');
      opt.value = g;
      opt.textContent = g;
      if (g === current) opt.selected = true;
      select.appendChild(opt);
    });
  }
}

function calcAge() {
  const dob = document.getElementById('f-dob').value;
  if (!dob) { document.getElementById('f-age').value = ''; return; }
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  document.getElementById('f-age').value = age > 0 ? `${age} سنة` : 'أقل من سنة';
}

function calcFinance() {
  const regFee = parseFloat(document.getElementById('f-regfee').value) || 0;
  const busVal = document.querySelector('input[name="bus"]:checked')?.value;
  const busFee = busVal === 'نعم' ? DEFAULT_BUS_FEE : 0;
  const total = regFee + busFee;
  const paid = parseFloat(document.getElementById('f-paid').value) || 0;
  const remaining = Math.max(0, total - paid);

  document.getElementById('f-busfee').value = busFee;
  document.getElementById('f-total').value = total;
  document.getElementById('f-remaining').value = remaining;
}

function saveParticipant() {
  const name = document.getElementById('f-name').value.trim();
  const dob = document.getElementById('f-dob').value;
  const gender = document.querySelector('input[name="gender"]:checked')?.value;
  const group = document.getElementById('f-group').value;
  const guardian = document.getElementById('f-guardian').value.trim();
  const phone = document.getElementById('f-phone').value.trim();

  if (!name) { showToast('يرجى إدخال الاسم الكامل', 'error'); return; }
  if (!dob) { showToast('يرجى إدخال تاريخ الميلاد', 'error'); return; }
  if (!gender) { showToast('يرجى تحديد الجنس', 'error'); return; }
  if (!group) { showToast('يرجى اختيار الحلقة', 'error'); return; }
  if (!guardian) { showToast('يرجى إدخال اسم الولي', 'error'); return; }
  if (!phone) { showToast('يرجى إدخال هاتف الولي', 'error'); return; }

  const editId = document.getElementById('edit-id').value;
  const regNum = document.getElementById('f-regnum').value;
  const age = document.getElementById('f-age').value;
  const level = document.getElementById('f-level').value;
  const address = document.getElementById('f-address').value.trim();
  const bus = document.querySelector('input[name="bus"]:checked')?.value || 'لا';
  const regFee = parseFloat(document.getElementById('f-regfee').value) || 0;
  const busFee = parseFloat(document.getElementById('f-busfee').value) || 0;
  const total = parseFloat(document.getElementById('f-total').value) || 0;
  const paid = parseFloat(document.getElementById('f-paid').value) || 0;
  const remaining = parseFloat(document.getElementById('f-remaining').value) || 0;
  const notes = document.getElementById('f-notes').value.trim();
  const date = new Date().toLocaleDateString('ar-MA');

  const participant = {
    id: editId || Date.now().toString(),
    regNum,
    name,
    dob,
    age,
    gender,
    group,
    level,
    guardian,
    phone,
    address,
    bus,
    regFee,
    busFee,
    total,
    paid,
    remaining,
    notes,
    date
  };

  if (editId) {
    const idx = participants.findIndex(p => p.id === editId);
    if (idx !== -1) {
      participants[idx] = participant;
      showToast('تم تحديث بيانات المشارك بنجاح ✅', 'success');
    }
  } else {
    participants.push(participant);
    showToast('تم تسجيل المشارك بنجاح ✅', 'success');
    showReceipt(participant);
  }

  saveData();
  updateDashboard();
  resetForm();
  setRegNum();
}

function resetForm() {
  document.getElementById('edit-id').value = '';
  document.getElementById('f-regnum').value = '';
  document.getElementById('f-name').value = '';
  document.getElementById('f-dob').value = '';
  document.getElementById('f-age').value = '';
  document.querySelector('input[name="gender"][value="ذكر"]').checked = false;
  document.querySelector('input[name="gender"][value="أنثى"]').checked = false;
  document.getElementById('f-group').innerHTML = '<option value="">-- اختر الحلقة --</option>';
  document.getElementById('f-level').value = '';
  document.getElementById('f-guardian').value = '';
  document.getElementById('f-phone').value = '';
  document.getElementById('f-address').value = '';
  document.querySelector('input[name="bus"][value="لا"]').checked = true;
  document.getElementById('f-regfee').value = DEFAULT_REG_FEE;
  document.getElementById('f-busfee').value = 0;
  document.getElementById('f-total').value = '';
  document.getElementById('f-paid').value = 0;
  document.getElementById('f-remaining').value = '';
  document.getElementById('f-notes').value = '';
  document.getElementById('form-title').textContent = 'تسجيل مشارك جديد';
  updateGroups();
  calcFinance();
  setRegNum();
}

function editParticipant(id) {
  const p = participants.find(x => x.id === id);
  if (!p) return;

  showPage('register');
  document.getElementById('edit-id').value = p.id;
  document.getElementById('f-regnum').value = p.regNum;
  document.getElementById('f-name').value = p.name;
  document.getElementById('f-dob').value = p.dob;
  document.getElementById('f-age').value = p.age;

  const genderRadio = document.querySelector(`input[name="gender"][value="${p.gender}"]`);
  if (genderRadio) { genderRadio.checked = true; updateGroups(); }

  setTimeout(() => {
    document.getElementById('f-group').value = p.group;
  }, 50);

  document.getElementById('f-level').value = p.level;
  document.getElementById('f-guardian').value = p.guardian;
  document.getElementById('f-phone').value = p.phone;
  document.getElementById('f-address').value = p.address;

  const busRadio = document.querySelector(`input[name="bus"][value="${p.bus}"]`);
  if (busRadio) busRadio.checked = true;

  document.getElementById('f-regfee').value = p.regFee;
  document.getElementById('f-paid').value = p.paid;
  document.getElementById('f-notes').value = p.notes || '';

  calcFinance();
  document.getElementById('form-title').textContent = 'تعديل بيانات المشارك';
}

function askDelete(id) {
  deleteTarget = id;
  document.getElementById('confirm-modal').style.display = 'flex';
}

function confirmDelete() {
  if (!deleteTarget) return;
  participants = participants.filter(p => p.id !== deleteTarget);
  saveData();
  updateDashboard();
  renderList();
  renderBus();
  renderFinance();
  renderReports();
  closeConfirmModal();
  showToast('تم حذف المشارك بنجاح', 'success');
}

function closeConfirmModal() {
  deleteTarget = null;
  document.getElementById('confirm-modal').style.display = 'none';
}

// ===================== LIST =====================
let listFilter = { gender: 'all', search: '' };

function renderList() {
  const tbody = document.getElementById('table-body');
  const empty = document.getElementById('list-empty');
  let filtered = getFilteredList();

  if (filtered.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';
  tbody.innerHTML = filtered.map((p, i) => `
    <tr>
      <td>${p.regNum}</td>
      <td><strong>${p.name}</strong></td>
      <td><span class="badge ${p.gender === 'ذكر' ? 'badge-male' : 'badge-female'}">${p.gender === 'ذكر' ? '👦' : '👧'} ${p.gender}</span></td>
      <td style="max-width:150px;white-space:normal;font-size:0.75rem">${p.group}</td>
      <td>${p.level || '—'}</td>
      <td>${p.guardian}</td>
      <td dir="ltr">${p.phone}</td>
      <td>${p.address || '—'}</td>
      <td><span class="badge ${p.bus === 'نعم' ? 'badge-bus-yes' : 'badge-bus-no'}">${p.bus === 'نعم' ? '✅' : '❌'}</span></td>
      <td><span class="badge badge-paid">${p.paid} د</span></td>
      <td><span class="badge ${p.remaining > 0 ? 'badge-remaining' : 'badge-paid'}">${p.remaining} د</span></td>
      <td>
        <div class="action-btns">
          <button class="btn-receipt" onclick="showReceipt(participants.find(x=>x.id==='${p.id}'))" title="وصل">🧾</button>
          <button class="btn-edit" onclick="editParticipant('${p.id}')" title="تعديل">✏️</button>
          <button class="btn-delete" onclick="askDelete('${p.id}')" title="حذف">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function getFilteredList() {
  let list = [...participants];
  if (listFilter.gender !== 'all') {
    list = list.filter(p => p.gender === listFilter.gender);
  }
  if (listFilter.search) {
    const s = listFilter.search.toLowerCase();
    list = list.filter(p =>
      p.name.toLowerCase().includes(s) ||
      p.regNum.toLowerCase().includes(s) ||
      p.guardian.toLowerCase().includes(s) ||
      (p.phone && p.phone.includes(s))
    );
  }
  return list;
}

function filterList() {
  listFilter.search = document.getElementById('search-input').value;
  renderList();
}

function filterGender(gender, btn) {
  listFilter.gender = gender;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderList();
}

// ===================== EXPORT =====================
function exportExcel() {
  const list = getFilteredList();
  if (list.length === 0) { showToast('لا توجد بيانات للتصدير', 'error'); return; }

  const headers = ['رقم التسجيل', 'الاسم', 'الجنس', 'الحلقة', 'المستوى', 'اسم الولي', 'الهاتف', 'العنوان', 'الحافلة', 'رسوم التسجيل', 'رسوم الحافلة', 'المجموع', 'المؤدى', 'الباقي', 'التاريخ'];
  const rows = list.map(p => [p.regNum, p.name, p.gender, p.group, p.level, p.guardian, p.phone, p.address, p.bus, p.regFee, p.busFee, p.total, p.paid, p.remaining, p.date]);

  let csv = '\uFEFF';
  csv += headers.join(',') + '\n';
  rows.forEach(r => {
    csv += r.map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(',') + '\n';
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `قائمة_المسجلين_${new Date().toLocaleDateString('ar-MA').replace(/\//g, '-')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('تم تصدير الملف بنجاح ✅', 'success');
}

function exportPDF() {
  printList();
}

function printList() {
  const list = getFilteredList();
  if (list.length === 0) { showToast('لا توجد بيانات للطباعة', 'error'); return; }

  const rows = list.map(p => `
    <tr>
      <td>${p.regNum}</td>
      <td>${p.name}</td>
      <td>${p.gender}</td>
      <td style="font-size:9pt">${p.group}</td>
      <td>${p.level || '—'}</td>
      <td>${p.guardian}</td>
      <td dir="ltr">${p.phone}</td>
      <td>${p.address || '—'}</td>
      <td>${p.bus}</td>
      <td>${p.paid} د</td>
      <td>${p.remaining} د</td>
    </tr>
  `).join('');

  const win = window.open('', '_blank');
  win.document.write(`
    <!DOCTYPE html><html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>قائمة المسجلين - جمعية الهدى</title>
      <style>
        body { font-family: 'Cairo', Tahoma, sans-serif; direction: rtl; margin: 20px; font-size: 10pt; }
        .print-header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #1a6b3c; padding-bottom: 14px; }
        h1 { color: #1a6b3c; font-size: 16pt; margin: 0; }
        p { color: #555; margin: 4px 0; }
        table { width: 100%; border-collapse: collapse; font-size: 9pt; }
        th { background: #1a6b3c; color: white; padding: 8px 6px; text-align: right; }
        td { padding: 7px 6px; border-bottom: 1px solid #ddd; text-align: right; }
        tr:nth-child(even) td { background: #f5f5f5; }
        .count { color: #1a6b3c; font-weight: bold; margin-top: 10px; }
      </style>
    </head>
    <body>
      <div class="print-header">
        <h1>جمعية الهدى لتحفيظ القرآن الكريم</h1>
        <p>الدورة الصيفية 2026 - قائمة المسجلين</p>
        <p>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-MA')}</p>
      </div>
      <table>
        <thead><tr>
          <th>الرقم</th><th>الاسم</th><th>الجنس</th><th>الحلقة</th><th>المستوى</th>
          <th>الولي</th><th>الهاتف</th><th>العنوان</th><th>الحافلة</th><th>المؤدى</th><th>الباقي</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p class="count">إجمالي المسجلين: ${list.length}</p>
    </body></html>
  `);
  win.document.close();
  win.print();
}

// ===================== BUS =====================
function renderBus() {
  const males = participants.filter(p => p.bus === 'نعم' && p.gender === 'ذكر');
  const females = participants.filter(p => p.bus === 'نعم' && p.gender === 'أنثى');

  document.getElementById('bus-male-count').textContent = males.length;
  document.getElementById('bus-female-count').textContent = females.length;

  renderBusTable('bus-males-body', 'bus-males-empty', males);
  renderBusTable('bus-females-body', 'bus-females-empty', females);
}

function renderBusTable(bodyId, emptyId, list) {
  const tbody = document.getElementById(bodyId);
  const empty = document.getElementById(emptyId);

  if (list.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';
  tbody.innerHTML = list.map(p => `
    <tr>
      <td>${p.regNum}</td>
      <td><strong>${p.name}</strong></td>
      <td style="font-size:0.75rem">${p.group}</td>
      <td dir="ltr">${p.phone}</td>
      <td>${p.address || '—'}</td>
    </tr>
  `).join('');
}

function printBus() {
  const males = participants.filter(p => p.bus === 'نعم' && p.gender === 'ذكر');
  const females = participants.filter(p => p.bus === 'نعم' && p.gender === 'أنثى');

  const renderBusRows = list => list.map(p => `
    <tr>
      <td>${p.regNum}</td>
      <td>${p.name}</td>
      <td style="font-size:9pt">${p.group}</td>
      <td dir="ltr">${p.phone}</td>
      <td>${p.address || '—'}</td>
    </tr>
  `).join('');

  const win = window.open('', '_blank');
  win.document.write(`
    <!DOCTYPE html><html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>قائمة الحافلة - جمعية الهدى</title>
      <style>
        body { font-family: 'Cairo', Tahoma, sans-serif; direction: rtl; margin: 20px; font-size: 10pt; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 3px solid #1a6b3c; padding-bottom: 14px; }
        h1 { color: #1a6b3c; font-size: 16pt; }
        h2 { margin: 18px 0 10px; padding: 8px 12px; color: white; font-size: 12pt; border-radius: 6px; }
        h2.male { background: #1e40af; }
        h2.female { background: #9d174d; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background: #1a6b3c; color: white; padding: 8px 6px; }
        td { padding: 8px 6px; border-bottom: 1px solid #ddd; }
        .count { font-weight: bold; color: #1a6b3c; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>جمعية الهدى لتحفيظ القرآن الكريم</h1>
        <p>الدورة الصيفية 2026 - قائمة مستفيدي الحافلة</p>
        <p>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-MA')}</p>
      </div>

      <h2 class="male">👦 الذكور (${males.length})</h2>
      <table>
        <thead><tr><th>الرقم</th><th>الاسم</th><th>الحلقة</th><th>هاتف الولي</th><th>العنوان</th></tr></thead>
        <tbody>${males.length > 0 ? renderBusRows(males) : '<tr><td colspan="5" style="text-align:center">لا يوجد</td></tr>'}</tbody>
      </table>

      <h2 class="female">👧 الإناث (${females.length})</h2>
      <table>
        <thead><tr><th>الرقم</th><th>الاسم</th><th>الحلقة</th><th>هاتف الولي</th><th>العنوان</th></tr></thead>
        <tbody>${females.length > 0 ? renderBusRows(females) : '<tr><td colspan="5" style="text-align:center">لا يوجد</td></tr>'}</tbody>
      </table>

      <p class="count">إجمالي مستفيدي الحافلة: ${males.length + females.length}</p>
    </body></html>
  `);
  win.document.close();
  win.print();
}

// ===================== FINANCE =====================
function renderFinance() {
  const total = participants.length;
  const busCount = participants.filter(p => p.bus === 'نعم').length;
  const regSum = participants.reduce((s, p) => s + (p.regFee || 0), 0);
  const busSum = participants.reduce((s, p) => s + (p.busFee || 0), 0);
  const paidSum = participants.reduce((s, p) => s + (p.paid || 0), 0);
  const remainingSum = participants.reduce((s, p) => s + (p.remaining || 0), 0);

  document.getElementById('fin-total').textContent = total;
  document.getElementById('fin-bus').textContent = busCount;
  document.getElementById('fin-reg-sum').textContent = regSum + ' د';
  document.getElementById('fin-bus-sum').textContent = busSum + ' د';
  document.getElementById('fin-income').textContent = paidSum + ' د';
  document.getElementById('fin-remaining').textContent = remainingSum + ' د';
}

function drawCharts() {
  const males = participants.filter(p => p.gender === 'ذكر').length;
  const females = participants.filter(p => p.gender === 'أنثى').length;

  drawPieChart('chart-gender',
    ['الذكور', 'الإناث'],
    [males, females],
    ['#2563eb', '#db2777']
  );

  const paidSum = participants.reduce((s, p) => s + (p.paid || 0), 0);
  const remainingSum = participants.reduce((s, p) => s + (p.remaining || 0), 0);

  drawPieChart('chart-finance',
    ['المؤدى', 'المتبقي'],
    [paidSum, remainingSum],
    ['#1a6b3c', '#dc2626']
  );

  const g1 = participants.filter(p => p.group.includes('الزبير')).length;
  const g2 = participants.filter(p => p.group.includes('ابن مسعود')).length;
  const g3 = participants.filter(p => p.group.includes('عائشة')).length;
  const g4 = participants.filter(p => p.group.includes('أم سلمة')).length;

  drawBarChart('chart-groups',
    ['الزبير', 'ابن مسعود', 'عائشة', 'أم سلمة'],
    [g1, g2, g3, g4],
    ['#2563eb', '#1e40af', '#db2777', '#9d174d']
  );
}

function drawPieChart(canvasId, labels, values, colors) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const total = values.reduce((a, b) => a + b, 0);
  const w = canvas.width, h = canvas.height;
  const cx = w / 2, cy = h / 2;
  const r = Math.min(cx, cy) - 30;

  ctx.clearRect(0, 0, w, h);

  if (total === 0) {
    ctx.fillStyle = '#e5e7eb';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#9ca3af';
    ctx.font = '13px Cairo, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('لا توجد بيانات', cx, cy + 5);
    return;
  }

  let angle = -Math.PI / 2;
  values.forEach((v, i) => {
    if (v === 0) return;
    const slice = (v / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, angle, angle + slice);
    ctx.closePath();
    ctx.fillStyle = colors[i];
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();

    const midAngle = angle + slice / 2;
    const lx = cx + (r * 0.65) * Math.cos(midAngle);
    const ly = cy + (r * 0.65) * Math.sin(midAngle);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px Cairo, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(v, lx, ly + 4);
    angle += slice;
  });

  labels.forEach((label, i) => {
    const legendY = h - (labels.length - i) * 16 - 2;
    ctx.fillStyle = colors[i];
    ctx.fillRect(8, legendY - 9, 12, 12);
    ctx.fillStyle = '#374151';
    ctx.font = '11px Cairo, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${label}: ${values[i]}`, w - 6, legendY + 2);
  });
}

function drawBarChart(canvasId, labels, values, colors) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const maxVal = Math.max(...values, 1);
  const barW = (w - 60) / labels.length - 8;
  const chartH = h - 50;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#f9fafb';
  ctx.fillRect(0, 0, w, h);

  values.forEach((v, i) => {
    const x = 40 + i * ((w - 60) / labels.length) + 4;
    const barH = (v / maxVal) * (chartH - 20);
    const y = chartH - barH + 10;

    ctx.fillStyle = colors[i];
    ctx.beginPath();
    ctx.roundRect(x, y, barW, barH, [4, 4, 0, 0]);
    ctx.fill();

    ctx.fillStyle = '#1a6b3c';
    ctx.font = 'bold 13px Cairo, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(v, x + barW / 2, y - 4);

    ctx.fillStyle = '#6b7280';
    ctx.font = '10px Cairo, sans-serif';
    ctx.fillText(labels[i], x + barW / 2, h - 8);
  });

  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(36, 10);
  ctx.lineTo(36, chartH + 10);
  ctx.lineTo(w - 10, chartH + 10);
  ctx.stroke();
}

// ===================== REPORTS =====================
function renderReports() {
  const males = participants.filter(p => p.gender === 'ذكر').length;
  const females = participants.filter(p => p.gender === 'أنثى').length;
  const busCount = participants.filter(p => p.bus === 'نعم').length;
  const total = participants.length;

  const g1 = participants.filter(p => p.group.includes('الزبير')).length;
  const g2 = participants.filter(p => p.group.includes('ابن مسعود')).length;
  const g3 = participants.filter(p => p.group.includes('عائشة')).length;
  const g4 = participants.filter(p => p.group.includes('أم سلمة')).length;

  const regDue = participants.reduce((s, p) => s + (p.regFee || 0), 0);
  const busDue = participants.reduce((s, p) => s + (p.busFee || 0), 0);
  const totalDue = participants.reduce((s, p) => s + (p.total || 0), 0);
  const paid = participants.reduce((s, p) => s + (p.paid || 0), 0);
  const left = participants.reduce((s, p) => s + (p.remaining || 0), 0);

  document.getElementById('rep-males').textContent = males;
  document.getElementById('rep-females').textContent = females;
  document.getElementById('rep-bus').textContent = busCount;
  document.getElementById('rep-total').textContent = total;
  document.getElementById('rep-g1').textContent = g1;
  document.getElementById('rep-g2').textContent = g2;
  document.getElementById('rep-g3').textContent = g3;
  document.getElementById('rep-g4').textContent = g4;
  document.getElementById('rep-reg-due').textContent = regDue + ' درهم';
  document.getElementById('rep-bus-due').textContent = busDue + ' درهم';
  document.getElementById('rep-total-due').textContent = totalDue + ' درهم';
  document.getElementById('rep-paid').textContent = paid + ' درهم';
  document.getElementById('rep-left').textContent = left + ' درهم';
}

function printReports() {
  const males = participants.filter(p => p.gender === 'ذكر').length;
  const females = participants.filter(p => p.gender === 'أنثى').length;
  const busCount = participants.filter(p => p.bus === 'نعم').length;
  const total = participants.length;
  const g1 = participants.filter(p => p.group.includes('الزبير')).length;
  const g2 = participants.filter(p => p.group.includes('ابن مسعود')).length;
  const g3 = participants.filter(p => p.group.includes('عائشة')).length;
  const g4 = participants.filter(p => p.group.includes('أم سلمة')).length;
  const paid = participants.reduce((s, p) => s + (p.paid || 0), 0);
  const left = participants.reduce((s, p) => s + (p.remaining || 0), 0);

  const win = window.open('', '_blank');
  win.document.write(`
    <!DOCTYPE html><html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>التقارير - جمعية الهدى</title>
      <style>
        body { font-family: Tahoma, sans-serif; direction: rtl; margin: 20px; font-size: 11pt; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #1a6b3c; padding-bottom: 14px; }
        h1 { color: #1a6b3c; font-size: 16pt; }
        h2 { color: #1a6b3c; font-size: 13pt; margin: 16px 0 8px; border-right: 4px solid #1a6b3c; padding-right: 10px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        td { padding: 9px 12px; border-bottom: 1px solid #ddd; }
        td:last-child { font-weight: bold; color: #1a6b3c; text-align: left; }
        .danger { color: #dc2626 !important; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>جمعية الهدى لتحفيظ القرآن الكريم</h1>
        <p>الدورة الصيفية 2026 - تقرير إحصائي</p>
        <p>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-MA')}</p>
      </div>

      <h2>📊 الإحصائيات العامة</h2>
      <table>
        <tr><td>عدد الذكور</td><td>${males}</td></tr>
        <tr><td>عدد الإناث</td><td>${females}</td></tr>
        <tr><td>مستفيدو الحافلة</td><td>${busCount}</td></tr>
        <tr><td>إجمالي المسجلين</td><td>${total}</td></tr>
      </table>

      <h2>📚 الحلقات</h2>
      <table>
        <tr><td>الزبير بن العوام رضي الله عنه</td><td>${g1}</td></tr>
        <tr><td>عبد الله بن مسعود رضي الله عنه</td><td>${g2}</td></tr>
        <tr><td>أم المؤمنين عائشة رضي الله عنها</td><td>${g3}</td></tr>
        <tr><td>أم المؤمنين أم سلمة رضي الله عنها</td><td>${g4}</td></tr>
      </table>

      <h2>💰 المداخيل</h2>
      <table>
        <tr><td>المؤدى</td><td>${paid} درهم</td></tr>
        <tr><td>المتبقي</td><td class="danger">${left} درهم</td></tr>
      </table>
    </body></html>
  `);
  win.document.close();
  win.print();
}

// ===================== RECEIPT =====================
function showReceipt(p) {
  if (!p) return;
  document.getElementById('r-regnum').textContent = p.regNum;
  document.getElementById('r-name').textContent = p.name;
  document.getElementById('r-gender').textContent = p.gender;
  document.getElementById('r-group').textContent = p.group;
  document.getElementById('r-paid').textContent = p.paid + ' درهم';
  document.getElementById('r-date').textContent = p.date || new Date().toLocaleDateString('ar-MA');
  document.getElementById('receipt-modal').style.display = 'flex';
}

function printReceipt() {
  const content = document.getElementById('receipt-content').innerHTML;
  const win = window.open('', '_blank');
  win.document.write(`
    <!DOCTYPE html><html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>وصل تسجيل - جمعية الهدى</title>
      <style>
        body { font-family: 'Cairo', Tahoma, sans-serif; direction: rtl; margin: 30px; max-width: 400px; }
        .receipt-header { display: flex; align-items: center; gap: 14px; margin-bottom: 14px; }
        .receipt-logo svg { width: 65px; height: 65px; }
        .receipt-org-name { font-size: 13pt; font-weight: bold; color: #1a6b3c; }
        .receipt-org-sub { font-size: 10pt; color: #2d8653; }
        .receipt-doc-title { font-size: 10pt; font-weight: bold; color: #d4af37; margin-top: 4px; }
        .receipt-divider { height: 2px; background: linear-gradient(to right, #1a6b3c, #d4af37, #1a6b3c); margin: 12px 0; }
        .receipt-table { width: 100%; border-collapse: collapse; }
        .receipt-table td { padding: 10px 12px; border-bottom: 1px dashed #ddd; font-size: 11pt; }
        .receipt-val { font-weight: bold; color: #1a6b3c; text-align: left; }
        .receipt-amount { font-size: 13pt; font-weight: 800; color: #1a6b3c; }
        .receipt-footer { text-align: center; color: #6b7280; font-size: 10pt; margin-top: 10px; line-height: 1.8; }
      </style>
    </head>
    <body>${content}</body></html>
  `);
  win.document.close();
  win.print();
}

function closeModal() {
  document.getElementById('receipt-modal').style.display = 'none';
}

function openReceiptPrinter() {
  document.getElementById('receipt-search-modal').style.display = 'flex';
  document.getElementById('receipt-search-input').value = '';
  document.getElementById('receipt-search-results').innerHTML = '';
}

function searchForReceipt() {
  const s = document.getElementById('receipt-search-input').value.toLowerCase();
  const results = document.getElementById('receipt-search-results');
  if (!s) { results.innerHTML = ''; return; }

  const matches = participants.filter(p =>
    p.name.toLowerCase().includes(s) || p.regNum.toLowerCase().includes(s)
  );

  if (matches.length === 0) {
    results.innerHTML = '<p style="color:#9ca3af;text-align:center;padding:10px">لا توجد نتائج</p>';
    return;
  }

  results.innerHTML = matches.map(p => `
    <div class="receipt-search-item" onclick="selectForReceipt('${p.id}')">
      <strong>${p.name}</strong> — ${p.regNum} — <span style="color:#1a6b3c">${p.paid} درهم</span>
    </div>
  `).join('');
}

function selectForReceipt(id) {
  const p = participants.find(x => x.id === id);
  if (!p) return;
  closeReceiptSearch();
  showReceipt(p);
}

function closeReceiptSearch() {
  document.getElementById('receipt-search-modal').style.display = 'none';
}

// ===================== TOAST =====================
function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = 'toast show ' + type;
  setTimeout(() => { toast.className = 'toast'; }, 3000);
}


// ===================== SERVICE WORKER =====================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(() => console.log('SW registered'))
      .catch(err => console.log('SW error:', err));
  });
}
