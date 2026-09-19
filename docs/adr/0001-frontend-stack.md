# ADR-0001 — Frontend stack: Vite + React + TypeScript

**Durum:** Kabul edildi · **Tarih:** 19.09.2026

## Bağlam
Ürün, GitHub Pages üzerinde ücretsiz barındırılacak statik bir web uygulaması. Backend yok, sunucu maliyeti sıfır olmalı. Geliştirici React/Next.js ekosistemine hakim. Performans bütçesi dar (JS < 200 KB gzip), erişilebilirlik hedefi WCAG 2.1 AA.

## Değerlendirilen seçenekler

| Seçenek | Artı | Eksi |
|---|---|---|
| **Vite + React + TS** | En hızlı DX; saf statik çıktı; `base` ile alt yol desteği; ekosistem tam | Yönlendirme için Pages hilesi gerekir |
| Next.js (`output: export`) | Geliştiricinin ana stack'i; dosya tabanlı yönlendirme | SSR/ISR/RSC'nin hiçbirinden faydalanamayız; statik export'ta kısıtlar; daha büyük bundle; gereksiz karmaşıklık |
| Astro + React islands | En iyi Lighthouse; içerik sayfaları statik | Uygulamanın %90'ı interaktif (sınav motoru); island modeli burada avantaj sağlamaz; ekip aşinalığı düşük |
| SvelteKit | Küçük bundle | Ekosistem ve aşinalık düşük; shadcn/Radix dengi olgunluk yok |

## Karar
**Vite 6 + React 19 + TypeScript 5.**

Tamamlayıcılar:
- **Tailwind CSS v4** — token'lar CSS değişkeni, karanlık mod bedava
- **shadcn/ui (Radix)** — kaynak kod kopyalanır, bağımlılık şişmesi yok, erişilebilirlik hazır
- **Zustand** — oturum durumu
- **React Router v7** — 404.html hilesiyle temiz URL (bkz. [`../05-teknik-mimari.md §6`](../05-teknik-mimari.md))

## Gerekçe
Uygulamanın kalbi bir sınav motoru — yani tamamen istemci tarafı, interaktif ve durum ağırlıklı. SSR'ın sunabileceği hiçbir şey yok. Next.js'in statik export modu, kullanılmayacak bir çerçevenin ağırlığını taşımak demek. Astro'nun island avantajı, sayfanın tamamı interaktif olduğunda kaybolur.

## Sonuçlar
- **+** Sıfır sunucu maliyeti, tek komutla derleme
- **+** Bundle kontrolü kolay; rota bazlı `React.lazy` yeterli
- **−** SPA yönlendirme için Pages'e özgü çözüm gerekir (404.html)
- **−** SEO için sayfa bazlı statik HTML üretilmez; `/syllabus` gibi içerik sayfaları organik trafiğe yeterince açık olmayabilir → gerekirse ileride bu sayfalar için build-time prerender eklenir
