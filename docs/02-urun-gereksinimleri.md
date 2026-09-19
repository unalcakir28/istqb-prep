# 02 — Ürün Gereksinimleri (PRD)

**Sürüm:** 1.0 · **Tarih:** 19.09.2026

---

## 1. Personalar

### P1 — Emre, 28, Test Uzmanı (birincil, %60)
3 yıllık manuel test deneyimi, Ankara'da bir yazılım şirketinde. Şirket sertifikayı terfi için istiyor, sınav ücretini de karşılıyor ama **bir kez**. Akşamları 1–2 saat çalışabiliyor, toplam 3 haftası var.
- **İhtiyacı:** Gerçek sınav gibi hissettiren, kaç puanda olduğunu dürüstçe söyleyen deneme.
- **Korkusu:** Kalmak ve ücreti cebinden ödemek.
- **Bugün ne yapıyor:** Müfredat PDF'ini 2 kez okudu, TryQA'dan İngilizce soru çözüyor, terimlerin Türkçesinde kayboluyor.
- **Ürünü terk etme sebebi:** Soruların güncel olmadığını fark ederse.

### P2 — Zeynep, 24, Yeni Mezun (%25)
Bilgisayar mühendisliği yeni mezunu, iş ararken CV'sine sertifika eklemek istiyor. Test terminolojisi ona tamamen yabancı. Ücret ödeyemiyor.
- **İhtiyacı:** Sadece test değil, **öğretme**. Terim sözlüğü, bölüm bölüm ilerleme, ipucu.
- **Korkusu:** Nereden başlayacağını bilememek.
- **Ürünü terk etme sebebi:** İlk denemede 12/40 alıp cesaretinin kırılması → **ilk deneyim pratik modu olmalı, deneme değil.**

### P3 — Murat, 35, Senior Developer (%10)
Ekibi ISTQB alacak, o da "madem" diyerek giriyor. Zamanı çok az, 1 haftada halletmek istiyor.
- **İhtiyacı:** Zayıf noktalarını hızlıca bulmak. "Nerede kalıyorum?" sorusunun cevabı.
- **Değer verdiği:** Klavye kısayolları, karanlık mod, hızlı akış, gereksiz animasyon olmaması.

### P4 — International candidate (ikincil, %5)
İngilizce arayan, ücretsiz ve güvenilir bir kaynak isteyen uluslararası aday.
- **İhtiyacı:** Sürüm garantisi + LO bazlı analiz. Türkçe ona lazım değil ama zarar da vermiyor.

---

## 2. Kullanıcı hikâyeleri

### Epik A — Deneme sınavı
| ID | Hikâye | Öncelik |
|---|---|---|
| A-1 | Kullanıcı olarak, gerçek sınav kurallarıyla (40 soru, 60 dk, 26 baraj) bir deneme başlatmak istiyorum ki sınav gününü provası olsun. | P0 |
| A-2 | Ana dilim Türkçe olduğu için **75 dakika** seçeneğini işaretleyebilmek istiyorum. | P0 |
| A-3 | Soruyu **işaretleyip (flag)** sonra dönebilmek istiyorum. | P0 |
| A-4 | Süre bitmeden **soru gezgini** üzerinden cevapsız/işaretli soruları görebilmek istiyorum. | P0 |
| A-5 | Deneme, resmî **LO grubu dağılımına** göre üretilsin ki gerçek sınavın bölüm ağırlığını yansıtsın. | P0 |
| A-6 | Süre dolduğunda sınav otomatik teslim edilsin. | P0 |
| A-7 | Yarıda bıraktığım denemeye geri dönebilmek istiyorum (sayfa kapansa bile). | P1 |
| A-8 | Aynı soruları tekrar görmemek için "daha önce çıkmayanlardan üret" seçeneği istiyorum. | P1 |

### Epik B — Pratik ve öğrenme
| ID | Hikâye | Öncelik |
|---|---|---|
| B-1 | Bölüm seçip zamansız, anlık geri bildirimli pratik yapmak istiyorum. | P0 |
| B-2 | Her cevaptan sonra **neden doğru ve her yanlış şıkkın neden yanlış olduğunu** görmek istiyorum. | P0 |
| B-3 | Gerekçede **müfredat bölümü atfını** (`§4.2.3`) ve **LO kodunu** görmek istiyorum. | P0 |
| B-4 | Belirli bir **öğrenme hedefine** odaklanıp o LO'nun sorularını çözmek istiyorum. | P1 |
| B-5 | Zorlandığımda kademeli ipucu (dürtme → ipucu → çözüm) istiyorum. | P2 |
| B-6 | Terim sözlüğünde TR/EN karşılıkları ve tanımı aramak istiyorum. | P1 |
| B-7 | Sorudaki bir terimin üzerine gelince tanımını görmek istiyorum. | P2 |

### Epik C — İki dillilik
| ID | Hikâye | Öncelik |
|---|---|---|
| C-1 | Soru bazında TR ↔ EN geçiş yapabilmek istiyorum (gerçek sınav kitapçığı gibi). | P0 |
| C-2 | TR ve EN metni **yan yana** görebilmek istiyorum. | P1 |
| C-3 | Arayüz dilini içerik dilinden bağımsız seçebilmek istiyorum. | P1 |

### Epik D — Analiz ve ilerleme
| ID | Hikâye | Öncelik |
|---|---|---|
| D-1 | Sonuç ekranında **26/40 baraj çizgisini** ve skorumu görmek istiyorum. | P0 |
| D-2 | **Bölüm bazlı kırılım** ve her bölümün gerçek sınav ağırlığına göre hedef çubuğunu görmek istiyorum. | P0 |
| D-3 | **En zayıf 3 öğrenme hedefimi** ve tek tıkla o LO'ya drill başlatmayı istiyorum. | P0 |
| D-4 | Sınav sonrası **soru soru inceleme turu** yapmak istiyorum. | P0 |
| D-5 | "Hazır mısın?" değerlendirmesi istiyorum (son 3 zamanlı denemeden üretilen). | P1 |
| D-6 | Zaman içindeki skor eğilimimi grafikte görmek istiyorum. | P1 |
| D-7 | "Hiç iki kez üst üste doğru yapamadığım sorular" filtresini istiyorum. | P1 |

### Epik E — Tekrar (SRS)
| ID | Hikâye | Öncelik |
|---|---|---|
| E-1 | Yanlış yaptığım sorular otomatik olarak tekrar destesine eklensin. | P1 |
| E-2 | Cevabı gördükten sonra **Again / Hard / Good / Easy** ile kendimi derecelendirmek istiyorum (şanslı tahmin ≠ emin cevap). | P1 |
| E-3 | Her düğmede **sonraki tekrar aralığını** görmek istiyorum. | P2 |
| E-4 | Bugün kaç kartın vadesinin geldiğini ana ekranda görmek istiyorum. | P1 |
| E-5 | Aynı LO'ya ait iki soru arka arkaya gelmesin. | P2 |

### Epik F — Veri sahipliği ve güven
| ID | Hikâye | Öncelik |
|---|---|---|
| F-1 | Hesap açmadan kullanmak istiyorum. | P0 |
| F-2 | Her soruda hangi **müfredat sürümüne** ait olduğunu görmek istiyorum. | P0 |
| F-3 | İlerlememi JSON olarak dışa/içe aktarabilmek istiyorum (cihaz değiştirme). | P1 |
| F-4 | Uçakta / internetsiz çalışabilmek istiyorum. | P1 |
| F-5 | Hatalı bir soruyu tek tıkla bildirebilmek istiyorum. | P1 |

---

## 3. Özellik listesi ve MVP kapsamı

| Özellik | MVP (Faz 1) | Faz 2 | Faz 3 |
|---|:--:|:--:|:--:|
| Tam deneme sınavı (40/60/26) | ✅ | | |
| LO-grubu tabanlı deneme üretimi | ✅ | | |
| 75 dk uzatma seçeneği | ✅ | | |
| Soru işaretleme + gezgin | ✅ | | |
| Sonuç ekranı + baraj çizgisi + bölüm kırılımı | ✅ | | |
| Soru soru inceleme turu | ✅ | | |
| Çeldirici bazlı gerekçe + LO/§ atıf | ✅ | | |
| TR/EN soru bazında geçiş | ✅ | | |
| Karanlık mod | ✅ | | |
| Klavye kısayolları | ✅ | | |
| Devam eden denemeyi sürdürme | ✅ | | |
| Bölüm bazlı pratik modu | | ✅ | |
| LO bazlı drill | | ✅ | |
| LO zayıflık analizi | | ✅ | |
| Terim sözlüğü (TR/EN, 215 CTFL terimi) | | ✅ | |
| TR/EN yan yana görünüm | | ✅ | |
| Yanlışlarım / işaretlediklerim listesi | | ✅ | |
| Soru hata bildirimi | | ✅ | |
| SRS flashcard (FSRS) | | | ✅ |
| Hazırlık tahmini ("hazır mısın?") | | | ✅ |
| İlerleme grafikleri + seri | | | ✅ |
| PWA / çevrimdışı | | | ✅ |
| İlerleme dışa/içe aktarma | | | ✅ |
| Kademeli ipucu | | | ✅ |
| Terim üzerine gelince tanım | | | ✅ |

### MVP'nin kesin sınırı
> **Faz 1 bitmiş sayılır:** Bir kullanıcı siteye girip, hesap açmadan, gerçek kurallarla 40 soruluk bir deneme çözebiliyor; sonunda bölüm bazlı kırılımını görüyor; her sorunun her şıkkının neden doğru/yanlış olduğunu okuyabiliyor; ve tüm bunları TR veya EN yapabiliyor. **En az 120 özgün soru yayında.**

---

## 4. Kapsam dışı (v1)

- Kullanıcı hesabı, e-posta, giriş
- Sunucu tarafı veri, senkronizasyon, sıralama tablosu
- Ödeme, abonelik, reklam, analitik izleyici (gizlilik odaklı, çerezsiz sayaç hariç)
- Video içerik
- Kullanıcıların soru eklemesi (topluluk PR'ı) — Faz 4'te değerlendirilecek
- Yapay zekâ ile soru üretimi (kalite riski — bkz. [`07-icerik-uretim-rehberi.md`](07-icerik-uretim-rehberi.md))
- Mobil uygulama mağazası dağıtımı

---

## 5. Fonksiyonel olmayan gereksinimler

| Kategori | Gereksinim |
|---|---|
| **Performans** | İlk anlamlı boyama < 1,5 s (3G Fast). Soru geçişi < 100 ms. İlk yüklemede yalnızca manifest + ilgili soru parçası indirilir (tam havuz değil). |
| **Paket boyutu** | JS bundle (gzip) < 200 KB. Soru parçası başına < 60 KB. |
| **Erişilebilirlik** | WCAG 2.1 AA. Tam klavye navigasyonu. Ekran okuyucu ile sınav çözülebilmeli. Renk tek başına anlam taşımaz (doğru/yanlış ikon + metinle de belirtilir). |
| **Duyarlılık** | 360 px'ten itibaren çalışır. Mobilde tek elle çözülebilir (şıklar tam genişlik dokunma hedefi). |
| **Çevrimdışı** | Faz 3'ten itibaren PWA; ziyaret edilen soru parçaları önbelleğe alınır. |
| **Gizlilik** | Sunucuya hiçbir kişisel veri gitmez. Tüm ilerleme IndexedDB'de. Çerez yok. |
| **i18n** | Arayüz ve içerik dilleri bağımsız. Yeni dil eklemek için kod değişikliği gerekmez. |
| **Veri bütünlüğü** | Her soru CI'da JSON Schema ile doğrulanır; LO kodu bilinen LO listesinde yoksa build kırılır. |
| **Tarayıcı desteği** | Son 2 sürüm Chrome/Edge/Firefox/Safari. IE yok. |

---

## 6. Ölçüm ve kabul kriterleri

| Hikâye | Kabul kriteri |
|---|---|
| A-1 | Deneme başlatıldığında zamanlayıcı 60:00'dan geri sayar; 0'da otomatik teslim olur; skor `doğru sayısı / 40` olarak hesaplanır ve ≥26 ise "GEÇTİ" gösterilir. |
| A-5 | Üretilen 40 sorunun bölüm dağılımı **tam olarak** 8/6/4/11/9/2 olur; K dağılımı 8/24/8 olur. Birim testle doğrulanır. |
| B-2 | Her soruda `rationale.byOption` içinde **her şık için** boş olmayan metin bulunur; eksikse CI kırılır. |
| C-1 | Dil değiştirildiğinde soru, şıklar ve gerekçe aynı anda değişir; kullanıcının verdiği cevap korunur. |
| D-2 | Sonuç ekranında 6 bölüm için çubuk gösterilir; her çubuğun arkasında gerçek sınav ağırlığı hayalet hedef olarak çizilir. |
| F-2 | Her soru kartının başlığında `v4.0.1` rozeti ve LO kodu görünür. |

---

## 7. Riskler (özet)

Tam risk kaydı: [`10-riskler-ve-metrikler.md`](10-riskler-ve-metrikler.md)

En kritik üçü:
1. **İçerik üretimi darboğazı** — 300 kaliteli soru yazmak, uygulamayı yazmaktan uzun sürer.
2. **Telif** — resmî soruların kopyalanması projeyi bitirir. Bkz. [`08-hukuki-ve-telif.md`](08-hukuki-ve-telif.md).
3. **Türkçe terminoloji tutarsızlığı** — yanlış çeviri, eleştirdiğimiz sorunun aynısına düşmemize yol açar.
