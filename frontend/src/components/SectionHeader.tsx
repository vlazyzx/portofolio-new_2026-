interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  accent: string;
}

export default function SectionHeader({ eyebrow, title, accent }: SectionHeaderProps) {
  return (
    <>
      <div className="ey">{eyebrow}</div>
      <h1 className="stt">
        {title} <span>{accent}</span>
      </h1>
    </>
  );
}