import Button from "../common/Button";

export default function Hero() {
  return (
    <section className="pt-[76px] max-sm:pt-[62px]">
      <div className="relative min-h-[min(720px,calc(100vh-76px))] overflow-hidden bg-[linear-gradient(115deg,#e8e3df_0%,#d6cdc6_48%,#b6aaa1_100%)] max-sm:min-h-[680px]">
        <div className="absolute right-[11%] top-[15%] h-[36vw] w-[36vw] min-h-[260px] min-w-[260px] rounded-full bg-[radial-gradient(circle_at_35%_30%,#f5eee9,#bcaea4_60%,#897d75)] shadow-[0_35px_90px_rgba(60,45,35,0.16)] max-sm:right-[-8%] max-sm:h-[72vw] max-sm:w-[72vw]" />
        <div className="absolute bottom-[clamp(42px,9vw,105px)] left-[clamp(28px,6vw,90px)] text-[#181512]">
          <span className="text-[10px] tracking-[0.16em]">NEW COLLECTION</span>
          <h1 className="my-4 text-[clamp(50px,7vw,100px)] font-normal leading-[0.86] tracking-[-0.07em]">Quiet<br />Objects</h1>
          <p className="mb-6 text-[13px] leading-[1.65]">Subtle color, soft texture,<br />and a considered daily ritual.</p>
          <Button variant="outline" icon="arrow">SHOP NOW</Button>
        </div>
      </div>
    </section>
  );
}
