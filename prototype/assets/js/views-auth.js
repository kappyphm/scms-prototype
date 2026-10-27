/* SCMS prototype — auth, kiosk, role dispatcher */
(function () {
  const NS = window.SCMS;
  const esc = NS.esc;
  const demoAccounts = {
    coo: { username: "coo", password: "123456" },
    manager: { username: "manager_d1", password: "123456" },
    cashier: { username: "cashier01", password: "123456" },
    staff: { username: "", password: "" },
  };

  function localNow() {
    return NS.today() + "T" + NS.fmt.clock();
  }

  function todayAttendance(employeeId) {
    return NS.data.attendance.find((a) => a.employeeId === employeeId && a.workDate === NS.today());
  }

  function loginSeed(role) {
    if (NS.state.loginRole !== role) {
      NS.state.loginRole = role;
      NS.state.loginUsername = (demoAccounts[role] || {}).username || "";
    }
    return NS.state.loginUsername || "";
  }

  NS.view("login", {
    roles: NS.roles.all,
    render() {
      const role = NS.state.loginRole || "cashier";
      loginSeed(role);
      const locked = NS.state.loginLockedUntil && NS.state.loginLockedUntil > Date.now();
      const mins = locked ? Math.max(1, Math.ceil((NS.state.loginLockedUntil - Date.now()) / 60000)) : 0;
      const todayOrders = NS.data.orders.filter((o) => (o.createdAt || "").slice(0, 10) === NS.today());
      const revenue = todayOrders.reduce((s, o) => s + NS.calc.orderNet(o), 0);
      const error = locked
        ? "Tài khoản đã bị khóa tạm thời sau 5 lần đăng nhập sai. Vui lòng thử lại sau " + mins + " phút."
        : NS.state.loginError || "";

      return '<div class="auth">' +
        '<section class="auth-left">' +
        '<div><div class="auth-brand"><span class="brand__mark">SC</span><span>SCMS · Smart Cafe</span></div>' +
        '<div class="auth-hero"><h1>Một sổ vận hành<br>cho cả chuỗi cà phê.</h1>' +
        '<p>Bán hàng, ca quỹ, kho, nhân sự và báo cáo chuỗi trong cùng một nhịp vận hành. Prototype này mô phỏng luồng nghiệp vụ end-to-end, không kết nối dữ liệu thật.</p></div></div>' +
        '<div><div class="auth-stats">' +
        '<div><strong>' + NS.data.branches.length + '</strong><span>Chi nhánh</span></div>' +
        '<div><strong>' + todayOrders.length + '</strong><span>Đơn hôm nay</span></div>' +
        '<div><strong>' + NS.fmt.currency(revenue) + '</strong><span>Doanh thu mô phỏng</span></div>' +
        '</div><p class="small mt-12" style="color:#9d958c">Dữ liệu minh họa · 20/10/2026 · Phiên bản prototype 1.0</p></div>' +
        '</section>' +
        '<section class="auth-right"><div class="auth-form">' +
        '<div class="page-code mb-8">SCR-01 <b>LOGIN</b></div>' +
        '<h2>Đăng nhập vận hành</h2><p>Chọn vai trò demo để đi vào đúng phạm vi nghiệp vụ.</p>' +
        (error ? '<div class="auth-error">' + esc(error) + '</div>' : "") +
        '<form data-action="login-submit" novalidate>' +
        '<div class="field"><label for="login-role">Vai trò <span class="req">*</span></label>' +
        '<select class="select" id="login-role" name="role" data-change="login-role">' + NS.ui.roleOptions(role) + '</select></div>' +
        '<div class="field"><label for="login-username">Tên đăng nhập / mã nhân viên <span class="req">*</span></label>' +
        '<input class="input input-lg" id="login-username" name="username" maxlength="30" autocomplete="username" value="' + esc(NS.state.loginUsername || "") + '" placeholder="Ví dụ: cashier01" required></div>' +
        '<div class="field"><label for="login-password">Mật khẩu <span class="req">*</span></label>' +
        '<input class="input input-lg" id="login-password" name="password" type="password" maxlength="32" autocomplete="current-password" placeholder="Tối thiểu 6 ký tự" required></div>' +
        '<div class="flex justify-between items-center mb-12"><label class="check"><input type="checkbox" name="remember" checked> Ghi nhớ đăng nhập</label>' +
        '<button type="button" class="link-btn" data-action="login-forgot">Quên mật khẩu?</button></div>' +
        '<button class="btn btn-primary btn-block btn-lg" type="submit"' + (locked ? " disabled" : "") + '>Đăng nhập' + NS.ui.icon("arrowRight") + '</button>' +
        '</form>' +
        '<div class="auth-links"><a href="#/kiosk">Chuyển sang Kiosk chấm công</a><span class="small muted">Mật khẩu demo cho mọi tài khoản: <strong>123456</strong></span></div>' +
        '<div class="auth-demo"><div class="auth-demo__title">Điền nhanh tài khoản demo</div><div class="chips">' +
        ["coo", "manager", "cashier"].map((r) => '<button class="chip" data-action="login-demo" data-role="' + r + '">' + esc(NS.roleLabel(r)) + '</button>').join("") +
        '<a class="chip" href="#/kiosk">Nhân viên · Kiosk</a></div></div>' +
        '</div></section></div>';
    },
    actions: {
      "login-role"(ctx) {
        NS.state.loginRole = ctx.value;
        NS.state.loginUsername = (demoAccounts[ctx.value] || {}).username || "";
        NS.state.loginError = "";
        NS.refresh("login-username");
      },
      "login-demo"(ctx) {
        const role = ctx.el.getAttribute("data-role");
        const acc = demoAccounts[role];
        NS.state.loginRole = role;
        NS.state.loginUsername = acc.username;
        NS.state.loginPassword = acc.password;
        NS.state.loginError = "";
        NS.refresh();
        setTimeout(() => {
          const pwd = document.getElementById("login-password");
          if (pwd) pwd.value = acc.password;
        }, 0);
      },
      "login-forgot"() {
        NS.dialog({
          title: "Khôi phục mật khẩu",
          message: "Vui lòng liên hệ Quản lý chi nhánh hoặc COO để đặt lại mật khẩu. Trong bản demo, mật khẩu của mọi tài khoản là 123456.",
          confirmText: "Đã hiểu",
        });
      },
      "login-submit"(ctx) {
        const data = ctx.data;
        const role = String(data.get("role") || "cashier");
        const username = String(data.get("username") || "").trim().toLowerCase();
        const password = String(data.get("password") || "");
        if (NS.state.loginLockedUntil && NS.state.loginLockedUntil > Date.now()) {
          NS.state.loginError = "Tài khoản đang bị khóa tạm thời. Vui lòng thử lại sau.";
          NS.refresh();
          return;
        }
        if (!username || !password) {
          NS.state.loginError = "Vui lòng nhập tên đăng nhập và mật khẩu.";
          NS.refresh();
          return;
        }
        if (password.length < 6) {
          NS.state.loginError = "Mật khẩu phải có tối thiểu 6 ký tự.";
          NS.refresh();
          return;
        }
        const emp = NS.data.employees.find((e) => {
          const keys = [e.username, e.code, e.id].map((x) => String(x || "").toLowerCase());
          return keys.indexOf(username) >= 0 && NS.roleKey(e.role) === role;
        });
        if (!emp) {
          NS.state.loginAttempts = (NS.state.loginAttempts || 0) + 1;
          if (NS.state.loginAttempts >= 5) {
            NS.state.loginLockedUntil = Date.now() + 5 * 60 * 1000;
            NS.state.loginError = "Sai thông tin 5 lần liên tiếp. Tài khoản bị khóa 5 phút.";
          } else {
            NS.state.loginError = "Không tìm thấy tài khoản phù hợp với vai trò đã chọn. Còn " + (5 - NS.state.loginAttempts) + " lần thử.";
          }
          NS.refresh();
          return;
        }
        if (emp.status !== "active") {
          NS.state.loginError = "Tài khoản đang ngừng hoạt động. Vui lòng liên hệ quản lý.";
          NS.refresh();
          return;
        }
        if (password !== "123456") {
          NS.state.loginAttempts = (NS.state.loginAttempts || 0) + 1;
          if (NS.state.loginAttempts >= 5) {
            NS.state.loginLockedUntil = Date.now() + 5 * 60 * 1000;
            NS.state.loginError = "Sai mật khẩu 5 lần liên tiếp. Tài khoản bị khóa 5 phút.";
          } else {
            NS.state.loginError = "Mật khẩu chưa đúng. Còn " + (5 - NS.state.loginAttempts) + " lần thử.";
          }
          NS.refresh();
          return;
        }
        NS.state.loginAttempts = 0;
        NS.state.loginLockedUntil = 0;
        NS.state.loginError = "";
        NS.state.loginRole = role;
        NS.state.loginUsername = username;
        NS.state.role = role;
        NS.state.currentUser = emp.id;
        NS.state.branchId = emp.branchId;
        NS.saveSession();
        NS.addAudit("Đăng nhập", "Phiên đăng nhập", null, { role: emp.role, result: "success" });
        NS.toast("Xin chào " + emp.name + " · " + NS.roleLabel(role));
        NS.navigate("/dispatch");
      },
    },
  });
  NS.route("/login", "login");

  NS.view("kiosk", {
    roles: NS.roles.all,
    render() {
      const list = NS.data.employees.filter((e) => e.role !== "COO" && e.status === "active");
      let employee = list.find((e) => e.id === NS.state.kioskEmployeeId);
      if (!employee) employee = list.find((e) => e.role === "Staff") || list[0];
      NS.state.kioskEmployeeId = employee ? employee.id : "";
      const pin = NS.state.kioskPin || "";
      const result = NS.state.kioskResult;
      const att = employee ? todayAttendance(employee.id) : null;
      const shiftCode = employee ? NS.calc.schedule(employee.id, NS.today()) : "";
      const shift = shiftCode ? NS.data.shiftTemplates[shiftCode] : null;
      const statusText = att && att.checkIn && !att.checkOut ? "Đang trong ca · đã check-in " + NS.fmt.timeShort(att.checkIn) :
        att && att.checkOut ? "Đã kết thúc ca · check-out " + NS.fmt.timeShort(att.checkOut) :
        shift ? "Ca " + shift.name + " · " + shift.start + "–" + shift.end : "Chưa có ca hôm nay";

      return '<div class="kiosk">' +
        '<section class="kiosk-left"><div class="flex justify-between items-center">' +
        '<div class="auth-brand"><span class="brand__mark">SC</span><span>SCMS · Kiosk</span></div>' +
        '<a class="btn btn-sm" style="color:#fffdf9;border-color:#4a4642" href="#/login">Đăng nhập</a></div>' +
        '<div class="kiosk-clock"><div class="time" data-clock-large>--:--:--</div><div class="date" data-clock-date></div>' +
        '<div class="server-note">Đồng hồ hệ thống · máy KIOSK-D1-01 · kết nối ổn định</div></div>' +
        '<div class="kiosk-reader"><div class="kiosk-reader__status"><span class="kiosk-reader__dot"></span>Đầu đọc RFID/QR sẵn sàng</div>' +
        '<p>Quẹt thẻ nhân viên để ghi nhận check-in/check-out ngay (BR-06), hoặc nhập PIN 4 số để chấm công. Mỗi thao tác hoàn tất dưới 0,5 giây.</p>' +
        '<button class="btn" data-action="kiosk-scan">Giả lập quẹt thẻ</button></div></section>' +
        '<section class="kiosk-right"><div class="kiosk-panel">' +
        '<div class="page-code mb-8">SCR-02 <b>ATTENDANCE KIOSK</b></div>' +
        '<h1>Chấm công ca làm</h1><p>Chọn nhân viên, nhập PIN và xác nhận check-in/check-out.</p>' +
        '<div class="field"><label for="kiosk-employee">Nhân viên</label>' +
        '<select class="select input-lg" id="kiosk-employee" data-change="kiosk-select">' +
        list.map((e) => '<option value="' + e.id + '"' + (e.id === NS.state.kioskEmployeeId ? " selected" : "") + '>' + esc(e.name + " · " + e.code) + '</option>').join("") +
        '</select><div class="hint">' + esc(employee ? employee.name + " · " + NS.branchName(employee.branchId) : "Chưa có nhân viên") + '</div></div>' +
        '<div class="flex justify-between items-center mt-12"><span class="small muted">' + esc(statusText) + '</span><span class="tag ' + (att && att.checkIn && !att.checkOut ? "tag-success" : "tag-neutral") + '">' + (att && att.checkIn && !att.checkOut ? "Trong ca" : att && att.checkOut ? "Đã xong" : "Chưa vào ca") + '</span></div>' +
        '<div class="pin-display">' + [0, 1, 2, 3].map((i) => '<span class="pin-dot ' + (i < pin.length ? "filled" : "") + '"></span>').join("") + '</div>' +
        '<div class="numpad">' + ["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "OK"].map((k) =>
          '<button data-action="kiosk-key" data-key="' + k + '">' + k + '</button>').join("") + '</div>' +
        (result ? renderKioskResult(result) : '<div class="result-banner"><div class="result-banner__title"><span class="result-banner__mark">i</span>Chờ thao tác</div><div class="result-banner__meta"><span>Kết quả</span><strong>Sẵn sàng nhận PIN</strong></div></div>') +
        '<a class="kiosk-back" href="#/login">' + NS.ui.icon("back") + ' Về đăng nhập</a>' +
        '</div></section></div>';
    },
    actions: {
      "kiosk-select"(ctx) {
        NS.state.kioskEmployeeId = ctx.value;
        NS.state.kioskPin = "";
        NS.state.kioskResult = null;
        NS.refresh();
      },
      "kiosk-key"(ctx) {
        if (ctx.el.getAttribute("data-key") === "C") {
          NS.state.kioskPin = "";
          NS.refresh();
          return;
        }
        const key = ctx.el.getAttribute("data-key");
        if (key === "OK") {
          submitKioskPin();
          return;
        }
        if ((NS.state.kioskPin || "").length < 4) {
          NS.state.kioskPin = (NS.state.kioskPin || "") + key;
          NS.refresh();
        }
      },
      "kiosk-scan"() {
        const list = NS.data.employees.filter((e) => e.role !== "COO" && e.status === "active");
        const target = list.find((e) => {
          const a = todayAttendance(e.id);
          return !a || !a.checkIn || !a.checkOut;
        }) || list[0];
        if (!target) return;
        NS.state.kioskEmployeeId = target.id;
        NS.state.kioskPin = "";
        NS.state.kioskResult = null;
        // BR-06: a valid card swipe records check-in (first of day) or
        // check-out (when a check-in already exists) immediately.
        recordAttendance(target, "RFID");
      },
    },
  });
  NS.route("/kiosk", "kiosk");

  function renderKioskResult(result) {
    return '<div class="result-banner"><div class="result-banner__title"><span class="result-banner__mark">' +
      (result.kind === "error" ? "!" : "✓") + '</span>' + esc(result.title) + '</div>' +
      '<div class="result-banner__meta">' + (result.lines || []).map((l) =>
        '<span>' + esc(l[0]) + '</span><strong>' + esc(l[1]) + '</strong>').join("") + '</div></div>';
  }

  function submitKioskPin() {
    const emp = NS.get.employee(NS.state.kioskEmployeeId);
    const pin = NS.state.kioskPin || "";
    if (!emp) return;
    if (pin.length !== 4) {
      NS.state.kioskResult = { kind: "error", title: "PIN chưa đủ 4 chữ số", lines: [["Nhân viên", emp.name], ["Vui lòng", "Nhập đủ 4 số"]] };
      NS.refresh();
      return;
    }
    const attempts = NS.state.kioskAttempts[emp.id] || { count: 0, lockedUntil: 0 };
    if (attempts.lockedUntil && attempts.lockedUntil > Date.now()) {
      const mins = Math.max(1, Math.ceil((attempts.lockedUntil - Date.now()) / 60000));
      NS.state.kioskResult = { kind: "error", title: "Tạm khóa nhập PIN", lines: [["Nhân viên", emp.name], ["Thử lại sau", mins + " phút"]] };
      NS.state.kioskPin = "";
      NS.refresh();
      return;
    }
    if (pin !== emp.pin) {
      attempts.count += 1;
      if (attempts.count >= 5) attempts.lockedUntil = Date.now() + 5 * 60 * 1000;
      NS.state.kioskAttempts[emp.id] = attempts;
      NS.state.kioskPin = "";
      NS.state.kioskResult = {
        kind: "error",
        title: attempts.count >= 5 ? "Sai PIN 5 lần · đã khóa 5 phút" : "PIN không đúng",
        lines: [["Nhân viên", emp.name], ["Còn lại", Math.max(0, 5 - attempts.count) + " lần thử"]],
      };
      NS.refresh();
      return;
    }
    NS.state.kioskAttempts[emp.id] = { count: 0, lockedUntil: 0 };
    NS.state.kioskPin = "";
    recordAttendance(emp, "PIN");
  }

  function recordAttendance(emp, method) {
    const att = todayAttendance(emp.id);
    const scheduleCode = NS.calc.schedule(emp.id, NS.today());
    if (!scheduleCode && !att) {
      NS.state.kioskResult = { kind: "error", title: "Không có ca hôm nay", lines: [["Nhân viên", emp.name], ["Ngày", NS.fmt.date(NS.today())]] };
      NS.refresh();
      return;
    }
    const now = localNow();
    if (att && att.checkOut) {
      NS.state.kioskResult = {
        kind: "warn",
        title: "Ca làm đã hoàn tất",
        lines: [["Nhân viên", emp.name + " · " + emp.code], ["Check-in", NS.fmt.time(att.checkIn)], ["Check-out", NS.fmt.time(att.checkOut)]],
      };
      NS.refresh();
      return;
    }
    if (att && att.checkIn && !att.checkOut) {
      // BR-07: at least 15 minutes between check-in and check-out, to
      // prevent accidental duplicate swipes.
      const elapsed = NS.minutesBetween(att.checkIn, now);
      if (elapsed < 15) {
        NS.state.kioskResult = {
          kind: "error",
          title: "Chưa đủ 15 phút để check-out",
          lines: [["Nhân viên", emp.name + " · " + emp.code], ["Check-in", NS.fmt.time(att.checkIn)], ["Đã trôi qua", elapsed + " phút · cần thêm " + (15 - elapsed) + " phút"]],
        };
        NS.refresh();
        return;
      }
      att.checkOut = now;
      att.hours = Math.round((NS.minutesBetween(att.checkIn, now) / 60) * 100) / 100;
      att.status = "on_time";
      att.note = "Check-out qua Kiosk · " + method;
      NS.addAudit("Check-out", "Chấm công", null, { employee: emp.name, at: now });
      NS.saveData();
      NS.state.kioskResult = {
        kind: "success",
        title: "Check-out thành công",
        lines: [["Nhân viên", emp.name + " · " + emp.code], ["Giờ ra", NS.fmt.time(att.checkOut)], ["Tổng giờ", NS.fmt.qty(att.hours) + " giờ"]],
      };
      NS.toast("Đã check-out cho " + emp.name);
      NS.refresh();
      return;
    }
    if (!att) {
      const tpl = NS.data.shiftTemplates[scheduleCode] || { start: "06:00" };
      const late = Math.max(0, NS.minutesBetween(NS.today() + "T" + tpl.start + ":00", now));
      NS.data.attendance.push({
        id: "ATT-K-" + String(Date.now()).slice(-6),
        employeeId: emp.id,
        branchId: emp.branchId,
        workDate: NS.today(),
        checkIn: now,
        checkOut: null,
        method: method,
        status: "on_time",
        minutesLate: late,
        minutesEarly: 0,
        hours: null,
        note: "Check-in qua Kiosk · " + method,
      });
      NS.addAudit("Check-in", "Chấm công", null, { employee: emp.name, at: now });
      NS.saveData();
      NS.state.kioskResult = {
        kind: "success",
        title: "Check-in thành công",
        lines: [["Nhân viên", emp.name + " · " + emp.code], ["Giờ vào", NS.fmt.time(now)], ["Đi muộn", late > 0 ? late + " phút" : "Đúng giờ"]],
      };
      NS.toast("Đã check-in cho " + emp.name);
      NS.refresh();
      return;
    }
    att.checkIn = now;
    att.checkOut = null;
    att.status = "on_time";
    att.note = "Check-in qua Kiosk · " + method;
    NS.addAudit("Check-in", "Chấm công", null, { employee: emp.name, at: now });
    NS.saveData();
    NS.state.kioskResult = {
      kind: "success",
      title: "Check-in thành công",
      lines: [["Nhân viên", emp.name + " · " + emp.code], ["Giờ vào", NS.fmt.time(now)], ["Trạng thái", "Đang trong ca"]],
    };
    NS.toast("Đã check-in cho " + emp.name);
    NS.refresh();
  }

  NS.view("dispatch", {
    roles: NS.roles.all,
    render() {
      const role = NS.state.role;
      const user = NS.currentUser();
      const branch = NS.branch();
      const portals = [
        {
          no: "01", code: "SCR-04", title: "POS bán hàng & thanh toán",
          desc: "Mở ca, chọn món, tùy chỉnh size/topping, áp voucher, thu tiền mặt hoặc VietQR và in bill.",
          allowed: ["cashier", "manager"].indexOf(role) >= 0, href: "#/pos",
          meta: ["Ca quỹ", "Đơn hàng", "In bill"],
        },
        {
          no: "02", code: "SCR-07", title: "Cổng vận hành chi nhánh",
          desc: "Theo dõi doanh thu, tồn kho, nhân sự, chấm công, phê duyệt và báo cáo của chi nhánh được gán.",
          allowed: ["manager", "coo"].indexOf(role) >= 0, href: "#/branch",
          meta: ["Kho nguyên liệu", "Nhân sự & ca", "Báo cáo"],
        },
        {
          no: "03", code: "SCR-10", title: "Cổng điều hành chuỗi",
          desc: "Quản trị menu, BOM, khuyến mãi, chi nhánh, đồng bộ cấu hình, báo cáo hợp nhất và phân quyền.",
          allowed: role === "coo", href: "#/chain",
          meta: ["Master data", "Đồng bộ", "Audit"],
        },
        {
          no: "04", code: "SCR-02", title: "Kiosk chấm công",
          desc: "Check-in/check-out bằng PIN hoặc thẻ RFID. Dùng chung cho nhân viên và quản lý trong cửa hàng.",
          allowed: true, href: "#/kiosk",
          meta: ["PIN", "RFID", "Chấm công"],
        },
      ];
      const pending = NS.calc.pendingApprovals();
      return NS.ui.topbar({ noMenu: true }) +
        '<div class="dispatch">' +
        '<div class="dispatch-head"><div><div class="page-code mb-8">SCR-03 <b>ROLE DISPATCHER</b></div>' +
        '<h1>Xin chào, ' + esc(user.name) + '.</h1>' +
        '<p>Bạn đang ở vai trò <strong>' + esc(NS.roleLabel(role)) + '</strong> · ' + esc(branch.code + " — " + branch.name) + '. Chọn cổng nghiệp vụ phù hợp với công việc hôm nay.</p></div>' +
        '<div class="flex gap-8 items-center">' +
        (pending && ["manager", "coo"].indexOf(role) >= 0 ? '<a class="btn" href="#/approvals">Phê duyệt <span class="badge-count">' + pending + '</span></a>' : "") +
        '<button class="btn btn-ghost" data-action="logout">Đăng xuất</button></div></div>' +
        '<div class="portal-list">' + portals.map((p) =>
          '<div class="portal ' + (p.allowed ? "" : "is-disabled") + '"><div class="portal__no">' + p.no + '</div>' +
          '<div><div class="page-code">' + p.code + (p.allowed ? " · CÓ QUYỀN TRUY CẬP" : " · KHÔNG CÓ QUYỀN") + '</div>' +
          '<h2>' + esc(p.title) + '</h2><p>' + esc(p.desc) + '</p><div class="portal__meta">' +
          p.meta.map((m) => '<span class="tag tag-neutral">' + esc(m) + '</span>').join("") + '</div></div>' +
          '<div class="portal__action">' + (p.allowed
            ? '<a class="btn btn-primary" href="' + p.href + '">Vào cổng' + NS.ui.icon("arrowRight") + '</a>'
            : '<span class="small muted">Vai trò hiện tại không có quyền</span>') + '</div></div>').join("") +
        '</div>' +
        '<div class="grid-3 mt-24">' +
        '<div class="panel"><div class="panel-head"><div><h2>Phiên demo</h2><p>Thông tin đang đăng nhập</p></div></div>' +
        '<dl class="kv"><dt>Nhân viên</dt><dd><strong>' + esc(user.name) + '</strong></dd><dt>Mã nhân viên</dt><dd>' + esc(user.code) + '</dd><dt>Vai trò</dt><dd>' + esc(NS.roleLabel(role)) + '</dd><dt>Chi nhánh</dt><dd>' + esc(branch.name) + '</dd></dl></div>' +
        '<div class="panel"><div class="panel-head"><div><h2>Việc cần chú ý</h2><p>Trạng thái vận hành hiện tại</p></div></div>' +
        '<div class="stat-line"><span>Nguyên liệu cần nhập thêm</span><strong>' + NS.calc.lowStock(NS.state.branchId).filter((x) => x.status !== "watch").length + ' mục</strong></div>' +
        '<div class="stat-line"><span>Ca quỹ đang mở</span><strong>' + (NS.calc.currentShift(NS.state.branchId) ? "Có" : "Chưa mở") + '</strong></div>' +
        '<div class="stat-line"><span>Yêu cầu chờ duyệt</span><strong>' + pending + '</strong></div></div>' +
        '<div class="panel"><div class="panel-head"><div><h2>Điều hướng nhanh</h2><p>Dùng cho demo</p></div></div>' +
        '<div class="flex flex-col gap-8"><a class="btn btn-block" href="#/orders">Danh sách đơn hàng</a>' +
        '<a class="btn btn-block" href="#/shift">Ca quỹ</a><a class="btn btn-block" href="#/reports">Báo cáo</a></div></div>' +
        '</div></div>';
    },
    actions: {
      logout() {
        NS.logout();
      },
    },
  });
  NS.route("/dispatch", "dispatch");
})();
