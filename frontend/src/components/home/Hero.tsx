import Button from "../common/Button";

export default function Hero() {
  return (
    <section className="pt-[76px] max-sm:pt-[62px]">
      <div className="relative min-h-[min(720px,calc(100vh-76px))] overflow-hidden bg-[linear-gradient(115deg,#e8e3df_0%,#d6cdc6_48%,#b6aaa1_100%)] max-sm:min-h-[680px]">
        <div className="absolute right-[8%] top-[9%] h-[44vw] w-[36vw] min-h-[360px] min-w-[290px] rotate-[5deg] rounded-[48%_52%_44%_56%/54%_42%_58%_46%] bg-[radial-gradient(circle_at_35%_30%,#f8f2ef,#cabcb4_54%,#94867d)] shadow-[0_35px_90px_rgba(60,45,35,0.16)] max-sm:right-[-18%] max-sm:top-[12%] max-sm:h-[86vw] max-sm:w-[72vw]" />
        <div className="absolute bottom-[clamp(42px,9vw,105px)] left-[clamp(28px,6vw,90px)] text-[#181512]">
          <span className="text-[10px] tracking-[0.16em]">NEW COLLECTION</span>
          <h1 className="my-4 text-[clamp(50px,7vw,100px)] font-normal leading-[0.86] tracking-[-0.07em]">Quiet<br />Objects</h1>
          <p className="mb-6 text-[13px] leading-[1.65]">Subtle color, soft texture,<br />and a considered daily ritual.</p>
          <a href="/shop" className="no-underline"><Button variant="outline" icon="arrow">SHOP NOW</Button></a>
        </div>
      </div>
    </section>
  );
}
