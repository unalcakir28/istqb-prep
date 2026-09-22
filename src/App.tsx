import { Suspense, lazy } from "react";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";

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
const PracticeSetup = lazy(() => import("@/routes/PracticeSetup"));
const PracticeSession = lazy(() => import("@/routes/PracticeSession"));
const StudyChapters = lazy(() => import("@/routes/StudyChapters"));
const StudyChapter = lazy(() => import("@/routes/StudyChapter"));
const StudyObjective = lazy(() => import("@/routes/StudyObjective"));
const StudySession = lazy(() => import("@/routes/StudySession"));
const LegacyExamRedirect = lazy(() => import("@/routes/LegacyExamRedirect"));

/**
 * Runs under a GitHub Pages subpath: `base` becomes '/istqb-prep/' at build
 * time, and the router uses the same prefix. Since there's no server-side
 * redirect, the deploy step also copies dist/index.html as 404.html.
 */
const router = createBrowserRouter(
  [
    {
      element: <Layout />,
      errorElement: <RouteError />,
      children: [
        { path: "/", element: <Home /> },
        { path: "/calisma", element: <StudyChapters /> },
        { path: "/calisma/:chapter", element: <StudyChapter /> },
        { path: "/calisma/lo/:loCode", element: <StudyObjective /> },
        { path: "/calisma/lo/:loCode/:attemptId", element: <StudySession /> },
        { path: "/alistirma", element: <PracticeSetup /> },
        { path: "/alistirma/:attemptId", element: <PracticeSession /> },
        { path: "/sinav", element: <ExamSetup /> },
        { path: "/sinav/:attemptId", element: <ExamSession /> },
        { path: "/deneme", element: <Navigate to="/sinav" replace /> },
        { path: "/deneme/:attemptId", element: <LegacyExamRedirect /> },
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
