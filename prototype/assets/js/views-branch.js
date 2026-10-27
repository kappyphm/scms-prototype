/* SCMS prototype — branch dashboard, inventory, employees, shifts */
(function () {
  const NS = window.SCMS;
  const esc = NS.esc;

  function localNow() {
    return NS.today() + "T" + NS.fmt.clock();
  }

  function branchOrders(branchId) {
    return NS.data.orders.filter((o) => o.branchId === branchId);
  }

  function todayOrders(branchId) {
    return branchOrders(branchId).filter((o) => (o.createdAt || "").slice(0, 10) === NS.today());
  }

  function packDisplay(ing, baseQty) {
    const packs = baseQty / ing.conversionRatio;
    return NS.fmt.qty(Math.round(packs * 1000) / 1000) + " " + ing.packUnit +
      " · " + NS.fmt.qty(baseQty) + " " + ing.baseUnit;
  }

  function stockValue(ing, branchId) {
    return Math.round(NS.calc.ingredientOnHand(ing, branchId) * ing.unitCost);
  }

  NS.view("branchDashboard", {
    roles: NS.roles.branch,
    render() {
      const b = NS.branch();
      const orders = todayOrders(b.id);
      const revenue = orders.reduce((s, o) => s + NS.calc.orderNet(o), 0);
      const openShift = NS.calc.currentShift(b.id);
      const low = NS.calc.lowStock(b.id).filter((x) => x.status !== "watch");
      const closedShifts = NS.data.shifts.filter((s) => s.branchId === b.id && s.status === "closed" && s.countedCash != null && s.theoreticalCash != null).sort((a, b2) => (a.closedAt < b2.closedAt ? 1 : -1));
      const lastClosed = closedShifts[0];
      const lastVariance = lastClosed ? lastClosed.countedCash - lastClosed.theoreticalCash : 0;
      const employees = NS.data.employees.filter((e) => e.branchId === b.id && e.role !== "COO");
      const scheduled = employees.filter((e) => NS.calc.schedule(e.id, NS.today()));
      const activeRows = scheduled.map((e) => {
        const att = NS.data.attendance.find((a) => a.employeeId === e.id && a.workDate === NS.today());
        return { emp: e, att };
      });
      const buckets = [
        { label: "06–08", from: 6, to: 8 }, { label: "08–10", from: 8, to: 10 }, { label: "10–12", from: 10, to: 12 },
        { label: "12–14", from: 12, to: 14 }, { label: "14–16", from: 14, to: 16 }, { label: "16–18", from: 16, to: 18 },
        { label: "18–20", from: 18, to: 20 }, { label: "20–23", from: 20, to: 23 },
      ];
      const bars = buckets.map((bucket) => {
        const list = orders.filter((o) => {
          const h = Number((o.createdAt || "").slice(11, 13));
          return h >= bucket.from && h < bucket.to;
        });
        return { label: bucket.label, value: list.length, title: list.length + " đơn · " + NS.fmt.currency(list.reduce((s, o) => s + NS.calc.orderNet(o), 0)) };
      });
      return NS.ui.shell({
        nav: "branch", active: "branch", code: "SCR-07", title: "Tổng quan chi nhánh",
        subtitle: b.code + " · " + b.name + " · " + b.address,
        actions: '<a class="btn" href="#/branch/inventory">Kho nguyên liệu</a><a class="btn btn-primary" href="#/pos">Mở POS</a>',
        content: '<div class="kpi-strip"><div class="kpi"><div class="kpi__label">Doanh thu hôm nay</div><strong>' + NS.fmt.currency(revenue) + '</strong><small class="up">' + orders.length + ' đơn · TB ' + NS.fmt.currency(orders.length ? revenue / orders.length : 0) + '</small></div>' +
          '<div class="kpi"><div class="kpi__label">Ca quỹ</div><strong>' + (openShift ? "Đang mở" : "Chưa mở") + '</strong><small>' + (openShift ? NS.fmt.timeShort(openShift.openedAt) + " · " + esc(openShift.cashierName) : "Cần mở ca trước khi thu tiền") + '</small></div>' +
          '<div class="kpi"><div class="kpi__label">Nguyên liệu dưới ngưỡng</div><strong>' + low.length + '</strong><small>' + (low.filter((x) => x.status === "out").length ? low.filter((x) => x.status === "out").length + " mục đã hết" : "Cần bổ sung sớm") + '</small></div>' +
          '<div class="kpi"><div class="kpi__label">Chênh lệch quỹ gần nhất</div><strong class="' + (lastVariance === 0 ? "" : "text-accent") + '">' + NS.fmt.currency(lastVariance) + '</strong><small>' + (lastClosed ? "Ca " + NS.fmt.date(lastClosed.closedAt) : "Chưa có dữ liệu") + '</small></div></div>' +
          '<div class="split"><div class="stack">' +
          '<div class="chart"><div class="chart-head"><div><h3>Đơn hàng theo khung giờ</h3><p>Hôm nay · ' + NS.fmt.date(NS.today()) + ' · ' + orders.length + ' đơn</p></div><div class="chart-legend"><span><i class="accent"></i>Giờ cao điểm</span><span><i></i>Các khung khác</span></div></div>' +
          NS.ui.bars(bars) + '</div>' +
          '<div class="panel"><div class="panel-head"><div><h2>Cảnh báo tồn kho</h2><p>Nguyên liệu dưới hoặc sát ngưỡng an toàn.</p></div><a class="btn btn-sm" href="#/branch/inventory">Xem kho</a></div>' +
          (low.length ? '<div class="table-wrap"><table class="data"><thead><tr><th>Nguyên liệu</th><th>Tồn thực tế</th><th>Ngưỡng</th><th>Trạng thái</th><th class="text-right">Thao tác</th></tr></thead><tbody>' +
            low.slice(0, 6).map((x) => '<tr class="' + (x.status === "out" ? "is-alert" : "") + '"><td><div class="cell-title">' + esc(x.ing.name) + '</div><div class="cell-sub mono">' + esc(x.ing.code) + '</div></td><td>' + packDisplay(x.ing, NS.calc.ingredientOnHand(x.ing, b.id)) + '</td><td>' + NS.fmt.qty(x.ing.minStock) + " " + esc(x.ing.baseUnit) + '</td><td>' + NS.ui.statusTag(x.status) + '</td><td class="text-right"><a class="btn btn-sm" href="#/branch/inventory/slip/new?type=inbound&ingredient=' + x.ing.id + '">Nhập</a></td></tr>').join("") + '</tbody></table></div>' : NS.ui.empty("Tồn kho ổn định", "Không có nguyên liệu nào dưới ngưỡng an toàn.")) + '</div>' +
          '</div><aside class="sticky-side"><div class="stack">' +
          '<div class="panel"><div class="panel-head"><div><h2>Nhân sự hôm nay</h2><p>' + activeRows.filter((r) => r.att && r.att.checkIn && !r.att.checkOut).length + ' người đang trong ca</p></div><a class="btn btn-sm" href="#/branch/employees">Nhân sự</a></div>' +
          (activeRows.length ? '<div class="table-wrap"><table class="data"><thead><tr><th>Nhân viên</th><th>Ca</th><th>Chấm công</th></tr></thead><tbody>' +
            activeRows.slice(0, 8).map((r) => '<tr><td><div class="cell-title">' + esc(r.emp.name) + '</div><div class="cell-sub">' + esc(r.emp.role) + '</div></td><td>' + esc(NS.data.shiftTemplates[NS.calc.schedule(r.emp.id, NS.today())].name) + '</td><td>' + (r.att ? (r.att.checkOut ? NS.ui.statusTag("completed", "Đã ra") : NS.ui.statusTag("open", "Trong ca")) : NS.ui.statusTag("absent", "Chưa vào")) + '</td></tr>').join("") + '</tbody></table></div>' : NS.ui.empty("Không có lịch", "Chưa phân ca cho hôm nay.")) + '</div>' +
          '<div class="panel"><div class="panel-head"><div><h2>Lối tắt vận hành</h2><p>Các tác vụ thường dùng</p></div></div><div class="flex flex-col gap-8">' +
          '<a class="btn btn-block" href="#/pos">POS bán hàng</a><a class="btn btn-block" href="#/orders">Đơn hàng hôm nay</a><a class="btn btn-block" href="#/branch/shifts">Ca & chấm công</a><a class="btn btn-block" href="#/reports">Báo cáo vận hành</a></div></div>' +
          '</div></aside></div>',
      });
    },
  });
  NS.route("/branch", "branchDashboard");

  NS.view("inventory", {
    roles: NS.roles.branch,
    render() {
      const b = NS.branch();
      const search = (NS.state.inventorySearch || "").toLowerCase();
      const category = NS.state.inventoryCategory || "all";
      const statusFilter = NS.state.inventoryStatus || "all";
      const categories = NS.data.ingredients.map((i) => i.category).filter((c, idx, arr) => arr.indexOf(c) === idx);
      const rows = NS.data.ingredients.filter((ing) => {
        if (search && (ing.name + " " + ing.code).toLowerCase().indexOf(search) < 0) return false;
        if (category !== "all" && ing.category !== category) return false;
        if (statusFilter !== "all" && NS.calc.stockStatus(ing, b.id) !== statusFilter) return false;
        return true;
      });
      const totalValue = NS.data.ingredients.reduce((s, ing) => s + stockValue(ing, b.id), 0);
      const low = NS.data.ingredients.filter((ing) => ["low", "out"].indexOf(NS.calc.stockStatus(ing, b.id)) >= 0);
      const recent = NS.data.stockTransactions.filter((s) => s.branchId === b.id).sort((a, c) => (a.createdAt < c.createdAt ? 1 : -1)).slice(0, 6);
      return NS.ui.shell({
        nav: "branch", active: "inventory", code: "SCR-08", title: "Kho nguyên liệu",
        subtitle: "Theo dõi tồn kho theo đơn vị đóng gói và đơn vị cơ sở. Tồn thực tế được tính theo chi nhánh.",
        actions: '<a class="btn btn-primary" href="#/branch/inventory/slip/new?type=inbound">' + NS.ui.icon("plus") + ' Tạo phiếu kho</a>',
        content: '<div class="inventory-summary"><div><span>Tổng nguyên liệu</span><strong>' + NS.data.ingredients.length + '</strong></div><div><span>Dưới ngưỡng / hết</span><strong>' + low.length + '</strong></div><div><span>Giá trị tồn ước tính</span><strong>' + NS.fmt.currency(totalValue) + '</strong></div><div><span>Phiếu kho gần đây</span><strong>' + recent.length + '</strong></div></div>' +
          '<div class="table-wrap"><div class="table-toolbar"><div class="field grow"><label>Tìm kiếm</label><input class="input" id="inventory-search" data-input="inventory-search" data-focus-key="inventory-search" value="' + esc(NS.state.inventorySearch) + '" placeholder="Tên hoặc mã nguyên liệu…"></div>' +
          '<div class="field"><label>Danh mục</label><select class="select" data-change="inventory-category"><option value="all">Tất cả</option>' + categories.map((c) => '<option value="' + esc(c) + '"' + (category === c ? " selected" : "") + '>' + esc(c) + '</option>').join("") + '</select></div>' +
          '<div class="field"><label>Trạng thái</label><select class="select" data-change="inventory-status"><option value="all">Tất cả</option><option value="ok"' + (statusFilter === "ok" ? " selected" : "") + '>Đủ hàng</option><option value="watch"' + (statusFilter === "watch" ? " selected" : "") + '>Sắp hết</option><option value="low"' + (statusFilter === "low" ? " selected" : "") + '>Dưới ngưỡng</option><option value="out"' + (statusFilter === "out" ? " selected" : "") + '>Hết hàng</option></select></div></div>' +
          '<table class="data"><thead><tr><th>Mã / nguyên liệu</th><th>Quy cách</th><th>Tồn thực tế</th><th>Ngưỡng an toàn</th><th class="num">Giá trị tồn</th><th>Trạng thái</th><th class="text-right">Thao tác</th></tr></thead><tbody>' +
          (rows.length ? rows.map((ing) => {
            const onHand = NS.calc.ingredientOnHand(ing, b.id);
            const status = NS.calc.stockStatus(ing, b.id);
            return '<tr class="' + (status === "out" ? "is-alert" : "") + '"><td><div class="cell-title">' + esc(ing.name) + '</div><div class="cell-sub mono">' + esc(ing.code) + ' · ' + esc(ing.category) + '</div></td>' +
              '<td>' + esc(ing.packUnit) + ' × ' + NS.fmt.qty(ing.conversionRatio) + ' ' + esc(ing.baseUnit) + '</td>' +
              '<td><strong>' + packDisplay(ing, onHand) + '</strong></td><td>' + NS.fmt.qty(ing.minStock) + " " + esc(ing.baseUnit) + '</td>' +
              '<td class="num">' + NS.fmt.currency(stockValue(ing, b.id)) + '</td><td>' + NS.ui.statusTag(status) + '</td>' +
              '<td><div class="actions"><a class="btn btn-sm" href="#/branch/inventory/' + esc(ing.id) + '">Lịch sử</a><a class="btn btn-sm btn-ghost" href="#/branch/inventory/slip/new?type=inbound&ingredient=' + esc(ing.id) + '">Nhập</a></div></td></tr>';
          }).join("") : '<tr><td colspan="7">' + NS.ui.empty("Không có nguyên liệu", "Thử đổi bộ lọc danh mục hoặc trạng thái.") + '</td></tr>') +
          '</tbody></table></div>' +
          '<div class="panel mt-24"><div class="panel-head"><div><h2>Phiếu kho gần đây</h2><p>Nhập, tiêu hủy và kiểm kê tại chi nhánh.</p></div></div>' +
          '<div class="table-wrap"><table class="data"><thead><tr><th>Mã phiếu</th><th>Loại</th><th>Thời gian</th><th>Nguồn / ghi chú</th><th class="num">Giá trị</th><th>Trạng thái</th><th class="text-right"></th></tr></thead><tbody>' +
          recent.map((s) => '<tr><td class="mono">' + esc(s.id) + '</td><td>' + esc(s.type === "inbound" ? "Nhập kho" : s.type === "disposal" ? "Tiêu hủy" : "Kiểm kê") + '</td><td>' + NS.fmt.datetime(s.createdAt) + '</td><td>' + esc(s.source || s.note || "—") + '</td><td class="num">' + NS.fmt.currency(s.total) + '</td><td>' + NS.ui.statusTag(s.status) + '</td><td class="text-right"><a class="btn btn-sm" href="#/branch/inventory/slip-detail?id=' + encodeURIComponent(s.id) + '">Xem</a></td></tr>').join("") +
          '</tbody></table></div></div>',
      });
    },
    actions: {
      "inventory-search"(ctx) { NS.state.inventorySearch = ctx.value; NS.refresh("inventory-search"); },
      "inventory-category"(ctx) { NS.state.inventoryCategory = ctx.value; NS.refresh(); },
      "inventory-status"(ctx) { NS.state.inventoryStatus = ctx.value; NS.refresh(); },
    },
  });
  NS.route("/branch/inventory", "inventory");

  NS.view("inventoryDetail", {
    roles: NS.roles.branch,
    render(ctx) {
      const ing = NS.get.ingredient(ctx.params.id);
      if (!ing) return NS.ui.shell({ active: "inventory", code: "SCR-08", title: "Không tìm thấy nguyên liệu", content: NS.ui.empty("Nguyên liệu không tồn tại", "Quay lại danh sách kho.") });
      const b = NS.branch();
      const onHand = NS.calc.ingredientOnHand(ing, b.id);
      const lines = [];
      NS.data.stockTransactions.filter((s) => s.branchId === b.id).forEach((s) => {
        (s.items || []).forEach((line) => { if (line.ingredientId === ing.id) lines.push({ stock: s, line }); });
      });
      lines.sort((a, c) => (a.stock.createdAt < c.stock.createdAt ? 1 : -1));
      return NS.ui.shell({
        nav: "branch", active: "inventory", code: "SCR-08", title: ing.name,
        subtitle: ing.code + " · " + ing.category + " · Nhà cung cấp " + ing.supplier,
        actions: '<a class="btn" href="#/branch/inventory">Về kho</a><a class="btn btn-primary" href="#/branch/inventory/slip/new?type=inbound&ingredient=' + ing.id + '">Tạo phiếu nhập</a>',
        content: '<div class="inventory-summary"><div><span>Tồn thực tế</span><strong>' + packDisplay(ing, onHand) + '</strong></div><div><span>Ngưỡng an toàn</span><strong>' + NS.fmt.qty(ing.minStock) + " " + esc(ing.baseUnit) + '</strong></div><div><span>Đơn giá cơ sở</span><strong>' + NS.fmt.currency(ing.unitCost) + " / " + esc(ing.baseUnit) + '</strong></div><div><span>Trạng thái</span><strong>' + NS.ui.statusTag(NS.calc.stockStatus(ing, b.id)) + '</strong></div></div>' +
          '<div class="grid-2"><div class="panel"><div class="panel-head"><div><h2>Quy cách & nhà cung cấp</h2><p>Thông tin master data.</p></div></div><dl class="kv"><dt>Mã nguyên liệu</dt><dd class="mono">' + esc(ing.code) + '</dd><dt>Đơn vị cơ sở</dt><dd>' + esc(ing.baseUnit) + '</dd><dt>Đơn vị đóng gói</dt><dd>' + esc(ing.packUnit) + '</dd><dt>Hệ số quy đổi</dt><dd>' + NS.fmt.qty(ing.conversionRatio) + ' ' + esc(ing.baseUnit) + ' / ' + esc(ing.packUnit) + '</dd><dt>Nhà cung cấp</dt><dd>' + esc(ing.supplier) + '</dd><dt>Giá trị tồn</dt><dd><strong>' + NS.fmt.currency(stockValue(ing, b.id)) + '</strong></dd></dl></div>' +
          '<div class="panel"><div class="panel-head"><div><h2>Lịch sử biến động</h2><p>' + lines.length + ' dòng liên quan tại chi nhánh.</p></div></div><div class="table-wrap"><table class="data"><thead><tr><th>Phiếu</th><th>Loại</th><th>Thời gian</th><th class="num">Số lượng</th><th>Lý do</th><th>Trạng thái</th></tr></thead><tbody>' +
          (lines.length ? lines.slice(0, 12).map((x) => '<tr><td class="mono">' + esc(x.stock.id) + '</td><td>' + esc(x.stock.type === "inbound" ? "Nhập" : x.stock.type === "disposal" ? "Tiêu hủy" : "Kiểm kê") + '</td><td>' + NS.fmt.datetime(x.stock.createdAt) + '</td><td class="num">' + (x.stock.type === "inbound" ? "+" : x.stock.type === "disposal" ? "−" : "") + NS.fmt.qty(x.line.baseQty) + " " + esc(ing.baseUnit) + '</td><td class="small">' + esc(x.line.reason || x.stock.note || "—") + '</td><td>' + NS.ui.statusTag(x.stock.status) + '</td></tr>').join("") : '<tr><td colspan="6">' + NS.ui.empty("Chưa có biến động", "Nguyên liệu chưa phát sinh phiếu kho.") + '</td></tr>') +
          '</tbody></table></div></div></div>',
      });
    },
  });
  NS.view("stockSlipDetail", {
    roles: NS.roles.branch,
    render(ctx) {
      const stock = NS.data.stockTransactions.find((s) => s.id === ctx.query.id);
      if (!stock) return NS.ui.task({ code: "POP-04", title: "Không tìm thấy phiếu kho", back: "#/branch/inventory", content: NS.ui.empty("Phiếu không tồn tại", "Quay lại danh sách kho.") });
      const typeLabel = stock.type === "inbound" ? "Phiếu nhập kho" : stock.type === "disposal" ? "Phiếu tiêu hủy" : stock.type === "issue" ? "Phiếu xuất kho" : "Phiếu kiểm kê";
      return NS.ui.task({
        code: "POP-04", title: typeLabel + " · " + stock.id,
        subtitle: NS.fmt.datetime(stock.createdAt) + " · " + NS.branchName(stock.branchId) + " · " + stock.createdByName,
        back: "#/branch/inventory", meta: NS.ui.statusTag(stock.status),
        content: '<div class="grid-2"><div class="panel"><div class="panel-head"><div><h2>Thông tin phiếu</h2><p>Chứng từ kho tại chi nhánh.</p></div></div><dl class="kv">' +
          '<dt>Mã phiếu</dt><dd class="mono">' + esc(stock.id) + '</dd><dt>Loại phiếu</dt><dd>' + esc(typeLabel) + '</dd><dt>Chi nhánh</dt><dd>' + esc(NS.branchName(stock.branchId)) + '</dd><dt>Người tạo</dt><dd>' + esc(stock.createdByName) + '</dd><dt>Nguồn / ghi chú</dt><dd>' + esc(stock.source || stock.note || "—") + '</dd><dt>Tổng giá trị</dt><dd><strong>' + NS.fmt.currency(stock.total) + '</strong></dd><dt>Phê duyệt</dt><dd>' + NS.ui.statusTag(stock.approvalStatus === "coo" ? "pending_approval" : stock.approvalStatus) + '</dd></dl></div>' +
          '<aside class="sticky-side"><div class="panel"><div class="panel-head"><div><h2>Trạng thái chứng từ</h2><p>' + esc(stock.id) + '</p></div></div><div class="stat-line"><span>Trạng thái kho</span><strong>' + NS.ui.statusTag(stock.status) + '</strong></div><div class="stat-line"><span>Số dòng</span><strong>' + (stock.items || []).length + '</strong></div><div class="stat-line"><span>Tổng giá trị</span><strong>' + NS.fmt.currency(stock.total) + '</strong></div>' +
          (stock.approvalStatus === "coo" ? '<a class="btn btn-block mt-12" href="#/approvals">Mở hộp phê duyệt</a>' : '') + '</div></aside></div>' +
          '<div class="panel mt-24"><div class="panel-head"><div><h2>Chi tiết nguyên liệu</h2><p>Định lượng theo đơn vị cơ sở.</p></div></div><div class="table-wrap"><table class="data"><thead><tr><th>Nguyên liệu</th><th class="num">Đóng gói</th><th class="num">Số lượng cơ sở</th><th class="num">Đơn giá</th><th class="num">Thành tiền</th><th>Lý do</th></tr></thead><tbody>' +
          (stock.items || []).map((line) => { const ing = NS.get.ingredient(line.ingredientId); return '<tr><td><div class="cell-title">' + esc(ing ? ing.name : line.ingredientId) + '</div><div class="cell-sub mono">' + esc(ing ? ing.code : "") + '</div></td><td class="num">' + NS.fmt.qty(line.packQty) + ' ' + esc(ing ? ing.packUnit : "") + '</td><td class="num">' + NS.fmt.qty(line.baseQty) + ' ' + esc(ing ? ing.baseUnit : "") + (line.bookQty != null ? '<div class="cell-sub">Sổ sách ' + NS.fmt.qty(line.bookQty) + ' · Lệch ' + NS.fmt.qty(line.variance) + '</div>' : "") + '</td><td class="num">' + NS.fmt.currency(line.unitCost) + '</td><td class="num">' + NS.fmt.currency(line.lineTotal) + '</td><td class="small">' + esc(line.reason || "—") + '</td></tr>'; }).join("") +
          '</tbody></table></div></div>',
      });
    },
  });
  NS.route("/branch/inventory/slip-detail", "stockSlipDetail");
  NS.route("/branch/inventory/:id", "inventoryDetail");

  NS.view("stockSlipNew", {
    roles: NS.roles.branch,
    render(ctx) {
      const type = ctx.query.type || (NS.state.slipDraft && NS.state.slipDraft.type) || "inbound";
      const initKey = type + "|" + (ctx.query.ingredient || "");
      if (!NS.state.slipDraft || NS.state.slipInit !== initKey) {
        NS.state.slipDraft = {
          type,
          lines: [{ ingredientId: ctx.query.ingredient || "", packs: 1, unitCost: 0, baseQty: 0, actualQty: 0, reason: "" }],
        };
        NS.state.slipInit = initKey;
      }
      const draft = NS.state.slipDraft;
      draft.type = type;
      const b = NS.branch();
      const isInbound = type === "inbound";
      const isDisposal = type === "disposal";
      const total = draft.lines.reduce((sum, line) => {
        const ing = NS.get.ingredient(line.ingredientId);
        if (!ing) return sum;
        if (isInbound) return sum + Number(line.packs || 0) * Number(line.unitCost || 0);
        if (isDisposal) return sum + Number(line.baseQty || 0) * ing.unitCost;
        return sum + Math.abs(Number(line.actualQty || 0) - NS.calc.ingredientOnHand(ing, b.id)) * ing.unitCost;
      }, 0);
      return NS.ui.task({
        code: "POP-04",
        title: "Phiếu kho · " + (isInbound ? "Nhập kho" : isDisposal ? "Tiêu hủy" : "Kiểm kê"),
        subtitle: b.name + " · " + NS.fmt.date(NS.today()) + " · Người tạo " + NS.currentUser().name,
        back: "#/branch/inventory",
        meta: '<span class="tag tag-neutral">' + draft.lines.length + ' dòng</span><span class="tag tag-pending">' + esc(NS.fmt.currency(total)) + '</span>',
        content: '<div class="task-body" style="padding:0"><div class="subtabs mb-16">' +
          [["inbound", "Nhập kho"], ["disposal", "Tiêu hủy"], ["stocktake", "Kiểm kê"]].map((t) =>
            '<button class="subtab ' + (type === t[0] ? "active" : "") + '" data-action="slip-type" data-type="' + t[0] + '">' + t[1] + '</button>').join("") + '</div>' +
          '<div class="panel"><div class="form-grid mb-16"><div class="field"><label>Chi nhánh</label><input class="input" value="' + esc(b.name) + '" readonly></div>' +
          '<div class="field"><label>Ngày tạo</label><input class="input" value="' + esc(NS.fmt.date(NS.today())) + '" readonly></div>' +
          '<div class="field"><label>Người tạo</label><input class="input" value="' + esc(NS.currentUser().name) + '" readonly></div>' +
          '<div class="field"><label>' + (isInbound ? "Nguồn nhập" : "Ghi chú phiếu") + '</label><input class="input" name="source" value="' + esc(isInbound ? "Kho trung tâm" : "") + '" placeholder="' + (isInbound ? "Nhà cung cấp / kho nguồn" : "Mô tả ngắn") + '"></div></div>' +
          '<div class="table-wrap"><table class="data stock-row-table"><thead><tr><th>Nguyên liệu</th>' +
          (isInbound ? '<th>Quy cách</th><th>SL (pack)</th><th>Đơn giá / pack</th><th class="num">Thành tiền</th>' : "") +
          (isDisposal ? '<th>Tồn khả dụng</th><th>SL tiêu hủy</th><th>Lý do *</th><th class="num">Giá trị tham chiếu</th>' : "") +
          (type === "stocktake" ? '<th>Tồn sổ</th><th>SL thực đếm</th><th>Chênh lệch</th><th>Lý do nếu lệch</th>' : "") +
          '<th></th></tr></thead><tbody>' +
          draft.lines.map((line, idx) => {
            const ing = NS.get.ingredient(line.ingredientId);
            const onHand = ing ? NS.calc.ingredientOnHand(ing, b.id) : 0;
            return '<tr data-slip-row="' + idx + '"><td><select class="select" data-field="ingredientId" data-change="slip-line-ingredient" data-index="' + idx + '"><option value="">Chọn nguyên liệu…</option>' +
              NS.data.ingredients.map((x) => '<option value="' + x.id + '"' + (line.ingredientId === x.id ? " selected" : "") + '>' + esc(x.name + " · " + x.code) + '</option>').join("") + '</select></td>' +
              (isInbound ? '<td class="small">' + (ing ? esc(ing.packUnit + " × " + NS.fmt.qty(ing.conversionRatio) + " " + ing.baseUnit) : "—") + '</td><td><input class="input" data-field="packs" inputmode="decimal" value="' + esc(line.packs) + '" placeholder="1"></td><td><input class="input" data-field="unitCost" inputmode="numeric" value="' + esc(line.unitCost) + '" placeholder="0"></td><td class="num strong">' + NS.fmt.currency(ing ? Number(line.packs || 0) * Number(line.unitCost || 0) : 0) + '</td>' : "") +
              (isDisposal ? '<td>' + (ing ? packDisplay(ing, onHand) : "—") + '</td><td><input class="input" data-field="baseQty" inputmode="decimal" value="' + esc(line.baseQty || "") + '" placeholder="0"></td><td><input class="input" data-field="reason" value="' + esc(line.reason) + '" placeholder="Bắt buộc"></td><td class="num">' + NS.fmt.currency(ing ? Number(line.baseQty || 0) * ing.unitCost : 0) + '</td>' : "") +
              (type === "stocktake" ? '<td>' + (ing ? NS.fmt.qty(onHand) + " " + esc(ing.baseUnit) : "—") + '</td><td><input class="input" data-field="actualQty" inputmode="decimal" value="' + esc(line.actualQty || "") + '" placeholder="0"></td><td class="num">' + (ing ? (Number(line.actualQty || 0) - onHand > 0 ? "+" : "") + NS.fmt.qty(Number(line.actualQty || 0) - onHand) + " " + esc(ing.baseUnit) : "—") + '</td><td><input class="input" data-field="reason" value="' + esc(line.reason) + '" placeholder="Nếu lệch"></td>' : "") +
              '<td><button class="row-remove" data-action="slip-remove-line" data-index="' + idx + '">−</button></td></tr>';
          }).join("") +
          '</tbody></table></div>' +
          '<div class="flex justify-between items-center mt-12"><button class="btn btn-sm" data-action="slip-add-line">' + NS.ui.icon("plus") + ' Thêm dòng</button><div class="stock-total"><span>Tổng giá trị phiếu</span><strong>' + NS.fmt.currency(total) + '</strong></div></div></div>' +
          '<div class="panel mt-16"><div class="form-grid"><div class="field"><label>PIN quản lý <span class="req">*</span></label><input class="input" name="pin" id="slip-pin" maxlength="4" inputmode="numeric" placeholder="1234"></div><div class="field"><label>Ghi chú</label><input class="input" name="note" id="slip-note" placeholder="Ghi chú chung của phiếu"></div></div>' +
          '<div class="notice notice--warn mt-12"><span class="notice__icon">!</span><div>Phiếu tiêu hủy/điều chỉnh vượt ngưỡng sẽ được gửi COO duyệt. Số lượng nhập/xuất tính theo đơn vị đóng gói.</div></div></div></div>',
        footer: '<span class="task-footer__note">Tổng giá trị: <strong>' + NS.fmt.currency(total) + '</strong> · Cần PIN Manager để xác nhận.</span><div class="flex gap-8"><a class="btn" href="#/branch/inventory">Hủy</a><button class="btn" data-action="slip-save-draft">Lưu nháp</button><button class="btn btn-primary" data-action="slip-submit">Xác nhận phiếu</button></div>',
      });
    },
    actions: {
      "slip-type"(ctx) {
        NS.state.slipDraft = { type: ctx.el.getAttribute("data-type"), lines: [{ ingredientId: "", packs: 1, unitCost: 0, baseQty: 0, actualQty: 0, reason: "" }] };
        NS.state.slipInit = ctx.el.getAttribute("data-type") + "|";
        NS.navigate("/branch/inventory/slip/new?type=" + ctx.el.getAttribute("data-type"));
      },
      "slip-line-ingredient"(ctx) {
        const idx = Number(ctx.el.getAttribute("data-index"));
        if (NS.state.slipDraft && NS.state.slipDraft.lines[idx]) {
          const line = NS.state.slipDraft.lines[idx];
          line.ingredientId = ctx.value;
          if (NS.state.slipDraft.type === "stocktake" && ctx.value) {
            const ing = NS.get.ingredient(ctx.value);
            line.actualQty = ing ? NS.calc.ingredientOnHand(ing, NS.state.branchId) : 0;
          }
          NS.refresh();
        }
      },
      "slip-add-line"() {
        NS.state.slipDraft.lines.push({ ingredientId: "", packs: 1, unitCost: 0, baseQty: 0, actualQty: 0, reason: "" });
        NS.refresh();
      },
      "slip-remove-line"(ctx) {
        const idx = Number(ctx.el.getAttribute("data-index"));
        if (NS.state.slipDraft.lines.length <= 1) { NS.toast("Phiếu cần ít nhất một dòng.", "warn"); return; }
        NS.state.slipDraft.lines.splice(idx, 1);
        NS.refresh();
      },
      "slip-save-draft"() {
        NS.toast("Đã lưu nháp phiếu kho trong phiên demo.");
      },
      "slip-submit"() {
        submitStockSlip();
      },
    },
  });
  NS.route("/branch/inventory/slip/new", "stockSlipNew");

  function submitStockSlip() {
    const draft = NS.state.slipDraft;
    if (!draft) return;
    const type = draft.type;
    const pin = String((document.getElementById("slip-pin") || {}).value || "");
    if (pin !== "1234") { NS.toast("PIN quản lý chưa đúng. PIN demo: 1234.", "error"); return; }
    const rows = [];
    document.querySelectorAll("[data-slip-row]").forEach((tr) => {
      const get = (field) => {
        const el = tr.querySelector('[data-field="' + field + '"]');
        return el ? el.value : "";
      };
      const ingredientId = get("ingredientId");
      if (!ingredientId) return;
      rows.push({
        ingredientId,
        packs: Number(get("packs") || 0),
        unitCost: Number(get("unitCost") || 0),
        baseQty: Number(get("baseQty") || 0),
        actualQty: Number(get("actualQty") || 0),
        reason: String(get("reason") || "").trim(),
      });
    });
    if (!rows.length) { NS.toast("Vui lòng chọn ít nhất một nguyên liệu.", "error"); return; }
    const b = NS.branch();
    const user = NS.currentUser();
    // BR-42: disposal quantity must not exceed available stock in the branch.
    // Check the summed quantity per ingredient, so duplicate lines in one
    // slip cannot bypass the limit either.
    if (type === "disposal") {
      const totalsByIngredient = {};
      rows.forEach((row) => { totalsByIngredient[row.ingredientId] = (totalsByIngredient[row.ingredientId] || 0) + Number(row.baseQty || 0); });
      for (let i = 0; i < rows.length; i++) {
        const ing = NS.get.ingredient(rows[i].ingredientId);
        if (!ing) continue;
        const onHand = NS.calc.ingredientOnHand(ing, b.id);
        if (totalsByIngredient[ing.id] > onHand) {
          NS.toast("Tiêu hủy " + ing.name + " vượt tồn khả dụng: cần " + NS.fmt.qty(totalsByIngredient[ing.id]) + " " + ing.baseUnit + ", chỉ còn " + NS.fmt.qty(onHand) + " " + ing.baseUnit + ".", "error");
          return;
        }
      }
    }
    const items = [];
    let total = 0;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const ing = NS.get.ingredient(row.ingredientId);
      if (!ing) continue;
      if (type === "inbound") {
        if (row.packs <= 0) { NS.toast("Số lượng pack phải lớn hơn 0.", "error"); return; }
        const baseQty = row.packs * ing.conversionRatio;
        const lineTotal = row.packs * row.unitCost;
        total += lineTotal;
        items.push({ ingredientId: ing.id, packQty: row.packs, baseQty, unitCost: row.unitCost, lineTotal, reason: "" });
      } else if (type === "disposal") {
        if (row.baseQty <= 0 || !row.reason) { NS.toast("Tiêu hủy cần số lượng và lý do cho từng dòng.", "error"); return; }
        const lineTotal = row.baseQty * ing.unitCost;
        total += lineTotal;
        items.push({ ingredientId: ing.id, packQty: Math.round(row.baseQty / ing.conversionRatio * 1000) / 1000, baseQty: row.baseQty, unitCost: ing.unitCost, lineTotal, reason: row.reason });
      } else {
        const bookQty = NS.calc.ingredientOnHand(ing, b.id);
        const variance = row.actualQty - bookQty;
        if (row.actualQty < 0) { NS.toast("Số lượng thực đếm không hợp lệ.", "error"); return; }
        if (variance !== 0 && !row.reason) { NS.toast("Kiểm kê lệch cần nhập lý do cho " + ing.name + ".", "error"); return; }
        const lineTotal = Math.abs(variance) * ing.unitCost;
        total += lineTotal;
        items.push({ ingredientId: ing.id, packQty: Math.round(row.actualQty / ing.conversionRatio * 1000) / 1000, baseQty: row.actualQty, bookQty, actualQty: row.actualQty, variance, unitCost: ing.unitCost, lineTotal, reason: row.reason });
      }
    }
    if (!items.length) { NS.toast("Không có dòng hợp lệ.", "error"); return; }
    const threshold = type === "inbound" ? Infinity : type === "disposal" ? Number(NS.data.settings.disposalThreshold || 0) : Number(NS.data.settings.adjustmentThreshold || 0);
    const needsApproval = total > threshold;
    const dateKey = NS.today().slice(2).replace(/-/g, "");
    const prefix = type === "inbound" ? "PN" : type === "disposal" ? "PX" : "KK";
    const count = NS.data.stockTransactions.filter((s) => s.id.indexOf(prefix + "-" + dateKey) === 0).length + 1;
    const id = prefix + "-" + dateKey + "-" + String(count).padStart(3, "0");
    const stock = {
      id, type, branchId: b.id, createdAt: localNow(), createdBy: user.id, createdByName: user.name,
      source: String((document.querySelector('input[name="source"]') || {}).value || (type === "inbound" ? "Kho trung tâm" : "")),
      note: String((document.getElementById("slip-note") || {}).value || ""),
      status: needsApproval ? "pending" : "completed",
      approvalStatus: needsApproval ? "coo" : "none",
      items, total,
    };
    NS.data.stockTransactions.unshift(stock);
    if (needsApproval) {
      NS.data.approvals.unshift({
        id: "AP-" + String(Date.now()).slice(-6), type: type === "disposal" ? "disposal" : "adjustment",
        branchId: b.id, createdAt: localNow(), requestedBy: user.name, amount: total,
        reason: "Phiếu " + id + " vượt ngưỡng phê duyệt", status: "pending", relatedId: id,
        note: "Chờ COO duyệt trước khi áp dụng tồn kho.",
        details: items.map((i) => { const ing = NS.get.ingredient(i.ingredientId); return ing.name + ": " + NS.fmt.qty(i.baseQty) + " " + ing.baseUnit; }).join("; "),
      });
    } else {
      items.forEach((line) => {
        const ing = NS.get.ingredient(line.ingredientId);
        if (!ing) return;
        if (type === "inbound") ing.onHandBase += line.baseQty;
        if (type === "disposal") ing.onHandBase = Math.max(0, ing.onHandBase - line.baseQty);
        if (type === "stocktake") ing.onHandBase = Math.max(0, ing.onHandBase + line.variance);
      });
    }
    NS.addAudit("Tạo phiếu kho", "Kho", null, { id, type, total, status: stock.status });
    NS.saveData();
    NS.state.slipDraft = null;
    NS.state.slipInit = null;
    NS.toast(needsApproval ? "Phiếu đã gửi COO phê duyệt." : "Đã xác nhận phiếu kho.");
    NS.navigate("/branch/inventory");
  }

  NS.view("employees", {
    roles: NS.roles.branch,
    render() {
      const b = NS.branch();
      const search = (NS.state.employeeSearch || "").toLowerCase();
      const role = NS.state.employeeRole || "all";
      const status = NS.state.employeeStatus || "all";
      const list = NS.data.employees.filter((e) => {
        if (e.branchId !== b.id) return false;
        if (search && (e.name + " " + e.code + " " + e.phone).toLowerCase().indexOf(search) < 0) return false;
        if (role !== "all" && e.role !== role) return false;
        if (status !== "all" && e.status !== status) return false;
        return true;
      });
      const logs = NS.data.auditLogs.filter((l) => l.branchId === b.id && ["Nhân sự", "Chấm công"].indexOf(l.entity) >= 0).slice(0, 5);
      return NS.ui.shell({
        nav: "branch", active: "employees", code: "SCR-09 · TAB-03", title: "Hồ sơ nhân sự",
        subtitle: "Quản lý hồ sơ, vai trò, PIN, thẻ RFID và lương/giờ của nhân viên tại chi nhánh.",
        actions: '<a class="btn btn-primary" href="#/branch/employees/edit">' + NS.ui.icon("plus") + ' Thêm nhân viên</a>',
        content: '<div class="table-wrap"><div class="table-toolbar"><div class="field grow"><label>Tìm kiếm</label><input class="input" id="employee-search" data-input="employee-search" data-focus-key="employee-search" value="' + esc(NS.state.employeeSearch) + '" placeholder="Họ tên, mã NV, số điện thoại…"></div>' +
          '<div class="field"><label>Vai trò</label><select class="select" data-change="employee-role"><option value="all">Tất cả</option><option value="Branch Manager"' + (role === "Branch Manager" ? " selected" : "") + '>Quản lý</option><option value="Cashier"' + (role === "Cashier" ? " selected" : "") + '>Thu ngân</option><option value="Staff"' + (role === "Staff" ? " selected" : "") + '>Nhân viên</option></select></div>' +
          '<div class="field"><label>Trạng thái</label><select class="select" data-change="employee-status"><option value="all">Tất cả</option><option value="active"' + (status === "active" ? " selected" : "") + '>Đang hoạt động</option><option value="inactive"' + (status === "inactive" ? " selected" : "") + '>Ngừng hoạt động</option></select></div></div>' +
          '<table class="data"><thead><tr><th>Mã NV</th><th>Họ tên</th><th>SĐT</th><th>Vai trò</th><th>PIN / thẻ</th><th class="num">Lương/giờ</th><th>Trạng thái</th><th class="text-right">Thao tác</th></tr></thead><tbody>' +
          (list.length ? list.map((e) => '<tr class="' + (e.status === "inactive" ? "is-muted" : "") + '"><td class="mono">' + esc(e.code) + '</td><td><div class="cell-title">' + esc(e.name) + '</div><div class="cell-sub">' + esc(e.email || e.username || "—") + '</div></td><td>' + esc(e.phone) + '</td><td>' + esc(e.role) + '</td><td><span class="mono-nowrap">PIN ' + esc(e.pin) + '</span><div class="cell-sub mono">' + esc(e.card || "—") + '</div></td><td class="num">' + NS.fmt.currency(e.hourlyRate) + '</td><td>' + NS.ui.statusTag(e.status) + '</td><td class="text-right"><a class="btn btn-sm" href="#/branch/employees/edit?id=' + encodeURIComponent(e.id) + '">Sửa hồ sơ</a></td></tr>').join("") : '<tr><td colspan="8">' + NS.ui.empty("Không có nhân viên", "Thử đổi bộ lọc hoặc thêm hồ sơ mới.") + '</td></tr>') +
          '</tbody></table></div>' +
          '<div class="panel mt-24"><div class="panel-head"><div><h2>Hoạt động hồ sơ gần đây</h2><p>Audit log liên quan nhân sự và chấm công.</p></div><a class="btn btn-sm" href="#/branch/shifts">Ca & chấm công</a></div>' +
          (logs.length ? '<div class="list-plain">' + logs.map((l) => '<div class="list-item"><div><strong>' + esc(l.action) + '</strong> · ' + esc(l.actor) + '<div class="cell-sub">' + esc(l.entity) + '</div></div><span class="small muted">' + NS.fmt.datetime(l.time) + '</span></div>').join("") + '</div>' : NS.ui.empty("Chưa có hoạt động", "Các thay đổi hồ sơ sẽ hiển thị ở đây.")) + '</div>',
      });
    },
    actions: {
      "employee-search"(ctx) { NS.state.employeeSearch = ctx.value; NS.refresh("employee-search"); },
      "employee-role"(ctx) { NS.state.employeeRole = ctx.value; NS.refresh(); },
      "employee-status"(ctx) { NS.state.employeeStatus = ctx.value; NS.refresh(); },
    },
  });
  NS.route("/branch/employees", "employees");

  NS.view("employeeEdit", {
    roles: NS.roles.branch,
    render(ctx) {
      const id = ctx.query.id || "";
      const emp = id ? NS.get.employee(id) : null;
      if (id && !emp) return NS.ui.task({ code: "TAB-03", title: "Không tìm thấy nhân viên", back: "#/branch/employees", content: NS.ui.empty("Hồ sơ không tồn tại", "Quay lại danh sách nhân sự.") });
      const e = emp || { id: "", code: "", name: "", phone: "", email: "", username: "", pin: "", card: "", role: "Staff", status: "active", hourlyRate: 28000, baseSalary: 5500000, note: "", branchId: NS.state.branchId };
      return NS.ui.task({
        code: "TAB-03",
        title: emp ? "Sửa hồ sơ · " + emp.name : "Thêm nhân viên",
        subtitle: "Thông tin nhân sự, PIN chấm công và mức lương/giờ.",
        back: "#/branch/employees",
        meta: emp ? NS.ui.statusTag(emp.status) : '<span class="tag tag-pending">Hồ sơ mới</span>',
        content: '<form data-action="employee-save"><div class="panel"><div class="panel-head"><div><h2>Thông tin cơ bản</h2><p>Chi nhánh ' + esc(NS.branch().name) + '</p></div></div><div class="form-grid">' +
          '<div class="field"><label>Họ tên <span class="req">*</span></label><input class="input" name="name" value="' + esc(e.name) + '" required></div>' +
          '<div class="field"><label>Số điện thoại <span class="req">*</span></label><input class="input" name="phone" value="' + esc(e.phone) + '" placeholder="0xxxxxxxxx" required><div class="hint">10–11 số, bắt đầu bằng 0.</div></div>' +
          '<div class="field"><label>Email</label><input class="input" name="email" type="email" value="' + esc(e.email) + '"></div>' +
          '<div class="field"><label>Vai trò <span class="req">*</span></label><select class="select" name="role"><option value="Staff"' + (e.role === "Staff" ? " selected" : "") + '>Nhân viên</option><option value="Cashier"' + (e.role === "Cashier" ? " selected" : "") + '>Thu ngân</option><option value="Branch Manager"' + (e.role === "Branch Manager" ? " selected" : "") + '>Quản lý chi nhánh</option></select></div>' +
          '<div class="field"><label>Tên đăng nhập</label><input class="input" name="username" value="' + esc(e.username) + '"></div>' +
          '<div class="field"><label>PIN 4 số <span class="req">*</span></label><input class="input" name="pin" maxlength="4" inputmode="numeric" value="' + esc(e.pin) + '" required><div class="hint">Duy nhất trong chi nhánh.</div></div>' +
          '<div class="field"><label>Mã RFID</label><input class="input" name="card" value="' + esc(e.card) + '"></div>' +
          '<div class="field"><label>Trạng thái</label><select class="select" name="status"><option value="active"' + (e.status === "active" ? " selected" : "") + '>Đang hoạt động</option><option value="inactive"' + (e.status === "inactive" ? " selected" : "") + '>Ngừng hoạt động</option></select></div>' +
          '<div class="field"><label>Lương cơ bản</label><input class="input" name="baseSalary" inputmode="numeric" value="' + esc(e.baseSalary) + '"></div>' +
          '<div class="field"><label>Lương / giờ</label><input class="input" name="hourlyRate" inputmode="numeric" value="' + esc(e.hourlyRate) + '"></div>' +
          '<div class="field span-all"><label>Ghi chú</label><textarea class="textarea" name="note">' + esc(e.note) + '</textarea></div></div>' +
          '<div class="form-actions"><a class="btn" href="#/branch/employees">Hủy</a><button class="btn btn-primary" type="submit">Lưu hồ sơ</button></div></div></form>',
      });
    },
    actions: {
      "employee-save"(ctx) {
        const data = ctx.data;
        const id = ctx.query.id || "";
        const name = String(data.get("name") || "").trim();
        const phone = String(data.get("phone") || "").trim();
        const pin = String(data.get("pin") || "").trim();
        const role = String(data.get("role") || "Staff");
        const status = String(data.get("status") || "active");
        if (!name) { NS.toast("Vui lòng nhập họ tên.", "error"); return; }
        if (!/^0\d{9,10}$/.test(phone)) { NS.toast("Số điện thoại phải gồm 10–11 số và bắt đầu bằng 0.", "error"); return; }
        if (!/^\d{4}$/.test(pin)) { NS.toast("PIN phải gồm đúng 4 chữ số.", "error"); return; }
        const duplicate = NS.data.employees.find((e) => e.branchId === NS.state.branchId && e.pin === pin && e.id !== id);
        if (duplicate) { NS.toast("PIN đã được dùng bởi " + duplicate.name + " trong chi nhánh.", "error"); return; }
        let emp = id ? NS.get.employee(id) : null;
        const before = emp ? JSON.parse(JSON.stringify(emp)) : null;
        if (!emp) {
          emp = {
            id: "E" + String(Date.now()).slice(-5), code: "NV-" + String(Date.now()).slice(-4),
            branchId: NS.state.branchId, createdAt: localNow(),
          };
          NS.data.employees.push(emp);
        }
        Object.assign(emp, {
          name, phone, pin, role, status,
          email: String(data.get("email") || "").trim(),
          username: String(data.get("username") || "").trim(),
          card: String(data.get("card") || "").trim(),
          baseSalary: Number(data.get("baseSalary") || 0),
          hourlyRate: Number(data.get("hourlyRate") || 0),
          note: String(data.get("note") || "").trim(),
        });
        NS.addAudit(id ? "Sửa hồ sơ nhân viên" : "Thêm nhân viên", "Nhân sự", before, { name, role, status, pin });
        NS.saveData();
        NS.toast("Đã lưu hồ sơ " + name + ".");
        NS.navigate("/branch/employees");
      },
    },
  });
  NS.route("/branch/employees/edit", "employeeEdit");

  NS.view("branchShifts", {
    roles: NS.roles.branch,
    render() {
      const tab = NS.state.branchShiftsTab || "roster";
      const b = NS.branch();
      return NS.ui.shell({
        nav: "branch", active: "employees", code: "SCR-09 · TAB-04", title: "Ca & chấm công",
        subtitle: "Phân ca theo tuần và đối soát chấm công thực tế của nhân viên chi nhánh.",
        actions: '<a class="btn" href="#/kiosk">Mở Kiosk</a>',
        content: '<div class="tabs"><button class="tab ' + (tab === "roster" ? "active" : "") + '" data-action="branch-shift-tab" data-tab="roster">Lịch phân ca</button><button class="tab ' + (tab === "attendance" ? "active" : "") + '" data-action="branch-shift-tab" data-tab="attendance">Nhật ký chấm công</button></div>' +
          (tab === "roster" ? renderRoster(b) : renderAttendance(b)),
      });
    },
    actions: {
      "branch-shift-tab"(ctx) { NS.state.branchShiftsTab = ctx.el.getAttribute("data-tab"); NS.refresh(); },
      "roster-prev"() { NS.state.rosterWeekStart = NS.addDays(NS.state.rosterWeekStart, -7); NS.refresh(); },
      "roster-next"() { NS.state.rosterWeekStart = NS.addDays(NS.state.rosterWeekStart, 7); NS.refresh(); },
      "roster-shift"(ctx) {
        const empId = ctx.el.getAttribute("data-emp");
        const date = ctx.el.getAttribute("data-date");
        const key = empId + "|" + date;
        if (ctx.value) NS.data.schedule[key] = ctx.value;
        else delete NS.data.schedule[key];
        NS.saveData();
        NS.toast("Đã cập nhật phân ca " + NS.fmt.date(date) + ".");
      },
      "attendance-search"(ctx) { NS.state.attendanceSearch = ctx.value; NS.refresh("attendance-search"); },
      "attendance-date"(ctx) { NS.state.attendanceDate = ctx.value; NS.refresh(); },
      "attendance-status"(ctx) { NS.state.attendanceStatus = ctx.value; NS.refresh(); },
    },
  });
  NS.route("/branch/shifts", "branchShifts");

  function renderRoster(b) {
    const weekStart = NS.state.rosterWeekStart || "2026-10-19";
    const days = [];
    for (let i = 0; i < 7; i++) days.push(NS.addDays(weekStart, i));
    const employees = NS.data.employees.filter((e) => e.branchId === b.id && e.role !== "COO" && e.status === "active");
    const scheduledCount = employees.reduce((s, e) => s + days.filter((d) => NS.calc.schedule(e.id, d)).length, 0);
    return '<div class="panel panel--flush"><div class="panel-head" style="padding:14px 16px 0"><div><h2>Lịch phân ca tuần</h2><p>' + NS.fmt.date(days[0]) + " – " + NS.fmt.date(days[6]) + ' · ' + scheduledCount + ' ca đã xếp</p></div><div class="panel-head actions"><button class="btn btn-sm" data-action="roster-prev">Tuần trước</button><button class="btn btn-sm" data-action="roster-next">Tuần sau</button></div></div>' +
      '<div class="table-wrap" style="border:0"><table class="data"><thead><tr><th>Nhân viên</th>' + days.map((d) => '<th class="' + (d === NS.today() ? "text-accent" : "") + '">' + esc(NS.fmt.weekday(d + "T12:00:00").slice(0, 3)) + '<div class="cell-sub">' + NS.fmt.date(d) + '</div></th>').join("") + '</tr></thead><tbody>' +
      employees.map((e) => '<tr><td><div class="cell-title">' + esc(e.name) + '</div><div class="cell-sub">' + esc(e.role) + '</div></td>' +
        days.map((d) => '<td><select class="select input-sm" data-change="roster-shift" data-emp="' + e.id + '" data-date="' + d + '"><option value="">Nghỉ</option>' +
          Object.keys(NS.data.shiftTemplates).map((k) => '<option value="' + k + '"' + (NS.calc.schedule(e.id, d) === k ? " selected" : "") + '>' + esc(NS.data.shiftTemplates[k].name) + '</option>').join("") + '</select></td>').join("") + '</tr>').join("") +
      '</tbody></table></div><div class="report-note">Thay đổi được lưu ngay. Ca sáng 06:00–12:00 · Ca chiều 12:00–18:00 · Ca tối 18:00–23:00.</div></div>';
  }

  function renderAttendance(b) {
    const date = NS.state.attendanceDate || NS.today();
    const search = (NS.state.attendanceSearch || "").toLowerCase();
    const statusFilter = NS.state.attendanceStatus || "all";
    const records = NS.data.attendance.filter((a) => {
      if (a.branchId !== b.id || a.workDate !== date) return false;
      const emp = NS.get.employee(a.employeeId);
      if (!emp) return false;
      if (search && (emp.name + " " + emp.code).toLowerCase().indexOf(search) < 0) return false;
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      return true;
    });
    const late = records.filter((a) => a.minutesLate > 0).length;
    const missing = records.filter((a) => a.status === "missing").length;
    const totalHours = records.reduce((s, a) => s + NS.calc.attendanceHours(a), 0);
    return '<div class="kpi-strip"><div class="kpi"><div class="kpi__label">Bản ghi chấm công</div><strong>' + records.length + '</strong><small>' + NS.fmt.date(date) + '</small></div><div class="kpi"><div class="kpi__label">Đi muộn</div><strong>' + late + '</strong><small>Trong ngày</small></div><div class="kpi"><div class="kpi__label">Thiếu check-out</div><strong>' + missing + '</strong><small>Cần điều chỉnh</small></div><div class="kpi"><div class="kpi__label">Tổng giờ ghi nhận</div><strong>' + NS.fmt.qty(totalHours) + '</strong><small>Giờ</small></div></div>' +
      '<div class="table-wrap"><div class="table-toolbar"><div class="field"><label>Ngày</label><input class="input" type="date" value="' + esc(date) + '" data-change="attendance-date"></div>' +
      '<div class="field grow"><label>Tìm kiếm</label><input class="input" id="attendance-search" data-input="attendance-search" data-focus-key="attendance-search" value="' + esc(NS.state.attendanceSearch) + '" placeholder="Tên hoặc mã nhân viên…"></div>' +
      '<div class="field"><label>Trạng thái</label><select class="select" data-change="attendance-status"><option value="all">Tất cả</option><option value="on_time"' + (statusFilter === "on_time" ? " selected" : "") + '>Đúng giờ</option><option value="late"' + (statusFilter === "late" ? " selected" : "") + '>Đi muộn</option><option value="early"' + (statusFilter === "early" ? " selected" : "") + '>Về sớm</option><option value="missing"' + (statusFilter === "missing" ? " selected" : "") + '>Thiếu check-out</option><option value="absent"' + (statusFilter === "absent" ? " selected" : "") + '>Vắng</option></select></div></div>' +
      '<table class="data"><thead><tr><th>Nhân viên</th><th>Ca</th><th>Giờ vào</th><th>Giờ ra</th><th>Phương thức</th><th class="num">Muộn / sớm</th><th class="num">Tổng giờ</th><th>Trạng thái</th><th class="text-right">Thao tác</th></tr></thead><tbody>' +
      (records.length ? records.map((a) => {
        const emp = NS.get.employee(a.employeeId);
        const shiftCode = NS.calc.schedule(a.employeeId, a.workDate);
        return '<tr><td><div class="cell-title">' + esc(emp.name) + '</div><div class="cell-sub mono">' + esc(emp.code) + '</div></td><td>' + esc(shiftCode ? NS.data.shiftTemplates[shiftCode].name : "—") + '</td><td>' + (a.checkIn ? NS.fmt.time(a.checkIn) : "—") + '</td><td>' + (a.checkOut ? NS.fmt.time(a.checkOut) : "—") + '</td><td>' + esc(a.method) + '</td><td class="num">' + a.minutesLate + " / " + a.minutesEarly + '</td><td class="num">' + NS.fmt.qty(NS.calc.attendanceHours(a)) + '</td><td>' + NS.ui.statusTag(a.status) + '</td><td class="text-right"><a class="btn btn-sm" href="#/branch/shifts/adjust?id=' + encodeURIComponent(a.id) + '">Điều chỉnh</a></td></tr>';
      }).join("") : '<tr><td colspan="9">' + NS.ui.empty("Không có bản ghi", "Chưa có chấm công cho ngày đã chọn.") + '</td></tr>') +
      '</tbody></table></div>';
  }

  NS.view("attendanceAdjust", {
    roles: NS.roles.branch,
    render(ctx) {
      const att = NS.data.attendance.find((a) => a.id === ctx.query.id);
      if (!att) return NS.ui.task({ code: "TAB-04", title: "Không tìm thấy bản ghi", back: "#/branch/shifts", content: NS.ui.empty("Bản ghi không tồn tại", "Quay lại nhật ký chấm công.") });
      const emp = NS.get.employee(att.employeeId);
      const self = att.employeeId === NS.state.currentUser;
      return NS.ui.task({
        code: "TAB-04",
        title: "Điều chỉnh chấm công",
        subtitle: emp.name + " · " + NS.fmt.date(att.workDate) + " · " + emp.code,
        back: "#/branch/shifts",
        meta: NS.ui.statusTag(att.status) + (self ? '<span class="tag tag-warn">Cần COO duyệt</span>' : ""),
        content: '<div class="panel" style="max-width:720px;margin:0 auto">' + (self && NS.state.role === "manager" ? '<div class="notice notice--warn mb-16"><span class="notice__icon">!</span><div><strong>Quản lý không được tự duyệt dữ liệu chấm công của mình.</strong> Vui lòng đăng nhập COO để thực hiện điều chỉnh.</div></div>' : "") +
          '<form data-action="attendance-save"><div class="form-grid"><div class="field"><label>Nhân viên</label><input class="input" value="' + esc(emp.name) + '" readonly></div><div class="field"><label>Ngày làm việc</label><input class="input" value="' + esc(NS.fmt.date(att.workDate)) + '" readonly></div>' +
          '<div class="field"><label>Giờ vào điều chỉnh</label><input class="input" type="time" name="checkIn" value="' + esc((att.checkIn || "").slice(11, 16)) + '"></div>' +
          '<div class="field"><label>Giờ ra điều chỉnh</label><input class="input" type="time" name="checkOut" value="' + esc((att.checkOut || "").slice(11, 16)) + '"></div>' +
          '<div class="field"><label>Người duyệt</label><input class="input" value="' + esc(NS.currentUser().name + " · " + NS.roleLabel(NS.state.role)) + '" readonly></div>' +
          '<div class="field"><label>Phương thức</label><input class="input" value="' + esc(att.method) + '" readonly></div>' +
          '<div class="field span-all"><label>Lý do điều chỉnh <span class="req">*</span></label><textarea class="textarea" name="reason" placeholder="Ví dụ: lỗi đầu đọc thẻ, quên check-out..." required></textarea></div></div>' +
          '<div class="form-actions"><a class="btn" href="#/branch/shifts">Hủy</a><button class="btn btn-primary" type="submit"' + (self && NS.state.role === "manager" ? " disabled" : "") + '>Lưu điều chỉnh</button></div></form></div>',
      });
    },
    actions: {
      "attendance-save"(ctx) {
        const att = NS.data.attendance.find((a) => a.id === ctx.query.id);
        if (!att) return;
        if (att.employeeId === NS.state.currentUser && NS.state.role === "manager") {
          NS.toast("Bạn không thể tự duyệt chấm công của mình. Vui lòng dùng COO.", "error");
          return;
        }
        const reason = String(ctx.data.get("reason") || "").trim();
        if (!reason) { NS.toast("Vui lòng nhập lý do điều chỉnh.", "error"); return; }
        const inTime = String(ctx.data.get("checkIn") || "");
        const outTime = String(ctx.data.get("checkOut") || "");
        if (inTime) att.checkIn = att.workDate + "T" + inTime + ":00";
        att.checkOut = outTime ? att.workDate + "T" + outTime + ":00" : null;
        if (att.checkIn && att.checkOut) {
          att.hours = Math.round(NS.minutesBetween(att.checkIn, att.checkOut) / 60 * 100) / 100;
          att.status = "on_time";
        } else {
          att.hours = null;
          att.status = "missing";
        }
        att.note = reason;
        NS.addAudit("Điều chỉnh công", "Chấm công", null, { employee: att.employeeId, checkIn: att.checkIn, checkOut: att.checkOut, reason });
        NS.saveData();
        NS.toast("Đã điều chỉnh chấm công.");
        NS.navigate("/branch/shifts");
      },
    },
  });
  NS.route("/branch/shifts/adjust", "attendanceAdjust");
})();
