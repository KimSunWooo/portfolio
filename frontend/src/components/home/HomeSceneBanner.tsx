import type { ReactNode } from "react";
import styles from "./HomeSceneBanner.module.css";

type HomeSceneBannerProps = {
  src: string;
  alt: string;
  label: string;
  title: string;
  imageClassName?: string;
  children?: ReactNode;
};

export default function HomeSceneBanner({
  src,
  alt,
  label,
  title,
  imageClassName,
  children,
}: HomeSceneBannerProps) {
  return (
    <div className={styles.root}>
      <div className={styles.media} aria-hidden="true">
        <img
          src={src}
          alt=""
          className={[styles.image, imageClassName ?? ""].join(" ")}
        />
        <div className={styles.shade} />
      </div>
      <div className={styles.content}>
        <div className={styles.copy}>
          <p className={styles.label}>{label}</p>
          <div className={styles.rule} aria-hidden="true" />
          <h2 className={styles.title}>{title}</h2>
          {children}
        </div>
      </div>
      <span className="sr-only">{alt}</span>
    </div>
  );
}
