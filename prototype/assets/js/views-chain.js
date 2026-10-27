/* SCMS prototype — chain dashboard, menu/BOM, promotions, branches, sync */
(function () {
  const NS = window.SCMS;
  const esc = NS.esc;

  function localNow() {
    return NS.today() + "T" + NS.fmt.clock();
  }

  function todayOrdersAll() {
    return NS.data.orders.filter((o) => (o.createdAt || "").slice(0, 10) === NS.today());
  }

  function branchMetrics(branch, orders) {
    const revenue = orders.reduce((s, o) => s + NS.calc.orderNet(o), 0);
    const cogs = orders.reduce((s, o) => s + NS.calc.orderCogs(o), 0);
    return { revenue, cogs, gross: revenue - cogs, margin: revenue > 0 ? (revenue - cogs) / revenue * 100 : 0 };
  }

  NS.view("chainDashboard", {
    roles: NS.roles.chain,
    render() {
      const orders = todayOrdersAll();
      const revenue = orders.reduce((s, o) => s + NS.calc.orderNet(o), 0);
      const active = NS.data.branches.filter((b) => b.status === "open").length;
      const productCount = {};
      orders.filter((o) => o.payment.status === "completed").forEach((o) => o.items.forEach((i) => {
        productCount[i.productId] = (productCount[i.productId] || 0) + i.qty;
      }));
      const topId = Object.keys(productCount).sort((a, b) => productCount[b] - productCount[a])[0];
      const topProduct = topId ? NS.get.product(topId) : null;
      const hours = Array(24).fill(0);
      orders.forEach((o) => { const h = Number((o.createdAt || "").slice(11, 13)); if (!isNaN(h)) hours[h] += 1; });
      const peakHour = hours.indexOf(Math.max.apply(null, hours));
      const branchRows = NS.data.branches.map((b) => {
        const list = orders.filter((o) => o.branchId === b.id);
        const m = branchMetrics(b, list);
        const lastShift = NS.data.shifts.filter((s) => s.branchId === b.id && s.status === "closed" && s.countedCash != null).sort((a, c) => (a.closedAt < c.closedAt ? 1 : -1))[0];
        return { b, orders: list, m, variance: lastShift ? lastShift.countedCash - lastShift.theoreticalCash : 0 };
      });
      const topRows = Object.keys(productCount).map((id) => ({ product: NS.get.product(id), qty: productCount[id] })).filter((x) => x.product).sort((a, b) => b.qty - a.qty).slice(0, 7);
      const cancelled = orders.filter((o) => o.status === "cancelled").length;
      const lowCount = NS.data.branches.reduce((s, b) => s + NS.calc.lowStock(b.id).filter((x) => x.status !== "watch").length, 0);
      return NS.ui.shell({
        nav: "chain", active: "chain", code: "SCR-10", title: "Chain Dashboard",
        subtitle: "Bức tranh điều hành toàn chuỗi · " + NS.fmt.date(NS.today()) + " · " + NS.data.branches.length + " chi nhánh",
        actions: '<a class="btn" href="#/reports">Báo cáo hợp nhất</a><a class="btn btn-primary" href="#/chain/sync">Đồng bộ chuỗi</a>',
        content: '<div class="kpi-strip"><div class="kpi"><div class="kpi__label">Tổng doanh thu hôm nay</div><strong>' + NS.fmt.currency(revenue) + '</strong><small class="up">' + orders.length + ' đơn toàn chuỗi</small></div>' +
          '<div class="kpi"><div class="kpi__label">Chi nhánh hoạt động</div><strong>' + active + " / " + NS.data.branches.length + '</strong><small>' + (NS.data.branches.length - active) + ' chi nhánh bảo trì / đóng</small></div>' +
          '<div class="kpi"><div class="kpi__label">Món bán chạy nhất</div><strong style="font-size:17px">' + esc(topProduct ? topProduct.name : "—") + '</strong><small>' + (topProduct ? NS.fmt.number(productCount[topId]) + ' phần hôm nay' : "Chưa có dữ liệu") + '</small></div>' +
          '<div class="kpi"><div class="kpi__label">Khung giờ cao điểm</div><strong>' + String(peakHour).padStart(2, "0") + ":00</strong><small>" + hours[peakHour] + " đơn trong giờ</small></div></div>" +
          '<div class="split"><div class="stack">' +
          '<div class="panel panel--flush"><div class="panel-head" style="padding:14px 16px 0"><div><h2>Hiệu suất chi nhánh</h2><p>Doanh thu thuần, COGS và biên lợi nhuận gộp hôm nay.</p></div></div>' +
          '<div class="table-wrap" style="border:0"><table class="data"><thead><tr><th>Chi nhánh</th><th>Quản lý</th><th class="num">Doanh thu</th><th class="num">COGS</th><th class="num">Lợi nhuận gộp</th><th class="num">Biên</th><th class="num">Lệch quỹ</th><th>Trạng thái</th></tr></thead><tbody>' +
          branchRows.map((r) => '<tr><td><div class="cell-title">' + esc(r.b.short) + '</div><div class="cell-sub mono">' + esc(r.b.code) + '</div></td><td>' + esc(r.b.manager) + '</td><td class="num">' + NS.fmt.currency(r.m.revenue) + '</td><td class="num">' + NS.fmt.currency(r.m.cogs) + '</td><td class="num strong">' + NS.fmt.currency(r.m.gross) + '</td><td class="num">' + r.m.margin.toFixed(1).replace(".", ",") + '%</td><td class="num ' + (r.variance === 0 ? "" : "text-accent") + '">' + NS.fmt.currency(r.variance) + '</td><td>' + NS.ui.statusTag(r.b.status) + '</td></tr>').join("") +
          '</tbody></table></div></div>' +
          '<div class="grid-2"><div class="chart"><div class="chart-head"><div><h3>Doanh thu theo chi nhánh</h3><p>So sánh tương đối hôm nay</p></div></div>' +
          NS.ui.hbars(branchRows.map((r) => ({ label: r.b.short, value: r.m.revenue, display: NS.fmt.currency(r.m.revenue) }))) + '</div>' +
          '<div class="panel"><div class="panel-head"><div><h2>Top món toàn chuỗi</h2><p>Theo số phần bán ra hôm nay.</p></div></div>' +
          (topRows.length ? '<div class="list-plain">' + topRows.map((x, i) => '<div class="list-item"><div><span class="muted mono">' + String(i + 1).padStart(2, "0") + '</span> <strong>' + esc(x.product.name) + '</strong><div class="cell-sub">' + esc(x.product.category + " · " + x.product.code) + '</div></div><strong>' + NS.fmt.number(x.qty) + '</strong></div>').join("") + '</div>' : NS.ui.empty("Chưa có dữ liệu", "Chưa phát sinh đơn hôm nay.")) + '</div></div>' +
          '</div><aside class="sticky-side"><div class="stack">' +
          '<div class="panel"><div class="panel-head"><div><h2>Bất thường cần chú ý</h2><p>Tín hiệu vận hành toàn chuỗi.</p></div></div>' +
          '<div class="stat-line"><span>Đơn hủy hôm nay</span><strong>' + cancelled + '</strong></div><div class="stat-line"><span>Nguyên liệu dưới ngưỡng</span><strong>' + lowCount + '</strong></div><div class="stat-line"><span>Yêu cầu chờ duyệt</span><strong>' + NS.calc.pendingApprovals() + '</strong></div><div class="stat-line"><span>Chi nhánh mất kết nối</span><strong>' + NS.data.branches.filter((b) => b.posStatus === "offline").length + '</strong></div></div>' +
          '<div class="panel"><div class="panel-head"><div><h2>Điều hướng</h2><p>Quản trị chuỗi</p></div></div><div class="flex flex-col gap-8">' +
          '<a class="btn btn-block" href="#/chain/menu">Menu & BOM</a><a class="btn btn-block" href="#/chain/promotions">Khuyến mãi</a><a class="btn btn-block" href="#/chain/branches">Chi nhánh & Manager</a><a class="btn btn-block" href="#/settings">Cấu hình & phân quyền</a></div></div>' +
          '</div></aside></div>',
      });
    },
  });
  NS.route("/chain", "chainDashboard");

  NS.view("menu", {
    roles: NS.roles.chain,
    render(ctx) {
      const tab = ctx.query.tab || "products";
      return NS.ui.shell({
        nav: "chain", active: "menu", code: "SCR-11", title: "Menu & BOM",
        subtitle: "Quản trị danh mục, giá bán và công thức chuẩn toàn chuỗi.",
        actions: tab === "products" ? '<a class="btn btn-primary" href="#/chain/menu/edit">Thêm sản phẩm</a>' : '<a class="btn" href="#/chain/menu?tab=products">Về danh mục</a>',
        content: '<div class="tabs"><a class="tab ' + (tab === "products" ? "active" : "") + '" href="#/chain/menu?tab=products">TAB-05 · Sản phẩm & giá</a><a class="tab ' + (tab === "bom" ? "active" : "") + '" href="#/chain/menu?tab=bom">TAB-06 · Recipe BOM</a></div>' +
          (tab === "bom" ? renderBomTab(ctx) : renderProductTab()),
      });
    },
  });
  NS.route("/chain/menu", "menu");

  function renderProductTab() {
    const products = NS.data.products;
    return '<div class="table-wrap"><table class="data"><thead><tr><th>Mã / món</th><th>Danh mục</th><th class="num">Giá S</th><th class="num">Giá M</th><th class="num">Giá L</th><th>Topping</th><th>Chi nhánh tạm ngưng</th><th>Trạng thái</th><th class="text-right">Thao tác</th></tr></thead><tbody>' +
      products.map((p) => '<tr class="' + (p.status !== "active" ? "is-muted" : "") + '"><td><div class="cell-title">' + esc(p.name) + '</div><div class="cell-sub mono">' + esc(p.code) + '</div></td><td>' + esc(p.category) + '</td><td class="num">' + NS.fmt.currency(p.prices.S) + '</td><td class="num">' + NS.fmt.currency(p.prices.M) + '</td><td class="num">' + NS.fmt.currency(p.prices.L) + '</td><td class="small">' + esc((p.toppings || []).map((id) => (NS.get.topping(id) || {}).name).filter(Boolean).join(", ") || "—") + '</td><td class="small">' + esc((p.pausedBranches || []).map((id) => NS.branchName(id)).join(", ") || "—") + '</td><td>' + NS.ui.statusTag(p.status) + '</td><td><div class="actions"><a class="btn btn-sm" href="#/chain/menu/edit?id=' + encodeURIComponent(p.id) + '">Sửa</a><a class="btn btn-sm btn-ghost" href="#/chain/menu/' + encodeURIComponent(p.id) + '/bom?size=M">BOM</a></div></td></tr>').join("") +
      '</tbody></table></div>';
  }

  function renderBomTab(ctx) {
    const products = NS.data.products.filter((p) => Object.keys(NS.data.bom[p.id] || {}).length);
    const productId = ctx.query.product || (products[0] ? products[0].id : "");
    const product = NS.get.product(productId) || products[0];
    const size = ctx.query.size || "M";
    if (!product) return NS.ui.empty("Chưa có BOM", "Thêm sản phẩm trước khi cấu hình công thức.");
    const lines = NS.calc.bomLines(product.id, size);
    const cost = lines.reduce((s, l) => s + l.cost, 0);
    const price = product.prices[size];
    const margin = price > 0 ? (price - cost) / price * 100 : 0;
    return '<div class="report-filters"><div class="field grow"><label>Sản phẩm</label><select class="select" data-change="bom-product">' +
      NS.data.products.map((p) => '<option value="' + p.id + '"' + (p.id === product.id ? " selected" : "") + '>' + esc(p.name + " · " + p.code) + '</option>').join("") + '</select></div>' +
      '<div class="field"><label>Size</label><select class="select" data-change="bom-size">' + ["S", "M", "L"].map((s) => '<option value="' + s + '"' + (s === size ? " selected" : "") + '>Size ' + s + '</option>').join("") + '</select></div>' +
      '<div class="field"><label>&nbsp;</label><a class="btn btn-primary" href="#/chain/menu/' + product.id + '/bom/edit?size=' + size + '">Sửa công thức</a></div></div>' +
      '<div class="grid-2"><div class="panel"><div class="panel-head"><div><h2>BOM · ' + esc(product.name) + " · " + size + '</h2><p>Định lượng chuẩn cho một phần bán ra.</p></div>' + NS.ui.statusTag("active", "Chuẩn") + '</div>' +
      (lines.length ? '<div class="table-wrap"><table class="data"><thead><tr><th>Nguyên liệu</th><th>Đơn vị</th><th class="num">Định lượng</th><th class="num">Đơn giá</th><th class="num">Chi phí</th><th class="num">Tỷ trọng</th></tr></thead><tbody>' +
        lines.map((l) => '<tr><td><div class="cell-title">' + esc(l.ingredient.name) + '</div><div class="cell-sub mono">' + esc(l.ingredient.code) + '</div></td><td>' + esc(l.unit) + '</td><td class="num">' + NS.fmt.qty(l.qty) + '</td><td class="num">' + NS.fmt.currency(l.ingredient.unitCost) + '</td><td class="num">' + NS.fmt.currency(l.cost) + '</td><td class="num">' + (cost ? (l.cost / cost * 100).toFixed(1).replace(".", ",") + "%" : "—") + '</td></tr>').join("") + '</tbody></table></div>' : NS.ui.empty("Chưa có công thức", "Cấu hình nguyên liệu cho size này.")) + '</div>' +
      '<aside class="sticky-side"><div class="panel"><div class="panel-head"><div><h2>Hiệu quả món</h2><p>Giá bán và biên góp lý thuyết.</p></div></div>' +
      '<div class="stat-line"><span>Giá bán</span><strong>' + NS.fmt.currency(price) + '</strong></div><div class="stat-line"><span>COGS lý thuyết</span><strong>' + NS.fmt.currency(cost) + '</strong></div><div class="stat-line"><span>Lợi nhuận gộp</span><strong>' + NS.fmt.currency(price - cost) + '</strong></div><div class="stat-line"><span>Biên góp</span><strong>' + NS.fmt.percent(margin) + '</strong></div>' +
      '<div class="notice mt-12"><span class="notice__icon">i</span><div>BOM là dữ liệu chuẩn để tính COGS và tiêu hao lý thuyết, không thay thế kiểm kê thực tế.</div></div></div></aside></div>';
  }

  NS.view("menuEdit", {
    roles: NS.roles.chain,
    render(ctx) {
      const p = ctx.query.id ? NS.get.product(ctx.query.id) : null;
      if (ctx.query.id && !p) return NS.ui.task({ code: "TAB-05", title: "Không tìm thấy sản phẩm", back: "#/chain/menu", content: NS.ui.empty("Sản phẩm không tồn tại", "Quay lại menu.") });
      const product = p || { id: "", code: "", name: "", category: NS.data.categories[0], description: "", status: "active", prices: { S: 0, M: 0, L: 0 }, toppings: [], pausedBranches: [] };
      return NS.ui.task({
        code: "TAB-05", title: p ? "Sửa sản phẩm · " + p.name : "Thêm sản phẩm", subtitle: "Thông tin menu, giá bán theo size và phạm vi tạm ngưng.",
        back: "#/chain/menu", meta: p ? NS.ui.statusTag(product.status) : '<span class="tag tag-pending">Sản phẩm mới</span>',
        content: '<form data-action="product-save"><div class="panel"><div class="panel-head"><div><h2>Thông tin sản phẩm</h2><p>Mã món dùng để đối soát với POS và BOM.</p></div></div><div class="form-grid">' +
          '<div class="field"><label>Tên món <span class="req">*</span></label><input class="input" name="name" value="' + esc(product.name) + '" required></div>' +
          '<div class="field"><label>Mã món <span class="req">*</span></label><input class="input" name="code" value="' + esc(product.code) + '" placeholder="Ví dụ: CF09" required></div>' +
          '<div class="field"><label>Danh mục <span class="req">*</span></label><select class="select" name="category">' + NS.data.categories.map((c) => '<option value="' + esc(c) + '"' + (product.category === c ? " selected" : "") + '>' + esc(c) + '</option>').join("") + '</select></div>' +
          '<div class="field"><label>Trạng thái</label><select class="select" name="status"><option value="active"' + (product.status === "active" ? " selected" : "") + '>Đang bán</option><option value="inactive"' + (product.status === "inactive" ? " selected" : "") + '>Tạm ngưng toàn chuỗi</option></select></div>' +
          '<div class="field"><label>Giá size S</label><input class="input" name="priceS" inputmode="numeric" value="' + product.prices.S + '"></div>' +
          '<div class="field"><label>Giá size M</label><input class="input" name="priceM" inputmode="numeric" value="' + product.prices.M + '"></div>' +
          '<div class="field"><label>Giá size L</label><input class="input" name="priceL" inputmode="numeric" value="' + product.prices.L + '"></div>' +
          '<div class="field"><label>Ảnh placeholder</label><div class="item-summary__image" style="height:64px;font-size:18px">' + esc(product.name.slice(0, 2).toUpperCase() || "SC") + '</div><div class="hint">Ảnh minh họa dạng chữ trong prototype.</div></div>' +
          '<div class="field span-all"><label>Mô tả</label><textarea class="textarea" name="description">' + esc(product.description) + '</textarea></div></div></div>' +
          '<div class="panel mt-16"><div class="panel-head"><div><h2>Phạm vi áp dụng</h2><p>Topping và chi nhánh tạm ngưng.</p></div></div><div class="form-grid">' +
          '<div class="field"><label>Topping áp dụng</label><div class="check-row">' + NS.data.toppings.map((t) => '<label class="check"><input type="checkbox" name="toppings" value="' + t.id + '"' + ((product.toppings || []).indexOf(t.id) >= 0 ? " checked" : "") + '> ' + esc(t.name) + '</label>').join("") + '</div></div>' +
          '<div class="field"><label>Chi nhánh tạm ngưng</label><div class="check-row">' + NS.data.branches.map((b) => '<label class="check"><input type="checkbox" name="paused" value="' + b.id + '"' + ((product.pausedBranches || []).indexOf(b.id) >= 0 ? " checked" : "") + '> ' + esc(b.short) + '</label>').join("") + '</div></div></div>' +
          '<div class="form-actions"><a class="btn" href="#/chain/menu">Hủy</a><button class="btn btn-primary" type="submit">Lưu sản phẩm</button></div></div></form>',
      });
    },
    actions: {
      "product-save"(ctx) {
        const data = ctx.data;
        const id = ctx.query.id || "";
        const name = String(data.get("name") || "").trim();
        const code = String(data.get("code") || "").trim().toUpperCase();
        const prices = { S: Number(data.get("priceS") || 0), M: Number(data.get("priceM") || 0), L: Number(data.get("priceL") || 0) };
        if (!name || !code) { NS.toast("Tên và mã món là bắt buộc.", "error"); return; }
        if (NS.data.products.some((p) => p.code === code && p.id !== id)) { NS.toast("Mã món đã tồn tại.", "error"); return; }
        if (prices.S <= 0 || prices.M <= 0 || prices.L <= 0) { NS.toast("Giá bán phải lớn hơn 0.", "error"); return; }
        let product = id ? NS.get.product(id) : null;
        const before = product ? JSON.parse(JSON.stringify(product)) : null;
        if (!product) {
          product = { id: "P" + String(Date.now()).slice(-5), createdAt: localNow(), pausedBranches: [], toppings: [] };
          NS.data.products.push(product);
        }
        Object.assign(product, {
          name, code, category: String(data.get("category")), description: String(data.get("description") || "").trim(),
          status: String(data.get("status")), prices,
          toppings: data.getAll("toppings"), pausedBranches: data.getAll("paused"),
        });
        NS.addAudit(id ? "Sửa sản phẩm" : "Thêm sản phẩm", "Sản phẩm", before, { name, code, prices });
        NS.saveData();
        NS.toast("Đã lưu sản phẩm " + name + ".");
        NS.navigate("/chain/menu");
      },
    },
  });
  NS.route("/chain/menu/edit", "menuEdit");

  NS.view("bomView", {
    roles: NS.roles.chain,
    render(ctx) {
      const product = NS.get.product(ctx.params.id);
      if (!product) return NS.ui.shell({ nav: "chain", active: "menu", title: "Không tìm thấy món", content: NS.ui.empty("Món không tồn tại", "Quay lại menu.") });
      const size = ctx.query.size || "M";
      const lines = NS.calc.bomLines(product.id, size);
      const cost = lines.reduce((s, l) => s + l.cost, 0);
      return NS.ui.shell({
        nav: "chain", active: "menu", code: "TAB-06", title: "BOM · " + product.name, subtitle: "Công thức chuẩn size " + size + " · " + product.code,
        actions: '<a class="btn" href="#/chain/menu?tab=bom&product=' + product.id + '&size=' + size + '">So sánh</a><a class="btn btn-primary" href="#/chain/menu/' + product.id + '/bom/edit?size=' + size + '">Sửa công thức</a>',
        content: '<div class="kpi-strip"><div class="kpi"><div class="kpi__label">Giá bán</div><strong>' + NS.fmt.currency(product.prices[size]) + '</strong></div><div class="kpi"><div class="kpi__label">COGS lý thuyết</div><strong>' + NS.fmt.currency(cost) + '</strong></div><div class="kpi"><div class="kpi__label">Lợi nhuận gộp</div><strong>' + NS.fmt.currency(product.prices[size] - cost) + '</strong></div><div class="kpi"><div class="kpi__label">Biên góp</div><strong>' + NS.fmt.percent(product.prices[size] ? (product.prices[size] - cost) / product.prices[size] * 100 : 0) + '</strong></div></div>' +
          (lines.length ? '<div class="table-wrap"><table class="data"><thead><tr><th>Nguyên liệu</th><th>Đơn vị</th><th class="num">Định lượng</th><th class="num">Đơn giá</th><th class="num">Chi phí</th><th>Nhà cung cấp</th></tr></thead><tbody>' +
            lines.map((l) => '<tr><td><div class="cell-title">' + esc(l.ingredient.name) + '</div><div class="cell-sub mono">' + esc(l.ingredient.code) + '</div></td><td>' + esc(l.unit) + '</td><td class="num">' + NS.fmt.qty(l.qty) + '</td><td class="num">' + NS.fmt.currency(l.ingredient.unitCost) + '</td><td class="num">' + NS.fmt.currency(l.cost) + '</td><td>' + esc(l.ingredient.supplier) + '</td></tr>').join("") + '</tbody></table></div>' : NS.ui.empty("Chưa có công thức", "Cấu hình BOM cho món và size này.")),
      });
    },
  });
  NS.route("/chain/menu/:id/bom", "bomView");

  NS.view("bomEdit", {
    roles: NS.roles.chain,
    render(ctx) {
      const product = NS.get.product(ctx.params.id);
      if (!product) return NS.ui.task({ code: "TAB-06", title: "Không tìm thấy món", back: "#/chain/menu", content: NS.ui.empty("Món không tồn tại", "Quay lại menu.") });
      const size = ctx.query.size || "M";
      const key = product.id + "|" + size;
      if (!NS.state.bomDraft || NS.state.bomInit !== key) {
        NS.state.bomDraft = { lines: NS.calc.bomLines(product.id, size).map((l) => ({ ingredientId: l.ingredient.id, qty: l.qty })) };
        NS.state.bomInit = key;
      }
      const draft = NS.state.bomDraft;
      const cost = draft.lines.reduce((s, l) => { const ing = NS.get.ingredient(l.ingredientId); return s + (ing ? ing.unitCost * Number(l.qty || 0) : 0); }, 0);
      return NS.ui.task({
        code: "TAB-06", title: "Sửa BOM · " + product.name + " · " + size,
        subtitle: "Thêm, xóa nguyên liệu và nhập định lượng cho một phần bán ra.",
        back: "#/chain/menu/" + product.id + "/bom?size=" + size,
        meta: '<span class="tag tag-neutral">COGS ' + NS.fmt.currency(cost) + '</span>',
        content: '<div class="table-wrap"><table class="data stock-row-table"><thead><tr><th>Nguyên liệu</th><th>Đơn vị</th><th class="num">Định lượng</th><th class="num">Đơn giá</th><th class="num">Chi phí</th><th></th></tr></thead><tbody>' +
          draft.lines.map((line, idx) => {
            const ing = NS.get.ingredient(line.ingredientId);
            return '<tr><td><select class="select" data-change="bom-line-ingredient" data-index="' + idx + '"><option value="">Chọn nguyên liệu…</option>' + NS.data.ingredients.map((x) => '<option value="' + x.id + '"' + (line.ingredientId === x.id ? " selected" : "") + '>' + esc(x.name + " · " + x.code) + '</option>').join("") + '</select></td><td>' + esc(ing ? ing.baseUnit : "—") + '</td><td><input class="input num" data-bom-qty="' + idx + '" inputmode="decimal" value="' + esc(line.qty) + '"></td><td class="num">' + NS.fmt.currency(ing ? ing.unitCost : 0) + '</td><td class="num">' + NS.fmt.currency(ing ? ing.unitCost * Number(line.qty || 0) : 0) + '</td><td><button class="row-remove" data-action="bom-remove" data-index="' + idx + '">−</button></td></tr>';
          }).join("") + '</tbody></table></div>' +
          '<div class="flex justify-between items-center mt-12"><button class="btn btn-sm" data-action="bom-add">' + NS.ui.icon("plus") + ' Thêm nguyên liệu</button><div class="stock-total"><span>COGS lý thuyết</span><strong>' + NS.fmt.currency(cost) + '</strong></div></div>' +
          '<div class="notice notice--warn mt-16"><span class="notice__icon">!</span><div>Định lượng phải lớn hơn 0 và dùng đơn vị cơ sở. Nguyên liệu trùng sẽ bị gộp khi lưu.</div></div>',
        footer: '<span class="task-footer__note">Giá bán size ' + size + ': <strong>' + NS.fmt.currency(product.prices[size]) + '</strong></span><div class="flex gap-8"><a class="btn" href="#/chain/menu/' + product.id + '/bom?size=' + size + '">Hủy</a><button class="btn btn-primary" data-action="bom-save">Lưu công thức</button></div>',
      });
    },
    actions: {
      "bom-add"() { NS.state.bomDraft.lines.push({ ingredientId: "", qty: 0 }); NS.refresh(); },
      "bom-remove"(ctx) {
        const idx = Number(ctx.el.getAttribute("data-index"));
        if (NS.state.bomDraft.lines.length <= 1) { NS.toast("Công thức cần ít nhất một dòng.", "warn"); return; }
        NS.state.bomDraft.lines.splice(idx, 1);
        NS.refresh();
      },
      "bom-line-ingredient"(ctx) {
        const idx = Number(ctx.el.getAttribute("data-index"));
        if (NS.state.bomDraft.lines[idx]) { NS.state.bomDraft.lines[idx].ingredientId = ctx.value; NS.refresh(); }
      },
      "bom-save"() {
        const product = NS.get.product((NS.currentCtx || {}).params.id);
        const size = (NS.currentCtx || {}).query.size || "M";
        if (!product) return;
        const lines = [];
        document.querySelectorAll("[data-bom-qty]").forEach((input) => {
          const idx = Number(input.getAttribute("data-bom-qty"));
          const line = NS.state.bomDraft.lines[idx];
          if (!line || !line.ingredientId) return;
          const qty = Number(input.value || 0);
          if (qty <= 0) return;
          const existing = lines.find((l) => l[0] === line.ingredientId);
          if (existing) existing[1] += qty;
          else lines.push([line.ingredientId, qty]);
        });
        if (!lines.length) { NS.toast("Công thức cần ít nhất một nguyên liệu hợp lệ.", "error"); return; }
        NS.data.bom[product.id] = NS.data.bom[product.id] || {};
        NS.data.bom[product.id][size] = lines;
        NS.addAudit("Sửa BOM", "Recipe", null, { product: product.name, size, lines });
        NS.saveData();
        NS.state.bomDraft = null;
        NS.state.bomInit = null;
        NS.toast("Đã lưu công thức " + product.name + " size " + size + ".");
        NS.navigate("/chain/menu/" + product.id + "/bom?size=" + size);
      },
    },
  });
  NS.route("/chain/menu/:id/bom/edit", "bomEdit");

  NS.view("promotions", {
    roles: NS.roles.chain,
    render() {
      const list = NS.data.vouchers;
      return NS.ui.shell({
        nav: "chain", active: "promotions", code: "SCR-12", title: "Khuyến mãi & Voucher",
        subtitle: "Quản lý chương trình giảm giá, điều kiện áp dụng và giới hạn lượt dùng.",
        actions: '<a class="btn btn-primary" href="#/chain/promotions/edit">Thêm voucher</a>',
        content: '<div class="table-wrap"><table class="data"><thead><tr><th>Mã</th><th>Loại giảm</th><th class="num">Giá trị</th><th class="num">Đơn tối thiểu</th><th>Đã dùng / giới hạn</th><th>Hiệu lực</th><th>Phạm vi</th><th>Trạng thái</th><th class="text-right">Thao tác</th></tr></thead><tbody>' +
          list.map((v) => '<tr><td><div class="cell-title mono">' + esc(v.code) + '</div><div class="cell-sub">' + esc(v.description) + '</div></td><td>' + (v.type === "percent" ? "Phần trăm" : "Số tiền") + '</td><td class="num">' + (v.type === "percent" ? v.value + "%" : NS.fmt.currency(v.value)) + '</td><td class="num">' + NS.fmt.currency(v.minOrder) + '</td><td><strong>' + v.used + '</strong> / ' + v.usageLimit + '<div class="cell-sub">' + Math.round(v.used / v.usageLimit * 100) + '% đã dùng</div></td><td><span class="small">' + NS.fmt.date(v.start) + ' – ' + NS.fmt.date(v.end) + '</span><div class="cell-sub">' + esc(v.happyHour || "Cả ngày") + '</div></td><td class="small">' + esc(v.branches[0] === "all" ? "Toàn chuỗi" : v.branches.map((id) => NS.branchName(id)).join(", ")) + '</td><td>' + NS.ui.statusTag(v.status) + '</td><td class="text-right"><a class="btn btn-sm" href="#/chain/promotions/edit?id=' + encodeURIComponent(v.id) + '">Sửa</a></td></tr>').join("") +
          '</tbody></table></div>',
      });
    },
  });
  NS.route("/chain/promotions", "promotions");

  NS.view("promotionEdit", {
    roles: NS.roles.chain,
    render(ctx) {
      const v = ctx.query.id ? NS.data.vouchers.find((x) => x.id === ctx.query.id) : null;
      if (ctx.query.id && !v) return NS.ui.task({ code: "SCR-12", title: "Không tìm thấy voucher", back: "#/chain/promotions", content: NS.ui.empty("Voucher không tồn tại", "Quay lại danh sách.") });
      const voucher = v || { code: "", type: "percent", value: 10, minOrder: 0, start: NS.today(), end: NS.addDays(NS.today(), 30), usageLimit: 100, used: 0, status: "active", branches: ["all"], happyHour: "", description: "" };
      return NS.ui.task({
        code: "SCR-12", title: v ? "Sửa voucher · " + v.code : "Thêm voucher", subtitle: "Điều kiện áp dụng, thời gian hiệu lực và phạm vi chi nhánh.",
        back: "#/chain/promotions", meta: v ? NS.ui.statusTag(voucher.status) : '<span class="tag tag-pending">Voucher mới</span>',
        content: '<form data-action="promotion-save"><div class="panel"><div class="panel-head"><div><h2>Thông tin voucher</h2><p>Mã được chuẩn hóa tự động sang chữ hoa.</p></div></div><div class="form-grid">' +
          '<div class="field"><label>Mã voucher <span class="req">*</span></label><input class="input" name="code" value="' + esc(voucher.code) + '" maxlength="20" required></div>' +
          '<div class="field"><label>Loại giảm</label><select class="select" name="type"><option value="percent"' + (voucher.type === "percent" ? " selected" : "") + '>Phần trăm</option><option value="fixed"' + (voucher.type === "fixed" ? " selected" : "") + '>Số tiền</option></select></div>' +
          '<div class="field"><label>Giá trị <span class="req">*</span></label><input class="input" name="value" inputmode="numeric" value="' + voucher.value + '" required></div>' +
          '<div class="field"><label>Đơn tối thiểu</label><input class="input" name="minOrder" inputmode="numeric" value="' + voucher.minOrder + '"></div>' +
          '<div class="field"><label>Bắt đầu</label><input class="input" type="date" name="start" value="' + esc(voucher.start) + '"></div>' +
          '<div class="field"><label>Kết thúc</label><input class="input" type="date" name="end" value="' + esc(voucher.end) + '"></div>' +
          '<div class="field"><label>Giới hạn lượt dùng</label><input class="input" name="usageLimit" inputmode="numeric" value="' + voucher.usageLimit + '"><div class="hint">Đã dùng: ' + voucher.used + ' lượt.</div></div>' +
          '<div class="field"><label>Happy hour</label><input class="input" name="happyHour" value="' + esc(voucher.happyHour) + '" placeholder="Ví dụ: 14:00-17:00"></div>' +
          '<div class="field"><label>Trạng thái</label><select class="select" name="status"><option value="active"' + (voucher.status === "active" ? " selected" : "") + '>Đang chạy</option><option value="paused"' + (voucher.status === "paused" ? " selected" : "") + '>Tạm dừng</option><option value="expired"' + (voucher.status === "expired" ? " selected" : "") + '>Hết hạn</option></select></div>' +
          '<div class="field"><label>Mô tả</label><input class="input" name="description" value="' + esc(voucher.description) + '"></div>' +
          '<div class="field span-all"><label>Phạm vi chi nhánh</label><div class="check-row"><label class="check"><input type="checkbox" name="branches" value="all"' + (voucher.branches.indexOf("all") >= 0 ? " checked" : "") + '> Toàn chuỗi</label>' + NS.data.branches.map((b) => '<label class="check"><input type="checkbox" name="branches" value="' + b.id + '"' + (voucher.branches.indexOf(b.id) >= 0 ? " checked" : "") + '> ' + esc(b.short) + '</label>').join("") + '</div></div></div>' +
          '<div class="form-actions"><a class="btn" href="#/chain/promotions">Hủy</a><button class="btn btn-primary" type="submit">Lưu voucher</button></div></div></form>',
      });
    },
    actions: {
      "promotion-save"(ctx) {
        const data = ctx.data;
        const id = ctx.query.id || "";
        const code = String(data.get("code") || "").trim().toUpperCase();
        const type = String(data.get("type"));
        const value = Number(data.get("value") || 0);
        const usageLimit = Number(data.get("usageLimit") || 0);
        let branches = data.getAll("branches");
        if (!code) { NS.toast("Mã voucher là bắt buộc.", "error"); return; }
        if (value <= 0 || (type === "percent" && value > 100)) { NS.toast("Giá trị giảm không hợp lệ.", "error"); return; }
        if (NS.data.vouchers.some((v) => v.code === code && v.id !== id)) { NS.toast("Mã voucher đã tồn tại.", "error"); return; }
        if (branches.indexOf("all") >= 0) branches = ["all"];
        if (!branches.length) { NS.toast("Chọn ít nhất một chi nhánh áp dụng.", "error"); return; }
        let voucher = id ? NS.data.vouchers.find((v) => v.id === id) : null;
        if (!voucher) {
          voucher = { id: "V" + String(Date.now()).slice(-4), used: 0 };
          NS.data.vouchers.push(voucher);
        }
        if (usageLimit < voucher.used) { NS.toast("Giới hạn lượt dùng không được nhỏ hơn số đã dùng.", "error"); return; }
        Object.assign(voucher, {
          code, type, value, minOrder: Number(data.get("minOrder") || 0),
          start: String(data.get("start") || ""), end: String(data.get("end") || ""),
          usageLimit, status: String(data.get("status")), branches,
          happyHour: String(data.get("happyHour") || ""), description: String(data.get("description") || ""),
        });
        if (voucher.start && voucher.end && voucher.start > voucher.end) { NS.toast("Ngày bắt đầu phải trước ngày kết thúc.", "error"); return; }
        NS.addAudit(id ? "Sửa voucher" : "Thêm voucher", "Khuyến mãi", null, { code, type, value, branches });
        NS.saveData();
        NS.toast("Đã lưu voucher " + code + ".");
        NS.navigate("/chain/promotions");
      },
    },
  });
  NS.route("/chain/promotions/edit", "promotionEdit");

  NS.view("branches", {
    roles: NS.roles.chain,
    render() {
      const orders = todayOrdersAll();
      return NS.ui.shell({
        nav: "chain", active: "branches", code: "SCR-13", title: "Chi nhánh & Manager",
        subtitle: "Hồ sơ chi nhánh, quản lý phụ trách và trạng thái kết nối POS.",
        actions: '<a class="btn btn-primary" href="#/chain/branches/edit">Thêm chi nhánh</a>',
        content: '<div class="table-wrap"><table class="data"><thead><tr><th>Mã / chi nhánh</th><th>Địa chỉ</th><th>Liên hệ</th><th>Giờ mở</th><th class="num">Số bàn</th><th>Quản lý</th><th>POS</th><th>Vận hành</th><th class="num">Doanh thu hôm nay</th><th class="text-right"></th></tr></thead><tbody>' +
          NS.data.branches.map((b) => {
            const revenue = orders.filter((o) => o.branchId === b.id).reduce((s, o) => s + NS.calc.orderNet(o), 0);
            return '<tr class="' + (b.status === "maintenance" ? "is-muted" : "") + '"><td><div class="cell-title">' + esc(b.short) + '</div><div class="cell-sub mono">' + esc(b.code) + '</div></td><td class="small">' + esc(b.address) + '</td><td class="small">' + esc(b.phone) + '<div class="cell-sub">' + esc(b.taxCode) + '</div></td><td>' + esc(b.open + "–" + b.close) + '</td><td class="num">' + b.tables + '</td><td>' + esc(b.manager) + '</td><td>' + NS.ui.statusTag(b.posStatus) + '</td><td>' + NS.ui.statusTag(b.status) + '</td><td class="num">' + NS.fmt.currency(revenue) + '</td><td class="text-right"><a class="btn btn-sm" href="#/chain/branches/edit?id=' + encodeURIComponent(b.id) + '">Sửa</a></td></tr>';
          }).join("") + '</tbody></table></div>',
      });
    },
  });
  NS.route("/chain/branches", "branches");

  NS.view("branchEdit", {
    roles: NS.roles.chain,
    render(ctx) {
      const b = ctx.query.id ? NS.get.branch(ctx.query.id) : null;
      if (ctx.query.id && !b) return NS.ui.task({ code: "SCR-13", title: "Không tìm thấy chi nhánh", back: "#/chain/branches", content: NS.ui.empty("Chi nhánh không tồn tại", "Quay lại danh sách.") });
      const branch = b || { id: "", code: "", name: "", short: "", address: "", phone: "", open: "06:00", close: "23:00", tables: 20, managerId: "", manager: "", status: "open", posStatus: "online", taxCode: "" };
      const managers = NS.data.employees.filter((e) => e.role === "Branch Manager");
      return NS.ui.task({
        code: "SCR-13", title: b ? "Sửa chi nhánh · " + b.short : "Thêm chi nhánh", subtitle: "Hồ sơ vận hành, quản lý phụ trách và cấu hình POS.",
        back: "#/chain/branches", meta: b ? NS.ui.statusTag(branch.status) : '<span class="tag tag-pending">Chi nhánh mới</span>',
        content: '<form data-action="branch-save"><div class="panel"><div class="panel-head"><div><h2>Thông tin chi nhánh</h2><p>Mã chi nhánh dùng trong báo cáo và đồng bộ.</p></div></div><div class="form-grid">' +
          '<div class="field"><label>Mã chi nhánh <span class="req">*</span></label><input class="input" name="code" value="' + esc(branch.code) + '" placeholder="CN-09" required></div>' +
          '<div class="field"><label>Tên ngắn <span class="req">*</span></label><input class="input" name="short" value="' + esc(branch.short) + '" placeholder="Quận 3" required></div>' +
          '<div class="field span-2"><label>Tên đầy đủ <span class="req">*</span></label><input class="input" name="name" value="' + esc(branch.name) + '" placeholder="Quận 3 — Sài Gòn" required></div>' +
          '<div class="field span-all"><label>Địa chỉ <span class="req">*</span></label><input class="input" name="address" value="' + esc(branch.address) + '" required></div>' +
          '<div class="field"><label>Số điện thoại</label><input class="input" name="phone" value="' + esc(branch.phone) + '"></div>' +
          '<div class="field"><label>Mã số thuế</label><input class="input" name="taxCode" value="' + esc(branch.taxCode) + '"></div>' +
          '<div class="field"><label>Giờ mở cửa</label><input class="input" type="time" name="open" value="' + esc(branch.open) + '"></div>' +
          '<div class="field"><label>Giờ đóng cửa</label><input class="input" type="time" name="close" value="' + esc(branch.close) + '"></div>' +
          '<div class="field"><label>Số bàn</label><input class="input" name="tables" inputmode="numeric" value="' + branch.tables + '"></div>' +
          '<div class="field"><label>Quản lý phụ trách</label><select class="select" name="managerId">' +
          '<option value="">Chưa gán</option>' + managers.map((m) => '<option value="' + m.id + '"' + (branch.managerId === m.id ? " selected" : "") + '>' + esc(m.name + " · " + m.code) + '</option>').join("") + '</select></div>' +
          '<div class="field"><label>Trạng thái vận hành</label><select class="select" name="status"><option value="open"' + (branch.status === "open" ? " selected" : "") + '>Đang mở</option><option value="maintenance"' + (branch.status === "maintenance" ? " selected" : "") + '>Bảo trì</option><option value="inactive"' + (branch.status === "inactive" ? " selected" : "") + '>Tạm đóng</option></select></div>' +
          '<div class="field"><label>Trạng thái POS</label><select class="select" name="posStatus"><option value="online"' + (branch.posStatus === "online" ? " selected" : "") + '>Online</option><option value="offline"' + (branch.posStatus === "offline" ? " selected" : "") + '>Offline</option></select></div></div>' +
          '<div class="form-actions"><a class="btn" href="#/chain/branches">Hủy</a><button class="btn btn-primary" type="submit">Lưu chi nhánh</button></div></div></form>',
      });
    },
    actions: {
      "branch-save"(ctx) {
        const data = ctx.data;
        const id = ctx.query.id || "";
        const code = String(data.get("code") || "").trim().toUpperCase();
        const short = String(data.get("short") || "").trim();
        const name = String(data.get("name") || "").trim();
        if (!code || !short || !name) { NS.toast("Mã, tên ngắn và tên đầy đủ là bắt buộc.", "error"); return; }
        if (NS.data.branches.some((b) => b.code === code && b.id !== id)) { NS.toast("Mã chi nhánh đã tồn tại.", "error"); return; }
        let branch = id ? NS.get.branch(id) : null;
        if (!branch) {
          branch = { id: "D" + (NS.data.branches.length + 1) };
          NS.data.branches.push(branch);
        }
        const manager = NS.get.employee(String(data.get("managerId") || ""));
        Object.assign(branch, {
          code, short, name, address: String(data.get("address") || "").trim(),
          phone: String(data.get("phone") || ""), taxCode: String(data.get("taxCode") || ""),
          open: String(data.get("open") || "06:00"), close: String(data.get("close") || "23:00"),
          tables: Number(data.get("tables") || 0), status: String(data.get("status")),
          posStatus: String(data.get("posStatus")),
          managerId: manager ? manager.id : "", manager: manager ? manager.name : "Chưa gán",
        });
        if (manager) manager.branchId = branch.id;
        NS.addAudit(id ? "Sửa chi nhánh" : "Thêm chi nhánh", "Chi nhánh", null, { code, name, manager: branch.manager, status: branch.status });
        NS.saveData();
        NS.toast("Đã lưu chi nhánh " + short + ".");
        NS.navigate("/chain/branches");
      },
    },
  });
  NS.route("/chain/branches/edit", "branchEdit");

  NS.view("sync", {
    roles: NS.roles.chain,
    render() {
      const result = NS.state.syncResult;
      return NS.ui.shell({
        nav: "chain", active: "sync", code: "SCR-14", title: "Trung tâm đồng bộ chuỗi",
        subtitle: "Phát hành menu, BOM và khuyến mãi xuống từng chi nhánh. Cấu hình offline sẽ nhận trạng thái thất bại.",
        content: '<div class="grid-2"><div class="panel"><div class="panel-head"><div><h2>Phiên đồng bộ mới</h2><p>Chọn gói dữ liệu và phạm vi chi nhánh.</p></div></div>' +
          '<form data-action="sync-run"><div class="field mb-16"><label>Gói dữ liệu</label><div class="check-row"><label class="check--box"><input type="checkbox" name="packages" value="menu" checked><span><strong>Menu & giá</strong><small>Sản phẩm, giá S/M/L, trạng thái bán</small></span></label><label class="check--box"><input type="checkbox" name="packages" value="bom"><span><strong>BOM</strong><small>Công thức chuẩn và định lượng</small></span></label><label class="check--box"><input type="checkbox" name="packages" value="promotions"><span><strong>Khuyến mãi</strong><small>Voucher và điều kiện áp dụng</small></span></label></div></div>' +
          '<div class="field mb-16"><label>Chi nhánh nhận</label><div class="check-row"><label class="check"><input type="checkbox" name="branches" value="all" checked> Tất cả</label>' + NS.data.branches.map((b) => '<label class="check"><input type="checkbox" name="branches" value="' + b.id + '"> ' + esc(b.short) + '</label>').join("") + '</div></div>' +
          '<div class="field mb-16"><label>Ghi chú phiên bản</label><textarea class="textarea" name="note" placeholder="Ví dụ: Cập nhật giá size L nhóm trà…"></textarea></div>' +
          '<div class="form-actions"><button class="btn btn-primary" type="submit">Phát hành đồng bộ</button></div></form></div>' +
          '<div class="panel"><div class="panel-head"><div><h2>Kết quả phiên gần nhất</h2><p>' + (result ? result.version + " · " + NS.fmt.datetime(result.time) : "Chưa chạy trong phiên này.") + '</p></div></div>' +
          (result ? '<div class="table-wrap"><table class="data"><thead><tr><th>Chi nhánh</th><th>Trạng thái</th><th>Ghi chú</th><th>Thời gian</th></tr></thead><tbody>' + result.rows.map((r) => '<tr><td>' + esc(NS.branchName(r.branchId)) + '</td><td>' + NS.ui.statusTag(r.status) + '</td><td class="small">' + esc(r.note) + '</td><td>' + NS.fmt.timeShort(r.time) + '</td></tr>').join("") + '</tbody></table></div>' : NS.ui.empty("Chưa có kết quả", "Chạy đồng bộ để xem trạng thái từng chi nhánh.")) + '</div></div>' +
          '<div class="panel mt-24"><div class="panel-head"><div><h2>Lịch sử đồng bộ</h2><p>Các phiên đã phát hành gần đây.</p></div></div><div class="table-wrap"><table class="data"><thead><tr><th>Mã</th><th>Thời gian</th><th>Phiên bản</th><th>Gói dữ liệu</th><th>Chi nhánh</th><th>Người thực hiện</th><th>Trạng thái</th><th>Ghi chú</th></tr></thead><tbody>' +
          NS.data.syncHistory.map((s) => '<tr><td class="mono">' + esc(s.id) + '</td><td>' + NS.fmt.datetime(s.time) + '</td><td class="mono">' + esc(s.version) + '</td><td class="small">' + esc(s.packages.join(", ")) + '</td><td class="small">' + esc(s.branches) + '</td><td>' + esc(s.actor) + '</td><td>' + NS.ui.statusTag(s.status) + '</td><td class="small muted">' + esc(s.note) + '</td></tr>').join("") + '</tbody></table></div></div>',
      });
    },
    actions: {
      "sync-run"(ctx) {
        const data = ctx.data;
        let packages = data.getAll("packages");
        let branches = data.getAll("branches");
        const note = String(data.get("note") || "").trim();
        if (!packages.length) { NS.toast("Chọn ít nhất một gói dữ liệu.", "error"); return; }
        if (branches.indexOf("all") >= 0) branches = NS.data.branches.map((b) => b.id);
        if (!branches.length) { NS.toast("Chọn ít nhất một chi nhánh.", "error"); return; }
        const now = localNow();
        const version = "2026.10.20-" + String(NS.data.syncHistory.length + 1).padStart(2, "0");
        const packageNames = { menu: "Menu & giá", bom: "BOM", promotions: "Khuyến mãi" };
        const rows = branches.map((id) => {
          const b = NS.get.branch(id);
          const failed = !b || b.posStatus === "offline" || b.status === "maintenance";
          return { branchId: id, status: failed ? "failed" : "success", note: failed ? "Chi nhánh offline hoặc đang bảo trì, sẽ thử lại sau." : "Áp dụng thành công.", time: now };
        });
        const hasFail = rows.some((r) => r.status === "failed");
        NS.data.syncHistory.unshift({
          id: "SY-" + String(Date.now()).slice(-7), time: now, version,
          packages: packages.map((p) => packageNames[p]), branches: rows.map((r) => NS.get.branch(r.branchId).short).join(", "),
          status: hasFail ? "partial" : "success", actor: NS.currentUser().name,
          note: note || (hasFail ? "Một số chi nhánh không nhận được cấu hình." : "Đồng bộ thành công toàn bộ."),
        });
        NS.state.syncResult = { version, time: now, rows };
        NS.addAudit("Đồng bộ cấu hình", "Chain Sync", null, { version, packages, branches, status: hasFail ? "partial" : "success" });
        NS.saveData();
        NS.toast(hasFail ? "Đồng bộ một phần. Kiểm tra chi nhánh offline." : "Đồng bộ thành công.");
        NS.refresh();
      },
    },
  });
  NS.route("/chain/sync", "sync");
})();
