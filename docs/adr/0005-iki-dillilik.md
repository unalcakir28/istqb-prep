# ADR-0005 — İki dillilik: soru bazında dil, yan yana görünüm

**Durum:** Kabul edildi · **Tarih:** 19.09.2026

## Bağlam
TTB'nin gerçek sınav kitapçığında **soruların hem Türkçesi hem İngilizcesi yer alıyor**; aday istediği dilden okuyabiliyor. Bunun sebebi pratik: ISTQB terminolojisi İngilizce üzerine kurulu ve Türkçe karşılıklar bazen belirsiz. Pazar araştırmasında adaylardan gelen en net iki şikâyet de bu:

> *"türkçe sorularda ciddi şekilde tercüme hataları mevcuttur"*
> *"Error, bug, failure ingilizcede farklı anlamlara gelirken türkçede genellikle hepsi 'hata' başlığı altında ele alınıyor."*

Piyasada bu iki dilli yapıyı taklit eden tek ürün, 161 öğrencili bir Udemy kursu.

## Değerlendirilen seçenekler

| Seçenek | Artı | Eksi |
|---|---|---|
| Ayrı TR ve EN siteler (`/tr`, `/en`) | SEO net | İçerik ikiye ayrılır; aday sınavdaki iki dilli deneyimi yaşayamaz |
| Hesap bazında tek dil seçimi | Basit | Gerçek sınav böyle değil; adayın kritik anda diğer dile bakma ihtiyacını karşılamaz |
| **Soru bazında dil değiştirme + opsiyonel yan yana** | Gerçek sınav kitapçığını birebir taklit eder | Veri modeli her soruyu iki dilde tutmak zorunda; çeviri eksikse soru yayınlanamaz |
| Yalnızca Türkçe | Odak | Uluslararası kitleyi ve terminoloji köprüsünü kaybederiz |

## Karar
**Her soru zorunlu olarak TR ve EN içerir.** Kullanıcı:
- Soru üzerindeyken tek tuşla (`L`) dil değiştirebilir — **verdiği cevap korunur, sayaç durmaz**
- İsterse **yan yana** modu açabilir (geniş ekranda iki sütun, darda üst üste)
- **Arayüz dili** ile **içerik dili** bağımsızdır (Türk kullanıcı arayüzü Türkçe, soruları İngilizce isteyebilir)

Veri modelinde çeviri ayrı dosyada değil, sorunun `i18n` nesnesinin içindedir — çünkü soru ve çevirisi **birlikte gözden geçirilir**.

CI kuralı: `i18n.tr` ve `i18n.en` ikisi de dolu değilse, şık sayıları eşit değilse veya `rationale.byOption` iki dilde de tam değilse **build kırılır**.

## Gerekçe
Dil değiştirmeyi hesap ayarı yapmak, adayın en çok ihtiyaç duyduğu anı kaçırır: bir terimin Türkçesinden emin olamadığı an. Sınav bunu zaten sunuyor; bizim de sunmamız gerçekçi provanın parçası.

Çeviriyi ayrı dosyaya almamak bilinçli: terminoloji hatası bu projenin R-04 riski ve çevirinin soruyla birlikte, aynı PR'da, aynı gözle incelenmesi tek güvencemiz.

## Sonuçlar
- **+** Gerçek sınav deneyimine en yakın ürün — kimsenin yapmadığı yapısal farklılaştırıcı
- **+** Terminoloji köprüsü: aday TR terimi öğrenirken EN karşılığını da görüyor
- **+** Aynı içerik hem Türk hem uluslararası kitleye hizmet ediyor; havuz bölünmüyor
- **−** Her sorunun maliyeti iki katı (yazım + çeviri + iki dilde gerekçe)
- **−** Çeviri eksik bir soru yayınlanamaz → içerik üretim hızı düşer (R-02'yi büyütür)
- **−** SEO için tek URL'de iki dil: `lang` öznitelikleri doğru ayarlanmalı, `hreflang` stratejisi ileride gözden geçirilmeli
- **−** Yan yana mod, soru kartı bileşenini belirgin şekilde karmaşıklaştırır
