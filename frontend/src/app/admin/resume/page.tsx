import Header from "../../../components/header/Header";
import Footer from "../../../components/layout/Footer";
import ResumeAdmin from "../../../components/admin/ResumeAdmin";

export default function ResumeAdminPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-[76px] max-sm:pt-[62px]">
        <ResumeAdmin />
      </main>
      <Footer />
    </>
  );
}
