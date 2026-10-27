/* SCMS prototype — deterministic mock data */
(function () {
  const NS = (window.SCMS = window.SCMS || {});
  const TODAY = "2026-10-20";
  let seed = 20261020;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const int = (min, max) => min + Math.floor(rnd() * (max - min + 1));
  const pad = (n) => String(n).padStart(2, "0");
  const money = (n) => Math.round(n);
  const iso = (date, hour, minute, second) =>
    date + "T" + pad(hour) + ":" + pad(minute || 0) + ":" + pad(second || 0);
  const addDays = (date, offset) => {
    const d = new Date(date + "T12:00:00");
    d.setDate(d.getDate() + offset);
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  };
  const addMinutes = (dateTime, minutes) => {
    const d = new Date(dateTime);
    d.setMinutes(d.getMinutes() + minutes);
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) +
      "T" + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
  };
  const days = [];
  for (let i = -6; i <= 0; i++) days.push(addDays(TODAY, i));

  /* ---------------- Branches ---------------- */
  const branches = [
    { id: "D1", code: "CN-01", name: "Quận 1 — Sài Gòn", short: "Quận 1", address: "42 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM", phone: "028 3822 1188", open: "06:00", close: "23:00", tables: 26, managerId: "M01", manager: "Nguyễn Thu Trang", status: "open", posStatus: "online", taxCode: "0312456789", createdAt: "2024-02-12T09:00:00" },
    { id: "D2", code: "CN-02", name: "Thảo Điền — Sài Gòn", short: "Thảo Điền", address: "18 Thảo Điền, Phường Thảo Điền, TP. Thủ Đức, TP.HCM", phone: "028 3744 2266", open: "06:00", close: "23:00", tables: 20, managerId: "M02", manager: "Trần Minh Quân", status: "open", posStatus: "online", taxCode: "0312456790", createdAt: "2024-05-08T09:00:00" },
    { id: "D3", code: "CN-03", name: "Cầu Giấy — Hà Nội", short: "Cầu Giấy", address: "116 Xuân Thủy, Phường Dịch Vọng Hậu, Cầu Giấy, Hà Nội", phone: "024 3756 8899", open: "06:00", close: "23:00", tables: 24, managerId: "M03", manager: "Lê Hoàng Anh", status: "open", posStatus: "online", taxCode: "0109876543", createdAt: "2024-07-21T09:00:00" },
    { id: "D4", code: "CN-04", name: "Hoàn Kiếm — Hà Nội", short: "Hoàn Kiếm", address: "35 Hàng Bài, Phường Tràng Tiền, Hoàn Kiếm, Hà Nội", phone: "024 3938 1177", open: "06:00", close: "23:00", tables: 18, managerId: "M04", manager: "Phạm Ngọc Mai", status: "open", posStatus: "online", taxCode: "0109876544", createdAt: "2024-09-03T09:00:00" },
    { id: "D5", code: "CN-05", name: "Hải Châu — Đà Nẵng", short: "Hải Châu", address: "88 Bạch Đằng, Phường Hải Châu 1, Hải Châu, Đà Nẵng", phone: "0236 355 7799", open: "06:00", close: "23:00", tables: 22, managerId: "M05", manager: "Đỗ Văn Hùng", status: "open", posStatus: "online", taxCode: "0401234567", createdAt: "2025-01-15T09:00:00" },
    { id: "D6", code: "CN-06", name: "Ninh Kiều — Cần Thơ", short: "Ninh Kiều", address: "12 Hòa Bình, Phường Tân An, Ninh Kiều, Cần Thơ", phone: "0292 381 6688", open: "06:00", close: "23:00", tables: 16, managerId: "M06", manager: "Vũ Thị Lan", status: "open", posStatus: "online", taxCode: "1801234567", createdAt: "2025-03-19T09:00:00" },
    { id: "D7", code: "CN-07", name: "Lê Chân — Hải Phòng", short: "Hải Phòng", address: "56 Lạch Tray, Phường Kênh Dương, Lê Chân, Hải Phòng", phone: "0225 384 1122", open: "06:00", close: "23:00", tables: 20, managerId: "M07", manager: "Bùi Quốc Bảo", status: "maintenance", posStatus: "offline", taxCode: "0201234567", createdAt: "2025-06-11T09:00:00" },
    { id: "D8", code: "CN-08", name: "Tân Bình — Sài Gòn", short: "Tân Bình", address: "140 Cộng Hòa, Phường 12, Tân Bình, TP.HCM", phone: "028 3811 4455", open: "06:00", close: "23:00", tables: 28, managerId: "M08", manager: "Hoàng Thanh Hà", status: "open", posStatus: "online", taxCode: "0312456791", createdAt: "2025-08-27T09:00:00" },
  ];

  /* ---------------- Employees ---------------- */
  const managerNames = ["Nguyễn Thu Trang", "Trần Minh Quân", "Lê Hoàng Anh", "Phạm Ngọc Mai", "Đỗ Văn Hùng", "Vũ Thị Lan", "Bùi Quốc Bảo", "Hoàng Thanh Hà"];
  const cashierNames = ["Nguyễn Mai Linh", "Trần Quốc Khánh", "Lê Thị Hồng", "Phạm Đức Long", "Võ Thùy Dương", "Đặng Minh Tâm", "Nguyễn Bảo Ngọc", "Trịnh Văn Nam"];
  const staffNames = ["Nguyễn Hải Yến", "Trần Gia Bảo", "Lê Nhật Minh", "Phạm Thanh Tùng"];
  const employees = [];
  employees.push({ id: "E00", code: "NV-000", name: "Lê Anh Tuấn", phone: "0901234567", email: "coo@smartcafe.vn", username: "coo", pin: "9999", card: "RFID-000", role: "COO", status: "active", branchId: "D1", baseSalary: 0, hourlyRate: 0, createdAt: "2023-12-01T08:00:00", note: "Điều hành toàn chuỗi" });
  branches.forEach((b, i) => {
    employees.push({ id: b.managerId, code: "NV-M" + pad(i + 1), name: managerNames[i], phone: "090" + (1000000 + i * 11111), email: "manager.d" + (i + 1) + "@smartcafe.vn", username: "manager_d" + (i + 1), pin: "2" + pad(i + 1) + "1", card: "RFID-M" + pad(i + 1), role: "Branch Manager", status: i === 6 ? "inactive" : "active", branchId: b.id, baseSalary: 12000000, hourlyRate: 65000, createdAt: b.createdAt, note: "Quản lý chi nhánh" });
  });
  branches.forEach((b, i) => {
    employees.push({ id: "C" + pad(i + 1), code: "NV-C" + pad(i + 1), name: cashierNames[i], phone: "091" + (2000000 + i * 12345), email: "cashier" + (i + 1) + "@smartcafe.vn", username: i === 0 ? "cashier01" : "cashier0" + (i + 1), pin: "3" + pad(i + 1) + "2", card: "RFID-C" + pad(i + 1), role: "Cashier", status: "active", branchId: b.id, baseSalary: 6500000, hourlyRate: 32000, createdAt: "2025-02-10T09:00:00", note: "" });
  });
  staffNames.forEach((name, i) => {
    const branch = branches[i];
    employees.push({ id: "S" + pad(i + 1), code: "NV-S" + pad(i + 1), name, phone: "098" + (3000000 + i * 22222), email: "staff" + (i + 1) + "@smartcafe.vn", username: "", pin: "4" + pad(i + 1) + "3", card: "RFID-S" + pad(i + 1), role: "Staff", status: "active", branchId: branch.id, baseSalary: 5500000, hourlyRate: 28000, createdAt: "2025-04-18T09:00:00", note: "Barista" });
  });
  const cashiersFor = (branchId) => employees.filter((e) => e.branchId === branchId && e.role === "Cashier" && e.status === "active");
  const staffFor = (branchId) => employees.filter((e) => e.branchId === branchId && (e.role === "Staff" || e.role === "Cashier") && e.status === "active");

  /* ---------------- Catalog ---------------- */
  const categories = ["Cà phê", "Trà", "Đá xay", "Bánh", "Khác"];
  const toppings = [
    { id: "T01", name: "Trân châu trắng", price: 8000 },
    { id: "T02", name: "Thạch đào", price: 8000 },
    { id: "T03", name: "Kem phô mai", price: 12000 },
    { id: "T04", name: "Espresso shot", price: 10000 },
    { id: "T05", name: "Kem tươi", price: 8000 },
  ];
  const productSeed = [
    ["CF01", "Cà phê sữa đá", "Cà phê", 29000, 35000, 41000, "Cà phê phin truyền thống, sữa đặc, đá viên.", ["T04"]],
    ["CF02", "Cà phê đen đá", "Cà phê", 25000, 29000, 33000, "Cà phê nguyên chất, đậm vị rang mộc.", ["T04"]],
    ["CF03", "Bạc xỉu", "Cà phê", 32000, 39000, 45000, "Nhiều sữa, cà phê nhẹ, phù hợp buổi sáng.", ["T04", "T05"]],
    ["CF04", "Latte", "Cà phê", 39000, 45000, 52000, "Espresso, sữa tươi đánh mịn.", ["T04"]],
    ["CF05", "Cappuccino", "Cà phê", 39000, 45000, 52000, "Espresso, bọt sữa dày.", ["T04"]],
    ["CF06", "Americano", "Cà phê", 29000, 35000, 39000, "Espresso và nước, vị thanh.", ["T04"]],
    ["CF07", "Espresso", "Cà phê", 25000, 29000, 33000, "Một shot espresso đậm đặc.", []],
    ["CF08", "Cold Brew", "Cà phê", 42000, 49000, 56000, "Ủ lạnh 18 giờ, hậu vị ngọt dịu.", ["T04"]],
    ["TE01", "Trà đào cam sả", "Trà", 35000, 42000, 49000, "Trà đen, đào ngâm, cam tươi, sả.", ["T02"]],
    ["TE02", "Trà sen vàng", "Trà", 38000, 45000, 52000, "Trà oolong, hạt sen, củ sen.", []],
    ["TE03", "Trà xanh matcha", "Trà", 39000, 46000, 53000, "Matcha Nhật, sữa tươi.", ["T05"]],
    ["TE04", "Trà chanh sả", "Trà", 29000, 35000, 39000, "Trà xanh, chanh tươi, sả.", []],
    ["TE05", "Trà oolong sữa", "Trà", 36000, 43000, 50000, "Oolong, sữa, topping tùy chọn.", ["T01", "T05"]],
    ["BL01", "Cà phê đá xay", "Đá xay", 45000, 52000, 59000, "Cà phê, sữa, đá xay mịn.", ["T05"]],
    ["BL02", "Matcha đá xay", "Đá xay", 45000, 52000, 59000, "Matcha, sữa, đá xay.", ["T05"]],
    ["BL03", "Cookie đá xay", "Đá xay", 45000, 52000, 59000, "Bánh quy giòn, sữa, đá xay.", ["T05"]],
    ["BL04", "Socola đá xay", "Đá xay", 42000, 49000, 56000, "Cacao, sữa, đá xay.", ["T05"]],
    ["BA01", "Croissant bơ", "Bánh", 32000, 32000, 32000, "Bánh sừng bò bơ Pháp.", []],
    ["BA02", "Bánh mì que", "Bánh", 25000, 25000, 25000, "Bánh mì que giòn, pate.", []],
    ["BA03", "Tiramisu", "Bánh", 39000, 39000, 39000, "Mascarpone, cà phê, cacao.", []],
    ["BA04", "Cookie hạt dẻ", "Bánh", 29000, 29000, 29000, "Cookie bơ, hạt dẻ.", []],
    ["OT01", "Bánh flan", "Khác", 25000, 25000, 25000, "Flan trứng, caramel.", []],
    ["OT02", "Sữa chua cà phê", "Khác", 30000, 30000, 30000, "Sữa chua, cà phê, đá.", []],
    ["OT03", "Nước suối", "Khác", 15000, 15000, 15000, "Chai 500ml.", []],
  ];
  const products = productSeed.map((p, i) => ({
    id: "P" + pad(i + 1),
    code: p[0],
    name: p[1],
    category: p[2],
    description: p[6],
    status: i === 22 ? "inactive" : "active",
    prices: { S: p[3], M: p[4], L: p[5] },
    toppings: p[7],
    pausedBranches: i === 16 ? ["D7"] : [],
    createdAt: "2025-01-05T09:00:00",
  }));

  /* ---------------- Ingredients & BOM ---------------- */
  const ingredients = [
    { id: "I01", code: "NL-001", name: "Cà phê Arabica", category: "Cà phê", baseUnit: "g", packUnit: "kg", conversionRatio: 1000, onHandBase: 12500, minStock: 5000, unitCost: 0.32, supplier: "Nestlé Professional" },
    { id: "I02", code: "NL-002", name: "Cà phê Robusta", category: "Cà phê", baseUnit: "g", packUnit: "kg", conversionRatio: 1000, onHandBase: 7200, minStock: 4000, unitCost: 0.28, supplier: "Nestlé Professional" },
    { id: "I03", code: "NL-003", name: "Sữa đặc", category: "Sữa & kem", baseUnit: "ml", packUnit: "lon", conversionRatio: 1000, onHandBase: 8600, minStock: 3000, unitCost: 0.045, supplier: "Vinamilk" },
    { id: "I04", code: "NL-004", name: "Sữa tươi", category: "Sữa & kem", baseUnit: "ml", packUnit: "thùng", conversionRatio: 12000, onHandBase: 18000, minStock: 6000, unitCost: 0.028, supplier: "TH True Milk" },
    { id: "I05", code: "NL-005", name: "Đường mía", category: "Bột & bánh", baseUnit: "g", packUnit: "kg", conversionRatio: 1000, onHandBase: 7000, minStock: 2000, unitCost: 0.022, supplier: "Biên Hòa Sugar" },
    { id: "I06", code: "NL-006", name: "Trà đào", category: "Trà & syrup", baseUnit: "g", packUnit: "kg", conversionRatio: 1000, onHandBase: 2200, minStock: 1000, unitCost: 0.18, supplier: "Phúc Long" },
    { id: "I07", code: "NL-007", name: "Trà oolong", category: "Trà & syrup", baseUnit: "g", packUnit: "kg", conversionRatio: 1000, onHandBase: 900, minStock: 800, unitCost: 0.22, supplier: "Phúc Long" },
    { id: "I08", code: "NL-008", name: "Matcha", category: "Trà & syrup", baseUnit: "g", packUnit: "kg", conversionRatio: 1000, onHandBase: 900, minStock: 500, unitCost: 0.65, supplier: "Marukyu Koyamaen" },
    { id: "I09", code: "NL-009", name: "Syrup đào", category: "Trà & syrup", baseUnit: "ml", packUnit: "chai", conversionRatio: 1000, onHandBase: 3200, minStock: 1500, unitCost: 0.09, supplier: "Monin" },
    { id: "I10", code: "NL-010", name: "Syrup chanh sả", category: "Trà & syrup", baseUnit: "ml", packUnit: "chai", conversionRatio: 1000, onHandBase: 2800, minStock: 1200, unitCost: 0.08, supplier: "Monin" },
    { id: "I11", code: "NL-011", name: "Đá viên", category: "Đá", baseUnit: "g", packUnit: "bao", conversionRatio: 10000, onHandBase: 32000, minStock: 10000, unitCost: 0.002, supplier: "Đá sạch Sài Gòn" },
    { id: "I12", code: "NL-012", name: "Ly nhựa 500ml", category: "Ly & vật tư", baseUnit: "cái", packUnit: "thùng", conversionRatio: 1000, onHandBase: 2800, minStock: 800, unitCost: 0.9, supplier: "Bao bì Minh Phát" },
    { id: "I13", code: "NL-013", name: "Ly nhựa 700ml", category: "Ly & vật tư", baseUnit: "cái", packUnit: "thùng", conversionRatio: 1000, onHandBase: 2200, minStock: 700, unitCost: 1.1, supplier: "Bao bì Minh Phát" },
    { id: "I14", code: "NL-014", name: "Nắp ly", category: "Ly & vật tư", baseUnit: "cái", packUnit: "thùng", conversionRatio: 1000, onHandBase: 2600, minStock: 900, unitCost: 0.35, supplier: "Bao bì Minh Phát" },
    { id: "I15", code: "NL-015", name: "Ống hút", category: "Ly & vật tư", baseUnit: "cái", packUnit: "thùng", conversionRatio: 1000, onHandBase: 3000, minStock: 1000, unitCost: 0.18, supplier: "Bao bì Minh Phát" },
    { id: "I16", code: "NL-016", name: "Bột cacao", category: "Bột & bánh", baseUnit: "g", packUnit: "kg", conversionRatio: 1000, onHandBase: 600, minStock: 300, unitCost: 0.38, supplier: "Barry Callebaut" },
    { id: "I17", code: "NL-017", name: "Bơ", category: "Bột & bánh", baseUnit: "g", packUnit: "kg", conversionRatio: 1000, onHandBase: 400, minStock: 200, unitCost: 0.22, supplier: "Anchor" },
    { id: "I18", code: "NL-018", name: "Bột mì", category: "Bột & bánh", baseUnit: "g", packUnit: "kg", conversionRatio: 1000, onHandBase: 3000, minStock: 1000, unitCost: 0.025, supplier: "Bột mì Đại Phong" },
  ];

  ingredients.forEach((ing) => { ing.unitCost = Math.round(ing.unitCost * 1000); });

  const bom = {};
  const recipe = (s, m, l) => ({ S: s, M: m, L: l });
  const L = (id, qty) => [id, qty];
  bom.P1 = recipe([L("I01", 12), L("I03", 60), L("I05", 8), L("I11", 90), L("I12", 1), L("I14", 1), L("I15", 1)], [L("I01", 18), L("I03", 80), L("I05", 10), L("I11", 110), L("I12", 1), L("I14", 1), L("I15", 1)], [L("I01", 24), L("I03", 100), L("I05", 12), L("I11", 130), L("I13", 1), L("I14", 1), L("I15", 1)]);
  bom.P2 = recipe([L("I01", 14), L("I05", 5), L("I11", 90), L("I12", 1), L("I14", 1), L("I15", 1)], [L("I01", 18), L("I05", 6), L("I11", 110), L("I12", 1), L("I14", 1), L("I15", 1)], [L("I01", 24), L("I05", 8), L("I11", 130), L("I13", 1), L("I14", 1), L("I15", 1)]);
  bom.P3 = recipe([L("I01", 10), L("I03", 70), L("I04", 40), L("I11", 90), L("I12", 1), L("I14", 1), L("I15", 1)], [L("I01", 14), L("I03", 90), L("I04", 50), L("I11", 110), L("I12", 1), L("I14", 1), L("I15", 1)], [L("I01", 18), L("I03", 110), L("I04", 60), L("I11", 130), L("I13", 1), L("I14", 1), L("I15", 1)]);
  bom.P4 = recipe([L("I01", 12), L("I04", 100), L("I11", 80), L("I12", 1), L("I14", 1), L("I15", 1)], [L("I01", 16), L("I04", 130), L("I11", 100), L("I12", 1), L("I14", 1), L("I15", 1)], [L("I01", 20), L("I04", 160), L("I11", 120), L("I13", 1), L("I14", 1), L("I15", 1)]);
  bom.P5 = recipe([L("I01", 12), L("I04", 90), L("I11", 80), L("I12", 1), L("I14", 1), L("I15", 1)], [L("I01", 16), L("I04", 120), L("I11", 100), L("I12", 1), L("I14", 1), L("I15", 1)], [L("I01", 20), L("I04", 150), L("I11", 120), L("I13", 1), L("I14", 1), L("I15", 1)]);
  bom.P6 = recipe([L("I01", 14), L("I11", 90), L("I12", 1), L("I14", 1), L("I15", 1)], [L("I01", 18), L("I11", 110), L("I12", 1), L("I14", 1), L("I15", 1)], [L("I01", 24), L("I11", 130), L("I13", 1), L("I14", 1), L("I15", 1)]);
  bom.P8 = recipe([L("I01", 18), L("I11", 100), L("I12", 1), L("I14", 1), L("I15", 1)], [L("I01", 24), L("I11", 120), L("I12", 1), L("I14", 1), L("I15", 1)], [L("I01", 30), L("I11", 140), L("I13", 1), L("I14", 1), L("I15", 1)]);
  bom.P9 = recipe([L("I06", 8), L("I09", 30), L("I11", 90), L("I12", 1), L("I14", 1), L("I15", 1)], [L("I06", 10), L("I09", 40), L("I11", 110), L("I12", 1), L("I14", 1), L("I15", 1)], [L("I06", 12), L("I09", 50), L("I11", 130), L("I13", 1), L("I14", 1), L("I15", 1)]);
  bom.P10 = recipe([L("I07", 8), L("I05", 8), L("I11", 90), L("I12", 1), L("I14", 1), L("I15", 1)], [L("I07", 10), L("I05", 10), L("I11", 110), L("I12", 1), L("I14", 1), L("I15", 1)], [L("I07", 12), L("I05", 12), L("I11", 130), L("I13", 1), L("I14", 1), L("I15", 1)]);
  bom.P11 = recipe([L("I08", 5), L("I04", 90), L("I05", 6), L("I11", 90), L("I12", 1), L("I14", 1), L("I15", 1)], [L("I08", 7), L("I04", 120), L("I05", 8), L("I11", 110), L("I12", 1), L("I14", 1), L("I15", 1)], [L("I08", 9), L("I04", 150), L("I05", 10), L("I11", 130), L("I13", 1), L("I14", 1), L("I15", 1)]);
  bom.P12 = recipe([L("I07", 6), L("I10", 25), L("I11", 90), L("I12", 1), L("I14", 1), L("I15", 1)], [L("I07", 8), L("I10", 35), L("I11", 110), L("I12", 1), L("I14", 1), L("I15", 1)], [L("I07", 10), L("I10", 45), L("I11", 130), L("I13", 1), L("I14", 1), L("I15", 1)]);
  bom.P13 = recipe([L("I07", 8), L("I04", 80), L("I05", 6), L("I11", 90), L("I12", 1), L("I14", 1), L("I15", 1)], [L("I07", 10), L("I04", 110), L("I05", 8), L("I11", 110), L("I12", 1), L("I14", 1), L("I15", 1)], [L("I07", 12), L("I04", 140), L("I05", 10), L("I11", 130), L("I13", 1), L("I14", 1), L("I15", 1)]);
  bom.P14 = recipe([L("I01", 10), L("I04", 70), L("I11", 120), L("I12", 1), L("I14", 1), L("I15", 1)], [L("I01", 14), L("I04", 90), L("I11", 150), L("I12", 1), L("I14", 1), L("I15", 1)], [L("I01", 18), L("I04", 110), L("I11", 180), L("I13", 1), L("I14", 1), L("I15", 1)]);
  bom.P15 = recipe([L("I08", 5), L("I04", 80), L("I11", 120), L("I12", 1), L("I14", 1), L("I15", 1)], [L("I08", 7), L("I04", 100), L("I11", 150), L("I12", 1), L("I14", 1), L("I15", 1)], [L("I08", 9), L("I04", 120), L("I11", 180), L("I13", 1), L("I14", 1), L("I15", 1)]);
  bom.P16 = recipe([L("I18", 50), L("I17", 20), L("I05", 8), L("I11", 100), L("I12", 1), L("I14", 1), L("I15", 1)], [L("I18", 60), L("I17", 25), L("I05", 10), L("I11", 120), L("I12", 1), L("I14", 1), L("I15", 1)], [L("I18", 75), L("I17", 30), L("I05", 12), L("I11", 140), L("I13", 1), L("I14", 1), L("I15", 1)]);
  bom.P17 = recipe([L("I16", 8), L("I04", 80), L("I11", 120), L("I12", 1), L("I14", 1), L("I15", 1)], [L("I16", 10), L("I04", 100), L("I11", 150), L("I12", 1), L("I14", 1), L("I15", 1)], [L("I16", 12), L("I04", 120), L("I11", 180), L("I13", 1), L("I14", 1), L("I15", 1)]);
  bom.P18 = recipe([L("I18", 55), L("I17", 22)], [L("I18", 60), L("I17", 25)], [L("I18", 65), L("I17", 28)]);
  bom.P19 = recipe([L("I18", 65), L("I17", 18)], [L("I18", 70), L("I17", 20)], [L("I18", 75), L("I17", 22)]);
  bom.P21 = recipe([L("I18", 45), L("I17", 18), L("I05", 15)], [L("I18", 50), L("I17", 20), L("I05", 18)], [L("I18", 55), L("I17", 22), L("I05", 20)]);
  bom.P22 = recipe([L("I18", 60), L("I17", 24), L("I05", 20)], [L("I18", 65), L("I17", 26), L("I05", 22)], [L("I18", 70), L("I17", 28), L("I05", 24)]);
  bom.P07 = recipe([L("I01", 16), L("I12", 1), L("I14", 1)], [L("I01", 22), L("I12", 1), L("I14", 1)], [L("I01", 28), L("I13", 1), L("I14", 1)]);
  bom.P20 = recipe([L("I18", 30), L("I04", 50), L("I16", 10), L("I17", 30), L("I05", 15)], [L("I18", 35), L("I04", 60), L("I16", 12), L("I17", 35), L("I05", 18)], [L("I18", 40), L("I04", 70), L("I16", 14), L("I17", 40), L("I05", 20)]);
  bom.P23 = recipe([L("I01", 10), L("I03", 40), L("I05", 8), L("I12", 1), L("I14", 1), L("I15", 1)], [L("I01", 12), L("I03", 50), L("I05", 10), L("I12", 1), L("I14", 1), L("I15", 1)], [L("I01", 14), L("I03", 60), L("I05", 12), L("I13", 1), L("I14", 1), L("I15", 1)]);
  bom.P24 = recipe([L("I12", 1), L("I14", 1)], [L("I12", 1), L("I14", 1)], [L("I13", 1), L("I14", 1)]);
  Object.keys(bom).forEach((key) => {
    const padded = "P" + key.slice(1).padStart(2, "0");
    if (padded !== key) { bom[padded] = bom[key]; delete bom[key]; }
  });

  /* ---------------- Vouchers ---------------- */
  const vouchers = [
    { id: "V01", code: "GIAM10", type: "percent", value: 10, minOrder: 100000, start: "2026-10-01", end: "2026-10-31", usageLimit: 200, used: 42, status: "active", branches: ["all"], happyHour: "", description: "Giảm 10% toàn menu" },
    { id: "V02", code: "SANG20", type: "percent", value: 20, minOrder: 50000, start: "2026-10-01", end: "2026-12-31", usageLimit: 100, used: 17, status: "active", branches: ["all"], happyHour: "06:00-09:00", description: "Ưu đãi khung sáng" },
    { id: "V03", code: "COMBO50", type: "fixed", value: 50000, minOrder: 250000, start: "2026-10-10", end: "2026-11-10", usageLimit: 80, used: 11, status: "active", branches: ["D1", "D2", "D8"], happyHour: "", description: "Giảm 50.000 cho đơn nhóm" },
    { id: "V04", code: "FREESHIP", type: "fixed", value: 15000, minOrder: 80000, start: "2026-09-01", end: "2026-12-31", usageLimit: 500, used: 236, status: "active", branches: ["all"], happyHour: "", description: "Hỗ trợ phí giao" },
    { id: "V05", code: "HE30", type: "percent", value: 30, minOrder: 120000, start: "2026-10-01", end: "2026-10-15", usageLimit: 120, used: 120, status: "expired", branches: ["all"], happyHour: "", description: "Chương trình khai trương" },
    { id: "V06", code: "MEMBER15", type: "percent", value: 15, minOrder: 0, start: "2026-10-01", end: "2026-12-31", usageLimit: 300, used: 51, status: "active", branches: ["all"], happyHour: "", description: "Ưu đãi thành viên" },
    { id: "V07", code: "TRAISUA20", type: "percent", value: 20, minOrder: 90000, start: "2026-09-20", end: "2026-10-25", usageLimit: 150, used: 64, status: "paused", branches: ["D3", "D4"], happyHour: "14:00-17:00", description: "Giờ trà chiều" },
    { id: "V08", code: "NEWBIE20", type: "percent", value: 20, minOrder: 60000, start: "2026-10-18", end: "2026-11-30", usageLimit: 200, used: 3, status: "active", branches: ["all"], happyHour: "", description: "Ưu đãi khách mới" },
  ];

  /* ---------------- Shift templates & schedule ---------------- */
  const shiftTemplates = {
    morning: { code: "morning", name: "Ca sáng", start: "06:00", end: "12:00" },
    afternoon: { code: "afternoon", name: "Ca chiều", start: "12:00", end: "18:00" },
    evening: { code: "evening", name: "Ca tối", start: "18:00", end: "23:00" },
  };
  const schedule = {};
  const weekStart = addDays(TODAY, -1);
  const weekDays = [];
  for (let i = 0; i < 7; i++) weekDays.push(addDays(weekStart, i));
  employees.forEach((e) => {
    if (e.role === "COO") return;
    weekDays.forEach((d, idx) => {
      const off = (idx + e.id.charCodeAt(e.id.length - 1)) % 6 === 0;
      if (off) return;
      if (e.role === "Branch Manager" && idx === 0) return;
      const shift = idx < 2 ? "morning" : idx < 5 ? "afternoon" : idx === 5 ? "evening" : "morning";
      schedule[e.id + "|" + d] = shift;
    });
  });

  /* ---------------- Attendance ---------------- */
  const statuses = ["on_time", "on_time", "on_time", "late", "early", "missing"];
  const attendance = [];
  let attendanceNo = 1;
  employees.forEach((e) => {
    if (e.role === "COO") return;
    days.forEach((d) => {
      const shiftCode = schedule[e.id + "|" + d];
      if (!shiftCode) return;
      const tpl = shiftTemplates[shiftCode];
      const [sh, sm] = tpl.start.split(":").map(Number);
      const [eh, em] = tpl.end.split(":").map(Number);
      const isToday = d === TODAY;
      let status = pick(statuses);
      let checkInMin = sm + (status === "late" ? int(6, 24) : int(-8, 4));
      let checkIn = iso(d, sh, Math.max(0, checkInMin));
      let checkOut = null;
      let minutesLate = status === "late" ? Math.max(0, checkInMin - sm) : 0;
      let minutesEarly = 0;
      let hours = null;
      if (!isToday) {
        if (status === "missing") {
          checkOut = null;
        } else {
          const outMin = em - (status === "early" ? int(5, 20) : int(0, 5));
          checkOut = iso(d, eh, outMin);
          minutesEarly = status === "early" ? Math.max(0, em - outMin) : 0;
          hours = Math.max(0.5, (outMin + (eh - sh) * 60 - checkInMin) / 60);
        }
      } else {
        const nowMin = 14 * 60 + 30;
        const startMin = sh * 60;
        if (status === "absent") {
          checkIn = null;
        } else if (nowMin - startMin > 60) {
          checkOut = status === "missing" ? null : iso(d, 12, int(0, 8));
          if (checkOut) {
            hours = Math.max(0.5, (12 * 60 + 5 - (sh * 60 + checkInMin)) / 60);
          }
        }
      }
      if (checkIn === null && status !== "absent") checkIn = iso(d, sh, sm);
      attendance.push({
        id: "ATT-" + String(attendanceNo++).padStart(4, "0"),
        employeeId: e.id,
        branchId: e.branchId,
        workDate: d,
        checkIn: checkIn,
        checkOut: checkOut,
        method: rnd() > 0.4 ? "PIN" : "RFID",
        status: status === "absent" ? "absent" : status,
        minutesLate: minutesLate,
        minutesEarly: minutesEarly,
        hours: hours ? Math.round(hours * 100) / 100 : null,
        note: status === "missing" ? "Chưa check-out — cần quản lý xác nhận" : "",
      });
    });
  });

  /* ---------------- Orders ---------------- */
  const orders = [];
  const refundReasons = ["Khách đổi ý", "Sai món", "Chất lượng chưa đạt", "Khác"];
  const sugarOptions = ["100%", "70%", "50%", "Không đường"];
  const iceOptions = ["100% đá", "Ít đá", "Không đá"];
  const paymentBanks = ["MBBank", "Techcombank", "Vietcombank", "ACB"];
  let orderCounter = 0;
  const activeProducts = products.filter((p) => p.status === "active");

  function productById(id) { return products.find((p) => p.id === id); }
  function toppingById(id) { return toppings.find((t) => t.id === id); }
  function sizePrice(product, size) { return product.prices[size] || product.prices.M; }

  function makeOrder(branch, date, hourLimit, forcedStatus, forcedMethod) {
    orderCounter++;
    const code = "ORD-" + date.slice(2).replace(/-/g, "") + "-" + String(orderCounter).padStart(3, "0");
    const cashier = cashiersFor(branch.id)[0] || employees.find((e) => e.branchId === branch.id && e.role === "Branch Manager");
    const hour = int(6, hourLimit);
    const minute = int(0, 59);
    const createdAt = iso(date, hour, minute);
    const itemCount = int(1, 3);
    const lineItems = [];
    const used = new Set();
    for (let i = 0; i < itemCount; i++) {
      let product = pick(activeProducts);
      let guard = 0;
      while (used.has(product.id) && guard < 12) { product = pick(activeProducts); guard++; }
      used.add(product.id);
      const size = rnd() < 0.55 ? "M" : rnd() < 0.75 ? "S" : "L";
      const toppingIds = product.toppings.length && rnd() < 0.3 ? [product.toppings[0]] : [];
      const qty = int(1, 2);
      const unitPrice = sizePrice(product, size) + toppingIds.reduce((s, id) => s + toppingById(id).price, 0);
      lineItems.push({
        id: code + "-L" + (i + 1),
        productId: product.id,
        name: product.name,
        code: product.code,
        size,
        sugar: pick(sugarOptions),
        ice: pick(iceOptions),
        toppingIds,
        toppingNames: toppingIds.map((id) => toppingById(id).name),
        qty,
        unitPrice,
        lineTotal: unitPrice * qty,
        note: rnd() < 0.12 ? "Ít ngọt, cho thêm đá riêng" : "",
      });
    }
    const subtotal = lineItems.reduce((s, l) => s + l.lineTotal, 0);
    let discount = 0;
    let voucherCode = "";
    if (rnd() < 0.16) {
      const v = pick(vouchers.filter((x) => x.status === "active" && x.minOrder <= subtotal));
      if (v) {
        discount = v.type === "percent" ? Math.round(subtotal * v.value / 100 / 1000) * 1000 : v.value;
        discount = Math.min(discount, subtotal);
        voucherCode = v.code;
      }
    }
    const total = Math.max(0, subtotal - discount);
    let status = forcedStatus;
    if (!status) {
      const roll = rnd();
      status = roll < 0.72 ? "paid" : roll < 0.84 ? "pending" : roll < 0.9 ? "partial_refunded" : roll < 0.95 ? "refunded" : "cancelled";
    }
    let method = forcedMethod;
    if (!method) method = rnd() < 0.45 ? "cash" : "vietqr";
    const paymentStatus = status === "pending" ? "pending" : status === "cancelled" ? "cancelled" : "completed";
    const paidAt = paymentStatus === "completed" ? addMinutes(createdAt, int(1, 5)) : null;
    const cashReceived = method === "cash" && paymentStatus === "completed" ? Math.ceil(total / 50000) * 50000 : null;
    const orderType = rnd() < 0.36 ? "takeaway" : "dine_in";
    const order = {
      id: code,
      code,
      branchId: branch.id,
      branchName: branch.name,
      createdAt,
      paidAt,
      cashierId: cashier ? cashier.id : "C01",
      cashierName: cashier ? cashier.name : "Nguyễn Mai Linh",
      orderType,
      status,
      note: rnd() < 0.09 ? "Giao tại quầy, khách đợi" : "",
      items: lineItems,
      subtotal,
      discount,
      total,
      voucherCode,
      payment: {
        method,
        amount: total,
        status: paymentStatus,
        receivedAmount: cashReceived || (paymentStatus === "completed" ? total : null),
        reference: paymentStatus === "completed" ? "SP" + (100000 + orderCounter * 37) : "",
        bank: paymentBanks[orderCounter % paymentBanks.length],
        account: "0909 123 456",
        paidAt,
        qrContent: "CAFE" + code,
        qrExpiredAt: addMinutes(createdAt, 5),
      },
      refunds: [],
    };
    if (status === "partial_refunded") {
      const amount = Math.max(1000, Math.round(total * (0.2 + rnd() * 0.25) / 1000) * 1000);
      order.refunds.push({
        id: "RF-" + code,
        amount: Math.min(total - 1000, amount),
        reason: pick(refundReasons),
        status: "completed",
        requestedAt: addMinutes(paidAt, int(8, 30)),
        processedAt: addMinutes(paidAt, int(31, 55)),
        requestedBy: order.cashierName,
        approvedBy: "Nguyễn Thu Trang",
        note: "Khách phản hồi sau khi nhận món",
      });
    }
    if (status === "refunded") {
      order.refunds.push({
        id: "RF-" + code,
        amount: total,
        reason: pick(refundReasons),
        status: "completed",
        requestedAt: addMinutes(paidAt, int(5, 20)),
        processedAt: addMinutes(paidAt, int(21, 45)),
        requestedBy: order.cashierName,
        approvedBy: "Nguyễn Thu Trang",
        note: "Hoàn toàn bộ đơn",
      });
    }
    orders.push(order);
    return order;
  }

  days.forEach((date) => {
    branches.forEach((branch) => {
      const isToday = date === TODAY;
      const count = isToday ? (branch.id === "D1" ? 12 : 7) : (branch.id === "D1" ? 5 : 2);
      const lim = isToday ? 14 : 22;
      for (let i = 0; i < count; i++) {
        let forced = null;
        if (date === TODAY && branch.id === "D1" && i === 0) forced = "paid";
        if (date === TODAY && branch.id === "D1" && i === 1) forced = "paid";
        if (date === TODAY && branch.id === "D1" && i === 2) forced = "pending";
        if (date === TODAY && branch.id === "D1" && i === 3) forced = "partial_refunded";
        if (date === TODAY && branch.id === "D1" && i === 4) forced = "refunded";
        if (date === TODAY && branch.id === "D1" && i === 5) forced = "cancelled";
        makeOrder(branch, date, lim, forced, date === TODAY && branch.id === "D1" && i === 1 ? "vietqr" : null);
      }
    });
  });

  /* ---------------- Cash shifts ---------------- */
  const shifts = [];
  let shiftNo = 1;
  branches.forEach((b) => {
    const cashier = cashiersFor(b.id)[0];
    const openedAt = iso(TODAY, 6, int(0, 8));
    const trans = [];
    if (b.id === "D1") {
      trans.push({ id: "CT-" + String(shiftNo) + "-1", type: "cash_in", amount: 1000000, reason: "Bổ sung quỹ tiền mặt", at: iso(TODAY, 10, 25), by: cashier ? cashier.name : "Nguyễn Mai Linh", approvedBy: b.manager });
      trans.push({ id: "CT-" + String(shiftNo) + "-2", type: "cash_out", amount: 120000, reason: "Mua đá viên bổ sung", at: iso(TODAY, 11, 15), by: cashier ? cashier.name : "Nguyễn Mai Linh", approvedBy: b.manager });
      trans.push({ id: "CT-" + String(shiftNo) + "-3", type: "cash_in", amount: 300000, reason: "Đổi tiền lẻ cho khách", at: iso(TODAY, 12, 40), by: cashier ? cashier.name : "Nguyễn Mai Linh", approvedBy: b.manager });
    } else {
      trans.push({ id: "CT-" + String(shiftNo) + "-1", type: "cash_in", amount: 500000, reason: "Bổ sung tiền lẻ", at: iso(TODAY, 9, 30), by: cashier ? cashier.name : "Thu ngân", approvedBy: b.manager });
    }
    shifts.push({
      id: "SH-" + dateKey(TODAY) + "-" + pad(shiftNo),
      branchId: b.id,
      cashierId: cashier ? cashier.id : "C01",
      cashierName: cashier ? cashier.name : "Nguyễn Mai Linh",
      openedAt,
      closedAt: null,
      openingCash: 500000,
      countedCash: null,
      theoreticalCash: null,
      differenceReason: "",
      status: b.status === "maintenance" ? "closed" : "open",
      transactions: trans,
      note: "",
    });
    shiftNo++;
  });
  // Closed shifts for previous days, branch D1.
  [addDays(TODAY, -1), addDays(TODAY, -2), addDays(TODAY, -3)].forEach((d, i) => {
    shiftNo++;
    const cashier = cashiersFor("D1")[0];
    shifts.push({
      id: "SH-" + dateKey(d) + "-" + pad(shiftNo),
      branchId: "D1",
      cashierId: cashier ? cashier.id : "C01",
      cashierName: cashier ? cashier.name : "Nguyễn Mai Linh",
      openedAt: iso(d, 6, 2),
      closedAt: iso(d, 23, 12),
      openingCash: 500000,
      countedCash: 500000 + i * 10000 + 1250000,
      theoreticalCash: 500000 + i * 10000 + 1200000,
      differenceReason: i === 1 ? "Thiếu 50.000 do trả nhầm tiền thối" : "",
      status: "closed",
      transactions: [],
      note: i === 1 ? "Đã giải trình với quản lý" : "",
    });
  });
  function dateKey(d) { return d.slice(2).replace(/-/g, ""); }

  /* ---------------- Stock transactions ---------------- */
  const stockTransactions = [];
  let stockNo = 1;
  function stockCode(type, date) {
    const prefix = type === "inbound" ? "PN" : type === "issue" ? "PX" : type === "disposal" ? "TH" : "KK";
    return prefix + "-" + dateKey(date) + "-" + String(stockNo++).padStart(3, "0");
  }
  function addInbound(branchId, date, ingredientId, packs, unitCost, source, status) {
    const ing = ingredients.find((x) => x.id === ingredientId);
    const baseQty = packs * ing.conversionRatio;
    const total = packs * unitCost;
    stockTransactions.push({
      id: stockCode("inbound", date), type: "inbound", branchId, createdAt: iso(date, 8, int(0, 40)), createdBy: "M01", createdByName: "Nguyễn Thu Trang",
      source: source || "Kho trung tâm", note: "", status: status || "completed", approvalStatus: "none",
      items: [{ ingredientId, packQty: packs, baseQty, unitCost, lineTotal: total, reason: "" }],
      total,
    });
  }
  function addDisposal(branchId, date, ingredientId, baseQty, reason, status) {
    const ing = ingredients.find((x) => x.id === ingredientId);
    const total = money(baseQty * ing.unitCost);
    stockTransactions.push({
      id: stockCode("disposal", date), type: "disposal", branchId, createdAt: iso(date, 16, int(0, 40)), createdBy: "M01", createdByName: "Nguyễn Thu Trang",
      source: "", note: "Tiêu hủy nguyên liệu", status: status || "completed", approvalStatus: status === "pending" ? "coo" : "none",
      items: [{ ingredientId, packQty: Math.round((baseQty / ing.conversionRatio) * 1000) / 1000, baseQty, unitCost: ing.unitCost, lineTotal: total, reason }],
      total,
    });
  }
  function addStocktake(branchId, date, ingredientId, bookQty, actualQty, reason, status) {
    const ing = ingredients.find((x) => x.id === ingredientId);
    const variance = actualQty - bookQty;
    stockTransactions.push({
      id: stockCode("stocktake", date), type: "stocktake", branchId, createdAt: iso(date, 20, int(0, 50)), createdBy: "M01", createdByName: "Nguyễn Thu Trang",
      source: "", note: "Kiểm kê định kỳ", status: status || "completed", approvalStatus: status === "pending" ? "coo" : "none",
      items: [{ ingredientId, packQty: Math.round((actualQty / ing.conversionRatio) * 1000) / 1000, baseQty: actualQty, bookQty, actualQty, variance, unitCost: ing.unitCost, lineTotal: money(Math.abs(variance) * ing.unitCost), reason }],
      total: money(Math.abs(variance) * ing.unitCost),
    });
  }
  addInbound("D1", addDays(TODAY, -2), "I01", 20, 320000, "Nestlé Professional");
  addInbound("D1", addDays(TODAY, -1), "I04", 4, 336000, "TH True Milk");
  addInbound("D1", TODAY, "I12", 5, 900000, "Bao bì Minh Phát");
  addDisposal("D1", TODAY, "I04", 1500, "Sữa hết hạn sau khi mở nắp", "completed");
  addDisposal("D1", TODAY, "I11", 3000, "Đá tan, không đảm bảo chất lượng", "pending");
  addStocktake("D1", addDays(TODAY, -1), "I01", 12800, 12500, "Chênh lệch do hao hụt khi cân", "completed");
  addInbound("D2", addDays(TODAY, -1), "I01", 10, 320000, "Kho trung tâm");
  addDisposal("D2", TODAY, "I11", 2500, "Đá nhiễm bẩn", "completed");
  addInbound("D3", TODAY, "I08", 3, 650000, "Marukyu Koyamaen");
  addStocktake("D4", TODAY, "I07", 1000, 900, "Thiếu 100g trà oolong", "completed");
  addInbound("D5", addDays(TODAY, -1), "I13", 4, 1100000, "Bao bì Minh Phát");
  addDisposal("D6", TODAY, "I17", 200, "Bơ hỏng", "completed");
  addStocktake("D8", addDays(TODAY, -2), "I03", 9000, 8600, "Chai sữa đặc bị vỡ", "completed");

  /* ---------------- Approvals ---------------- */
  const approvals = [
    { id: "AP-261020-001", type: "refund", branchId: "D1", createdAt: addMinutes(iso(TODAY, 13, 10), 0), requestedBy: "Nguyễn Mai Linh", amount: 180000, reason: "Khách phản hồi món bị sai size, yêu cầu hoàn tiền.", status: "pending", relatedId: "ORD-261014-001", note: "Trong ngưỡng 2.000.000 nhưng khách yêu cầu COO xác nhận theo cấu hình demo.", details: "Hoàn tiền mặt từ két, đơn gốc đã thanh toán VietQR." },
    { id: "AP-261020-002", type: "disposal", branchId: "D1", createdAt: iso(TODAY, 16, 22), requestedBy: "Nguyễn Thu Trang", amount: 36000, reason: "Tiêu hủy 3 kg đá viên do tan, ảnh hưởng chất lượng.", status: "pending", relatedId: stockTransactions[4].id, note: "Giá trị vượt ngưỡng tiêu hủy của Branch Manager.", details: "Tồn kho sẽ giảm 3.000 g đá viên sau khi duyệt." },
    { id: "AP-261020-003", type: "adjustment", branchId: "D3", createdAt: iso(TODAY, 17, 5), requestedBy: "Lê Hoàng Anh", amount: 125000, reason: "Chênh lệch kiểm kê matcha: thiếu 200 g.", status: "pending", relatedId: "KK-261020-002", note: "Cần COO xác nhận do vượt ngưỡng điều chỉnh.", details: "Điều chỉnh giảm 200 g matcha." },
    { id: "AP-261019-004", type: "cash_variance", branchId: "D1", createdAt: iso(addDays(TODAY, -1), 23, 15), requestedBy: "Nguyễn Mai Linh", amount: 50000, reason: "Thiếu 50.000 khi đóng ca tối 19/10.", status: "approved", relatedId: "SH-261019-09", note: "Đã duyệt bởi COO.", details: "Đã ghi nhận giải trình." },
    { id: "AP-261018-005", type: "cash_transaction", branchId: "D2", createdAt: iso(addDays(TODAY, -2), 15, 44), requestedBy: "Trần Minh Quân", amount: 700000, reason: "Tạm ứng mua nguyên liệu, tự tạo bởi Manager.", status: "pending", relatedId: "CT-D2-01", note: "Giao dịch tự tạo — cần COO review.", details: "Phiếu chi tiền mặt, chưa ghi nhận vào két." },
  ];

  /* ---------------- Sync history & webhook logs ---------------- */
  const syncHistory = [
    { id: "SY-261020-01", time: iso(TODAY, 9, 12), version: "2026.10.20-01", packages: ["Menu & giá", "BOM", "Khuyến mãi"], branches: "Tất cả 8 chi nhánh", status: "success", actor: "Lê Anh Tuấn", note: "Cập nhật giá size L cho nhóm trà." },
    { id: "SY-261019-01", time: iso(addDays(TODAY, -1), 18, 30), version: "2026.10.19-02", packages: ["Khuyến mãi"], branches: "D1, D2, D8", status: "partial", actor: "Lê Anh Tuấn", note: "D7 offline, các chi nhánh còn lại thành công." },
    { id: "SY-261018-01", time: iso(addDays(TODAY, -2), 10, 2), version: "2026.10.18-01", packages: ["Menu & giá", "BOM"], branches: "Tất cả 8 chi nhánh", status: "success", actor: "Lê Anh Tuấn", note: "Bổ sung món Cold Brew." },
    { id: "SY-261016-01", time: iso(addDays(TODAY, -4), 11, 45), version: "2026.10.16-01", packages: ["Menu & giá", "BOM", "Khuyến mãi"], branches: "D3, D4", status: "failed", actor: "Lê Anh Tuấn", note: "Mất kết nối tới D3 và D4." },
  ];
  const webhookLogs = [];
  orders.filter((o) => o.payment.method === "vietqr" && o.payment.reference).slice(0, 14).forEach((o, i) => {
    webhookLogs.push({
      id: "WH-" + (1000 + i),
      time: o.payment.paidAt || o.createdAt,
      reference: o.payment.reference,
      orderId: o.id,
      amount: o.payment.receivedAmount || o.total,
      status: i === 3 ? "mismatch" : "success",
      signature: i === 3 ? "invalid" : "valid",
      raw: JSON.stringify({ id: o.payment.reference, gateway: o.payment.bank, transactionDate: o.payment.paidAt, accountNumber: "0909123456", content: o.payment.qrContent, transferAmount: o.payment.receivedAmount || o.total, referenceCode: o.payment.reference }, null, 2),
    });
  });

  /* ---------------- Growth & settings ---------------- */
  const growth = [
    { period: "Q1/2025", revenue: 2430000000, orders: 18420, growth: 0 },
    { period: "Q2/2025", revenue: 2680000000, orders: 20110, growth: 10.3 },
    { period: "Q3/2025", revenue: 2915000000, orders: 21840, growth: 8.8 },
    { period: "Q4/2025", revenue: 3240000000, orders: 23620, growth: 11.1 },
    { period: "Q1/2026", revenue: 3510000000, orders: 25110, growth: 8.3 },
    { period: "Q2/2026", revenue: 3840000000, orders: 26980, growth: 9.4 },
    { period: "Q3/2026", revenue: 4125000000, orders: 28450, growth: 7.4 },
  ];
  const annualGrowth = [
    { period: "2023", revenue: 6840000000, orders: 52100, growth: 0 },
    { period: "2024", revenue: 8640000000, orders: 65420, growth: 26.3 },
    { period: "2025", revenue: 11264000000, orders: 84000, growth: 30.4 },
    { period: "2026 (YTD)", revenue: 11475000000, orders: 80540, growth: 18.1 },
  ];

  const settings = {
    refundThreshold: 2000000,
    disposalThreshold: 5000000,
    adjustmentThreshold: 5000000,
    cashVarianceTolerance: 50000,
    requireCooForSelfInitiated: true,
    bank: {
      name: "MBBank",
      accountNumber: "0909 123 456",
      accountHolder: "CONG TY TNHH SMART CAFE",
      apiToken: "sepay_live_8f3a9c2d7e1b",
      webhookUrl: "https://api.smartcafe.vn/webhooks/sepay",
      secretKey: "whsec_scms_2026_demo",
      transferSyntax: "CAFE{ORDER_CODE}",
      qrExpiry: 300,
      environment: "Sandbox",
      status: "connected",
    },
    permissions: {},
  };

  const features = [
    { key: "kiosk", code: "SCR-02", name: "Kiosk chấm công", module: "Chung" },
    { key: "pos", code: "SCR-04", name: "POS & thanh toán", module: "Bán hàng" },
    { key: "orders", code: "SCR-05", name: "Danh sách đơn", module: "Bán hàng" },
    { key: "order_detail", code: "SCR-06", name: "Chi tiết đơn", module: "Bán hàng" },
    { key: "refund", code: "POP-05", name: "Hoàn tiền", module: "Bán hàng" },
    { key: "cash_drawer", code: "POP-03", name: "Ca quỹ", module: "Bán hàng" },
    { key: "branch_dashboard", code: "SCR-07", name: "Branch Dashboard", module: "Chi nhánh" },
    { key: "inventory", code: "SCR-08", name: "Kho nguyên liệu", module: "Chi nhánh" },
    { key: "stock_slip", code: "POP-04", name: "Phiếu kho", module: "Chi nhánh" },
    { key: "employees", code: "TAB-03", name: "Hồ sơ nhân sự", module: "Chi nhánh" },
    { key: "shifts", code: "TAB-04", name: "Ca & chấm công", module: "Chi nhánh" },
    { key: "approvals", code: "SCR-18", name: "Phê duyệt", module: "Chi nhánh" },
    { key: "chain_dashboard", code: "SCR-10", name: "Chain Dashboard", module: "Chuỗi" },
    { key: "menu", code: "SCR-11", name: "Menu & giá", module: "Chuỗi" },
    { key: "bom", code: "TAB-06", name: "BOM & Recipe", module: "Chuỗi" },
    { key: "promotions", code: "SCR-12", name: "Khuyến mãi", module: "Chuỗi" },
    { key: "branches", code: "SCR-13", name: "Chi nhánh", module: "Chuỗi" },
    { key: "sync", code: "SCR-14", name: "Đồng bộ chuỗi", module: "Chuỗi" },
    { key: "reports_branch", code: "TAB-07", name: "Báo cáo vận hành", module: "Báo cáo" },
    { key: "reports_chain", code: "TAB-08", name: "Báo cáo hợp nhất", module: "Báo cáo" },
    { key: "audit", code: "SCR-17", name: "Audit Logs", module: "Hệ thống" },
    { key: "settings", code: "SCR-16", name: "Cấu hình", module: "Hệ thống" },
  ];
  const access = {
    Staff: ["kiosk"],
    Cashier: ["kiosk", "pos", "orders", "order_detail", "refund", "cash_drawer"],
    "Branch Manager": ["kiosk", "pos", "orders", "order_detail", "refund", "cash_drawer", "branch_dashboard", "inventory", "stock_slip", "employees", "shifts", "approvals", "menu", "bom", "reports_branch"],
    COO: features.map((f) => f.key),
  };
  const permKeys = ["view", "add", "edit", "delete", "approve", "cancel", "refund"];
  features.forEach((f) => {
    settings.permissions[f.key] = {};
    ["Staff", "Cashier", "Branch Manager", "COO"].forEach((role) => {
      const has = access[role].includes(f.key);
      const canWrite = has && (role === "COO" || (role === "Branch Manager" && ["pos", "orders", "inventory", "stock_slip", "employees", "shifts", "menu", "bom", "promotions", "branches", "approvals", "branch_dashboard"].includes(f.key)) || (role === "Cashier" && ["pos", "orders", "cash_drawer"].includes(f.key)));
      const p = {};
      permKeys.forEach((k) => { p[k] = false; });
      p.view = has;
      p.add = canWrite && !["branch_dashboard", "reports_branch", "reports_chain", "audit", "settings"].includes(f.key);
      p.edit = canWrite && !["pos", "orders", "order_detail", "reports_branch", "reports_chain", "audit", "settings", "approvals"].includes(f.key);
      p.delete = has && role === "COO" && ["menu", "promotions", "branches", "employees", "inventory", "sync"].includes(f.key);
      p.approve = has && ["COO", "Branch Manager"].includes(role) && ["refund", "approvals", "stock_slip", "inventory", "shifts"].includes(f.key);
      p.cancel = has && ["COO", "Branch Manager"].includes(role) && ["pos", "orders", "order_detail", "refund"].includes(f.key);
      p.refund = has && ["Cashier", "Branch Manager", "COO"].includes(role) && ["refund", "order_detail", "orders"].includes(f.key);
      settings.permissions[f.key][role] = p;
    });
  });

  /* ---------------- Audit logs ---------------- */
  const auditLogs = [];
  let auditNo = 1;
  function log(time, actor, role, branchId, action, entity, before, after, ip) {
    auditLogs.push({
      id: "AL-" + String(auditNo++).padStart(5, "0"),
      time, actor, role, branchId, action, entity,
      ip: ip || ("10.10." + (branchId || "D1").slice(1) + "." + int(10, 240)),
      before: before || null,
      after: after || null,
    });
  }
  log(iso(TODAY, 6, 1), "Nguyễn Thu Trang", "Branch Manager", "D1", "Login", "Phiên đăng nhập", null, { result: "success", device: "POS-D1-01" });
  log(iso(TODAY, 6, 2), "Nguyễn Mai Linh", "Cashier", "D1", "Mở ca", "Ca quỹ", null, { shift: "SH-261020-01", openingCash: 500000 });
  log(iso(TODAY, 6, 35), "Nguyễn Mai Linh", "Cashier", "D1", "Áp dụng voucher", "Đơn hàng", null, { voucher: "GIAM10", order: "ORD-261020-001" });
  log(iso(TODAY, 9, 12), "Lê Anh Tuấn", "COO", "D1", "Đồng bộ cấu hình", "Chain Sync", null, { version: "2026.10.20-01", packages: ["Menu & giá", "BOM", "Khuyến mãi"], branches: 8 });
  log(iso(TODAY, 10, 8), "Lê Anh Tuấn", "COO", "D1", "Sửa giá món", "Sản phẩm", { product: "Trà đào cam sả", size: "L", price: 47000 }, { product: "Trà đào cam sả", size: "L", price: 49000 });
  log(iso(TODAY, 10, 30), "Nguyễn Mai Linh", "Cashier", "D1", "Thu tiền mặt", "Ca quỹ", null, { type: "cash_in", amount: 1000000, reason: "Bổ sung quỹ tiền mặt" });
  log(iso(TODAY, 11, 15), "Nguyễn Mai Linh", "Cashier", "D1", "Chi tiền mặt", "Ca quỹ", null, { type: "cash_out", amount: 120000, reason: "Mua đá viên bổ sung" });
  log(iso(TODAY, 11, 52), "Nguyễn Thu Trang", "Branch Manager", "D1", "Sửa BOM", "Recipe", { product: "Cà phê sữa đá", size: "M", coffee: 17 }, { product: "Cà phê sữa đá", size: "M", coffee: 18 });
  log(iso(TODAY, 13, 10), "Nguyễn Mai Linh", "Cashier", "D1", "Yêu cầu hoàn tiền", "Đơn hàng", null, { order: "ORD-261014-001", amount: 180000 });
  log(iso(TODAY, 13, 42), "Nguyễn Thu Trang", "Branch Manager", "D1", "Hủy đơn", "Đơn hàng", { order: "ORD-261020-006", status: "pending" }, { order: "ORD-261020-006", status: "cancelled" });
  log(iso(TODAY, 14, 5), "Nguyễn Thu Trang", "Branch Manager", "D1", "Điều chỉnh công", "Chấm công", { employee: "Nguyễn Mai Linh", checkIn: "06:12:00" }, { employee: "Nguyễn Mai Linh", checkIn: "06:00:00", reason: "Lỗi đầu đọc thẻ" });
  log(iso(TODAY, 16, 22), "Nguyễn Thu Trang", "Branch Manager", "D1", "Tiêu hủy nguyên liệu", "Kho", null, { ingredient: "Đá viên", qty: 3000, reason: "Đá tan" });
  log(iso(TODAY, 17, 35), "Lê Anh Tuấn", "COO", "D1", "Gán quyền", "Phân quyền", { role: "Cashier", screen: "Hoàn tiền", approve: false }, { role: "Cashier", screen: "Hoàn tiền", approve: true });
  log(iso(TODAY, 18, 2), "Lê Anh Tuấn", "COO", "D1", "Cấu hình SePay", "Cấu hình", { webhookUrl: "https://api.smartcafe.vn/webhooks/sepay" }, { webhookUrl: "https://api.smartcafe.vn/webhooks/sepay", environment: "Sandbox", tested: true });
  for (let i = 0; i < 18; i++) {
    const d = days[i % days.length];
    const branch = branches[i % branches.length];
    const actor = employees[i % employees.length];
    log(iso(d, 8 + (i % 12), int(0, 59)), actor.name, actor.role, branch.id, pick(["Login", "Xem báo cáo", "Sửa hồ sơ nhân viên", "Cập nhật tồn kho", "Duyệt chấm công", "Xuất báo cáo"]), pick(["Phiên đăng nhập", "Báo cáo", "Nhân sự", "Kho", "Chấm công"]), null, { note: "Thao tác mẫu trong ngày " + d, result: "success" });
  }
  auditLogs.sort((a, b) => (a.time < b.time ? 1 : -1));

  NS.seed = function () {
    return {
      meta: { today: TODAY, version: "1.0", systemTime: "14:30:00" },
      branches,
      employees,
      categories,
      toppings,
      products,
      ingredients,
      bom,
      vouchers,
      shiftTemplates,
      schedule,
      attendance,
      orders,
      shifts,
      stockTransactions,
      approvals,
      syncHistory,
      webhookLogs,
      growth,
      annualGrowth,
      settings,
      features,
      permKeys,
      auditLogs,
    };
  };
})();
