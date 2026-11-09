type HomeMediaPanelProps = {
  src: string;
  alt: string;
  title: string;
  className?: string;
  imageClassName?: string;
};

export default function HomeMediaPanel({
  src,
  alt,
  title,
  className,
  imageClassName,
}: HomeMediaPanelProps) {
  return (
    <figure
      className={[
        "relative isolate overflow-hidden bg-[#242225]",
        className ?? "",
      ].join(" ")}
    >
      <img
        src={src}
        alt={alt}
        className={[
          "absolute inset-0 h-full w-full object-cover",
          imageClassName ?? "",
        ].join(" ")}
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-[46%] bg-gradient-to-t from-black/65 via-black/30 to-transparent"
      />
      <figcaption className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
        <h3 className="break-keep font-[family-name:Pretendard] text-[clamp(28px,4.2vw,41px)] font-medium leading-[1.2] tracking-[-0.04em] text-[#f7f3ea]">
          {title}
        </h3>
      </figcaption>
    </figure>
  );
}
