# 06 — UI / UX Tasarımı

**Sürüm:** 1.0 · **Tarih:** 19.09.2026

> Tasarım felsefesi: **Sınav ciddi bir şey; arayüz de öyle davranmalı ama kullanıcıyı korkutmamalı.**
> Referans desenler ve neden seçildikleri: [`01-pazar-arastirmasi.md §7`](01-pazar-arastirmasi.md)

---

## 1. Tasarım ilkeleri

1. **Soru ekranın kahramanıdır.** Sınav sırasında ekranda sorudan, şıklardan, süreden ve gezginden başka hiçbir şey olmaz.
2. **Dürüstlük > motivasyon.** Skoru yumuşatmayız, baraj çizgisini her zaman gösteririz. Ama önce ne yapabildiğini gösterir, sonra eksiği söyleriz.
3. **Her iddia kaynaklıdır.** Her gerekçenin altında müfredat atfı ve LO kodu vardır. Bu hem doğruluk hem de güven işaretidir.
4. **Karanlık mod birinci sınıf.** Kitle geliştirici; rakiplerin hiçbiri karanlık mod ilan etmiyor.
5. **Klavye ile tam kullanım.** Murat (P3) faresine dokunmadan 40 soru çözebilmeli.
6. **Sıfır sürtünme.** Hesap yok, açılış ekranı yok, çerez bandı yok. Girer girmez çözmeye başlanabilir.
7. **Mobilde tek elle.** Şıklar tam genişlik dokunma hedefi; birincil eylem başparmak erişiminde.

---

## 2. Tasarım sistemi

### Renk (semantik token'lar, Tailwind v4 CSS değişkenleri)

| Token | Açık | Koyu | Kullanım |
|---|---|---|---|
| `--bg` | `#FAFAF9` | `#0C0A09` | Sayfa zemini |
| `--surface` | `#FFFFFF` | `#1C1917` | Kart |
| `--surface-2` | `#F5F5F4` | `#292524` | İkincil yüzey |
| `--border` | `#E7E5E4` | `#292524` | Kenarlık |
| `--fg` | `#1C1917` | `#FAFAF9` | Ana metin |
| `--fg-muted` | `#57534E` | `#A8A29E` | İkincil metin |
| `--accent` | `#0F766E` | `#2DD4BF` | Birincil eylem, marka |
| `--correct` | `#15803D` | `#4ADE80` | Doğru cevap |
| `--incorrect` | `#B91C1C` | `#F87171` | Yanlış cevap |
| `--flag` | `#B45309` | `#FBBF24` | İşaretli soru, süre uyarısı |
| `--info` | `#1D4ED8` | `#60A5FA` | Bilgi, LO rozeti |

> **Renk asla tek başına anlam taşımaz.** Doğru/yanlış her zaman ikon + metinle birlikte gösterilir (WCAG 1.4.1).

### Tipografi

| Rol | Font | Boyut / satır |
|---|---|---|
| Soru gövdesi | Inter (veya sistem) | 17px / 1.6, **max 65ch** |
| Şık metni | Inter | 16px / 1.5 |
| Gerekçe | Inter | 15px / 1.6 |
| Kod / tablo | JetBrains Mono | 14px |
| Başlık | Inter SemiBold | 24–32px |
| Rozet / meta | Inter Medium | 12px, harf aralığı +0.02em |

> Türkçe metin İngilizceden ~%15 daha uzun. Tüm bileşenler **Türkçe metinle** tasarlanır; İngilizce zaten sığar.

### Boşluk ve yuvarlaklık
4px tabanlı ölçek (4/8/12/16/24/32/48). Kart yarıçapı 12px, düğme 8px, rozet 6px. Gölge minimum; ayrım kenarlıkla yapılır (karanlık modda gölge işe yaramaz).

---

## 3. Ekranlar

### 3.1 Ana sayfa `/`

```
┌───────────────────────────────────────────────────────────┐
│  ISTQB-PREP            [CTFL v4.0.1 ▾] [TR|EN] [🌙] [≡]  │
├───────────────────────────────────────────────────────────┤
│                                                           │
│   ISTQB Temel Seviye sınavına hazırlan                    │
│   40 soru · 60 dakika · geçme notu 26/40                  │
│                                                           │
│   ┌─────────────────────┐  ┌─────────────────────┐        │
│   │ ▶ Deneme Sınavı     │  │ ✎ Pratik Yap        │        │
│   │ Gerçek sınav kural- │  │ Bölüm seç, zamansız │        │
│   │ larıyla tam simülas.│  │ anlık geri bildirim │        │
│   └─────────────────────┘  └─────────────────────┘        │
│   ┌─────────────────────┐  ┌─────────────────────┐        │
│   │ ↻ Tekrar (12 vadeli)│  │ 📖 Terimler Sözlüğü │        │
│   └─────────────────────┘  └─────────────────────┘        │
│                                                           │
│   ── Durumun ────────────────────────────────────────     │
│   Son deneme: 28/40 GEÇTİ        🔥 4 günlük seri         │
│   [████████████████░░░░] %70 · baraj %65                  │
│   En zayıf: FL-4.2.3 · FL-5.1.4 · FL-2.1.5  [Çalış →]     │
│                                                           │
│   312 soru · 64/64 öğrenme hedefi kapsanıyor · v4.0.1     │
└───────────────────────────────────────────────────────────┘
```

**Kritik karar:** İlk kez gelen kullanıcıya (Zeynep, P2) "Durumun" bloğu yerine **"Nereden başlamalı?"** kartı gösterilir ve birincil eylem **Deneme değil, Pratik**tir. İlk deneyimde 12/40 almak kullanıcıyı kaybettirir.

### 3.2 Deneme kurulumu `/exam/setup`

- Süre: `60 dk (standart)` · **`75 dk (ana dili İngilizce olmayan)`** — varsayılan olarak Türkçe arayüzde **75 seçili gelir**
- İçerik dili: `Türkçe` / `English` / `Yan yana`
- Soru kaynağı: `Karışık (önerilen)` · `Daha önce görmediklerim` · `Yanlış yaptıklarım`
- Şıkları karıştır: açık/kapalı
- Sağ tarafta **canlı dağılım önizlemesi**: bölüm başına kaç soru geleceği (8/6/4/11/9/2)
- Havuz yetersizse **burada** uyarı: *"4. bölüm için 11 yerine 9 soru var. Deneme 38 soruyla üretilecek."*

### 3.3 Sınav oturumu `/exam/:id`

```
┌───────────────────────────────────────────────────────────┐
│ ⏱ 47:12    Soru 12 / 40    [⚑ İşaretle]   [TR|EN]  [⊞]   │
├───────────────────────────────────────────────────────────┤
│  Bölüm 4 · FL-4.2.1 · K3 · v4.0.1                         │
│                                                           │
│  Bir sistem 1–100 arası tam sayı kabul ediyor.            │
│  Eşdeğerlik bölümlemesi kullanıldığında MİNİMUM kaç       │
│  test senaryosu gerekir?                                  │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ 1   ◯  2                                            │  │
│  ├─────────────────────────────────────────────────────┤  │
│  │ 2   ◉  3                                            │  │
│  ├─────────────────────────────────────────────────────┤  │
│  │ 3   ◯  4                                            │  │
│  ├─────────────────────────────────────────────────────┤  │
│  │ 4   ◯  6                                            │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                           │
│  [← Önceki]                              [Sonraki →]      │
└───────────────────────────────────────────────────────────┘
```

Detaylar:
- **Zamanlayıcı** sağ üstte, sakin; **son 10 dakikada amber**, son 1 dakikada kırmızı ve `aria-live` ile duyurur. Gizle/göster düğmesi var (bazı adaylar için sayaç kaygı yaratır).
- **Şık numaraları** (1–4) görünür → klavye kısayolu keşfedilebilir olur.
- `multi` soruda şıklar radio değil checkbox olur ve başlıkta **"HANGİ İKİSİ — 2 şık seçin"** yazar (gerçek TTB kitapçığı dili).
- **Dil değiştirme soru bazında** — cevap korunur, sayaç durmaz.
- **`⊞` soru gezgini** sağdan açılır: 40 kutu; boş / cevaplı / işaretli renkleriyle. Mobilde alt sayfa (bottom sheet).
- Sınav sırasında **hiçbir geri bildirim yok.** Doğru/yanlış gösterilmez.

### 3.4 Sonuç ekranı `/exam/:id/result`

```
┌───────────────────────────────────────────────────────────┐
│                     28 / 40                               │
│                     ✔ GEÇTİ                               │
│  [██████████████████████│░░░░░░░░░░░]                     │
│   0                    26 (baraj)                 40      │
│                                                           │
│  Süre: 48:32 / 75:00   ·   Ortalama 1:12 / soru           │
├───────────────────────────────────────────────────────────┤
│  BÖLÜM BAZLI                                              │
│  1 Temeller           ██████░░  6/8    ⌐ hedef 8          │
│  2 YGYD Boyunca Test  ████░░    4/6    ⌐ hedef 6          │
│  3 Statik Test        ████      4/4    ⌐ hedef 4          │
│  4 Analiz & Tasarım   █████░░░░ 6/11   ⌐ hedef 11  ⚠      │
│  5 Test Yönetimi      ██████░   7/9    ⌐ hedef 9          │
│  6 Test Araçları      █         1/2    ⌐ hedef 2          │
├───────────────────────────────────────────────────────────┤
│  EN ZAYIF ÖĞRENME HEDEFLERİ                               │
│  FL-4.2.3  Sınır değer analizi          0/3  [Çalış →]    │
│  FL-4.2.1  Eşdeğerlik bölümlemesi       1/3  [Çalış →]    │
│  FL-5.1.4  Test tahminleme teknikleri   1/2  [Çalış →]    │
├───────────────────────────────────────────────────────────┤
│  [Soru soru incele]   [Yanlışlarımı tekrar destesine ekle]│
└───────────────────────────────────────────────────────────┘
```

- Baraj çizgisi **her zaman** çizilir — geçilse de kalınsa da.
- Bölüm çubuklarının arkasında **gerçek sınav ağırlığı hayalet hedef** olarak gösterilir (AWS Skill Builder deseni).
- Kalındıysa üst blok suçlayıcı değil: *"26'ya 4 puan kaldı. En zayıf 3 hedefe odaklan."*
- Faz 3'te **hazırlık tahmini**: *"Son 3 zamanlı denemenin 2'si barajı geçti — sınavı planlayabilirsin."*

### 3.5 İnceleme turu `/exam/:id/review`

Her soru için:
1. Soru metni
2. **Senin cevabın** (yanlışsa kırmızı + ✕ ikonu) ve **doğru cevap** (yeşil + ✓)
3. **Özet gerekçe**
4. **Her şık için "neden" satırı** — bu bizim ana farklılaştırıcımız, gizlenmez, varsayılan açıktır
5. Atıf çipleri: `FL-4.2.1` · `§4.2.1` · `K3` · `v4.0.1`
6. `[Tekrar destesine ekle]` · `[Bu soruda hata var]`

### 3.6 Pratik modu `/practice`

- Bölüm / LO / etiket seçimi, ardından **10 soruluk sabit oturum** (Duolingo deseni — görünür bir sonu olsun)
- Anlık geri bildirim: cevap verilince satır içi gerekçe açılır (modal değil)
- **Yanlış yapılan soru aynı oturumun sonuna yeniden kuyruklanır**
- Kademeli ipucu: `İpucu göster` → `Daha fazla` → `Çözümü göster`
- Oturum sonunda küçük bir özet + "aynı konudan 10 tane daha"

### 3.7 Tekrar (SRS) `/review`

- Ana ekranda **bugün vadesi gelen kart sayısı**
- Kart akışı: soru → cevapla → gerekçe → **Again / Hard / Good / Easy**
- Her düğmenin üzerinde **sonraki aralık** (`Good → 4g`) — algoritmaya güven için
- Aynı LO'ya ait iki soru arka arkaya gelmez
- Tahmin grafiği: önümüzdeki 7 günün yükü

### 3.8 Sözlük `/glossary`

- Arama (TR ve EN aynı anda), harf filtresi, bölüm filtresi
- Terim kartı: **EN terim + TR terim yan yana**, tanım, kullanıldığı müfredat, kaynak bağlantısı
- ⚠️ Türkçe tanımın kaynağı her kartta belirtilir (TTB müfredatı / TTB sözlüğü v3.7 / editoryal çeviri)
- `Bu terimden soru çöz →`

### 3.9 Müfredat gezgini `/syllabus`

64 öğrenme hedefinin ağaç görünümü. Her LO satırında: kod · K-seviyesi · TR/EN metin · **senin doğruluk oranın** · soru sayısı · `[Çalış]`.
LeetCode problem listesi deseni — filtrelenebilir, sıralanabilir, durum sütunlu.

---

## 4. Bileşen spesifikasyonu — `QuestionCard`

```
┌─────────────────────────────────────────────────────────┐
│ Bölüm 4 · FL-4.2.1 · K3 · v4.0.1              [⚑] [TR|EN]│  ← meta şeridi
├─────────────────────────────────────────────────────────┤
│ Soru metni (max 65ch)                                    │
│                                                          │
│ [opsiyonel medya: karar tablosu / durum diyagramı]       │
├─────────────────────────────────────────────────────────┤
│ 1 ◯ Şık A          ← tam genişlik tıklama hedefi         │
│ 2 ◉ Şık B                                                │
│ 3 ◯ Şık C                                                │
│ 4 ◯ Şık D                                                │
└─────────────────────────────────────────────────────────┘
```

**Yan yana mod (`sideBySide`)**: geniş ekranda iki sütun (TR | EN), dar ekranda üst üste, aralarında ince ayraç. Şık seçimi tek bir mantıksal şıka bağlıdır — iki sütun aynı radio grubudur.

**Cevap sonrası (pratik/inceleme)**: seçilen şık ve doğru şık işaretlenir; altında `RationalePanel` açılır — özet + her şık için "neden" satırı + atıf çipleri.

---

## 5. Klavye kısayolları

| Tuş | Eylem |
|---|---|
| `1` – `9` | Şık seç (multi'de aç/kapa) |
| `Enter` / `Space` | Cevapla / sonraki |
| `→` / `←` | Sonraki / önceki soru |
| `F` | İşaretle (flag) |
| `L` | Dil değiştir (TR ↔ EN) |
| `N` | Soru gezginini aç |
| `T` | Zamanlayıcıyı gizle/göster |
| `R` | Gerekçeyi aç/kapa (yalnızca pratik/inceleme) |
| `1`–`4` (SRS) | Again / Hard / Good / Easy |
| `?` | Kısayol yardımı |
| `Esc` | Panel/modal kapat |

`?` ile açılan overlay ilk ziyarette bir kez kendiliğinden gösterilir, bir daha gösterilmez.

---

## 6. Hareket ve geri bildirim

- Geçişler 150–200 ms, `ease-out`. Sınav akışında animasyon **minimum** — hız algısı > cila.
- Doğru cevapta kısa, sessiz bir onay (ölçek 1.0 → 1.02). Konfeti yok.
- Yanlış cevapta **titreme/sarsıntı yok** — cezalandırıcı hisseder.
- `prefers-reduced-motion: reduce` → tüm geçişler kapanır.
- Ses yok (varsayılan). Kütüphane bile eklenmez.

---

## 7. Boş ve hata durumları

| Durum | Ne gösterilir |
|---|---|
| Hiç deneme yapılmamış | "Nereden başlamalı?" kartı + 3 adımlı öneri (Pratik → Deneme → Zayıf hedefler) |
| Bir LO için soru yok | Müfredat gezgininde "Bu hedef için henüz soru yok — katkıda bulun" bağlantısı |
| Deneme havuzu yetersiz | Kurulum ekranında **açık uyarı** ve kaç soruluk üretileceği. Sessizce eksik üretmek yasak. |
| Ağ hatası (parça inen) | "Sorular yüklenemedi" + yeniden dene; çevrimdışıysa önbellekteki parçalarla devam önerisi |
| Veri sürümü değişti | Sessiz güncelleme; yalnızca bir soru değiştiyse SRS kartı bilgilendirmesi |
| Yarım kalmış deneme | Ana sayfada üstte şerit: "47:12 kalan bir denemen var — [Devam et] [Sil]" |

---

## 8. Erişilebilirlik kontrol listesi

- [ ] Tüm etkileşimli öğeler `Tab` ile erişilebilir, odak halkası görünür
- [ ] Şık grupları `role="radiogroup"` / `role="group"` + `aria-labelledby`
- [ ] Zamanlayıcı `aria-live="polite"`, **dakika başı** duyurur
- [ ] Doğru/yanlış renk + ikon + metin (üçü birden)
- [ ] Kontrast ≥ 4.5:1 (metin), ≥ 3:1 (UI bileşeni) — her iki temada
- [ ] Medya bileşenleri gerçek `<table>` ile render edilir (görsel değil)
- [ ] `state-transition` diyagramı için metin alternatifi (geçiş listesi) her zaman mevcut
- [ ] Modal/sheet odak tuzağı ve `Esc` ile kapanma
- [ ] Sayfa başlığı rota değişince güncellenir
- [ ] `lang` özniteliği içerik diline göre ayarlanır (`lang="tr"` / `lang="en"`) — yan yana modda her sütun ayrı
- [ ] `prefers-reduced-motion` desteklenir
- [ ] 200% yakınlaştırmada yatay kaydırma yok

---

## 9. Marka ve ton

- **Ton:** Sakin, teknik, gereksiz neşesiz. Ünlem az. Emoji yalnızca ikon yerine (🔥 seri, ⚑ işaret).
- **Türkçe dili:** Sen-dili ("Çözdün", "Zayıf olduğun hedefler"). Resmî ISTQB terimleri TTB müfredatındaki hâliyle, ilk geçişte parantez içinde İngilizcesiyle.
- **Kaçınılacak:** "Harika!", "Muhteşem!", oyunlaştırma dili, sahte aciliyet, "%99 başarı garantisi" tarzı iddialar.
- **Logo/isim:** **ISTQB-PREP** (D-01). Wordmark yeterli; illüstrasyon gerekmiyor. ISTQB logosu, renkleri veya tipografisi **kullanılmaz** — isim zaten markaya yakın olduğu için görsel kimliğin ISTQB'den açıkça ayrışması gerekir.
