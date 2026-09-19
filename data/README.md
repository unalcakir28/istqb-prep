# data/

Tüm içerik burada, **indekslenmiş ve parçalanmış statik JSON** olarak durur.
Yapı, şemalar ve kurallar: [`../docs/04-veri-modeli.md`](../docs/04-veri-modeli.md)

```
manifest.json                  Kök indeks — sertifikalar, dataVersion
certifications.json            Tüm ISTQB sertifikalarının sınav parametreleri  (TODO F0-11)
ctfl-v4.0.1/
  meta.json                    Sınav mekaniği + resmî kaynak bağlantıları      ✅
  syllabus.json                6 bölüm, ağırlıklar, K dağılımları              ✅
  objectives.json              64 öğrenme hedefi                     ⚠️ 3/64 (F0-06)
  exam-blueprint.json          Resmî LO-grubu → soru dağılımı        ⚠️ kısmi (F0-05)
  questions/
    index.json                 Hafif indeks (soru metni YOK)                   ✅
    ch01-a.json                Soru parçası, ≤40 soru                 ⚠️ 1 örnek soru
  glossary/                                                          ⚠️ boş (F0-09)
  exams/                       Küratörlü sabit denemeler                        —
```

## Kurallar

1. **Soru parçası başına en fazla 40 soru.** Dolunca `-b`, `-c` ile devam et. **Dosya adı asla değişmez** (CDN + PWA önbelleği).
2. **Soru silinmez.** Kaldırılan soru `status: "retired"` alır.
3. **Soru ID'si yeniden kullanılmaz.**
4. Her soru **TR ve EN** içermek zorunda; `rationale.byOption` **her şık için** dolu olmalı. Eksikse CI kırılır.
5. `origin` alanının **`official` değeri yoktur** — resmî ISTQB/TTB soruları kopyalanmaz. Bkz. [`../docs/08-hukuki-ve-telif.md`](../docs/08-hukuki-ve-telif.md).
6. `meta.reviewedBy` boşsa `status` **`published` olamaz**.

## Doğrulama

```bash
npm run validate:data    # JSON Schema + 13 tutarlılık kontrolü
npm run build:index      # parçalardan questions/index.json üret
npm run stats            # LO başına kapsama raporu → docs/kapsama.md
```
