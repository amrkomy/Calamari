// تسجيل الـ service-worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch((err) => {
    console.warn("فشل تسجيل Service Worker:", err);
  });
}

// Toast utility
const toast = (msg, type = "info") => {
  const t = document.createElement("div");
  t.className = `alert alert-${type} position-fixed top-0 end-0 m-3`;
  t.style.zIndex = 1055;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
};

// سجل الإشعارات
const historyKey = "notifHistory";
let history = JSON.parse(localStorage.getItem(historyKey) || "[]");

const renderHistory = () => {
  const box = document.getElementById("historyBox");
  if (!history.length) {
    box.innerHTML = '<p class="text-muted">لا توجد إشعارات بعد</p>';
    return;
  }
  box.innerHTML = history
    .map(
      ({ time, title, body }) =>
        `<div class="list-group-item">
          <div class="d-flex w-100 justify-content-between">
            <h6 class="mb-1">${title}</h6>
            <small>${new Date(time).toLocaleString("ar-EG")}</small>
          </div>
          <p class="mb-1">${body}</p>
        </div>`
    )
    .join("");
};
renderHistory();

// معاينة الصورة
document.getElementById("imageFile")?.addEventListener("change", function () {
  const file = this.files[0];
  const preview = document.getElementById("imagePreview");
  if (!file || !preview) return (preview.style.display = "none");
  const reader = new FileReader();
  reader.onload = (e) => {
    preview.src = e.target.result;
    preview.style.display = "block";
  };
  reader.readAsDataURL(file);
});

// إرسال الإشعار
document.getElementById("notifyForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector("button");
  const title = document.getElementById("title")?.value.trim();
  const message = document.getElementById("message")?.value.trim();
  const imageFile = document.getElementById("imageFile")?.files[0];

  if (!title || !message) return toast("الرجاء ملء العنوان والرسالة", "warning");

  btn.disabled = true;
  btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>جاري الإرسال...`;

  let imageUrl = null;
  if (imageFile) {
    const fd = new FormData();
    fd.append("image", imageFile);
    try {
      const res = await fetch("https://api.imgbb.com/1/upload?key=7a2772de77491aa8fb9696a1727062bf", {
        method: "POST",
        body: fd,
      });
      const j = await res.json();
      if (j.success) {
        imageUrl = j.data.url;
      } else {
        toast("فشل رفع الصورة", "danger");
        btn.disabled = false;
        btn.innerHTML = "إرسال الإشعار";
        return;
      }
    } catch (err) {
      console.error("Image upload error:", err);
      toast("خطأ في رفع الصورة", "danger");
      btn.disabled = false;
      btn.innerHTML = "إرسال الإشعار";
      return;
    }
  }

  const payload = { title, message, imageUrl };

  try {
    const resp = await fetch("/.netlify/functions/sendNotification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await resp.json();

    // 🔍 تشخيص دقيق للخطأ
    if (resp.ok && result.id) {
      history.unshift({ time: Date.now(), title, body: message });
      localStorage.setItem(historyKey, JSON.stringify(history));
      renderHistory();
      toast("✅ تم الإرسال بنجاح", "success");
      e.target.reset();
      document.getElementById("imagePreview").style.display = "none";
    } else {
      console.error("OneSignal error response:", result);
      toast(`❌ فشل الإرسال: ${result.errors ? result.errors.join(", ") : "خطأ غير معروف"}`, "danger");
    }
  } catch (err) {
    console.error("Network or function error:", err);
    toast("❌ خطأ في الاتصال بالخادم", "danger");
  }

  btn.disabled = false;
  btn.innerHTML = "إرسال الإشعار";
});
