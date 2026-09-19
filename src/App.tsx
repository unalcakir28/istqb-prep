import { Suspense, lazy } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { Layout } from "@/components/Layout";
import { RouteError } from "@/components/RouteError";
import { Spinner } from "@/components/Spinner";

const Home = lazy(() => import("@/routes/Home"));
const ExamSetup = lazy(() => import("@/routes/ExamSetup"));
const ExamSession = lazy(() => import("@/routes/ExamSession"));
const ExamResult = lazy(() => import("@/routes/ExamResult"));
const Review = lazy(() => import("@/routes/Review"));
const Sources = lazy(() => import("@/routes/Sources"));
const NotFound = lazy(() => import("@/routes/NotFound"));

/**
 * GitHub Pages alt yolunda calisir: `base` build sirasinda '/istqb-prep/'
 * olur ve router ayni onegi kullanir. Sunucu tarafi yonlendirme olmadigi
 * icin deploy adimi dist/index.html'i 404.html olarak da kopyalar.
 */
const router = createBrowserRouter(
  [
    {
      element: <Layout />,
      errorElement: <RouteError />,
      children: [
        { path: "/", element: <Home /> },
        { path: "/deneme", element: <ExamSetup /> },
        { path: "/deneme/:attemptId", element: <ExamSession /> },
        { path: "/sonuc/:attemptId", element: <ExamResult /> },
        { path: "/inceleme/:attemptId", element: <Review /> },
        { path: "/kaynaklar", element: <Sources /> },
        { path: "*", element: <NotFound /> },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL.replace(/\/$/, "") || "/" },
);

export function App() {
  return (
    <Suspense fallback={<Spinner full />}>
      <RouterProvider router={router} />
    </Suspense>
  );
}
