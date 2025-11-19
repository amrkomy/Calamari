// ============ الإعدادات ============
const supabase = window.supabase.createClient(
  "https://xczrexzzmmrpdokcitvg.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjenJleHp6bW1ycGRva2NpdHZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MDExNDEsImV4cCI6MjA3NjA3NzE0MX0.RoTn4GQ7yOKhGInH6aIuuXpmlvzFfx0tY6gn9Myx1Gk"
);

let oneSignalInitialized = false;
let lastComplaintIds = new Set();

// ============ OneSignal (للإدارة فقط) ============
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
    alert("الإشعارات مفعلة مسبقًا ✅");
  } else {
    await window.OneSignal.User.PushSubscription.optIn();
    alert("تم تفعيل إشعارات الشكاوى بنجاح! 🔔");
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
      // إشعار محلي
      const notifText = `شكوى جديدة من ${newComplaints[0].customer_name || 'عميل'}`;
      showLocalNotification(notifText);
      
      // إشعار OneSignal للإدارة
      await sendNotification("new_complaint", newComplaints[0]);
    }
    lastComplaintIds = currentIds;

    renderComplaints(data);
  } catch (e) {
    console.error("خطأ في تحميل الشكاوى:", e);
    document.getElementById('complaintsTableBody').innerHTML = `<tr><td colspan="4" class="text-center text-danger">خطأ في التحميل</td></tr>`;
  }
}

function renderComplaints(complaints) {
  const tbody = document.getElementById('complaintsTableBody');
  if (complaints.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center">لا توجد شكاوى</td></tr>`;
    return;
  }

  tbody.innerHTML = complaints.map(c => {
    const date = new Date(c.created_at).toLocaleDateString('ar-EG');
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
        <td><button class="btn btn-sm btn-outline-primary" onclick="alert('التفاصيل غير مفعلة حالياً')">عرض</button></td>
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

async function sendNotification(type, data) {
  try {
    const res = await fetch("/.netlify/functions/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, data })
    });
    if (!res.ok) {
      const err = await res.json();
      console.warn("فشل إرسال الإشعار:", err);
    }
  } catch (e) {
    console.warn("خطأ في الاتصال:", e);
  }
}

// ============ إرسال إشعار جماعي ============
async function sendBroadcast(title, message) {
  return await sendNotification("broadcast_to_customers", { title, message });
}

// ============ Realtime ============
function setupRealtime() {
  supabase
    .channel('complaints-channel')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'complaints' }, () => {
      loadComplaints();
    })
    .subscribe();
}

// ============ سجل الإشعارات ============
const HISTORY_KEY = 'notification_history';
function loadHistory() {
  return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
}
function saveHistory(hist) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(hist));
}
function addToHistory(title, message) {
  const hist = loadHistory();
  hist.unshift({ time: Date.now(), title, message });
  saveHistory(hist.slice(0, 10)); // حفظ آخر 10
  renderHistory();
}
function renderHistory() {
  const list = document.getElementById('historyList');
  const hist = loadHistory();
  if (hist.length === 0) {
    list.innerHTML = '<small class="text-muted">لا توجد إشعارات بعد</small>';
    return;
  }
  list.innerHTML = hist.map(item => `
    <div class="list-group-item px-2 py-2">
      <div class="d-flex justify-content-between">
        <strong>${item.title || 'بدون عنوان'}</strong>
        <small>${new Date(item.time).toLocaleString('ar-EG')}</small>
      </div>
      <div>${item.message}</div>
    </div>
  `).join('');
}

// ============ التهيئة ============
document.getElementById('enableAdminNotifBtn').addEventListener('click', enableAdminNotifications);

document.getElementById('broadcastForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = document.getElementById('title').value.trim();
  const message = document.getElementById('message').value.trim();
  if (!message) return alert("الرسالة مطلوبة");

  const success = await sendBroadcast(title, message);
  if (success !== undefined) {
    addToHistory(title, message);
    e.target.reset();
    alert("تم إرسال الإشعار بنجاح!");
  } else {
    alert("فشل الإرسال. تحقق من الاتصال.");
  }
});

renderHistory();
loadComplaints();
setupRealtime();
