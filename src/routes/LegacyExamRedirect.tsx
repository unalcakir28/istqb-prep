import { Navigate, useParams } from "react-router-dom";

/**
 * /deneme/:attemptId was the exam session's address before the three modes
 * landed. Users have bookmarks and in-progress attempts on that path, so it
 * keeps working.
 */
export default function LegacyExamRedirect() {
  const { attemptId } = useParams<{ attemptId: string }>();

  return <Navigate to={attemptId ? `/sinav/${attemptId}` : "/sinav"} replace />;
}
