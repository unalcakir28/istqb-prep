# 07 — İçerik Üretim Rehberi

**Sürüm:** 1.0 · **Tarih:** 19.09.2026

> **Bu projenin darboğazı kod değil, içeriktir.** 300 kaliteli soru yazmak, uygulamayı yazmaktan uzun sürer. Bu döküman o işin kalite standardını belirler.

---

## 1. Altın kural

> **Hiçbir soru, resmî ISTQB veya TTB örnek sınavından kopyalanmaz, çevrilmez veya "sayıları değiştirilerek" uyarlanmaz.**

Her soru, bir **öğrenme hedefinden (LO)** yola çıkılarak sıfırdan yazılır. Gerekçe: [`08-hukuki-ve-telif.md`](08-hukuki-ve-telif.md).

Bu bir kısıt değil, **ürünün konumlandırması**: piyasadaki en büyük havuzlar çalıntı veya emekli sürümlerden; bizimki müfredattan türetilmiş ve izlenebilir.

---

## 2. Soru yazma süreci

```
1. LO seç          → objectives.json'dan, kapsama raporunda en az soruya sahip olandan başla
2. K-seviyesini oku → LO'nun K-seviyesi sorunun türünü belirler (§3)
3. Müfredatı oku   → ilgili bölümü TR ve EN olarak oku, terimleri not al
4. Soruyu EN yaz   → İngilizce yaz; ISTQB'nin dil kalıbı İngilizce üzerine kurulu
5. TR'ye çevir     → §5'teki terim sözlüğüne uy; "Türkçeleştir", "tercüme etme"
6. Gerekçeleri yaz → her şık için ayrı "neden" (§4)
7. Atıf ekle       → syllabusRef (§x.y.z), objectives[], kLevel
8. Öz-denetim      → §6 kontrol listesi
9. PR aç           → CI doğrular, ikinci göz gözden geçirir
```

---

## 3. K-seviyesine göre soru tipi

K-seviyesi, sorunun **ne yapmasını istediğini** belirler. Yanlış K-seviyesi, sorunun hem yanlış zamanlanmasına hem de gerçekçi olmayan denemeye yol açar.

### K1 — Hatırla (8 soru / 40)
Tanım, liste, terim. *"...'in tanımı hangisidir?"*, *"Aşağıdakilerden hangisi bir ... değildir?"*

✅ **İyi:** "Kusurun (defect) ISTQB tanımı hangisidir?"
❌ **Kötü:** "Aşağıdakilerden hangisi doğrudur?" (belirsiz, K-seviyesi yok)

### K2 — Anla (24 soru / 40) — **sınavın çoğunluğu**
Ayırt etme, açıklama, sınıflandırma, örnek eşleme. Bu seviyede soru **senaryo içerir**.

✅ **İyi:** "Bir geliştirici kodu derlerken sözdizimi hatası alıyor. Bu durum error, defect ve failure kavramlarından hangisine örnektir?"
❌ **Kötü:** "Error nedir?" (bu K1)

> **K2 yazarken en verimli kalıp:** Kullanıcıların karıştırdığı iki kavramı karşı karşıya getir. Pazar araştırmasında tespit edilen klasik karışıklıklar: *monitoring vs control*, *defect vs failure*, *verification vs validation*, *severity vs priority*, *test case vs test procedure*, *retesting vs regression testing*.

### K3 — Uygula (8 soru / 40) — **hepsi Bölüm 4 ve 5'te**
Bir tekniği somut veriye uygulama. Hesap, sayma, türetme gerektirir.

✅ **İyi:** Eşdeğerlik bölümlemesi, sınır değer analizi, karar tablosu, durum geçişi, ifade/karar kapsamı, test tahminleme.
❌ **Kötü:** "Eşdeğerlik bölümlemesi nedir?" (bu K1/K2)

> **K3 soruları gerçek sınavda soru başına 3 dakika verilecek şekilde zamanlanır** ama yine **1 puandır.** Zorluğu buna göre ayarla: 3 dakikada çözülebilir olmalı.

> **K4 yoktur** — Foundation Level'da K4 sorusu bulunmaz.

---

## 4. Gerekçe yazımı — ana farklılaştırıcımız

Her soru **iki katmanlı** gerekçe taşır:

### `rationale.summary`
2–3 cümle. Doğru cevabın **neden** doğru olduğunu, altındaki kavramı adlandırarak açıklar. Soruyu tekrarlamaz.

### `rationale.byOption` — **her şık için zorunlu**

| Şık | Gerekçe kuralı |
|---|---|
| Doğru şık | *"Doğru."* + neden. Kavramı adlandır. |
| Yanlış şık | *"Yanlış."* + **o şıkkın neyi tanımladığı** + neden buraya uymadığı |

> **En sık yapılan hata:** *"Yanlış, çünkü doğru cevap C'dir."* Bu bir gerekçe değildir. Her yanlış şık **kendi başına bir kavramı** temsil etmeli ve o kavram açıklanmalı. Adayın sınavda ayırt etmesi gereken tam olarak budur.

✅ **İyi:** *"Yanlış. Bu prensip her kombinasyonun test edilemeyeceğini söyler; test etkinliğinin zamanla azalmasını açıklamaz."*
❌ **Kötü:** *"Yanlış, bu doğru cevap değil."*

### Atıf
Her gerekçe `syllabusRef` (`§4.2.3`), `objectives[]` ve `kLevel` taşır ve UI'da çip olarak gösterilir. Bu, **editoryal disiplinden başka maliyeti olmayan en yüksek güvenilirlik özelliğidir.**

---

## 5. Türkçe terminoloji

### Kaynak hiyerarşisi
1. **Birincil:** TTB CTFL v4.0.1 Türkçe müfredatı — `data/ctfl-v4.0.1/terms.json`
2. **İkincil:** TTB *Yazılım Testi Terimler Sözlüğü* — ⚠️ **v3.7 tabanlı, v4.0 ile uyumsuz.** Sadece doğrulanarak kullanılır.
3. **Son çare:** Editoryal çeviri — `trSource: "editorial"` olarak işaretlenir ve gözden geçirmeye tabidir.

> ### ⚠️ Bu bölüm 19.09.2026'da tamamen değiştirildi
> İlk sürümü resmî TR müfredat elde olmadan yazılmıştı ve **büyük bölümü yanlıştı** — üstelik bazı satırlarda
> resmî terim "kullanılmayacak" sütununda listelenmişti (ör. *defect* için doğru karşılık olan **hata**,
> yanlışlıkla yasaklanmış; yerine müfredatta hiç geçmeyen *kusur* dayatılmıştı).
>
> Aşağıdaki tablo artık **türetilmiş değil, ölçülmüş** bir veridir: ISTQB v4.0.1 (EN) ve TTB v4.0.1 (TR)
> müfredatlarının bölüm başı anahtar kelime listeleri aynı sırada yayımlanıyor ve 6 bölümün tamamında
> terim sayıları birebir eşleşti (30/17/10/18/26/1). Eşleme konum bazlıdır; tek bir terim bile
> editoryal çeviriyle üretilmemiştir.
>
> Tek doğruluk kaynağı `data/ctfl-v4.0.1/terms.json`'dur. Bu tablo ondan üretilir — **elle düzenlenmez.**

### Kritik ayrım — Türkçenin çöktüğü yer

Pazar araştırmasında tespit edilen ana acı:
> *"Error, bug, failure ingilizcede farklı anlamlara gelirken türkçede genellikle hepsi 'hata' başlığı altında ele alınıyor."*

**Bu ayrım doğrudan sınanıyor.** Resmî karşılıklar:

| EN | Resmî TR | Neden karıştırılıyor |
|---|---|---|
| **error** | **insan hatası** | Tek başına "hata" denirse *defect* ile karışır |
| **defect** | **hata** | Türkçede "bug" karşılığı da bu |
| **failure** | **arıza** | "başarısızlık" DEĞİL |
| root cause | kök neden | |

Müfredat bölüm 1.2.3'ün resmî başlığı: *"İnsan Hataları, Hatalar, Arızalar ve Kök Nedenler"*.

### Resmî terim tablosu (97 terim)

`Bölüm` sütunu terimin anahtar kelime olarak tanımlandığı müfredat bölümüdür.

| EN | Resmî TR | Bölüm | Kullanılmayacak |
|---|---|:--:|---|
| acceptance criteria | **kabul kriterleri** | 4 |  |
| acceptance test-driven development | **kabul testi güdümlü yazılım geliştirme** | 4 |  |
| acceptance testing | **kabul testi** | 2 |  |
| anomaly | **anomali** | 3 |  |
| black-box test technique | **kara kutu test tekniği** | 4 |  |
| black-box testing | **kara kutu testi** | 2 |  |
| boundary value analysis | **sınır değer analizi** | 4 |  |
| branch coverage | **dal kapsamı** | 4 | ~~dal kapsaması~~ |
| checklist-based testing | **kontrol listesine dayalı test etme** | 4 |  |
| collaboration-based test approach | **iş birliğine dayalı test yaklaşımı** | 4 |  |
| component integration testing | **bileşen entegrasyon testi** | 2 |  |
| component testing | **bileşen testi** | 2 |  |
| confirmation testing | **onaylama testi** | 2 | ~~doğrulama testi~~ |
| coverage | **kapsam** | 1, 4 | ~~kapsama~~ |
| coverage item | **kapsam öğesi** | 4 |  |
| debugging | **hata ayıklama** | 1 |  |
| decision table testing | **karar tablosu testi** | 4 |  |
| defect | **hata** | 1 | ~~kusur~~ |
| defect management | **hata yönetimi** | 5 |  |
| defect report | **hata raporu** | 5 |  |
| dynamic testing | **dinamik test** | 3 |  |
| entry criteria | **giriş kriterleri** | 5 |  |
| equivalence partitioning | **denklik paylarına ayırma** | 4 | ~~eşdeğerlik bölümlemesi~~ · ~~denklik bölümleme~~ |
| error | **insan hatası** | 1 | ~~hata~~ |
| error guessing | **hata tahminleme** | 4 |  |
| exit criteria | **çıkış kriterleri** | 5 |  |
| experience-based test technique | **tecrübeye dayalı test tekniği** | 4 |  |
| exploratory testing | **keşif testi** | 4 | ~~keşifsel test~~ · ~~araştırmacı test~~ |
| failure | **arıza** | 1 | ~~hata~~ · ~~başarısızlık~~ |
| formal review | **resmi gözden geçirme** | 3 |  |
| functional testing | **fonksiyonel test** | 2 |  |
| informal review | **gayri resmi gözden geçirme** | 3 |  |
| inspection | **teftiş** | 3 | ~~inceleme~~ |
| integration testing | **entegrasyon testi** | 2 |  |
| maintenance testing | **bakım testi** | 2 |  |
| non-functional testing | **fonksiyonel olmayan test** | 2 |  |
| product risk | **ürün riski** | 5 |  |
| project risk | **proje riski** | 5 |  |
| quality | **kalite** | 1 |  |
| quality assurance | **kalite güvence** | 1 |  |
| regression testing | **regresyon testi** | 2 | ~~gerileme testi~~ |
| review | **gözden geçirme** | 3 | ~~inceleme~~ |
| risk | **risk** | 5 |  |
| risk analysis | **risk analizi** | 5 |  |
| risk assessment | **risk değerlendirmesi** | 5 |  |
| risk control | **risk kontrolü** | 5 |  |
| risk identification | **risk belirleme** | 5 |  |
| risk level | **risk seviyesi** | 5 |  |
| risk management | **risk yönetimi** | 5 |  |
| risk mitigation | **risk azaltma** | 5 |  |
| risk monitoring | **risk gözetimi** | 5 |  |
| risk-based testing | **risk bazlı test** | 5 |  |
| root cause | **kök neden** | 1 |  |
| shift left | **shift-left** | 2 | ~~sola kaydırma~~ |
| state transition testing | **durum geçişi testi** | 4 |  |
| statement coverage | **komut kapsama yüzdesi** | 4 | ~~ifade kapsaması~~ |
| static analysis | **statik analiz** | 3 |  |
| static testing | **statik test** | 3 |  |
| system integration testing | **sistem entegrasyon testi** | 2 |  |
| system testing | **sistem testi** | 2 |  |
| technical review | **teknik gözden geçirme** | 3 |  |
| test analysis | **test analizi** | 1 |  |
| test approach | **test yaklaşımı** | 5 |  |
| test automation | **test otomasyonu** | 6 |  |
| test basis | **test esası** | 1 | ~~test dayanağı~~ · ~~test tabanı~~ |
| test case | **test senaryosu** | 1 | ~~test durumu~~ |
| test completion | **test tamamlama** | 1 |  |
| test completion report | **test tamamlama raporu** | 5 |  |
| test condition | **test koşulu** | 1 |  |
| test control | **test kontrolü** <br><sub>müfredatta ayrıca: *test kontrol*</sub> | 1, 5 |  |
| test data | **test verisi** | 1 |  |
| test design | **test tasarımı** | 1 |  |
| test execution | **test koşumu** | 1 |  |
| test implementation | **test uyarlama** | 1 |  |
| test level | **test seviyesi** | 2 |  |
| test monitoring | **test gözetimi** | 1, 5 | ~~test izleme~~ |
| test object | **test nesnesi** | 1, 2 |  |
| test objective | **test hedefi** | 1 |  |
| test plan | **test planı** | 5 |  |
| test planning | **test planlama** | 1, 5 |  |
| test procedure | **test prosedürü** | 1 |  |
| test process | **test süreci** | 1 |  |
| test progress report | **test ilerleme raporu** | 5 |  |
| test pyramid | **test piramidi** | 5 |  |
| test result | **test sonucu** | 1 |  |
| test strategy | **test stratejisi** | 5 |  |
| test technique | **test tekniği** | 4 |  |
| test type | **test çeşidi** | 2 |  |
| testing | **test etme** | 1 |  |
| testing quadrants | **test çeyrekleri** | 5 |  |
| testware | **test çalışma ürünleri** | 1 | ~~testware~~ · ~~test ürünleri~~ |
| traceability | **izlenebilirlik** | 1 |  |
| validation | **sağlama** | 1 | ~~geçerleme~~ |
| verification | **doğrulama** | 1 |  |
| walkthrough | **üzerinden geçme** | 3 | ~~teknik gözden geçirme~~ |
| white-box test technique | **beyaz kutu test tekniği** | 4 |  |
| white-box testing | **beyaz kutu testi** | 2 |  |

> **Yazım kuralı:** Bir terim bir soruda **ilk kez** geçtiğinde parantez içinde İngilizcesi verilir: *"hata (defect)"*. Aynı soruda tekrar geçerse sade hâliyle kullanılır.

> ⚠️ **Gerçek sınav kitapçığı iki dillidir.** Aday Türkçe terimi görüp İngilizcesini aramak zorunda kalmamalı — bizim yan yana modumuz bunu birebir taklit eder.

### Soru dilinin tonu
- Sen-dili değil, **tarafsız sınav dili**: *"Aşağıdakilerden hangisi..."*, *"...için MİNİMUM kaç ... gerekir?"*
- Vurgu kelimeleri **BÜYÜK HARF**le yazılır: `EN İYİ`, `HARİÇ`, `DEĞİLDİR`, `MİNİMUM`, `HANGİ İKİSİ` — gerçek sınav böyle yapıyor ve adayların en çok gözden kaçırdığı şey bu.
- Türkçe metin İngilizceden ~%15 uzun; şık metinleri kısa tutulur.

---

## 6. Kalite kontrol listesi

Her soru için PR'dan önce:

**Yapı**
- [ ] Tek bir LO'yu hedefliyor (birden çoksa `kLevel` en yükseği)
- [ ] `kLevel`, LO'nun K-seviyesiyle uyumlu
- [ ] `syllabusRef` doğru bölümü gösteriyor
- [ ] `type`/`selectCount`/`correct` tutarlı
- [ ] Şık sayısı 4 (multi'de 5 olabilir — resmî sınavda çoklu sorular 5 şıklı olabiliyor)

**İçerik**
- [ ] Soru kökü tek başına okunduğunda anlaşılıyor (şıklara bakmadan)
- [ ] Yanlış şıklar **makul çeldirici** — açıkça saçma olan şık yok
- [ ] "Yukarıdakilerin hepsi" / "Hiçbiri" kullanılmadı (bilgi ölçmez)
- [ ] Çift olumsuz yok
- [ ] Doğru cevap diğerlerinden belirgin şekilde **uzun değil** (klasik ipucu sızıntısı)
- [ ] Şıklar birbirini dışlıyor
- [ ] Vurgu kelimeleri büyük harfle yazılmış

**Gerekçe**
- [ ] `summary` doğru cevabı kavram adıyla açıklıyor
- [ ] **Her şık** için `byOption` dolu
- [ ] Yanlış şık gerekçeleri, o şıkkın neyi tanımladığını söylüyor
- [ ] Hiçbir gerekçe "çünkü doğru cevap X" demiyor

**Dil**
- [ ] TR ve EN şık sayıları ve sıraları aynı
- [ ] Terim sözlüğüne uyuluyor (§5)
- [ ] TR metin makine çevirisi gibi okunmuyor
- [ ] `error/defect/failure` ayrımı korunmuş

**Hukuk**
- [ ] Resmî örnek sınavdan kopyalanmadı/uyarlanmadı
- [ ] `origin: "original"`

---

## 7. Kapsama hedefi ve üretim planı

| Aşama | Soru | Öncelik |
|---|---|---|
| **Faz 1 (MVP)** | **120** | Her LO için ≥1 soru + Bölüm 4 ve 5'e ağırlık |
| Faz 2 | 200 | Her LO için ≥2; K3 havuzunu güçlendir |
| Faz 3 | 300 | Her LO için ≥3; her bölüm için ≥3 tam deneme üretilebilir hâle gel |
| Faz 4 | 400+ | Zorluk çeşitliliği; diyagramlı sorular |

### Bölüm bazlı hedef dağılım (Faz 3 / 300 soru)
Gerçek sınav ağırlığıyla orantılı, **artı K3 için fazladan pay**:

| Bölüm | Sınav ağırlığı | Hedef soru | Neden |
|---|---|---|---|
| 1 Temeller | 8/40 (%20) | 55 | |
| 2 YGYD Boyunca Test | 6/40 (%15) | 40 | |
| 3 Statik Test | 4/40 (%10) | 28 | |
| 4 Analiz & Tasarım | 11/40 (%27,5) | **90** | K3 ağırlıklı, en çok pratik gereken |
| 5 Test Yönetimi | 9/40 (%22,5) | **70** | Kronik olarak az çalışılan bölüm |
| 6 Test Araçları | 2/40 (%5) | 17 | |

> **Deneme üretimi için minimum:** Her LO grubunda, o gruba düşen soru sayısının **en az 3 katı** yayınlanmış soru olmalı ki denemeler birbirini tekrar etmesin.

### Kapsama raporu
`npm run stats` her LO için yayınlanmış soru sayısını listeler ve eksikleri sıralar. Bu rapor `docs/kapsama.md` olarak otomatik güncellenir ve README'de rozet olarak gösterilir.

---

## 8. Yapay zekâ kullanımı politikası

**İzin verilen:** Taslak üretimi, Türkçe çeviri önerisi, gerekçe taslağı, dil kontrolü, çeldirici fikri.

**Zorunlu:** Her AI çıktısı bir insan tarafından müfredatla karşılaştırılarak doğrulanır ve düzenlenir. `meta.reviewedBy` doldurulmadan `status: "published"` olamaz.

**Yasak:**
- Doğrulanmamış AI çıktısını yayına almak
- AI'dan "ISTQB örnek sınav sorusu yaz" demek — model eğitim verisinden resmî soruyu ezberden üretebilir, bu telif ihlalidir
- AI'nın uydurduğu müfredat atfına güvenmek (`syllabusRef` elle doğrulanır)

> Model çıktısındaki en sinsi hata: **K-seviyesini yanlış atamak** ve **var olmayan bir LO kodu uydurmak.** CI ikincisini yakalar; birincisi insan gözü ister.

---

## 9. Gözden geçirme akışı

```
Yazar → PR açar (status: "draft")
  ↓
CI: JSON Schema + 13 kontrol
  ↓
Gözden geçiren: §6 kontrol listesi + müfredat karşılaştırması
  ↓
status: "review" → "published", meta.reviewedBy doldurulur
  ↓
merge → deploy
```

Tek kişilik projede bile **yazma ve gözden geçirme aynı oturumda yapılmaz** — en az bir gün ara verilir. Kendi sorunu aynı gün gözden geçirmek, çeldirici zayıflığını görmeyi engeller.

### Kullanıcı hata bildirimi
Her soru kartında "Bu soruda hata var" düğmesi → önceden doldurulmuş GitHub Issue (soru ID, sürüm, seçilen şık, dil). Gelen bildirimler haftalık olarak elden geçirilir; kabul edilen düzeltmede sorunun `revision` değeri artar ve o sorunun SRS kartları `relearning` durumuna alınır.
