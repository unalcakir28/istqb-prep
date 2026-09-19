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
1. **Birincil:** TTB CTFL v4.0.1 Türkçe müfredatı
2. **İkincil:** TTB *Yazılım Testi Terimler Sözlüğü* — ⚠️ **v3.7 tabanlı, v4.0 ile uyumsuz.** Sadece doğrulanarak kullanılır.
3. **Son çare:** Editoryal çeviri — `trSource: "editorial"` olarak işaretlenir ve gözden geçirmeye tabidir.

### Kritik ayrımlar — Türkçenin çöktüğü yer

Pazar araştırmasında tespit edilen ana acı:
> *"Error, bug, failure ingilizcede farklı anlamlara gelirken türkçede genellikle hepsi 'hata' başlığı altında ele alınıyor."*

**Bu ayrım doğrudan sınanıyor.** Kuralımız: bu üçlü asla "hata" diye çevrilmez.

| EN | TR (kullanılacak) | ❌ Kullanılmayacak |
|---|---|---|
| error / mistake | **hata (insan kaynaklı)** — ilk geçişte `(error)` yazılır | "bug" |
| defect / bug / fault | **kusur** | "hata" |
| failure | **arıza** | "hata", "başarısızlık" |
| root cause | kök neden | |
| test case | test senaryosu | "test durumu" |
| test procedure | test prosedürü | |
| test suite | test paketi | |
| test basis | test dayanağı | "test tabanı" |
| test object | test nesnesi | |
| test condition | test koşulu | |
| test data | test verisi | |
| testware | testware / test ürünleri | ⚠️ v4.0'da `test documentation` yerine geldi |
| work product | iş ürünü | ⚠️ v4.0'da `artifact` yerine geldi |
| coverage | kapsama | "kapsam" |
| statement coverage | ifade kapsaması | |
| branch / decision coverage | dal / karar kapsaması | |
| equivalence partitioning | eşdeğerlik bölümlemesi | "denklik bölümleme" |
| boundary value analysis | sınır değer analizi | |
| decision table testing | karar tablosu testi | |
| state transition testing | durum geçiş testi | |
| exploratory testing | keşifsel test | "araştırmacı test" |
| regression testing | regresyon testi | "gerileme testi" |
| confirmation testing / retesting | doğrulama testi (yeniden test) | |
| verification | doğrulama | ⚠️ validation ile karıştırma |
| validation | geçerleme | "doğrulama" |
| severity | şiddet | "önem" |
| priority | öncelik | |
| risk likelihood | risk olasılığı | |
| risk impact | risk etkisi | |
| entry / exit criteria | giriş / çıkış kriterleri | |
| definition of done | bitti tanımı | |
| test monitoring | test izleme | ⚠️ control ile karıştırma |
| test control | test kontrolü | |
| performance efficiency | performans verimliliği | ⚠️ v4.0'da `performance` yerine geldi |
| quality assurance | kalite güvence | |
| static testing | statik test | |
| dynamic testing | dinamik test | |
| review | gözden geçirme | "inceleme" (bu `inspection`) |
| walkthrough | teknik gözden geçirme (walkthrough) | |
| inspection | inceleme | |
| shift left | sola kaydırma (shift left) | |
| whole team approach | bütün ekip yaklaşımı | |
| test pyramid | test piramidi | |
| testing quadrants | test çeyrekleri | |

> **Yazım kuralı:** Bir terim bir soruda **ilk kez** geçtiğinde parantez içinde İngilizcesi verilir: *"kusur (defect)"*. Aynı soruda tekrar geçerse sade hâliyle kullanılır.

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
