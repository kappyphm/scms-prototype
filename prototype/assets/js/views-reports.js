/* SCMS prototype — reports & analytics */
(function () {
  const NS = window.SCMS;
  const esc = NS.esc;

  function eachDay(from, to) {
    const out = [];
    let d = new Date(from + "T12:00:00");
    const end = new Date(to + "T12:00:00");
    let guard = 0;
    while (d <= end && guard++ < 120) {
      out.push(d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"));
      d.setDate(d.getDate() + 1);
    }
    return out;
  }

  function rangeFor(ctx) {
    const range = ctx.query.range || "7";
    const today = NS.today();
    if (range === "today") return { from: today, to: today, range };
    if (range === "30") return { from: NS.addDays(today, -29), to: today, range };
    if (range === "custom") return { from: ctx.query.from || NS.addDays(today, -6), to: ctx.query.to || today, range };
    return { from: NS.addDays(today, -6), to: today, range: "7" };
  }

  function buildReport(ctx) {
    const tab = NS.state.role === "coo" ? (ctx.query.tab || "chain") : "branch";
    const range = rangeFor(ctx);
    const branchId = NS.state.role === "coo" ? (ctx.query.branch || (tab === "chain" ? "all" : NS.state.branchId)) : NS.state.branchId;
    const all = branchId === "all";
    const orders = NS.calc.ordersInRange(all ? null : branchId, range.from, range.to, all);
    const completed = orders.filter((o) => o.payment && o.payment.status === "completed" && o.status !== "cancelled");
    const revenue = NS.calc.revenue(orders);
    const cogs = NS.calc.cogs(orders);
    const refunds = orders.reduce((sum, o) => sum + (o.refunds || []).filter((r) => r.status === "completed" && (r.processedAt || "").slice(0, 10) >= range.from && (r.processedAt || "").slice(0, 10) <= range.to).reduce((s, r) => s + r.amount, 0), 0);
    const discounts = completed.reduce((s, o) => s + (o.discount || 0), 0);
    const shifts = NS.data.shifts.filter((s) => {
      const day = (s.openedAt || "").slice(0, 10);
      return day >= range.from && day <= range.to && (all || s.branchId === branchId);
    });
    const cashOut = shifts.reduce((sum, s) => sum + (s.transactions || []).filter((t) => t.type === "cash_out").reduce((x, t) => x + t.amount, 0), 0);
    const avg = completed.length ? revenue / completed.length : 0;
    const margin = revenue ? (revenue - cogs) / revenue * 100 : 0;
    const days = eachDay(range.from, range.to);
    const series = days.map((day) => {
      const dayOrders = orders.filter((o) => (o.createdAt || "").slice(0, 10) === day);
      return { day, revenue: NS.calc.revenue(dayOrders), orders: dayOrders.length };
    });
    const productMap = {};
    completed.forEach((o) => o.items.forEach((item) => {
      if (!productMap[item.productId]) productMap[item.productId] = { product: NS.get.product(item.productId), qty: 0, revenue: 0, cogs: 0 };
      productMap[item.productId].qty += item.qty;
      productMap[item.productId].revenue += item.lineTotal || 0;
      productMap[item.productId].cogs += NS.calc.bomCost(item.productId, item.size) * item.qty;
    }));
    const products = Object.values(productMap).filter((x) => x.product).sort((a, b) => b.revenue - a.revenue);
    const payMix = NS.calc.paymentMix(orders);
    const branchRows = NS.data.branches.filter((b) => all || b.id === branchId).map((b) => {
      const list = orders.filter((o) => o.branchId === b.id);
      const rev = NS.calc.revenue(list);
      const cost = NS.calc.cogs(list);
      return { branch: b, orders: list.length, revenue: rev, cogs: cost, gross: rev - cost, margin: rev ? (rev - cost) / rev * 100 : 0 };
    });
    const usageMap = {};
    orders.filter((o) => o.status !== "cancelled").forEach((o) => NS.calc.bomUsage(o).forEach((u) => {
      if (!usageMap[u.ingredient.id]) usageMap[u.ingredient.id] = { ingredient: u.ingredient, qty: 0 };
      usageMap[u.ingredient.id].qty += u.qty;
    }));
    const usage = Object.values(usageMap).sort((a, b) => b.qty * b.ingredient.unitCost - a.qty * a.ingredient.unitCost).slice(0, 8);
    const shiftRows = shifts.map((s) => ({ shift: s, stats: NS.calc.shiftStats(s) })).sort((a, b) => (a.shift.openedAt < b.shift.openedAt ? 1 : -1));
    // BR-47: cancel / refund rates, payment mix per shift, HR & labour, stock movement.
    const cancelled = orders.filter((o) => o.status === "cancelled").length;
    const refundOrders = orders.filter((o) => (o.refunds || []).some((rf) => rf.status === "completed"));
    const payByShift = shiftRows.map((x) => {
      const s = x.shift;
      const list = orders.filter((o) => o.branchId === s.branchId && o.payment && o.payment.status === "completed" &&
        o.createdAt >= s.openedAt && (!s.closedAt || o.createdAt <= s.closedAt));
      const cash = list.filter((o) => o.payment.method === "cash").reduce((sum, o) => sum + NS.calc.orderNet(o), 0);
      const qr = list.filter((o) => o.payment.method !== "cash").reduce((sum, o) => sum + NS.calc.orderNet(o), 0);
      return { shift: s, cash, qr, total: cash + qr, count: list.length };
    });
    const hrRows = NS.data.employees.filter((e) => e.role !== "COO" && (all || e.branchId === branchId)).map((e) => {
      const logs = NS.data.attendance.filter((a) => a.employeeId === e.id && a.workDate >= range.from && a.workDate <= range.to);
      let hours = 0;
      let open = 0;
      logs.forEach((a) => {
        if (a.checkIn && a.checkOut) hours += NS.calc.attendanceHours(a);
        else if (a.checkIn && !a.checkOut) open += 1;
      });
      return {
        employee: e,
        days: logs.filter((a) => a.checkIn).length,
        hours: Math.round(hours * 100) / 100,
        late: logs.reduce((s, a) => s + (a.minutesLate || 0), 0),
        early: logs.reduce((s, a) => s + (a.minutesEarly || 0), 0),
        absent: logs.filter((a) => !a.checkIn).length,
        open,
        labor: Math.round(hours * (e.hourlyRate || 0)),
      };
    }).filter((r) => r.days > 0 || r.absent > 0).sort((a, b) => b.hours - a.hours);
    const stockInRange = NS.data.stockTransactions.filter((s) => {
      const day = (s.createdAt || "").slice(0, 10);
      return day >= range.from && day <= range.to && (all || s.branchId === branchId);
    });
    const stockByType = ["inbound", "disposal", "stocktake"].map((t) => {
      const list = stockInRange.filter((s) => s.type === t);
      return { type: t, count: list.length, total: list.reduce((s, x) => s + (x.total || 0), 0) };
    });
    const stocktakeVariance = {};
    stockInRange.filter((s) => s.type === "stocktake").forEach((s) => (s.items || []).forEach((line) => {
      if (line.variance == null || line.variance === 0) return;
      const ing = NS.get.ingredient(line.ingredientId);
      if (!ing) return;
      if (!stocktakeVariance[ing.id]) stocktakeVariance[ing.id] = { ingredient: ing, variance: 0, value: 0 };
      stocktakeVariance[ing.id].variance += line.variance;
      stocktakeVariance[ing.id].value += Math.abs(line.variance) * ing.unitCost;
    }));
    const stocktakeRows = Object.values(stocktakeVariance).sort((a, b) => b.value - a.value);
    return { tab, range, branchId, all, orders, completed, revenue, cogs, refunds, discounts, cashOut, avg, margin, series, products, payMix, branchRows, usage, shiftRows, shifts,
      cancelled, cancelRate: orders.length ? cancelled / orders.length * 100 : 0,
      refundOrders: refundOrders.length, refundRate: completed.length ? refundOrders.length / completed.length * 100 : 0,
      payByShift, hrRows, stockByType, stocktakeRows, hrLabor: hrRows.reduce((s, r) => s + r.labor, 0) };
  }

  NS.view("reports", {
    roles: NS.roles.reports,
    render(ctx) {
      const r = buildReport(ctx);
      const isChain = r.tab === "chain";
      const branchLabel = r.all ? "Toàn chuỗi" : NS.branchName(r.branchId);
      const dateLabel = r.range.from === r.range.to ? NS.fmt.date(r.range.from) : NS.fmt.date(r.range.from) + " – " + NS.fmt.date(r.range.to);
      const tabs = NS.state.role === "coo"
        ? '<div class="tabs"><a class="tab ' + (!isChain ? "active" : "") + '" href="#/reports?tab=branch&range=' + r.range.range + (r.range.range === "custom" ? "&from=" + r.range.from + "&to=" + r.range.to : "") + '&branch=' + r.branchId + '">TAB-07 · Báo cáo vận hành</a><a class="tab ' + (isChain ? "active" : "") + '" href="#/reports?tab=chain&range=' + r.range.range + (r.range.range === "custom" ? "&from=" + r.range.from + "&to=" + r.range.to : "") + '&branch=all">TAB-08 · Báo cáo hợp nhất</a></div>'
        : "";
      const filters = '<form class="report-filters" data-action="report-apply">' +
        '<input type="hidden" name="tab" value="' + r.tab + '">' +
        '<div class="field"><label>Khoảng thời gian</label><select class="select" name="range">' +
        [["today", "Hôm nay"], ["7", "7 ngày gần nhất"], ["30", "30 ngày gần nhất"], ["custom", "Tùy chọn"]].map((x) => '<option value="' + x[0] + '"' + (r.range.range === x[0] ? " selected" : "") + '>' + x[1] + '</option>').join("") + '</select></div>' +
        '<div class="field"><label>Từ ngày</label><input class="input" type="date" name="from" value="' + r.range.from + '"></div>' +
        '<div class="field"><label>Đến ngày</label><input class="input" type="date" name="to" value="' + r.range.to + '"></div>' +
        (NS.state.role === "coo" ? '<div class="field"><label>Chi nhánh</label><select class="select" name="branch"><option value="all"' + (r.all ? " selected" : "") + '>Toàn chuỗi</option>' + NS.data.branches.map((b) => '<option value="' + b.id + '"' + (r.branchId === b.id ? " selected" : "") + '>' + esc(b.short) + '</option>').join("") + '</select></div>' : '<div class="field"><label>Chi nhánh</label><div class="input" style="display:flex;align-items:center">' + esc(NS.branchName(r.branchId)) + '</div></div>') +
        '<div class="field"><label>&nbsp;</label><button class="btn btn-primary" type="submit">Áp dụng</button></div>' +
        '<div class="field report-filters__actions"><label>&nbsp;</label><div class="flex gap-8"><button class="btn" type="button" data-action="report-export">Xuất Excel</button><button class="btn" type="button" data-action="report-print">In báo cáo</button></div></div></form>';
      return NS.ui.shell({
        nav: isChain ? "chain" : "branch", active: "reports", code: isChain ? "TAB-08" : "TAB-07",
        title: isChain ? "Báo cáo hợp nhất" : "Báo cáo vận hành",
        subtitle: branchLabel + " · " + dateLabel + " · " + (isChain ? "So sánh toàn hệ thống" : "Chi tiết hoạt động chi nhánh"),
        actions: '<a class="btn" href="#/chain">Chain Dashboard</a><a class="btn" href="#/orders">Đơn hàng</a>',
        content: tabs + filters +
          '<div class="kpi-strip"><div class="kpi"><div class="kpi__label">Doanh thu thuần</div><strong>' + NS.fmt.currency(r.revenue) + '</strong><small>' + r.completed.length + ' đơn đã thanh toán · ' + NS.fmt.currency(r.avg) + ' / đơn</small></div>' +
          '<div class="kpi"><div class="kpi__label">COGS</div><strong>' + NS.fmt.currency(r.cogs) + '</strong><small>' + NS.fmt.percent(r.revenue ? r.cogs / r.revenue * 100 : 0) + ' doanh thu</small></div>' +
          '<div class="kpi"><div class="kpi__label">Lợi nhuận gộp</div><strong>' + NS.fmt.currency(r.revenue - r.cogs) + '</strong><small>Biên góp ' + NS.fmt.percent(r.margin) + '</small></div>' +
          '<div class="kpi"><div class="kpi__label">Hoàn tiền / giảm giá</div><strong>' + NS.fmt.currency(r.refunds) + '</strong><small>Giảm giá ' + NS.fmt.currency(r.discounts) + ' · Chi quỹ ' + NS.fmt.currency(r.cashOut) + '</small></div></div>' +
          '<div class="grid-2"><div class="chart"><div class="chart-head"><div><h3>Doanh thu theo ngày</h3><p>' + dateLabel + ' · ' + r.orders.length + ' đơn phát sinh</p></div><span class="tag tag-neutral">' + (r.series.length > 14 ? "Theo ngày" : r.series.length + " ngày") + '</span></div>' +
          NS.ui.hbars(r.series.map((s) => ({ label: NS.fmt.date(s.day).slice(0, 5), value: s.revenue, display: NS.fmt.currency(s.revenue) + " · " + s.orders + " đơn" }))) + '</div>' +
          '<div class="chart"><div class="chart-head"><div><h3>Cơ cấu thanh toán</h3><p>Doanh thu theo phương thức</p></div></div>' +
          NS.ui.hbars(r.payMix.map((p) => ({ label: p.method, value: p.amount, display: NS.fmt.currency(p.amount) + " · " + p.orders + " đơn" }))) + '</div></div>' +
          '<div class="grid-2 mt-24"><div class="panel"><div class="panel-head"><div><h2>Top món theo doanh thu</h2><p>Doanh thu gộp theo dòng món, trước hoàn tiền.</p></div></div>' +
          (r.products.length ? '<div class="table-wrap"><table class="data"><thead><tr><th>Món</th><th class="num">SL</th><th class="num">Doanh thu</th><th class="num">COGS</th><th class="num">Biên</th></tr></thead><tbody>' +
            r.products.slice(0, 10).map((p) => '<tr><td><div class="cell-title">' + esc(p.product.name) + '</div><div class="cell-sub mono">' + esc(p.product.code) + '</div></td><td class="num">' + NS.fmt.number(p.qty) + '</td><td class="num">' + NS.fmt.currency(p.revenue) + '</td><td class="num">' + NS.fmt.currency(p.cogs) + '</td><td class="num">' + NS.fmt.percent(p.revenue ? (p.revenue - p.cogs) / p.revenue * 100 : 0) + '</td></tr>').join("") + '</tbody></table></div>' : NS.ui.empty("Chưa có doanh thu", "Chọn khoảng thời gian khác.")) + '</div>' +
          '<div class="panel"><div class="panel-head"><div><h2>Tiêu hao nguyên liệu</h2><p>Theo BOM của các đơn trong kỳ.</p></div></div>' +
          (r.usage.length ? '<div class="table-wrap"><table class="data"><thead><tr><th>Nguyên liệu</th><th class="num">Tiêu hao</th><th class="num">Giá trị ước tính</th></tr></thead><tbody>' +
            r.usage.map((u) => '<tr><td><div class="cell-title">' + esc(u.ingredient.name) + '</div><div class="cell-sub mono">' + esc(u.ingredient.code) + '</div></td><td class="num">' + NS.fmt.qty(u.qty) + " " + esc(u.ingredient.baseUnit) + '</td><td class="num">' + NS.fmt.currency(u.qty * u.ingredient.unitCost) + '</td></tr>').join("") + '</tbody></table></div>' : NS.ui.empty("Chưa có tiêu hao", "Chưa có đơn hàng trong kỳ.")) + '</div></div>' +
          '<div class="grid-2 mt-24"><div class="panel"><div class="panel-head"><div><h2>Tỷ lệ hủy & hoàn tiền</h2><p>BR-47 · Tính trên đơn phát sinh trong kỳ.</p></div></div>' +
          '<div class="stat-line"><span>Đơn hủy</span><strong>' + r.cancelled + ' / ' + r.orders.length + ' đơn · ' + NS.fmt.percent(r.cancelRate) + '</strong></div>' +
          '<div class="stat-line"><span>Đơn có hoàn tiền</span><strong>' + r.refundOrders + ' / ' + r.completed.length + ' đơn đã thanh toán · ' + NS.fmt.percent(r.refundRate) + '</strong></div>' +
          '<div class="stat-line"><span>Tổng tiền hoàn</span><strong>' + NS.fmt.currency(r.refunds) + '</strong></div>' +
          '<div class="notice mt-12"><span class="notice__icon">i</span><div>Đơn hủy không tính doanh thu. Đơn hoàn một phần vẫn giữ phần doanh thu chưa hoàn.</div></div></div>' +
          '<div class="panel"><div class="panel-head"><div><h2>Thanh toán theo ca</h2><p>BR-47 · Doanh thu thuần theo ca quỹ trong kỳ.</p></div></div>' +
          (r.payByShift.length ? '<div class="table-wrap"><table class="data"><thead><tr><th>Ca</th><th class="num">Tiền mặt</th><th class="num">VietQR</th><th class="num">Tổng</th></tr></thead><tbody>' +
            r.payByShift.map((x) => '<tr><td><span class="mono">' + esc(x.shift.id) + '</span><div class="cell-sub">' + esc(NS.branchName(x.shift.branchId)) + ' · ' + x.count + ' đơn</div></td><td class="num">' + NS.fmt.currency(x.cash) + '</td><td class="num">' + NS.fmt.currency(x.qr) + '</td><td class="num strong">' + NS.fmt.currency(x.total) + '</td></tr>').join("") + '</tbody></table></div>' : NS.ui.empty("Chưa có ca quỹ", "Không có ca trong khoảng thời gian đã chọn.")) + '</div></div>' +
          '<div class="panel mt-24"><div class="panel-head"><div><h2>Nhân sự & chi phí lao động theo ca</h2><p>BR-47 · Chỉ tính ca đã check-out. Ca chưa check-out được đếm riêng, không tính giờ.</p></div><span class="tag tag-neutral">Tổng ' + NS.fmt.currency(r.hrLabor) + '</span></div>' +
          (r.hrRows.length ? '<div class="table-wrap"><table class="data"><thead><tr><th>Nhân viên</th><th class="num">Ngày công</th><th class="num">Tổng giờ</th><th class="num">Muộn (phút)</th><th class="num">Về sớm (phút)</th><th class="num">Vắng / chưa ra</th><th class="num">Lương/giờ</th><th class="num">Thành tiền</th></tr></thead><tbody>' +
            r.hrRows.map((x) => '<tr><td><div class="cell-title">' + esc(x.employee.name) + '</div><div class="cell-sub mono">' + esc(x.employee.code) + ' · ' + esc(x.employee.role) + '</div></td><td class="num">' + x.days + '</td><td class="num">' + NS.fmt.qty(x.hours) + '</td><td class="num">' + x.late + '</td><td class="num">' + x.early + '</td><td class="num">' + x.absent + ' / ' + x.open + '</td><td class="num">' + NS.fmt.currency(x.employee.hourlyRate) + '</td><td class="num strong">' + NS.fmt.currency(x.labor) + '</td></tr>').join("") + '</tbody></table></div>' : NS.ui.empty("Chưa có chấm công", "Không có bản ghi chấm công trong kỳ.")) + '</div>' +
          '<div class="panel mt-24"><div class="panel-head"><div><h2>Luân chuyển kho & hao hụt kiểm kê</h2><p>BR-47 · Phiếu kho trong kỳ. Hao hụt ở đây là chênh lệch kiểm kê (thực đếm − sổ sách), không phải hao hụt BR-52 vì prototype chưa có phiếu xuất kho ra quầy bar.</p></div></div>' +
          '<div class="table-wrap"><table class="data"><thead><tr><th>Loại phiếu</th><th class="num">Số phiếu</th><th class="num">Giá trị</th></tr></thead><tbody>' +
          r.stockByType.map((x) => '<tr><td>' + esc(x.type === "inbound" ? "Nhập kho" : x.type === "disposal" ? "Tiêu hủy" : "Kiểm kê") + '</td><td class="num">' + x.count + '</td><td class="num">' + NS.fmt.currency(x.total) + '</td></tr>').join("") + '</tbody></table></div>' +
          (r.stocktakeRows.length ? '<div class="table-wrap mt-16"><table class="data"><thead><tr><th>Nguyên liệu lệch kiểm kê</th><th class="num">Chênh lệch</th><th class="num">Giá trị tuyệt đối</th></tr></thead><tbody>' +
            r.stocktakeRows.map((x) => '<tr><td><div class="cell-title">' + esc(x.ingredient.name) + '</div><div class="cell-sub mono">' + esc(x.ingredient.code) + '</div></td><td class="num">' + (x.variance > 0 ? "+" : "") + NS.fmt.qty(x.variance) + " " + esc(x.ingredient.baseUnit) + '</td><td class="num">' + NS.fmt.currency(x.value) + '</td></tr>').join("") + '</tbody></table></div>' : '<div class="notice mt-12"><span class="notice__icon">i</span><div>Không có chênh lệch kiểm kê trong kỳ.</div></div>') + '</div>' +
          (isChain ? '<div class="panel mt-24"><div class="panel-head"><div><h2>So sánh chi nhánh</h2><p>Doanh thu, COGS và biên góp trong kỳ.</p></div></div><div class="table-wrap"><table class="data"><thead><tr><th>Chi nhánh</th><th>Quản lý</th><th class="num">Đơn</th><th class="num">Doanh thu</th><th class="num">COGS</th><th class="num">Lợi nhuận gộp</th><th class="num">Biên</th></tr></thead><tbody>' +
            r.branchRows.map((b) => '<tr><td><div class="cell-title">' + esc(b.branch.short) + '</div><div class="cell-sub mono">' + esc(b.branch.code) + '</div></td><td>' + esc(b.branch.manager) + '</td><td class="num">' + b.orders + '</td><td class="num">' + NS.fmt.currency(b.revenue) + '</td><td class="num">' + NS.fmt.currency(b.cogs) + '</td><td class="num strong">' + NS.fmt.currency(b.gross) + '</td><td class="num">' + NS.fmt.percent(b.margin) + '</td></tr>').join("") + '</tbody></table></div></div>' +
            '<div class="panel mt-24"><div class="panel-head"><div><h2>Tăng trưởng theo quý</h2><p>Dữ liệu lịch sử mô phỏng toàn chuỗi.</p></div></div><div class="table-wrap"><table class="data"><thead><tr><th>Quý</th><th class="num">Doanh thu</th><th class="num">Đơn</th><th class="num">Tăng trưởng</th></tr></thead><tbody>' +
            NS.data.growth.map((g) => '<tr><td>' + esc(g.period) + '</td><td class="num">' + NS.fmt.currency(g.revenue) + '</td><td class="num">' + NS.fmt.number(g.orders) + '</td><td class="num ' + (g.growth > 0 ? "up" : "") + '">' + (g.growth ? "+" + NS.fmt.percent(g.growth) : "—") + '</td></tr>').join("") + '</tbody></table></div></div>' : "") +
          '<div class="panel mt-24"><div class="panel-head"><div><h2>Đối soát ca quỹ</h2><p>' + r.shiftRows.length + ' ca trong kỳ · Chênh lệch = tiền kiểm thực tế − tiền lý thuyết.</p></div></div>' +
          (r.shiftRows.length ? '<div class="table-wrap"><table class="data"><thead><tr><th>Mã ca</th><th>Chi nhánh</th><th>Thu ngân</th><th>Mở / đóng</th><th class="num">Tiền mặt bán</th><th class="num">Hoàn tiền</th><th class="num">Thu / chi</th><th class="num">Lý thuyết</th><th class="num">Kiểm thực tế</th><th class="num">Chênh lệch</th><th>Trạng thái</th></tr></thead><tbody>' +
            r.shiftRows.map((x) => '<tr><td class="mono">' + esc(x.shift.id) + '</td><td>' + esc(NS.branchName(x.shift.branchId)) + '</td><td>' + esc(x.shift.cashierName) + '</td><td class="small">' + NS.fmt.timeShort(x.shift.openedAt) + " – " + (x.shift.closedAt ? NS.fmt.timeShort(x.shift.closedAt) : "đang mở") + '</td><td class="num">' + NS.fmt.currency(x.stats.cashSales) + '</td><td class="num">' + NS.fmt.currency(x.stats.refunds) + '</td><td class="num small">+' + NS.fmt.currency(x.stats.cashIn) + '<br>−' + NS.fmt.currency(x.stats.cashOut) + '</td><td class="num">' + NS.fmt.currency(x.stats.theoretical) + '</td><td class="num">' + (x.shift.countedCash != null ? NS.fmt.currency(x.stats.counted) : "—") + '</td><td class="num ' + (x.shift.countedCash != null && x.stats.variance !== 0 ? "text-accent" : "") + '">' + (x.shift.countedCash != null ? NS.fmt.currency(x.stats.variance) : "—") + '</td><td>' + NS.ui.statusTag(x.shift.status) + '</td></tr>').join("") + '</tbody></table></div>' : NS.ui.empty("Chưa có ca quỹ", "Không có ca trong khoảng thời gian đã chọn.")) + '</div>',
      });
    },
    actions: {
      "report-apply"(ctx) {
        const data = ctx.data;
        let range = String(data.get("range") || "7");
        let from = String(data.get("from") || "");
        let to = String(data.get("to") || "");
        if (range !== "custom") {
          from = "";
          to = "";
        } else if (!from || !to) { NS.toast("Chọn đủ từ ngày và đến ngày.", "error"); return; }
        if (from && to && from > to) { NS.toast("Từ ngày phải trước đến ngày.", "error"); return; }
        const params = ["tab=" + encodeURIComponent(String(data.get("tab") || "chain")), "range=" + range, "branch=" + encodeURIComponent(String(data.get("branch") || "all"))];
        if (from) params.push("from=" + from);
        if (to) params.push("to=" + to);
        NS.navigate("/reports?" + params.join("&"));
      },
      "report-export"(ctx) {
        const r = buildReport(ctx);
        const headers = ["Mã đơn", "Thời gian", "Chi nhánh", "Thu ngân", "Kênh", "Trạng thái", "Thanh toán", "Tạm tính", "Giảm giá", "Tổng", "Hoàn tiền", "Doanh thu thuần", "COGS"];
        const rows = r.orders.map((o) => [o.code, NS.fmt.datetime(o.createdAt), NS.branchName(o.branchId), o.cashierName, o.orderType === "takeaway" ? "Mang đi" : "Tại quán", o.status, o.payment.method === "cash" ? "Tiền mặt" : "VietQR", o.subtotal, o.discount, o.total, NS.calc.orderRefunded(o), NS.calc.orderNet(o), NS.calc.orderCogs(o)]);
        NS.exportExcel("bao-cao-" + r.range.from + "-" + r.range.to + ".xls", headers, rows);
      },
      "report-print"() { NS.printPage(); },
    },
  });
  NS.route("/reports", "reports");
})();
