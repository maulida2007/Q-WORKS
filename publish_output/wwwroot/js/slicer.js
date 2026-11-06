/**
 * Q-WORKS Slicer Dropdown Controller
 * Power BI Style Multi-Select Dropdowns with Live Search & Batch Apply
 */

window.toggleSlicerDropdown = function (wrapperId) {
  const wrapper = document.getElementById(wrapperId);
  if (!wrapper) return;

  const dropdown = wrapper.querySelector(".slicer-dropdown");
  const trigger = wrapper.querySelector(".slicer-trigger");
  if (!dropdown || !trigger) return;

  const isOpen = dropdown.classList.contains("open");

  // Close other open slicers first
  window.closeAllSlicerDropdowns();

  if (!isOpen) {
    dropdown.classList.add("open");
    trigger.classList.add("active");

    // Auto-focus search input
    const searchInput = dropdown.querySelector(".slicer-search-input");
    if (searchInput) {
      setTimeout(() => searchInput.focus(), 50);
    }
  }
};

window.closeAllSlicerDropdowns = function () {
  document.querySelectorAll(".slicer-dropdown.open").forEach((el) => {
    el.classList.remove("open");
  });
  document.querySelectorAll(".slicer-trigger.active").forEach((el) => {
    el.classList.remove("active");
  });
};

// Global click outside listener & Escape key handler
document.addEventListener("click", function (event) {
  if (!event.target.closest(".slicer-select-wrapper")) {
    window.closeAllSlicerDropdowns();
  }
});

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    window.closeAllSlicerDropdowns();
  }
});

window.filterSlicerItems = function (wrapperId, query) {
  const wrapper = document.getElementById(wrapperId);
  if (!wrapper) return;

  const q = (query || "").trim().toLowerCase();
  const rows = wrapper.querySelectorAll(".slicer-option-row");

  rows.forEach((row) => {
    const text = (row.getAttribute("data-search") || row.innerText || "").toLowerCase();
    if (!q || text.includes(q)) {
      row.classList.remove("hidden");
    } else {
      row.classList.add("hidden");
    }
  });
};

window.updateSlicerState = function (wrapperId) {
  const wrapper = document.getElementById(wrapperId);
  if (!wrapper) return;

  const rows = wrapper.querySelectorAll(".slicer-option-row");
  let checkedCount = 0;
  const totalCount = rows.length;

  rows.forEach((row) => {
    const chk = row.querySelector(".slicer-real-checkbox");
    const visualBox = row.querySelector(".slicer-item-checkbox");
    if (chk && visualBox) {
      if (chk.checked) {
        visualBox.classList.add("checked");
        checkedCount++;
      } else {
        visualBox.classList.remove("checked");
      }
    }
  });

  // Header checkbox
  const headerCheckbox = wrapper.querySelector(".slicer-header-checkbox");
  if (headerCheckbox) {
    if (checkedCount > 0) {
      headerCheckbox.classList.add("checked");
    } else {
      headerCheckbox.classList.remove("checked");
    }
  }

  // Trigger Badge
  const triggerLeft = wrapper.querySelector(".slicer-trigger-left");
  let badge = wrapper.querySelector(".slicer-trigger-badge");

  if (checkedCount > 0 && checkedCount < totalCount) {
    if (!badge && triggerLeft) {
      badge = document.createElement("span");
      badge.className = "slicer-trigger-badge";
      triggerLeft.appendChild(badge);
    }
    if (badge) {
      badge.style.background = "#2563eb";
      badge.style.color = "#ffffff";
      badge.textContent = checkedCount.toString();
    }
  } else if (checkedCount === totalCount && totalCount > 0) {
    if (!badge && triggerLeft) {
      badge = document.createElement("span");
      badge.className = "slicer-trigger-badge";
      triggerLeft.appendChild(badge);
    }
    if (badge) {
      badge.style.background = "rgba(56, 189, 248, 0.25)";
      badge.style.color = "#38bdf8";
      badge.textContent = "Semua";
    }
  } else {
    if (badge) badge.remove();
  }
};

window.toggleSlicerAll = function (wrapperId, event) {
  if (event) event.stopPropagation();

  const wrapper = document.getElementById(wrapperId);
  if (!wrapper) return;

  const checkboxes = wrapper.querySelectorAll(".slicer-real-checkbox");
  if (!checkboxes || checkboxes.length === 0) return;

  // If all are checked, uncheck all. Otherwise, check all visible/all checkboxes.
  let allChecked = true;
  checkboxes.forEach((cb) => {
    if (!cb.checked) allChecked = false;
  });

  const shouldCheck = !allChecked;
  checkboxes.forEach((cb) => {
    cb.checked = shouldCheck;
  });

  window.updateSlicerState(wrapperId);
};

window.resetSlicer = function (wrapperId) {
  const wrapper = document.getElementById(wrapperId);
  if (!wrapper) return;

  const checkboxes = wrapper.querySelectorAll(".slicer-real-checkbox");
  checkboxes.forEach((cb) => {
    cb.checked = false;
  });

  window.updateSlicerState(wrapperId);

  // Submit the parent form
  const form = wrapper.closest("form");
  if (form) {
    form.submit();
  }
};

window.applySlicerFilter = function (wrapperId) {
  const wrapper = document.getElementById(wrapperId);
  if (!wrapper) return;

  const form = wrapper.closest("form");
  if (form) {
    form.submit();
  }
};

window.selectSlicerOnly = function (buttonElement, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  const row = buttonElement.closest(".slicer-option-row");
  const wrapper = buttonElement.closest(".slicer-select-wrapper");
  if (!row || !wrapper) return;

  const targetCheckbox = row.querySelector(".slicer-real-checkbox");
  if (!targetCheckbox) return;

  // Uncheck all other checkboxes in this slicer, check only this one
  const allCheckboxes = wrapper.querySelectorAll(".slicer-real-checkbox");
  allCheckboxes.forEach((cb) => {
    cb.checked = (cb === targetCheckbox);
  });

  window.updateSlicerState(wrapper.id);

  // Submit the parent form immediately for instant 1-click filter
  const form = wrapper.closest("form");
  if (form) {
    form.submit();
  }
};

