/**
 * Smart Switch v1.2 (Production Cloud & Admin Build)
 * Created by Newton Maina & Peter Wanyoike
 * Copyright (c) 2026. All rights reserved.
 */

const APP_VERSION = "1.2";

// Default target URL for the hardware device
let CLOUD_SERVER_URL = localStorage.getItem("custom_endpoint") || "http://192.168.1.100";

const USER_ROLES = {
    ADMIN: "admin",
    USER: "user"
};

function getStoredUsers() {
    try {
        const users = localStorage.getItem("app_users");
        if (!users) {
            const defaultUsers = { 
                "admin": { password: "admin123", role: USER_ROLES.ADMIN },
                "user": { password: "1234", role: USER_ROLES.USER }
            };
            localStorage.setItem("app_users", JSON.stringify(defaultUsers));
            return defaultUsers;
        }
        return JSON.parse(users);
    } catch (e) {
        return { "admin": { password: "admin123", role: USER_ROLES.ADMIN } };
    }
}

function saveUser(username, password, role = USER_ROLES.USER) {
    try {
        const users = getStoredUsers();
        users[username] = { password: password, role: role };
        localStorage.setItem("app_users", JSON.stringify(users));
    } catch (e) {
        console.error("Failed to save user:", e);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const authContainer = document.getElementById("authContainer");
    const mainApp = document.getElementById("mainApp");
    const authSubtitle = document.getElementById("authSubtitle");

    const loginTabBtn = document.getElementById("loginTabBtn");
    const registerTabBtn = document.getElementById("registerTabBtn");
    const authTabs = document.querySelector(".auth-tabs");

    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const forgotForm = document.getElementById("forgotForm");

    const loginError = document.getElementById("loginError");
    const registerMsg = document.getElementById("registerMsg");
    const forgotMsg = document.getElementById("forgotMsg");

    const forgotPasswordLink = document.getElementById("forgotPasswordLink");
    const backToLoginLink = document.getElementById("backToLoginLink");
    const logoutButton = document.getElementById("logoutButton");

    const onButton = document.getElementById("onButton");
    const offButton = document.getElementById("offButton");
    const statusCircle = document.getElementById("statusCircle");
    const statusIcon = document.getElementById("statusIcon");
    const statusText = document.getElementById("statusText");
    const powerText = document.getElementById("powerText");
    const connectionBadge = document.getElementById("connection");
    const connectionText = document.getElementById("connectionText");

    const adminPanel = document.getElementById("adminPanel");
    const endpointInput = document.getElementById("endpointInput");
    const saveEndpointBtn = document.getElementById("saveEndpointBtn");

    if (endpointInput) endpointInput.value = CLOUD_SERVER_URL;

    function clearMessages() {
        if (loginError) { loginError.textContent = ""; loginError.className = "auth-message error"; }
        if (registerMsg) { registerMsg.textContent = ""; registerMsg.className = "auth-message"; }
        if (forgotMsg) { forgotMsg.textContent = ""; forgotMsg.className = "auth-message"; }
    }

    function showLoginForm() {
        if (loginTabBtn) loginTabBtn.classList.add("active");
        if (registerTabBtn) registerTabBtn.classList.remove("active");
        if (authTabs) authTabs.classList.remove("hidden");
        if (authSubtitle) authSubtitle.textContent = "Please log in to control devices";

        if (loginForm) loginForm.classList.remove("hidden");
        if (registerForm) registerForm.classList.add("hidden");
        if (forgotForm) forgotForm.classList.add("hidden");
        clearMessages();
    }

    function showRegisterForm() {
        if (registerTabBtn) registerTabBtn.classList.add("active");
        if (loginTabBtn) loginTabBtn.classList.remove("active");
        if (authTabs) authTabs.classList.remove("hidden");
        if (authSubtitle) authSubtitle.textContent = "Create an account to manage devices";

        if (registerForm) registerForm.classList.remove("hidden");
        if (loginForm) loginForm.classList.add("hidden");
        if (forgotForm) forgotForm.classList.add("hidden");
        clearMessages();
    }

    function showForgotForm() {
        if (authTabs) authTabs.classList.add("hidden");
        if (authSubtitle) authSubtitle.textContent = "Account Recovery";

        if (forgotForm) forgotForm.classList.remove("hidden");
        if (loginForm) loginForm.classList.add("hidden");
        if (registerForm) registerForm.classList.add("hidden");
        clearMessages();
    }

    function applyUserPermissions(currentUser) {
        const users = getStoredUsers();
        const userObj = users[currentUser];
        
        if (userObj && userObj.role === USER_ROLES.ADMIN) {
            if (adminPanel) adminPanel.classList.remove("hidden");
        } else {
            if (adminPanel) adminPanel.classList.add("hidden");
        }
    }

    function showApp() {
        if (authContainer) authContainer.classList.add("hidden");
        if (mainApp) mainApp.classList.remove("hidden");
        const currentUser = localStorage.getItem("currentUser") || "admin";
        applyUserPermissions(currentUser);
        checkDeviceStatus();
    }

    function showLogin() {
        if (mainApp) mainApp.classList.add("hidden");
        if (authContainer) authContainer.classList.remove("hidden");
        showLoginForm();
        if (loginForm) loginForm.reset();
    }

    if (loginTabBtn) loginTabBtn.addEventListener("click", showLoginForm);
    if (registerTabBtn) registerTabBtn.addEventListener("click", showRegisterForm);
    if (forgotPasswordLink) forgotPasswordLink.addEventListener("click", (e) => { e.preventDefault(); showForgotForm(); });
    if (backToLoginLink) backToLoginLink.addEventListener("click", (e) => { e.preventDefault(); showLoginForm(); });

    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const userVal = document.getElementById("username")?.value.trim();
            const passVal = document.getElementById("password")?.value;
            const users = getStoredUsers();

            if (users[userVal] && users[userVal].password === passVal) {
                try {
                    localStorage.setItem("isLoggedIn", "true");
                    localStorage.setItem("currentUser", userVal);
                } catch (err) {}
                showApp();
            } else if (loginError) {
                loginError.textContent = "Invalid username or password";
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const userVal = document.getElementById("regUsername")?.value.trim();
            const passVal = document.getElementById("regPassword")?.value;
            const confirmVal = document.getElementById("regConfirmPassword")?.value;
            const users = getStoredUsers();

            if (passVal !== confirmVal) {
                if (registerMsg) { registerMsg.textContent = "Passwords do not match"; registerMsg.className = "auth-message error"; }
                return;
            }
            if (users[userVal]) {
                if (registerMsg) { registerMsg.textContent = "Username already exists"; registerMsg.className = "auth-message error"; }
                return;
            }

            saveUser(userVal, passVal, USER_ROLES.USER);
            if (registerMsg) { registerMsg.textContent = "Account created successfully! Log in now."; registerMsg.className = "auth-message success"; }
            registerForm.reset();
        });
    }

    if (saveEndpointBtn && endpointInput) {
        saveEndpointBtn.addEventListener("click", () => {
            const newUrl = endpointInput.value.trim();
            if (newUrl) {
                CLOUD_SERVER_URL = newUrl;
                localStorage.setItem("custom_endpoint", newUrl);
                alert("Device Endpoint Updated successfully!");
                checkDeviceStatus();
            }
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener("click", () => {
            try {
                localStorage.removeItem("isLoggedIn");
                localStorage.removeItem("currentUser");
            } catch (err) {}
            showLogin();
        });
    }

    // Hardware State Modifiers
    function setUIOn() {
        if (statusCircle) { statusCircle.classList.remove("off"); statusCircle.classList.add("on"); }
        if (statusIcon) statusIcon.textContent = "⚡";
        if (statusText) statusText.textContent = "ON";
        if (powerText) powerText.textContent = "ON";
    }

    function setUIOff() {
        if (statusCircle) { statusCircle.classList.remove("on"); statusCircle.classList.add("off"); }
        if (statusIcon) statusIcon.textContent = "🔌";
        if (statusText) statusText.textContent = "OFF";
        if (powerText) powerText.textContent = "OFF";
    }

    function updateConnectionState(isConnected) {
        if (connectionBadge) {
            connectionBadge.textContent = isConnected ? "Online" : "Offline";
            connectionBadge.style.color = isConnected ? "#35c759" : "#ff6b6b";
        }
        if (connectionText) {
            connectionText.textContent = isConnected ? "Connected" : "Disconnected";
        }
    }

    // Hardware Communication
    function checkDeviceStatus() {
        fetch(`${CLOUD_SERVER_URL}/status`)
            .then(response => response.text())
            .then(state => {
                updateConnectionState(true);
                if (state === "ON") setUIOn();
                else setUIOff();
            })
            .catch(() => updateConnectionState(false));
    }

    function turnOn() {
        setUIOn();
        fetch(`${CLOUD_SERVER_URL}/on`)
            .then(() => updateConnectionState(true))
            .catch(err => {
                console.warn("Could not communicate with switch endpoint:", err);
                updateConnectionState(false);
            });
    }

    function turnOff() {
        setUIOff();
        fetch(`${CLOUD_SERVER_URL}/off`)
            .then(() => updateConnectionState(true))
            .catch(err => {
                console.warn("Could not communicate with switch endpoint:", err);
                updateConnectionState(false);
            });
    }

    if (onButton) onButton.addEventListener("click", turnOn);
    if (offButton) offButton.addEventListener("click", turnOff);

    try {
        if (localStorage.getItem("isLoggedIn") === "true") showApp();
        else showLogin();
    } catch (err) {
        showLogin();
    }
});
