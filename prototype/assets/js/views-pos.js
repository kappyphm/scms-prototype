/* SCMS prototype — POS, item options, checkout, cash drawer */
(function () {
  const NS = window.SCMS;
  const esc = NS.esc;

  function localNow() {
    return NS.today() + "T" + NS.fmt.clock();
  }

  function nextOrderCode() {
    const dateKey = NS.today().slice(2).replace(/-/g, "");
    const prefix = "CAFE-" + dateKey + "-";
    let max = 0;
    NS.data.orders.forEach((o) => {
      if (o.code && o.code.indexOf(prefix) === 0) {
        const n = Number(o.code.slice(prefix.length));
        if (n > max) max = n;
      }
    });
    return prefix + String(max + 1).padStart(3, "0");
  }

  function availableProducts() {
    const branchId = NS.state.branchId;
    return NS.data.products.filter((p) => p.status === "active" && (p.pausedBranches || []).indexOf(branchId) < 0);
  }

  function posProductCard(product) {
    const paused = (product.pausedBranches || []).indexOf(NS.state.branchId) >= 0;
    const disabled = product.status !== "active" || paused;
    const initials = product.name.split(" ").map((x) => x[0]).slice(0, 2).join("").toUpperCase();
    return '<button class="product ' + (disabled ? "is-disabled" : "") + '" data-action="pos-add" data-id="' + product.id + '">' +
      '<div class="product__image">' + esc(initials) + '</div>' +
      (disabled ? '<span class="product__flag tag tag-neutral">Tạm ngưng</span>' : "") +
      '<div class="product__body"><div class="product__name">' + esc(product.name) + '</div>' +
      '<div class="small muted">' + esc(product.code + " · " + product.category) + '</div>' +
      '<div class="product__price">Từ ' + NS.fmt.currency(product.prices.S) + '</div></div></button>';
  }

  function cartLineHtml(line) {
    const options = [line.size, line.sugar, line.ice].concat(line.toppingNames || []).filter(Boolean).join(" · ");
    return '<div class="cart-line"><div class="cart-line__main">' +
      '<div class="cart-line__name">' + esc(line.name) + '</div>' +
      '<div class="cart-line__opts">' + esc(options || "Mặc định") + (line.note ? " · " + esc(line.note) : "") + '</div>' +
      '<div class="cart-line__tools"><span class="qty"><button data-action="pos-qty-dec" data-line="' + esc(line.id) + '" aria-label="Giảm">−</button><span>' + line.qty + '</span><button data-action="pos-qty-inc" data-line="' + esc(line.id) + '" aria-label="Tăng">+</button></span>' +
      '<button class="link-btn" data-action="pos-edit-line" data-line="' + esc(line.id) + '">Sửa</button>' +
      '<button class="link-btn" data-action="pos-remove-line" data-line="' + esc(line.id) + '">Xóa</button></div></div>' +
      '<div class="cart-line__price">' + NS.fmt.currency(line.lineTotal) + '</div></div>';
  }

  NS.view("pos", {
    roles: NS.roles.pos,
    render() {
      const shift = NS.calc.currentShift(NS.state.branchId);
      const branch = NS.branch();
      const user = NS.currentUser();
      const categories = NS.data.categories;
      const category = NS.state.posCategory || "all";
      const search = (NS.state.posSearch || "").toLowerCase().trim();
      const products = availableProducts().filter((p) => {
        if (category !== "all" && p.category !== category) return false;
        if (!search) return true;
        return (p.name + " " + p.code).toLowerCase().indexOf(search) >= 0;
      });
      const totals = NS.calc.cartTotals();
      const count = NS.calc.cartCount(NS.state.cart);
      const held = NS.state.heldCart;
      const voucherResult = NS.state.voucherCode ? NS.calc.voucher(NS.state.voucherCode, totals.subtotal) : null;

      return '<div class="pos-shell">' +
        '<div class="pos-top"><div class="topbar__left"><a class="brand" href="#/dispatch"><span class="brand__mark">SC</span><span class="brand__name">SCMS POS</span></a>' +
        '<span class="topbar__branch" style="color:#d8d2c8">' + esc(branch.code + " · " + branch.name) + '</span>' +
        '<span class="topbar__meta">' + NS.ui.icon("clock") + (shift ? 'Ca ' + NS.fmt.timeShort(shift.openedAt) + " · " + esc(shift.cashierName) : "Chưa mở ca") + '</span></div>' +
        '<div class="topbar__right"><a class="btn btn-sm" href="#/orders">Đơn hàng</a><a class="btn btn-sm" href="#/shift">Ca quỹ</a>' +
        '<select data-change="switch-role" aria-label="Chuyển vai trò">' + NS.ui.roleOptions(NS.state.role) + '</select>' +
        '<span class="topbar__clock" data-clock></span><a class="avatar" href="#/dispatch" title="' + esc(user.name) + '">' + esc(user.name.split(" ").slice(-2).map((x) => x[0]).join("").toUpperCase()) + '</a></div></div>' +
        '<div class="pos-body">' +
        '<aside class="pos-categories"><button class="cat ' + (category === "all" ? "active" : "") + '" data-action="pos-category" data-category="all">Tất cả <span>' + availableProducts().length + '</span></button>' +
        categories.map((c) => '<button class="cat ' + (category === c ? "active" : "") + '" data-action="pos-category" data-category="' + esc(c) + '">' + esc(c) + ' <span>' + availableProducts().filter((p) => p.category === c).length + '</span></button>').join("") +
        (NS.state.role === "manager" || NS.state.role === "coo" ? '<div class="divider mt-16 mb-12"></div><a class="nav-item" href="#/branch/inventory"><span class="nav-item__icon">' + NS.ui.icon("inventory") + '</span><span>Kho nguyên liệu</span></a><a class="nav-item" href="#/branch"><span class="nav-item__icon">' + NS.ui.icon("dashboard") + '</span><span>Chi nhánh</span></a>' : "") +
        '</aside>' +
        '<section class="pos-products">' +
        (shift ? "" : '<div class="notice notice--warn pos-notice"><span class="notice__icon">!</span><div><strong>Chưa mở ca quỹ.</strong> Bạn vẫn có thể tạo đơn tạm, nhưng cần <a class="text-accent" href="#/shift">mở ca</a> trước khi thanh toán tiền mặt.</div></div>') +
        '<div class="pos-search">' + NS.ui.icon("search") + '<input class="input input-lg" id="pos-search" data-input="pos-search" data-focus-key="pos-search" value="' + esc(NS.state.posSearch || "") + '" placeholder="Tìm tên hoặc mã món… (F1)"></div>' +
        '<div class="pos-products-head"><h2>' + (category === "all" ? "Toàn bộ menu" : esc(category)) + '</h2><span class="small muted">' + products.length + ' món khả dụng · ' + NS.fmt.date(NS.today()) + '</span></div>' +
        '<div class="product-grid">' + (products.length ? products.map(posProductCard).join("") : NS.ui.empty("Không tìm thấy món", "Thử từ khóa khác hoặc chọn danh mục khác.", '<button class="btn btn-sm mt-8" data-action="pos-clear-filter">Xóa bộ lọc</button>')) + '</div>' +
        '</section>' +
        '<aside class="pos-cart"><div class="cart-head"><div class="flex justify-between items-center"><h2>Đơn hiện tại</h2><span class="badge-count">' + count + '</span></div>' +
        '<div class="meta">' + esc(user.name) + (shift ? " · Ca " + NS.fmt.timeShort(shift.openedAt) : " · Chưa mở ca") + '</div></div>' +
        (held ? '<div class="notice notice--accent" style="margin:10px 16px 0"><span class="notice__icon">↺</span><div><strong>Đơn đang giữ:</strong> ' + NS.calc.cartCount(held.cart) + ' món · ' + NS.fmt.currency(NS.calc.cartSubtotal(held.cart)) + '<div class="mt-8"><button class="link-btn" data-action="pos-resume-hold">Khôi phục</button> · <button class="link-btn" data-action="pos-discard-hold">Bỏ</button></div></div></div>' : "") +
        '<div class="cart-lines">' + (NS.state.cart.length ? NS.state.cart.map(cartLineHtml).join("") : NS.ui.empty("Giỏ hàng trống", "Chọn món từ menu để bắt đầu đơn mới.")) + '</div>' +
        '<div class="cart-foot">' +
        '<div class="btn-group w-full mb-8"><button class="btn btn-sm w-full ' + (NS.state.orderType === "dine_in" ? "active" : "") + '" data-action="pos-order-type" data-type="dine_in" style="width:50%">Tại quán</button><button class="btn btn-sm w-full ' + (NS.state.orderType === "takeaway" ? "active" : "") + '" data-action="pos-order-type" data-type="takeaway" style="width:50%">Mang đi</button></div>' +
        '<div class="voucher-row"><input class="input" id="pos-voucher" value="' + esc(NS.state.voucherCode || "") + '" placeholder="Mã voucher (F8)"><button class="btn btn-sm" data-action="pos-apply-voucher">Áp dụng</button></div>' +
        (voucherResult ? '<div class="small ' + (voucherResult.ok ? "text-success" : "text-accent") + ' mb-8">' + esc(voucherResult.message) + '</div>' : "") +
        '<div class="summary-line"><span>Tạm tính (' + count + ' món)</span><strong>' + NS.fmt.currency(totals.subtotal) + '</strong></div>' +
        '<div class="summary-line"><span>Giảm giá</span><strong>−' + NS.fmt.currency(totals.discount) + '</strong></div>' +
        '<div class="summary-line total"><span>Tổng thanh toán</span><strong>' + NS.fmt.currency(totals.total) + '</strong></div>' +
        '<div class="cart-actions"><button class="btn" data-action="pos-hold"' + (NS.state.cart.length ? "" : " disabled") + '>Giữ đơn</button><button class="btn btn-primary" data-action="pos-checkout" data-shortcut="F9"' + (NS.state.cart.length ? "" : " disabled") + '>Thanh toán</button></div>' +
        '<div class="pos-hint"><kbd>F1</kbd> tìm món · <kbd>F8</kbd> voucher · <kbd>F9</kbd> thanh toán</div></div></aside>' +
        '</div></div>';
    },
    actions: {
      "pos-category"(ctx) {
        NS.state.posCategory = ctx.el.getAttribute("data-category");
        NS.refresh();
      },
      "pos-search"(ctx) {
        NS.state.posSearch = ctx.value;
        NS.refresh("pos-search");
      },
      "pos-clear-filter"() {
        NS.state.posSearch = "";
        NS.state.posCategory = "all";
        NS.refresh();
      },
      "pos-add"(ctx) {
        const product = NS.get.product(ctx.el.getAttribute("data-id"));
        if (!product) return;
        if (product.status !== "active" || (product.pausedBranches || []).indexOf(NS.state.branchId) >= 0) {
          NS.toast("Món này đang tạm ngưng tại chi nhánh.", "warn");
          return;
        }
        NS.state.editingLineId = null;
        NS.state.itemDraft = { productId: product.id, size: "M", sugar: "100%", ice: "100% đá", toppingIds: [], note: "", qty: 1 };
        NS.navigate("/pos/item/" + product.id);
      },
      "pos-qty-inc"(ctx) {
        const line = NS.state.cart.find((l) => l.id === ctx.el.getAttribute("data-line"));
        if (line) { line.qty += 1; line.lineTotal = line.unitPrice * line.qty; NS.refresh(); }
      },
      "pos-qty-dec"(ctx) {
        const id = ctx.el.getAttribute("data-line");
        const line = NS.state.cart.find((l) => l.id === id);
        if (!line) return;
        line.qty -= 1;
        if (line.qty <= 0) NS.state.cart = NS.state.cart.filter((l) => l.id !== id);
        else line.lineTotal = line.unitPrice * line.qty;
        NS.refresh();
      },
      "pos-remove-line"(ctx) {
        NS.state.cart = NS.state.cart.filter((l) => l.id !== ctx.el.getAttribute("data-line"));
        NS.refresh();
      },
      "pos-edit-line"(ctx) {
        const line = NS.state.cart.find((l) => l.id === ctx.el.getAttribute("data-line"));
        if (!line) return;
        NS.state.editingLineId = line.id;
        NS.state.itemDraft = {
          productId: line.productId, size: line.size, sugar: line.sugar, ice: line.ice,
          toppingIds: (line.toppingIds || []).slice(), note: line.note || "", qty: line.qty,
        };
        NS.navigate("/pos/item/" + line.productId);
      },
      "pos-order-type"(ctx) {
        NS.state.orderType = ctx.el.getAttribute("data-type");
        NS.refresh();
      },
      "pos-apply-voucher"() {
        const input = document.getElementById("pos-voucher");
        const code = String(input ? input.value : "").trim().toUpperCase();
        if (!code) { NS.state.voucherCode = ""; NS.refresh(); return; }
        const result = NS.calc.voucher(code, NS.calc.cartSubtotal(NS.state.cart));
        if (!result.ok) { NS.toast(result.message, "error"); return; }
        NS.state.voucherCode = code;
        NS.toast(result.message);
        NS.refresh();
      },
      "pos-hold"() {
        if (!NS.state.cart.length) return;
        NS.state.heldCart = { cart: NS.state.cart.slice(), orderType: NS.state.orderType, voucherCode: NS.state.voucherCode };
        NS.state.cart = [];
        NS.state.voucherCode = "";
        NS.refresh();
        NS.toast("Đã giữ đơn tạm. Có thể khôi phục từ giỏ hàng.");
      },
      "pos-resume-hold"() {
        if (!NS.state.heldCart) return;
        NS.state.cart = NS.state.heldCart.cart;
        NS.state.orderType = NS.state.heldCart.orderType || "dine_in";
        NS.state.voucherCode = NS.state.heldCart.voucherCode || "";
        NS.state.heldCart = null;
        NS.refresh();
        NS.toast("Đã khôi phục đơn đang giữ.");
      },
      "pos-discard-hold"() {
        NS.state.heldCart = null;
        NS.refresh();
      },
      "pos-checkout"() {
        if (!NS.state.cart.length) return;
        if (!NS.calc.currentShift(NS.state.branchId)) {
          NS.toast("Vui lòng mở ca quỹ trước khi thanh toán.", "error");
          return;
        }
        NS.state.pendingOrder = {
          cart: JSON.parse(JSON.stringify(NS.state.cart)),
          orderType: NS.state.orderType,
          voucherCode: NS.state.voucherCode,
          totals: NS.calc.cartTotals(),
        };
        NS.state.checkoutMethod = "cash";
        NS.state.checkoutState = "idle";
        NS.state.cashReceived = "";
        NS.navigate("/pos/checkout");
      },
    },
  });
  NS.route("/pos", "pos");

  NS.view("posItem", {
    roles: NS.roles.pos,
    render(ctx) {
      const product = NS.get.product(ctx.params.id);
      if (!product) {
        return NS.ui.task({ code: "POP-01", title: "Không tìm thấy món", back: "#/pos", content: NS.ui.empty("Món không tồn tại", "Quay lại POS và chọn món khác.") });
      }
      const draft = getDraft(product);
      const unitPrice = NS.calc.productPrice(product, draft.size, draft.toppingIds);
      const toppings = NS.data.toppings.filter((t) => (product.toppings || []).indexOf(t.id) >= 0);
      const total = unitPrice * draft.qty;
      return NS.ui.task({
        code: "POP-01",
        title: product.name,
        subtitle: "Tùy chỉnh món trước khi thêm vào giỏ · " + product.code,
        back: "#/pos",
        meta: '<span class="tag tag-neutral">' + esc(product.category) + '</span><span class="tag tag-pending">' + esc(product.code) + '</span>',
        content: '<div class="option-layout"><div>' +
          '<div class="option-group"><h2>Chọn size</h2><p>Giá thay đổi theo dung tích ly.</p><div class="choice-grid">' +
          ["S", "M", "L"].map((s) => '<label class="choice"><input type="radio" name="size" value="' + s + '" data-change="item-size"' + (draft.size === s ? " checked" : "") + '><span><strong>Size ' + s + '</strong><small>' + NS.fmt.currency(product.prices[s]) + '</small></span></label>').join("") + '</div></div>' +
          '<div class="option-group"><h2>Mức đường</h2><div class="choice-grid">' +
          ["100%", "70%", "50%", "Không đường"].map((s) => '<label class="choice"><input type="radio" name="sugar" value="' + s + '" data-change="item-sugar"' + (draft.sugar === s ? " checked" : "") + '><span><strong>' + s + '</strong></span></label>').join("") + '</div></div>' +
          '<div class="option-group"><h2>Mức đá</h2><div class="choice-grid">' +
          ["100% đá", "Ít đá", "Không đá"].map((s) => '<label class="choice"><input type="radio" name="ice" value="' + s + '" data-change="item-ice"' + (draft.ice === s ? " checked" : "") + '><span><strong>' + s + '</strong></span></label>').join("") + '</div></div>' +
          (toppings.length ? '<div class="option-group"><h2>Topping</h2><p>Có thể chọn nhiều topping.</p><div class="choice-grid">' +
            toppings.map((t) => '<label class="choice"><input type="checkbox" value="' + t.id + '" data-change="item-topping"' + (draft.toppingIds.indexOf(t.id) >= 0 ? " checked" : "") + '><span><strong>' + esc(t.name) + '</strong><small>+' + NS.fmt.currency(t.price) + '</small></span></label>').join("") + '</div></div>' : "") +
          '<div class="option-group"><h2>Ghi chú pha chế</h2><p>Tối đa 100 ký tự.</p><textarea class="textarea" id="item-note" maxlength="100" placeholder="Ví dụ: ít ngọt, đá riêng, không ống hút…">' + esc(draft.note || "") + '</textarea></div>' +
          '<div class="option-group"><h2>Số lượng</h2><div class="flex items-center gap-12"><span class="qty" style="height:38px"><button data-action="item-qty" data-delta="-1">−</button><span style="min-width:40px">' + draft.qty + '</span><button data-action="item-qty" data-delta="1">+</button></span><span class="small muted">Tối đa 20 món mỗi dòng.</span></div></div>' +
          '</div>' +
          '<aside class="item-summary"><div class="item-summary__image">' + esc(product.name.split(" ").map((x) => x[0]).slice(0, 2).join("").toUpperCase()) + '</div>' +
          '<div class="small muted mt-12">' + esc(product.category) + ' · ' + esc(product.code) + '</div><h2>' + esc(product.name) + '</h2>' +
          '<div class="price-big">' + NS.fmt.currency(unitPrice) + '</div>' +
          '<div class="price-lines"><div class="price-line"><span>Size ' + esc(draft.size) + '</span><span>' + NS.fmt.currency(product.prices[draft.size]) + '</span></div>' +
          (draft.toppingIds.length ? draft.toppingIds.map((id) => { const t = NS.get.topping(id); return t ? '<div class="price-line"><span>' + esc(t.name) + '</span><span>+' + NS.fmt.currency(t.price) + '</span></div>' : ""; }).join("") : '<div class="price-line"><span>Topping</span><span>—</span></div>') +
          '<div class="price-line"><span>Đường / đá</span><span>' + esc(draft.sugar.replace("%", "%")) + ' · ' + esc(draft.ice) + '</span></div>' +
          '<div class="price-line"><span>Số lượng</span><span>× ' + draft.qty + '</span></div>' +
          '<div class="price-line total"><span>Thành tiền</span><span>' + NS.fmt.currency(total) + '</span></div></div>' +
          '<div class="mt-16"><button class="btn btn-primary btn-block btn-lg" data-action="item-add">' + (NS.state.editingLineId ? "Cập nhật món" : "Thêm vào giỏ") + '</button></div>' +
          '<div class="small muted mt-8" style="text-align:center">Thay đổi được áp dụng ngay vào giỏ hàng.</div></aside></div>',
        footer: '<span class="task-footer__note">Tùy chỉnh món không làm thay đổi đơn đã thanh toán.</span><div class="flex gap-8"><a class="btn" href="#/pos">Hủy</a><button class="btn btn-primary" data-action="item-add">' + (NS.state.editingLineId ? "Cập nhật món" : "Thêm vào giỏ") + '</button></div>',
      });
    },
    actions: {
      "item-size"(ctx) { getDraft().size = ctx.value; NS.refresh(); },
      "item-sugar"(ctx) { getDraft().sugar = ctx.value; NS.refresh(); },
      "item-ice"(ctx) { getDraft().ice = ctx.value; NS.refresh(); },
      "item-topping"(ctx) {
        const draft = getDraft();
        const id = ctx.value;
        if (ctx.el.checked) {
          if (draft.toppingIds.indexOf(id) < 0) draft.toppingIds.push(id);
        } else {
          draft.toppingIds = draft.toppingIds.filter((x) => x !== id);
        }
        NS.refresh();
      },
      "item-qty"(ctx) {
        const draft = getDraft();
        draft.qty = Math.min(20, Math.max(1, draft.qty + Number(ctx.el.getAttribute("data-delta"))));
        NS.refresh();
      },
      "item-add"() {
        const draft = getDraft();
        const product = NS.get.product(draft.productId);
        if (!product) return;
        const noteEl = document.getElementById("item-note");
        if (noteEl) draft.note = noteEl.value.trim();
        const unitPrice = NS.calc.productPrice(product, draft.size, draft.toppingIds);
        if (NS.state.editingLineId) {
          const line = NS.state.cart.find((l) => l.id === NS.state.editingLineId);
          if (line) {
            Object.assign(line, {
              size: draft.size, sugar: draft.sugar, ice: draft.ice,
              toppingIds: draft.toppingIds.slice(), toppingNames: draft.toppingIds.map((id) => (NS.get.topping(id) || {}).name).filter(Boolean),
              qty: draft.qty, unitPrice, lineTotal: unitPrice * draft.qty, note: draft.note,
            });
          }
        } else {
          NS.state.cart.push({
            id: "L-" + Date.now() + "-" + Math.floor(Math.random() * 999),
            productId: product.id, name: product.name, code: product.code,
            size: draft.size, sugar: draft.sugar, ice: draft.ice,
            toppingIds: draft.toppingIds.slice(), toppingNames: draft.toppingIds.map((id) => (NS.get.topping(id) || {}).name).filter(Boolean),
            qty: draft.qty, unitPrice, lineTotal: unitPrice * draft.qty, note: draft.note,
          });
        }
        NS.state.itemDraft = null;
        NS.state.editingLineId = null;
        NS.toast("Đã cập nhật giỏ hàng.");
        NS.navigate("/pos");
      },
    },
  });
  NS.route("/pos/item/:id", "posItem");

  function getDraft(product) {
    if (!NS.state.itemDraft || (product && NS.state.itemDraft.productId && NS.state.itemDraft.productId !== product.id)) {
      NS.state.itemDraft = { productId: product ? product.id : "", size: "M", sugar: "100%", ice: "100% đá", toppingIds: [], note: "", qty: 1 };
    } else if (NS.state.itemDraft && product && !NS.state.itemDraft.productId) {
      NS.state.itemDraft.productId = product.id;
    }
    return NS.state.itemDraft;
  }

  NS.view("checkout", {
    roles: NS.roles.pos,
    render() {
      const pending = NS.state.pendingOrder;
      if (NS.state.checkoutState === "done") return renderSuccess();
      if (!pending || !pending.cart.length) {
        return NS.ui.task({ code: "POP-02", title: "Chưa có đơn thanh toán", back: "#/pos", content: NS.ui.empty("Không có đơn chờ thanh toán", "Quay lại POS để tạo đơn mới.", '<a class="btn btn-primary mt-8" href="#/pos">Về POS</a>') });
      }

      const totals = pending.totals;
      const cash = Number(NS.state.cashReceived || 0);
      const change = Math.max(0, cash - totals.total);
      const method = NS.state.checkoutMethod;
      const items = pending.cart.map((l) => '<div class="checkout-item"><div><div class="cell-title">' + esc(l.qty + " × " + l.name) + '</div><div class="small muted">' + esc([l.size, l.sugar, l.ice].concat(l.toppingNames || []).join(" · ")) + '</div></div><strong>' + NS.fmt.currency(l.lineTotal) + '</strong></div>').join("");
      return NS.ui.task({
        code: "POP-02",
        title: "Thanh toán đơn hàng",
        subtitle: "Kiểm tra đơn và chọn phương thức thanh toán. Đơn sẽ bị khóa sau khi xác nhận.",
        back: "#/pos",
        meta: '<span class="tag tag-pending">' + esc(pending.orderType === "takeaway" ? "Mang đi" : "Tại quán") + '</span><span class="tag tag-neutral">' + NS.calc.cartCount(pending.cart) + ' món</span>',
        content: '<div class="checkout-layout"><div class="checkout-summary"><div class="checkout-summary__head"><div class="flex justify-between"><div><div class="page-code">ĐƠN TẠM</div><h2 style="font-size:17px">' + esc(NS.currentUser().name) + '</h2><div class="small muted">' + esc(NS.branch().name) + ' · ' + esc(NS.fmt.date(NS.today())) + '</div></div><span class="tag tag-pending">Chưa thanh toán</span></div></div>' +
          '<div class="checkout-items">' + items + '</div>' +
          '<div class="checkout-totals"><div class="summary-line"><span>Tạm tính</span><strong>' + NS.fmt.currency(totals.subtotal) + '</strong></div>' +
          '<div class="summary-line"><span>Giảm giá' + (pending.voucherCode ? " · " + esc(pending.voucherCode) : "") + '</span><strong>−' + NS.fmt.currency(totals.discount) + '</strong></div>' +
          '<div class="summary-line total"><span>Tổng thanh toán</span><strong>' + NS.fmt.currency(totals.total) + '</strong></div></div></div>' +
          '<div class="pay-box"><div class="pay-tabs"><button class="pay-tab ' + (method === "cash" ? "active" : "") + '" data-action="checkout-method" data-method="cash">Tiền mặt</button><button class="pay-tab ' + (method === "vietqr" ? "active" : "") + '" data-action="checkout-method" data-method="vietqr">VietQR / SePay</button></div>' +
          (method === "cash" ? renderCash(totals, cash, change) : renderQr(totals)) +
          '</div></div>',
        footer: '<span class="task-footer__note">Thanh toán sẽ ghi nhận vào ca quỹ hiện tại và tạo audit log.</span><div class="flex gap-8"><a class="btn" href="#/pos">Quay lại</a><button class="btn btn-primary" data-action="' + (method === "cash" ? "checkout-confirm-cash" : "checkout-confirm-qr") + '">' + (method === "cash" ? "Xác nhận & in bill" : "Tôi đã nhận chuyển khoản") + '</button></div>',
      });
    },
    actions: {
      "checkout-method"(ctx) {
        NS.state.checkoutMethod = ctx.el.getAttribute("data-method");
        NS.refresh();
      },
      "checkout-quick"(ctx) {
        NS.state.cashReceived = String(ctx.el.getAttribute("data-amount"));
        NS.refresh();
      },
      "checkout-cash"(ctx) {
        NS.state.cashReceived = ctx.value;
        const pending = NS.state.pendingOrder;
        const cash = Number(ctx.value || 0);
        const total = pending ? pending.totals.total : 0;
        const changeEl = document.querySelector("[data-change-amount]");
        if (changeEl) changeEl.textContent = NS.fmt.currency(Math.max(0, cash - total));
      },
      "checkout-confirm-cash"() {
        const pending = NS.state.pendingOrder;
        if (!pending) return;
        const input = document.getElementById("checkout-cash");
        const cash = Number((input ? input.value : NS.state.cashReceived) || 0);
        if (cash < pending.totals.total) {
          NS.toast("Tiền khách đưa chưa đủ tổng thanh toán.", "error");
          return;
        }
        createPaidOrder("cash", cash);
      },
      "checkout-confirm-qr"() {
        createPaidOrder("vietqr", 0);
      },
      "checkout-qr-success"() {
        createPaidOrder("vietqr", 0);
      },
      "checkout-qr-mismatch"() {
        NS.state.checkoutState = "mismatch";
        NS.refresh();
        NS.toast("Webhook báo sai số tiền. Đơn giữ trạng thái chờ thanh toán.", "error");
      },
      "checkout-new"() {
        NS.state.pendingOrder = null;
        NS.state.checkoutState = "idle";
        NS.state.lastOrderId = null;
        NS.navigate("/pos");
      },
      "checkout-print"() {
        const order = NS.get.order(NS.state.lastOrderId);
        if (order) NS.printReceipt(order);
      },
      "checkout-print-bar"() {
        const order = NS.get.order(NS.state.lastOrderId);
        if (!order) return;
        NS.toast("Đã gửi phiếu bar " + order.code + " tới máy bếp.");
      },
    },
  });
  NS.route("/pos/checkout", "checkout");

  function renderCash(totals, cash, change) {
    return '<div class="field"><label for="checkout-cash">Tiền khách đưa</label><input class="input input-lg" id="checkout-cash" data-input="checkout-cash" data-debounce="0" inputmode="numeric" value="' + esc(NS.state.cashReceived || "") + '" placeholder="Nhập số tiền"></div>' +
      '<div class="quick-cash mt-8">' +
      [100000, 200000, 500000, totals.total].map((n) => '<button data-action="checkout-quick" data-amount="' + n + '">' + (n === totals.total ? "Đúng tiền" : NS.fmt.currency(n)) + '</button>').join("") + '</div>' +
      '<div class="change-box"><span class="small muted">Tiền thối</span><strong data-change-amount>' + NS.fmt.currency(change) + '</strong></div>' +
      '<div class="notice mt-12"><span class="notice__icon">i</span><div>Hoàn tiền mặt từ két sẽ được ghi nhận vào lịch sử ca quỹ. Bill in sau khi xác nhận.</div></div>';
  }

  function renderQr(totals) {
    const code = nextOrderCode();
    const content = code; // Ma don da bat dau bang CAFE, khong them tien to lan nua.
    return '<div class="qr-box">' + NS.ui.qrSvg(content) +
      '<div class="qr-meta"><strong>' + NS.fmt.currency(totals.total) + '</strong><span>Nội dung: ' + esc(content) + '</span><span>Ngân hàng: ' + esc(NS.data.settings.bank.name) + ' · ' + esc(NS.data.settings.bank.accountNumber) + '</span><span>Hết hạn sau 05:00</span></div></div>' +
      '<div class="notice notice--warn mt-12"><span class="notice__icon">!</span><div><strong>Đang chờ webhook SePay.</strong> Đây là mô phỏng. Chọn “Webhook thành công” để xác nhận thanh toán.</div></div>' +
      '<div class="grid-2 mt-12"><button class="btn" data-action="checkout-qr-mismatch">Mô phỏng sai tiền</button><button class="btn btn-primary" data-action="checkout-qr-success">Webhook thành công</button></div>' +
      (NS.state.checkoutState === "mismatch" ? '<div class="notice notice--danger mt-12"><span class="notice__icon">!</span><div>Số tiền chuyển khoản không khớp. Đơn chưa được ghi nhận thanh toán.</div></div>' : "");
  }

  function renderSuccess() {
    const order = NS.get.order(NS.state.lastOrderId);
    if (!order) return "";
    const refunded = NS.calc.orderRefunded(order);
    return NS.ui.task({
      code: "POP-02",
      title: "Thanh toán thành công",
      subtitle: "Đơn đã được khóa dữ liệu. Bạn có thể in bill hoặc tạo đơn mới.",
      back: "#/pos",
      meta: '<span class="tag tag-done">Đã thanh toán</span>',
      content: '<div class="success-box"><div class="success-box__mark">' + NS.ui.icon("check") + '</div><h1>Đã thanh toán</h1>' +
        '<p>Đơn <strong>' + esc(order.code) + '</strong> đã hoàn tất với ' + (order.payment.method === "cash" ? "tiền mặt" : "VietQR/SePay") + '.</p>' +
        '<div class="receipt"><div class="receipt__head"><strong>' + esc(NS.get.branch(order.branchId).name) + '</strong><div class="small muted">' + esc(order.code) + ' · ' + esc(NS.fmt.datetime(order.createdAt)) + '</div></div>' +
        order.items.map((i) => '<div class="receipt__line"><span>' + esc(i.qty + " × " + i.name + " (" + i.size + ")") + '</span><span>' + NS.fmt.currency(i.lineTotal) + '</span></div>').join("") +
        '<div class="receipt__line"><span>Giảm giá</span><span>−' + NS.fmt.currency(order.discount) + '</span></div>' +
        '<div class="receipt__line receipt__total"><span>Tổng thanh toán</span><span>' + NS.fmt.currency(order.total) + '</span></div>' +
        (order.payment.method === "cash" ? '<div class="receipt__line"><span>Tiền nhận</span><span>' + NS.fmt.currency(order.payment.receivedAmount) + '</span></div><div class="receipt__line"><span>Tiền thối</span><span>' + NS.fmt.currency(Math.max(0, order.payment.receivedAmount - order.total)) + '</span></div>' : '<div class="receipt__line"><span>Mã giao dịch</span><span>' + esc(order.payment.reference) + '</span></div>') +
        '</div>' +
        '<div class="flex gap-8 mt-24" style="justify-content:center"><button class="btn" data-action="checkout-print">In bill</button><button class="btn" data-action="checkout-print-bar">In phiếu bar</button><button class="btn btn-primary" data-action="checkout-new">Tạo đơn mới</button></div></div>' +
        '<div class="small muted mt-12" style="text-align:center">Đã hoàn tiền: ' + NS.fmt.currency(refunded) + ' · Dữ liệu đơn không thể chỉnh sửa.</div>',
    });
  }

  function createPaidOrder(method, received) {
    const pending = NS.state.pendingOrder;
    if (!pending) return;
    const now = localNow();
    const user = NS.currentUser();
    const code = nextOrderCode();
    const totals = pending.totals;
    const items = pending.cart.map((l, i) => ({
      id: code + "-L" + (i + 1),
      productId: l.productId, name: l.name, code: l.code, size: l.size,
      sugar: l.sugar, ice: l.ice, toppingIds: l.toppingIds, toppingNames: l.toppingNames,
      qty: l.qty, unitPrice: l.unitPrice, lineTotal: l.lineTotal, note: l.note || "",
    }));
    const payment = method === "cash" ? {
      method: "cash", amount: totals.total, status: "completed", receivedAmount: received,
      reference: "", bank: "", account: "", paidAt: now, qrContent: "", qrExpiredAt: null,
    } : {
      method: "vietqr", amount: totals.total, status: "completed", receivedAmount: totals.total,
      reference: "SP" + String(Date.now()).slice(-7), bank: NS.data.settings.bank.name,
      account: NS.data.settings.bank.accountNumber, paidAt: now,
      qrContent: code, qrExpiredAt: NS.dateOnly(now) + "T23:59:59",
    };
    const order = {
      id: code, code, branchId: NS.state.branchId, branchName: NS.branch().name,
      createdAt: now, paidAt: now, cashierId: user.id, cashierName: user.name,
      orderType: pending.orderType, status: "paid", note: "Tạo từ POS prototype",
      items, subtotal: totals.subtotal, discount: totals.discount, total: totals.total,
      voucherCode: pending.voucherCode || "", payment, refunds: [],
    };
    NS.data.orders.unshift(order);
    if (pending.voucherCode) {
      const voucher = NS.get.voucher(pending.voucherCode);
      if (voucher) voucher.used += 1;
    }
    NS.state.lastOrderId = order.id;
    NS.state.cart = [];
    NS.state.pendingOrder = null;
    NS.state.voucherCode = "";
    NS.state.cashReceived = "";
    NS.state.checkoutState = "done";
    NS.addAudit("Thanh toán", "Đơn hàng", null, { order: order.code, method, amount: order.total });
    NS.saveData();
    NS.toast("Đã ghi nhận thanh toán " + order.code);
    NS.refresh();
  }

  NS.view("shift", {
    roles: NS.roles.pos,
    render() {
      const shift = NS.calc.currentShift(NS.state.branchId);
      const branch = NS.branch();
      if (!shift) return renderOpenShift(branch);
      const stats = NS.calc.shiftStats(shift);
      const txs = shift.transactions || [];
      return NS.ui.task({
        code: "POP-03",
        title: "Ca quỹ · " + branch.short,
        subtitle: "Quản lý tiền mặt đầu ca, thu chi giữa ca và đối soát khi đóng ca.",
        back: "#/pos",
        meta: '<span class="tag tag-success">Ca đang mở</span><span class="tag tag-neutral">' + esc(shift.cashierName) + '</span>',
        content: '<div class="kpi-strip"><div class="kpi"><div class="kpi__label">Tiền đầu ca</div><strong>' + NS.fmt.currency(shift.openingCash) + '</strong><small>Mở lúc ' + NS.fmt.timeShort(shift.openedAt) + '</small></div>' +
          '<div class="kpi"><div class="kpi__label">Doanh thu tiền mặt</div><strong>' + NS.fmt.currency(stats.cashSales) + '</strong><small>Chỉ đơn đã thanh toán</small></div>' +
          '<div class="kpi"><div class="kpi__label">Thu / chi giữa ca</div><strong>' + NS.fmt.currency(stats.cashIn) + ' / ' + NS.fmt.currency(stats.cashOut) + '</strong><small>' + txs.length + ' giao dịch</small></div>' +
          '<div class="kpi kpi--accent"><div class="kpi__label">Tiền lý thuyết</div><strong>' + NS.fmt.currency(stats.theoretical) + '</strong><small>Chưa gồm tiền thực đếm</small></div></div>' +
          '<div class="grid-2"><div class="panel"><div class="panel-head"><div><h2>Giao dịch tiền mặt giữa ca</h2><p>Thu/chi tiền mặt cần lý do và PIN quản lý.</p></div></div>' +
          '<form data-action="shift-transaction"><div class="form-grid form-grid--3"><div class="field"><label>Loại giao dịch</label><select class="select" name="type"><option value="cash_in">Thu tiền mặt</option><option value="cash_out">Chi tiền mặt</option></select></div>' +
          '<div class="field"><label>Số tiền <span class="req">*</span></label><input class="input" name="amount" inputmode="numeric" placeholder="0" required></div>' +
          '<div class="field"><label>PIN quản lý <span class="req">*</span></label><input class="input" name="pin" maxlength="4" inputmode="numeric" placeholder="1234" required></div>' +
          '<div class="field span-all"><label>Lý do <span class="req">*</span></label><input class="input" name="reason" placeholder="Ví dụ: bổ sung quỹ tiền lẻ" required></div></div>' +
          '<div class="form-actions"><button class="btn btn-primary" type="submit">Ghi nhận giao dịch</button></div></form></div>' +
          '<div class="panel"><div class="panel-head"><div><h2>Đối soát & đóng ca</h2><p>Nhập tiền thực đếm để tính chênh lệch.</p></div></div>' +
          '<div class="shift-stat mb-12"><div><span>Tiền lý thuyết</span><strong>' + NS.fmt.currency(stats.theoretical) + '</strong></div><div><span>Đã hoàn tiền</span><strong>' + NS.fmt.currency(stats.refunds) + '</strong></div><div><span>Chênh lệch tạm tính</span><strong>' + NS.fmt.currency(0) + '</strong></div></div>' +
          '<form data-action="shift-close"><div class="field mb-12"><label>Tiền thực đếm <span class="req">*</span></label><input class="input input-lg" name="counted" inputmode="numeric" placeholder="0" required></div>' +
          '<div class="field mb-12"><label>Lý do nếu lệch</label><textarea class="textarea" name="reason" placeholder="Bắt buộc khi có chênh lệch"></textarea></div>' +
          '<div class="form-actions"><button class="btn" type="button" data-action="shift-print">In biên bản</button><button class="btn btn-danger" type="submit">Đóng ca</button></div></form></div></div>' +
          '<div class="panel mt-24"><div class="panel-head"><div><h2>Lịch sử giao dịch ca</h2><p>' + txs.length + ' giao dịch trong ca hiện tại</p></div></div>' +
          '<div class="table-wrap"><table class="data"><thead><tr><th>Mã</th><th>Thời gian</th><th>Loại</th><th>Lý do</th><th>Người tạo</th><th class="num">Số tiền</th></tr></thead><tbody>' +
          (txs.length ? txs.map((t) => '<tr><td class="mono">' + esc(t.id) + '</td><td>' + NS.fmt.timeShort(t.at) + '</td><td>' + (t.type === "cash_in" ? "Thu" : "Chi") + '</td><td>' + esc(t.reason) + '</td><td>' + esc(t.by) + '</td><td class="num">' + (t.type === "cash_in" ? "+" : "−") + NS.fmt.currency(t.amount) + '</td></tr>').join("") : '<tr><td colspan="6">' + NS.ui.empty("Chưa có giao dịch", "Các khoản thu chi sẽ hiển thị tại đây.") + '</td></tr>') +
          '</tbody></table></div></div>',
        footer: '<span class="task-footer__note">Ca mở lúc ' + NS.fmt.datetime(shift.openedAt) + ' · Thu ngân ' + esc(shift.cashierName) + '</span><div class="flex gap-8"><a class="btn" href="#/pos">Về POS</a><button class="btn" data-action="shift-print">In biên bản bàn giao</button></div>',
      });
    },
    actions: {
      "shift-transaction"(ctx) {
        const shift = NS.calc.currentShift(NS.state.branchId);
        if (!shift) return;
        const data = ctx.data;
        const amount = Number(data.get("amount") || 0);
        const reason = String(data.get("reason") || "").trim();
        const pin = String(data.get("pin") || "");
        if (!amount || amount <= 0) { NS.toast("Số tiền phải lớn hơn 0.", "error"); return; }
        if (!reason) { NS.toast("Vui lòng nhập lý do giao dịch.", "error"); return; }
        if (pin !== "1234") { NS.toast("PIN quản lý chưa đúng. PIN demo: 1234.", "error"); return; }
        const user = NS.currentUser();
        shift.transactions.push({
          id: "CT-" + String(Date.now()).slice(-6), type: String(data.get("type")),
          amount, reason, at: localNow(), by: user.name, approvedBy: user.name,
        });
        NS.addAudit(data.get("type") === "cash_in" ? "Thu tiền mặt" : "Chi tiền mặt", "Ca quỹ", null, { amount, reason });
        NS.saveData();
        NS.toast("Đã ghi nhận giao dịch ca quỹ.");
        NS.refresh();
      },
      "shift-close"(ctx) {
        const shift = NS.calc.currentShift(NS.state.branchId);
        if (!shift) return;
        const counted = Number(ctx.data.get("counted") || 0);
        const reason = String(ctx.data.get("reason") || "").trim();
        const stats = NS.calc.shiftStats(shift);
        const variance = counted - stats.theoretical;
        if (variance !== 0 && !reason) {
          NS.toast("Có chênh lệch " + NS.fmt.currency(variance) + " — bắt buộc nhập lý do.", "error");
          return;
        }
        shift.countedCash = counted;
        shift.theoreticalCash = stats.theoretical;
        shift.differenceReason = reason;
        shift.closedAt = localNow();
        shift.status = "closed";
        shift.note = variance === 0 ? "Khớp quỹ" : "Chênh lệch " + NS.fmt.currency(variance);
        NS.addAudit("Đóng ca", "Ca quỹ", null, { shift: shift.id, counted, theoretical: stats.theoretical, variance, reason });
        if (Math.abs(variance) > Number(NS.data.settings.cashVarianceTolerance || 0)) {
          NS.data.approvals.unshift({
            id: "AP-" + String(Date.now()).slice(-6), type: "cash_variance", branchId: shift.branchId,
            createdAt: localNow(), requestedBy: shift.cashierName, amount: Math.abs(variance),
            reason: reason || "Chênh lệch quỹ khi đóng ca", status: "pending",
            relatedId: shift.id, note: "Tự động tạo do vượt ngưỡng chênh lệch quỹ.",
            details: "Chênh lệch " + (variance > 0 ? "thừa" : "thiếu") + " " + NS.fmt.currency(Math.abs(variance)) + " khi đóng ca.",
          });
        }
        NS.saveData();
        NS.toast("Đã đóng ca quỹ.");
        NS.refresh();
      },
      "shift-print"() {
        NS.toast("Đang mở biên bản bàn giao để in...");
        setTimeout(() => window.print(), 250);
      },
    },
  });
  NS.route("/shift", "shift");

  function renderOpenShift(branch) {
    return NS.ui.task({
      code: "POP-03",
      title: "Mở ca quỹ · " + branch.short,
      subtitle: "Khai báo tiền mặt đầu ca trước khi bắt đầu bán hàng.",
      back: "#/pos",
      meta: '<span class="tag tag-pending">Chưa mở ca</span>',
      content: '<div class="panel" style="max-width:680px;margin:30px auto"><div class="panel-head"><div><h2>Thông tin mở ca</h2><p>Chi nhánh ' + esc(branch.name) + ' · ' + esc(NS.fmt.date(NS.today())) + '</p></div></div>' +
        '<form data-action="shift-open"><div class="form-grid"><div class="field"><label>Thu ngân</label><input class="input" value="' + esc(NS.currentUser().name) + '" readonly></div>' +
        '<div class="field"><label>Giờ mở ca</label><input class="input" value="' + esc(NS.fmt.clock()) + '" readonly></div>' +
        '<div class="field"><label>Tiền đầu ca <span class="req">*</span></label><input class="input input-lg" name="openingCash" inputmode="numeric" value="500000" required></div>' +
        '<div class="field"><label>PIN quản lý <span class="req">*</span></label><input class="input" name="pin" maxlength="4" inputmode="numeric" placeholder="1234" required></div>' +
        '<div class="field span-all"><label>Ghi chú</label><textarea class="textarea" name="note" placeholder="Tình trạng quỹ đầu ca, bàn giao..."></textarea></div></div>' +
        '<div class="form-actions"><a class="btn" href="#/pos">Hủy</a><button class="btn btn-primary" type="submit">Mở ca</button></div></form></div>',
    });
  }

  NS.view("shiftOpen", {
    roles: NS.roles.pos,
    render() {
      return renderOpenShift(NS.branch());
    },
    actions: {},
  });

  // Attach shift-open action to the shift view as well (the empty state renders in the same view).
  const shiftView = NS.views.shift;
  shiftView.actions["shift-open"] = function (ctx) {
    const cash = Number(ctx.data.get("openingCash") || 0);
    const pin = String(ctx.data.get("pin") || "");
    if (!cash || cash < 0) { NS.toast("Tiền đầu ca không hợp lệ.", "error"); return; }
    if (pin !== "1234") { NS.toast("PIN quản lý chưa đúng. PIN demo: 1234.", "error"); return; }
    const user = NS.currentUser();
    const id = "SH-" + NS.today().slice(2).replace(/-/g, "") + "-" + String(Date.now()).slice(-3);
    NS.data.shifts.push({
      id, branchId: NS.state.branchId, cashierId: user.id, cashierName: user.name,
      openedAt: localNow(), closedAt: null, openingCash: cash, countedCash: null,
      theoreticalCash: null, differenceReason: "", status: "open", transactions: [],
      note: String(ctx.data.get("note") || ""),
    });
    NS.addAudit("Mở ca", "Ca quỹ", null, { shift: id, openingCash: cash });
    NS.saveData();
    NS.toast("Đã mở ca quỹ.");
    NS.refresh();
  };
})();
