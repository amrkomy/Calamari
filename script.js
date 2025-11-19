// ============ الإعدادات ============
const supabase = window.supabase.createClient(
  "https://xczrexzzmmrpdokcitvg.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjenJleHp6bW1ycGRva2NpdHZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MDExNDEsImV4cCI6MjA3NjA3NzE0MX0.RoTn4GQ7yOKhGInH6aIuuXpmlvzFfx0tY6gn9Myx1Gk"
);

let oneSignalInitialized = false;
let lastComplaintIds = new Set();

// ============ OneSignal للإدارة ============
async function initOneSignalAdmin() {
  if (oneSignalInitialized) return;
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  OneSignalDeferred.push(async function(OneSignal) {
    await OneSignal.init({ appId: "fb14d9b6-5b07-47c7-bc70-ff2495372d38" });
  });
  oneSignalInitialized = true;
}

async function enableAdminNotifications() {
  await initOneSignalAdmin();
  const status = await window.OneSignal.User.PushSubscription.getPermissionStatus();
  if (status === 'granted') {
    showToast("الإشعارات مفعلة مسبقًا ✅");
  } else {
    await window.OneSignal.User.PushSubscription.optIn();
    showToast("تم تفعيل إشعارات الشكاوى بنجاح! 🔔");
  }
}

// ============ تحميل الشكاوى ============
async function loadComplaints() {
  try {
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    const currentIds = new Set(data.map(c => c.id));
    const newComplaints = data.filter(c => !lastComplaintIds.has(c.id));
    
    if (newComplaints.length > 0) {
      const text = `شكوى جديدة من ${newComplaints[0].customer_name || 'عميل'}`;
      showLocalNotification(text);
      await sendNotification("new_complaint", newComplaints[0]);
    }
    lastComplaintIds = currentIds;

    renderComplaints(data);
  } catch (e) {
    console.error("خطأ:", e);
    document.getElementById('complaintsTableBody').innerHTML = `<tr><td colspan="4" style="text-align:center;color:red;">خطأ في التحميل</td></tr>`;
  }
}

function renderComplaints(complaints) {
  const tbody = document.getElementById('complaintsTableBody');
  if (complaints.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">لا توجد شكاوى</td></tr>`;
    return;
  }

  tbody.innerHTML = complaints.map(c => {
    const date = new Date(c.created_at).toLocaleString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    const statusClass = {
      pending: 'status-pending',
      resolved: 'status-resolved',
      rejected: 'status-rejected'
    }[c.status] || 'status-pending';
    
    const statusText = {
      pending: 'معلقة',
      resolved: 'تم الحل',
      rejected: 'مرفوضة'
    }[c.status] || 'معلقة';

    return `
      <tr>
        <td>${date}</td>
        <td>${c.customer_name || '—'}</td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        <td><button class="action-btn" onclick="alert('التفاصيل غير مفعلة حالياً')">عرض</button></td>
      </tr>
    `;
  }).join('');
}

// ============ وظائف الإشعارات ============
function showLocalNotification(text) {
  const banner = document.getElementById('notifBanner');
  document.getElementById('notifText').textContent = text;
  banner.style.display = 'block';
  setTimeout(() => banner.style.display = 'none', 5000);
}

function showToast(message) {
  const div = document.createElement('div');
  div.style.cssText = "position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.8);color:white;padding:10px 20px;border-radius:8px;z-index:1000;";
  div.textContent = message;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 3000);
}

async function sendNotification(type, data) {
  try {
    const res = await fetch("/.netlify/functions/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, data })
    });
    return res.ok;
  } catch (e) {
    console.warn("فشل الإرسال:", e);
    return false;
  }
}

// ============ سجل الإشعارات ============
const HISTORY_KEY = 'notif_history';
function getHistory() {
  return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
}
function saveHistory(hist) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(hist));
}
function addToHistory(title, message) {
  const hist = getHistory();
  hist.unshift({ time: Date.now(), title, message });
  saveHistory(hist.slice(0, 10));
  renderHistory();
}
function renderHistory() {
  const list = document.getElementById('historyList');
  const hist = getHistory();
  if (hist.length === 0) {
    list.innerHTML = '<div class="history-item"><strong>لا توجد إشعارات بعد</strong></div>';
    return;
  }
  list.innerHTML = hist.map(item => `
    <div class="history-item">
      <strong>${item.title || 'بدون عنوان'}</strong>
      <div>${item.message}</div>
      <small>${new Date(item.time).toLocaleString('ar-EG')}</small>
    </div>
  `).join('');
}

// ============ الأحداث ============
document.getElementById('enableAdminNotifBtn').addEventListener('click', enableAdminNotifications);

document.getElementById('sendBroadcastBtn').addEventListener('click', async () => {
  const title = document.getElementById('title').value.trim();
  const message = document.getElementById('message').value.trim();
  if (!message) return showToast("الرسالة مطلوبة");

  const success = await sendNotification("broadcast_to_customers", { title, message });
  if (success) {
    addToHistory(title, message);
    document.getElementById('title').value = '';
    document.getElementById('message').value = '';
    document.getElementById('imageUrl').value = '';
    showToast("تم الإرسال بنجاح!");
  } else {
    showToast("فشل الإرسال. تحقق من الإعدادات.");
  }
});

// ============ التهيئة ============
renderHistory();
loadComplaints();

// تحديث كل 30 ثانية
setInterval(loadComplaints, 30000);
