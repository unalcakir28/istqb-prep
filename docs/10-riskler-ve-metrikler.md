# 10 — Riskler ve Metrikler

**Sürüm:** 1.0 · **Tarih:** 19.09.2026

---

## 1. Risk kaydı

Olasılık ve etki: **D** (düşük) · **O** (orta) · **Y** (yüksek)

| # | Risk | Ols. | Etki | Azaltma |
|---|---|:--:|:--:|---|
| **R-01** | **Telif ihlali iddiası** — ISTQB, LO kodları/başlıkları alıntımıza bile itiraz eder | D | **Y** | Tüm sorular özgün (K-1); ticari değil (K-2); her yerde kaynak gösterimi (K-3). Yazılı izin başvurusu D-05 ile iptal edildi (K-5) — bu, R-01'in azaltıcı dayanağını K-1/K-2/K-3'e indirdi ve riski bir miktar yükseltti. İtiraz gelirse alıntıları kaldırıp yalnızca kendi metinlerimizle devam edebilecek şekilde veri modeli hazırlanır. |
| **R-01b** | **Marka itirazı** — ürün adı `ISTQB-PREP` tescilli markayı doğrudan içeriyor (D-01, `08 §K-4`); ISTQB uyarı mektubu gönderir | **O** | O | Ad koda gömülmez, tek kaynaktan okunur → yeniden adlandırma tek satırlık iş; ISTQB logosu/rengi/tipografisi kullanılmaz; sorumluluk reddi her sayfada; alan adı "istqb" içermez. **Bu risk D-01'de bilinçli olarak üstlenildi** — karşılığında arama görünürlüğü ve anlaşılırlık alındı. Mektup gelirse ad değiştirilir, içerik etkilenmez. |
| **R-02** | **İçerik üretimi durur** — 300 soru yazma eforu tek kişiye ağır gelir | **Y** | **Y** | Fazlara bölünmüş hedef (120→200→300); kapsama raporu ile ilerleme görünür; MVP 120 soruyla anlamlı; AI taslak + insan doğrulama ile hız (§ [`07`](07-icerik-uretim-rehberi.md) §8). **En büyük gerçek risk budur.** |
| **R-03** | **Müfredat güncellenir (v4.1/v5.0)** ve içerik eskir | O | **Y** | Her soruda `syllabusVersion`; emeklilik politikası yazılı; ISTQB duyurularını izleyen çeyreklik kontrol; eski sorular silinmez, filtrelenir. **Eleştirdiğimiz tuzağa düşmemek projenin kimliğidir.** |
| **R-04** | **Türkçe terminoloji hatası** — yanlış çeviri adayı yanlış öğretir | O | **Y** | Terim sözlüğü zorunlu (§ [`07`](07-icerik-uretim-rehberi.md) §5); CI'da terim sızıntısı uyarısı; her Türkçe terimde `trSource`; hata bildirimi akışı |
| **R-05** | **Soru kalitesi düşer** — havuz büyürken çeldiriciler zayıflar | O | O | §6 kontrol listesi; yazma/gözden geçirme aynı gün yapılmaz; kullanıcı hata bildirimi; soru başına doğruluk oranı izlenir (çok yüksek/çok düşük = şüpheli) |
| **R-06** | **Kimse bulamaz** — dağıtım sorunu (CertSim'in 100 kurulumu örneği) | **Y** | O | SEO (temiz URL, Türkçe anahtar kelimeler, `/syllabus` sayfaları organik giriş noktası); Türkçe Medium/LinkedIn yazıları; Ekşi/Reddit/Discord'da paylaşım; açık kaynak olması GitHub'dan da trafik getirir |
| **R-07** | **Dump sitesi sanılırız** — kategoriye toptan güvensizlik var | O | O | "Hiçbir soru gerçek sınavdan alınmamıştır" iddiası ana sayfada; her soruda LO + sürüm rozeti; açık kaynak = denetlenebilir |
| **R-08** | **IndexedDB verisi kaybolur** (tarayıcı temizliği, gizli sekme) | O | D | Dışa aktarma özelliği (F3-08); kullanıcıya ilk kullanımda bilgi notu; kritik veri değil |
| **R-09** | **Deneme havuzu yetersiz kalır** — blueprint 40 soru ister, havuzda yok | **Y** (erken) | O | Kurulum ekranında açık uyarı; eksik üretim sessizce yapılmaz; kapsama raporu hangi grubun aç olduğunu söyler |
| **R-10** | **GitHub Pages sınırları** (100 GB/ay bant genişliği, 1 GB repo) | D | O | Statik JSON küçük; medya yok. Aşılırsa Cloudflare Pages'e taşınır (aynı build) |
| **R-11** | **Tek kişiye bağımlılık (bus factor 1)** | **Y** | O | Her şey dökümante; veri Git'te; kurulum tek komut; MIT + CC BY-SA ile devam edilebilir |
| **R-12** | **Kapsam şişmesi** — "şunu da ekleyelim" | **Y** | O | Faz kapsamları yazılı; [`09-yol-haritasi.md`](09-yol-haritasi.md)'nda "bilinçli olarak sonraya bırakılanlar" listesi var |
| **R-13** | **AI üretimi soru, resmî soruyu ezberden üretir** → farkında olmadan telif ihlali | O | **Y** | AI'dan "örnek sınav sorusu" istenmez, yalnızca LO'dan üretim; her soru resmî örnek sınavlara karşı elle kontrol edilir; şüpheli benzerlikte soru reddedilir |
| **R-14** | Glossary lisansı CC BY 4.0 **değilse** sözlük içeriği kullanılamaz | O | D | Doğrulanana kadar tanımlar kendi ifademizle yazılır (F0-02) |

### İzlenecek üç risk
**R-02 (içerik durması)**, **R-03 (müfredat güncellemesi)** ve **R-06 (dağıtım)**. Diğerleri yönetilebilir; bu üçü projeyi bitirebilir.

---

## 2. Başarı metrikleri

### Kuzey yıldızı
> **Barajı geçen tamamlanmış deneme sayısı** (haftalık).
> Ziyaretçi sayısı değil, "başlanan deneme" değil — **tamamlanmış ve öğrenme üretmiş oturum.**

### Ürün metrikleri

| Metrik | Hedef (6 ay) | Neden |
|---|---|---|
| Deneme tamamlama oranı | ≥ %70 | Başlayıp bırakma, kötü UX veya yanlış zorluk sinyali |
| İnceleme turu görüntüleme oranı | ≥ %60 | Asıl öğrenme burada; düşükse sonuç ekranından geçiş zayıf |
| Gerekçe açma oranı (pratik modu) | ≥ %80 | Farklılaştırıcımız kullanılıyor mu? |
| 7 günlük geri dönüş | ≥ %25 | Hazırlık 2–4 haftalık bir süreç; tek ziyaret yetmez |
| Ortalama oturum süresi | ≥ 8 dk | |
| İkinci deneme oranı | ≥ %40 | Tek denemede bırakan, güvenmemiş demektir |

### İçerik metrikleri

| Metrik | Hedef |
|---|---|
| Yayınlanmış soru sayısı | 120 (M1) → 300 (M3) |
| LO kapsaması | 64/64 (≥1 soru) → 64/64 (≥3 soru) |
| Çeldirici gerekçesi doluluğu | **%100** (CI zorunlu) |
| Açık soru hatası bildirimi | < 5, ortalama kapanma < 7 gün |
| Soru başına doğruluk oranı dağılımı | %30–%85 arası (dışına çıkanlar gözden geçirilir) |

### Teknik metrikler

| Metrik | Hedef |
|---|---|
| Lighthouse (4 kategori) | ≥ 95 |
| axe kritik ihlal | 0 |
| JS bundle (gzip) | < 200 KB |
| LCP (3G Fast) | < 1,5 s |
| Test kapsaması (motor kodu) | ≥ 85 |
| Kırık build ile geçen süre | < 24 saat |

### Etki metrikleri (anket, opsiyonel)

| Metrik | Hedef (6 ay) |
|---|---|
| "Sınavı geçtim" bildirimi | ≥ 50 |
| "Bu siteyi tavsiye eder misin?" (NPS) | ≥ 40 |
| "Resmî PDF'lere ek olarak buna ihtiyacım vardı" | ≥ %70 |

---

## 3. Ölçüm yöntemi ve gizlilik

**İlke:** Gizlilikten ödün vererek metrik toplanmaz.

| Metrik türü | Nasıl |
|---|---|
| Sayfa görüntüleme, olay sayıları | Çerezsiz, IP saklamayan sayaç (Umami / GoatCounter) |
| Deneme tamamlama, gerekçe açma | Toplu (aggregate) olay sayacı — kullanıcı kimliği yok |
| Soru başına doğruluk oranı | ⚠️ **Sunucu gerektirir.** v1'de toplanmaz. Faz 4'te gizlilik korunarak nasıl yapılabileceği araştırılır (örn. tamamen anonim, oturum bazlı toplu gönderim) |
| Geri dönüş oranı | Sayaç tarafında, parmak izi olmadan; kaba tahmin kabul edilir |
| Etki metrikleri | Gönüllü anket bağlantısı (sonuç ekranında, kapatılabilir) |

**Toplanmayacaklar:** IP eşleme, cihaz parmak izi, kullanıcı cevapları, ilerleme verisi, e-posta.

---

## 4. Çeyreklik gözden geçirme

Her 3 ayda bir kontrol edilecekler:

- [ ] ISTQB yeni müfredat sürümü yayınladı mı? (istqb.org duyuruları)
- [ ] Resmî örnek sınavlar güncellendi mi? (sürüm numaraları)
- [ ] TTB Türkçe çevirileri güncellendi mi?
- [ ] Exam Structures & Rules tables sürümü değişti mi? (blueprint'i etkiler)
- [ ] Glossary'de terim değişikliği var mı? (API `version` alanı)
- [ ] Kapsama raporu: hangi LO'lar hâlâ aç?
- [ ] Doğruluk oranı anormal olan sorular var mı?
- [ ] Açık hata bildirimleri
- [ ] Bağımlılık güvenlik uyarıları
- [ ] Metrikler hedeflerin neresinde?
