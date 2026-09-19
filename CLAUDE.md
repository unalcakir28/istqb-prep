# CLAUDE.md

Bu dosya, bu depoda çalışan Claude Code oturumları içindir. Kısa tutulmuştur; ayrıntı `docs/` altındadır.

## Proje

**ISTQB-PREP** — ISTQB sertifikasyon sınavlarına hazırlık için **ücretsiz, açık kaynaklı, iki dilli (TR/EN)** deneme sınavı ve çalışma platformu. Ürün adı depo adıyla aynı (D-01).
**Öncelik: CTFL v4.0.1 (Temel Seviye).** Mimari tüm seviyeleri kapsayacak şekilde tasarlandı, ama içerik önce Foundation.

**Mevcut durum: çalışan MVP.** Faz 0 ve Faz 1'in çekirdeği bitti — 120 soru yayında (64/64 öğrenme hedefi), deneme motoru resmî LO-grubu dağılımına göre üretiyor, sınav/sonuç/inceleme akışı uçtan uca işliyor. Sırada Faz 2 var — bkz. `TODO.md`.

## Önce bunları oku

| Ne yapacaksan             | Önce oku                                                                 |
| ------------------------- | ------------------------------------------------------------------------ |
| Her şey                   | `docs/00-proje-ozeti.md`                                                 |
| Veri dosyası dokunacaksan | `docs/04-veri-modeli.md`                                                 |
| Kod yazacaksan            | `docs/05-teknik-mimari.md` + `docs/adr/`                                 |
| Arayüz yapacaksan         | `docs/06-ui-ux-tasarim.md`                                               |
| **Soru yazacaksan**       | `docs/07-icerik-uretim-rehberi.md` (zorunlu)                             |
| ISTQB verisi lazımsa      | `docs/03-istqb-referans.md` — **doğrulanmış olgular, yeniden araştırma** |

## Bozulmaz kurallar

Bunlar tartışmaya açık değil; ihlal edilirse proje ya hukuken ya da kimlik olarak çöker.

1. **Resmî ISTQB/TTB örnek sınav soruları kopyalanmaz, çevrilmez, "uyarlanmaz."** Sayıları değiştirmek uyarlama değil, türev eserdir. Her soru bir öğrenme hedefinden (LO) sıfırdan yazılır. → `docs/adr/0004-ozgun-soru-uretimi.md`
   `origin` alanının `official` değeri **yoktur**.
2. **Her şık için gerekçe zorunlu** (`rationale.byOption`), TR ve EN. _"Yanlış, çünkü doğru cevap C'dir"_ gerekçe değildir — her yanlış şıkkın **neyi tanımladığı** yazılır. Bu ürünün ana farklılaştırıcısı.
3. **Her soru TR ve EN içerir.** Biri eksikse yayınlanamaz. → `docs/adr/0005-iki-dillilik.md`
4. **Her içerik parçası `syllabusVersion` taşır** ve UI'da rozet olarak görünür. Eskiyen içerik silinmez, `status: "retired"` alır.
5. **Doğrulanmamış hiçbir şey iddia edilmez.** Örnek: negatif puanlama hiçbir resmî dokümanda geçmiyor → `negativeMarking: null`. `false` yazmak yanlış olur. Doğrulanamayanların listesi: `docs/03-istqb-referans.md §7`.
6. **Ticari kullanım yok.** Reklam, abonelik, ödeme yok — ISTQB'nin _"for non-commercial use"_ koşulu telif dayanağımız.
7. **Backend yok, hesap yok, sunucuya veri gitmez.** Tüm ilerleme IndexedDB'de.
8. **Deneme sessizce eksik üretilmez.** Havuz yetersizse kullanıcıya açıkça söylenir.

## Doğrulanmış sabitler (yeniden araştırma)

CTFL v4.0.1 · 40 soru · 40 puan · baraj **26** (%65) · 60 dk (ana dili İngilizce olmayan **75 dk**)
Her soru **tam olarak 1 puan** — Foundation'da çok puanlı K3 sorusu YOKTUR.
Birden fazla doğru cevaplı soru ("HANGİ İKİSİ") **vardır**, yine 1 puan.

| Bölüm | 1   | 2   | 3   | 4   | 5   | 6   | Toplam |
| ----- | --- | --- | --- | --- | --- | --- | ------ |
| Soru  | 8   | 6   | 4   | 11  | 9   | 2   | **40** |
| LO    | 14  | 10  | 8   | 14  | 16  | 2   | **64** |

Soru K dağılımı: **K1=8, K2=24, K3=8** · LO K dağılımı: K1=14, K2=42, K3=8 (ikisi **farklıdır**, karıştırma)
K3 soruları yalnızca Bölüm 4 ve 5'tedir. **K4 yoktur.**

Bu sayılar `data/ctfl-v4.0.1/syllabus.json` ve `meta.json` içinde; koda **sabit yazılmaz**, oradan okunur.

## Komutlar

**Paket yöneticisi yarn** — npm kullanma. Bağımlılıklar tam sürüme sabitlenir (`^`/`~` yok).

```bash
yarn dev                # Vite (predev: data/ -> public/data/ senkronu)
yarn validate:data      # JSON Schema + 15 tutarlılık kontrolü  ← her PR'da yeşil olmalı
yarn build:index        # parçalardan questions/index.json + manifest sayaçları
yarn stats              # LO başına kapsama → docs/kapsama.md + README rozetleri
yarn publish:questions  # review -> published; --reviewer zorunlu (tek geçiş yolu)
yarn test               # Vitest (birim)
yarn e2e                # Playwright: akış + axe erişilebilirlik (kendi dev sunucusu, 5183)
yarn build              # tsc -b && vite build (CI kapısı)
yarn lint && yarn typecheck && yarn format
```

**Veri düzenledikten sonra sırayla:** `yarn build:index && yarn validate:data`.

## Klasör yapısı

```
data/       İçerik — indekslenmiş, parçalanmış statik JSON (tek dosya YOK)
schemas/    JSON Schema — CI kapısı
docs/       Proje dökümanları + adr/
scripts/    validate-data, build-index, stats, sync-data, publish-questions
src/        Uygulama (Vite + React + TS)
e2e/        Playwright: akış + erişilebilirlik
```

`src/` içinde iş nerede:

```
features/exam/   Deneme motoru — generateExam (blueprint'e göre seçim, tohumlu ve
                 tekrar üretilebilir), scoreExam (tam eşleşme, kısmi puan YOK),
                 examTimer (mutlak Date.now() bitişi), examStore (Zustand)
lib/content/     Statik JSON erişimi + iki katmanlı önbellek (Map + Cache API),
                 dataVersion ile geçersizleştirilir
lib/db/          Dexie/IndexedDB — kalıcılığın tek yeri
lib/i18n/        Arayüz dili; soru dili ayrı bir kavram (attempt.contentLang)
routes/          Ekranlar · components/ paylaşılan arayüz · types/content.ts veri tipleri
```

## Konvansiyonlar

- **Dil:** Kullanıcıyla ve dökümanlarda **Türkçe**. Kod, değişken adları, commit mesajları İngilizce olabilir ama commit gövdesi Türkçe.
- **LO kodu `FL-x.y.z` birincil anahtardır** — Türkçe müfredatta da İngilizce kalıyor, dil-bağımsızdır.
- **Soru ID'si `ctfl4-NNNN`**, asla yeniden kullanılmaz.
- **Soru parçası başına en fazla 40 soru**; dosya adı asla değişmez (CDN + PWA önbelleği).
- **Türkçe terimler:** `error/defect/failure` → **`insan hatası/hata/arıza`** (resmî TTB v4.0.1). Üçü birden "hata" diye çevrilmez — bu ayrım sınavda doğrudan sorulur. **`kusur` kullanılmaz**, müfredatta geçmez. Tek doğruluk kaynağı `data/ctfl-v4.0.1/terms.json` (97 terim, resmî anahtar kelime listelerinden hizalandı); okunabilir tablo `docs/07-icerik-uretim-rehberi.md §5`.
- Vurgu kelimeleri soru metninde BÜYÜK HARF: `EN İYİ`, `HARİÇ`, `DEĞİLDİR`, `HANGİ İKİSİ`.
- `meta.reviewedBy` boşsa `status` **`published` olamaz**.

## Tuzaklar

Hepsi bir kez ısırdı. Tekrar ısırmasın.

- **`data/` düzenledikten sonra** `yarn build:index && yarn validate:data` çalıştır. Dev sunucusu açıkken `data/` değişirse `public/data/` bayat kalır: `predev`/`prebuild` yalnızca başlangıçta senkronlar, sonrası için `yarn sync:data`.
- **`yarn test` (Vitest) `e2e/` dosyalarını toplamamalı.** `vitest.config.ts` içindeki exclude bunu engelliyor; kaldırılırsa Playwright'ın `test.beforeEach`'i patlar ve 39 birim testi geçse bile komut kırmızı döner.
- **E2E tarayıcısı `tr-TR` yerel ayarıyla açılır.** Arayüz dili `navigator.language`'den seçilir; Playwright'ın varsayılanı `en-US` ve o durumda Türkçe etiket seçicileri tutmaz.
- **`GITHUB_ACTIONS` set ise Vite `base` `/istqb-prep/` olur.** `playwright.config.ts` bu değişkeni bilerek boşaltır, yoksa `baseURL` tutmaz.
- **`"resolutions": { "vite": "6.4.3" }` kaldırılmaz.** Vitest kendi Vite 7'sini getiriyor; iki tip ağacı aynı anda durunca `typecheck` ve `build` kırılıyor.
- **Şıklar radio değil checkbox olabilir.** Çok seçimli ("HANGİ İKİSİ") soruda `getByRole("radio")` hiç eşleşmez; testte ikisini birden ara.
- **Yarım kalan deneme ilk cevapsız sorudan devam eder**, kaldığı yerden değil (`examStore.resumeAttempt`).
- **Soru metni içinde şıkka harfle atıf yapma** ("(c) şıkkı..."). 15. kontrol bunu hata sayar: şık konumları dengelenirken harfler değişir, prozadaki atıf yanlış kalır.

## Yapma

- Resmî soruları havuza ekleme (kural 1)
- `docs/03-istqb-referans.md`'deki olguları yeniden araştırma — doğrulanmış, kaynaklı
- Sınav sabitlerini koda gömme — `meta.json`'dan oku
- Next.js / Redux / TanStack Query ekleme — gerekçeler `docs/adr/0001-frontend-stack.md` ve `docs/05-teknik-mimari.md` §2'de
- Runtime'da AI ile soru üretme — kalite ve telif riski (`docs/07-icerik-uretim-rehberi.md` §8)
- `docs/09-yol-haritasi.md` sonundaki "bilinçli olarak sonraya bırakılanlar" listesindekileri, yeniden tartışmadan eklemeye kalkma
- Yapay zekâdan "ISTQB örnek sınav sorusu yaz" isteme — model resmî bir soruyu ezberden üretebilir

## Sıradaki iş

`TODO.md` → **Faz 2**. Faz 0 ve Faz 1'in çekirdeği kapandı; kalanlar:

Faz 0 kapandı (blueprint 29 LO grubuyla tam, 64 öğrenme hedefi işlendi, doğrulayıcı 15 kontrolle çalışıyor). Açık kalanlar:

1. **F0-02** — ISTQB Glossary lisansını tarayıcıda gözle doğrula; doğrulanana kadar sözlük tanımları birebir kopyalanmaz.
2. **Havuzu derinleştir** — `yarn validate:data` 52 uyarı veriyor; hepsi "bu LO için 3'ten az yayınlanmış soru var". Faz 2 hedefi 200 soru, Faz 3 hedefi 300 ve her LO için ≥3.
3. **Faz 2** — pratik modu, aralıklı tekrar (SRS), sözlük. `docs/09-yol-haritasi.md`.

Açık karar kalmadı — D-01…D-05 19.09.2026'da kapandı (`docs/00-proje-ozeti.md §9`):
ürün adı **ISTQB-PREP** (marka riski bilinçli üstlenildi — `10 §R-01b`; ad koda gömülmez) · alan adı yok, `*.github.io` · içerik lisansı **CC BY-SA 4.0** · topluluk soru PR'ları v1'de kapalı (Faz 4) · ISTQB/TTB'ye izin başvurusu **yapılmayacak** (dayanak: özgün içerik + ticari olmayan kullanım + kaynak gösterimi).
