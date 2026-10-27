/* SCMS prototype — settings, permissions, security & audit logs */
(function () {
  const NS = window.SCMS;
  const esc = NS.esc;
  const roleNames = ["Staff", "Cashier", "Branch Manager", "COO"];
  const roleLabels = { Staff: "Nhân viên", Cashier: "Thu ngân", "Branch Manager": "Quản lý chi nhánh", COO: "COO" };
  const permLabels = { view: "Xem", add: "Thêm", edit: "Sửa", delete: "Xóa", approve: "Duyệt", cancel: "Hủy", refund: "Hoàn tiền" };

  function tabHref(tab, extra) {
    return "#/settings?tab=" + tab + (extra || "");
  }

  NS.view("settings", {
    roles: NS.roles.settings,
    render(ctx) {
      const tab = ctx.query.tab || "thresholds";
      const tabs = '<div class="tabs">' +
        '<a class="tab ' + (tab === "thresholds" ? "active" : "") + '" href="' + tabHref("thresholds") + '">TAB-11 · Ngưỡng phê duyệt</a>' +
        '<a class="tab ' + (tab === "sepay" ? "active" : "") + '" href="' + tabHref("sepay") + '">TAB-09 · SePay & thanh toán</a>' +
        '<a class="tab ' + (tab === "permissions" ? "active" : "") + '" href="' + tabHref("permissions", "&role=Branch%20Manager") + '">TAB-10 · Phân quyền</a>' +
        '<a class="tab ' + (tab === "security" ? "active" : "") + '" href="' + tabHref("security") + '">Bảo mật & phiên</a></div>';
      const pages = {
        thresholds: renderThresholds,
        sepay: renderSepay,
        permissions: renderPermissions,
        security: renderSecurity,
      };
      return NS.ui.shell({
        nav: "chain", active: "settings", code: "SCR-16", title: "Cấu hình & bảo mật",
        subtitle: "Ngưỡng phê duyệt, kết nối thanh toán, phân quyền và chính sách phiên.",
        content: tabs + (pages[tab] || pages.thresholds)(ctx),
      });
    },
    actions: {
      "settings-threshold"(ctx) {
        const d = ctx.data;
        const s = NS.data.settings;
        const before = { refund: s.refundThreshold, disposal: s.disposalThreshold, adjustment: s.adjustmentThreshold, tolerance: s.cashVarianceTolerance, self: s.requireCooForSelfInitiated };
        const refund = Number(d.get("refundThreshold") || 0);
        const disposal = Number(d.get("disposalThreshold") || 0);
        const adjustment = Number(d.get("adjustmentThreshold") || 0);
        const tolerance = Number(d.get("cashVarianceTolerance") || 0);
        if (refund < 0 || disposal < 0 || adjustment < 0 || tolerance < 0) { NS.toast("Ngưỡng không được âm.", "error"); return; }
        Object.assign(s, { refundThreshold: refund, disposalThreshold: disposal, adjustmentThreshold: adjustment, cashVarianceTolerance: tolerance, requireCooForSelfInitiated: d.get("requireCooForSelfInitiated") === "on" });
        NS.addAudit("Sửa ngưỡng phê duyệt", "Cấu hình", before, { refund, disposal, adjustment, tolerance, self: s.requireCooForSelfInitiated });
        NS.saveData();
        NS.toast("Đã lưu ngưỡng phê duyệt.");
        NS.refresh();
      },
      "sepay-save"(ctx) {
        const d = ctx.data;
        const bank = NS.data.settings.bank;
        const before = { name: bank.name, accountNumber: bank.accountNumber, environment: bank.environment, status: bank.status };
        bank.name = String(d.get("bankName") || "").trim();
        bank.accountNumber = String(d.get("accountNumber") || "").trim();
        bank.accountHolder = String(d.get("accountHolder") || "").trim();
        bank.webhookUrl = String(d.get("webhookUrl") || "").trim();
        bank.transferSyntax = String(d.get("transferSyntax") || "").trim();
        bank.qrExpiry = Number(d.get("qrExpiry") || 0);
        bank.environment = String(d.get("environment") || "Sandbox");
        const token = String(d.get("apiToken") || "").trim();
        const secret = String(d.get("secretKey") || "").trim();
        if (token) bank.apiToken = token;
        if (secret) bank.secretKey = secret;
        NS.addAudit("Cấu hình SePay", "Cấu hình", before, { name: bank.name, accountNumber: bank.accountNumber, environment: bank.environment, status: bank.status });
        NS.saveData();
        NS.toast("Đã lưu cấu hình SePay.");
        NS.refresh();
      },
      "sepay-test"() {
        const bank = NS.data.settings.bank;
        if (!bank.apiToken || !bank.webhookUrl) { NS.toast("Thiếu API token hoặc webhook URL.", "error"); return; }
        bank.status = "connected";
        NS.addAudit("Kiểm tra kết nối SePay", "Cấu hình", null, { status: "connected", environment: bank.environment });
        NS.saveData();
        NS.toast("Kết nối SePay hợp lệ · " + bank.environment + ".");
        NS.refresh();
      },
      "webhook-detail"(ctx) {
        const log = NS.data.webhookLogs.find((x) => x.id === ctx.el.getAttribute("data-id"));
        if (!log) return;
        NS.dialog({
          title: "Webhook " + log.id,
          message: "Mã tham chiếu: " + log.reference + "\nĐơn: " + log.orderId + "\nSố tiền: " + NS.fmt.currency(log.amount) + "\nChữ ký: " + log.signature + "\n\n" + log.raw,
          confirmText: "Đóng",
        });
      },
      "permission-save"(ctx) {
        const role = ctx.query.role || "Branch Manager";
        const values = ctx.data.getAll("perm");
        const before = JSON.parse(JSON.stringify(NS.data.settings.permissions));
        NS.data.features.forEach((f) => {
          if (!NS.data.settings.permissions[f.key] || !NS.data.settings.permissions[f.key][role]) return;
          NS.data.permKeys.forEach((k) => { NS.data.settings.permissions[f.key][role][k] = false; });
        });
        values.forEach((v) => {
          const parts = String(v).split("|");
          if (parts.length !== 2) return;
          if (NS.data.settings.permissions[parts[0]] && NS.data.settings.permissions[parts[0]][role]) NS.data.settings.permissions[parts[0]][role][parts[1]] = true;
        });
        NS.addAudit("Cập nhật phân quyền", "Phân quyền", { role, before }, { role, permissions: NS.data.settings.permissions });
        NS.saveData();
        NS.toast("Đã lưu quyền cho " + (roleLabels[role] || role) + ".");
        NS.refresh();
      },
      "security-save"(ctx) {
        const d = ctx.data;
        const security = {
          maxLoginAttempts: Number(d.get("maxLoginAttempts") || 5),
          lockMinutes: Number(d.get("lockMinutes") || 5),
          pinLength: Number(d.get("pinLength") || 4),
          sessionMinutes: Number(d.get("sessionMinutes") || 480),
          requirePinForRefund: d.get("requirePinForRefund") === "on",
          singleDevice: d.get("singleDevice") === "on",
        };
        if (security.maxLoginAttempts < 3 || security.lockMinutes < 1 || security.sessionMinutes < 15) { NS.toast("Chính sách bảo mật không hợp lệ.", "error"); return; }
        const before = NS.data.settings.security || null;
        NS.data.settings.security = security;
        NS.addAudit("Cập nhật chính sách bảo mật", "Cấu hình", before, security);
        NS.saveData();
        NS.toast("Đã lưu chính sách bảo mật.");
        NS.refresh();
      },
    },
  });
  NS.route("/settings", "settings");

  function renderThresholds(ctx) {
    const s = NS.data.settings;
    return '<div class="grid-2"><div class="panel"><div class="panel-head"><div><h2>Ngưỡng yêu cầu phê duyệt</h2><p>Giá trị vượt ngưỡng sẽ chuyển COO duyệt. Áp dụng toàn chuỗi.</p></div></div>' +
      '<form data-action="settings-threshold"><div class="form-grid">' +
      '<div class="field"><label>Hoàn tiền</label><input class="input" name="refundThreshold" inputmode="numeric" value="' + s.refundThreshold + '"><div class="hint">Giá trị hoàn tiền tối đa Branch Manager được tự duyệt.</div></div>' +
      '<div class="field"><label>Tiêu hủy nguyên liệu</label><input class="input" name="disposalThreshold" inputmode="numeric" value="' + s.disposalThreshold + '"><div class="hint">Tổng giá trị tiêu hủy trong một phiếu.</div></div>' +
      '<div class="field"><label>Điều chỉnh tồn kho</label><input class="input" name="adjustmentThreshold" inputmode="numeric" value="' + s.adjustmentThreshold + '"><div class="hint">Chênh lệch kiểm kê vượt ngưỡng cần COO duyệt.</div></div>' +
      '<div class="field"><label>Dung sai lệch quỹ</label><input class="input" name="cashVarianceTolerance" inputmode="numeric" value="' + s.cashVarianceTolerance + '"><div class="hint">Lệch quỹ trong khoảng này không tạo yêu cầu.</div></div>' +
      '<div class="field span-all"><label class="check"><input type="checkbox" name="requireCooForSelfInitiated"' + (s.requireCooForSelfInitiated ? " checked" : "") + '> Luôn yêu cầu COO duyệt giao dịch do Manager tự tạo</label></div></div>' +
      '<div class="form-actions"><button class="btn btn-primary" type="submit">Lưu ngưỡng</button></div></form></div>' +
      '<aside class="sticky-side"><div class="panel"><div class="panel-head"><div><h2>Quy tắc áp dụng</h2><p>Luồng phê duyệt hiện hành</p></div></div>' +
      '<div class="stat-line"><span>Hoàn tiền ≤ ngưỡng</span><strong>Manager duyệt</strong></div><div class="stat-line"><span>Hoàn tiền &gt; ngưỡng</span><strong>COO duyệt</strong></div><div class="stat-line"><span>Tiêu hủy / điều chỉnh</span><strong>Manager đề xuất</strong></div><div class="stat-line"><span>Giao dịch tự tạo</span><strong>' + (s.requireCooForSelfInitiated ? "Bắt buộc COO" : "Theo ngưỡng") + '</strong></div>' +
      '<div class="notice mt-16"><span class="notice__icon">i</span><div>Thay đổi ngưỡng không hồi tố các yêu cầu đã tạo. Mọi thay đổi được ghi Audit Log.</div></div></div></aside></div>';
  }

  function renderSepay() {
    const b = NS.data.settings.bank;
    const logs = NS.data.webhookLogs;
    return '<div class="grid-2"><div class="panel"><div class="panel-head"><div><h2>Kết nối SePay</h2><p>Thông tin tài khoản nhận chuyển khoản và Webhook xác nhận thanh toán.</p></div>' + NS.ui.statusTag(b.status) + '</div>' +
      '<form data-action="sepay-save"><div class="form-grid">' +
      '<div class="field"><label>Ngân hàng</label><input class="input" name="bankName" value="' + esc(b.name) + '"></div>' +
      '<div class="field"><label>Số tài khoản</label><input class="input" name="accountNumber" value="' + esc(b.accountNumber) + '"></div>' +
      '<div class="field span-all"><label>Chủ tài khoản</label><input class="input" name="accountHolder" value="' + esc(b.accountHolder) + '"></div>' +
      '<div class="field"><label>Môi trường</label><select class="select" name="environment"><option value="Sandbox"' + (b.environment === "Sandbox" ? " selected" : "") + '>Sandbox</option><option value="Production"' + (b.environment === "Production" ? " selected" : "") + '>Production</option></select></div>' +
      '<div class="field"><label>Hết hạn QR (giây)</label><input class="input" name="qrExpiry" inputmode="numeric" value="' + b.qrExpiry + '"></div>' +
      '<div class="field"><label>API Token</label><input class="input" name="apiToken" placeholder="Để trống nếu không thay đổi"><div class="hint">Token hiện tại đã được ẩn để bảo mật.</div></div>' +
      '<div class="field"><label>Webhook Secret</label><input class="input" name="secretKey" placeholder="Để trống nếu không thay đổi"><div class="hint">Dùng để xác thực chữ ký webhook.</div></div>' +
      '<div class="field span-all"><label>Webhook URL</label><input class="input mono" name="webhookUrl" value="' + esc(b.webhookUrl) + '"></div>' +
      '<div class="field"><label>Cú pháp chuyển khoản</label><input class="input mono" name="transferSyntax" value="' + esc(b.transferSyntax) + '"></div>' +
      '<div class="field"><label>&nbsp;</label><button class="btn" type="button" data-action="sepay-test">Kiểm tra kết nối</button></div></div>' +
      '<div class="form-actions"><button class="btn btn-primary" type="submit">Lưu cấu hình</button></div></form></div>' +
      '<aside class="sticky-side"><div class="panel"><div class="panel-head"><div><h2>Trạng thái tích hợp</h2><p>Thông tin nhận tiền hiện tại</p></div></div>' +
      '<div class="stat-line"><span>Ngân hàng</span><strong>' + esc(b.name) + '</strong></div><div class="stat-line"><span>Số tài khoản</span><strong class="mono">' + esc(b.accountNumber) + '</strong></div><div class="stat-line"><span>Môi trường</span><strong>' + esc(b.environment) + '</strong></div><div class="stat-line"><span>Webhook</span><strong>' + NS.ui.statusTag(b.status === "connected" ? "success" : "offline") + '</strong></div><div class="stat-line"><span>Webhook gần nhất</span><strong>' + (logs[0] ? NS.fmt.timeShort(logs[0].time) : "—") + '</strong></div></div>' +
      '<div class="notice notice--warn mt-16"><span class="notice__icon">!</span><div>API token và webhook secret không hiển thị lại sau khi lưu. Prototype dùng dữ liệu mô phỏng.</div></div></aside></div>' +
      '<div class="panel mt-24"><div class="panel-head"><div><h2>Webhook gần đây</h2><p>' + logs.length + ' bản ghi nhận từ SePay trong dữ liệu mẫu.</p></div></div>' +
      (logs.length ? '<div class="table-wrap"><table class="data"><thead><tr><th>Mã</th><th>Thời gian</th><th>Đơn hàng</th><th>Tham chiếu</th><th class="num">Số tiền</th><th>Chữ ký</th><th>Trạng thái</th><th class="text-right"></th></tr></thead><tbody>' +
        logs.map((l) => '<tr><td class="mono">' + esc(l.id) + '</td><td>' + NS.fmt.datetime(l.time) + '</td><td class="mono">' + esc(l.orderId) + '</td><td class="mono">' + esc(l.reference) + '</td><td class="num">' + NS.fmt.currency(l.amount) + '</td><td>' + NS.ui.statusTag(l.signature === "valid" ? "success" : "failed", l.signature === "valid" ? "Hợp lệ" : "Không hợp lệ") + '</td><td>' + NS.ui.statusTag(l.status) + '</td><td class="text-right"><button class="btn btn-sm" data-action="webhook-detail" data-id="' + esc(l.id) + '">Xem</button></td></tr>').join("") + '</tbody></table></div>' : NS.ui.empty("Chưa có webhook", "Dữ liệu webhook sẽ xuất hiện sau giao dịch VietQR.")) + '</div>';
  }

  function renderPermissions(ctx) {
    const role = roleNames.indexOf(ctx.query.role) >= 0 ? ctx.query.role : "Branch Manager";
    const permissions = NS.data.settings.permissions;
    const roleTabs = '<div class="tabs tabs--sub">' + roleNames.map((r) => '<a class="tab ' + (r === role ? "active" : "") + '" href="' + tabHref("permissions", "&role=" + encodeURIComponent(r)) + '">' + esc(roleLabels[r]) + '</a>').join("") + '</div>';
    return roleTabs + '<form data-action="permission-save"><div class="panel"><div class="panel-head"><div><h2>Ma trận phân quyền · ' + esc(roleLabels[role]) + '</h2><p>Tick quyền được phép. Thay đổi được lưu vào cấu hình demo và ghi audit log.</p></div><span class="tag tag-neutral">' + NS.data.features.length + ' chức năng</span></div>' +
      '<div class="table-wrap"><table class="data permission-table"><thead><tr><th>Màn hình</th><th>Mã</th><th>Module</th>' + NS.data.permKeys.map((k) => '<th class="text-center">' + esc(permLabels[k]) + '</th>').join("") + '</tr></thead><tbody>' +
      NS.data.features.map((f) => '<tr><td><div class="cell-title">' + esc(f.name) + '</div></td><td class="mono">' + esc(f.code) + '</td><td class="small">' + esc(f.module) + '</td>' +
        NS.data.permKeys.map((k) => {
          const checked = permissions[f.key] && permissions[f.key][role] && permissions[f.key][role][k];
          return '<td class="text-center"><input type="checkbox" name="perm" value="' + esc(f.key + "|" + k) + '"' + (checked ? " checked" : "") + ' aria-label="' + esc(f.name + " · " + permLabels[k]) + '"></td>';
        }).join("") + '</tr>').join("") + '</tbody></table></div>' +
      '<div class="form-actions"><span class="task-footer__note">Vai trò: <strong>' + esc(roleLabels[role]) + '</strong> · Quyền xem nên được giữ cho mọi chức năng cần truy cập.</span><button class="btn btn-primary" type="submit">Lưu phân quyền</button></div></div></form>';
  }

  function renderSecurity() {
    const s = NS.data.settings.security || { maxLoginAttempts: 5, lockMinutes: 5, pinLength: 4, sessionMinutes: 480, requirePinForRefund: true, singleDevice: false };
    return '<div class="grid-2"><div class="panel"><div class="panel-head"><div><h2>Chính sách phiên & PIN</h2><p>Áp dụng cho đăng nhập, Kiosk và thao tác nhạy cảm.</p></div></div>' +
      '<form data-action="security-save"><div class="form-grid">' +
      '<div class="field"><label>Số lần đăng nhập sai tối đa</label><input class="input" name="maxLoginAttempts" inputmode="numeric" value="' + s.maxLoginAttempts + '"></div>' +
      '<div class="field"><label>Khóa tài khoản (phút)</label><input class="input" name="lockMinutes" inputmode="numeric" value="' + s.lockMinutes + '"></div>' +
      '<div class="field"><label>Độ dài PIN</label><select class="select" name="pinLength"><option value="4"' + (s.pinLength === 4 ? " selected" : "") + '>4 chữ số</option><option value="6"' + (s.pinLength === 6 ? " selected" : "") + '>6 chữ số</option></select></div>' +
      '<div class="field"><label>Thời gian phiên (phút)</label><input class="input" name="sessionMinutes" inputmode="numeric" value="' + s.sessionMinutes + '"></div>' +
      '<div class="field span-all"><label class="check"><input type="checkbox" name="requirePinForRefund"' + (s.requirePinForRefund ? " checked" : "") + '> Yêu cầu PIN quản lý khi hoàn tiền</label><label class="check mt-8"><input type="checkbox" name="singleDevice"' + (s.singleDevice ? " checked" : "") + '> Mỗi tài khoản chỉ đăng nhập một thiết bị</label></div></div>' +
      '<div class="form-actions"><button class="btn btn-primary" type="submit">Lưu chính sách</button></div></form></div>' +
      '<aside class="sticky-side"><div class="panel"><div class="panel-head"><div><h2>Trạng thái bảo mật</h2><p>Thiết lập đang áp dụng</p></div></div>' +
      '<div class="stat-line"><span>Khóa sau</span><strong>' + s.maxLoginAttempts + ' lần sai</strong></div><div class="stat-line"><span>Thời gian khóa</span><strong>' + s.lockMinutes + ' phút</strong></div><div class="stat-line"><span>PIN nghiệp vụ</span><strong>' + (s.requirePinForRefund ? "Bắt buộc" : "Không bắt buộc") + '</strong></div><div class="stat-line"><span>Phiên tối đa</span><strong>' + s.sessionMinutes + ' phút</strong></div>' +
      '<div class="notice mt-16"><span class="notice__icon">i</span><div>Trong bản demo, cơ chế khóa đăng nhập và Kiosk hoạt động độc lập với cấu hình này để đảm bảo trải nghiệm.</div></div></div></aside></div>';
  }

  NS.view("audit", {
    roles: NS.roles.audit,
    render(ctx) {
      const q = String(ctx.query.q || "").toLowerCase();
      const action = ctx.query.action || "all";
      const role = ctx.query.role || "all";
      const from = ctx.query.from || "";
      const to = ctx.query.to || "";
      const perPage = 20;
      let logs = NS.data.auditLogs.filter((l) => {
        if (q && !(l.actor + " " + l.entity + " " + l.action + " " + l.id).toLowerCase().includes(q)) return false;
        if (action !== "all" && l.action !== action) return false;
        if (role !== "all" && l.role !== role) return false;
        const day = (l.time || "").slice(0, 10);
        if (from && day < from) return false;
        if (to && day > to) return false;
        return true;
      });
      const page = Math.max(1, Number(ctx.query.page || 1));
      const pages = Math.max(1, Math.ceil(logs.length / perPage));
      const safePage = Math.min(page, pages);
      const rows = logs.slice((safePage - 1) * perPage, safePage * perPage);
      const actions = Array.from(new Set(NS.data.auditLogs.map((l) => l.action))).sort();
      const roleList = Array.from(new Set(NS.data.auditLogs.map((l) => l.role))).sort();
      const baseQuery = "q=" + encodeURIComponent(ctx.query.q || "") + "&action=" + encodeURIComponent(action) + "&role=" + encodeURIComponent(role) + "&from=" + from + "&to=" + to;
      let pagination = "";
      if (logs.length > perPage) {
        const fromIndex = (safePage - 1) * perPage + 1;
        const toIndex = Math.min(logs.length, safePage * perPage);
        let nums = "";
        const start = Math.max(1, safePage - 2);
        const end = Math.min(pages, start + 4);
        for (let i = start; i <= end; i++) nums += '<a class="btn btn-sm ' + (i === safePage ? "btn-primary" : "") + '" href="#/audit?' + baseQuery + "&page=" + i + '">' + i + '</a>';
        pagination = '<div class="table-foot"><span>Hiển thị ' + fromIndex + "–" + toIndex + " / " + logs.length + ' bản ghi</span><div class="pagination">' +
          '<a class="btn btn-sm" href="#/audit?' + baseQuery + "&page=" + Math.max(1, safePage - 1) + '">‹</a>' + nums +
          '<a class="btn btn-sm" href="#/audit?' + baseQuery + "&page=" + Math.min(pages, safePage + 1) + '">›</a></div></div>';
      }
      return NS.ui.shell({
        nav: "chain", active: "audit", code: "SCR-17", title: "Audit Logs",
        subtitle: "Nhật ký thao tác hệ thống · " + NS.data.auditLogs.length + " bản ghi · Ai làm gì, khi nào, trên đối tượng nào.",
        actions: '<button class="btn" data-action="audit-export">Xuất Excel</button>',
        content: '<form class="report-filters" data-action="audit-filter">' +
          '<div class="field grow"><label>Tìm kiếm</label><input class="input" name="q" value="' + esc(ctx.query.q || "") + '" placeholder="Người dùng, hành động, đối tượng, mã log…"></div>' +
          '<div class="field"><label>Hành động</label><select class="select" name="action"><option value="all">Tất cả</option>' + actions.map((a) => '<option value="' + esc(a) + '"' + (a === action ? " selected" : "") + '>' + esc(a) + '</option>').join("") + '</select></div>' +
          '<div class="field"><label>Vai trò</label><select class="select" name="role"><option value="all">Tất cả</option>' + roleList.map((r) => '<option value="' + esc(r) + '"' + (r === role ? " selected" : "") + '>' + esc(r) + '</option>').join("") + '</select></div>' +
          '<div class="field"><label>Từ ngày</label><input class="input" type="date" name="from" value="' + esc(from) + '"></div>' +
          '<div class="field"><label>Đến ngày</label><input class="input" type="date" name="to" value="' + esc(to) + '"></div>' +
          '<div class="field"><label>&nbsp;</label><button class="btn btn-primary" type="submit">Lọc</button></div></form>' +
          '<div class="table-wrap"><table class="data"><thead><tr><th>Thời gian</th><th>Người thực hiện</th><th>Vai trò / chi nhánh</th><th>Hành động</th><th>Đối tượng</th><th>IP</th><th class="text-right"></th></tr></thead><tbody>' +
          (rows.length ? rows.map((l) => '<tr><td class="small">' + NS.fmt.datetime(l.time) + '<div class="cell-sub mono">' + esc(l.id) + '</div></td><td><div class="cell-title">' + esc(l.actor) + '</div></td><td class="small">' + esc(l.role) + '<div class="cell-sub">' + esc(NS.branchName(l.branchId)) + '</div></td><td><strong>' + esc(l.action) + '</strong></td><td class="small">' + esc(l.entity) + '</td><td class="mono small">' + esc(l.ip) + '</td><td class="text-right"><button class="btn btn-sm" data-action="audit-detail" data-id="' + esc(l.id) + '">Chi tiết</button></td></tr>').join("") : '<tr><td colspan="7">' + NS.ui.empty("Không có bản ghi", "Thử xóa bộ lọc hoặc chọn khoảng ngày khác.") + '</td></tr>') +
          '</tbody></table>' + pagination + '</div>',
      });
    },
    actions: {
      "audit-filter"(ctx) {
        const d = ctx.data;
        const params = ["q=" + encodeURIComponent(String(d.get("q") || "")), "action=" + encodeURIComponent(String(d.get("action") || "all")), "role=" + encodeURIComponent(String(d.get("role") || "all")), "from=" + String(d.get("from") || ""), "to=" + String(d.get("to") || "")];
        NS.navigate("/audit?" + params.join("&"));
      },
      "audit-detail"(ctx) {
        const log = NS.data.auditLogs.find((l) => l.id === ctx.el.getAttribute("data-id"));
        if (!log) return;
        const before = log.before ? JSON.stringify(log.before, null, 2) : "Không có";
        const after = log.after ? JSON.stringify(log.after, null, 2) : "Không có";
        NS.dialog({
          title: "Audit " + log.id,
          message: log.actor + " · " + log.role + " · " + NS.fmt.datetime(log.time) + "\nHành động: " + log.action + "\nĐối tượng: " + log.entity + "\nChi nhánh: " + NS.branchName(log.branchId) + "\nIP: " + log.ip + "\n\nTrước:\n" + before + "\n\nSau:\n" + after,
          confirmText: "Đóng",
        });
      },
      "audit-export"() {
        const headers = ["Mã", "Thời gian", "Người thực hiện", "Vai trò", "Chi nhánh", "Hành động", "Đối tượng", "IP", "Trước", "Sau"];
        const rows = NS.data.auditLogs.map((l) => [l.id, l.time, l.actor, l.role, NS.branchName(l.branchId), l.action, l.entity, l.ip, l.before ? JSON.stringify(l.before) : "", l.after ? JSON.stringify(l.after) : ""]);
        NS.exportExcel("audit-logs.xls", headers, rows);
      },
    },
  });
  NS.route("/audit", "audit");
})();
