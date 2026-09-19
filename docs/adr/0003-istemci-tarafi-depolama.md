# ADR-0003 — İstemci tarafı depolama: IndexedDB (Dexie), hesap yok

**Durum:** Kabul edildi · **Tarih:** 19.09.2026

## Bağlam
Kullanıcının deneme geçmişi, soru bazında cevapları, SRS kartları ve işaretleri kalıcı olmalı. Sunucu yok, hesap yok. Aynı zamanda gizlilik bir konumlandırma unsuru: rakiplerden biri ücretsiz uygulamasında cihaz kimliklerini üçüncü taraflarla paylaşıyor ve kullanıcının verisini silmesine izin vermiyor.

## Değerlendirilen seçenekler

| Seçenek | Artı | Eksi |
|---|---|---|
| `localStorage` | En basit | ~5 MB kota; senkron (ana iş parçacığını bloklar); sorgulanamaz; yalnızca string |
| **IndexedDB (Dexie 4)** | Büyük kota; asenkron; indeksli sorgu; migrasyon desteği | API'si ham hâliyle çirkin (Dexie çözer) |
| OPFS / File System Access | Çok büyük veri | Aşırı; tarayıcı desteği düzensiz |
| Sunucu + hesap | Cihazlar arası senkron | Maliyet, KVKK/GDPR yükü, gizlilik vaadinin ihlali, tek hata noktası |

## Karar
**IndexedDB, Dexie 4 ile.** Hesap yok, sunucuya hiçbir veri gitmez.

Tablolar: `attempts` · `responses` · `srsCards` · `bookmarks` · `settings`
Şema: [`../04-veri-modeli.md §4`](../04-veri-modeli.md)

Cihaz değiştirme ihtiyacı **JSON dışa/içe aktarma** ile karşılanır (F3-08).

## Gerekçe
`responses` tablosu soru başına her cevabı tutar — 300 sorulu bir havuzda aktif bir kullanıcıda binlerce satır olur. SRS ve "hiç iki kez üst üste doğru yapamadığım sorular" gibi filtreler indeksli sorgu ister. `localStorage` bunların hiçbirini karşılamaz.

Hesap eklememek bir eksiklik değil, **ürün kararıdır**: sıfır sürtünme (açılışta hemen çözmeye başlanır), sıfır gizlilik yükü, sıfır altyapı maliyeti.

## Sonuçlar
- **+** Sunucu, KVKK süreci, çerez bandı yok
- **+** Hızlı; çevrimdışı çalışmaya hazır (Faz 3 PWA)
- **+** "Hiçbir veriniz bize gelmiyor" doğrulanabilir bir iddia (açık kaynak)
- **−** Tarayıcı verisi temizlenirse ilerleme kaybolur → dışa aktarma özelliği ve ilk kullanımda bilgi notu zorunlu
- **−** Gizli sekmede kalıcılık yok → uygulama bunu tespit edip uyarır
- **−** Cihazlar arası otomatik senkron yok → manuel dışa/içe aktarma
- **−** Soru başına global doğruluk oranı gibi toplu metrikler v1'de üretilemez (bilinçli feragat)
