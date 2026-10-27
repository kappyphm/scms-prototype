/* SCMS prototype — core router, state, helpers, shell */
(function () {
  const NS = window.SCMS;
  const DATA_KEY = "scms_data_v1";
  const SESSION_KEY = "scms_session_v1";

  /* ---------------- Session & data ---------------- */
  function readSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    return {};
  }
  const session = readSession();

  NS.state = {
    role: session.role || "cashier",
    branchId: session.branchId || "D1",
    currentUser: session.currentUser || "C01",
    cart: [],
    heldCart: null,
    posCategory: "all",
    posSearch: "",
    orderType: "dine_in",
    voucherCode: "",
    pendingOrder: null,
    checkoutMethod: "cash",
    checkoutState: "idle",
    cashReceived: "",
    lastOrderId: null,
    orderFilters: {
      date: "2026-10-20",
      status: "all",
      method: "all",
      cashier: "all",
      search: "",
    },
    orderPage: 1,
    orderPerPage: 10,
    inventorySearch: "",
    inventoryCategory: "all",
    employeeSearch: "",
    employeeRole: "all",
    employeeStatus: "all",
    rosterWeekStart: "2026-10-19",
    attendanceSearch: "",
    reportTab: "branch",
    reportType: "overview",
    reportFrom: "2026-10-14",
    reportTo: "2026-10-20",
    reportBranch: session.branchId || "D1",
    kioskEmployeeId: "",
    kioskPin: "",
    kioskResult: null,
    kioskAttempts: {},
    loginAttempts: 0,
    loginLockedUntil: 0,
    syncResult: null,
    selectedPromotion: null,
    selectedBranch: null,
  };

  function loadData() {
    try {
      const raw = localStorage.getItem(DATA_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    return NS.seed();
  }
  NS.data = loadData();

  NS.saveData = function () {
    try { localStorage.setItem(DATA_KEY, JSON.stringify(NS.data)); } catch (e) { /* ignore quota */ }
  };
  NS.saveSession = function () {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        role: NS.state.role,
        branchId: NS.state.branchId,
        currentUser: NS.state.currentUser,
      }));
    } catch (e) { /* ignore */ }
  };
  NS.resetDemo = function () {
    try {
      localStorage.removeItem(DATA_KEY);
      localStorage.removeItem(SESSION_KEY);
    } catch (e) { /* ignore */ }
    location.hash = "#/login";
    location.reload();
  };

  /* ---------------- Escape & format ---------------- */
  NS.esc = function (value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[ch]));
  };
  const esc = NS.esc;
  const pad = (n) => String(n).padStart(2, "0");
  function toDate(value) {
    if (!value) return null;
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const p = value.split("-");
      return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    }
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  NS.fmt = {
    currency(n) {
      return Math.round(Number(n) || 0).toLocaleString("vi-VN") + " VNĐ";
    },
    number(n) {
      return (Number(n) || 0).toLocaleString("vi-VN");
    },
    qty(n) {
      return (Number(n) || 0).toLocaleString("vi-VN", { maximumFractionDigits: 3 });
    },
    percent(n) {
      return (Number(n) || 0).toFixed(1).replace(".", ",") + "%";
    },
    date(value) {
      const d = toDate(value);
      if (!d) return "—";
      return pad(d.getDate()) + "/" + pad(d.getMonth() + 1) + "/" + d.getFullYear();
    },
    time(value) {
      const d = toDate(value);
      if (!d) return "—";
      return pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
    },
    timeShort(value) {
      const d = toDate(value);
      if (!d) return "—";
      return pad(d.getHours()) + ":" + pad(d.getMinutes());
    },
    datetime(value) {
      const d = toDate(value);
      if (!d) return "—";
      return pad(d.getDate()) + "/" + pad(d.getMonth() + 1) + "/" + d.getFullYear() + " " +
        pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
    },
    clock(value) {
      const d = value ? new Date(value) : new Date();
      return pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
    },
    weekday(value) {
      const d = value ? new Date(value) : new Date();
      const names = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];
      return names[d.getDay()];
    },
    dateFromInput(value) {
      return value || "";
    },
  };
  NS.nowIso = function () {
    const d = new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) +
      "T" + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
  };
  NS.today = function () { return NS.data.meta.today; };
  NS.addDays = function (date, offset) {
    const d = toDate(date);
    d.setDate(d.getDate() + offset);
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  };
  NS.dateOnly = function (value) {
    const d = toDate(value);
    if (!d) return "";
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  };
  NS.minutesBetween = function (a, b) {
    const d1 = toDate(a); const d2 = toDate(b);
    if (!d1 || !d2) return 0;
    return Math.round((d2 - d1) / 60000);
  };

  /* ---------------- Lookups ---------------- */
  NS.get = {
    branch(id) { return NS.data.branches.find((b) => b.id === (id || NS.state.branchId)); },
    employee(id) { return NS.data.employees.find((e) => e.id === id); },
    product(id) { return NS.data.products.find((p) => p.id === id); },
    ingredient(id) { return NS.data.ingredients.find((i) => i.id === id); },
    topping(id) { return NS.data.toppings.find((t) => t.id === id); },
    voucher(code) { return NS.data.vouchers.find((v) => v.code === String(code || "").toUpperCase()); },
    order(id) { return NS.data.orders.find((o) => o.id === id || o.code === id); },
    shift(id) { return NS.data.shifts.find((s) => s.id === id); },
    stock(id) { return NS.data.stockTransactions.find((s) => s.id === id); },
    approval(id) { return NS.data.approvals.find((a) => a.id === id); },
  };
  NS.branch = function () { return NS.get.branch(NS.state.branchId) || NS.data.branches[0]; };
  NS.employee = function (id) { return NS.get.employee(id); };
  NS.currentUser = function () {
    return NS.get.employee(NS.state.currentUser) ||
      NS.data.employees.find((e) => e.id === "C01") ||
      NS.data.employees[0];
  };
  NS.roleLabel = function (role) {
    return ({ coo: "COO", manager: "Quản lý chi nhánh", cashier: "Thu ngân", staff: "Nhân viên" })[role] || role;
  };
  NS.roleKey = function (empRole) {
    return ({ COO: "coo", "Branch Manager": "manager", Cashier: "cashier", Staff: "staff" })[empRole] || "cashier";
  };
  NS.branchName = function (id) { return (NS.get.branch(id) || {}).name || "—"; };

  /* ---------------- Role / branch switching ---------------- */
  NS.setRole = function (role) {
    NS.state.role = role;
    if (role === "coo") {
      NS.state.currentUser = "E00";
      NS.state.branchId = NS.state.branchId || "D1";
    } else if (role === "manager") {
      const b = NS.get.branch(NS.state.branchId) || NS.data.branches[0];
      NS.state.currentUser = b.managerId;
    } else if (role === "cashier") {
      const c = NS.data.employees.find((e) => e.branchId === NS.state.branchId && e.role === "Cashier" && e.status === "active") ||
        NS.data.employees.find((e) => e.role === "Cashier");
      NS.state.currentUser = c ? c.id : "C01";
      NS.state.branchId = c ? c.branchId : NS.state.branchId;
    } else {
      const s = NS.data.employees.find((e) => e.role === "Staff" && e.branchId === NS.state.branchId) ||
        NS.data.employees.find((e) => e.role === "Staff");
      NS.state.currentUser = s ? s.id : "S01";
    }
    NS.saveSession();
    const defaults = { coo: "/chain", manager: "/branch", cashier: "/pos", staff: "/kiosk" };
    const view = NS.currentView;
    if (view && view.roles && view.roles.includes(role) && NS.currentPath !== "/login") {
      NS.refresh();
    } else {
      NS.navigate(defaults[role] || "/dispatch");
    }
  };
  NS.setBranch = function (branchId) {
    NS.state.branchId = branchId;
    if (NS.state.role === "manager") {
      const b = NS.get.branch(branchId);
      if (b) NS.state.currentUser = b.managerId;
    }
    if (NS.state.role === "cashier") {
      const c = NS.data.employees.find((e) => e.branchId === branchId && e.role === "Cashier" && e.status === "active");
      if (c) NS.state.currentUser = c.id;
    }
    NS.saveSession();
    NS.refresh();
  };

  /* ---------------- Calculations ---------------- */
  function branchFactor(branchId) {
    const idx = NS.data.branches.findIndex((b) => b.id === branchId);
    if (idx <= 0) return 1;
    return 0.45 + idx * 0.065;
  }
  NS.calc = {
    productPrice(product, size, toppingIds) {
      if (!product) return 0;
      const base = product.prices[size] || product.prices.M || 0;
      const top = (toppingIds || []).reduce((s, id) => {
        const t = NS.get.topping(id);
        return s + (t ? t.price : 0);
      }, 0);
      return base + top;
    },
    cartSubtotal(cart) {
      return (cart || []).reduce((s, l) => s + l.unitPrice * l.qty, 0);
    },
    cartCount(cart) {
      return (cart || []).reduce((s, l) => s + l.qty, 0);
    },
    voucher(code, subtotal) {
      const v = NS.get.voucher(code);
      if (!v) return { ok: false, discount: 0, message: "Mã voucher không tồn tại." };
      if (v.status !== "active") return { ok: false, discount: 0, message: "Voucher đang tạm dừng hoặc đã hết hạn." };
      const today = NS.today();
      if (v.start && today < v.start) return { ok: false, discount: 0, message: "Voucher chưa đến thời gian áp dụng." };
      if (v.end && today > v.end) return { ok: false, discount: 0, message: "Voucher đã hết hạn." };
      if (v.usageLimit && v.used >= v.usageLimit) return { ok: false, discount: 0, message: "Voucher đã hết lượt sử dụng." };
      if (subtotal < (v.minOrder || 0)) return { ok: false, discount: 0, message: "Đơn hàng chưa đạt giá trị tối thiểu " + NS.fmt.currency(v.minOrder) + "." };
      let discount = v.type === "percent" ? Math.round(subtotal * v.value / 100 / 1000) * 1000 : v.value;
      discount = Math.min(discount, subtotal);
      return { ok: true, discount, message: "Đã áp dụng " + v.code + " — giảm " + NS.fmt.currency(discount), voucher: v };
    },
    cartTotals() {
      const subtotal = NS.calc.cartSubtotal(NS.state.cart);
      const v = NS.state.voucherCode ? NS.calc.voucher(NS.state.voucherCode, subtotal) : null;
      const discount = v && v.ok ? v.discount : 0;
      return { subtotal, discount, total: Math.max(0, subtotal - discount), voucher: v };
    },
    orderNet(order) {
      if (!order || order.status === "cancelled" || !order.payment || order.payment.status !== "completed") return 0;
      const refunded = (order.refunds || []).filter((r) => r.status === "completed").reduce((s, r) => s + r.amount, 0);
      return Math.max(0, order.total - refunded);
    },
    orderRefunded(order) {
      return (order.refunds || []).filter((r) => r.status === "completed").reduce((s, r) => s + r.amount, 0);
    },
    bomCost(productId, size) {
      const recipe = (NS.data.bom[productId] || {})[size];
      if (!recipe) return 0;
      return recipe.reduce((sum, line) => {
        const ing = NS.get.ingredient(line[0]);
        return sum + (ing ? line[1] * ing.unitCost : 0);
      }, 0);
    },
    bomLines(productId, size) {
      const recipe = (NS.data.bom[productId] || {})[size] || [];
      return recipe.map((line) => {
        const ing = NS.get.ingredient(line[0]);
        return {
          ingredient: ing,
          qty: line[1],
          unit: ing ? ing.baseUnit : "",
          cost: ing ? line[1] * ing.unitCost : 0,
        };
      });
    },
    orderCogs(order) {
      if (!order || order.status === "cancelled") return 0;
      if (order.status === "refunded") return 0;
      return order.items.reduce((sum, item) => sum + NS.calc.bomCost(item.productId, item.size) * item.qty, 0);
    },
    bomUsage(order) {
      const map = {};
      (order.items || []).forEach((item) => {
        const recipe = (NS.data.bom[item.productId] || {})[item.size] || [];
        recipe.forEach((line) => {
          const ing = NS.get.ingredient(line[0]);
          if (!ing) return;
          if (!map[line[0]]) map[line[0]] = { ingredient: ing, qty: 0 };
          map[line[0]].qty += line[1] * item.qty;
        });
      });
      return Object.values(map).sort((a, b) => b.qty - a.qty);
    },
    ingredientOnHand(ing, branchId) {
      if (!ing) return 0;
      const factor = branchFactor(branchId || NS.state.branchId);
      return Math.round(ing.onHandBase * factor);
    },
    stockStatus(ing, branchId) {
      const qty = NS.calc.ingredientOnHand(ing, branchId);
      if (qty <= 0) return "out";
      if (qty <= ing.minStock) return "low";
      if (qty <= ing.minStock * 1.25) return "watch";
      return "ok";
    },
    currentShift(branchId) {
      return NS.data.shifts.find((s) => s.branchId === (branchId || NS.state.branchId) && s.status === "open") || null;
    },
    shiftStats(shift) {
      if (!shift) return { cashSales: 0, refunds: 0, cashIn: 0, cashOut: 0, theoretical: 0, variance: 0, counted: 0 };
      const orders = NS.data.orders.filter((o) => {
        if (o.branchId !== shift.branchId) return false;
        if (!o.createdAt) return false;
        if (shift.closedAt) return o.createdAt >= shift.openedAt && o.createdAt <= shift.closedAt;
        return o.createdAt >= shift.openedAt;
      });
      const cashSales = orders.reduce((s, o) => {
        if (o.payment.method !== "cash") return s;
        if (o.status === "paid" || o.status === "partial_refunded") return s + o.total;
        return s;
      }, 0);
      const refunds = NS.data.orders.reduce((sum, o) => {
        (o.refunds || []).forEach((r) => {
          if (r.status !== "completed") return;
          if (o.branchId !== shift.branchId) return;
          if (!r.processedAt) return;
          if (shift.closedAt && r.processedAt > shift.closedAt) return;
          if (r.processedAt < shift.openedAt) return;
          sum += r.amount;
        });
        return sum;
      }, 0);
      const cashIn = shift.transactions.filter((t) => t.type === "cash_in").reduce((s, t) => s + t.amount, 0);
      const cashOut = shift.transactions.filter((t) => t.type === "cash_out").reduce((s, t) => s + t.amount, 0);
      const theoretical = shift.openingCash + cashSales - refunds + cashIn - cashOut;
      const counted = shift.countedCash || 0;
      return { cashSales, refunds, cashIn, cashOut, theoretical, variance: counted - theoretical, counted };
    },
    ordersInRange(branchId, from, to, allBranches) {
      return NS.data.orders.filter((o) => {
        const day = (o.createdAt || "").slice(0, 10);
        if (day < from || day > to) return false;
        if (!allBranches && branchId && o.branchId !== branchId) return false;
        return true;
      });
    },
    revenue(orders) {
      return orders.reduce((s, o) => s + NS.calc.orderNet(o), 0);
    },
    cogs(orders) {
      return orders.reduce((s, o) => s + NS.calc.orderCogs(o), 0);
    },
    pendingApprovals() {
      return NS.data.approvals.filter((a) => a.status === "pending").length;
    },
    lowStock(branchId) {
      return NS.data.ingredients.map((ing) => ({ ing, status: NS.calc.stockStatus(ing, branchId) }))
        .filter((x) => x.status === "low" || x.status === "out" || x.status === "watch")
        .sort((a, b) => {
          const order = { out: 0, low: 1, watch: 2 };
          return order[a.status] - order[b.status];
        });
    },
    activeStaff(branchId) {
      const today = NS.today();
      return NS.data.attendance.filter((a) => a.branchId === branchId && a.workDate === today && a.checkIn && !a.checkOut);
    },
    attendanceHours(att) {
      if (!att || !att.checkIn) return 0;
      if (att.hours != null) return att.hours;
      if (!att.checkOut) return Math.max(0, (Date.now() - new Date(att.checkIn).getTime()) / 3600000);
      return Math.max(0, NS.minutesBetween(att.checkIn, att.checkOut) / 60);
    },
    schedule(employeeId, date) {
      return NS.data.schedule[employeeId + "|" + date] || "";
    },
    paymentMix(orders) {
      const map = { cash: { method: "Tiền mặt", orders: 0, amount: 0 }, vietqr: { method: "VietQR / SePay", orders: 0, amount: 0 } };
      orders.forEach((o) => {
        if (!o.payment || o.payment.status !== "completed") return;
        const key = o.payment.method === "cash" ? "cash" : "vietqr";
        if (!map[key]) map[key] = { method: key, orders: 0, amount: 0 };
        map[key].orders += 1;
        map[key].amount += NS.calc.orderNet(o);
      });
      return Object.values(map);
    },
  };

  /* ---------------- UI: icons & common components ---------------- */
  const icons = {
    dashboard: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    pos: '<path d="M4 4h16v16H4z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    orders: '<path d="M6 3h12l2 4v14H4V7z"/><path d="M8 11h8M8 15h8"/>',
    cash: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 10v4M18 10v4"/>',
    inventory: '<path d="M3 7l9-4 9 4-9 4z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/>',
    users: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5"/><circle cx="17" cy="9" r="2"/><path d="M16 15c2.5 0 4.5 1.5 4.5 4"/>',
    report: '<path d="M4 20V4h16v16z"/><path d="M8 16v-4M12 16V8M16 16v-6"/>',
    approve: '<path d="M4 12l5 5L20 6"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h10"/>',
    tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="7.5" r="1"/>',
    branch: '<path d="M4 21V9l8-5 8 5v12"/><path d="M9 21v-6h6v6"/><path d="M4 9h16"/>',
    sync: '<path d="M20 7h-6V1"/><path d="M4 17h6v6"/><path d="M20 7a8 8 0 00-14-2L4 7M4 17a8 8 0 0014 2l2-2"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9L7 7M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/>',
    audit: '<path d="M6 3h12v18H6z"/><path d="M9 7h6M9 11h6M9 15h4"/>',
    dashboard2: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    back: '<path d="M15 18l-6-6 6-6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    print: '<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M6 17h12v4H6z"/>',
    check: '<path d="M4 12l5 5L20 6"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    filter: '<path d="M3 5h18l-7 8v6l-4 2v-8z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    wallet: '<path d="M3 6h16a2 2 0 012 2v10H3z"/><path d="M3 6V4h14"/><circle cx="17" cy="12" r="1"/>',
    box: '<path d="M4 7l8-4 8 4-8 4z"/><path d="M4 7v10l8 4 8-4V7"/>',
    bell: '<path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
  };
  NS.ui = {
    icon(name, cls) {
      const path = icons[name] || icons.arrowRight;
      return '<svg class="' + (cls || "") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + path + "</svg>";
    },
    roleOptions(selected) {
      return [["coo", "COO"], ["manager", "Quản lý chi nhánh"], ["cashier", "Thu ngân"], ["staff", "Nhân viên"]]
        .map((r) => '<option value="' + r[0] + '"' + (selected === r[0] ? " selected" : "") + ">" + r[1] + "</option>").join("");
    },
    branchOptions(selected, all) {
      const list = all ? [{ id: "all", code: "ALL", name: "Tất cả chi nhánh" }].concat(NS.data.branches) : NS.data.branches;
      return list.map((b) => '<option value="' + b.id + '"' + (selected === b.id ? " selected" : "") + ">" + esc(b.code + " · " + b.name) + "</option>").join("");
    },
    statusTag(status, label) {
      const map = {
        pending: ["Chờ thanh toán", "pending"], paid: ["Đã thanh toán", "done"], partial_refunded: ["Hoàn một phần", "warn"], refunded: ["Đã hoàn tiền", "neutral"], cancelled: ["Đã hủy", "danger"],
        completed: ["Đã hoàn tất", "done"], mismatch: ["Sai số tiền", "danger"], failed: ["Thất bại", "danger"], success: ["Thành công", "done"], partial: ["Một phần", "warn"],
        open: ["Đang mở", "done"], closed: ["Đã đóng", "neutral"], maintenance: ["Bảo trì", "warn"], online: ["Online", "success"], offline: ["Offline", "danger"],
        active: ["Đang hoạt động", "done"], inactive: ["Ngừng hoạt động", "neutral"], approved: ["Đã duyệt", "done"], rejected: ["Từ chối", "danger"],
        on_time: ["Đúng giờ", "done"], late: ["Đi muộn", "warn"], early: ["Về sớm", "warn"], missing: ["Thiếu check-out", "danger"], absent: ["Vắng", "danger"], unscheduled: ["Ngoài ca", "warn"],
        ok: ["Đủ hàng", "done"], watch: ["Sắp hết", "warn"], low: ["Dưới ngưỡng", "warn"], out: ["Hết hàng", "danger"],
        scheduled: ["Sắp chạy", "pending"], paused: ["Tạm dừng", "neutral"], expired: ["Hết hạn", "neutral"],
        pending_approval: ["Chờ duyệt", "pending"], none: ["Không yêu cầu", "neutral"],
      };
      const entry = map[status] || [status || "—", "neutral"];
      return '<span class="tag tag-' + entry[1] + '">' + esc(label || entry[0]) + "</span>";
    },
    empty(title, desc, action) {
      return '<div class="empty"><div class="empty__icon">' + NS.ui.icon("search") + "</div><h3>" + esc(title) + "</h3><p>" + esc(desc || "") + "</p>" + (action || "") + "</div>";
    },
    notice(text, kind, icon) {
      return '<div class="notice notice--' + (kind || "accent") + '"><span class="notice__icon">' + (icon || "!") + "</span><div>" + text + "</div></div>";
    },
    kpiStrip(items) {
      return '<div class="kpi-strip">' + items.map((k) => '<div class="kpi ' + (k.className || "") + '"><div class="kpi__label">' + esc(k.label) + '</div><strong>' + (k.value || "") + "</strong>" + (k.sub ? "<small>" + k.sub + "</small>" : "") + "</div>").join("") + "</div>";
    },
    pageHead(code, title, subtitle, actions) {
      return '<div class="page-head"><div><div class="page-code">' + code + '</div><h1>' + esc(title) + "</h1>" + (subtitle ? '<p class="page-sub">' + subtitle + "</p>" : "") + '</div><div class="page-actions">' + (actions || "") + "</div></div>";
    },
    pagination(total, page, perPage, action) {
      const pages = Math.max(1, Math.ceil(total / perPage));
      const safePage = Math.min(Math.max(1, page), pages);
      const start = total === 0 ? 0 : (safePage - 1) * perPage + 1;
      const end = Math.min(total, safePage * perPage);
      let buttons = "";
      const from = Math.max(1, safePage - 2);
      const to = Math.min(pages, from + 4);
      for (let i = from; i <= to; i++) buttons += '<button class="' + (i === safePage ? "active" : "") + '" data-action="' + action + '" data-page="' + i + '">' + i + "</button>";
      return '<div class="table-foot"><span>Hiển thị ' + start + "–" + end + " / " + total + " bản ghi</span><div class=\"pagination\">" +
        '<button data-action="' + action + '" data-page="' + (safePage - 1) + '"' + (safePage === 1 ? " disabled" : "") + ">‹</button>" +
        buttons +
        '<button data-action="' + action + '" data-page="' + (safePage + 1) + '"' + (safePage === pages ? " disabled" : "") + ">›</button>" +
        '<select data-change="' + action + '-size">' + [10, 25, 50, 100].map((n) => '<option value="' + n + '"' + (n === perPage ? " selected" : "") + ">" + n + "/trang</option>").join("") + "</select></div></div>";
    },
    bars(items, opts) {
      opts = opts || {};
      const max = Math.max.apply(null, items.map((i) => i.value).concat([1]));
      const peak = opts.peak || Math.max.apply(null, items.map((i) => i.value).concat([0]));
      return '<div class="bars">' + items.map((item) => {
        const height = Math.max(2, Math.round((item.value / max) * 100));
        return '<div class="bar ' + (item.value === peak && peak > 0 ? "is-peak" : "") + '" title="' + esc(item.label + ": " + (item.title || item.value)) + '"><span class="bar__value">' + esc(item.title || item.value) + '</span><div class="bar__fill" style="height:' + height + '%"></div><span class="bar__label">' + esc(item.label) + "</span></div>";
      }).join("") + "</div>";
    },
    hbars(items) {
      const max = Math.max.apply(null, items.map((i) => i.value).concat([1]));
      return '<div class="hbar-list">' + items.map((i) => '<div class="hbar"><span>' + esc(i.label) + '</span><div class="hbar__track"><div class="hbar__fill" style="width:' + Math.max(1, Math.round(i.value / max * 100)) + '%"></div></div><span class="hbar__value">' + esc(i.display || i.value) + "</span></div>").join("") + "</div>";
    },
    qrSvg(text) {
      let h = 2166136261;
      for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
      const size = 21;
      const finder = (x, y) => {
        let s = "";
        for (let i = 0; i < 7; i++) for (let j = 0; j < 7; j++) {
          const edge = i === 0 || i === 6 || j === 0 || j === 6;
          const core = i >= 2 && i <= 4 && j >= 2 && j <= 4;
          if (edge || core) s += '<rect x="' + (x + j) + '" y="' + (y + i) + '" width="1" height="1"/>';
        }
        return s;
      };
      let cells = '<rect x="0" y="0" width="' + size + '" height="' + size + '" fill="#fff"/>';
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
        if ((x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12)) continue;
        const v = (h + x * 73 + y * 151 + x * y * 17) % 11;
        if (v < 4) cells += '<rect x="' + x + '" y="' + y + '" width="1" height="1" fill="#1a1815"/>';
      }
      cells += '<g fill="#1a1815">' + finder(0, 0) + finder(14, 0) + finder(0, 14) + "</g>";
      return '<svg viewBox="0 0 21 21" role="img" aria-label="Mã QR mô phỏng" xmlns="http://www.w3.org/2000/svg">' + cells + "</svg>";
    },
  };

  /* ---------------- Topbar / sidebar / shell ---------------- */
  NS.ui.topbar = function (opts) {
    opts = opts || {};
    const b = NS.branch();
    const shift = NS.calc.currentShift(b.id);
    const user = NS.currentUser();
    const role = NS.state.role;
    const initials = (user.name || "SC").split(" ").slice(-2).map((p) => p[0]).join("").toUpperCase();
    const roleSelect = '<label class="role-switch"><span>Vai trò</span><select data-change="switch-role">' + NS.ui.roleOptions(role) + "</select></label>";
    const branchSwitch = role === "coo"
      ? '<label class="branch-switch"><select data-change="switch-branch">' + NS.ui.branchOptions(b.id) + "</select></label>"
      : '<span class="topbar__branch">' + esc(b.code + " · " + b.name) + "</span>";
    return '<header class="topbar ' + (opts.dark ? "topbar--pos" : "") + '">' +
      '<div class="topbar__left">' +
      (opts.noMenu ? "" : '<button class="icon-btn menu-btn" data-action="toggle-nav" aria-label="Mở menu">' + NS.ui.icon("menu") + "</button>") +
      '<a class="brand" href="#/dispatch"><span class="brand__mark">SC</span><span class="brand__name">SCMS</span></a>' +
      branchSwitch + "</div>" +
      '<div class="topbar__right">' + roleSelect +
      '<span class="topbar__meta">' + NS.ui.icon("clock") + (shift ? '<span class="topbar__shift">Ca ' + NS.fmt.timeShort(shift.openedAt) + " · " + esc(shift.cashierName) + "</span>" : '<span class="topbar__shift">Chưa mở ca</span>') + "</span>" +
      '<span class="topbar__clock" data-clock></span>' +
      '<button class="btn btn-ghost btn-sm" data-action="reset-demo" title="Reset dữ liệu demo">Reset</button>' +
      '<a class="avatar" href="#/dispatch" title="' + esc(user.name + " · " + NS.roleLabel(role)) + '">' + esc(initials) + "</a>" +
      "</div></header>";
  };

  NS.ui.sidebar = function (navType, active) {
    const role = NS.state.role;
    const type = role === "coo" ? "chain" : role === "cashier" ? "cashier" : navType || "branch";
    const pending = NS.calc.pendingApprovals();
    const groups = {
      chain: [
        { label: "Tổng quan", items: [
          { key: "chain", label: "Chain Dashboard", href: "#/chain", icon: "dashboard" },
          { key: "branch", label: "Vận hành chi nhánh", href: "#/branch", icon: "branch" },
        ] },
        { label: "Master data", items: [
          { key: "menu", label: "Menu & BOM", href: "#/chain/menu", icon: "menu" },
          { key: "promotions", label: "Khuyến mãi", href: "#/chain/promotions", icon: "tag" },
          { key: "branches", label: "Chi nhánh & Manager", href: "#/chain/branches", icon: "branch" },
          { key: "sync", label: "Đồng bộ chuỗi", href: "#/chain/sync", icon: "sync" },
        ] },
        { label: "Phân tích", items: [
          { key: "reports", label: "Báo cáo & Analytics", href: "#/reports", icon: "report" },
        ] },
        { label: "Hệ thống", items: [
          { key: "settings", label: "Cấu hình & bảo mật", href: "#/settings", icon: "settings" },
          { key: "audit", label: "Audit Logs", href: "#/audit", icon: "audit" },
          { key: "approvals", label: "Phê duyệt", href: "#/approvals", icon: "approve", badge: pending },
        ] },
      ],
      branch: [
        { label: "Vận hành", items: [
          { key: "branch", label: "Tổng quan chi nhánh", href: "#/branch", icon: "dashboard" },
          { key: "pos", label: "POS bán hàng", href: "#/pos", icon: "pos" },
          { key: "orders", label: "Đơn hàng", href: "#/orders", icon: "orders" },
          { key: "shift", label: "Ca quỹ", href: "#/shift", icon: "cash" },
        ] },
        { label: "Quản lý chi nhánh", items: [
          { key: "inventory", label: "Kho nguyên liệu", href: "#/branch/inventory", icon: "inventory" },
          { key: "employees", label: "Nhân sự & ca", href: "#/branch/employees", icon: "users" },
          { key: "approvals", label: "Phê duyệt", href: "#/approvals", icon: "approve", badge: pending },
        ] },
        { label: "Phân tích", items: [
          { key: "reports", label: "Báo cáo vận hành", href: "#/reports", icon: "report" },
        ] },
      ],
      cashier: [
        { label: "Bán hàng", items: [
          { key: "pos", label: "POS bán hàng", href: "#/pos", icon: "pos" },
          { key: "orders", label: "Đơn hàng", href: "#/orders", icon: "orders" },
          { key: "shift", label: "Ca quỹ", href: "#/shift", icon: "cash" },
        ] },
      ],
    };
    const list = groups[type] || groups.branch;
    return '<aside class="sidebar" id="sidebar"><nav>' + list.map((group) =>
      '<div class="nav-group"><div class="nav-label">' + esc(group.label) + "</div>" +
      group.items.map((item) => '<a class="nav-item ' + (active === item.key ? "active" : "") + '" href="' + item.href + '">' +
        '<span class="nav-item__icon">' + NS.ui.icon(item.icon) + "</span><span>" + esc(item.label) + "</span>" +
        (item.badge ? '<span class="nav-badge">' + item.badge + "</span>" : "") + "</a>").join("") +
      "</div>").join("") + '</nav><div class="sidebar__foot"><div><strong>SCMS v1.0</strong> · Prototype</div><div class="mt-4">' + esc(NS.roleLabel(role)) + " · " + esc(NS.currentUser().name) + "</div></div></aside>";
  };

  NS.ui.shell = function (opts) {
    opts = opts || {};
    const navType = opts.nav || (NS.state.role === "coo" ? "chain" : NS.state.role === "cashier" ? "cashier" : "branch");
    return '<div class="app">' + NS.ui.topbar() + '<div class="app-shell">' + NS.ui.sidebar(navType, opts.active) +
      '<main class="main">' + (opts.breadcrumb || "") +
      NS.ui.pageHead(opts.code || "", opts.title || "", opts.subtitle || "", opts.actions || "") +
      (opts.content || "") + "</main></div></div>";
  };

  NS.ui.task = function (opts) {
    opts = opts || {};
    return '<div class="task-screen">' + NS.ui.topbar() +
      '<div class="task-head"><a class="task-head__back" href="' + (opts.back || "javascript:history.back()") + '" aria-label="Quay lại">' + NS.ui.icon("back") + "</a>" +
      '<div class="task-head__main"><div class="page-code">' + (opts.code || "") + "</div><h1>" + esc(opts.title || "") + "</h1>" + (opts.subtitle ? "<p>" + opts.subtitle + "</p>" : "") + "</div>" +
      '<div class="task-head__meta">' + (opts.meta || "") + "</div></div>" +
      '<div class="task-body">' + (opts.content || "") + "</div>" +
      (opts.footer ? '<div class="task-footer">' + opts.footer + "</div>" : "") + "</div>";
  };

  NS.ui.denied = function () {
    return NS.ui.shell({
      code: "RBAC",
      title: "Không có quyền truy cập",
      subtitle: "Bạn đang đăng nhập với vai trò " + NS.roleLabel(NS.state.role) + ". Màn hình này không thuộc phạm vi quyền của bạn.",
      active: "",
      content: NS.ui.notice("Bạn không có quyền truy cập chức năng này. Vui lòng quay về Role Dispatcher hoặc chuyển vai trò demo ở góc phải.", "danger") +
        '<div class="mt-16"><a class="btn btn-primary" href="#/dispatch">Quay về Role Dispatcher</a></div>',
    });
  };

  /* ---------------- Router ---------------- */
  const routes = [];
  NS.views = {};
  NS.currentView = null;
  NS.currentCtx = null;
  NS.currentPath = "/login";
  NS.view = function (name, def) { NS.views[name] = def; };
  NS.route = function (pattern, name) {
    const keys = [];
    const rx = new RegExp("^" + pattern.replace(/:[^/]+/g, (m) => { keys.push(m.slice(1)); return "([^/]+)"; }) + "/?$");
    routes.push({ pattern, name, rx, keys });
  };
  function splitQuery(raw) {
    const i = raw.indexOf("?");
    if (i < 0) return { path: raw, query: {} };
    const path = raw.slice(0, i);
    const query = {};
    raw.slice(i + 1).split("&").forEach((pair) => {
      if (!pair) return;
      const [k, v] = pair.split("=");
      query[decodeURIComponent(k)] = decodeURIComponent(v || "");
    });
    return { path, query };
  }
  NS.parseHash = function () {
    return splitQuery((location.hash || "#/login").replace(/^#/, "") || "/login");
  };
  NS.resolve = function (path) {
    for (let i = 0; i < routes.length; i++) {
      const r = routes[i];
      const m = path.match(r.rx);
      if (m) {
        const params = {};
        r.keys.forEach((k, idx) => { params[k] = decodeURIComponent(m[idx + 1]); });
        return { name: r.name, params };
      }
    }
    return null;
  };
  NS.navigate = function (path) {
    if (location.hash === "#" + path) {
      render();
    } else {
      location.hash = "#" + path;
    }
  };
  function render() {
    const parsed = NS.parseHash();
    NS.currentPath = parsed.path;
    const match = NS.resolve(parsed.path);
    const app = document.getElementById("app");
    if (!match) {
      NS.currentView = null;
      app.innerHTML = NS.ui.shell({
        code: "404",
        title: "Không tìm thấy màn hình",
        subtitle: "Đường dẫn " + esc(parsed.path) + " không tồn tại trong prototype.",
        active: "",
        content: '<a class="btn btn-primary" href="#/dispatch">Về Role Dispatcher</a>',
      });
      return;
    }
    const view = NS.views[match.name];
    if (!view) {
      app.innerHTML = NS.ui.shell({ code: "404", title: "Màn hình chưa được dựng", subtitle: match.name, active: "", content: "" });
      return;
    }
    NS.currentView = view;
    NS.currentCtx = { params: match.params, query: parsed.query, path: parsed.path };
    const role = NS.state.role;
    const allowed = !view.roles || view.roles.includes(role);
    app.innerHTML = allowed ? view.render(NS.currentCtx) : NS.ui.denied();
    const sidebar = document.getElementById("sidebar");
    if (sidebar) sidebar.classList.remove("is-open");
    if (allowed && view.mount) view.mount(NS.currentCtx);
    document.body.classList.toggle("is-pos", parsed.path === "/pos" || parsed.path.indexOf("/pos/") === 0);
    tickClock();
    if (view.afterRender) view.afterRender(NS.currentCtx);
  }
  NS.render = render;
  function invoke(action, ctx) {
    const view = NS.currentView;
    if (view && view.actions && view.actions[action]) return view.actions[action](ctx);
    if (action === "switch-role") { NS.setRole(ctx.value); return; }
    if (action === "switch-branch") { NS.setBranch(ctx.value); return; }
    if (action === "toggle-nav") {
      const sidebar = document.getElementById("sidebar");
      if (sidebar) sidebar.classList.toggle("is-open");
      return false;
    }
    if (action === "reset-demo") {
      NS.dialog({
        title: "Reset dữ liệu demo",
        message: "Toàn bộ thay đổi trong phiên trải nghiệm sẽ bị xóa và dữ liệu mẫu được khôi phục. Bạn có chắc chắn?",
        confirmText: "Reset dữ liệu",
        danger: true,
        onConfirm: NS.resetDemo,
      });
      return;
    }
    return null;
  }
  document.addEventListener("click", function (event) {
    const el = event.target.closest("[data-action]");
    if (!el) return;
    if (el.tagName === "A" && !el.getAttribute("href")) event.preventDefault();
    if (el.disabled) return;
    const action = el.getAttribute("data-action");
    const handled = invoke(action, { el, event, params: (NS.currentCtx || {}).params || {}, query: (NS.currentCtx || {}).query || {} });
    if (handled !== false && (el.tagName === "A" || el.tagName === "BUTTON")) {
      if (!el.getAttribute("href")) event.preventDefault();
    }
  });
  document.addEventListener("submit", function (event) {
    const form = event.target.closest("form[data-action]");
    if (!form) return;
    event.preventDefault();
    invoke(form.getAttribute("data-action"), { form, el: form, event, data: new FormData(form), params: (NS.currentCtx || {}).params || {}, query: (NS.currentCtx || {}).query || {} });
  });
  document.addEventListener("change", function (event) {
    const el = event.target.closest("[data-change]");
    if (!el) return;
    const action = el.getAttribute("data-change");
    invoke(action, { el, event, value: el.value, params: (NS.currentCtx || {}).params || {}, query: (NS.currentCtx || {}).query || {} });
  });
  const inputTimers = {};
  document.addEventListener("input", function (event) {
    const el = event.target.closest("[data-input]");
    if (!el) return;
    const action = el.getAttribute("data-input");
    clearTimeout(inputTimers[action]);
    inputTimers[action] = setTimeout(() => {
      invoke(action, { el, event, value: el.value, params: (NS.currentCtx || {}).params || {}, query: (NS.currentCtx || {}).query || {} });
    }, el.getAttribute("data-debounce") ? Number(el.getAttribute("data-debounce")) : 260);
  });
  document.addEventListener("keydown", function (event) {
    if (NS.currentView && NS.currentView.keys) {
      const fn = NS.currentView.keys[event.key];
      if (fn) { fn(event); return; }
    }
    if (event.key === "Escape" && document.getElementById("dialog-root").innerHTML) {
      closeDialog();
    }
  });

  NS.refresh = function (focusKey) {
    const scrollY = window.scrollY;
    const activeKey = focusKey || (document.activeElement && document.activeElement.getAttribute("data-focus-key"));
    const caret = document.activeElement && document.activeElement.selectionStart;
    render();
    window.scrollTo(0, scrollY);
    if (activeKey) {
      const el = document.querySelector('[data-focus-key="' + activeKey + '"]');
      if (el && el.focus) {
        el.focus();
        if (caret != null && el.setSelectionRange) {
          try { el.setSelectionRange(caret, caret); } catch (e) { /* ignore */ }
        }
      }
    }
  };

  function tickClock() {
    document.querySelectorAll("[data-clock]").forEach((el) => { el.textContent = NS.fmt.clock(); });
    document.querySelectorAll("[data-clock-large]").forEach((el) => { el.textContent = NS.fmt.clock(); });
    document.querySelectorAll("[data-clock-date]").forEach((el) => {
      const d = new Date();
      el.textContent = NS.fmt.weekday(d) + ", " + pad(d.getDate()) + "/" + pad(d.getMonth() + 1) + "/" + d.getFullYear();
    });
  }
  setInterval(tickClock, 1000);

  /* ---------------- Toast / dialog ---------------- */
  NS.toast = function (message, type) {
    const root = document.getElementById("toast-root");
    const el = document.createElement("div");
    el.className = "toast toast--" + (type || "success");
    el.innerHTML = '<span class="toast__mark">' + (type === "error" ? "!" : type === "warn" ? "!" : "✓") + "</span><span>" + esc(message) + "</span>";
    root.appendChild(el);
    setTimeout(() => { el.style.opacity = "0"; el.style.transition = "opacity .2s"; setTimeout(() => el.remove(), 220); }, 3200);
  };
  let dialogCallback = null;
  function closeDialog() {
    document.getElementById("dialog-root").innerHTML = "";
    dialogCallback = null;
  }
  NS.dialog = function (opts) {
    const root = document.getElementById("dialog-root");
    const fields = [];
    if (opts.requireReason) fields.push('<div class="field"><label>Lý do <span class="req">*</span></label><textarea class="textarea" name="reason" placeholder="' + esc(opts.reasonPlaceholder || "Nhập lý do...") + '" required></textarea></div>');
    if (opts.requirePin) fields.push('<div class="field"><label>PIN quản lý <span class="req">*</span></label><input class="input" name="pin" inputmode="numeric" maxlength="4" placeholder="••••" required><div class="dialog__hint">PIN demo: 1234</div></div>');
    root.innerHTML = '<div class="dialog-backdrop"><form class="dialog" id="confirm-dialog"><h2>' + esc(opts.title || "Xác nhận") + "</h2><p>" + esc(opts.message || "") + "</p>" + fields.join("") +
      '<div class="dialog-actions"><button type="button" class="btn" data-dialog-cancel>Hủy</button><button type="submit" class="btn ' + (opts.danger ? "btn-danger" : "btn-primary") + '">' + esc(opts.confirmText || "Xác nhận") + "</button></div></form></div>";
    root.querySelector("[data-dialog-cancel]").addEventListener("click", closeDialog);
    const form = root.querySelector("#confirm-dialog");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const reason = String(fd.get("reason") || "").trim();
      const pin = String(fd.get("pin") || "").trim();
      if (opts.requireReason && !reason) { NS.toast("Vui lòng nhập lý do.", "error"); return; }
      if (opts.requirePin && !/^\d{4}$/.test(pin)) { NS.toast("PIN phải gồm đúng 4 chữ số.", "error"); return; }
      const cb = opts.onConfirm;
      closeDialog();
      if (cb) cb({ reason, pin });
    });
    const first = form.querySelector("textarea,input");
    if (first) setTimeout(() => first.focus(), 40);
  };

  /* ---------------- Export & print ---------------- */
  function download(filename, blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 500);
  }
  NS.exportCSV = function (filename, headers, rows) {
    const escCell = (v) => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';
    const csv = "\uFEFF" + [headers].concat(rows).map((r) => r.map(escCell).join(";")).join("\r\n");
    download(filename, new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    NS.toast("Đã xuất " + filename);
  };
  NS.exportExcel = function (filename, headers, rows) {
    const html = '<html><head><meta charset="utf-8"></head><body><table border="1"><thead><tr>' +
      headers.map((h) => "<th>" + esc(h) + "</th>").join("") + "</tr></thead><tbody>" +
      rows.map((r) => "<tr>" + r.map((c) => "<td>" + esc(c) + "</td>").join("") + "</tr>").join("") +
      "</tbody></table></body></html>";
    download(filename, new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" }));
    NS.toast("Đã xuất " + filename);
  };
  NS.printPage = function () {
    NS.toast("Đang mở hộp thoại in...");
    setTimeout(() => window.print(), 200);
  };
  NS.printReceipt = function (order) {
    if (!order) return;
    const b = NS.get.branch(order.branchId) || NS.branch();
    const items = order.items.map((i) => '<div class="receipt__line"><span>' + esc(i.qty + " × " + i.name + " (" + i.size + ")") + "</span><span>" + NS.fmt.currency(i.lineTotal) + "</span></div>").join("");
    const refunded = NS.calc.orderRefunded(order);
    const html = '<!doctype html><html><head><meta charset="utf-8"><title>' + esc(order.code) + '</title><style>body{font-family:"Segoe UI",Arial,sans-serif;width:300px;margin:0 auto;padding:10px;font-size:12px;color:#111}.head{text-align:center;border-bottom:1px dashed #999;padding-bottom:8px;margin-bottom:8px}.line{display:flex;justify-content:space-between;gap:10px;padding:2px 0}.total{border-top:1px dashed #999;margin-top:6px;padding-top:6px;font-weight:700}.muted{color:#666;font-size:10px}</style></head><body><div class="head"><strong>' + esc(b.name) + "</strong><div>" + esc(b.address) + "</div><div class=\"muted\">Hotline: " + esc(b.phone) + "</div></div>" +
      '<div class="line"><span>Mã đơn</span><strong>' + esc(order.code) + "</strong></div><div class=\"line\"><span>Thời gian</span><span>" + NS.fmt.datetime(order.createdAt) + "</span></div><div class=\"line\"><span>Thu ngân</span><span>" + esc(order.cashierName) + "</span></div><div class=\"line\"><span>Loại đơn</span><span>" + (order.orderType === "takeaway" ? "Mang đi" : "Tại quán") + "</span></div><hr>" +
      items + '<div class="line"><span>Tạm tính</span><span>' + NS.fmt.currency(order.subtotal) + '</span></div><div class="line"><span>Giảm giá</span><span>-' + NS.fmt.currency(order.discount) + '</span></div><div class="line total"><span>Tổng thanh toán</span><span>' + NS.fmt.currency(order.total) + "</span></div>" +
      (refunded ? '<div class="line"><span>Đã hoàn</span><span>-' + NS.fmt.currency(refunded) + "</span></div>" : "") +
      '<div class="line"><span>Phương thức</span><span>' + (order.payment.method === "cash" ? "Tiền mặt" : "VietQR / SePay") + "</span></div>" +
      (order.payment.method === "cash" ? '<div class="line"><span>Tiền nhận</span><span>' + NS.fmt.currency(order.payment.receivedAmount) + "</span></div>" : "") +
      '<hr><div class="muted" style="text-align:center">Cảm ơn quý khách!<br>SCMS · Smart Cafe Management System</div></body></html>';
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow.document;
    iframe.onload = function () {
      setTimeout(() => {
        try { iframe.contentWindow.focus(); iframe.contentWindow.print(); } catch (e) { NS.toast("Trình duyệt chặn in - đã mở bản xem trước.", "warn"); }
        setTimeout(() => iframe.remove(), 1200);
      }, 100);
    };
    doc.open(); doc.write(html); doc.close();
    NS.toast("Đã gửi lệnh in bill " + order.code);
  };

  /* ---------------- Audit & actions ---------------- */
  NS.addAudit = function (action, entity, before, after) {
    const user = NS.currentUser();
    NS.data.auditLogs.unshift({
      id: "AL-" + String(Date.now()).slice(-7),
      time: NS.nowIso(),
      actor: user ? user.name : "Demo",
      role: user ? user.role : NS.roleLabel(NS.state.role),
      branchId: NS.state.branchId,
      action, entity,
      ip: "10.10." + NS.state.branchId.slice(1) + ".42",
      before: before || null,
      after: after || null,
    });
    NS.saveData();
  };
  NS.logout = function () {
    NS.state.cart = [];
    NS.state.pendingOrder = null;
    NS.state.role = "cashier";
    NS.state.currentUser = "C01";
    NS.saveSession();
    NS.navigate("/login");
  };

  /* ---------------- Role routes guard ---------------- */
  NS.roles = {
    all: ["coo", "manager", "cashier", "staff"],
    pos: ["cashier", "manager"],
    orders: ["cashier", "manager", "coo"],
    branch: ["manager", "coo"],
    chain: ["coo"],
    reports: ["manager", "coo"],
    settings: ["coo"],
    audit: ["coo"],
    approvals: ["manager", "coo"],
  };

  /* ---------------- Start ---------------- */
  NS.start = function () {
    window.addEventListener("hashchange", render);
    if (!location.hash) {
      location.hash = "#/login";
    } else {
      render();
    }
    tickClock();
    document.addEventListener("keydown", (event) => {
      // SRS 5.2.1: F10 confirms a cash payment on the checkout screen.
      if (NS.currentPath === "/pos/checkout" && event.key === "F10") {
        event.preventDefault();
        const btn = document.querySelector('[data-action="checkout-confirm-cash"]');
        if (btn) btn.click();
        return;
      }
      if (NS.currentPath !== "/pos") return;
      if (event.key === "F1") { event.preventDefault(); const el = document.getElementById("pos-search"); if (el) el.focus(); }
      if (event.key === "F8") { event.preventDefault(); const el = document.getElementById("pos-voucher"); if (el) el.focus(); }
      if (event.key === "F9") { event.preventDefault(); const btn = document.querySelector('[data-action="pos-checkout"]'); if (btn) btn.click(); }
      if (event.key === "Escape") { const dialog = document.getElementById("dialog-root"); if (dialog.innerHTML) return; NS.navigate("/pos"); }
    });
  };
})();
