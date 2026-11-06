/**
 * Q-WORKS System UI Controller
 * Handles sidebar toggling, modal operations, fullscreen, icons, and alerts.
 */

// 1. Sidebar Toggle
function toggleSidebar() {
  const sidebar = document.getElementById("appSidebar");
  if (!sidebar) return;

  sidebar.classList.toggle("collapsed");
  const isCollapsed = sidebar.classList.contains("collapsed");
  try {
    localStorage.setItem("qworks_sidebar_collapsed", isCollapsed ? "1" : "0");
  } catch (e) {}

  // Re-render icons if needed
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const sidebar = document.getElementById("appSidebar");
  if (sidebar) {
    try {
      if (localStorage.getItem("qworks_sidebar_collapsed") === "1") {
        sidebar.classList.add("collapsed");
      }
    } catch (e) {}
  }

  const logoBtn = document.getElementById("sidebarLogoBtn");
  if (logoBtn) {
    logoBtn.addEventListener("click", toggleSidebar);
  }

  const textBtn = document.getElementById("sidebarTextBtn");
  if (textBtn) {
    textBtn.addEventListener("click", toggleSidebar);
  }

  // 2. Modals Event Listeners
  const settingsBtn = document.getElementById("openSettingsBtn");
  if (settingsBtn) {
    settingsBtn.addEventListener("click", openSettingsModal);
  }

  const notifBtn = document.getElementById("openNotificationBtn");
  if (notifBtn) {
    notifBtn.addEventListener("click", openNotificationModal);
  }

  // 3. Fullscreen Controller
  const fullBtn = document.getElementById("fullscreenBtn");
  if (fullBtn) {
    fullBtn.addEventListener("click", function () {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => {
          updateFullscreenIcon(true);
        }).catch(err => console.error(err));
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().then(() => {
            updateFullscreenIcon(false);
          }).catch(err => console.error(err));
        }
      }
    });
  }

  document.addEventListener("fullscreenchange", function () {
    updateFullscreenIcon(!!document.fullscreenElement);
  });

  // 4. Initialize Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }
});

function updateFullscreenIcon(isFullscreen) {
  const icon = document.getElementById("fullscreenIcon");
  if (!icon) return;
  if (isFullscreen) {
    icon.setAttribute("data-lucide", "minimize-2");
  } else {
    icon.setAttribute("data-lucide", "maximize-2");
  }
  if (window.lucide) window.lucide.createIcons();
}

// 5. Settings Modal Functions
function openSettingsModal() {
  const modal = document.getElementById("settingsModal");
  if (modal) modal.style.display = "flex";
}

function closeSettingsModal() {
  const modal = document.getElementById("settingsModal");
  if (modal) modal.style.display = "none";
}

// 6. Notification Modal Functions
function openNotificationModal() {
  const modal = document.getElementById("notificationModal");
  if (modal) modal.style.display = "flex";
}

function closeNotificationModal() {
  const modal = document.getElementById("notificationModal");
  if (modal) modal.style.display = "none";
}

// 7. Confetti Effect Helper
window.launchConfetti = function () {
  if (typeof confetti === "function") {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  }
};

// 8. Dynamic Toast Trigger
window.showToast = function (message, type = "success") {
  let container = document.getElementById("toastAlert");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastAlert";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const borderCol = type === "success" ? "#10b981" : type === "warning" ? "#f59e0b" : type === "danger" ? "#ef4444" : "#38bdf8";
  const iconName = type === "success" ? "check-circle" : type === "warning" ? "alert-circle" : type === "danger" ? "alert-circle" : "info";

  const box = document.createElement("div");
  box.className = "toast-box";
  box.style.borderLeftColor = borderCol;
  box.innerHTML = `<i data-lucide="${iconName}" style="width: 18px; height: 18px;"></i><span>${message}</span>`;

  container.appendChild(box);
  if (window.lucide) window.lucide.createIcons();

  setTimeout(() => {
    box.style.transition = "opacity 0.4s ease";
    box.style.opacity = "0";
    setTimeout(() => box.remove(), 400);
  }, 4000);
};

// 9. Dependent Month-Day Filter Synchronization
window.onFilterMonthChange = function (monthSelect, daySelectId) {
  const daySelect = document.getElementById(daySelectId);
  if (!daySelect) {
    if (monthSelect && monthSelect.form) monthSelect.form.submit();
    return;
  }

  const val = monthSelect.value;
  let daysInMonth = 31;
  if (val) {
    const parts = val.trim().split(" ");
    if (parts.length >= 2) {
      const mName = parts[0].toLowerCase();
      const year = parseInt(parts[1], 10);
      const monthMap = {
        januari: 1, februari: 2, maret: 3, april: 4,
        mei: 5, juni: 6, juli: 7, agustus: 8,
        september: 9, oktober: 10, november: 11, desember: 12
      };
      const mNum = monthMap[mName] || 0;
      if (mNum > 0 && !isNaN(year)) {
        daysInMonth = new Date(year, mNum, 0).getDate();
      }
    }
  }

  const rawDay = daySelect.value || "";
  const currentDay = rawDay.replace(/tanggal\s*/i, "").trim();
  while (daySelect.options.length > 1) {
    daySelect.remove(1);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const opt = document.createElement("option");
    opt.value = i.toString();
    opt.textContent = "Tanggal " + i;
    if (currentDay === i.toString()) {
      opt.selected = true;
    }
    daySelect.appendChild(opt);
  }

  const currentNum = parseInt(currentDay, 10);
  if (!isNaN(currentNum) && currentNum > daysInMonth) {
    daySelect.value = "";
  }

  if (monthSelect.form) {
    monthSelect.form.submit();
  }
};

// 7. Logout Handler
function handleLogoutConfirm() {
  if (confirm("Apakah Anda yakin ingin keluar (Logout) dari aplikasi Q-WORKS?")) {
    window.location.href = "/Auth/Logout";
  }
}
window.handleLogoutConfirm = handleLogoutConfirm;

