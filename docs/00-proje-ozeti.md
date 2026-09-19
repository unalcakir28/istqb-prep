# 00 — Proje Özeti

**Sürüm:** 1.0 · **Tarih:** 19.09.2026 · **Durum:** Onay bekliyor

---

## 1. Tek cümlelik tanım

> ISTQB sınavına hazırlananlar için; resmî müfredatın kendi yapısına sadık, öğrenme hedefi bazlı analiz yapan, Türkçe–İngilizce yan yana çalışılabilen, ücretsiz ve açık kaynaklı bir deneme sınavı platformu.

## 2. Neden bu proje?

Aşağıdaki üç gerçek aynı anda doğru:

1. **Talep var ve pahalı.** TTB CTFL sınav ücreti 5.950 ₺ + %20 KDV ≈ **7.140 ₺**. Foundation seviyesinde başarısızlık oranı **%25–30**. Yani her 3–4 adaydan biri bu ücreti ikinci kez ödüyor.
2. **Arz yok.** Türkçe'de dolaşımda olan toplam ayırt edici soru sayısı ~700'ün altında ve bunun kabaca yarısı aynı 160 resmî sorunun yeniden yayını. Ücretsiz ile 30.000 ₺'lik akredite eğitim arasında satın alınabilecek hiçbir ciddi ürün yok.
3. **Var olan arz güvenilmez.** Uluslararası pazarda en büyük ücretsiz havuz müfredat sürümünü belirtmiyor; en ucuz ücretli havuz kendini açıkça "gerçek sınav sorularından alındı" diye pazarlıyor (etik ihlali); ücretli bir iOS uygulaması hâlâ emekli olmuş 2021 müfredatında. Uzman tavsiyesi *"internet testlerinden uzak durun"* seviyesine düşmüş durumda.

Bu üçlü, **güven + Türkçe + doğru etiketleme** kesişiminde boş bir alan bırakıyor.

## 3. Hedefler

### Birincil hedef
Bir CTFL adayının, resmî PDF'lerin ötesinde, **sınav gününe kadar tek bir yerde** çalışabilmesi: pratik → deneme → zayıf nokta tespiti → tekrar.

### Ölçülebilir hedefler (ilk 6 ay)

| Hedef | Ölçüt |
|---|---|
| İçerik | 300+ özgün, gözden geçirilmiş CTFL sorusu (TR + EN) |
| Kapsama | CTFL v4.0.1'in 64 öğrenme hedefinin **tamamı** için ≥3 soru |
| Kalite | Her sorunun her çeldiricisi için gerekçe + müfredat atıfı |
| Kullanım | Aylık 1.000+ tekil ziyaretçi, ortalama oturum ≥8 dk |
| Etki | Kullanıcı anketinde "sınavı geçtim" bildirimi ≥50 |
| Maliyet | Aylık altyapı maliyeti **0 ₺** |

## 4. Kapsam

### Kapsam içi (v1)
- CTFL v4.0.1 — Temel Seviye (**öncelik**)
- Tam deneme sınavı simülasyonu (40 soru / 60 dk / 26 baraj, +%25 uzatma seçeneği)
- Bölüm ve öğrenme hedefi bazlı pratik modu
- Aralıklı tekrar (SRS) destekli flashcard / terim çalışması
- ISTQB Sözlüğü entegrasyonu (TR–EN)
- Detaylı sonuç analizi ve "hazır mısın?" değerlendirmesi
- TR/EN dil değiştirme — **soru bazında**, hesap bazında değil
- Karanlık mod, klavye kısayolları, PWA/çevrimdışı çalışma

### Kapsam dışı (v1)
- Kullanıcı hesabı, giriş, sunucu tarafı senkronizasyon
- Ödeme, abonelik, reklam
- Video eğitim içeriği
- Forum / topluluk tartışması (v2'de değerlendirilecek)
- Mobil uygulama mağazası dağıtımı (PWA yeterli)

### Sonraki seviyeler (mimari hazır, içerik sonra)
CTFL-AT (Agile Tester) → CT-AI (AI Testing) → CT-PT (Performance) → CTAL-TA / CTAL-TM.
Veri modeli ilk günden çok sertifikalı tasarlanır; yalnızca içerik eklenerek genişler. Bkz. [`04-veri-modeli.md`](04-veri-modeli.md).

## 5. Hedef kullanıcı

Ayrıntılı personalar: [`02-urun-gereksinimleri.md`](02-urun-gereksinimleri.md)

Kabaca üç grup:
- **Sınava girecek Türk yazılımcı/test uzmanı** (birincil) — 2–4 haftalık hazırlık penceresi, 40–60 saat çalışma.
- **Kurumsal ekip** — şirketi sertifikayı zorunlu tutan, toplu hazırlanan ekipler.
- **Uluslararası aday** (ikincil) — İngilizce tarafından gelen, ücretsiz ve güvenilir arayan kullanıcı.

## 6. Konumlandırma cümlesi

> ISTQB sınavına hazırlanan Türkçe konuşan test uzmanları için;
> **ISTQB-PREP**, müfredatın öğrenme hedeflerine birebir eşlenmiş, her şıkkın gerekçesini açıklayan ücretsiz bir deneme sınavı platformudur.
> Piyasadaki soru havuzlarından farklı olarak, hangi müfredat sürümüne ait olduğunu her soruda gösterir, hangi öğrenme hedefinde zayıf olduğunuzu söyler ve gerçek sınavın resmî soru dağılımını birebir taklit eder.

## 7. Başarı / başarısızlık tanımı

**Başarılı sayılır:** Bir kullanıcı platformu kullanarak hazırlanıp sınavı geçtiğinde ve "resmî PDF'lere ek olarak buraya ihtiyacım vardı" dediğinde.

**Başarısız sayılır:** Soru bankası, kalitesi denetlenmemiş şekilde büyüdüğünde; ya da müfredat güncellendiğinde içerik güncellenmeyip platform kendi eleştirdiği "eski sürüm" tuzağına düştüğünde.

## 8. Temel kısıtlar

| Kısıt | Sonuç |
|---|---|
| **Telif** — resmî sorular kopyalanamaz | Tüm sorular özgün yazılacak. Bkz. [`08-hukuki-ve-telif.md`](08-hukuki-ve-telif.md) |
| **Backend yok** | Tüm durum istemcide (IndexedDB). Sıralama tablosu, hesap, senkronizasyon yok. |
| **GitHub Pages** | Statik dosya. SSR yok, sunucu yönlendirmesi yok → SPA yönlendirme stratejisi gerekli. |
| **Tek geliştirici** | Kapsam disiplini şart; içerik üretimi en büyük darboğaz. |
| **Müfredat sürümü** | Her içerik parçası sürüm etiketli olmalı; emeklilik politikası ilk günden yazılmalı. |

## 9. Kararlar

Beş açık kararın tamamı **19.09.2026**'da kapandı. Yeniden açılması için yeni bir gerekçe gerekir.

| # | Karar | Sonuç |
|---|---|---|
| D-01 | Ürün adı / marka | ✅ **ISTQB-PREP** — depo adıyla aynı, ayrıca bir marka yaratılmıyor. Ne aradığını bilen adayın aradığı kelime bu; arama görünürlüğü ve ilk bakışta anlaşılırlık en yüksek seçenek. **Karşılığında marka riski bilinçli olarak üstlenildi:** ISTQB® tescilli bir markadır ve `08 §K-4` bu ismi riskli örnek olarak sayar. Açıklayıcı kullanım ("ISTQB sınavına hazırlık") savunulabilir, ürün adı olarak kullanım daha zayıf zemindedir. Beklenen senaryo dava değil, uyarı mektubu + yeniden adlandırma talebidir; bu yüzden isim koda gömülmez (`08 §K-4`). |
| D-02 | Alan adı alınacak mı? | ✅ **Hayır** — `*.github.io` yeterli. "Aylık altyapı maliyeti 0 ₺" hedefi korunuyor; alan adı ihtiyaç doğarsa CNAME ile sonradan eklenir. |
| D-03 | İçerik lisansı | ✅ **CC BY-SA 4.0**. Gerekçe: `08 §K-6`. NC kısıtı katkıyı caydırırdı; SA, içeriğin kapalı bir ürüne alınmasını engelliyor. |
| D-04 | Topluluk soru katkısı v1'de | ✅ **Hayır**. Önce editoryal kalite standardı oturmalı; soru PR'ları Faz 4'te (F4-05) açılır. Hata bildirimi (F2-08) ve kod katkısı baştan açık. |
| D-05 | ISTQB'ye yazılı izin başvurusu | ✅ **Hayır, başvurulmayacak**. İzin istemek, izin gerektiği varsayımını doğurur. Hukuki dayanak zaten özgün içerik (K-1) + ticari olmayan kullanım (K-2) + kaynak gösterimi (K-3); bunlar başvurudan bağımsız geçerli. Karşılığında resmî bir güvence ve TTB işbirliği ihtimali bilinçli olarak feda edildi. |
