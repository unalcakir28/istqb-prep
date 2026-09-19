# ADR-0002 — Veri katmanı: indekslenmiş, parçalanmış statik JSON

**Durum:** Kabul edildi · **Tarih:** 19.09.2026

## Bağlam
Soru bankası 120'den başlayıp 300+, ileride birden çok sertifikayla birlikte 1000+ soruya çıkacak. Backend ve veritabanı yok; her şey statik dosya olarak sunulacak. Kullanıcı bir denemede yalnızca 40 soru görüyor — ama havuzdan seçim yapabilmek için tüm soruların meta verisine ihtiyaç var.

## Değerlendirilen seçenekler

| Seçenek | Artı | Eksi |
|---|---|---|
| Tek `questions.json` | Basit | 1000 soruda ~3 MB; ilk yüklemede indirilir; kabul edilemez |
| Soru başına bir dosya | En granüler | 1000 HTTP isteği; HTTP/2 ile bile kötü; CDN önbelleği verimsiz |
| **Manifest → indeks → parça** | Küçük ilk yük; seçici indirme; kararlı önbellek | İki aşamalı yükleme mantığı yazılmalı |
| SQLite (sql.js / WASM) | Gerçek sorgu | ~1 MB WASM; aşırı mühendislik |
| Harici API/CMS | Yönetim arayüzü | Sunucu maliyeti + gizlilik + tek hata noktası; projenin temel kısıtına aykırı |

## Karar
**Üç katmanlı statik JSON:**

```
manifest.json          → hangi sertifikalar var, dataVersion
<cert>/questions/index.json  → tüm soruların HAFİF meta verisi (metin yok)
<cert>/questions/ch0N-x.json → gerçek sorular, bölüm bazlı, parça başına ≤40 soru
```

Deneme üretimi **indeksten** yapılır; yalnızca seçilen soruların bulunduğu parçalar indirilir (tipik olarak 4–6 parça ≈ 250 KB).

Ayrıntı: [`../04-veri-modeli.md`](../04-veri-modeli.md)

## Gerekçe
İndeks, deneme üretimi ve filtreleme için gereken her şeyi taşır (LO, K-seviyesi, bölüm, zorluk, durum) ve soru başına ~200 bayttır. 1000 soruda ~200 KB — kabul edilebilir ve bir kez indirilir. Soru metinleri ve gerekçeler (asıl ağırlık) yalnızca gerektiğinde gelir.

Parça dosya adları asla değişmez → CDN ve PWA önbelleği kararlı kalır. Soru kaldırılırken dosyadan silinmez, `status: "retired"` alır.

## Sonuçlar
- **+** İlk yük küçük; deneme başlatma hızlı
- **+** Git'te gözden geçirilebilir içerik; PR diff'i okunabilir
- **+** CI'da JSON Schema ile doğrulanabilir → veri bozuksa deploy olmaz
- **+** CMS, veritabanı, sunucu yok
- **−** İndeks 2000 soruyu aşarsa kendisi de bölünmeli (`index-ch01.json` …)
- **−** İçerik güncellemesi deploy gerektirir (kabul edilebilir: içerik zaten gözden geçirmeden geçmeli)
- **−** Parça dolduğunda yeni parça açma disiplini gerekir (script ile otomatikleştirilir)
