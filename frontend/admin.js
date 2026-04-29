/* ================================================================
   PANCHAL BROTHERS — Admin Panel Logic
   admin.js
   ================================================================ */

(function () {
    'use strict';

    /* ── CONFIG ─────────────────────────────────────────────── */
    const API = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:5000/api' 
        : '/api';

    /* ── STATE ──────────────────────────────────────────────── */
    let token = localStorage.getItem('pb_admin_token') || '';
    let currentEnquiryId = null;
    let currentPage = 1;
    let totalPages = 1;
    let activeFilters = {};


    /* ================================================================
       UTILITIES
       ================================================================ */

    /** Show a brief toast notification */
    function toast(msg, dur) {
        const t = document.getElementById('toast');
        t.textContent = msg;
        t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), dur || 3500);
    }

    /** Build auth headers for every API request */
    function authHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token,
        };
    }

    /** Format ISO date string → "12 Apr 2025" */
    function fmtDate(iso) {
        return new Date(iso).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
        });
    }

    /** Build a coloured status badge */
    function statusBadge(status) {
        const map = {
            'New': 'new',
            'In Progress': 'inprogress',
            'Responded': 'responded',
            'Closed': 'closed',
        };
        return `<span class="badge badge-${map[status] || 'new'}">${status}</span>`;
    }

    /** Build a coloured priority badge */
    function priorityBadge(p) {
        return `<span class="badge badge-${(p || 'medium').toLowerCase()}">${p}</span>`;
    }


    /* ================================================================
       AUTH
       ================================================================ */

    /** Validate an existing token on page load */
    async function checkAuth() {
        if (!token) return;
        try {
            const res = await fetch(API + '/admin/me', { headers: authHeaders() });
            if (res.ok) {
                const data = await res.json();
                showDashboard(data.admin);
            } else {
                token = '';
                localStorage.removeItem('pb_admin_token');
            }
        } catch (_) { /* server offline — stay on login */ }
    }

    /** Handle login form submission */
    async function handleLogin() {
        const email = document.getElementById('la-email').value.trim();
        const password = document.getElementById('la-pass').value;
        const errEl = document.getElementById('la-error');
        const btn = document.getElementById('la-btn');

        errEl.textContent = '';
        if (!email || !password) {
            errEl.textContent = 'Email and password are required.';
            return;
        }

        btn.disabled = true;
        btn.textContent = 'Logging in…';

        try {
            const res = await fetch(API + '/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();

            if (res.ok && data.success) {
                token = data.token;
                localStorage.setItem('pb_admin_token', token);
                showDashboard(data.admin);
            } else {
                errEl.textContent = data.error || 'Login failed. Check your credentials.';
            }
        } catch (_) {
            errEl.textContent = 'Cannot connect to server. Is the backend running?';
        }

        btn.disabled = false;
        btn.textContent = 'Login to Admin Panel';
    }

    /** Reveal the dashboard and hide the login screen */
    function showDashboard(admin) {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        if (admin) {
            document.getElementById('admin-info-txt').textContent = admin.email;
        }
        loadStats();
        loadRecentEnquiries();
        loadEnquiries();
    }

    /** Log out and return to the login screen */
    window.logout = function () {
        token = '';
        localStorage.removeItem('pb_admin_token');
        document.getElementById('dashboard').style.display = 'none';
        document.getElementById('login-screen').style.display = 'flex';
        toast('Logged out.');
    };


    /* ================================================================
       PAGE NAVIGATION
       ================================================================ */

    window.switchPage = function (page) {
        document.querySelectorAll('[id^="page-"]').forEach(p => p.style.display = 'none');
        document.getElementById('page-' + page).style.display = 'block';
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        const nav = document.getElementById('nav-' + page);
        if (nav) nav.classList.add('active');
    };

    window.filterByStatus = function (status) {
        document.getElementById('f-status').value = status;
        applyFilters();
    };


    /* ================================================================
       DASHBOARD — STATS
       ================================================================ */

    async function loadStats() {
        try {
            const res = await fetch(API + '/admin/enquiries/stats', { headers: authHeaders() });
            if (!res.ok) return;
            const { stats: s } = await res.json();

            document.getElementById('st-total').textContent = s.totalEnquiries;
            document.getElementById('st-new').textContent = s.newEnquiries;
            document.getElementById('st-prog').textContent = s.inProgress;
            document.getElementById('st-resp').textContent = s.responded;
            document.getElementById('st-month').textContent = s.thisMonth;

            // Service breakdown bars
            const svcEl = document.getElementById('st-services');
            svcEl.innerHTML = '';
            (s.byService || []).slice(0, 5).forEach(item => {
                const pct = Math.round((item.count / Math.max(s.totalEnquiries, 1)) * 100);
                svcEl.innerHTML += `
          <div>
            <div style="display:flex;justify-content:space-between;font-size:.82rem;margin-bottom:4px;">
              <span style="color:var(--white)">${item._id}</span>
              <span style="color:var(--muted);font-family:'JetBrains Mono',monospace;font-size:.68rem">${item.count}</span>
            </div>
            <div style="height:3px;background:rgba(255,255,255,.08);border-radius:2px;">
              <div style="height:3px;background:var(--yellow);border-radius:2px;width:${pct}%;transition:width .6s"></div>
            </div>
          </div>`;
            });
        } catch (_) { /* silently ignore */ }
    }


    /* ================================================================
       DASHBOARD — RECENT ENQUIRIES
       ================================================================ */

    async function loadRecentEnquiries() {
        try {
            const res = await fetch(
                API + '/admin/enquiries?limit=5&sortBy=createdAt&order=desc',
                { headers: authHeaders() }
            );
            if (!res.ok) return;
            const { data } = await res.json();

            const tbody = document.getElementById('recent-tbody');
            tbody.innerHTML = '';

            if (!data.length) {
                tbody.innerHTML = '<tr class="empty-row"><td colspan="5">No enquiries yet.</td></tr>';
                return;
            }

            data.forEach(e => {
                tbody.innerHTML += `
          <tr>
            <td>
              <strong>${e.name}</strong><br>
              <span class="td-muted">${e.email}</span>
            </td>
            <td class="td-muted">${e.service}</td>
            <td class="td-mono">${e.phone}</td>
            <td>${statusBadge(e.status)}</td>
            <td class="td-mono">${fmtDate(e.createdAt)}</td>
          </tr>`;
            });
        } catch (_) { /* silently ignore */ }
    }


    /* ================================================================
       ENQUIRIES TABLE
       ================================================================ */

    window.loadEnquiries = async function (page) {
        page = page || currentPage;
        const params = new URLSearchParams({
            page, limit: 15, sortBy: 'createdAt', order: 'desc',
            ...activeFilters,
        });

        const tbody = document.getElementById('enq-tbody');
        tbody.innerHTML = '<tr class="loading-row"><td colspan="9"><span class="spinner"></span> Loading…</td></tr>';

        try {
            const res = await fetch(API + '/admin/enquiries?' + params, { headers: authHeaders() });

            if (!res.ok) {
                tbody.innerHTML = '<tr class="empty-row"><td colspan="9">Failed to load. Check authentication.</td></tr>';
                return;
            }

            const data = await res.json();
            const list = data.data;
            currentPage = data.pagination.page;
            totalPages = data.pagination.pages;

            document.getElementById('enq-count').textContent = `${data.pagination.total} enquiries`;
            tbody.innerHTML = '';

            if (!list.length) {
                tbody.innerHTML = '<tr class="empty-row"><td colspan="9">No enquiries found.</td></tr>';
                renderPagination();
                return;
            }

            list.forEach(e => {
                tbody.innerHTML += `
          <tr>
            <td class="td-mono">#${e._id.slice(-6).toUpperCase()}</td>
            <td>
              <strong>${e.name}</strong><br>
              <span class="td-muted">${e.email}</span>
            </td>
            <td class="td-muted">${e.company || '—'}</td>
            <td class="td-mono">${e.phone}</td>
            <td class="td-muted" style="font-size:.82rem">${e.service}</td>
            <td>${priorityBadge(e.priority)}</td>
            <td>${statusBadge(e.status)}</td>
            <td class="td-mono">${fmtDate(e.createdAt)}</td>
            <td>
              <button class="action-btn action-view"   onclick="openModal('${e._id}')">View</button>
              <button class="action-btn action-delete" onclick="deleteEnquiry('${e._id}')">Del</button>
            </td>
          </tr>`;
            });

            renderPagination();
        } catch (_) {
            tbody.innerHTML = '<tr class="empty-row"><td colspan="9">Connection error. Is the backend running?</td></tr>';
        }
    };


    /* ── FILTERS ────────────────────────────────────────────── */

    window.applyFilters = function () {
        activeFilters = {};
        const search = document.getElementById('f-search').value.trim();
        const status = document.getElementById('f-status').value;
        const service = document.getElementById('f-service').value;
        if (search) activeFilters.search = search;
        if (status) activeFilters.status = status;
        if (service) activeFilters.service = service;
        currentPage = 1;
        loadEnquiries(1);
    };

    window.clearFilters = function () {
        document.getElementById('f-search').value = '';
        document.getElementById('f-status').value = '';
        document.getElementById('f-service').value = '';
        activeFilters = {};
        currentPage = 1;
        loadEnquiries(1);
    };


    /* ── PAGINATION ─────────────────────────────────────────── */

    function renderPagination() {
        const el = document.getElementById('pagination');
        el.innerHTML = '';
        if (totalPages <= 1) return;

        const prev = document.createElement('button');
        prev.className = 'pg-btn';
        prev.textContent = '← Prev';
        prev.disabled = currentPage <= 1;
        prev.onclick = () => { currentPage--; loadEnquiries(currentPage); };
        el.appendChild(prev);

        const info = document.createElement('span');
        info.className = 'pg-info';
        info.textContent = `Page ${currentPage} of ${totalPages}`;
        el.appendChild(info);

        const next = document.createElement('button');
        next.className = 'pg-btn';
        next.textContent = 'Next →';
        next.disabled = currentPage >= totalPages;
        next.onclick = () => { currentPage++; loadEnquiries(currentPage); };
        el.appendChild(next);
    }


    /* ================================================================
       DETAIL MODAL
       ================================================================ */

    window.openModal = async function (id) {
        currentEnquiryId = id;
        document.getElementById('modal-body').innerHTML =
            '<div style="text-align:center;padding:40px"><span class="spinner"></span></div>';
        document.getElementById('modal-overlay').classList.add('open');

        try {
            const res = await fetch(API + '/admin/enquiries/' + id, { headers: authHeaders() });
            const data = await res.json();
            const e = data.data;

            document.getElementById('modal-title').textContent = `Enquiry — ${e.name}`;
            document.getElementById('modal-status').value = e.status || 'New';
            document.getElementById('modal-priority').value = e.priority || 'Medium';
            document.getElementById('modal-note').value = e.adminNote || '';

            document.getElementById('modal-body').innerHTML = `
        <div class="detail-row">
          <span class="detail-key">ID</span>
          <span class="detail-val">#${e._id.slice(-8).toUpperCase()}</span>
        </div>
        <div class="detail-row">
          <span class="detail-key">Name</span>
          <span class="detail-val">${e.name}</span>
        </div>
        <div class="detail-row">
          <span class="detail-key">Company</span>
          <span class="detail-val">${e.company || '—'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-key">Phone</span>
          <span class="detail-val"><a href="tel:${e.phone}" style="color:var(--yellow)">${e.phone}</a></span>
        </div>
        <div class="detail-row">
          <span class="detail-key">Email</span>
          <span class="detail-val"><a href="mailto:${e.email}" style="color:var(--yellow)">${e.email}</a></span>
        </div>
        <div class="detail-row">
          <span class="detail-key">Service</span>
          <span class="detail-val">${e.service}</span>
        </div>
        <div class="detail-row">
          <span class="detail-key">Message</span>
          <span class="detail-val" style="line-height:1.7;white-space:pre-wrap">${e.message}</span>
        </div>
        <div class="detail-row">
          <span class="detail-key">Email Sent</span>
          <span class="detail-val">${e.emailSent ? '✅ Yes' : '❌ No'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-key">Submitted</span>
          <span class="detail-val">${new Date(e.createdAt).toLocaleString('en-IN')}</span>
        </div>
        ${e.respondedAt ? `
        <div class="detail-row">
          <span class="detail-key">Responded</span>
          <span class="detail-val">${new Date(e.respondedAt).toLocaleString('en-IN')}</span>
        </div>` : ''}
      `;
        } catch (_) {
            document.getElementById('modal-body').innerHTML =
                '<p style="color:var(--red);padding:20px">Failed to load enquiry.</p>';
        }
    };

    window.closeModal = function (e) {
        if (e.target === document.getElementById('modal-overlay')) closeModalDirect();
    };

    window.closeModalDirect = function () {
        document.getElementById('modal-overlay').classList.remove('open');
        currentEnquiryId = null;
    };


    /* ── SAVE (status / priority / note) ───────────────────── */

    window.saveEnquiry = async function () {
        if (!currentEnquiryId) return;
        const btn = document.getElementById('modal-save-btn');
        btn.textContent = 'Saving…';
        btn.disabled = true;

        try {
            const res = await fetch(API + '/admin/enquiries/' + currentEnquiryId, {
                method: 'PUT',
                headers: authHeaders(),
                body: JSON.stringify({
                    status: document.getElementById('modal-status').value,
                    priority: document.getElementById('modal-priority').value,
                    adminNote: document.getElementById('modal-note').value.trim(),
                }),
            });
            const data = await res.json();

            if (res.ok && data.success) {
                toast('✅ Enquiry updated successfully!');
                closeModalDirect();
                loadEnquiries(currentPage);
                loadStats();
            } else {
                toast('⚠️ ' + (data.error || 'Update failed'));
            }
        } catch (_) {
            toast('Connection error.');
        }

        btn.textContent = 'Save Changes';
        btn.disabled = false;
    };


    /* ── DELETE ─────────────────────────────────────────────── */

    window.deleteEnquiry = async function (id) {
        if (!confirm('Delete this enquiry? This cannot be undone.')) return;
        try {
            const res = await fetch(API + '/admin/enquiries/' + id, {
                method: 'DELETE',
                headers: authHeaders(),
            });
            const data = await res.json();

            if (res.ok && data.success) {
                toast('🗑️ Enquiry deleted.');
                loadEnquiries(currentPage);
                loadStats();
                loadRecentEnquiries();
            } else {
                toast('⚠️ ' + (data.error || 'Delete failed'));
            }
        } catch (_) {
            toast('Connection error.');
        }
    };


    /* ================================================================
       EVENT LISTENERS
       ================================================================ */

    document.getElementById('la-btn').addEventListener('click', handleLogin);

    // Press Enter on password field to submit
    document.getElementById('la-pass').addEventListener('keydown', e => {
        if (e.key === 'Enter') handleLogin();
    });


    /* ================================================================
       INIT
       ================================================================ */

    checkAuth();

})();