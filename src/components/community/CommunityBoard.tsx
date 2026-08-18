const posts = [
  { id: 12, category: "NOTICE", title: "Portfolio site renewal notice", date: "2026.08.18", views: 128 },
  { id: 11, category: "NOTICE", title: "Shipping & delivery information", date: "2026.08.12", views: 96 },
  { id: 10, category: "EVENT", title: "New collection launch event", date: "2026.08.05", views: 214 },
  { id: 9, category: "FAQ", title: "Product exchange and return guide", date: "2026.07.28", views: 173 },
  { id: 8, category: "NOTICE", title: "Membership benefit update", date: "2026.07.20", views: 142 },
  { id: 7, category: "FAQ", title: "Payment method FAQ", date: "2026.07.11", views: 88 },
];

export default function CommunityBoard() {
  return (
    <section className="px-7 pb-8 pt-[132px] max-sm:px-[14px] max-sm:pt-[105px]">
      <div className="text-[9px] tracking-[0.08em] text-[#999]">HOME / COMMUNITY / NOTICE</div>
      <div className="mt-[54px] border-b border-[#161616] pb-7 max-sm:mt-[38px]">
        <div className="flex items-end justify-between gap-6">
          <div>
            <h1 className="m-0 text-[34px] font-normal tracking-[-0.05em] max-sm:text-[27px]">COMMUNITY</h1>
            <nav className="mt-7 flex gap-[18px] text-[10px] tracking-[0.06em]">
              <a href="/community" className="text-[#111] no-underline">NOTICE</a>
              <a href="#faq" className="text-[#999] no-underline">FAQ</a>
              <a href="#event" className="text-[#999] no-underline">EVENT</a>
            </nav>
          </div>
          <span className="text-[9px] text-[#777]">{posts.length} POSTS</span>
        </div>
      </div>

      <div className="border-b border-[#ddd]">
        <div className="grid grid-cols-[76px_100px_1fr_110px_70px] border-b border-[#ddd] py-4 text-[9px] tracking-[0.08em] text-[#888] max-md:grid-cols-[56px_82px_1fr_92px] max-md:[&>*:last-child]:hidden max-sm:hidden">
          <span>NO.</span><span>TYPE</span><span>TITLE</span><span>DATE</span><span>VIEW</span>
        </div>
        {posts.map((post) => (
          <a key={post.id} href="#" className="grid grid-cols-[76px_100px_1fr_110px_70px] items-center border-b border-[#e9e9e9] py-[22px] text-[#111] no-underline transition-opacity hover:opacity-50 max-md:grid-cols-[56px_82px_1fr_92px] max-md:[&>*:last-child]:hidden max-sm:block max-sm:py-5">
            <span className="text-[10px] text-[#888] max-sm:hidden">{post.id}</span>
            <span className="text-[9px] tracking-[0.06em] text-[#888] max-sm:mb-2 max-sm:block">{post.category}</span>
            <span className="text-[12px] max-sm:block max-sm:text-[13px]">{post.title}</span>
            <span className="text-[10px] text-[#888] max-sm:mt-2 max-sm:block">{post.date}</span>
            <span className="text-[10px] text-[#888] max-sm:hidden">{post.views}</span>
          </a>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-center gap-5 text-[10px]">
        <button className="text-[#aaa]">PREV</button>
        <button className="border-b border-[#111] pb-1">1</button>
        <button>NEXT</button>
      </div>
    </section>
  );
}
