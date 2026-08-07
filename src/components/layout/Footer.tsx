export default function Footer() {
  return (
    <footer className="mt-[140px] bg-[#f4f3f1] px-7 pb-7 pt-[72px] text-[#191919] max-sm:mt-[90px] max-sm:px-[14px] max-sm:pb-5 max-sm:pt-[50px]">
      <div className="text-[24px] font-semibold tracking-[-0.06em]">atelier</div>
      <div className="mt-[90px] grid grid-cols-[2fr_1fr_1fr] gap-[30px] max-sm:mt-[55px] max-sm:grid-cols-2">
        <div className="max-sm:col-span-2"><h3 className="mb-[15px] text-[9px] tracking-[0.14em] text-[#777]">CONTACT</h3><p className="mb-1.5 text-[10px]">hello@example.com</p><p className="mb-1.5 text-[10px]">MON - FRI 10:00 - 17:00</p></div>
        <div><h3 className="mb-[15px] text-[9px] tracking-[0.14em] text-[#777]">INFO</h3><a href="#" className="mb-1.5 block text-[10px] no-underline">PRIVACY POLICY</a><a href="#" className="mb-1.5 block text-[10px] no-underline">TERMS OF USE</a><a href="#" className="mb-1.5 block text-[10px] no-underline">CUSTOMER CENTER</a></div>
        <div><h3 className="mb-[15px] text-[9px] tracking-[0.14em] text-[#777]">FOLLOW</h3><a href="#" className="mb-1.5 block text-[10px] no-underline">INSTAGRAM</a><a href="#" className="mb-1.5 block text-[10px] no-underline">YOUTUBE</a></div>
      </div>
      <div className="mt-20 border-t border-[#d4d1ce] pt-4 text-[8px] text-[#888]">© 2026 ATELIER. ALL RIGHTS RESERVED.</div>
    </footer>
  );
}
