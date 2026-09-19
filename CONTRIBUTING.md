# Katkı Rehberi

> **Not:** Faz 4'e kadar dışarıdan soru katkısı kabul edilmiyor (editoryal kalite standardı henüz oturmadı — bkz. karar D-04). Hata bildirimi, öneri ve kod katkısı her zaman açıktır.

## En değerli katkı: hatalı soru bildirimi

Bir soruda yanlış cevap, kötü çeviri, hatalı müfredat atfı veya zayıf gerekçe gördüysen **Soru Hatası** issue'su aç. Site üzerindeki "Bu soruda hata var" düğmesi issue'yu senin için doldurur.

## Kod katkısı

```bash
npm ci
npm run validate:data   # veri doğrulama
npm run dev
npm run test
npm run lint
```

PR açmadan önce: `npm run lint && npm run test && npm run validate:data` yeşil olmalı.

## Soru katkısı (Faz 4'ten itibaren)

Zorunlu okuma: [`docs/07-icerik-uretim-rehberi.md`](docs/07-icerik-uretim-rehberi.md)

Özetle:

1. **Hiçbir soru resmî ISTQB/TTB örnek sınavından kopyalanamaz, çevrilemez veya "uyarlanamaz."** Sayıları değiştirmek uyarlama değil, türev eserdir.
2. Her soru bir **öğrenme hedefinden (LO)** yola çıkılarak sıfırdan yazılır.
3. **TR ve EN zorunlu.** Türkçe terimler [`07 §5`](docs/07-icerik-uretim-rehberi.md) sözlüğüne uymalı — özellikle `error / defect / failure` → `hata / kusur / arıza` ayrımı.
4. **Her şık için gerekçe zorunlu.** "Yanlış, çünkü doğru cevap C'dir" bir gerekçe değildir; her yanlış şıkkın neyi tanımladığı yazılmalıdır.
5. `syllabusRef`, `objectives[]` ve `kLevel` doğru olmalı.
6. §6'daki kalite kontrol listesinin tamamı işaretlenmeli.

PR şablonundaki özgünlük beyanı kutusu işaretlenmeden PR incelenmez.

## Yapay zekâ kullanımı

Taslak, çeviri önerisi ve dil kontrolü için kullanılabilir. **Doğrulanmamış AI çıktısı yayına alınamaz.** AI'dan "ISTQB örnek sınav sorusu yaz" istemek yasaktır — model eğitim verisinden resmî bir soruyu ezberden üretebilir. Ayrıntı: [`07 §8`](docs/07-icerik-uretim-rehberi.md).

## Davranış

Saygılı ol, iyi niyet varsay, eleştiriyi işe yönelt kişiye değil.
