/**
 * Smart Switch v1.1
 * Created by Newton Maina & Peter Wanyoike
 * Copyright (c) 2026. All rights reserved.
 */

const APP_VERSION = "1.1";
const API_BASE_URL = "http://localhost:5000/api";

// DOM Elements
const authContainer = document.getElementById("authContainer");
const mainApp = document.getElementById("mainApp");
const authSubtitle = document.getElementById("authSubtitle");

const loginTabBtn = document.getElementById("loginTabBtn");
const registerTabBtn = document.getElementById("registerTabBtn");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const forgotForm = document.getElementById("forgotForm");

const loginError = document.getElementById("loginError");
const registerMsg = document.getElementById("registerMsg");
const forgotMsg = document.getElementById("forgotMsg");

const forgotPasswordLink = document.getElementById("forgotPasswordLink");
const backToLoginLink = document.getElementById("backToLoginLink");
const logoutButton = document.getElementById("logoutButton");

const loggedUserText = document.getElementById("loggedUserText");

const onButton = document.getElementById("onButton");
const offButton = document.getElementById("offButton");
const statusCircle = document.getElementById("statusCircle");
const statusIcon = document.getElementById("statusIcon");
const statusText = document.getElementById("statusText");
const powerText = document.getElementById("powerText");

// Navigation Tabs
loginTabBtn.addEventListener("click", showLoginForm);
registerTabBtn.addEventListener("click", showRegisterForm);
forgotPasswordLink.addEventListener("click", (e) => {
    e.preventDefault();
    showForgotForm();
});
backToLoginLink.addEventListener("click", (e) => {
    e.preventDefault();
    showLoginForm();
});

function showLoginForm() {
    loginTabBtn.classList.add("active");
    registerTabBtn.classList.remove("active");
    document.querySelector(".auth-tabs").classList.remove("hidden");
    authSubtitle.textContent = "Please log in to control devices";

    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");
    forgotForm.classList.add("hidden");
    clearMessages();
}

function showRegisterForm() {
    registerTabBtn.classList.add("active");
    loginTabBtn.classList.remove("active");
    document.querySelector(".auth-tabs").classList.remove("hidden");
    authSubtitle.textContent = "Create an account to manage devices";

    registerForm.classList.remove("hidden");
    loginForm.classList.add("hidden");
    forgotForm.classList.add("hidden");
    clearMessages();
}

function showForgotForm() {
    document.querySelector(".auth-tabs").classList.add("hidden");
    authSubtitle.textContent = "Account Recovery";

    forgotForm.classList.remove("hidden");
    loginForm.classList.add("hidden");
    registerForm.classList.add("hidden");
    clearMessages();
}

function clearMessages() {
    loginError.textContent = "";
    loginError.className = "auth-message error";
    registerMsg.textContent = "";
    registerMsg.className = "auth-message";
    forgotMsg.textContent = "";
    forgotMsg.className = "auth-message";
}

function getAuthToken() {
    return localStorage.getItem("smart_switch_token");
}

// LOGIN SUBMISSION
loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMessages();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok) {
            loginError.textContent = data.error || "Login failed.";
            loginError.className = "auth-message error";
            return;
        }

        localStorage.setItem("smart_switch_token", data.token);
        localStorage.setItem("smart_switch_user", JSON.stringify(data.user));

        showApp(data.user);
    } catch (err) {
        loginError.textContent = "Server communication error.";
        loginError.className = "auth-message error";
    }
});

// REGISTER SUBMISSION
registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMessages();

    const username = document.getElementById("regUsername").value.trim();
    const password = document.getElementById("regPassword").value;
    const confirmPassword = document.getElementById("regConfirmPassword").value;

    if (password !== confirmPassword) {
        registerMsg.textContent = "Passwords do not match";
        registerMsg.className = "auth-message error";
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok) {
            registerMsg.textContent = data.error || "Registration failed.";
            registerMsg.className = "auth-message error";
            return;
        }

        registerMsg.textContent = data.message;
        registerMsg.className = "auth-message success";
        registerForm.reset();
    } catch (err) {
        registerMsg.textContent = "Server communication error.";
        registerMsg.className = "auth-message error";
    }
});

// FORGOT PASSWORD SUBMISSION
forgotForm.addEventListener("submit", (e) => {
    e.preventDefault();
    forgotMsg.textContent = "Recovery request sent. Check with system operator.";
    forgotMsg.className = "auth-message success";
    forgotForm.reset();
});

// LOGOUT
logoutButton.addEventListener("click", () => {
    localStorage.removeItem("smart_switch_token");
    localStorage.removeItem("smart_switch_user");
    showLogin();
});

// SESSION CHECK
async function checkAuthSession() {
    const token = getAuthToken();

    if (!token) {
        showLogin();
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.ok) {
            const userData = await response.json();
            localStorage.setItem("smart_switch_user", JSON.stringify(userData));
            showApp(userData);
        } else {
            localStorage.removeItem("smart_switch_token");
            localStorage.removeItem("smart_switch_user");
            showLogin();
        }
    } catch (err) {
        let localUser = null;
        try {
            localUser = JSON.parse(localStorage.getItem("smart_switch_user"));
        } catch (e) {
            localStorage.removeItem("smart_switch_user");
        }

        if (localUser) {
            showApp(localUser);
        } else {
            showLogin();
        }
    }
}

function showApp(user) {
    loggedUserText.textContent = user.username || "--";
    authContainer.classList.add("hidden");
    mainApp.classList.remove("hidden");
}

function showLogin() {
    mainApp.classList.add("hidden");
    authContainer.classList.remove("hidden");
    showLoginForm();
    loginForm.reset();
}

checkAuthSession();

// Switch Controls via API
async function sendDeviceCommand(state) {
    const token = getAuthToken();
    try {
        const response = await fetch(`${API_BASE_URL}/device/control`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ state })
        });

        if (!response.ok) {
            console.error("Failed to execute command on hardware");
        }
    } catch (err) {
        console.error("Communication error sending state:", err);
    }
}

function turnOn() {
    statusCircle.classList.remove("off");
    statusCircle.classList.add("on");
    statusIcon.textContent = "⚡";
    statusText.textContent = "ON";
    powerText.textContent = "ON";
    sendDeviceCommand("ON");
}

function turnOff() {
    statusCircle.classList.remove("on");
    statusCircle.classList.add("off");
    statusIcon.textContent = "🔌";
    statusText.textContent = "OFF";
    powerText.textContent = "OFF";
    sendDeviceCommand("OFF");
}

onButton.addEventListener("click", turnOn);
offButton.addEventListener("click", turnOff);

// Service Worker Registration
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js")
            .then(() => {
                console.log(`Smart Switch service worker registered (v${APP_VERSION})`);
            })
            .catch(error => {
                console.error("Service worker registration failed:", error);
            });
    });
}
