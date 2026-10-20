// =====================================================
// CampusCare Student Portal
// Frontend -> API Gateway only
// =====================================================

const GATEWAY_URL =
    window.CAMPUSCARE_GATEWAY_URL || "http://localhost:8080";


let state = {
    token: localStorage.getItem("cc_token") || null,
    userId: localStorage.getItem("cc_userId") || null,
    email: localStorage.getItem("cc_email") || null
};


const views = [
    "register",
    "login",
    "dashboard",
    "departments",
    "newrequest",
    "myrequests",
    "requestdetail",
    "notifications",
    "profile"
];


// =====================================================
// INITIALIZE
// =====================================================

document.addEventListener("DOMContentLoaded", () => {

    setupForms();
    setupButtons();

    renderNav();

});


// =====================================================
// VIEW MANAGEMENT
// =====================================================

function showView(name) {

    views.forEach(view => {

        const element =
            document.getElementById(`view-${view}`);

        if (element) {
            element.classList.toggle(
                "active",
                view === name
            );
        }

    });


    const authLayout =
        document.getElementById("authLayout");

    const appLayout =
        document.getElementById("appLayout");


    if (
        name === "login" ||
        name === "register"
    ) {

        if (authLayout)
            authLayout.style.display = "block";

        if (appLayout)
            appLayout.style.display = "none";

    } else {

        if (authLayout)
            authLayout.style.display = "none";

        if (appLayout)
            appLayout.style.display = "block";

    }


    if (name === "departments")
        loadDepartments();

    if (name === "myrequests")
        loadRequests();

    if (name === "notifications")
        loadNotifications();

    if (name === "newrequest")
        populateDepartmentSelect();

    if (name === "dashboard")
        loadDashboard();

    if (name === "profile")
        loadProfile();

}


// =====================================================
// NAVIGATION
// =====================================================

function renderNav() {

    const nav =
        document.getElementById("nav");

    const badge =
        document.getElementById("userBadge");


    // IMPORTANT:
    // Prevents "Cannot set properties of null"
    if (!nav || !badge) {
        console.error(
            "CampusCare: nav or userBadge element is missing."
        );
        return;
    }


    nav.innerHTML = "";


    if (!state.token) {

        badge.textContent = "";

        showView("login");

        return;

    }


    nav.innerHTML = `

        <button onclick="showView('dashboard')">
            ⌂ Dashboard
        </button>

        <button onclick="showView('departments')">
            ▦ Departments
        </button>

        <button onclick="showView('newrequest')">
            ＋ New Request
        </button>

        <button onclick="showView('myrequests')">
            ☷ My Requests
        </button>

        <button onclick="showView('notifications')">
            ♢ Notifications
        </button>

        <button onclick="showView('profile')">
            ◯ My Profile
        </button>

        <button onclick="logout()">
            ↪ Sign out
        </button>
    `;


    badge.textContent =
        state.email
            ? state.email
            : "Student";


    showView("dashboard");

}


// =====================================================
// API
// =====================================================

function authHeaders() {

    if (!state.token)
        return {};

    return {
        Authorization: `Bearer ${state.token}`
    };

}


async function api(path, options = {}) {

    try {

        const response = await fetch(
            `${GATEWAY_URL}${path}`,
            {
                ...options,

                headers: {
                    "Content-Type": "application/json",

                    ...authHeaders(),

                    ...(options.headers || {})
                }
            }
        );


        if (response.status === 401) {

            logout();

            throw new Error(
                "Session expired. Please login again."
            );

        }


        if (response.status === 429) {

            throw new Error(
                "Too many requests. Please wait."
            );

        }


        if (!response.ok) {

            let message =
                `Request failed (${response.status})`;

            try {

                const body =
                    await response.json();

                message =
                    body.error ||
                    body.message ||
                    message;

            } catch (e) {}

            throw new Error(message);

        }


        if (response.status === 204)
            return null;


        return await response.json();

    } catch (error) {

        if (
            error.name === "TypeError" &&
            error.message.includes("fetch")
        ) {

            throw new Error(
                "Cannot connect to CampusCare API Gateway."
            );

        }

        throw error;

    }

}


// =====================================================
// FORM SETUP
// =====================================================

function setupForms() {


    // REGISTER

    const registerForm =
        document.getElementById("registerForm");


    if (registerForm) {

        registerForm.addEventListener(
            "submit",
            async event => {

                event.preventDefault();

                const data =
                    Object.fromEntries(
                        new FormData(event.target)
                    );


                const msg =
                    document.getElementById(
                        "registerMsg"
                    );


                try {

                    await api(
                        "/auth/register",
                        {
                            method: "POST",

                            body: JSON.stringify(data)
                        }
                    );


                    msg.textContent =
                        "Registered successfully. Please login.";

                    msg.style.color = "green";


                    event.target.reset();


                    setTimeout(
                        () => showView("login"),
                        800
                    );


                } catch (error) {

                    msg.textContent =
                        error.message;

                    msg.style.color = "red";

                }

            }
        );

    }


    // LOGIN

    const loginForm =
        document.getElementById("loginForm");


    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            async event => {

                event.preventDefault();


                const data =
                    Object.fromEntries(
                        new FormData(event.target)
                    );


                const msg =
                    document.getElementById(
                        "loginMsg"
                    );


                try {

                    const result =
                        await api(
                            "/auth/login",
                            {
                                method: "POST",

                                body:
                                    JSON.stringify(data)
                            }
                        );


                    state.token =
                        result.token;

                    state.userId =
                        result.userId;

                    state.email =
                        result.email ||
                        data.email;


                    localStorage.setItem(
                        "cc_token",
                        state.token
                    );

                    localStorage.setItem(
                        "cc_userId",
                        state.userId
                    );

                    localStorage.setItem(
                        "cc_email",
                        state.email
                    );


                    msg.textContent =
                        "Login successful.";

                    msg.style.color =
                        "green";


                    renderNav();


                } catch (error) {

                    msg.textContent =
                        error.message;

                    msg.style.color =
                        "red";

                }

            }
        );

    }


    // REQUEST FORM

    const requestForm =
        document.getElementById("requestForm");


    if (requestForm) {

        requestForm.addEventListener(
            "submit",
            async event => {

                event.preventDefault();


                const data =
                    Object.fromEntries(
                        new FormData(event.target)
                    );


                data.studentId =
                    state.userId;


                const msg =
                    document.getElementById(
                        "requestMsg"
                    );


                try {

                    await api(
                        "/requests",
                        {
                            method: "POST",

                            body:
                                JSON.stringify(data)
                        }
                    );


                    msg.textContent =
                        "Request submitted successfully.";

                    msg.style.color =
                        "green";


                    event.target.reset();


                } catch (error) {

                    msg.textContent =
                        error.message;

                    msg.style.color =
                        "red";

                }

            }
        );

    }


    // PROFILE

    const profileForm =
        document.getElementById(
            "profileForm"
        );


    if (profileForm) {

        profileForm.addEventListener(
            "submit",
            async event => {

                event.preventDefault();


                const data =
                    Object.fromEntries(
                        new FormData(event.target)
                    );


                const msg =
                    document.getElementById(
                        "profileMsg"
                    );


                try {

                    await api(
                        `/users/${state.userId}`,
                        {
                            method: "PUT",

                            body:
                                JSON.stringify(data)
                        }
                    );


                    msg.textContent =
                        "Profile updated successfully.";

                    msg.style.color =
                        "green";


                    if (data.email) {

                        state.email =
                            data.email;

                        localStorage.setItem(
                            "cc_email",
                            data.email
                        );

                        renderNav();

                    }


                } catch (error) {

                    msg.textContent =
                        error.message;

                    msg.style.color =
                        "red";

                }

            }
        );

    }

}


// =====================================================
// BUTTON SETUP
// =====================================================

function setupButtons() {

    const refreshDepartments =
        document.getElementById(
            "refreshDepartments"
        );

    if (refreshDepartments)
        refreshDepartments.addEventListener(
            "click",
            loadDepartments
        );


    const refreshRequests =
        document.getElementById(
            "refreshRequests"
        );

    if (refreshRequests)
        refreshRequests.addEventListener(
            "click",
            loadRequests
        );


    const refreshNotifications =
        document.getElementById(
            "refreshNotifications"
        );

    if (refreshNotifications)
        refreshNotifications.addEventListener(
            "click",
            loadNotifications
        );

}


// =====================================================
// LOGOUT
// =====================================================

function logout() {

    state = {
        token: null,
        userId: null,
        email: null
    };


    localStorage.removeItem("cc_token");
    localStorage.removeItem("cc_userId");
    localStorage.removeItem("cc_email");


    renderNav();

}


// =====================================================
// DASHBOARD
// =====================================================

async function loadDashboard() {

    const summary =
        document.getElementById(
            "dashboardSummary"
        );


    if (!summary)
        return;


    summary.innerHTML =
        "Loading dashboard...";


    try {

        const [
            departments,
            requests,
            notifications
        ] = await Promise.all([

            api("/departments"),

            api("/requests"),

            api(
                `/notifications/${state.userId}`
            )

        ]);


        const mine =
            requests.filter(
                request =>
                    String(request.studentId) ===
                    String(state.userId)
            );


        const unread =
            notifications.filter(
                notification =>
                    !notification.read &&
                    !notification.isRead
            ).length;


        summary.innerHTML = `

            <div class="card">
                <h3>Departments</h3>
                <p>
                    ${departments.length}
                    available
                </p>
            </div>

            <div class="card">
                <h3>My Requests</h3>
                <p>
                    ${mine.length}
                    submitted
                </p>
            </div>

            <div class="card">
                <h3>Notifications</h3>
                <p>
                    ${notifications.length}
                    total,
                    ${unread}
                    unread
                </p>
            </div>

        `;


        const email =
            document.getElementById(
                "studentEmail"
            );


        if (email)
            email.textContent =
                state.email || "student@example.com";


        const recent =
            document.getElementById(
                "recentRequests"
            );


        if (recent) {

            const latest =
                mine.slice(-3).reverse();


            recent.innerHTML =
                latest.length
                    ? latest.map(request => `

                        <div class="card">

                            <h3>
                                ${request.requestType}

                                <span class="badge">
                                    ${request.status}
                                </span>
                            </h3>

                            <p>
                                ${request.description || ""}
                            </p>

                        </div>

                    `).join("")
                    : `<p class="empty">
                        No recent requests.
                       </p>`;

        }


    } catch (error) {

        summary.innerHTML = `

            <p class="form-msg"
               style="color:red">
                ${error.message}
            </p>

        `;

    }

}


// =====================================================
// DEPARTMENTS
// =====================================================

async function loadDepartments() {

    const element =
        document.getElementById(
            "departmentsList"
        );


    if (!element)
        return;


    element.innerHTML =
        "Loading departments...";


    try {

        const departments =
            await api("/departments");


        element.innerHTML =
            departments.length

                ? departments.map(
                    department => `

                    <div class="card">

                        <h3>
                            ${department.name}
                        </h3>

                        <p>
                            ${department.description || ""}
                        </p>

                        <p>
                            ${department.location || ""}
                        </p>

                        <p>
                            ${department.contactEmail || ""}
                        </p>

                    </div>

                `
                ).join("")

                : `<p class="empty">
                    No departments available.
                   </p>`;


    } catch (error) {

        element.innerHTML = `

            <p class="form-msg"
               style="color:red">
                ${error.message}
            </p>

        `;

    }

}


// =====================================================
// DEPARTMENT SELECT
// =====================================================

async function populateDepartmentSelect() {

    const select =
        document.getElementById(
            "departmentSelect"
        );


    if (!select)
        return;


    try {

        const departments =
            await api("/departments");


        select.innerHTML =
            `<option value="">
                Select department
             </option>`;


        departments.forEach(
            department => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    department.id;

                option.textContent =
                    department.name;


                select.appendChild(option);

            }
        );


    } catch (error) {

        select.innerHTML =
            `<option value="">
                Unable to load departments
             </option>`;

    }

}


// =====================================================
// MY REQUESTS
// =====================================================

async function loadRequests() {

    const element =
        document.getElementById(
            "requestsList"
        );


    if (!element)
        return;


    element.innerHTML =
        "Loading requests...";


    try {

        const requests =
            await api("/requests");


        const mine =
            requests.filter(
                request =>
                    String(request.studentId) ===
                    String(state.userId)
            );


        element.innerHTML =
            mine.length

                ? mine.map(
                    request => `

                    <div class="card">

                        <h3>

                            ${request.requestType}

                            <span class="badge">
                                ${request.status}
                            </span>

                        </h3>

                        <p>
                            ${request.description || ""}
                        </p>

                        <p>
                            Priority:
                            ${request.priority || "N/A"}
                        </p>

                        <br>

                        <button
                            class="secondary-btn"
                            onclick="viewRequest(${request.id})">

                            View / Update

                        </button>

                    </div>

                `
                ).join("")

                : `<p class="empty">
                    You haven't submitted any requests yet.
                   </p>`;


    } catch (error) {

        element.innerHTML = `

            <p class="form-msg"
               style="color:red">
                ${error.message}
            </p>

        `;

    }

}


// =====================================================
// REQUEST DETAIL
// =====================================================

async function viewRequest(id) {

    showView("requestdetail");


    const element =
        document.getElementById(
            "requestDetail"
        );


    if (!element)
        return;


    element.innerHTML =
        "Loading request...";


    try {

        const request =
            await api(
                `/requests/${id}`
            );


        element.innerHTML = `

            <div class="form-panel">

                <h2>
                    ${request.requestType}
                </h2>

                <br>

                <p>
                    ${request.description || ""}
                </p>

                <br>

                <p>
                    Status:
                    <strong>
                        ${request.status}
                    </strong>
                </p>

                <p>
                    Priority:
                    ${request.priority || "N/A"}
                </p>

                <br>

                <label>
                    Update Status
                </label>

                <select id="statusSelect">

                    <option
                        value="PENDING"
                        ${request.status === "PENDING"
                            ? "selected"
                            : ""}>
                        PENDING
                    </option>

                    <option
                        value="IN_PROGRESS"
                        ${request.status === "IN_PROGRESS"
                            ? "selected"
                            : ""}>
                        IN_PROGRESS
                    </option>

                    <option
                        value="RESOLVED"
                        ${request.status === "RESOLVED"
                            ? "selected"
                            : ""}>
                        RESOLVED
                    </option>

                    <option
                        value="REJECTED"
                        ${request.status === "REJECTED"
                            ? "selected"
                            : ""}>
                        REJECTED
                    </option>

                </select>

                <button
                    class="primary-btn"
                    onclick="updateStatus(${id})">

                    Update Status

                </button>

            </div>

        `;


    } catch (error) {

        element.innerHTML = `

            <p class="form-msg"
               style="color:red">
                ${error.message}
            </p>

        `;

    }

}


// =====================================================
// UPDATE REQUEST STATUS
// =====================================================

async function updateStatus(id) {

    const select =
        document.getElementById(
            "statusSelect"
        );


    if (!select)
        return;


    const status =
        select.value;


    try {

        await api(
            `/requests/${id}`,
            {
                method: "PUT",

                body:
                    JSON.stringify({
                        status
                    })
            }
        );


        alert(
            "Request status updated."
        );


        viewRequest(id);


    } catch (error) {

        alert(
            error.message
        );

    }

}


// =====================================================
// NOTIFICATIONS
// =====================================================

async function loadNotifications() {

    const element =
        document.getElementById(
            "notificationsList"
        );


    if (!element)
        return;


    element.innerHTML =
        "Loading notifications...";


    try {

        const notifications =
            await api(
                `/notifications/${state.userId}`
            );


        element.innerHTML =
            notifications.length

                ? notifications.map(
                    notification => {

                        const read =
                            notification.isRead ||
                            notification.read;


                        return `

                            <div class="card">

                                <h3>

                                    ${notification.title}

                                    ${
                                        !read
                                            ? `<span class="badge">
                                                NEW
                                               </span>`
                                            : ""
                                    }

                                </h3>

                                <p>
                                    ${notification.message}
                                </p>

                                ${
                                    !read
                                        ? `<br>
                                           <button
                                             class="secondary-btn"
                                             onclick="markRead(${notification.id})">
                                             Mark as read
                                           </button>`
                                        : ""
                                }

                            </div>

                        `;

                    }
                ).join("")

                : `<p class="empty">
                    No notifications yet.
                   </p>`;


    } catch (error) {

        element.innerHTML = `

            <p class="form-msg"
               style="color:red">
                ${error.message}
            </p>

        `;

    }

}


// =====================================================
// MARK NOTIFICATION READ
// =====================================================

async function markRead(id) {

    try {

        await api(
            `/notifications/${id}/read`,
            {
                method: "PUT"
            }
        );


        loadNotifications();


    } catch (error) {

        alert(
            error.message
        );

    }

}


// =====================================================
// PROFILE
// =====================================================

async function loadProfile() {

    // If your user-service has GET /users/{id},
    // this will load existing profile information.
    // If not, the form remains available.

    const form =
        document.getElementById(
            "profileForm"
        );


    if (!form)
        return;


    const email =
        form.querySelector(
            '[name="email"]'
        );


    if (email && state.email)
        email.value =
            state.email;

}