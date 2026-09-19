# 03 — ISTQB Referans Sayfası

> Bu döküman, ürünün üzerine kurulduğu **doğrulanmış olgusal temeldir**. Her satır resmî PDF'lerden okunarak teyit edilmiştir. Kod yazılırken sabitler buradan alınır.
> **Son doğrulama:** 19.09.2026

---

## 1. Güncel müfredat durumu

| Bilgi | Değer | Kaynak |
|---|---|---|
| Güncel CTFL müfredatı | **v4.0.1** | PDF kapağı + Revision History |
| v4.0.1 tarihi | **15.09.2024** — "CTFL v4.0.1 – Errata" | syllabus s.3 |
| v4.0 genel yayın | 21.04.2023 (duyuru 09.05.2023) | syllabus s.3 |
| v3.1 emeklilik | EN: 09.05.2024 · diğer diller: 09.11.2024 | ISTQB duyurusu |
| v4.1 / v5.0 | **YOK** (Eylül 2026 itibarıyla) | Exam Structures & Rules tables **v1.19, 19.08.2026** hâlâ yalnızca "CTFL v4.0" satırını içeriyor |

**Kaynaklar**
- Müfredat PDF: https://istqb.org/?sdm_process_download=1&download_id=3345
- İndirme sayfası: https://istqb.org/sdm_categories/certified-tester-foundation-level-ctfl-v4-0/
- Exam Structures & Rules: https://istqb.org/?sdm_process_download=1&download_id=3829
- Exam Structures & Rules **tables**: https://istqb.org/?sdm_process_download=1&download_id=3832

**v4.0 → v4.0.1 farkı (Appendix C):** Yalnızca errata. 6 öğrenme hedefinin *ifadesi* değişti (FL-1.4.1, FL-2.1.5, FL-3.1.1, FL-3.1.3, FL-4.1.1, FL-5.2.3) + sözlük terimleriyle hizalama (*artifacts → work products*, *performance → performance efficiency*). **LO numaraları, sayısı ve K-seviyeleri değişmedi.**

### TTB Türkçe çevirisi — VAR ✔
- PDF: https://www.turkishtestingboard.org/files/pdfs/ISTQB_CTFL_Syllabus-v4.0.1.pdf
- Sayfa: https://www.turkishtestingboard.org/temel-seviye-sertifikali-test-uzmani-ders-programi-turkce/
- Başlık: *"Sertifikalı Test Uzmanı Temel Seviye Ders Programı v4.0.1"*

> **Veri modeli için kritik:** Türkçe çeviride **LO kodları `FL-x.y.z` olarak İngilizce kalıyor** (`ÖH-` gibi bir yerelleştirme yok). Yani LO kodu **dil-bağımsız birincil anahtar** olarak kullanılabilir.

⚠️ *Çözülemeyen tutarsızlık:* TTB "6 Mayıs 2024'ten itibaren geçerli" diyor ama ISTQB'nin v4.0.1 errata tarihi 15.09.2024. TTB sayfası muhtemelen v4.0'ın geçerlilik tarihini taşıyor.

---

## 2. Bölüm yapısı ve resmî sınav soru dağılımı

> Bu tablo **müfredatta değil**, ayrı bir dokümanda: *Exam Structures & Rules tables* v1.19 (19.08.2026), "CTFL v4.0" sayfası.

| # | İngilizce başlık | TTB Türkçe başlığı | Eğitim süresi | LO sayısı | LO K-dağılımı | **Soru** | **Puan** | **Soru K-dağılımı** |
|---|---|---|---|---|---|---|---|---|
| 1 | Fundamentals of Testing | Yazılım Testinin Temelleri | 180 dk | 14 | K1=3, K2=11, K3=0 | **8** | **8** | K1=2, K2=6, K3=0 |
| 2 | Testing Throughout the Software Development Lifecycle | Yazılım Geliştirme Yaşam Döngüsü Boyunca Test | 130 dk | 10 | K1=2, K2=8, K3=0 | **6** | **6** | K1=2, K2=4, K3=0 |
| 3 | Static Testing | Statik Testler | 80 dk | 8 | K1=4, K2=4, K3=0 | **4** | **4** | K1=2, K2=2, K3=0 |
| 4 | Test Analysis and Design | Test Analizi ve Tasarımı | 390 dk | 14 | K1=0, K2=9, K3=5 | **11** | **11** | K1=0, K2=6, K3=5 |
| 5 | Managing the Test Activities | Test Aktivitelerini Yönetme | 335 dk | 16 | K1=4, K2=9, K3=3 | **9** | **9** | K1=1, K2=5, K3=3 |
| 6 | Test Tools | Test Araçları | 20 dk | 2 | K1=1, K2=1, K3=0 | **2** | **2** | K1=1, K2=1, K3=0 |
| | **TOPLAM** | | **1135 dk** | **64** | K1=14, K2=42, K3=8 | **40** | **40** | K1=8, K2=24, K3=8 |

> ⚠️ **LO'ların K-dağılımı ile soruların K-dağılımı farklıdır.** Örn. Bölüm 3'te 4 adet K1 LO var ama sadece 2 K1 sorusu geliyor. Veri modelinde ikisi ayrı alanda tutulmalı.

### Soru zamanlama tablosu

| K-Seviyesi | Soru | Soru başına dk | Toplam |
|---|---|---|---|
| K1 | 8 | 1 | 8 dk |
| K2 | 24 | 1 | 24 dk |
| K3 | 8 | 3 | 24 dk |
| **TOPLAM** | **40** | | **56 dk** (sınav 60 dk) |

### LO → soru eşleme kuralı (deneme üretimi için kritik)

Resmî tablo, soruları **LO grupları** hâlinde tanımlar ve şu kuralı koyar:

> *"If there are more questions than LOs to distribute within a group of LOs then at least ONE question MUST BE BASED ON each LO. If there are fewer questions than LOs to distribute within a group of LOs then each question MUST COVER a different LO."*

Örnek gruplar:

| Bölüm | LO grubu | Soru | K |
|---|---|---|---|
| 1 | `{FL-1.1.1, FL-1.2.2}` | 1 | K1 |
| 1 | `{FL-1.5.2}` | 1 | K1 |
| 1 | `{FL-1.1.2, FL-1.2.1, FL-1.2.3, FL-1.3.1, FL-1.4.1, FL-1.4.2}` | 1 | K2 |
| 1 | `{FL-1.4.3, FL-1.4.4, FL-1.4.5}` | **3** | K2 |
| 1 | `{FL-1.5.1, FL-1.5.3}` | 1 | K2 |
| 4 | `{FL-4.2.1, FL-4.2.2, FL-4.2.3, FL-4.2.4, FL-4.5.3}` | **5** | K3 |
| 5 | `{FL-5.1.4, FL-5.1.5, FL-5.5.1}` | **3** | K3 |
| 6 | `{FL-6.1.1}` | 1 | K2 |
| 6 | `{FL-6.2.1}` | 1 | K1 |

> Bu mekanizma **birebir uygulanabilir**: `exam-blueprint.json` içinde LO gruplarını ve her gruba düşen soru sayısını tutup, deneme üretiminde bu kuralı çalıştırırız. Piyasada bunu yapan tek ürün biz oluruz.
> ⚠️ Tam grup listesi, uygulama sırasında resmî tablodan birebir çıkarılıp `data/ctfl-v4.0.1/exam-blueprint.json` dosyasına işlenecektir (bkz. TODO F0-05).

---

## 3. Sınav mekaniği

Kaynak: *Exam Structures and Rules* v1.2 (02.05.2025)

| Özellik | Değer | Madde |
|---|---|---|
| Toplam soru | **40** | EST Overview |
| Toplam puan | **40** | EST Overview |
| Geçme notu | **26 puan** (*"Exactly 65% of the points = 26,00"*) | EST Overview + §5.3.1 |
| Geçme yüzdesi | **en az %65** | §5.3.1 |
| Süre | **60 dakika** | EST Overview |
| Ana dili İngilizce olmayan | **+%25 → 75 dakika** | §6.2.1 |
| Format | Çoktan seçmeli | §2.1.4, §5.1.2 |
| Soru başına puan | **Her soru tam olarak 1 puan** | §5.2.1 |
| Negatif puanlama | **Hiçbir resmî dokümanda geçmiyor** ⚠️ | — |

### Sık yapılan üç hatanın düzeltmesi

**a) Foundation'da çok puanlı K3 sorusu YOKTUR.**
§5.2.1 (yalnızca Foundation için): *"Each question is worth exactly ONE point."* K3 soruları da 1 puandır. Çok puanlı K3 (2 puan) / K4 (3 puan) kuralı (§5.2.2) **yalnızca Advanced Level ve Specialist modüller içindir.** Piyasada çok yaygın bir yanlış bilgi.

**b) Birden fazla doğru cevaplı sorular VARDIR — yine 1 puan.**
Resmî örnek sınavlarda *"Select TWO options"* ifadesi geçiyor; cevap anahtarında `a, e` gibi çoklu cevaplar var.

| Set | "Select TWO options" soru sayısı |
|---|---|
| A | 4 |
| B | 1 |
| C | 1 |
| D | 3 |

**c) Sınanabilirlik kapsamı**
- §4.1.2 — Müfredattaki **tüm LO'lar** sınanabilir
- §4.1.3 — Müfredata bağlı **Sözlük'teki tüm anahtar kelimeler** sınanabilir
- §4.1.4 (FL + Specialist) — Müfredattaki tüm anahtar kelimeler, **tanımlarının anlaşılması (K2) düzeyinde** sınanabilir
- Müfredat §0.6 — *"All sections of the syllabus are examinable, except for the Introduction and Appendices"*. Bölüm 7 referansları (standartlar/kitaplar) sınanmaz.
- §5.4.2 — Bir soru birden çok LO'ya değiyorsa, **en yüksek K-seviyeli LO'yu** hedefler.

> ⚠️ **Negatif puanlama:** `negative mark`, `penalty`, `deduct` terimleri müfredat, Exam Rules, Exam Tables ve 4 örnek sınavın tamamında arandı — **hiçbirinde geçmiyor**. Sektörde "yok" kabul edilir ama resmî bir cümleyle doğrulanamadı. **Sitede iddia etme;** gerekirse "resmî dokümanlarda belirtilmemiştir" notu düş.

---

## 4. Resmî örnek sınavlar

**Dört set var: A, B, C, D.** (C ve D çoğu kaynakta atlanıyor.)

| Set | Sürüm | Tarih | Uyumlu müfredat | Ana soru | Ek soru | Sorular | Cevaplar |
|---|---|---|---|---|---|---|---|
| A | v1.7 | 01.04.2025 | **4.0.1** | 40 | **+26** (`#A1–#A26`) | [3352](https://istqb.org/?sdm_process_download=1&download_id=3352) | [3357](https://istqb.org/?sdm_process_download=1&download_id=3357) |
| B | v1.7 | 01.04.2025 | **4.0.1** | 40 | 0 | [3359](https://istqb.org/?sdm_process_download=1&download_id=3359) | [3365](https://istqb.org/?sdm_process_download=1&download_id=3365) |
| C | v1.6 | 25.03.2025 | 4.0 | 40 | 0 | [3369](https://istqb.org/?sdm_process_download=1&download_id=3369) | [3372](https://istqb.org/?sdm_process_download=1&download_id=3372) |
| D | v1.5 | 02.05.2025 | 4.0 | 40 | 0 | [3376](https://istqb.org/?sdm_process_download=1&download_id=3376) | [3380](https://istqb.org/?sdm_process_download=1&download_id=3380) |

**Toplam resmî soru havuzu: 4×40 + 26 = 186 soru.**

### Cevap dokümanlarının yapısı (bizim gerekçe formatımızın modeli)

Her cevap PDF'i şunları içerir:
1. **Answer Key tablosu:** `Question # | Correct Answer | LO | K-Level | Points`
2. **Soru başına ayrıntılı tablo:** `Question | Correct | Explanation/Rationale | LO | K-Level | Points`
3. **Her bir şıkkın ayrı gerekçesi** — dokümanın kendi ifadesiyle *"Justification for each response (answer) option"*

> Bu yapı, bizim **çeldirici bazlı gerekçe** formatımızın resmî dayanağıdır: ISTQB'nin kendisi her şıkkı ayrı ayrı gerekçelendiriyor, piyasadaki ürünler bunu taklit etmiyor. Biz edeceğiz.

### Örnek sınav yapısı hakkında resmî not

> *"The first 40 questions (and their answers) are arranged according to the exam structure and rules and therefore simulate a sample exam. The block 'Additional Questions' ... are not part of the sample exam but may help the learner to gain deeper knowledge."*
>
> Dipnot: *"In this sample exam the questions are sorted by the LO they target; **this cannot be expected of a live exam**."*

**Doğrulandı:** Set A'nın soru sırası bölüm dağılımına birebir uyuyor — Q1-8 (B1), Q9-14 (B2), Q15-18 (B3), Q19-29 (B4), Q30-38 (B5), Q39-40 (B6).
> **Ürün kararı:** Bizim denemelerimiz soruları **karıştırır** (gerçek sınav gibi), ama "bölüm sırasına göre çalış" modu ayrıca sunulur.

### Türkçe örnek sınavlar (TTB)
Sayfa: https://www.turkishtestingboard.org/en/certified-tester-foundation-level-sample-exam-turkish/
- Set A (TR): https://www.turkishtestingboard.org/files/exams/FL-orneksinav-A-ceviri.pdf — *"Örnek Sınav Set A, Versiyon 1.5, Syllabus v4.0 ile uyumludur"*; **sorular ve cevaplar tek PDF'te**; format: `1) ... (1 puan – 1 seçenek seçin)`, çoklu için `HANGİ İKİSİ`
- ⚠️ B, C, D'nin doğrudan PDF adresleri bulunamadı; TTB menüsünden ayrı sayfalar üzerinden erişiliyor.
- ⚠️ Türkçe çeviriler İngilizcenin gerisinde (TR Set A v1.5 / v4.0 vs EN v1.7 / v4.0.1).

---

## 5. Tüm ISTQB sertifikaları (Eylül 2026)

> Kaynak: *Exam Structures & Rules tables* v1.19 (19.08.2026) Overview tablosu. Bu tablo `data/certifications.json` için doğrudan seed verisidir.

| Stream | Seviye | Kısaltma | Ad | Soru | Puan | Baraj | Süre | +%25 | TTB'de |
|---|---|---|---|---|---|---|---|---|---|
| Core | Foundation | **CTFL** | Certified Tester Foundation Level v4.0 | 40 | 40 | 26 | 60 | 75 | ✔ TR+EN |
| Core | Advanced | CTAL-AT | Agile Tester v2.0 | 40 | 52 | 34 | 90 | 113 | ✔ |
| Core | Advanced | CTAL-TA | Test Analyst v4.0 | 45 | 78 | 51 | 120 | 150 | ✔ TR |
| Core | Advanced | CTAL-TA | Test Analyst v3.1 | 40 | 80 | 52 | 120 | 150 | — |
| Core | Advanced | CTAL-TAE | Test Automation Engineering v2.0 | 40 | 66 | 43 | 90 | 113 | ✔ |
| Core | Advanced | CTAL-TM | Test Management v3.0 | 50 | 88 | 58 | 120 | 150 | ✔ |
| Core | Advanced | CTAL-TTA | Technical Test Analyst v4.0 | 45 | 78 | 51 | 120 | 150 | ✔ |
| Agile | Foundation | CTFL-AT | Agile Tester | 40 | 40 | 26 | 90 | 113 | ✔ EN |
| Agile | Advanced | CTAL-ATT | Agile Technical Tester | 40 | 64 | 42 | 90 | 113 | — |
| Specialist | — | CT-AcT | Acceptance Testing | 40 | 40 | 26 | 60 | 75 | — |
| Specialist | — | CT-AI | AI Testing v2.0 | 40 | 44 | 29 | 60 | 75 | ✔ TR |
| Specialist | — | CT-AI | AI Testing v1.0 | 40 | 47 | 31 | 60 | 75 | ✔ TR |
| Specialist | — | CT-ATLaS | Agile Test Leadership at Scale v2.0 | 40 | 71 | 47 | 120 | 150 | — |
| Specialist | — | CT-ATLaS | ATLaS v2.0 UPGRADE | 23 | 44 | 29 | 75 | 94 | — |
| Specialist | — | CT-AuT | Automotive Software Tester v2.1 | 40 | 40 | 26 | 60 | 75 | ✔ TR |
| Specialist | — | CT-AuT | Automotive Software Tester v1.0 | 40 | 40 | 26 | 60 | 75 | ✔ |
| Specialist | — | CT-GaMe | Game Testing | 40 | 40 | 26 | 60 | 75 | ✔ |
| Specialist | — | CT-GenAI | Testing with Generative AI | 40 | 46 | 30 | 60 | 75 | ✔ |
| Specialist | — | CT-GT | Gambling Industry Tester | 40 | 40 | 26 | 60 | 75 | — |
| Specialist | — | CT-FT | Finance Testing | 40 | 45 | 30 | 60 | 75 | — |
| Specialist | — | CT-MAT | Mobile Application Testing | 40 | 40 | 26 | 60 | 75 | — |
| Specialist | — | CT-MBT | Model-Based Tester | 40 | 40 | 26 | 60 | 75 | — |
| Specialist | — | CT-PT | Performance Testing | 40 | 40 | 26 | 90 | 113 | ✔ |
| Specialist | — | CT-QDO | Quality in DevOps | 40 | 45 | 30 | 60 | 75 | — |
| Specialist | — | CT-SEC | Security Tester | 45 | 80 | 52 | 120 | 150 | — |
| Specialist | — | CT-STE | Security Test Engineer | 40 | 43 | 28 | 75 | 94 | — |
| Specialist | — | CT-TAS | Test Automation Strategy v1.0 | 40 | 49 | 32 | 60 | 75 | — |
| Specialist | — | CT-UT | Usability Testing | 40 | 40 | 26 | 60 | 75 | — |

**Expert Level** (farklı sınav yapısı, essay içerir; Overview tablosunda yok):
CTEL-ITP-ATP · CTEL-ITP-ITPI · CTEL-TM-SM · CTEL-TM-OTM · CTEL-TM-MTT
⚠️ Expert Level sınav parametreleri resmî bir tabloda doğrulanamadı.

### TTB pratik bilgileri
- Sınav formatı: **Remote Online** (randevu sistemi, kendi bilgisayarından)
- CTFL ücreti: **5.950 ₺ + %20 KDV**
- Ön koşul yok
- TTB 2006'dan beri sınav yapıyor; ISO 9001 / 17024 belgeleri Mayıs 2027'ye kadar geçerli
- **Sınav kitapçığında sorular hem Türkçe hem İngilizce yer alıyor** → iki dilli UX'imizin doğrudan dayanağı

---

## 6. Sözlük / terminoloji

### Resmî ISTQB Glossary — açık JSON API'si var ✔

- Web: https://glossary.istqb.org/en_US/home
- **API (kimlik doğrulama yok):** `https://api.glossary.istqb.org/v1/terms`

Doğrulanmış:
- Toplam terim: **1128**
- Her terim: `{id, term, slug, version, definition, references[], used_in[{syllabus_name, version}]}`
- `used_in` ile filtrelenebiliyor → **CTFL v4.0'a bağlı 215 terim** (`syllabus_name: "Foundation", version: "v4.0"`)
- `references` alanında ISO 29119 vb. standart atıfları var

> Bu, flashcard ve terim quizi üretmenin en temiz ve hukuken en rahat kaynağı.

### Türkçe durumu

- ⚠️ ISTQB online sözlükte **Türkçe terim çevirisi bulunamadı**. Arayüz çevirisi var (`https://api.glossary.istqb.org/assets/translations/tr_TR.json`) ama terim tanımlarının Türkçesi API'de yok. (SPA olduğu için dil seçici davranışı test edilemedi — kesin değil.)
- **TTB'nin ayrı Türkçe sözlüğü var:** *"ISTQB® Yazılım Testi Terimler Sözlüğü"* (564 terim)
  https://www.turkishtestingboard.org/yazilim-testi-terimler-sozlugu-glossary/
- ⚠️ **Bu sözlük ISTQB Standard Glossary v3.7 tabanlı — CTFL v4.0 ile uyumlu değil.** v4.0 birçok terimi değiştirdi (*artifacts → work products*, *performance → performance efficiency*, *test documentation → testware*).

> **Ürün kuralı:** Türkçe terim kaynağı olarak **TTB'nin v4.0.1 Türkçe müfredatı birincil**, TTB sözlüğü ikincil ve **doğrulanarak** kullanılır. Bkz. [`07-icerik-uretim-rehberi.md`](07-icerik-uretim-rehberi.md).

---

## 7. Doğrulanamayanlar

Bu maddeler ürün içinde **iddia edilmemelidir**:

1. **Negatif puanlama** — hiçbir resmî dokümanda geçmiyor; var da yok da denemez.
2. **ISTQB Glossary'nin CC BY 4.0 lisansı** — sitenin i18n dosyasında *"content on this site is licensed under a Creative Commons Attribution 4.0 International license"* metni bulundu, ama SPA olduğu için canlı sayfada render edildiği gözle teyit edilemedi. **Bu lisansa dayanmadan önce tarayıcıda footer'ı doğrula.** (TODO F0-02)
3. **Glossary'de Türkçe terim çevirisi** — API'de bulunamadı.
4. **TTB Türkçe örnek sınav B/C/D'nin doğrudan PDF adresleri.**
5. **Expert Level sınav parametreleri.**
6. TTB'nin "6 Mayıs 2024" tarihi ile ISTQB'nin 15.09.2024 errata tarihi arasındaki çelişki.
7. Sample Exam C ve D'nin v4.0.1'e güncellenip güncellenmeyeceği.
