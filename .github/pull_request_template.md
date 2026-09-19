## Ne değişti?

## Tür

- [ ] Kod
- [ ] İçerik (soru / gerekçe / çeviri)
- [ ] Döküman
- [ ] Hata düzeltmesi

---

## Kod PR'ı ise

- [ ] `npm run lint` yeşil
- [ ] `npm run test` yeşil
- [ ] `npm run validate:data` yeşil
- [ ] `tsc --noEmit` yeşil

## İçerik PR'ı ise

### ⚖️ Özgünlük beyanı (zorunlu)

- [ ] **Bu soruyu kendim yazdım.** Herhangi bir resmî ISTQB/TTB örnek sınavından, ücretli bir kurstan veya "dump" kaynağından kopyalamadım, çevirmedim veya uyarlamadım.

### Kalite kontrol listesi (`docs/07-icerik-uretim-rehberi.md` §6)

- [ ] Tek bir LO'yu hedefliyor; `kLevel` LO ile uyumlu
- [ ] `syllabusRef` doğru bölümü gösteriyor
- [ ] `type` / `selectCount` / `correct` tutarlı
- [ ] Soru kökü şıklara bakmadan anlaşılıyor
- [ ] Çeldiriciler makul; "hepsi"/"hiçbiri" yok; çift olumsuz yok
- [ ] Doğru cevap diğerlerinden belirgin şekilde uzun değil
- [ ] Vurgu kelimeleri büyük harfle (`EN İYİ`, `HARİÇ`, `HANGİ İKİSİ`)
- [ ] **Her şık için** `rationale.byOption` dolu (TR ve EN)
- [ ] Hiçbir gerekçe "çünkü doğru cevap X" demiyor
- [ ] TR/EN şık sayıları ve sıraları aynı
- [ ] Türkçe terim sözlüğüne uyuldu (`error/defect/failure` → `hata/kusur/arıza`)
