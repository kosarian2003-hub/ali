# خورشید (Khorshid) — Home Appliance Distribution & Repair Website

A bilingual (Persian default / English), dark+light mode, fully responsive
website with a working backend: live product data from an Excel file, auth,
cart, checkout with a Snapp-style delivery map, and a lightweight accounting
layer.

## What's actually inside (please read before deploying)

You asked for a first phase built in **HTML + Tailwind CSS**, plus an API that
feeds product data from Excel, live auth, a full accounting back-end, and a
payment page. Static HTML/Tailwind alone cannot read a file, run a live poll
against a spreadsheet, or keep a real user/order ledger — that needs a server.
So:

- **Frontend**: pure HTML + Tailwind CSS (via CDN), vanilla JS — exactly the
  stack you asked for, in `frontend/`.
- **Backend**: a small **Python/Flask** API in `backend/`, because it reads
  Excel directly with `openpyxl` and needed no extra tooling. If you'd rather
  standardize on Node.js/Express for a later phase, the API surface below is
  simple enough to port directly.
- **The Excel file** (`backend/data/products.xlsx`) is the live "database" for
  the product catalog — 8 real sample products, ready to edit.

## Running it

```bash
cd backend
pip install -r requirements.txt
python app.py
```

Open **http://localhost:5000** — that's it, the Flask server serves both the
API and the frontend pages.

Edit `backend/data/products.xlsx` (name, price, or stock) while the server is
running, save it, and the product grid on the site updates within 10 seconds
— no restart needed. That's the "live update" you asked for: the frontend
polls `GET /api/products` every 10 seconds, and that endpoint re-reads the
Excel file on every request.

## Pages

| Page | File |
|---|---|
| Landing / trust page (video slot) | `frontend/index.html` |
| Product catalog (live from Excel) | `frontend/products.html` |
| Login | `frontend/login.html` |
| Sign up | `frontend/signup.html` |
| Checkout: cart, shipping, delivery map, payment | `frontend/payment.html` |

### Adding your real video
Open `frontend/index.html`, find the comment `VIDEO PLACEHOLDER`, and replace
the placeholder `<div id="hero-video-slot">` with a real `<video>` tag (an
example is left commented right below it) or an `<iframe>` if you'll host the
video on YouTube/Aparat.

## The backend, in plain terms

- `GET /api/products` — reads `products.xlsx` live, returns JSON. Used by the
  product grid, polled every 10s.
- `POST /api/auth/signup`, `/login`, `/logout`, `GET /api/auth/me` — session-
  based auth; passwords are hashed, never stored in plain text.
- `POST /api/orders` — creates an order from the cart; **first order for a
  logged-in customer ships free, every order after that is charged a flat
  fee** (change `STANDARD_SHIPPING_FEE` in `app.py`).
- `POST /api/orders/<id>/pay` — confirms payment and issues an invoice (see
  "Payment gateway" below for what's real vs. placeholder here).
- `GET /api/accounting/summary` — revenue, shipping collected, paid/pending
  order counts, current inventory value, out-of-stock list. This is the seed
  of the accounting module: enough to see the business's numbers today, and
  structured so you can extend it (see "Growing the accounting module").
- `POST /api/admin/upload-products` — lets you push a new Excel file to the
  server. This exists specifically for the scenario below.

## "The site is hosted, but my Excel file is on my own computer"

Be aware of the actual constraint here: a server sitting on the internet has
no way to reach into your laptop's filesystem on its own — nothing can watch
a file it can't see, no matter how the site is built. So there has to be a
bridge. Two practical options, both included:

1. **`backend/sync_watcher.py`** — run this small script on your own
   computer. It watches your local `products.xlsx` and, the instant you save
   a change in Excel, uploads it to your hosted site via
   `POST /api/admin/upload-products`. The site then reflects it on its next
   10-second poll, same as running everything locally.
   ```bash
   pip install requests
   python sync_watcher.py --file "C:\path\to\products.xlsx" --url https://your-site.com
   ```
   Leave it running in the background, or set it up as a scheduled task.

2. **A synced cloud folder** (Google Drive Desktop, OneDrive, Dropbox): point
   `PRODUCTS_XLSX` in `app.py` at a folder on the server that's synced to the
   same cloud folder you edit locally. No custom script needed, but it does
   mean trusting that sync service.

There's no third option where a plain hosted static site reads a file that
only exists on your PC — that's a hard networking constraint, not a
limitation of this build.

## Payment gateway — what's real, what's a placeholder

`POST /api/orders/<id>/pay` currently **simulates a successful payment** so
the rest of the flow (invoice, accounting) is fully wired and testable. Iran
doesn't have Stripe/PayPal-style access, so this needs a real Iranian PSP —
commonly Zarinpal, IDPay, or a bank's own gateway — which requires you to
register a merchant account and get real credentials first. Once you have
them, replace the body of `pay_order()` in `app.py` with: request a payment
from the gateway, redirect the browser to their page, verify their callback,
*then* mark the order paid. I didn't fabricate a gateway integration since it
would silently fail (or worse, look like it works) without real credentials.

## Growing the accounting module

What's here — an order ledger, invoices, and a revenue/inventory summary — is
a real starting point, not a mock. A "complete" accounting system (double-
entry bookkeeping, tax handling, supplier payables, multi-user permissions)
is its own project; the JSON-file storage here is meant to be swapped for a
proper database (PostgreSQL/MySQL) once you're past the prototype stage —
the API routes won't need to change shape, just their storage layer.

## Design notes

- Palette: deep engineering blue (`#1B4F8C` family) on white in light mode,
  the same blue family on near-black in dark mode, with a small warm gold
  accent (`#F2A83B`) used sparingly — a nod to *khorshid* (sun) — for the
  logo mark and the divider between the hero and trust sections.
- Type: **Vazirmatn** for Persian + Latin text (headings and body), **IBM
  Plex Mono** for prices, stats and SKUs — appliances live and die on their
  spec sheets, so numbers get a distinct, technical typeface.
- The four-step "how service works" section uses numbered markers because
  it's a genuine sequence a customer follows, not decoration.
- Dark/light mode defaults to the visitor's OS setting and remembers a manual
  override; language defaults to Persian (RTL) and remembers a manual switch
  to English (LTR).

## What you'd still want before a public launch

- A real payment gateway integration (see above).
- Moving the JSON "database" to a proper database once order volume matters.
- HTTPS + a production WSGI server (e.g. `gunicorn`) instead of Flask's dev
  server — the dev server is fine for building and testing, not for hosting.
- Real product photography (the product cards currently use a placeholder
  icon — swap in real images via the `image` column in the Excel file plus a
  small change in `frontend/assets/js/products.js`).


# خورشید (Khorshid) — وب‌سایت توزیع و تعمیرات لوازم خانگی

یک **Website** دو زبانه (فارسی به‌صورت پیش‌فرض / English)، با پشتیبانی از **Dark Mode** و **Light Mode**، کاملاً **Responsive** و مجهز به **Back-end** کامل؛ شامل دریافت زنده اطلاعات محصولات از فایل **Excel**، سیستم احراز هویت (**Authentication**)، سبد خرید (**Cart**)، صفحه پرداخت (**Checkout**) با انتخاب محل تحویل روی **Map** مشابه **Snapp** و یک سیستم اولیه **Accounting**.

---

# محتوای پروژه (قبل از Deploy حتماً مطالعه کنید)

شما درخواست کرده بودید که فاز اول پروژه با **HTML + Tailwind CSS** ساخته شود و همچنین شامل **API** برای دریافت اطلاعات از فایل **Excel**، سیستم **Authentication**، یک **Accounting System** کامل و صفحه **Payment** باشد.

اما باید توجه داشت که **HTML** و **Tailwind CSS** به‌تنهایی قادر به خواندن فایل، دریافت اطلاعات به‌صورت زنده از **Excel** یا مدیریت کاربران، سفارش‌ها و حسابداری نیستند؛ برای این موارد وجود یک **Server** الزامی است.

به همین دلیل ساختار پروژه به این صورت طراحی شده است:

* **Frontend:** کاملاً با **HTML + Tailwind CSS (CDN)** و **Vanilla JavaScript**، دقیقاً مطابق درخواست شما، داخل پوشه `frontend/`
* **Backend:** با استفاده از **Python/Flask** داخل پوشه `backend/`، زیرا این فریمورک به‌سادگی می‌تواند فایل **Excel** را با استفاده از کتابخانه **openpyxl** بخواند و به ابزار اضافه‌ای نیاز ندارد.
* در صورت تمایل، در فازهای بعدی می‌توان **Backend** را به **Node.js/Express** منتقل کرد، زیرا ساختار **API** به‌گونه‌ای طراحی شده که انتقال آن بسیار ساده خواهد بود.
* فایل **Excel** با مسیر `backend/data/products.xlsx` به‌عنوان پایگاه داده محصولات استفاده می‌شود و شامل ۸ محصول نمونه است که آماده ویرایش هستند.

---

# اجرای پروژه

```bash
cd backend
pip install -r requirements.txt
python app.py
```

سپس آدرس زیر را در مرورگر باز کنید:

**[http://localhost:5000](http://localhost:5000)**

سرور **Flask** هم‌زمان هم **Frontend** و هم **API** را اجرا خواهد کرد.

اگر در زمان اجرای سرور فایل

`backend/data/products.xlsx`

را ویرایش کنید (مانند تغییر نام، قیمت یا موجودی محصول)، پس از ذخیره فایل، اطلاعات سایت حداکثر طی ۱۰ ثانیه به‌روزرسانی خواهد شد و نیازی به راه‌اندازی مجدد سرور نیست.

این همان قابلیت **Live Update** است که درخواست کرده بودید؛ زیرا **Frontend** هر ۱۰ ثانیه درخواست

`GET /api/products`

ارسال می‌کند و **Backend** در هر درخواست، فایل **Excel** را مجدداً می‌خواند.

---

# صفحات سایت

| صفحه                                               | فایل                     |
| -------------------------------------------------- | ------------------------ |
| صفحه معرفی و جلب اعتماد مشتری (محل قرارگیری ویدئو) | `frontend/index.html`    |
| صفحه محصولات (اطلاعات زنده از Excel)               | `frontend/products.html` |
| Login                                              | `frontend/login.html`    |
| Sign Up                                            | `frontend/signup.html`   |
| Checkout (سبد خرید، ارسال، نقشه و پرداخت)          | `frontend/payment.html`  |

---

## افزودن ویدئوی واقعی

فایل

`frontend/index.html`

را باز کنید.

کامنت

`VIDEO PLACEHOLDER`

را پیدا کنید و **div**

```html
<div id="hero-video-slot">
```

را با یک تگ **video** یا **iframe** (در صورت استفاده از YouTube یا Aparat) جایگزین کنید.

نمونه کد نیز در همان فایل قرار داده شده است.

---

# Backend به زبان ساده

### `GET /api/products`

فایل **products.xlsx** را به‌صورت زنده می‌خواند و اطلاعات را به شکل **JSON** برمی‌گرداند.

این **API** هر ۱۰ ثانیه توسط صفحه محصولات فراخوانی می‌شود.

---

### Authentication

شامل مسیرهای:

* `POST /api/auth/signup`
* `POST /api/auth/login`
* `POST /api/auth/logout`
* `GET /api/auth/me`

رمز عبور کاربران به‌صورت **Hash** ذخیره می‌شود و هرگز به شکل متن ساده (**Plain Text**) نگهداری نخواهد شد.

---

### ثبت سفارش

`POST /api/orders`

از اطلاعات **Cart** یک سفارش ایجاد می‌کند.

اولین سفارش هر کاربر، ارسال رایگان خواهد داشت و از سفارش دوم به بعد، هزینه ثابت ارسال دریافت می‌شود.

مقدار هزینه ارسال از متغیر

`STANDARD_SHIPPING_FEE`

در فایل

`app.py`

قابل تغییر است.

---

### پرداخت سفارش

`POST /api/orders/<id>/pay`

پس از تأیید پرداخت، سفارش را نهایی کرده و **Invoice** صادر می‌کند.

---

### بخش Accounting

`GET /api/accounting/summary`

اطلاعات زیر را نمایش می‌دهد:

* درآمد کل
* مجموع هزینه‌های ارسال
* تعداد سفارش‌های پرداخت‌شده
* تعداد سفارش‌های پرداخت‌نشده
* ارزش فعلی موجودی انبار
* لیست کالاهای ناموجود

این بخش پایه اولیه سیستم **Accounting** محسوب می‌شود و به‌گونه‌ای طراحی شده که در آینده بتوان امکانات بیشتری به آن اضافه کرد.

---

### آپلود فایل جدید Excel

`POST /api/admin/upload-products`

امکان ارسال فایل جدید **Excel** به سرور را فراهم می‌کند.

---

# اگر سایت روی Host باشد اما فایل Excel روی کامپیوتر شخصی من باشد چه می‌شود؟

باید به این نکته توجه داشت که یک **Server** که روی اینترنت قرار دارد، نمی‌تواند مستقیماً به فایل‌های موجود روی کامپیوتر شخصی شما دسترسی داشته باشد.

بنابراین نیاز به یک واسطه وجود دارد.

دو روش برای این کار در پروژه در نظر گرفته شده است.

### روش اول (پیشنهادی)

فایل

`backend/sync_watcher.py`

را روی کامپیوتر خود اجرا کنید.

این برنامه فایل **products.xlsx** را زیر نظر می‌گیرد و به محض ذخیره شدن تغییرات، فایل را از طریق

`POST /api/admin/upload-products`

به سایت ارسال می‌کند.

در نتیجه، سایت نیز در به‌روزرسانی بعدی (حداکثر ۱۰ ثانیه بعد) اطلاعات جدید را نمایش خواهد داد.

اجرای آن:

```bash
pip install requests
python sync_watcher.py --file "C:\path\to\products.xlsx" --url https://your-site.com
```

می‌توانید این برنامه را همیشه در پس‌زمینه اجرا کنید یا به‌عنوان یک **Scheduled Task** تنظیم نمایید.

---

### روش دوم

استفاده از سرویس‌های همگام‌سازی ابری مانند:

* Google Drive Desktop
* OneDrive
* Dropbox

در این روش کافی است فایل **Excel** داخل پوشه همگام‌سازی قرار گیرد و مسیر

`PRODUCTS_XLSX`

در فایل

`app.py`

به همان پوشه اشاره کند.

---

هیچ راه سومی وجود ندارد که یک **Static Website** بتواند مستقیماً فایل موجود روی کامپیوتر شخصی شما را بخواند؛ این محدودیت مربوط به معماری شبکه است، نه محدودیت این پروژه.

---

# درگاه پرداخت

در حال حاضر مسیر

`POST /api/orders/<id>/pay`

فقط یک پرداخت موفق را **شبیه‌سازی** می‌کند تا فرآیند صدور **Invoice** و سیستم **Accounting** قابل آزمایش باشد.

برای استفاده واقعی باید از یکی از **Payment Gateway**های ایرانی مانند:

* Zarinpal
* IDPay
* یا درگاه بانک‌ها

استفاده کنید.

پس از دریافت اطلاعات حساب و کلیدهای دسترسی (**API Credentials**) کافی است تابع

`pay_order()`

در فایل

`app.py`

را به درگاه واقعی متصل کنید تا:

1. درخواست پرداخت ایجاد شود.
2. کاربر به صفحه پرداخت منتقل شود.
3. پاسخ درگاه بررسی گردد.
4. سفارش به‌عنوان پرداخت‌شده ثبت شود.

---

# توسعه سیستم Accounting

بخش فعلی شامل:

* ثبت سفارش‌ها
* صدور فاکتور
* خلاصه درآمد
* ارزش موجودی انبار

است و یک پایه واقعی برای سیستم **Accounting** محسوب می‌شود.

در آینده می‌توان امکاناتی مانند:

* حسابداری دوطرفه (**Double-entry Bookkeeping**)
* مدیریت مالیات
* مدیریت تأمین‌کنندگان
* سطوح دسترسی کاربران
* گزارش‌های مالی پیشرفته

را به آن اضافه کرد.

همچنین ذخیره‌سازی فعلی که بر پایه فایل **JSON** است، در نسخه نهایی می‌تواند به پایگاه داده‌هایی مانند **PostgreSQL** یا **MySQL** منتقل شود، بدون اینکه ساختار **API** تغییر کند.

---

# طراحی رابط کاربری

* در **Light Mode** از ترکیب رنگ آبی مهندسی تیره (`#1B4F8C`) و سفید استفاده شده است.
* در **Dark Mode** همان طیف آبی در کنار مشکی نزدیک به مطلق به‌کار رفته است.
* رنگ طلایی گرم (`#F2A83B`) به‌صورت محدود برای لوگو و جداکننده بخش معرفی استفاده می‌شود که اشاره‌ای به مفهوم **خورشید** دارد.
* فونت **Vazirmatn** برای متن‌های فارسی و انگلیسی استفاده شده است.
* فونت **IBM Plex Mono** برای نمایش قیمت‌ها، آمار و کد محصولات (**SKU**) در نظر گرفته شده تا ظاهر فنی‌تری ایجاد کند.
* بخش «نحوه ارائه خدمات» به‌صورت چهار مرحله شماره‌گذاری‌شده طراحی شده تا روند واقعی خدمات را به مشتری نمایش دهد.
* **Dark Mode** و **Light Mode** به‌صورت پیش‌فرض از تنظیمات سیستم‌عامل کاربر پیروی می‌کنند، اما انتخاب دستی کاربر نیز ذخیره خواهد شد.
* زبان پیش‌فرض سایت فارسی (**RTL**) است و در صورت تغییر به **English (LTR)**، این انتخاب نیز ذخیره می‌شود.

---

# مواردی که قبل از انتشار عمومی سایت باید تکمیل شوند

* اتصال به یک **Payment Gateway** واقعی.
* انتقال ذخیره‌سازی از فایل‌های **JSON** به یک پایگاه داده مانند **PostgreSQL** یا **MySQL**.
* استفاده از **HTTPS** و اجرای پروژه روی یک **WSGI Server** مانند **gunicorn** به‌جای **Flask Development Server**.
* جایگزین کردن تصاویر نمونه محصولات با تصاویر واقعی از طریق ستون **image** در فایل **Excel** و اعمال یک تغییر کوچک در فایل `frontend/assets/js/products.js`.


cd backend
pip install -r requirements.txt
python app.py

http://127.0.0.1:5000
http://localhost:5000