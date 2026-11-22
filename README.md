# Hodimlar hisoboti

Hodimlar ro'yxati (rasm, F.I.Sh., lavozim, vazifa, bajarilish foizi) — PWA (Progressive Web App, ya'ni
brauzer orqali kompyuterga o'rnatiladigan ilova).

## Rejimlar
- **Lokal rejim** — `config.js` bo'sh bo'lsa. Ma'lumot faqat shu kompyuterning brauzerida saqlanadi (sinov uchun).
- **Online rejim** — `config.js` ga Supabase URL va kalit yozilsa. Barcha kompyuterlar bitta bazani ko'radi,
  o'zgarishlar jonli yangilanadi.

## Online qilish (bir marta)
1. Supabase loyihasi yaratiladi, `supabase_schema.sql` SQL Editor'da ishga tushiriladi.
2. Project URL va publishable (anon) kalit `config.js` ga yoziladi.
3. Papka bepul hostingga joylanadi (GitHub Pages / Netlify) — shunda doimiy manzil paydo bo'ladi.

## Har bir kompyuterga o'rnatish
Chrome yoki Edge'da ilova manzilini ochib → manzil qatoridagi ⊕ belgisi yoki ilovadagi **⬇ O'rnatish** tugmasi.
Ilova Start menyu va ish stolida alohida oyna bo'lib ochiladi.

## Lokal sinov
```
python -m http.server 8765
```
so'ng http://localhost:8765
