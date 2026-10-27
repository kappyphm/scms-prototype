# SCMS — Tài liệu thiết kế UI/UX & Prototype

**Dự án:** Smart Cafe Management System (SCMS)  
**Tài liệu tham chiếu:** `Requirements_SBA (1).pdf` — Software Requirement Specification, version 01  
**Phiên bản thiết kế:** 1.0  
**Ngôn ngữ giao diện:** Tiếng Việt  
**Loại sản phẩm:** Prototype giao diện tĩnh, dữ liệu mô phỏng, không backend

---

## 1. Mục tiêu

Tài liệu này chuyển các yêu cầu chức năng của SCMS thành một hệ thống giao diện có thể trải nghiệm được, phục vụ:

- Khách hàng hình dung luồng vận hành thực tế của chuỗi 6–10 chi nhánh.
- Đội phát triển thống nhất cấu trúc màn hình, field dữ liệu và hành vi trước khi làm backend.
- Kiểm tra tính đầy đủ của yêu cầu thông qua prototype có thể bấm được.

Prototype **không** bao gồm backend, xác thực thật, SePay/VietQR thật, máy in nhiệt, đầu đọc RFID hay phân quyền server-side. Mọi thao tác được mô phỏng ở phía trình duyệt.

---

## 2. Phạm vi

### 2.1. Trong phạm vi

- 17 màn hình chính: SCR-01 → SCR-17.
- 10 tab chức năng: TAB-01 → TAB-10.
- 5 popup/tác vụ: Item Options, Payment Checkout, Cash Drawer Shift, Stock Slip, Refund/Manager Approval.
- Bổ sung SCR-18 — Approvals Inbox và TAB-11 — Ngưỡng phê duyệt, do được nhắc trong business rules nhưng chưa có screen definition.
- 4 vai trò: COO, Branch Manager, Cashier, Staff (Staff chỉ dùng Kiosk).
- Trải nghiệm đầy đủ các luồng: đăng nhập, chấm công, bán hàng, thanh toán, quản lý đơn, hoàn tiền, quản lý ca quỹ, kho, nhân sự, menu/BOM, khuyến mãi, chi nhánh, đồng bộ, báo cáo, cấu hình và audit.

### 2.2. Ngoài phạm vi

- Tích hợp thật với SePay, VietQR, ngân hàng.
- In thật ra máy in ESC/POS K80.
- Đọc thẻ RFID/USB thật.
- Đồng bộ đa chi nhánh thật, websocket, xử lý đồng thời.
- Tính lương, BHXH, thuế TNCN.
- Ứng dụng mobile native.
- Chức năng ngoài v1.0: FoodApp, KDS, CRM/loyalty, hóa đơn điện tử, WebOrder, tách/gộp bàn, ví điện tử, offline mode.

---

## 3. Quy ước thiết kế

### 3.1. Nguyên tắc

1. **Dữ liệu trước, trang trí sau:** bảng, form và số liệu được ưu tiên; hạn chế card và hiệu ứng.
2. **Một tác vụ = một màn hình:** tạo/sửa/thanh toán/kiểm kho/hoàn tiền mở full-screen, không nhồi trong modal.
3. **Đơn sắc có chủ đích:** nền trung tính, chữ than, một accent cà phê duy nhất cho hành động chính và điểm nhấn.
4. **Trạng thái không chỉ dựa vào màu:** dùng nhãn chữ, độ đậm, viền, icon.
5. **Touch-first cho POS/Kiosk:** vùng chạm tối thiểu 44×44 px, numpad lớn, thao tác dưới 5 lần chạm.
6. **Desktop-first cho quản trị:** bảng dày, cột rõ, filter cố định, phân trang.
7. **Có thể truy vết:** mỗi màn hình hiển thị mã SCR/TAB/POP nhỏ để đối chiếu tài liệu gốc.
8. **Không phụ thuộc mạng:** toàn bộ font, icon, chart, dữ liệu nằm trong prototype.

### 3.2. Định dạng dữ liệu

| Loại | Định dạng | Ví dụ |
|---|---|---|
| Tiền tệ | `vi-VN`, dấu `.` phân cách nghìn, hậu tố `VNĐ` | `45.000 VNĐ` |
| Ngày | `dd/mm/yyyy` | `20/10/2026` |
| Giờ | `HH:mm:ss` (24h) | `14:30:00` |
| Ngày giờ | `dd/mm/yyyy HH:mm:ss` | `20/10/2026 14:30:00` |
| Số lượng bán | Số nguyên dương | `2` |
| Nguyên liệu/BOM | 0–3 chữ số thập phân, dùng dấu `,` | `0,018 kg` |
| Mã đơn | `CAFE-YYMMDD-XXX` | `CAFE-261020-001` |
| Mã phiếu kho | `PN/PX/TH/KK-YYMMDD-XXX` | `PN-261020-001` |

---

## 4. Định hướng thị giác

### 4.1. Concept “Sổ vận hành”

Giao diện lấy cảm hứng từ sổ theo dõi vận hành của quán cà phê: giấy trắng ngà, đường kẻ mảnh, chữ đậm rõ, số liệu thẳng hàng. Cảm giác tin cậy, mộc mạc, không “dashboard SaaS” bóng bẩy.

### 4.2. Bảng màu

| Token | Giá trị | Dùng cho |
|---|---|---|
| `--paper` | `#F7F5F0` | Nền ứng dụng |
| `--surface` | `#FFFDF9` | Nền bảng, form |
| `--ink` | `#1A1815` | Chữ chính, nút primary |
| `--ink-2` | `#4A4642` | Chữ phụ đậm |
| `--muted` | `#7A746D` | Metadata, placeholder |
| `--line` | `#D8D2C8` | Viền, divider |
| `--line-strong` | `#B9B1A5` | Viền focus/active |
| `--accent` | `#8A5A3B` | Nút chính, tab active, chart highlight |
| `--accent-soft` | `#EFE4DA` | Nền nhấn rất nhẹ |
| `--danger` | `#1A1815` | Hành động phá hủy dùng nền đậm + icon, không dùng đỏ |
| `--success` | `#3F4A3C` | Trạng thái hoàn tất (xanh rêu xám, chỉ dùng tiết chế) |

**Quy tắc accent:** chỉ dùng cho 1) nút hành động chính, 2) tab/menu đang active, 3) focus ring, 4) cột/highlight trong chart. Không dùng accent để tô toàn bộ nền hoặc trang trí.

### 4.3. Typography

- Font: `"Be Vietnam Pro", "Inter", "Segoe UI", Arial, sans-serif` (fallback hệ thống, không tải từ CDN).
- Số trong bảng: `font-variant-numeric: tabular-nums`.
- Thang chữ:
  - Display 40/48 — Kiosk clock, con số KPI lớn.
  - H1 24/32 — tiêu đề màn hình.
  - H2 18/26 — tiêu đề section.
  - Body 14/22 — nội dung.
  - Small 12/18 — metadata, helper.
  - Label 11/16 — nhãn cột, uppercase nhẹ.
- Chữ đậm dùng cho số liệu và tiêu đề; không dùng nhiều cấp độ đậm.

### 4.4. Khoảng cách, bo góc, đổ bóng

- Grid 4px; spacing chủ đạo 8/12/16/24/32/48.
- Radius: input/tag 4px; button 6px; panel/task 8px; không dùng pill trừ chip lọc.
- Viền 1px `--line`; panel không shadow.
- Shadow chỉ cho toast, dropdown, dialog xác nhận: `0 8px 24px rgba(26,24,21,.12)`.
- Không dùng gradient trừ ảnh placeholder sản phẩm.

### 4.5. Icon

- Inline SVG, stroke 1.5px, kích thước 16/20/24.
- Không dùng icon font, không tải thư viện ngoài.
- Icon chỉ hỗ trợ nhãn, không thay thế nhãn ở hành động quan trọng.

---

## 5. Kiến trúc thông tin

### 5.1. Sơ đồ điều hướng

```
Đăng nhập (SCR-01)
  ├── Kiosk chấm công (SCR-02)
  └── Role Dispatcher (SCR-03)
        ├── POS (SCR-04)
        │     ├── Tùy chỉnh món (POP-01)
        │     ├── Thanh toán (POP-02)
        │     ├── Ca quỹ (POP-03)
        │     └── Đơn hàng (SCR-05 → SCR-06 → Refund)
        ├── Vận hành chi nhánh
        │     ├── Dashboard (SCR-07)
        │     ├── Kho (SCR-08 → POP-04)
        │     ├── Nhân sự & ca (SCR-09 / TAB-03, TAB-04)
        │     ├── Báo cáo (SCR-15 / TAB-07)
        │     └── Phê duyệt (SCR-18)
        └── Quản trị chuỗi (COO)
              ├── Chain Dashboard (SCR-10)
              ├── Menu & Recipe (SCR-11 / TAB-05, TAB-06)
              ├── Khuyến mãi (SCR-12)
              ├── Chi nhánh & Manager (SCR-13)
              ├── Đồng bộ chuỗi (SCR-14)
              ├── Báo cáo hợp nhất (SCR-15 / TAB-08)
              ├── Cấu hình & bảo mật (SCR-16 / TAB-09, TAB-10, TAB-11)
              └── Audit Logs (SCR-17)
```

### 5.2. Layout tổng quát

| Layout | Áp dụng | Đặc điểm |
|---|---|---|
| Auth | SCR-01 | Split-screen: thông tin thương hiệu + form đăng nhập |
| Kiosk | SCR-02 | Full-screen, tương phản cao, clock lớn, numpad |
| POS | SCR-04, POP-01/02/03 | Top rail mỏng + 3 cột; tối ưu 1024–1366px |
| Admin shell | SCR-07 → SCR-17 | Top rail 56px + sidebar 240px + content full-bleed |
| Task screen | Tạo/sửa/thanh toán/refund/slip | Header tác vụ + form 2 cột + sticky action bar |

### 5.3. Top rail

- Trái: logo SCMS, tên chi nhánh hiện tại.
- Giữa: role switcher (demo), branch selector (COO).
- Phải: ca đang mở, đồng hồ, thông báo, menu người dùng, nút reset dữ liệu demo.
- Trên màn hình task: thêm breadcrumb và mã màn hình.

### 5.4. Sidebar

- Nhóm menu theo nghiệp vụ, có nhãn nhóm.
- Item active: nền `--accent-soft`, vạch dọc accent, chữ đậm.
- Badge số lượng cho mục cần xử lý: đơn chờ, cảnh báo tồn kho, phê duyệt.
- Thu gọn thành icon rail ở màn hình < 1280px; mở drawer ở mobile.

---

## 6. Vai trò và quyền truy cập

| Vai trò | Phạm vi | Màn hình chính |
|---|---|---|
| COO | Toàn chuỗi | Chain Dashboard, Master Data, Branches, Sync, Reports, Settings, Audit, Approvals; xem được màn hình chi nhánh |
| Branch Manager | Chi nhánh được gán | Branch Dashboard, POS, Orders, Inventory, Employees/Shifts, Reports, Approvals |
| Cashier | Chi nhánh, ngày làm việc | POS, Orders, Order Details, Cash Drawer, Refund request |
| Staff | Không có tài khoản | Chỉ Kiosk chấm công |

**Nguyên tắc demo:** role switcher cho phép chuyển nhanh giữa 4 vai trò mà không cần logout. Khi chuyển role, hệ thống điều hướng về màn hình mặc định:

- COO → `/chain`
- Branch Manager → `/branch`
- Cashier → `/pos`
- Staff → `/kiosk`

Truy cập route ngoài quyền hiển thị màn hình “Không có quyền truy cập” kèm nút quay về Dispatcher.

---

## 7. Design system components

### 7.1. Button

| Loại | Style | Dùng cho |
|---|---|---|
| Primary | Nền `--accent`, chữ trắng | Lưu, thanh toán, đồng bộ, xác nhận |
| Secondary | Nền trong, viền `--line`, chữ ink | Hủy, quay lại, thao tác phụ |
| Ghost | Không viền, hover nền nhẹ | Link trong bảng, hành động nhẹ |
| Danger | Viền ink đậm + icon cảnh báo, hover nền ink | Hủy đơn, ngừng hoạt động, xóa mềm |
| Icon | 32×32/40×40, viền hoặc ghost | Sửa, xem, in, đóng |

Trạng thái: default / hover / focus-visible / disabled / loading. Minimum height 36px; POS 48px.

### 7.2. Form field

- Label phía trên, dấu `*` accent cho field bắt buộc.
- Helper text dưới field; error text thay helper, viền field đậm + icon.
- Input height 36px (admin), 48px (POS/Kiosk).
- Select dùng native select có style; radio/checkbox là custom nhẹ.
- Nhóm field 2 cột trên desktop, 1 cột trên mobile.
- Sticky action bar cuối form với “Hủy” và hành động chính.

### 7.3. Table

- Header dính khi scroll, nền `--paper`, chữ uppercase 11px.
- Hàng cao 44–48px; hover nền nhẹ; số căn phải; trạng thái căn trái.
- Cột hành động cố định bên phải nếu bảng rộng.
- Empty state: icon đơn sắc, tiêu đề, mô tả, hành động gợi ý.
- Phân trang: `Hiển thị 1–10 / 245`, chọn 10/25/50/100.

### 7.4. Tag trạng thái

| Nhóm | Style | Ví dụ |
|---|---|---|
| Hoàn tất | Nền ink, chữ trắng | Đã thanh toán, Đã duyệt, Còn hàng |
| Chờ xử lý | Viền ink, chữ ink | Chờ thanh toán, Chờ duyệt, Sắp hết |
| Trung tính | Nền xám nhạt | Nháp, Đã đóng |
| Hủy/lỗi | Viền nét đứt + icon | Đã hủy, Từ chối, Hết hàng |

### 7.5. KPI strip (thay cho card)

- Một dải ngang, các ô ngăn bằng đường kẻ dọc.
- Mỗi ô: nhãn nhỏ, số lớn, delta/ghi chú.
- Không bo riêng từng ô, không shadow.

### 7.6. Tabs

- Tab cấp màn hình: underline, chữ đậm khi active, accent cho indicator.
- Sub-tab: segmented control nền paper, item active nền surface + viền.
- Filter chip: viền, active nền ink/chữ trắng.

### 7.7. Dialog xác nhận

- Chỉ dùng cho hành động phá hủy hoặc nhạy cảm.
- Nội dung ngắn: tiêu đề, mô tả, field lý do/PIN nếu cần, nút Hủy + Xác nhận.
- Không dùng modal cho form dài, danh sách, thanh toán, tùy chỉnh món.

### 7.8. Toast

- Góc phải dưới, 1 dòng, tự ẩn sau 3s.
- Có icon trạng thái; không dùng màu nền rực.

### 7.9. Chart

- SVG/CSS thuần, không thư viện.
- Bar chart cột mảnh, gridline ngang, nhãn trục 11px.
- Highlight cột cao nhất bằng accent; các cột khác xám.
- Luôn có bảng dữ liệu đi kèm để đảm bảo khả năng đọc.

---

## 8. Chi tiết màn hình

### 8.1. SCR-01 — Đăng nhập

**Mục tiêu:** xác thực người dùng, điều hướng theo role.

**Layout:** split-screen. Trái: tên hệ thống, mô tả ngắn, 3 chỉ số vận hành mô phỏng. Phải: form trong khung 400px, không card.

**Fields:**

| Field | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| Vai trò | Select | Có | Cashier mặc định |
| Tên đăng nhập / mã NV | Text, max 30 | Có | |
| Mật khẩu | Password, max 32 | Có | Tối thiểu 6 ký tự |
| Ghi nhớ đăng nhập | Checkbox | Không | Mặc định chọn |
| Quên mật khẩu | Link | — | Mở hướng dẫn liên hệ Manager/COO |
| Đăng nhập | Button | — | Điều hướng SCR-03 |
| Chuyển sang Kiosk | Link | — | Điều hướng SCR-02 |

**States:** lỗi validation, sai tài khoản, khóa sau 5 lần sai, tài khoản inactive.

---

### 8.2. SCR-02 — Attendance Kiosk

**Mục tiêu:** chấm công nhanh dưới 0,5 giây bằng thẻ/PIN.

**Layout:** full-screen 2 cột. Trái: clock lớn, trạng thái đầu đọc, hướng dẫn. Phải: chọn nhân viên, PIN, numpad, nút C/OK, banner kết quả.

**Fields/controls:**

| Thành phần | Ghi chú |
|---|---|
| Đồng hồ hệ thống | `HH:mm:ss — Thứ, dd/mm/yyyy`, cập nhật mỗi giây |
| Quay lại đăng nhập | Button |
| Vùng quẹt RFID/QR | Mô phỏng bằng nút “Giả lập quẹt thẻ” |
| Trạng thái đầu đọc | “Sẵn sàng” / “Mất kết nối” |
| Chọn nhân viên | Select `Họ tên + Mã NV` |
| PIN | 4 chấm tròn, che ký tự |
| Numpad 0–9 | Nút 56px |
| C / OK | Xóa toàn bộ / gửi |
| Banner kết quả | Họ tên, mã, Check-in/out, giờ thực tế, đi muộn/về sớm |

**States:** PIN sai, không có ca hôm nay, đã check-in, đã check-out, khóa 5 phút sau 5 lần sai.

---

### 8.3. SCR-03 — Role Dispatcher

**Mục tiêu:** chọn cổng nghiệp vụ sau đăng nhập.

**Nội dung:** thông tin người dùng hiện tại, role, chi nhánh, nút logout, thông báo quyền. Ba khối full-width: POS, Branch Portal, HQ Portal. Mỗi khối có mô tả chức năng, trạng thái quyền và nút vào. Khối không có quyền bị disable kèm lý do.

---

### 8.4. SCR-04 — Main POS Register

**Layout:** top rail mỏng; body 3 cột: category rail 176px, product grid linh hoạt, cart 380px.

**Fields/controls:**

| Nhóm | Chi tiết |
|---|---|
| Thông tin ca | Chi nhánh, ca làm, thu ngân |
| Điều hướng | Ca quỹ, danh sách đơn, dispatcher |
| Tìm kiếm | Theo tên/mã món, live search 300ms |
| Danh mục | Cà phê, Trà, Đá xay, Bánh, Khác |
| Product grid | Tên, giá từ, trạng thái tạm ngưng/hết hàng |
| Loại đơn | Tại quán / Mang đi |
| Giỏ hàng | Tên món, size, topping, SL, đơn giá, thành tiền, ghi chú |
| Thao tác dòng | Tăng/giảm SL, sửa tùy chọn, xóa |
| Voucher | Input mã, nút áp dụng, hiển thị lỗi điều kiện |
| Tổng tiền | Tạm tính, giảm giá, tổng thanh toán |
| Hành động | Giữ đơn, thanh toán |
| Phím tắt | F1 tìm món, F8 voucher, F9 thanh toán, Esc đóng |

**States:** giỏ trống, món unavailable, voucher không hợp lệ, chưa mở ca, đơn tạm.

---

### 8.5. POP-01 — Tùy chỉnh món (full-screen)

**Layout:** header tác vụ + 2 cột: tùy chọn bên trái, tóm tắt món bên phải; sticky action bar.

**Fields:**

- Size S/M/L kèm phụ thu.
- Mức đường: 100%, 70%, 50%, không đường.
- Mức đá: 100%, ít đá, nóng/không đá.
- Topping: danh sách checkbox + giá.
- Ghi chú pha chế, max 100 ký tự.
- Số lượng.
- Đơn giá, tổng giá món.

**Actions:** Hủy/quay lại, Thêm vào giỏ.

---

### 8.6. POP-02 — Payment Checkout (full-screen)

**Layout:** trái là tóm tắt đơn; phải là phương thức thanh toán và trạng thái.

**Cash:** tổng tiền, quick cash 100k/200k/500k/đúng tiền, tiền khách đưa, tiền thối, nút xác nhận & in bill. Validate tiền nhận ≥ tổng tiền.

**VietQR:** mã QR mô phỏng, số tiền, nội dung chuyển khoản `CAFE...`, thời gian hết hạn, trạng thái webhook (Chờ/Đã thanh toán/Sai số tiền), nút mô phỏng webhook thành công và webhook sai số tiền.

**Sau thanh toán:** màn hình thành công với mã đơn, phương thức, tiền nhận/thối, nút in bill, in phiếu bar, tạo đơn mới. Đơn chuyển PAID, dữ liệu bị khóa.

---

### 8.7. POP-03 — Cash Drawer Shift (full-screen)

**Thông tin:** chi nhánh, ca, thu ngân, trạng thái ca.

**Số liệu:** tiền đầu ca, doanh thu tiền mặt, tổng thu, tổng chi, tiền lý thuyết, tiền thực đếm, chênh lệch (cân/thiếu/thừa).

**Điều chỉnh giữa ca:** loại Thu/Chi, số tiền, lý do bắt buộc, PIN quản lý.

**Đóng ca:** nhập tiền thực đếm, lý do nếu lệch, xác nhận đóng, in biên bản bàn giao.

---

### 8.8. SCR-05 — Orders List

**Filters:** ngày, trạng thái (Tất cả/Chờ thanh toán/Đã thanh toán/Hoàn một phần/Đã hoàn/Đã hủy), phương thức (Tất cả/Tiền mặt/VietQR), thu ngân, tìm kiếm mã đơn.

**Hiển thị:** doanh thu ngày, số đơn, tỷ lệ hủy; bảng mã đơn, thời gian, thu ngân, món, phương thức, tổng tiền, trạng thái, hành động xem chi tiết.

**Khác:** export CSV, phân trang, quay lại POS.

---

### 8.9. SCR-06 — Order Details

**Header:** mã đơn, thời gian, trạng thái, chi nhánh, thu ngân, loại đơn.

**Actions:** in lại bill, in lại phiếu bar, hủy đơn (cần quyền/PIN), hoàn tiền, quay lại danh sách.

**TAB-01 — Món & Topping:**

- Bảng: món, size, đường, đá, topping, SL, đơn giá, thành tiền, ghi chú.
- Tổng: tạm tính, giảm giá, tổng thanh toán.
- BOM usage: nguyên liệu, định lượng lý thuyết, đơn vị, quy đổi.

**TAB-02 — Thanh toán & Hoàn tiền:**

- Phương thức, số tiền, trạng thái, mã giao dịch SePay, tài khoản nhận, ngân hàng, thời gian thanh toán, số tiền nhận, webhook log.
- Lịch sử refund: mã, số tiền, lý do, trạng thái, người yêu cầu/duyệt, thời gian.
- Nút hoàn tiền nếu đơn PAID.

---

### 8.10. Refund (full-screen)

**Fields:** lý do (khách đổi ý, sai món, chất lượng, khác), số tiền hoàn, ghi chú, PIN quản lý, ngưỡng phê duyệt.

**Quy tắc hiển thị:**

- Số tiền hoàn tối đa = đã thanh toán − đã hoàn.
- ≤ ngưỡng: duyệt tại chỗ bằng PIN Manager.
- > ngưỡng: gửi yêu cầu COO, trạng thái “Chờ duyệt”; hiển thị trong Approvals Inbox.
- Refund luôn chi tiền mặt từ két; cập nhật trạng thái đơn và cash transaction.
- Hiển thị tác động lên số dư két trước khi xác nhận.

---

### 8.11. SCR-18 — Approvals Inbox (bổ sung)

**Mục tiêu:** nơi Manager/COO xử lý các yêu cầu vượt ngưỡng hoặc cần hai người duyệt.

**Loại yêu cầu:** hoàn tiền, tiêu hủy/điều chỉnh kho, chênh lệch quỹ, giao dịch thu/chi do Manager tự tạo.

**Hiển thị:** filter loại/trạng thái/chi nhánh, bảng mã, loại, chi nhánh, người tạo, số tiền, lý do, thời gian, trạng thái, hành động. Chi tiết mở rộng inline gồm diff/impact và nút Duyệt/Từ chối + ghi chú.

---

### 8.12. SCR-07 — Branch Dashboard

**KPI:** doanh thu ngày, ca đang mở, nguyên liệu sắp hết, chênh lệch quỹ gần nhất.

**Nội dung:** chart đơn hàng/doanh thu theo giờ (06:00–23:00), danh sách cảnh báo tồn kho, bảng nhân viên đang ca + trạng thái chấm công, quick links POS/Kho/Nhân sự/Báo cáo.

---

### 8.13. SCR-08 — Branch Inventory

**Filters:** tìm kiếm, danh mục nguyên liệu, trạng thái tồn.

**Bảng:** mã, tên, quy cách đóng gói, tồn thực tế (pack + base), ngưỡng an toàn, trạng thái, hành động xem lịch sử/nhập nhanh.

**Phụ:** danh sách phiếu kho gần đây; nút tạo phiếu kho; cảnh báo hết hàng nổi bật bằng nhãn và viền đậm.

---

### 8.14. POP-04 — Stock Slip (full-screen)

**Loại phiếu:** Nhập kho / Tiêu hủy / Kiểm kê.

**Header:** chi nhánh, ngày, người tạo, nhà cung cấp/nguồn, ghi chú.

**Dòng hàng:**

| Loại | Cột |
|---|---|
| Nhập | Nguyên liệu, quy cách, SL (pack), đơn giá/pack, thành tiền, ghi chú |
| Tiêu hủy | Nguyên liệu, tồn khả dụng, SL tiêu hủy, lý do bắt buộc, thành tiền tham chiếu |
| Kiểm kê | Nguyên liệu, tồn sổ, SL thực đếm, chênh lệch, lý do nếu lệch |

**Footer:** tổng tiền, xác nhận của Manager (checkbox + PIN), lưu nháp/gửi duyệt/lưu.

**Quy tắc:** SL nhập/xuất theo đơn vị đóng gói nguyên; không trừ lẻ theo từng ly; vượt ngưỡng điều chỉnh → chờ COO duyệt.

---

### 8.15. SCR-09 TAB-03 — Profiles & Hourly Wage

**Bảng:** mã NV, họ tên, SĐT, vai trò, trạng thái, lương/giờ, PIN, mã thẻ, ngày tạo, thao tác.

**Editor full-screen:** họ tên, SĐT, vai trò, username, PIN 4 số, mã RFID, lương cơ bản, lương/giờ, trạng thái, ghi chú. Validate SĐT 10–11 số bắt đầu bằng 0, PIN duy nhất trong chi nhánh, không xóa cứng.

**Activity log:** lịch sử thao tác trên hồ sơ.

---

### 8.16. SCR-09 TAB-04 — Shifts & Attendance Logs

**Roster:** chọn tuần/tháng; bảng nhân viên × 7 ngày; mỗi ô chọn ca Sáng/Chiều/Tối hoặc nghỉ; hiển thị giờ ca; cảnh báo trùng/thiếu ca.

**Attendance log:** filter ngày, nhân viên, trạng thái; bảng giờ vào/ra thực tế, phương thức, số phút muộn/về sớm, tổng giờ, trạng thái, hành động điều chỉnh.

**Adjustment full-screen:** nhân viên, ngày, giờ vào/ra điều chỉnh, lý do bắt buộc, người duyệt. Manager không được tự duyệt dữ liệu của mình; trường hợp đó gửi COO.

---

### 8.17. SCR-10 — Chain Dashboard

**KPI:** tổng doanh thu ngày, chi nhánh hoạt động, món bán chạy nhất, khung giờ cao điểm.

**Bảng hiệu suất chi nhánh:** doanh thu, COGS, lợi nhuận gộp, biên lợi nhuận, chênh lệch quỹ, trạng thái.

**Phụ:** top món toàn chuỗi, cảnh báo bất thường (hủy đơn, chênh lệch kho), quick links.

---

### 8.18. SCR-11 TAB-05 — Products & Pricing

**Bảng:** mã, tên, danh mục, mô tả, trạng thái, giá S/M/L, topping, chi nhánh tạm ngưng.

**Actions:** thêm/sửa sản phẩm, bật/tắt toàn chuỗi, tạm ngưng theo chi nhánh.

**Editor:** tên, mã, danh mục, mô tả, trạng thái, giá S/M/L, topping áp dụng, chi nhánh tạm ngưng, ảnh placeholder.

---

### 8.19. SCR-11 TAB-06 — Standard Recipe BOM

**Chọn sản phẩm + size.** Bảng BOM: nguyên liệu, đơn vị, định lượng, đơn giá, chi phí. Tổng COGS lý thuyết, giá bán, biên góp.

**Editor BOM:** bảng nguyên liệu có thể thêm/xóa dòng, nhập định lượng, cảnh báo nguyên liệu thiếu giá.

---

### 8.20. SCR-12 — Promotions & Vouchers

**Bảng:** mã, loại giảm, giá trị, đơn tối thiểu, đã dùng/giới hạn, hiệu lực, phạm vi chi nhánh, trạng thái.

**Editor:** mã, loại (%, số tiền), giá trị, đơn tối thiểu, happy hour từ/đến, phạm vi, giới hạn lượt, ngày bắt đầu/kết thúc, trạng thái.

---

### 8.21. SCR-13 — Branches & Managers

**Bảng:** mã, tên, địa chỉ, SĐT, giờ mở/đóng, số bàn, quản lý, trạng thái POS, trạng thái vận hành.

**Editor:** mã, tên, địa chỉ, SĐT, giờ mở/đóng, số bàn, mã số thuế, quản lý được gán, trạng thái (Đang mở/Tạm đóng/Bảo trì), ghi chú.

---

### 8.22. SCR-14 — Chain Sync Center

**Chọn gói:** Menu & giá, BOM, Khuyến mãi. **Chọn chi nhánh:** tất cả hoặc từng chi nhánh. **Ghi chú phiên bản.**

**Kết quả:** trạng thái từng chi nhánh (Thành công/Thất bại/Lý do), thời gian, phiên bản, người thực hiện.

**Lịch sử sync:** bảng thời gian, phiên bản, gói dữ liệu, chi nhánh, trạng thái, người thực hiện.

---

### 8.23. SCR-15 — Reports & Analytics

**Filter chung:** từ ngày, đến ngày, chi nhánh (COO), loại báo cáo, export Excel/PDF/CSV.

**TAB-07 — Báo cáo vận hành chi nhánh:**

- Doanh thu ngày/tuần, số đơn, giá trị đơn trung bình, tỷ lệ hủy/hoàn.
- Cơ cấu thanh toán: tiền mặt vs VietQR/SePay, theo ca.
- Nhật ký chênh lệch quỹ: mở ca, thu, chi, doanh thu tiền mặt, hoàn tiền, lý thuyết, thực đếm, chênh lệch, lý do.
- Luân chuyển kho & hao hụt: tồn đầu, nhập, xuất, tiêu hủy, tồn cuối, lý thuyết, hao hụt.
- Chi phí nhân sự theo ca: giờ làm, lương/giờ, thành tiền.
- Báo cáo nhân sự: chấm công, đi muộn/về sớm, vắng, giờ làm, năng suất.
- Bán chạy & giờ cao điểm.

**TAB-08 — Báo cáo tài chính hợp nhất:**

- P&L theo chi nhánh: doanh thu, COGS, lợi nhuận gộp, biên lợi nhuận.
- Biên lợi nhuận theo món.
- Dòng tiền qua ngân hàng/SePay.
- Tăng trưởng theo quý/năm.
- KPI biên lợi nhuận gộp bình quân.

---

### 8.24. SCR-16 TAB-09 — Roles & Permissions Matrix

**Ma trận:** hàng = màn hình/chức năng; nhóm cột = 4 vai trò; mỗi vai trò có 7 quyền: Xem, Thêm, Sửa, Xóa, Duyệt, Hủy, Hoàn tiền. Checkbox nhỏ, header dính, cuộn ngang.

**Lưu ý:** quyền của Staff chỉ gồm Kiosk; COO có toàn quyền cấu hình.

---

### 8.25. SCR-16 TAB-10 — Bank & SePay Webhook Config

**Fields:** tên ngân hàng, số tài khoản, chủ tài khoản, SePay API token (masked), webhook URL, secret key, mẫu nội dung chuyển khoản, thời hạn QR, môi trường, trạng thái kết nối.

**Công cụ:** Test Ping Webhook, log gói tin gần đây (thời gian, reference, order, amount, signature, status, raw payload).

---

### 8.26. SCR-16 TAB-11 — Ngưỡng phê duyệt (bổ sung)

- Ngưỡng hoàn tiền Manager được duyệt.
- Ngưỡng tiêu hủy/điều chỉnh kho Manager được duyệt.
- Ngưỡng chênh lệch quỹ cần giải trình.
- Bật/tắt yêu cầu COO duyệt cho giao dịch Manager tự tạo.
- Lưu cấu hình + audit.

---

### 8.27. SCR-17 — Audit Logs

**Filters:** khoảng ngày, chi nhánh, loại hành động, từ khóa.

**Bảng:** thời gian, người thực hiện, vai trò, chi nhánh, hành động, đối tượng, IP, diff payload (mở rộng inline, before/after).

**Actions:** export CSV, phân trang. Ghi chú log bất biến.

---

## 9. Luồng sử dụng chính

### 9.1. Bán hàng & thanh toán

```
Đăng nhập → Dispatcher → POS
  → chọn món → tùy chỉnh size/đường/đá/topping → thêm giỏ
  → áp voucher → chọn loại đơn → thanh toán
  → tiền mặt (tính tiền thối) hoặc VietQR (webhook mô phỏng)
  → PAID → in bill/phiếu bar → giỏ reset
```

### 9.2. Hoàn tiền

```
Orders → Order Details → TAB-02 → Hoàn tiền
  → lý do + số tiền + PIN Manager
  → nếu ≤ ngưỡng: cập nhật đơn + trừ quỹ
  → nếu > ngưỡng: gửi Approvals Inbox → COO duyệt
  → audit log
```

### 9.3. Ca quỹ

```
POS → Ca quỹ
  → mở ca + tiền đầu ca
  → thu/chi giữa ca (lý do + PIN Manager)
  → đóng ca: nhập tiền thực đếm
  → chênh lệch → bắt buộc lý do
  → in biên bản bàn giao
```

### 9.4. Kho

```
Branch → Kho → tạo phiếu
  → Nhập / Tiêu hủy / Kiểm kê
  → nhập dòng nguyên liệu, quy cách, số lượng, chi phí/lý do
  → Manager xác nhận PIN
  → cập nhật tồn → audit → cảnh báo nếu dưới ngưỡng
```

### 9.5. Quản trị chuỗi

```
Chain Dashboard → Menu/BOM → cập nhật → Sync Center
  → chọn gói dữ liệu + chi nhánh → publish version
  → kết quả từng chi nhánh → lịch sử sync
```

### 9.6. Báo cáo

```
Reports → chọn kỳ + chi nhánh + loại báo cáo
  → xem KPI/chart/bảng
  → export Excel/PDF/CSV
```

---

## 10. Dữ liệu mô phỏng

- 8 chi nhánh tại Hà Nội/TP.HCM/Đà Nẵng/Hải Phòng/Cần Thơ.
- ~20 nhân viên, đủ 4 vai trò, có PIN/RFID/lương giờ.
- 5 danh mục, ~24 sản phẩm, 5 topping.
- ~15 nguyên liệu với quy cách đóng gói, tồn kho, ngưỡng an toàn, đơn giá.
- BOM cho các sản phẩm chính theo size S/M/L.
- 60+ đơn hàng trong ngày 20/10/2026, đủ trạng thái và phương thức.
- 10 voucher, 20 phiếu kho, 30 audit log, lịch sử sync, webhook log.
- Doanh thu, COGS, lợi nhuận, tồn kho, chấm công được tính từ dữ liệu mock để báo cáo nhất quán.

**Lưu trữ:** state prototype lưu `localStorage`; có nút reset để quay về dữ liệu gốc.

---

## 11. Kiến trúc prototype

```
prototype/
  index.html
  assets/css/app.css
  assets/js/data.js
  assets/js/core.js
  assets/js/views-auth.js
  assets/js/views-pos.js
  assets/js/views-orders.js
  assets/js/views-branch.js
  assets/js/views-chain.js
  assets/js/views-reports.js
  assets/js/views-settings.js
```

- Vanilla HTML/CSS/JS, hash router, classic script — mở trực tiếp file hoặc qua HTTP server.
- Không framework, không build, không CDN.
- `data.js`: dữ liệu gốc, hàm sinh dữ liệu, helper tính toán.
- `core.js`: router, state, format, component UI, toast, dialog, export, layout.
- Mỗi file `views-*.js` đăng ký view và action với `SCMS`.
- Event delegation toàn cục qua `data-action`.
- Chart SVG/CSS; export CSV/Excel-HTML; PDF qua print CSS.
- Responsive breakpoints: 1440+, 1280, 1024, 768, 480.

---

## 12. Ma trận phủ yêu cầu

| Yêu cầu | Màn hình prototype |
|---|---|
| UC01 Login | SCR-01, SCR-03 |
| UC02 Roles | SCR-16 TAB-09 |
| UC03/UC04 Check-in/out | SCR-02 |
| UC05/UC06 Branches & Managers | SCR-13 |
| UC07 Employee Profiles | SCR-09 TAB-03 |
| UC08 Work Shifts | SCR-09 TAB-04 |
| UC09–UC11 Menu/Product/Pricing | SCR-11 TAB-05 |
| UC12 Recipe BOM | SCR-11 TAB-06 |
| UC13 Promotion | SCR-12 |
| UC14 Sync | SCR-14 |
| UC15 SePay Config | SCR-16 TAB-10 |
| UC16–UC22 POS/Checkout/Print | SCR-04, POP-01, POP-02, SCR-06 |
| UC17 Voucher | SCR-04 |
| UC18 Order Info | SCR-05, SCR-06 |
| UC23 Refund | SCR-06 TAB-02, Refund, SCR-18 |
| UC24–UC27 Cash Drawer | POP-03 |
| UC28–UC33 Inventory | SCR-08, POP-04, SCR-18 |
| UC34–UC39 Branch Reports | SCR-07, SCR-15 TAB-07 |
| UC40–UC42 Chain Reports | SCR-10, SCR-15 TAB-08 |
| UC43/UC44 VietQR/SePay | POP-02, SCR-16 TAB-10 |
| Audit BR-51 | SCR-17 |
| Screen authorization | Router role guard, sidebar, Dispatcher |

---

## 13. Điểm chưa nhất quán trong tài liệu gốc và cách xử lý

1. **POP-03 / POP-04:** Screen description gọi Stock Slip là POP-03, nhưng một số bảng gọi POP-04; Cash Drawer được gọi POP-02/POP-03. Prototype dùng nhãn chức năng (“Ca quỹ”, “Phiếu kho”) và hiển thị mã tham chiếu tại header, không phụ thuộc số POP.
2. **Approvals Inbox SCR-18 và TAB-11:** Được nhắc trong BR-32, BR-35, UC32/UC30 nhưng không có screen definition. Prototype bổ sung màn hình Phê duyệt và tab Ngưỡng phê duyệt.
3. **Role Staff:** Staff không có tài khoản nhưng bảng Screen Authorization có đánh dấu một số màn hình. Prototype chỉ cho Staff dùng Kiosk, đúng theo mô tả actor.
4. **Refund và trạng thái đơn:** BR-26 nói đơn PAID bị khóa, nhưng vẫn có refund. Prototype giữ trạng thái gốc PAID và thêm trạng thái hiển thị Hoàn một phần/Đã hoàn, không sửa dữ liệu đơn gốc.
5. **Màu trạng thái:** Requirement gốc dùng đỏ/vàng/xanh; theo định hướng khách chọn, prototype dùng đơn sắc + accent cà phê, trạng thái phân biệt bằng nhãn/độ đậm/viền/icon.

---

## 14. Kiểm thử prototype

### 14.1. Checklist chức năng

- [ ] Login với 4 role, khóa sau 5 lần sai.
- [ ] Kiosk: check-in, check-out, PIN sai, không có ca, numpad.
- [ ] Dispatcher: hiển thị đúng quyền từng role.
- [ ] POS: search, category, thêm món, tùy chỉnh, sửa SL, xóa, voucher, giữ đơn, tổng tiền.
- [ ] Checkout tiền mặt: quick cash, tiền thối, validation, in bill.
- [ ] Checkout QR: webhook thành công, webhook sai tiền, trạng thái chờ.
- [ ] Ca quỹ: mở ca, thu/chi, đóng ca, chênh lệch, lý do.
- [ ] Orders: filter, phân trang, export, xem chi tiết, tabs.
- [ ] Refund: dưới ngưỡng, vượt ngưỡng, cập nhật quỹ và trạng thái.
- [ ] Approvals: duyệt/từ chối, cập nhật trạng thái.
- [ ] Inventory: filter, tạo 3 loại phiếu, cập nhật tồn, cảnh báo.
- [ ] Employees/Shifts: thêm/sửa, validate PIN/SĐT, roster, điều chỉnh công.
- [ ] Chain: KPI, menu, BOM, promotion, branch, sync.
- [ ] Reports: tất cả loại báo cáo, export.
- [ ] Settings: RBAC, SePay, ngưỡng.
- [ ] Audit: filter, diff, export.
- [ ] Role guard, reset demo, responsive, keyboard shortcuts.

### 14.2. Checklist giao diện

- [ ] Không có card lồng nhiều tầng; section dùng divider.
- [ ] Chỉ accent cho primary/active/highlight.
- [ ] Radius 4–8px, shadow tối thiểu.
- [ ] Số liệu căn phải, tiền tệ đúng định dạng.
- [ ] Bảng dài có sticky header, empty state, phân trang.
- [ ] Touch target ≥ 44px ở POS/Kiosk.
- [ ] Focus visible, label đầy đủ, contrast đạt.
- [ ] Không external request, chạy offline.
- [ ] Hiển thị tốt ở 1920×1080, 1366×768, 1024×768, 390×844.

---

## 15. Kết luận

Prototype này là bản mô phỏng có thể bấm được của toàn bộ phạm vi v1.0, tập trung vào cấu trúc dữ liệu, luồng vận hành và khả năng kiểm tra yêu cầu. Sau khi khách hàng trải nghiệm, các điều chỉnh về nhãn, thứ tự field, quy tắc phê duyệt và mức độ chi tiết báo cáo có thể được cập nhật trực tiếp trong tài liệu này trước khi bước sang thiết kế kỹ thuật/backend.
