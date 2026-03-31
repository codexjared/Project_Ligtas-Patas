const login = document.getElementById("login")
const errorModal = document.getElementById("errorModal"); 
const closeBtn = document.getElementById("closeBtn");     


login.onclick = (e) => {
    e.preventDefault();

    const usernameadd = document.getElementById("username").value;
    const passwordadd = document.getElementById("password").value;

    const getUser = localStorage.getItem("username")
    const getPass = localStorage.getItem("password")

    if (usernameadd === "admin" && passwordadd === "ligtaspatas") {
        window.location.href = "./home.html";
    } else {
        errorModal.style.display = "flex"; //show modal
    }
};

    // Close modal when clicking OK
closeBtn.onclick = () => {
    errorModal.style.display = "none";
    
    // Clear the input fields
    document.getElementById("username").value = "";
    document.getElementById("password").value = "";
}

