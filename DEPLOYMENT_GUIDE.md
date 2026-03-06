# دليل النشر على GitHub Pages
## جمعية أساتذة علوم الحياة والأرض — APSVT

---

## الخطوة 1 — إعداد قاعدة البيانات على Supabase

1. اذهب إلى **supabase.com** وافتح مشروع **asso-APSVT**
2. في القائمة الجانبية، انقر على **SQL Editor**
3. انقر على **New query**
4. افتح الملف `supabase_tables.sql` من هذا المجلد
5. انسخ كامل محتواه والصقه في محرر SQL
6. انقر على زر **Run** (أو اضغط Ctrl+Enter)
7. يجب أن تظهر رسالة: **Success**

---

## الخطوة 2 — تثبيت Node.js على حاسوبك

1. اذهب إلى **nodejs.org**
2. حمّل النسخة **LTS** (الموصى بها)
3. ثبّتها بالإعدادات الافتراضية
4. تحقق من التثبيت: افتح **Terminal** (أو Command Prompt) واكتب:
   ```
   node --version
   ```
   يجب أن تظهر نسخة مثل: `v20.x.x`

---

## الخطوة 3 — تثبيت المشروع

1. ضع مجلد `apsvt` في مكان مناسب على حاسوبك (مثلاً سطح المكتب)
2. افتح **Terminal** داخل مجلد `apsvt`:
   - على Windows: انقر بزر الفأرة الأيمن داخل المجلد ← "Open in Terminal"
   - على Mac: Terminal ← `cd` ثم اسحب المجلد
3. اكتب الأمر التالي واضغط Enter:
   ```
   npm install
   ```
   انتظر حتى تنتهي عملية التثبيت (1-3 دقائق)

---

## الخطوة 4 — ربط المشروع بـ GitHub

1. اذهب إلى **github.com** وسجّل الدخول
2. انقر على **"New repository"** (المستودع الجديد)
3. اسم المستودع: `apsvt`
4. اختر **Public**
5. لا تضف أي ملفات إضافية
6. انقر **"Create repository"**

7. GitHub سيعطيك أوامر — انسخ اسم المستخدم الخاص بك (يظهر في الرابط)

8. افتح ملف `package.json` وعدّل السطر التالي بإضافة اسم مستخدمك:
   ```
   "homepage": "https://اسم_المستخدم.github.io/apsvt"
   ```

---

## الخطوة 5 — النشر على GitHub Pages

في Terminal داخل مجلد `apsvt`، اكتب هذه الأوامر **واحداً تلو الآخر**:

```bash
git init
git add .
git commit -m "first commit - APSVT app"
git branch -M main
git remote add origin https://github.com/اسم_المستخدم/apsvt.git
git push -u origin main
npm run deploy
```

⏳ انتظر دقيقتين...

---

## الخطوة 6 — تفعيل GitHub Pages

1. في GitHub، افتح مستودع `apsvt`
2. انقر على **Settings**
3. في القائمة الجانبية، انقر **Pages**
4. في **Branch**، اختر `gh-pages` ثم `/ (root)`
5. انقر **Save**

---

## ✅ التطبيق الآن متاح على الإنترنت!

رابط التطبيق:
```
https://اسم_المستخدم.github.io/apsvt
```

---

## تحديث التطبيق لاحقاً

في كل مرة تعدّل فيها الكود، نفّذ:
```bash
npm run deploy
```

---

## في حال واجهتك مشكلة

تواصل معنا وأعطنا رسالة الخطأ التي ظهرت.
