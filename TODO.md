# TODO

Faz açıklamaları ve bağımlılıklar: [`docs/09-yol-haritasi.md`](docs/09-yol-haritasi.md)
Tahminler: tek geliştirici, haftada ~10 saat.

Öncelik: **P0** yapılmadan sonraki faz başlamaz · **P1** faz içinde gerekli · **P2** iyi olur

---

## Faz 0 — Temel ve doğrulama

### Karar ve hukuk
- [x] **F0-01** `P0` Ürün adı kararı (D-01) → **ISTQB-PREP**, depo adıyla aynı. Marka riski bilinçli üstlenildi ([`08 §K-4`](docs/08-hukuki-ve-telif.md), [`10 §R-01b`](docs/10-riskler-ve-metrikler.md))
- [ ] **F0-17** `P1` Ürün adını tek kaynaktan okunur yap (i18n/`meta`) — koda gömme; D-01 riskinin telafisi, yeniden adlandırmayı tek satıra indirir
- [ ] **F0-02** `P0` ISTQB Glossary lisansını tarayıcıda **gözle doğrula** (footer'da CC BY 4.0 var mı?), ekran görüntüsünü `docs/kanit/` altına koy
- [x] ~~**F0-03** ISTQB'ye yazılı izin e-postası~~ — **iptal** (D-05: başvuru yapılmayacak, dayanak K-1/K-2/K-3)
- [x] ~~**F0-04** TTB'ye Türkçe içerik/işbirliği e-postası~~ — **iptal** (D-05)
- [x] **F0-15** `P2` İçerik lisansı kararı (D-03) → **CC BY-SA 4.0**
- [x] **F0-16** `P2` Alan adı kararı (D-02) → alan adı alınmıyor, `*.github.io` yeterli

### Veri iskeleti
- [x] **F0-05** `P0` Resmî LO-grubu tablosu `exam-blueprint.json`'a çıkarıldı — **29 grup / 64 LO / 40 soru**, bölüm 8/6/4/11/9/2, K 8/24/8. Kaynak: *Exam Structures & Rules tables v1.19*, s. 4-5
- [x] **F0-06** `P0` `objectives.json` — **64 LO**, TR+EN metinler resmî PDF'lerden birebir, K1=14/K2=42/K3=8
- [x] **F0-07** `P0` `syllabus.json` · `meta.json` · `manifest.json` — resmî kaynağa karşı denetlendi, sıfır tutarsızlık (başlıklar, süreler 1135 dk, sınav sabitleri 40/26/60/75)
- [x] **F0-11** `P1` `certifications.json` — 28 satırlık tüm ISTQB sertifika tablosu ([`03 §5`](docs/03-istqb-referans.md) seed verisi)
- [x] **F0-08** `P0` `schemas/` tamamlandı + `scripts/validate-data.ts` — **14 kontrol** (13 + şık konumu dengesi). 1-9 hata, 10-14 uyarı
- [x] **F0-12** `P1` `scripts/build-index.ts` — parçalardan `index.json` + manifest sayaçları
- [x] **F0-13** `P1` `scripts/stats.ts` — LO başına kapsama → `docs/kapsama.md`
- [ ] **F0-09** `P1` `scripts/fetch-glossary.ts` — Glossary API'den `used_in: Foundation v4.0` filtresiyle 215 terimi çek; TR karşılıklarını TTB müfredatından eşle, `trSource` işaretle
- [x] **F0-14** `P1` `data/ctfl-v4.0.1/terms.json` — **97 terim**, resmî EN/TR anahtar kelime listelerinden konum bazlı hizalandı. ⚠️ `docs/07 §5`'in ilk sözlüğü büyük ölçüde yanlıştı, tamamen değiştirildi

### İçerik
- [x] **F0-10** `P0` İlk sorular yazıldı — süreç kanıtlandı (bkz. F1-C1)

> **Faz 0 bitti:** `npm run validate:data` yeşil · blueprint 40'a toplanıyor · 20 soru şemaya uygun

---

## Faz 1 — MVP: Deneme sınavı

### Altyapı
- [x] **F1-01** `P0` Vite 6 + React 19 + TS 5 + Tailwind v4; tüm sürümler tam sabitli, yarn
- [x] **F1-01b** `P0` GitHub Pages deploy hattı kuruldu
- [x] **F1-01c** `P0` CI: ESLint + Prettier + `tsc --noEmit` + Vitest + `validate:data`
- [x] **F1-02** `P0` `contentClient` — indeks önce, sonra yalnızca gereken parçalar; bellek + Cache API, `dataVersion` ile geçersizleştirme
- [x] **F1-03** `P0` Dexie şeması + kurtarma/atma yardımcıları
- [x] **F1-04** `P0` i18next; arayüz dili ≠ içerik dili; TR/EN sözlükler 104 anahtarda eşit

### Sınav motoru
- [x] **F1-05** `P0` `generateExam` — blueprint tabanlı, LO-grubu kuralı, tohumlanmış PRNG
- [x] **F1-05b** `P0` Dağılım testi 50 ayrı tohumda: tam olarak 8/6/4/11/9/2 ve K 8/24/8
- [x] **F1-05c** `P1` `shortfalls` + `previewCoverage` — eksik deneme sessizce üretilmiyor
- [x] **F1-06** `P0` `scoreExam` — tam eşleşme, kısmi puan yok, baraj `meta`'dan, bölüm/LO/K kırılımı
- [ ] **F1-08** `P0` `ExamTimer` — `Date.now()` tabanlı (sekme arka planında kaymaz), 5 sn'de bir kalıcılaştırma, son 10 dk amber / son 1 dk kırmızı, gizle/göster

### Arayüz
- [ ] **F1-07** `P0` `QuestionCard` + `OptionList` (max 65ch, tam genişlik dokunma hedefi, 1–9 klavye seçimi) + `LangToggle` (cevap korunur)
- [ ] **F1-07b** `P0` `multi` soru desteği: checkbox + **"HANGİ İKİSİ — 2 şık seçin"** başlığı
- [ ] **F1-09** `P0` `QuestionNavigator` — masaüstünde panel, mobilde bottom sheet; boş/cevaplı/işaretli durumları
- [ ] **F1-10** `P0` Sınav oturumu rotası + **yarım kalan denemeyi kurtarma** (ana sayfada şerit)
- [ ] **F1-11** `P0` Sonuç ekranı: skor + **26/40 baraj çizgisi** + bölüm çubukları + **hayalet hedefler** + en zayıf 3 LO
- [ ] **F1-12** `P0` İnceleme turu + `RationalePanel` — **her şık için gerekçe** + atıf çipleri (`FL-4.2.1` · `§4.2.1` · `K3` · `v4.0.1`)
- [ ] **F1-13** `P0` Karanlık mod (token tabanlı) + klavye kısayolları + `?` overlay (ilk ziyarette bir kez)
- [ ] **F1-14** `P1` `MediaRenderer`: `decision-table` ve `table` (gerçek `<table>`, görsel değil)
- [ ] **F1-16** `P1` Ana sayfa — ilk kez gelene "Nereden başlamalı?" (birincil eylem **Pratik**, Deneme değil)
- [ ] **F1-17** `P1` Deneme kurulum ekranı: **75 dk Türkçe arayüzde varsayılan seçili**, canlı dağılım önizlemesi, havuz uyarısı

### Kalite
- [ ] **F1-15** `P1` E2E (Playwright): tam deneme akışı · süre dolunca otomatik teslim · yenileme sonrası kurtarma · TR/EN geçişi · karanlık mod
- [ ] **F1-18** `P1` `@axe-core/playwright` — her ana rotada 0 kritik ihlal
- [ ] **F1-19** `P2` Lighthouse CI — 4 kategoride ≥95

### İçerik ve sayfalar
- [~] **F1-C1** `P0` **120 soru** — 87 yazıldı (bölüm 1,2,3,5,6), bölüm 4 (33 soru) sürüyor. Hepsi `status: review`; bağımsız doğrulamadan sonra `published` olacak
- [ ] **F1-C2** `P1` Kapsama rozeti README'de
- [ ] **F1-C3** `P0` `/kaynaklar` (telif bildirimi tam metni + resmî bağlantılar) · gizlilik politikası · sorumluluk reddi footer'ı

> **Faz 1 bitti:** [`02 §3`](docs/02-urun-gereksinimleri.md)'teki MVP sınırı karşılandı

---

## Faz 2 — Öğrenme modları

- [ ] **F2-01** `P0` Pratik modu: bölüm/LO seçimi, **10 soruluk sabit oturum**, satır içi anlık geri bildirim
- [ ] **F2-02** `P0` Yanlış cevabın **aynı oturumun sonuna yeniden kuyruklanması** (Duolingo deseni)
- [ ] **F2-03** `P0` `/syllabus` müfredat gezgini — 64 LO, filtrelenebilir/sıralanabilir, senin doğruluk oranın sütunu (LeetCode deseni)
- [ ] **F2-04** `P0` LO zayıflık analizi + "Çalış →" derin bağlantıları
- [ ] **F2-05** `P1` `/glossary` — TR/EN eşzamanlı arama, terim kartı (EN+TR yan yana), **kaynak etiketi** (`trSource`)
- [ ] **F2-06** `P1` TR/EN **yan yana** görünüm (geniş ekranda iki sütun, darda üst üste, tek radio grubu)
- [ ] **F2-07** `P1` Listeler: yanlışlarım · işaretlediklerim · **hiç iki kez üst üste doğru yapamadıklarım**
- [ ] **F2-08** `P1` Soru hata bildirimi → önceden doldurulmuş GitHub Issue (soru ID, sürüm, seçilen şık, dil)
- [ ] **F2-09** `P1` `MediaRenderer`: `state-transition` (metin alternatifli), `control-flow`, `code`
- [ ] **F2-10** `P0` **İçerik: 200 soru** (her LO ≥2)
- [ ] **F2-11** `P2` Terim üzerine gelince tanım (tooltip)

---

## Faz 3 — Tekrar, ilerleme, çevrimdışı

- [ ] **F3-01** `P0` `ts-fsrs` entegrasyonu + `srsCards` tablosu; yanlış cevaplar otomatik desteye
- [ ] **F3-02** `P0` Tekrar ekranı: **Again / Hard / Good / Easy** + her düğmede **sonraki aralık önizlemesi**
- [ ] **F3-03** `P1` Aynı LO'dan ardışık soru engelleme (sibling burying)
- [ ] **F3-04** `P1` Vade tahmin grafiği + ana ekranda vadeli kart sayısı
- [ ] **F3-05** `P1` İlerleme ekranı: skor eğilimi, bölüm bazlı gelişim, **affedici seri**
- [ ] **F3-06** `P1` **Hazırlık tahmini** — son 3 zamanlı denemeye dayalı ("2'si barajı geçti, sınavı planlayabilirsin")
- [ ] **F3-07** `P1` PWA: manifest, servis çalışanı, parça önbelleği (`StaleWhileRevalidate`), kurulabilirlik
- [ ] **F3-08** `P0` İlerleme **dışa/içe aktarma** (JSON) — IndexedDB kaybı riskinin karşılığı
- [ ] **F3-09** `P2` Kademeli ipucu (dürtme → ipucu → çözüm)
- [ ] **F3-10** `P0` **İçerik: 300 soru** (her LO ≥3)
- [ ] **F3-11** `P2` Sorunun `revision` artınca SRS kartını `relearning` yapma
- [ ] **F3-12** `P2` Gizli sekme / kalıcılık yok tespiti + kullanıcı uyarısı

---

## Faz 4 — Ölçekleme

- [ ] **F4-01** `P0` **CTFL-AT (Agile Tester)** — ikinci sertifika; mimarinin gerçek testi (kod değişikliği olmamalı)
- [ ] **F4-02** `P1` CT-AI v2.0 (TTB'de Türkçe müfredatı var)
- [ ] **F4-03** `P2` CT-PT (Performance Testing)
- [ ] **F4-04** `P2` CTAL-TA v4.0 — ilk Advanced modül → **çok puanlı soru** desteği (puanlama motoru genişler)
- [ ] **F4-05** `P1` Topluluk soru katkısı: PR şablonu + **özgünlük beyanı** + gözden geçirme akışı
- [ ] **F4-06** `P2` Soru başına tartışma (GitHub Discussions üzerinden, sunucusuz)
- [ ] **F4-07** `P1` **Türkçe süreç rehberi**: kayıt, online gözetim, sonuç, tekrar hakkı (pazar araştırmasında tespit edilen boşluk)
- [ ] **F4-08** `P2` Soru başına global doğruluk oranı — gizlilik korunarak nasıl? (araştırma gerekli)

---

## Sürekli

- [ ] Çeyreklik gözden geçirme kontrol listesi ([`10 §4`](docs/10-riskler-ve-metrikler.md))
- [ ] Soru hata bildirimlerini haftalık elden geçir (kapanma < 7 gün)
- [ ] ISTQB duyurularını izle (yeni müfredat sürümü = R-03)
- [ ] Kapsama raporunu güncel tut
