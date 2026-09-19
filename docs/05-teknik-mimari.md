# 05 — Teknik Mimari

**Sürüm:** 1.0 · **Tarih:** 19.09.2026
**İlgili ADR'ler:** [`0001-frontend-stack`](adr/0001-frontend-stack.md) · [`0002-veri-katmani-statik-json`](adr/0002-veri-katmani-statik-json.md) · [`0003-istemci-tarafi-depolama`](adr/0003-istemci-tarafi-depolama.md)

---

## 1. Yüksek seviye

```
┌──────────────────────── Tarayıcı ────────────────────────┐
│                                                           │
│  React SPA (Vite build)                                   │
│  ├── UI katmanı        shadcn/ui + Tailwind v4            │
│  ├── Durum             Zustand (oturum) + Dexie (kalıcı)  │
│  ├── Veri erişimi      contentClient (fetch + cache)      │
│  ├── Sınav motoru      blueprint → üretim → puanlama      │
│  ├── SRS motoru        ts-fsrs                            │
│  └── i18n              i18next (arayüz) + içerik dili     │
│                                                           │
│  IndexedDB   attempts · responses · srsCards · bookmarks  │
│  Cache API   (PWA) soru parçaları, manifest               │
└───────────────────────────┬───────────────────────────────┘
                            │ statik GET
                            ▼
              GitHub Pages (CDN, sunucu kodu yok)
              /index.html  /assets/*  /data/**.json
```

**Backend yok. API yok. Veritabanı yok.** Tüm hesaplama istemcide.

---

## 2. Teknoloji seçimleri

| Katman | Seçim | Gerekçe |
|---|---|---|
| Derleme | **Vite 6** | En hızlı DX, statik çıktı, `base` ayarıyla GitHub Pages alt yolu sorunsuz |
| UI | **React 19 + TypeScript 5** | Ekosistem, tip güvenliği; veri modeli tiplerinden sözleşme üretilebilir |
| Stil | **Tailwind CSS v4** | Tasarım token'ları CSS değişkeni olarak; karanlık mod bedava |
| Bileşen | **shadcn/ui** (Radix tabanlı) | Kopyalanan kaynak kod → bağımlılık şişmesi yok; Radix ile erişilebilirlik hazır |
| Yönlendirme | **React Router v7** (`createHashRouter` **veya** 404.html hilesi) | GitHub Pages'te sunucu yönlendirmesi yok — bkz. §6 |
| Oturum durumu | **Zustand** | Küçük, boilerplate'siz; sınav oturumu için ideal |
| Kalıcılık | **Dexie 4 (IndexedDB)** | localStorage kotası yetersiz; sorgulanabilir; migrasyon desteği |
| SRS | **ts-fsrs** | FSRS-5 uygulaması; Anki'nin kullandığı algoritma |
| i18n | **i18next + react-i18next** | Arayüz dili; içerik dili ayrı yönetilir |
| Grafik | **Recharts** (veya hafifse elle SVG) | Sonuç kırılımı ve ilerleme eğilimi |
| PWA | **vite-plugin-pwa** (Workbox) | Faz 3; soru parçaları için `StaleWhileRevalidate` |
| Doğrulama | **Ajv** + JSON Schema | CI'da veri doğrulama; runtime'da dev modda |
| Test | **Vitest** + **Testing Library** + **Playwright** | Birim + bileşen + uçtan uca |
| Kalite | ESLint + Prettier + `tsc --noEmit` | CI kapısı |

### Bilinçli olarak kullanılmayanlar
- **Next.js** — SSR/ISR'den faydalanamayacağız (statik export zaten Vite'ın doğal çıktısı); gereksiz karmaşıklık.
- **Redux / TanStack Query** — sunucu durumu yok; aşırı mühendislik.
- **Bir CMS** — içerik Git'te; PR ile gözden geçirilir, CI ile doğrulanır. Bu bizim kalite kapımız.
- **Yapay zekâ ile runtime soru üretimi** — kalite ve telif riski; bkz. [`07-icerik-uretim-rehberi.md`](07-icerik-uretim-rehberi.md).

---

## 3. Klasör yapısı

```
istqb-prep/
├── public/
│   └── data/                    # data/ buraya kopyalanır veya symlink
├── data/                        # Kaynak veri (Git'te gözden geçirilen)
├── schemas/                     # JSON Schema tanımları
├── scripts/
│   ├── validate-data.ts         # CI doğrulayıcı
│   ├── build-index.ts           # Parçalardan index.json üretir
│   ├── fetch-glossary.ts        # ISTQB Glossary API → glossary/
│   └── stats.ts                 # Kapsama raporu (LO başına soru sayısı)
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── routes/
│   │   ├── Home.tsx
│   │   ├── ExamSetup.tsx
│   │   ├── ExamSession.tsx
│   │   ├── ExamResult.tsx
│   │   ├── Practice.tsx
│   │   ├── Review.tsx           # SRS
│   │   ├── Glossary.tsx
│   │   ├── Progress.tsx
│   │   └── Syllabus.tsx         # LO gezgini
│   ├── features/
│   │   ├── exam/                # motor: üretim, puanlama, zamanlayıcı
│   │   ├── practice/
│   │   ├── srs/
│   │   ├── glossary/
│   │   └── progress/
│   ├── components/
│   │   ├── ui/                  # shadcn
│   │   ├── QuestionCard.tsx
│   │   ├── OptionList.tsx
│   │   ├── RationalePanel.tsx
│   │   ├── QuestionNavigator.tsx
│   │   ├── ExamTimer.tsx
│   │   ├── MediaRenderer/       # decision-table, state-transition, ...
│   │   ├── ScoreBar.tsx
│   │   └── LangToggle.tsx
│   ├── lib/
│   │   ├── content/             # contentClient, chunk cache
│   │   ├── db/                  # Dexie şeması + migrasyonlar
│   │   ├── i18n/
│   │   └── utils/
│   ├── types/                   # Veri modeli tipleri (schemas'tan üretilir)
│   └── styles/
├── e2e/                         # Playwright
├── docs/
└── .github/workflows/
    ├── ci.yml                   # lint + tsc + test + validate:data
    └── deploy.yml               # GitHub Pages
```

---

## 4. İçerik erişim katmanı (`contentClient`)

Tek sorumluluğu: **"bu soru ID'lerini bana ver"** ve bunu mümkün olan en az ağ trafiğiyle yapmak.

```ts
interface ContentClient {
  getManifest(): Promise<Manifest>                      // 1 kez, cache
  getMeta(certId: string): Promise<CertMeta>
  getSyllabus(certId: string): Promise<Syllabus>
  getObjectives(certId: string): Promise<Objective[]>
  getBlueprint(certId: string): Promise<ExamBlueprint>
  getIndex(certId: string): Promise<QuestionIndex>      // hafif, tüm sorular
  getQuestions(certId: string, ids: string[]): Promise<Question[]>  // parça bazlı
}
```

**`getQuestions` davranışı:**
1. `index.json`'dan her ID'nin hangi parçada olduğu bulunur
2. Gerekli parçalar **tekilleştirilir** ve paralel `fetch` edilir
3. Parçalar bellekte (`Map`) ve Cache API'de tutulur
4. 40 soruluk bir deneme tipik olarak 4–6 parça indirir (~250 KB), tüm havuzu değil

**Önbellek geçersizleştirme:** `manifest.dataVersion` değiştiğinde parça önbelleği temizlenir.

---

## 5. Sınav motoru

```ts
// features/exam/generate.ts
export function generateExam(
  blueprint: ExamBlueprint,
  index: QuestionIndex,
  history: UserHistory,
  opts: { smartWeighting: boolean; excludeRecent: boolean }
): GeneratedExam   // { questionIds, warnings[] }

// features/exam/score.ts
export function scoreExam(exam, answers): ExamResult
// ExamResult: { score, passed, chapterBreakdown, objectiveBreakdown, perQuestion[] }
```

**Puanlama kuralları (resmî):**
- Her soru **1 puan**, kısmi puan **yok**
- `multi` soruda tüm doğru şıkların seçilmesi ve fazladan şık seçilmemesi gerekir
- Baraj `meta.exam.passPoints` (26) — sabit kodlanmaz
- Negatif puanlama **uygulanmaz** ve UI'da "yok" diye de **iddia edilmez**

**Zamanlayıcı:** `requestAnimationFrame` değil, `Date.now()` farkı üzerinden — sekme arka plana alındığında kaymasın. Her 5 saniyede bir IndexedDB'ye yazılır → sayfa kapansa bile deneme kurtarılır.

---

## 6. GitHub Pages dağıtımı

### Yol (base) sorunu
Repo `kullanici.github.io/istqb-prep` altındaysa `vite.config.ts`:

```ts
export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/istqb-prep/' : '/',
})
```
Özel alan adı alınırsa `base: '/'` olur.

### SPA yönlendirme
GitHub Pages sunucu tarafı rewrite yapmaz. İki seçenek:

| Seçenek | Artı | Eksi |
|---|---|---|
| **A. HashRouter** (`/#/exam/123`) | Sıfır hile, %100 çalışır | URL çirkin, SEO zayıf |
| **B. `404.html` → `index.html` kopyası + `history.replaceState`** | Temiz URL, SEO iyi | İlk yüklemede bir yönlendirme sıçraması |

> **Karar: B.** SEO bizim için önemli — "ISTQB deneme sınavı" araması organik trafiğin ana kanalı. Build sonrası `dist/index.html` → `dist/404.html` kopyalanır ve `index.html`'e küçük bir yol kurtarma scripti eklenir.

### `.nojekyll`
`dist/.nojekyll` dosyası eklenir; aksi hâlde Jekyll `_` ile başlayan dosyaları yok sayar.

### Workflow

```yaml
# .github/workflows/deploy.yml (özet)
on: { push: { branches: [main] } }
permissions: { contents: read, pages: write, id-token: write }
jobs:
  build:
    steps:
      - checkout
      - setup-node (20)
      - npm ci
      - npm run validate:data     # veri bozuksa deploy YOK
      - npm run build
      - cp dist/index.html dist/404.html
      - touch dist/.nojekyll
      - upload-pages-artifact (dist)
  deploy:
    needs: build
    uses: actions/deploy-pages@v4
```

---

## 7. Performans bütçesi

| Metrik | Bütçe | Nasıl |
|---|---|---|
| JS bundle (gzip) | < 200 KB | Rota bazlı `React.lazy`; Recharts yalnızca sonuç ekranında |
| İlk veri isteği | < 60 KB | Yalnızca `manifest` + `meta` + `index` (index büyürse bölünür) |
| Deneme başlatma | < 300 KB | 4–6 parça |
| LCP (3G Fast) | < 1,5 s | Kritik CSS satır içi; font `display: swap` |
| Soru geçişi | < 100 ms | Sorular bellekte; render dışı iş yok |
| Lighthouse | ≥ 95 (4 kategori) | CI'da `lhci` ile ölçülür |

---

## 8. Test stratejisi

| Seviye | Araç | Kapsam |
|---|---|---|
| **Veri** | Ajv + özel kurallar | §6 [`04-veri-modeli.md`](04-veri-modeli.md) — 13 kontrol |
| **Birim** | Vitest | Deneme üretimi (dağılımın 8/6/4/11/9/2 ve 8/24/8 olduğu), puanlama (multi-select tam eşleşme), FSRS entegrasyonu, zamanlayıcı kayması |
| **Bileşen** | Testing Library | QuestionCard klavye etkileşimi, dil değişince cevabın korunması, gerekçe panelinin her şıkkı göstermesi |
| **E2E** | Playwright | Tam deneme akışı; süre dolunca otomatik teslim; sayfa yenilendiğinde denemenin kurtarılması; karanlık mod; TR/EN geçişi |
| **Erişilebilirlik** | `@axe-core/playwright` | Her ana rotada sıfır kritik ihlal |
| **Görsel** | Playwright snapshot | QuestionCard, sonuç ekranı — açık ve koyu tema |

> Bu bir **test sertifikası** projesi. Test disiplini burada ürünün kendisinin bir parçası; README'de test kapsamı rozeti gösterilecek.

---

## 9. Gözlemlenebilirlik ve gizlilik

- **Analitik:** Çerezsiz, kişisel veri toplamayan bir sayaç (self-hosted Umami veya GoatCounter). Yalnızca sayfa görüntüleme ve olay sayıları.
- **Toplanmayacaklar:** IP eşleme, parmak izi, kullanıcı ilerlemesi, cevaplar.
- **Hata raporlama:** Sentry **kullanılmaz** (üçüncü taraf + gizlilik). Hatalar konsola ve opsiyonel "hata bildir" akışına.
- **Soru hata bildirimi:** GitHub Issue şablonuna önceden doldurulmuş bağlantı açılır (soru ID + sürüm + seçilen şık). Sunucu gerekmez.

---

## 10. Erişilebilirlik gereksinimleri

- Radix primitives → odak tuzağı, ARIA rolleri hazır
- Şıklar `role="radiogroup"` / `role="group"` + `aria-checked`
- Zamanlayıcı `aria-live="polite"`, dakika başı duyurur (saniye başı değil — gürültü)
- Doğru/yanlış **yalnızca renkle değil**: ikon + metin ("Doğru" / "Yanlış")
- Kontrast ≥ 4.5:1, karanlık modda da
- `prefers-reduced-motion` desteklenir
- Tam klavye akışı — bkz. [`06-ui-ux-tasarim.md`](06-ui-ux-tasarim.md) §5
