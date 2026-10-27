/* SCMS prototype — orders, order details, refund, approvals */
(function () {
  const NS = window.SCMS;
  const esc = NS.esc;

  const statusOptions = [
    ["all", "Tất cả trạng thái"], ["pending", "Chờ thanh toán"], ["paid", "Đã thanh toán"],
    ["partial_refunded", "Hoàn một phần"], ["refunded", "Đã hoàn tiền"], ["cancelled", "Đã hủy"],
  ];
  const methodOptions = [["all", "Tất cả phương thức"], ["cash", "Tiền mặt"], ["vietqr", "VietQR / SePay"]];

  function localNow() {
    return NS.today() + "T" + NS.fmt.clock();
  }

  function methodLabel(method) {
    return method === "cash" ? "Tiền mặt" : method === "vietqr" ? "VietQR / SePay" : "—";
  }

  function itemSummary(order) {
    const names = (order.items || []).map((i) => i.name);
    return names.slice(0, 2).join(", ") + (names.length > 2 ? " +" + (names.length - 2) : "");
  }

  function filteredOrders() {
    const f = NS.state.orderFilters;
    const branch = NS.state.orderBranch || NS.state.branchId;
    const search = (f.search || "").trim().toLowerCase();
    return NS.data.orders.filter((o) => {
      if ((o.createdAt || "").slice(0, 10) !== f.date) return false;
      if (branch !== "all" && o.branchId !== branch) return false;
      if (f.status !== "all" && o.status !== f.status) return false;
      if (f.method !== "all" && o.payment.method !== f.method) return false;
      if (f.cashier !== "all" && o.cashierId !== f.cashier) return false;
      if (search && (o.code + " " + o.cashierName).toLowerCase().indexOf(search) < 0) return false;
      return true;
    }).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  NS.view("orders", {
    roles: NS.roles.orders,
    render() {
      const f = NS.state.orderFilters;
      const branch = NS.state.orderBranch || NS.state.branchId;
      const all = filteredOrders();
      const perPage = NS.state.orderPerPage || 10;
      const pages = Math.max(1, Math.ceil(all.length / perPage));
      const page = Math.min(Math.max(1, NS.state.orderPage || 1), pages);
      const rows = all.slice((page - 1) * perPage, page * perPage);
      const revenue = all.reduce((s, o) => s + NS.calc.orderNet(o), 0);
      const cancelled = all.filter((o) => o.status === "cancelled").length;
      const cashiers = NS.data.employees.filter((e) => e.branchId === NS.state.branchId && ["Cashier", "Branch Manager"].indexOf(e.role) >= 0);
      const actions = '<button class="btn" data-action="orders-export">Xuất CSV</button><a class="btn btn-primary" href="#/pos">' + NS.ui.icon("pos") + ' Về POS</a>';

      return NS.ui.shell({
        nav: "branch",
        active: "orders",
        code: "SCR-05",
        title: "Đơn hàng",
        subtitle: "Tra cứu giao dịch theo ngày, trạng thái và phương thức thanh toán. Dữ liệu đơn đã thanh toán được khóa.",
        actions,
        content: '<div class="kpi-strip"><div class="kpi"><div class="kpi__label">Doanh thu thuần</div><strong>' + NS.fmt.currency(revenue) + '</strong><small>' + NS.fmt.date(f.date) + '</small></div>' +
          '<div class="kpi"><div class="kpi__label">Số đơn</div><strong>' + all.length + '</strong><small>Trong bộ lọc hiện tại</small></div>' +
          '<div class="kpi"><div class="kpi__label">Giá trị đơn TB</div><strong>' + NS.fmt.currency(all.length ? revenue / all.length : 0) + '</strong><small>Doanh thu / số đơn</small></div>' +
          '<div class="kpi"><div class="kpi__label">Tỷ lệ hủy</div><strong>' + NS.fmt.percent(all.length ? cancelled / all.length * 100 : 0) + '</strong><small>' + cancelled + ' đơn đã hủy</small></div></div>' +
          '<div class="table-wrap"><div class="table-toolbar">' +
          '<div class="field"><label>Ngày</label><input class="input" type="date" value="' + esc(f.date) + '" data-change="orders-date"></div>' +
          '<div class="field"><label>Trạng thái</label><select class="select" data-change="orders-status">' + statusOptions.map((x) => '<option value="' + x[0] + '"' + (f.status === x[0] ? " selected" : "") + '>' + x[1] + '</option>').join("") + '</select></div>' +
          '<div class="field"><label>Phương thức</label><select class="select" data-change="orders-method">' + methodOptions.map((x) => '<option value="' + x[0] + '"' + (f.method === x[0] ? " selected" : "") + '>' + x[1] + '</option>').join("") + '</select></div>' +
          '<div class="field"><label>Thu ngân</label><select class="select" data-change="orders-cashier"><option value="all">Tất cả thu ngân</option>' + cashiers.map((e) => '<option value="' + e.id + '"' + (f.cashier === e.id ? " selected" : "") + '>' + esc(e.name) + '</option>').join("") + '</select></div>' +
          (NS.state.role === "coo" ? '<div class="field"><label>Chi nhánh</label><select class="select" data-change="orders-branch"><option value="all"' + (branch === "all" ? " selected" : "") + '>Tất cả chi nhánh</option>' + NS.ui.branchOptions(branch) + '</select></div>' : "") +
          '<div class="field grow"><label>Tìm kiếm</label><input class="input" id="orders-search" data-input="orders-search" data-focus-key="orders-search" value="' + esc(f.search) + '" placeholder="Mã đơn hoặc tên thu ngân…"></div>' +
          '</div><table class="data"><thead><tr><th>Mã đơn</th><th>Thời gian</th><th>Thu ngân</th><th>Món</th><th>Phương thức</th><th class="num">Tổng tiền</th><th>Trạng thái</th><th class="text-right">Thao tác</th></tr></thead><tbody>' +
          (rows.length ? rows.map((o) => '<tr class="' + (o.status === "cancelled" ? "is-muted" : o.status === "pending" ? "is-alert" : "") + '"><td><a class="mono strong" href="#/orders/' + encodeURIComponent(o.id) + '">' + esc(o.code) + '</a><div class="cell-sub">' + esc(NS.get.branch(o.branchId).short) + '</div></td>' +
            '<td><span class="nowrap">' + NS.fmt.timeShort(o.createdAt) + '</span><div class="cell-sub">' + NS.fmt.date(o.createdAt) + '</div></td>' +
            '<td>' + esc(o.cashierName) + '</td><td><div class="cell-title">' + esc(itemSummary(o)) + '</div><div class="cell-sub">' + o.items.reduce((s, i) => s + i.qty, 0) + ' món · ' + esc(o.orderType === "takeaway" ? "Mang đi" : "Tại quán") + '</div></td>' +
            '<td>' + esc(methodLabel(o.payment.method)) + '</td><td class="num strong">' + NS.fmt.currency(NS.calc.orderNet(o)) + '</td>' +
            '<td>' + NS.ui.statusTag(o.status) + '</td><td><div class="actions"><a class="btn btn-sm" href="#/orders/' + encodeURIComponent(o.id) + '">Chi tiết</a>' +
            (["paid", "partial_refunded"].indexOf(o.status) >= 0 ? '<a class="btn btn-sm btn-ghost" href="#/orders/' + encodeURIComponent(o.id) + '/refund">Hoàn tiền</a>' : "") + '</div></td></tr>').join("") :
            '<tr><td colspan="8">' + NS.ui.empty("Không có đơn hàng", "Thử đổi ngày hoặc bộ lọc trạng thái.", '<button class="btn btn-sm mt-8" data-action="orders-reset-filter">Xóa bộ lọc</button>') + '</td></tr>') +
          '</tbody></table>' + NS.ui.pagination(all.length, page, perPage, "orders-page") + '</div>',
      });
    },
    actions: {
      "orders-date"(ctx) { NS.state.orderFilters.date = ctx.value; NS.state.orderPage = 1; NS.refresh(); },
      "orders-status"(ctx) { NS.state.orderFilters.status = ctx.value; NS.state.orderPage = 1; NS.refresh(); },
      "orders-method"(ctx) { NS.state.orderFilters.method = ctx.value; NS.state.orderPage = 1; NS.refresh(); },
      "orders-cashier"(ctx) { NS.state.orderFilters.cashier = ctx.value; NS.state.orderPage = 1; NS.refresh(); },
      "orders-branch"(ctx) { NS.state.orderBranch = ctx.value; NS.state.orderPage = 1; NS.refresh(); },
      "orders-search"(ctx) { NS.state.orderFilters.search = ctx.value; NS.state.orderPage = 1; NS.refresh("orders-search"); },
      "orders-page"(ctx) { NS.state.orderPage = Number(ctx.el.getAttribute("data-page")); NS.refresh(); },
      "orders-page-size"(ctx) { NS.state.orderPerPage = Number(ctx.value); NS.state.orderPage = 1; NS.refresh(); },
      "orders-reset-filter"() {
        NS.state.orderFilters = { date: NS.today(), status: "all", method: "all", cashier: "all", search: "" };
        NS.state.orderPage = 1;
        NS.refresh();
      },
      "orders-export"() {
        const rows = filteredOrders();
        NS.exportCSV("don-hang-" + NS.state.orderFilters.date + ".csv",
          ["Mã đơn", "Chi nhánh", "Thời gian", "Thu ngân", "Loại đơn", "Món", "Phương thức", "Tạm tính", "Giảm giá", "Tổng", "Đã hoàn", "Trạng thái"],
          rows.map((o) => [o.code, NS.get.branch(o.branchId).name, NS.fmt.datetime(o.createdAt), o.cashierName, o.orderType === "takeaway" ? "Mang đi" : "Tại quán", o.items.map((i) => i.name + " x" + i.qty).join("; "), methodLabel(o.payment.method), o.subtotal, o.discount, o.total, NS.calc.orderRefunded(o), o.status]));
      },
    },
  });
  NS.route("/orders", "orders");

  NS.view("orderDetail", {
    roles: NS.roles.orders,
    render(ctx) {
      const order = NS.get.order(ctx.params.id);
      if (!order) {
        return NS.ui.shell({ active: "orders", code: "SCR-06", title: "Không tìm thấy đơn", content: NS.ui.empty("Đơn không tồn tại", "Mã đơn không có trong dữ liệu mô phỏng.", '<a class="btn btn-primary mt-8" href="#/orders">Về danh sách đơn</a>') });
      }
      const tab = NS.state.orderDetailTab || "items";
      const refunded = NS.calc.orderRefunded(order);
      const canRefund = ["paid", "partial_refunded"].indexOf(order.status) >= 0;
      const actions = '<button class="btn" data-action="order-print">' + NS.ui.icon("print") + ' In bill</button>' +
        (canRefund ? '<a class="btn btn-primary" href="#/orders/' + encodeURIComponent(order.id) + '/refund">Hoàn tiền</a>' : "") +
        '<a class="btn btn-ghost" href="#/orders">Danh sách</a>';
      const tabs = '<div class="tabs"><button class="tab ' + (tab === "items" ? "active" : "") + '" data-action="order-tab" data-tab="items">TAB-01 · Món & Topping</button>' +
        '<button class="tab ' + (tab === "payment" ? "active" : "") + '" data-action="order-tab" data-tab="payment">TAB-02 · Thanh toán & Hoàn tiền</button></div>';
      return NS.ui.shell({
        nav: "branch", active: "orders", code: "SCR-06", title: order.code,
        subtitle: NS.fmt.datetime(order.createdAt) + " · " + NS.get.branch(order.branchId).name + " · Thu ngân " + order.cashierName,
        actions,
        content: '<div class="kpi-strip"><div class="kpi"><div class="kpi__label">Trạng thái</div><div class="mt-4">' + NS.ui.statusTag(order.status) + '</div><small>' + esc(order.orderType === "takeaway" ? "Mang đi" : "Tại quán") + '</small></div>' +
          '<div class="kpi"><div class="kpi__label">Tổng thanh toán</div><strong>' + NS.fmt.currency(order.total) + '</strong><small>' + esc(methodLabel(order.payment.method)) + '</small></div>' +
          '<div class="kpi"><div class="kpi__label">Đã hoàn tiền</div><strong>' + NS.fmt.currency(refunded) + '</strong><small>' + (order.refunds || []).length + ' yêu cầu</small></div>' +
          '<div class="kpi"><div class="kpi__label">Số món</div><strong>' + order.items.reduce((s, i) => s + i.qty, 0) + '</strong><small>' + order.items.length + ' dòng</small></div></div>' +
          tabs + (tab === "items" ? renderOrderItems(order) : renderOrderPayment(order)) +
          '<div class="flex gap-8 mt-24">' +
          (order.status === "pending" ? '<button class="btn btn-danger" data-action="order-cancel">Hủy đơn</button>' : "") +
          '<button class="btn" data-action="order-print-bar">In lại phiếu bar</button></div>',
      });
    },
    actions: {
      "order-tab"(ctx) { NS.state.orderDetailTab = ctx.el.getAttribute("data-tab"); NS.refresh(); },
      "order-print"() {
        const order = NS.get.order((NS.currentCtx || {}).params.id);
        if (order) NS.printReceipt(order);
      },
      "order-print-bar"() {
        const order = NS.get.order((NS.currentCtx || {}).params.id);
        if (order) NS.toast("Đã gửi lại phiếu bar " + order.code + " tới máy bếp.");
      },
      "order-cancel"() {
        const order = NS.get.order((NS.currentCtx || {}).params.id);
        if (!order) return;
        if (order.status !== "pending") { NS.toast("Chỉ có thể hủy đơn đang chờ thanh toán. Đơn đã thanh toán cần hoàn tiền.", "warn"); return; }
        NS.dialog({
          title: "Hủy đơn " + order.code,
          message: "Hành động này sẽ chuyển đơn sang trạng thái Đã hủy và ghi audit log. Vui lòng nhập lý do và PIN quản lý.",
          confirmText: "Hủy đơn", danger: true, requireReason: true, requirePin: true,
          onConfirm(info) {
            if (info.pin !== "1234") { NS.toast("PIN quản lý chưa đúng. PIN demo: 1234.", "error"); return; }
            order.status = "cancelled";
            order.payment.status = "cancelled";
            order.note = info.reason;
            NS.addAudit("Hủy đơn", "Đơn hàng", { status: "pending" }, { status: "cancelled", reason: info.reason });
            NS.saveData();
            NS.toast("Đã hủy đơn " + order.code);
            NS.refresh();
          },
        });
      },
    },
  });
  NS.route("/orders/:id", "orderDetail");

  function renderOrderItems(order) {
    const usage = NS.calc.bomUsage(order);
    return '<div class="split"><div class="panel panel--flush"><div class="panel-head" style="padding:14px 16px 0"><div><h2>Món & tùy chọn</h2><p>Dữ liệu món được khóa sau khi thanh toán.</p></div></div>' +
      '<div class="table-wrap" style="border:0;border-radius:0"><table class="data"><thead><tr><th>Món</th><th>Size</th><th>Đường / đá</th><th>Topping</th><th class="num">SL</th><th class="num">Đơn giá</th><th class="num">Thành tiền</th><th>Ghi chú</th></tr></thead><tbody>' +
      order.items.map((i) => '<tr><td><div class="cell-title">' + esc(i.name) + '</div><div class="cell-sub mono">' + esc(i.code) + '</div></td><td>' + esc(i.size) + '</td><td>' + esc(i.sugar + " · " + i.ice) + '</td><td>' + esc((i.toppingNames || []).join(", ") || "—") + '</td><td class="num">' + i.qty + '</td><td class="num">' + NS.fmt.currency(i.unitPrice) + '</td><td class="num strong">' + NS.fmt.currency(i.lineTotal) + '</td><td class="small muted">' + esc(i.note || "—") + '</td></tr>').join("") +
      '</tbody></table></div><div class="checkout-totals"><div class="summary-line"><span>Tạm tính</span><strong>' + NS.fmt.currency(order.subtotal) + '</strong></div><div class="summary-line"><span>Giảm giá' + (order.voucherCode ? " · " + esc(order.voucherCode) : "") + '</span><strong>−' + NS.fmt.currency(order.discount) + '</strong></div><div class="summary-line total"><span>Tổng thanh toán</span><strong>' + NS.fmt.currency(order.total) + '</strong></div></div></div>' +
      '<aside class="sticky-side"><div class="panel"><div class="panel-head"><div><h2>BOM lý thuyết</h2><p>Nguyên liệu tiêu hao theo công thức chuẩn.</p></div></div>' +
      (usage.length ? '<div class="table-wrap"><table class="data"><thead><tr><th>Nguyên liệu</th><th class="num">Định lượng</th><th>Đơn vị</th></tr></thead><tbody>' +
        usage.map((u) => '<tr><td>' + esc(u.ingredient.name) + '</td><td class="num">' + NS.fmt.qty(u.qty) + '</td><td>' + esc(u.ingredient.baseUnit) + '</td></tr>').join("") + '</tbody></table></div>' : NS.ui.empty("Chưa có BOM", "Món trong đơn chưa được cấu hình công thức.")) +
      '<div class="notice mt-12"><span class="notice__icon">i</span><div>Định lượng BOM chỉ để tham chiếu; tồn kho thực tế được đối soát qua phiếu kho.</div></div></div></aside></div>';
  }

  function renderOrderPayment(order) {
    const webhook = NS.data.webhookLogs.find((w) => w.orderId === order.id || (order.payment.reference && w.reference === order.payment.reference));
    const refunds = order.refunds || [];
    return '<div class="grid-2"><div class="panel"><div class="panel-head"><div><h2>Thông tin thanh toán</h2><p>Giao dịch gốc và đối soát cổng thanh toán.</p></div>' + NS.ui.statusTag(order.payment.status) + '</div>' +
      '<dl class="kv"><dt>Phương thức</dt><dd><strong>' + esc(methodLabel(order.payment.method)) + '</strong></dd>' +
      '<dt>Số tiền</dt><dd><strong>' + NS.fmt.currency(order.payment.amount) + '</strong></dd>' +
      '<dt>Trạng thái</dt><dd>' + esc(order.payment.status) + '</dd>' +
      '<dt>Mã giao dịch</dt><dd class="mono">' + esc(order.payment.reference || "—") + '</dd>' +
      '<dt>Ngân hàng</dt><dd>' + esc(order.payment.bank || "—") + '</dd>' +
      '<dt>Tài khoản nhận</dt><dd>' + esc(order.payment.account || "—") + '</dd>' +
      '<dt>Thời gian thanh toán</dt><dd>' + NS.fmt.datetime(order.payment.paidAt) + '</dd>' +
      '<dt>Tiền khách đưa</dt><dd>' + NS.fmt.currency(order.payment.receivedAmount) + '</dd>' +
      '<dt>Nội dung chuyển khoản</dt><dd class="mono">' + esc(order.payment.qrContent || "—") + '</dd></dl>' +
      (webhook ? '<div class="notice mt-16"><span class="notice__icon">' + (webhook.status === "success" ? "✓" : "!") + '</span><div><strong>Webhook ' + esc(webhook.reference) + '</strong> · ' + NS.ui.statusTag(webhook.status) + '<div class="small muted mt-4">Signature ' + esc(webhook.signature) + ' · ' + NS.fmt.datetime(webhook.time) + '</div></div></div>' : "") +
      '</div><div class="panel"><div class="panel-head"><div><h2>Lịch sử hoàn tiền</h2><p>Refund luôn chi tiền mặt từ két.</p></div><span class="badge-count">' + refunds.length + '</span></div>' +
      (refunds.length ? '<div class="table-wrap"><table class="data"><thead><tr><th>Mã</th><th class="num">Số tiền</th><th>Lý do</th><th>Trạng thái</th><th>Người duyệt</th><th>Thời gian</th></tr></thead><tbody>' +
        refunds.map((r) => '<tr><td class="mono">' + esc(r.id) + '</td><td class="num">' + NS.fmt.currency(r.amount) + '</td><td>' + esc(r.reason) + '</td><td>' + NS.ui.statusTag(r.status) + '</td><td>' + esc(r.approvedBy || "—") + '</td><td>' + NS.fmt.datetime(r.processedAt || r.requestedAt) + '</td></tr>').join("") + '</tbody></table></div>' : NS.ui.empty("Chưa có hoàn tiền", "Đơn này chưa phát sinh giao dịch hoàn tiền.")) +
      '<div class="notice notice--warn mt-16"><span class="notice__icon">!</span><div>Đơn PAID không thể sửa. Mọi điều chỉnh phải thực hiện qua luồng hoàn tiền và để lại audit log.</div></div></div></div>';
  }

  NS.view("refund", {
    roles: NS.roles.orders,
    render(ctx) {
      const order = NS.get.order(ctx.params.id);
      if (!order || ["paid", "partial_refunded"].indexOf(order.status) < 0) {
        return NS.ui.task({ code: "POP-05", title: "Không thể hoàn tiền", back: "#/orders", content: NS.ui.empty("Đơn không đủ điều kiện", "Chỉ đơn đã thanh toán hoặc hoàn một phần mới được hoàn tiền.", '<a class="btn btn-primary mt-8" href="#/orders">Về danh sách đơn</a>') });
      }
      const refunded = NS.calc.orderRefunded(order);
      const max = Math.max(0, order.total - refunded);
      const threshold = Number(NS.data.settings.refundThreshold || 0);
      return NS.ui.task({
        code: "POP-05",
        title: "Hoàn tiền · " + order.code,
        subtitle: "Tạo yêu cầu hoàn tiền mặt. Số tiền vượt ngưỡng sẽ chuyển COO phê duyệt.",
        back: "#/orders/" + encodeURIComponent(order.id),
        meta: NS.ui.statusTag(order.status) + '<span class="tag tag-neutral">Đã hoàn ' + NS.fmt.currency(refunded) + '</span>',
        content: '<div class="checkout-layout"><div class="panel"><div class="panel-head"><div><h2>Thông tin yêu cầu</h2><p>Tối đa ' + NS.fmt.currency(max) + ' cho đơn này.</p></div></div>' +
          '<form data-action="refund-submit"><div class="form-grid">' +
          '<div class="field"><label>Lý do <span class="req">*</span></label><select class="select" name="reason"><option>Khách đổi ý</option><option>Sai món</option><option>Chất lượng chưa đạt</option><option>Khác</option></select></div>' +
          '<div class="field"><label>Số tiền hoàn <span class="req">*</span></label><input class="input input-lg" name="amount" inputmode="numeric" value="' + max + '" max="' + max + '" required><div class="hint">Có thể hoàn một phần, tối đa ' + NS.fmt.currency(max) + '.</div></div>' +
          '<div class="field"><label>PIN quản lý <span class="req">*</span></label><input class="input" name="pin" maxlength="4" inputmode="numeric" placeholder="1234" required><div class="hint">PIN demo: 1234.</div></div>' +
          '<div class="field"><label>Ngưỡng phê duyệt</label><input class="input" value="' + NS.fmt.currency(threshold) + '" readonly><div class="hint">Trên ngưỡng sẽ gửi COO duyệt.</div></div>' +
          '<div class="field span-all"><label>Ghi chú</label><textarea class="textarea" name="note" placeholder="Mô tả tình huống, phương thức hoàn tiền..."></textarea></div></div>' +
          '<div class="form-actions"><a class="btn" href="#/orders/' + encodeURIComponent(order.id) + '">Hủy</a><button class="btn btn-primary" type="submit">Gửi yêu cầu hoàn tiền</button></div></form></div>' +
          '<aside class="sticky-side"><div class="panel"><div class="panel-head"><div><h2>Tác động dự kiến</h2><p>Cập nhật sau khi xử lý.</p></div></div>' +
          '<div class="stat-line"><span>Tổng đơn</span><strong>' + NS.fmt.currency(order.total) + '</strong></div><div class="stat-line"><span>Đã hoàn</span><strong>' + NS.fmt.currency(refunded) + '</strong></div><div class="stat-line"><span>Có thể hoàn</span><strong>' + NS.fmt.currency(max) + '</strong></div><div class="stat-line"><span>Quỹ tiền mặt</span><strong>−' + NS.fmt.currency(max) + '</strong></div>' +
          '<div class="notice notice--warn mt-12"><span class="notice__icon">!</span><div>' + (max > threshold ? 'Số tiền tối đa vượt ngưỡng, yêu cầu sẽ ở trạng thái <strong>Chờ duyệt</strong>.' : 'Nếu trong ngưỡng, hoàn tiền được duyệt tại chỗ bằng PIN Manager.') + '</div></div></div></aside></div>',
      });
    },
    actions: {
      "refund-submit"(ctx) {
        const order = NS.get.order((NS.currentCtx || {}).params.id);
        if (!order) return;
        const amount = Number(ctx.data.get("amount") || 0);
        const pin = String(ctx.data.get("pin") || "");
        const reason = String(ctx.data.get("reason") || "");
        const note = String(ctx.data.get("note") || "").trim();
        const refunded = NS.calc.orderRefunded(order);
        const max = Math.max(0, order.total - refunded);
        if (!amount || amount <= 0 || amount > max) { NS.toast("Số tiền hoàn phải trong khoảng 1 – " + NS.fmt.currency(max) + ".", "error"); return; }
        if (pin !== "1234") { NS.toast("PIN quản lý chưa đúng. PIN demo: 1234.", "error"); return; }
        const threshold = Number(NS.data.settings.refundThreshold || 0);
        const user = NS.currentUser();
        const refund = {
          id: "RF-" + String(Date.now()).slice(-7), amount, reason,
          status: amount > threshold ? "pending" : "completed",
          requestedAt: localNow(), processedAt: amount > threshold ? null : localNow(),
          requestedBy: user.name, approvedBy: amount > threshold ? "" : user.name,
          note: note || (amount > threshold ? "Chờ COO phê duyệt" : "Duyệt tại chỗ bằng PIN"),
        };
        order.refunds = order.refunds || [];
        order.refunds.push(refund);
        if (amount > threshold) {
          NS.data.approvals.unshift({
            id: "AP-" + String(Date.now()).slice(-6), type: "refund", branchId: order.branchId,
            createdAt: localNow(), requestedBy: user.name, amount, reason,
            status: "pending", relatedId: order.id,
            note: "Vượt ngưỡng hoàn tiền " + NS.fmt.currency(threshold),
            details: note || "Yêu cầu hoàn tiền cho đơn " + order.code + ".",
          });
          NS.addAudit("Yêu cầu hoàn tiền", "Đơn hàng", null, { order: order.code, amount, status: "pending" });
          NS.saveData();
          NS.toast("Đã gửi yêu cầu hoàn tiền tới COO.");
          NS.navigate("/approvals");
          return;
        }
        completeRefund(order, refund);
        NS.toast("Đã hoàn tiền " + NS.fmt.currency(amount) + " cho " + order.code);
        NS.navigate("/orders/" + encodeURIComponent(order.id));
      },
    },
  });
  NS.route("/orders/:id/refund", "refund");

  function completeRefund(order, refund) {
    refund.status = "completed";
    refund.processedAt = localNow();
    if (!refund.approvedBy) refund.approvedBy = NS.currentUser().name;
    const totalRefunded = NS.calc.orderRefunded(order);
    order.status = totalRefunded >= order.total ? "refunded" : "partial_refunded";
    const shift = NS.calc.currentShift(order.branchId);
    if (shift) {
      shift.transactions.push({
        id: "CT-RF-" + String(Date.now()).slice(-5), type: "cash_out", amount: refund.amount,
        reason: "Hoàn tiền " + order.code + " · " + refund.reason,
        at: localNow(), by: NS.currentUser().name, approvedBy: refund.approvedBy,
      });
    }
    NS.addAudit("Hoàn tiền", "Đơn hàng", { order: order.code, status: "paid" }, { order: order.code, status: order.status, amount: refund.amount });
    NS.saveData();
  }

  const approvalTypes = {
    refund: "Hoàn tiền", disposal: "Tiêu hủy kho", adjustment: "Điều chỉnh kho",
    stocktake: "Kiểm kê kho", cash_variance: "Chênh lệch quỹ", cash_transaction: "Thu/chi tiền mặt",
  };

  NS.view("approvals", {
    roles: NS.roles.approvals,
    render() {
      const f = NS.state.approvalFilters || (NS.state.approvalFilters = { type: "all", status: "pending", branch: NS.state.branchId });
      const all = NS.data.approvals.filter((a) => {
        if (f.type !== "all" && a.type !== f.type) return false;
        if (f.status !== "all" && a.status !== f.status) return false;
        if (f.branch !== "all" && a.branchId !== f.branch) return false;
        return true;
      }).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      const pending = NS.data.approvals.filter((a) => a.status === "pending").length;
      return NS.ui.shell({
        nav: "branch", active: "approvals", code: "SCR-18", title: "Phê duyệt",
        subtitle: "Xử lý yêu cầu vượt ngưỡng hoặc cần hai người duyệt. Mọi quyết định đều được ghi audit log.",
        actions: '<span class="tag tag-pending">' + pending + ' yêu cầu đang chờ</span>',
        content: '<div class="kpi-strip"><div class="kpi"><div class="kpi__label">Chờ duyệt</div><strong>' + pending + '</strong><small>Toàn hệ thống</small></div>' +
          '<div class="kpi"><div class="kpi__label">Hoàn tiền</div><strong>' + NS.data.approvals.filter((a) => a.type === "refund" && a.status === "pending").length + '</strong><small>Yêu cầu</small></div>' +
          '<div class="kpi"><div class="kpi__label">Kho</div><strong>' + NS.data.approvals.filter((a) => ["disposal", "adjustment", "stocktake"].indexOf(a.type) >= 0 && a.status === "pending").length + '</strong><small>Tiêu hủy / điều chỉnh</small></div>' +
          '<div class="kpi"><div class="kpi__label">Quỹ</div><strong>' + NS.data.approvals.filter((a) => ["cash_variance", "cash_transaction"].indexOf(a.type) >= 0 && a.status === "pending").length + '</strong><small>Chênh lệch / thu chi</small></div></div>' +
          '<div class="report-filters"><div class="field"><label>Loại</label><select class="select" data-change="approval-type"><option value="all">Tất cả loại</option>' + Object.keys(approvalTypes).map((k) => '<option value="' + k + '"' + (f.type === k ? " selected" : "") + '>' + approvalTypes[k] + '</option>').join("") + '</select></div>' +
          '<div class="field"><label>Trạng thái</label><select class="select" data-change="approval-status"><option value="pending"' + (f.status === "pending" ? " selected" : "") + '>Chờ duyệt</option><option value="all"' + (f.status === "all" ? " selected" : "") + '>Tất cả</option><option value="approved"' + (f.status === "approved" ? " selected" : "") + '>Đã duyệt</option><option value="rejected"' + (f.status === "rejected" ? " selected" : "") + '>Từ chối</option></select></div>' +
          '<div class="field"><label>Chi nhánh</label><select class="select" data-change="approval-branch"><option value="all"' + (f.branch === "all" ? " selected" : "") + '>Tất cả chi nhánh</option>' + NS.ui.branchOptions(f.branch) + '</select></div></div>' +
          '<div class="table-wrap"><table class="data"><thead><tr><th>Mã / thời gian</th><th>Loại</th><th>Chi nhánh</th><th>Người tạo</th><th>Lý do</th><th class="num">Số tiền</th><th>Trạng thái</th><th class="text-right">Thao tác</th></tr></thead><tbody>' +
          (all.length ? all.map((a) => {
            const open = NS.state.approvalOpen === a.id;
            return '<tr class="' + (a.status === "pending" ? "is-alert" : "") + '"><td><span class="mono strong">' + esc(a.id) + '</span><div class="cell-sub">' + NS.fmt.datetime(a.createdAt) + '</div></td>' +
              '<td><span class="cell-title">' + esc(approvalTypes[a.type] || a.type) + '</span><div class="cell-sub">' + esc(a.relatedId || "—") + '</div></td>' +
              '<td>' + esc(NS.get.branch(a.branchId).short) + '</td><td>' + esc(a.requestedBy) + '</td><td class="small">' + esc(a.reason) + '</td>' +
              '<td class="num strong">' + NS.fmt.currency(a.amount) + '</td><td>' + NS.ui.statusTag(a.status) + '</td>' +
              '<td><div class="actions"><button class="btn btn-sm" data-action="approval-toggle" data-id="' + esc(a.id) + '">' + (open ? "Thu gọn" : "Chi tiết") + '</button>' +
              (a.status === "pending" ? '<button class="btn btn-sm btn-primary" data-action="approval-approve" data-id="' + esc(a.id) + '">Duyệt</button><button class="btn btn-sm btn-danger" data-action="approval-reject" data-id="' + esc(a.id) + '">Từ chối</button>' : "") + '</div></td></tr>' +
              (open ? '<tr><td colspan="8" class="audit-detail"><div class="approval-detail"><div class="form-grid"><div><span class="small muted">Chi tiết</span><div class="strong">' + esc(a.details || "—") + '</div></div><div><span class="small muted">Ghi chú</span><div class="strong">' + esc(a.note || "—") + '</div></div><div><span class="small muted">Người duyệt</span><div>' + esc(a.approvedBy || "Chưa duyệt") + '</div></div><div><span class="small muted">Thời điểm duyệt</span><div>' + NS.fmt.datetime(a.approvedAt) + '</div></div></div></div></td></tr>' : "");
          }).join("") : '<tr><td colspan="8">' + NS.ui.empty("Không có yêu cầu", "Thử đổi bộ lọc loại hoặc trạng thái.") + '</td></tr>') +
          '</tbody></table></div>',
      });
    },
    actions: {
      "approval-type"(ctx) { NS.state.approvalFilters.type = ctx.value; NS.refresh(); },
      "approval-status"(ctx) { NS.state.approvalFilters.status = ctx.value; NS.refresh(); },
      "approval-branch"(ctx) { NS.state.approvalFilters.branch = ctx.value; NS.refresh(); },
      "approval-toggle"(ctx) {
        const id = ctx.el.getAttribute("data-id");
        NS.state.approvalOpen = NS.state.approvalOpen === id ? null : id;
        NS.refresh();
      },
      "approval-approve"(ctx) {
        const approval = NS.get.approval(ctx.el.getAttribute("data-id"));
        if (!approval || approval.status !== "pending") return;
        NS.dialog({
          title: "Duyệt yêu cầu " + approval.id,
          message: approvalTypes[approval.type] + " · " + NS.fmt.currency(approval.amount) + ". Xác nhận xử lý và ghi audit log?",
          confirmText: "Duyệt",
          onConfirm() { approveRequest(approval); },
        });
      },
      "approval-reject"(ctx) {
        const approval = NS.get.approval(ctx.el.getAttribute("data-id"));
        if (!approval || approval.status !== "pending") return;
        NS.dialog({
          title: "Từ chối yêu cầu " + approval.id,
          message: "Vui lòng nhập lý do từ chối. Yêu cầu sẽ không được áp dụng vào vận hành.",
          confirmText: "Từ chối", danger: true, requireReason: true,
          onConfirm(info) {
            approval.status = "rejected";
            approval.approvedBy = NS.currentUser().name;
            approval.approvedAt = localNow();
            approval.note = info.reason;
            rejectRelated(approval);
            NS.addAudit("Từ chối phê duyệt", "Phê duyệt", null, { id: approval.id, reason: info.reason });
            NS.saveData();
            NS.toast("Đã từ chối yêu cầu " + approval.id);
            NS.refresh();
          },
        });
      },
    },
  });
  NS.route("/approvals", "approvals");

  function approveRequest(approval) {
    approval.status = "approved";
    approval.approvedBy = NS.currentUser().name;
    approval.approvedAt = localNow();
    if (approval.type === "refund") {
      const order = NS.get.order(approval.relatedId);
      if (order) {
        const pendingRefunds = (order.refunds || []).filter((r) => r.status === "pending");
        const refund = pendingRefunds.find((r) => r.amount === approval.amount && r.reason === approval.reason) ||
          pendingRefunds.find((r) => r.amount === approval.amount) ||
          { id: "RF-" + String(Date.now()).slice(-7), amount: approval.amount, reason: approval.reason, requestedAt: approval.createdAt, requestedBy: approval.requestedBy };
        refund.status = "pending";
        refund.approvedBy = NS.currentUser().name;
        if (!(order.refunds || []).some((r) => r.id === refund.id)) {
          order.refunds = order.refunds || [];
          order.refunds.push(refund);
        }
        completeRefund(order, refund);
      }
    } else if (["disposal", "adjustment", "stocktake"].indexOf(approval.type) >= 0) {
      const stock = NS.get.stock(approval.relatedId);
      if (stock) {
        stock.status = "completed";
        stock.approvalStatus = "approved";
        (stock.items || []).forEach((line) => {
          const ing = NS.get.ingredient(line.ingredientId);
          if (!ing) return;
          if (stock.type === "disposal") ing.onHandBase = Math.max(0, ing.onHandBase - line.baseQty);
          if (stock.type === "stocktake" && line.variance != null) ing.onHandBase = Math.max(0, ing.onHandBase + line.variance);
        });
      }
    }
    NS.addAudit("Duyệt yêu cầu", "Phê duyệt", null, { id: approval.id, type: approval.type, amount: approval.amount });
    NS.saveData();
    NS.toast("Đã duyệt " + approval.id + ".");
    NS.refresh();
  }

  function rejectRelated(approval) {
    if (approval.type === "refund") {
      const order = NS.get.order(approval.relatedId);
      if (order) {
        const refund = (order.refunds || []).find((r) => r.status === "pending" && r.amount === approval.amount);
        if (refund) refund.status = "rejected";
      }
    }
    if (["disposal", "adjustment", "stocktake"].indexOf(approval.type) >= 0) {
      const stock = NS.get.stock(approval.relatedId);
      if (stock) { stock.status = "cancelled"; stock.approvalStatus = "rejected"; }
    }
  }
})();
