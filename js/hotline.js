// Hard-coded defaults (factory baseline)
const hardCodedDefaults = {
    rescue1: "0915-744-9698",
    rescue2: "0999-735-6447",
    police1: "0998-598-5813",
    police2: "0906-179-1105",
    fire1: "0915-603-1561",
    fire2: "(043) 288-7777",
    health1: "0908-366-1556"
};

// Initialize storage if missing
if (!localStorage.getItem("defaultNumbers")) {
    localStorage.setItem("defaultNumbers", JSON.stringify(hardCodedDefaults));
}
if (!localStorage.getItem("latestNumbers")) {
    localStorage.setItem("latestNumbers", JSON.stringify(hardCodedDefaults));
}
if (!localStorage.getItem("hotlineNumbers")) {
    localStorage.setItem("hotlineNumbers", JSON.stringify(hardCodedDefaults));
}

// Save function
function saveNumber(id, newValue) {
    const hotlineNumbers = JSON.parse(localStorage.getItem("hotlineNumbers")) || {};
    hotlineNumbers[id] = newValue;
    localStorage.setItem("hotlineNumbers", JSON.stringify(hotlineNumbers));

    const latestNumbers = JSON.parse(localStorage.getItem("latestNumbers")) || {};
    latestNumbers[id] = newValue;
    localStorage.setItem("latestNumbers", JSON.stringify(latestNumbers));
}

// Enable editing (admin only)
function enableEditing(span) {
    if (!window.isAdmin) return;

    span.contentEditable = "true";
    span.focus();
    span.style.borderBottom = "1px dashed #666";

    const iconContainer = span.parentElement.querySelector(".edit-icon");
    iconContainer.innerHTML = "";

    const checkIcon = document.createElement("i");
    checkIcon.className = "fa-solid fa-check";
    checkIcon.style.color = "#27ae60";
    checkIcon.style.cursor = "pointer";
    checkIcon.title = "Save changes";
    iconContainer.appendChild(checkIcon);

    const cancelIcon = document.createElement("i");
    cancelIcon.className = "fa-solid fa-xmark";
    cancelIcon.style.color = "#e74c3c";
    cancelIcon.style.marginLeft = "10px";
    cancelIcon.style.cursor = "pointer";
    cancelIcon.title = "Cancel edit";
    iconContainer.appendChild(cancelIcon);

    checkIcon.onclick = () => disableEditing(span, true);
    cancelIcon.onclick = () => disableEditing(span, false);

    span.addEventListener("keydown", e => {
        if (e.key === "Enter") {
            e.preventDefault();
            disableEditing(span, true);
        }
    });
}

// Disable editing (restore pencil)
function disableEditing(span, save) {
    span.contentEditable = "false";
    span.style.borderBottom = "none";

    if (save) {
        const newNumber = span.textContent.trim();
        saveNumber(span.id, newNumber);
        showMessage("Number updated successfully.", "success");
    } else {
        const hotlineNumbers = JSON.parse(localStorage.getItem("hotlineNumbers")) || {};
        const latestNumbers = JSON.parse(localStorage.getItem("latestNumbers")) || {};
        span.textContent = hotlineNumbers[span.id] || latestNumbers[span.id];
        showMessage("Edit cancelled. Restored last saved number.", "warning");
    }

    const iconContainer = span.parentElement.querySelector(".edit-icon");
    iconContainer.innerHTML = "";

    if (window.isAdmin) {
        const pencilIcon = document.createElement("i");
        pencilIcon.className = "fa-solid fa-pencil";
        pencilIcon.style.cursor = "pointer";
        pencilIcon.title = "Click to edit number";
        iconContainer.appendChild(pencilIcon);

        pencilIcon.addEventListener("click", () => enableEditing(span));
    }
}

// Load numbers into DOM
const hotlineNumbers = JSON.parse(localStorage.getItem("hotlineNumbers")) || {};
Object.keys(hotlineNumbers).forEach(id => {
    const span = document.getElementById(id);
    if (span) {
        const number = hotlineNumbers[id];
        span.textContent = number;

        const dialLink = span.parentElement.querySelector(".icon");

        if (!window.isAdmin) {
            // USER UI: Number first, then clickable 📞
            const phoneIcon = dialLink.querySelector("i");
            if (phoneIcon) {
                // Move phone icon after the number span
                span.insertAdjacentElement("afterend", dialLink);
            }
        }

        // Always keep the phone icon clickable
        if (dialLink) {
            dialLink.setAttribute("href", "tel:" + number.replace(/[^0-9]/g, ""));
        }
    }
});

// Admin UI: show pencil
if (window.isAdmin) {
    document.querySelectorAll(".hotline-card").forEach(card => {
        const span = card.querySelector(".editable");
        const iconContainer = card.querySelector(".edit-icon");
        iconContainer.style.display = "inline-block";
        iconContainer.innerHTML = "";

        const pencilIcon = document.createElement("i");
        pencilIcon.className = "fa-solid fa-pencil";
        pencilIcon.style.cursor = "pointer";
        pencilIcon.title = "Click to edit number";
        iconContainer.appendChild(pencilIcon);

        pencilIcon.addEventListener("click", () => enableEditing(span));
    });
} else {
    // Hide pencil for users
    document.querySelectorAll(".edit-icon").forEach(iconContainer => {
        iconContainer.style.display = "none";
    });
}

