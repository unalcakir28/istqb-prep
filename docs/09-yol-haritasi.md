# 09 — Yol Haritası

**Sürüm:** 1.0 · **Tarih:** 19.09.2026

> Efor tahminleri **tek geliştirici, haftada ~10 saat** varsayımıyla verilmiştir.
> Kritik gerçek: **içerik üretimi kodu geçer.** 120 soru yazmak ≈ MVP uygulamasını yazmak kadar sürer ve paralel yürütülmelidir.

---

## Faz 0 — Temel ve doğrulama (2 hafta · ~20 saat)

**Amaç:** Kod yazmadan önce belirsizlikleri kapat, veri iskeletini kur.

| # | Görev | Çıktı |
|---|---|---|
| F0-01 | Ürün adı kararı (D-01) + ISTQB marka riski kontrolü | Karar kaydı |
| F0-02 | ISTQB Glossary lisansını tarayıcıda gözle doğrula | Ekran görüntüsü + karar |
| F0-03 | ISTQB'ye yazılı izin e-postası | Gönderildi kaydı |
| F0-04 | TTB'ye işbirliği e-postası | Gönderildi kaydı |
| F0-05 | **Resmî LO-grubu tablosunun tamamını `exam-blueprint.json`'a çıkar** | 40 soruya toplanan tam blueprint |
| F0-06 | `objectives.json` — 64 LO, TR+EN metin, K-seviyeleri | Doğrulanmış veri |
| F0-07 | `syllabus.json` + `meta.json` + `certifications.json` | Doğrulanmış veri |
| F0-08 | JSON Schema dosyaları + `validate-data` scripti | CI'da çalışan doğrulayıcı |
| F0-09 | Glossary API'den 215 CTFL terimini çek, TR karşılıklarını TTB müfredatından eşle | `glossary/` |
| F0-10 | İlk 20 soruyu yaz (Bölüm 1 ve 4'ten) — format testi | Örnek veri |

**Faz 0 bitti sayılır:** `npm run validate:data` yeşil; blueprint 40 soruya ve 8/6/4/11/9/2 dağılımına toplanıyor; 20 örnek soru şemaya uygun.

---

## Faz 1 — MVP: Deneme sınavı (6 hafta · ~60 saat)

**Amaç:** Bir aday hesap açmadan gerçek kurallarla deneme çözebilsin ve dürüst bir sonuç alsın.

### Kod (≈35 saat)
| # | Görev |
|---|---|
| F1-01 | Vite + React + TS + Tailwind v4 + shadcn iskeleti; GitHub Pages deploy hattı (404.html + .nojekyll + base) |
| F1-02 | `contentClient` — manifest/index/parça yükleme, önbellek |
| F1-03 | Dexie şeması + migrasyon altyapısı |
| F1-04 | i18next kurulumu; arayüz dili ≠ içerik dili ayrımı |
| F1-05 | `generateExam` — blueprint tabanlı üretim + dağılım doğrulaması (birim testli) |
| F1-06 | `scoreExam` — multi-select tam eşleşme, 26 baraj, bölüm/LO kırılımı (birim testli) |
| F1-07 | `QuestionCard` + `OptionList` + `LangToggle` |
| F1-08 | `ExamTimer` (Date.now tabanlı, 5 sn'de bir kalıcılaştırma) |
| F1-09 | `QuestionNavigator` (masaüstü panel / mobil bottom sheet) |
| F1-10 | Sınav oturumu rotası + yarım kalan denemeyi kurtarma |
| F1-11 | Sonuç ekranı: baraj çizgisi + bölüm kırılımı + hayalet hedefler + en zayıf 3 LO |
| F1-12 | İnceleme turu + `RationalePanel` (her şık gerekçesi + atıf çipleri) |
| F1-13 | Karanlık mod + klavye kısayolları + `?` overlay |
| F1-14 | `MediaRenderer`: `decision-table` ve `table` (diğerleri Faz 2) |
| F1-15 | E2E: tam deneme akışı, süre dolması, yenileme sonrası kurtarma |

### İçerik (≈25 saat, paralel)
| # | Görev |
|---|---|
| F1-C1 | **120 soru** — her LO için ≥1, Bölüm 4/5 ağırlıklı, TR+EN, tam gerekçeli |
| F1-C2 | Kapsama raporu scripti + README rozeti |
| F1-C3 | `/kaynaklar`, gizlilik politikası, sorumluluk reddi sayfaları |

**Faz 1 bitti sayılır:** [`02-urun-gereksinimleri.md §3`](02-urun-gereksinimleri.md)'teki MVP sınırı karşılandı; Lighthouse ≥95; axe kritik ihlal 0.

---

## Faz 2 — Öğrenme modları (4 hafta · ~40 saat)

| # | Görev |
|---|---|
| F2-01 | Pratik modu: bölüm/LO seçimi, 10 soruluk oturum, anlık geri bildirim |
| F2-02 | Yanlış cevabın aynı oturum sonuna yeniden kuyruklanması |
| F2-03 | LO bazlı drill + müfredat gezgini (`/syllabus`, LeetCode tarzı filtrelenebilir liste) |
| F2-04 | LO zayıflık analizi ve "Çalış →" derin bağlantıları |
| F2-05 | Sözlük ekranı: TR/EN arama, terim kartı, kaynak etiketi |
| F2-06 | TR/EN **yan yana** görünüm |
| F2-07 | Yanlışlarım / işaretlediklerim / hiç iki kez doğru yapamadıklarım listeleri |
| F2-08 | Soru hata bildirimi (önceden doldurulmuş GitHub Issue) |
| F2-09 | `MediaRenderer`: `state-transition`, `control-flow`, `code` |
| F2-10 | **İçerik: 200 soruya çıkar** (her LO ≥2) |

---

## Faz 3 — Tekrar, ilerleme, çevrimdışı (4 hafta · ~40 saat)

| # | Görev |
|---|---|
| F3-01 | `ts-fsrs` entegrasyonu; `srsCards` tablosu |
| F3-02 | Tekrar ekranı: Again/Hard/Good/Easy + sonraki aralık önizlemesi |
| F3-03 | Aynı LO'dan ardışık soru engelleme (sibling burying) |
| F3-04 | Vade tahmini grafiği; ana ekranda vadeli kart sayısı |
| F3-05 | İlerleme ekranı: skor eğilimi, bölüm bazlı gelişim, seri (affedici) |
| F3-06 | **Hazırlık tahmini** — son 3 zamanlı denemeye dayalı |
| F3-07 | PWA: manifest, servis çalışanı, parça önbelleği, kurulabilirlik |
| F3-08 | İlerleme dışa/içe aktarma (JSON) |
| F3-09 | Kademeli ipucu; terim üzerine gelince tanım (tooltip) |
| F3-10 | **İçerik: 300 soruya çıkar** (her LO ≥3) |

---

## Faz 4 — Ölçekleme (açık uçlu)

| # | Görev |
|---|---|
| F4-01 | **CTFL-AT (Agile Tester)** içeriği — ikinci sertifika, mimarinin gerçek testi |
| F4-02 | CT-AI v2.0 (TTB'de Türkçe müfredatı var) |
| F4-03 | CT-PT (Performance Testing) |
| F4-04 | CTAL-TA v4.0 — ilk Advanced modül (çok puanlı sorular → puanlama motoru genişler) |
| F4-05 | Topluluk soru katkısı: PR şablonu, özgünlük beyanı, gözden geçirme akışı |
| F4-06 | Soru başına tartışma (ExamTopics'in en sevilen özelliği — GitHub Discussions üzerinden, sunucusuz) |
| F4-07 | Türkçe süreç rehberi: kayıt, online gözetim, sonuç, tekrar hakkı (pazar araştırmasında tespit edilen boşluk) |
| F4-08 | Soru başına global doğruluk oranı (anonim, toplu — gizlilik korunarak nasıl? → araştırma gerekli) |

---

## Kilometre taşları

| Tarih (hedef) | Kilometre taşı |
|---|---|
| +2 hafta | **M0** — Veri iskeleti hazır, blueprint doğrulandı |
| +8 hafta | **M1** — MVP yayında, 120 soru, ilk gerçek kullanıcı denemesi |
| +12 hafta | **M2** — Öğrenme modları, 200 soru, sözlük |
| +16 hafta | **M3** — SRS + PWA + 300 soru — *"tam ürün"* |
| +24 hafta | **M4** — İkinci sertifika (CTFL-AT) yayında |

---

## Faz bağımlılıkları

```
F0-05 (blueprint) ──► F1-05 (deneme üretimi) ──► F1-11 (sonuç) ──► F2-04 (LO analizi)
F0-06 (objectives) ─┘                                              │
F0-08 (şemalar) ────► F1-C1 (içerik) ─────────────────────────────┘
F1-02 (contentClient) ─► F1-05
F1-03 (Dexie) ─────────► F1-10, F3-01
F2-10 (200 soru) ──────► F3-01 (SRS anlamlı olsun diye havuz gerekir)
```

**Kritik yol:** F0-05 → F1-05 → F1-11 → yayın. Blueprint çıkarılmadan deneme üretimi yazılamaz.

---

## Bilinçli olarak sonraya bırakılanlar

| Özellik | Neden ertelendi |
|---|---|
| Kullanıcı hesabı | Sunucu = maliyet + gizlilik yükü. Dışa aktarma yeterli. |
| Sıralama tablosu / sosyal | Motivasyon mekaniği, öğrenmeye katkısı tartışmalı; sunucu gerektirir. |
| AI ile soru üretimi (runtime) | Kalite ve telif riski; editoryal kontrol kaybolur. |
| Video / uzun metin dersler | Pazarda doymuş (154k öğrencili kurs var). Bizim kamamız pratik. |
| Mobil uygulama mağazası | PWA yeterli; mağaza bakım yükü + ücret. |
| Ödeme / abonelik | Non-commercial koşulu telif dayanağımız. Bkz. [`08-hukuki-ve-telif.md`](08-hukuki-ve-telif.md) K-2. |
