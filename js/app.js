const menu = document.querySelector('#mobile-menu');
const menuLinks = document.querySelector('.navbar__menu');
const safe = document.getElementById('safeadmin');

const loginBtnNavbar = document.querySelector('#loginBtn'); 
const adminLoginBtn = document.getElementById('adminLoginBtn');
const adminCard = document.getElementById('adminCard');
const logoutBtn = document.getElementById('logoutBtn');
const currentPage = window.location.pathname;

// ✅ Define isAdmin globally so hotline.js can use it
window.isAdmin = localStorage.getItem("isAdminLoggedIn") === "true";

// Navbar toggle
menu.addEventListener('click', function() {
    menu.classList.toggle('is-active');
    menuLinks.classList.toggle('active');
});

// Admin UI logic
if (window.isAdmin) {
    if (adminLoginBtn) adminLoginBtn.style.display = 'none';
    if (safe) { safe.disabled = false; safe.textContent = "Safe ✅"; }

    if (loginBtnNavbar) {
        if (currentPage.includes("main.html") || currentPage.includes("adminlogin.html")) {
            loginBtnNavbar.innerText = "Back";
            loginBtnNavbar.setAttribute("href", "javascript:history.back()");
        } else {
            loginBtnNavbar.innerText = "Log Out";
        }
    }

    if (adminCard) adminCard.style.display = 'inline-block';
    if (logoutBtn) logoutBtn.style.display = 'flex';
} else {
    if (safe) { safe.disabled = true; safe.textContent = "Safe ✅ (only admin)"; }
    if (adminCard) adminCard.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';

    if (loginBtnNavbar) {
        if (currentPage.includes("main.html") || currentPage.includes("adminlogin.html")) {
            loginBtnNavbar.innerText = "Back";
            loginBtnNavbar.setAttribute("href", "javascript:history.back()");
        } else {
            loginBtnNavbar.innerText = "Log In";
        }
    }
}

// Logout modal
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        const overlay = document.createElement('div');
        overlay.className = 'logout-overlay';
        overlay.innerHTML = `
            <div class="logout-box">
                <div class="logout-icon">🚪</div>
                <h3>Log Out?</h3>
                <p>Are you sure you want to log out as <strong>Admin</strong>?<br>The page will refresh after logging out.</p>
                <div class="modal-btns">
                    <button class="btn-confirm-logout" id="confirmLogout">Yes, Log Out</button>
                    <button class="btn-cancel-logout" id="cancelLogout">Cancel</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.querySelector('#confirmLogout').addEventListener('click', () => {
            localStorage.removeItem("isAdminLoggedIn");
            window.location.reload();
        });

        overlay.querySelector('#cancelLogout').addEventListener('click', () => overlay.remove());
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    });
}
