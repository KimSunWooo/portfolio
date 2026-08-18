import Header from "../../../components/header/Header";
import Footer from "../../../components/layout/Footer";
import {
  fetchProject,
  fetchProjectMedia,
} from "../../../lib/api";
import ProjectDetail from "./ProjectDetail";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [project, media] = await Promise.all([
    fetchProject(id),
    fetchProjectMedia(Number(id)),
  ]);

  return (
    <>
      <Header />

      <ProjectDetail
        project={project}
        media={media}
      />

      <Footer />
    </>
  );
}