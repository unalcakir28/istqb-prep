# ISTQB-PREP

> ISTQB sertifikasyon sınavlarına hazırlık için açık kaynaklı, ücretsiz, iki dilli (TR/EN) deneme sınavı ve çalışma platformu.
> **Öncelik: Temel Seviye — CTFL v4.0.1.** Mimari, diğer tüm seviye ve modülleri kapsayacak şekilde tasarlanmıştır.

**Durum:** 📐 Planlama / dökümantasyon aşaması — henüz kod yazılmadı.
**Hedef dağıtım:** GitHub Pages (statik, ücretsiz, sunucusuz)

---

## Problem

Türkiye'de ISTQB sınavına hazırlanan bir aday şu anda şunlarla karşılaşıyor:

- **Resmî kaynak sadece PDF.** TTB ve ISTQB; müfredatı ve 4 örnek sınavı (A/B/C/D) PDF olarak yayınlıyor. Soru ve cevap ayrı dosyalarda, zamanlayıcı yok, ilerleme takibi yok, açıklama yok. Bir akşamda tükeniyor.
- **Türkçe interaktif içerik neredeyse sıfır.** Ücretsiz Türkçe pratik içeriğinin tamamı, aynı 160 resmî sorunun farklı yerlerde yeniden yayınlanmış hâli. Tek interaktif Türkçe deneme, gömülü bir Microsoft Form.
- **İnternetteki soru havuzları çürük.** En büyük ücretsiz İngilizce havuz (~1.360 soru) hangi müfredat sürümüne ait olduğunu bile yazmıyor; ücretli bir iOS uygulaması Eylül 2026'da hâlâ emekliye ayrılmış 2021 müfredatında. Sektördeki standart tavsiye artık *"internet testlerinden uzak durun"* hâline gelmiş durumda.
- **Yanlış kalibrasyon.** Popüler bir ücretsiz test sitesi geçme barajını %50 olarak uyguluyor; gerçek baraj **26/40 (%65)**.
- **Maliyet uçurumu.** TTB CTFL sınavı 5.950 ₺ + KDV; akredite eğitim ~30.000 ₺ + KDV. İkisinin arasında satın alınabilecek ciddi bir Türkçe hazırlık ürünü yok. Foundation'da başarısızlık oranı %25–30.

## Çözüm

Müfredatın kendi yapısına sadık, **öğrenme hedefi (LO) ve K-seviyesi etiketli**, **her çeldiricinin neden yanlış olduğunu açıklayan**, **TR/EN yan yana** çalışılabilen, tamamen istemci tarafında çalışan bir hazırlık platformu.

### Çekirdek farklılaştırıcılar

| # | Özellik | Pazarda kim yapıyor? |
|---|---|---|
| 1 | Türkçe-yerli, doğru terminolojili özgün soru bankası | Hiç kimse |
| 2 | Gerçek sınav kitapçığı gibi **TR/EN yan yana** soru | Sadece 161 öğrencili bir Udemy kursu |
| 3 | Her sorunun **LO kodu + K-seviyesi** etiketi ve LO bazlı zayıflık analizi | Hiç kimse (hiçbir dilde) |
| 4 | **Çeldirici bazlı gerekçe** — "neden bu şık yanlış" | Neredeyse hiç kimse |
| 5 | Görünür **müfredat sürümü rozeti** + emeklilik politikası | Hiç kimse |
| 6 | Resmî **LO-grubu dağılımına** göre üretilen gerçekçi deneme (40 soru / 26 baraj / 60–75 dk) | Hiç kimse |
| 7 | Sınav sorularına uygulanan **aralıklı tekrar (SRS)** | Hiç kimse |

Detaylı gerekçe ve kaynaklar: [`docs/01-pazar-arastirmasi.md`](docs/01-pazar-arastirmasi.md)

---

## Dökümantasyon

| Döküman | İçerik |
|---|---|
| [CLAUDE.md](CLAUDE.md) | **Claude Code oturumları için proje hafızası** — bozulmaz kurallar, doğrulanmış sabitler, konvansiyonlar |
| [00 — Proje Özeti](docs/00-proje-ozeti.md) | Vizyon, hedef, kapsam, başarı tanımı |
| [01 — Pazar Araştırması](docs/01-pazar-arastirmasi.md) | Rakip analizi, TR pazarı, kullanıcı acıları, fırsat alanları |
| [02 — Ürün Gereksinimleri (PRD)](docs/02-urun-gereksinimleri.md) | Personalar, kullanıcı hikâyeleri, özellik listesi, MVP kapsamı |
| [03 — ISTQB Referans Sayfası](docs/03-istqb-referans.md) | Müfredat yapısı, sınav mekaniği, tüm sertifikalar, doğrulanmış veriler |
| [04 — Veri Modeli](docs/04-veri-modeli.md) | JSON şemaları, dosya bölme/indeksleme stratejisi |
| [05 — Teknik Mimari](docs/05-teknik-mimari.md) | Vite + React + TS, klasör yapısı, durum yönetimi, PWA, dağıtım |
| [06 — UI/UX Tasarımı](docs/06-ui-ux-tasarim.md) | Tasarım sistemi, ekranlar, etkileşim spesifikasyonu, erişilebilirlik |
| [07 — İçerik Üretim Rehberi](docs/07-icerik-uretim-rehberi.md) | Soru yazım kuralları, Türkçe terminoloji sözlüğü, kalite kontrol |
| [08 — Hukuki ve Telif](docs/08-hukuki-ve-telif.md) | ISTQB telif analizi, ne kullanılabilir / ne kullanılamaz |
| [09 — Yol Haritası](docs/09-yol-haritasi.md) | Fazlar, kilometre taşları, tahmini eforlar |
| [10 — Riskler ve Metrikler](docs/10-riskler-ve-metrikler.md) | Risk kaydı, KPI'lar, analitik planı |
| [ADR'ler](docs/adr/) | Mimari karar kayıtları |
| [TODO](TODO.md) | Faz bazlı görev listesi |

---

## Teknik özet

```
Vite 6 + React 19 + TypeScript 5
Tailwind CSS v4 + shadcn/ui + Radix primitives
Zustand (durum) · Dexie/IndexedDB (kalıcılık) · i18next (TR/EN)
ts-fsrs (aralıklı tekrar) · vite-plugin-pwa (çevrimdışı)
Veri: /public/data altında indekslenmiş, parçalanmış statik JSON
Backend yok · Hesap yok · Sunucu maliyeti yok · GitHub Pages
```

Gerekçeler: [`docs/adr/0001-frontend-stack.md`](docs/adr/0001-frontend-stack.md)

---

## Yasal uyarı

Bu proje **ISTQB® ve Turkish Testing Board (TTB) ile hiçbir bağlantısı olmayan**, bağımsız ve ücretsiz bir topluluk projesidir. ISTQB® tescilli bir markadır.

Platformdaki sorular **özgün olarak yazılır**; resmî ISTQB örnek sınav soruları kopyalanmaz. Öğrenme hedefi kodları ve bölüm başlıkları, müfredatın telif bildirimindeki *"extracts, for non-commercial use ... if the source is acknowledged"* maddesi kapsamında kaynak gösterilerek alıntılanır. Ayrıntı: [`docs/08-hukuki-ve-telif.md`](docs/08-hukuki-ve-telif.md)

Resmî ve güncel kaynaklar için: [istqb.org](https://istqb.org) · [turkishtestingboard.org](https://www.turkishtestingboard.org)

## Lisans

- **Kod:** MIT — bkz. [LICENSE](LICENSE)
- **İçerik (sorular, açıklamalar, çeviriler):** CC BY-SA 4.0 — bkz. [`docs/08-hukuki-ve-telif.md`](docs/08-hukuki-ve-telif.md)
