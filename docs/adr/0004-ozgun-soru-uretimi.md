# ADR-0004 — Yalnızca özgün soru üretimi

**Durum:** Kabul edildi · **Tarih:** 19.09.2026
**İlgili:** [`../08-hukuki-ve-telif.md`](../08-hukuki-ve-telif.md)

## Bağlam
ISTQB ve TTB, CTFL v4.0.1 için 4 örnek sınav (A–D) + 26 ek soru = **186 soru** yayınlamış durumda; cevap anahtarı ve şık bazında gerekçeleriyle birlikte. Bunları doğrudan kullanmak, projeye bir gecede hazır ve otoriter bir içerik havuzu kazandırırdı.

Ancak ISTQB'nin telif maddesi izin verilen kullanımları açıkça sayıyor: *akredite eğitim sağlayıcısının kursu* ve *makaleler ve kitaplar*. Ardından:

> *"Any other use of this sample exam is prohibited without first obtaining the approval in writing of the ISTQB®."*

**Bir web uygulaması bu listede yok.**

## Değerlendirilen seçenekler

| Seçenek | Değerlendirme |
|---|---|
| 186 resmî soruyu siteye koymak | ❌ "Extract" değil, dokümanın bütünü. İzin listesinde web sitesi yok. Projeyi bitirebilecek risk. |
| Resmî soruları "uyarlamak" (sayı/isim değiştirmek) | ❌ Türev eser. Hukuken daha kötü, etik olarak daha kötü. |
| Birkaç resmî soruyu örnek olarak göstermek | ⚠️ Savunulabilir ama belirsiz; kazancı riske değmez |
| **Tüm soruları LO'lardan sıfırdan yazmak** | ✅ Hukuken temiz; **üstelik ürünün ana konumlandırması** |
| İzin gelene kadar beklemek | ❌ Süresiz blokaj |

## Karar
**Soru bankasındaki her soru özgün olarak yazılır.** Resmî ISTQB/TTB örnek sınav soruları hiçbir biçimde (kopya, çeviri, yeniden ifade, "uyarlama") havuza girmez.

Veri modelinde `origin` alanının **`official` değeri yoktur**: yalnızca `original`, `adapted` (kamuya açık bir standarttan alınan senaryo tanımı), `community`.

Resmî örnek sınavlara **bağlantı verilir** — kopyalanmaz.

## Gerekçe
Hukuki güvenliğin ötesinde bu, pazardaki en güçlü konumlandırmadır. Pazar araştırması, kategorinin güven bakımından iflas ettiğini gösteriyor:
- En büyük ücretsiz havuz müfredat sürümünü bile yazmıyor
- En ucuz ücretli havuz kendini *"gerçek sınav sorularından alındı"* diye pazarlıyor
- Uzman tavsiyesi *"internet testlerinden uzak durun"*a düşmüş

Bu ortamda **"hiçbir sorumuz gerçek sınavdan alınmamıştır; hepsi müfredattaki öğrenme hedeflerinden yazılmıştır ve hangi hedefe ait olduğu her soruda yazar"** cümlesi, bir kısıtın itirafı değil, rakiplerin veremediği bir taahhüttür.

## Sonuçlar
- **+** Hukuki risk minimum; ticari modele geçilse bile içerik bizim
- **+** Konumlandırma: dump karşıtı duruş pazarlama avantajı
- **+** LO ve K-seviyesi etiketleri doğal olarak doğru (soru zaten LO'dan yazıldı)
- **−** **En büyük proje riski buradan doğuyor:** içerik üretimi kodu geçer (R-02)
- **−** MVP 120 soruyla çıkar, 186 hazır soruyla değil
- **−** Yapay zekâ kullanımında dikkat gerekir: model, eğitim verisinden resmî bir soruyu ezberden üretebilir → her soru resmî setlere karşı elle kontrol edilir (R-13)
