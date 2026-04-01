const login = document.getElementById("login");
const errorModal = document.getElementById("errorModal"); 
const closeBtn = document.getElementById("closeBtn");     
const usernameField = document.getElementById("username");
const passwordField = document.getElementById("password");

function handleLogin(e) {
    e.preventDefault();

    // Run browser validation manually
    if (!usernameField.checkValidity() || !passwordField.checkValidity()) {
        usernameField.reportValidity();
        passwordField.reportValidity();
        return;
    }

    if (!usernameField.checkValidity()) {
        usernameField.reportValidity();
        return;
    }

    if (!passwordField.checkValidity()) {
        passwordField.reportValidity();
        return;
    }
    // If fields are filled, check credentials
    if (usernameField.value === "admin" && passwordField.value === "ligtaspatas") {
        window.location.href = "./index.html";
    } else {
        errorModal.style.display = "flex"; // show modal
    }
}

// Trigger login on button click
login.onclick = handleLogin;

// Trigger login on Enter key
document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        handleLogin(e);
    }
});

// Close modal when clicking OK
closeBtn.onclick = () => {
    errorModal.style.display = "none";
    usernameField.value = "";
    passwordField.value = "";
};

