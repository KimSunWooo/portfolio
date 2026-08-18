import Header from "../../../components/header/Header";
import Footer from "../../../components/layout/Footer";
import CommunityPostView from "../../../components/community/CommunityPostView";

export default async function CommunityPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <>
      <Header />
      <main><CommunityPostView id={id} /></main>
      <Footer />
    </>
  );
}
