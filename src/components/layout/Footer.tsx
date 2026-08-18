export default function Footer() {
  return (
    <footer className="mt-[100px] bg-[#f4f3f1] px-7 pb-7 pt-[72px] text-[#191919] max-sm:mt-[70px] max-sm:px-4 max-sm:pb-5 max-sm:pt-[50px]">
      <div className="text-[22px] font-semibold tracking-[-0.05em]">KIM SUN WOO</div>
      <div className="mt-[70px] grid grid-cols-[2fr_1fr_1fr] gap-[30px] max-sm:mt-[50px] max-sm:grid-cols-2">
        <div className="max-sm:col-span-2">
          <h3 className="mb-[15px] text-[9px] tracking-[0.14em] text-[#777]">PROFILE</h3>
          <p className="mb-1.5 text-[10px]">BACKEND / FULL-STACK DEVELOPER</p>
          <p className="mb-1.5 text-[10px]">JAVA · MYSQL · REACT</p>
        </div>
        <div>
          <h3 className="mb-[15px] text-[9px] tracking-[0.14em] text-[#777]">NAVIGATION</h3>
          <a href="/#experience" className="mb-1.5 block text-[10px] no-underline">EXPERIENCE</a>
          <a href="/#skills" className="mb-1.5 block text-[10px] no-underline">SKILLS</a>
          <a href="/#projects" className="mb-1.5 block text-[10px] no-underline">PROJECTS</a>
        </div>
        <div>
          <h3 className="mb-[15px] text-[9px] tracking-[0.14em] text-[#777]">LINK</h3>
          <a href="https://github.com/KimSunWooo" target="_blank" rel="noreferrer" className="mb-1.5 block text-[10px] no-underline">GITHUB ↗</a>
          <a href="/#contact" className="mb-1.5 block text-[10px] no-underline">CONTACT</a>
        </div>
      </div>
      <div className="mt-20 border-t border-[#d4d1ce] pt-4 text-[8px] text-[#888]">© 2026 KIM SUN WOO. PORTFOLIO.</div>
    </footer>
  );
}
