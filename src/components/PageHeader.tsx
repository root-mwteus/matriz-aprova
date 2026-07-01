interface PageHeaderProps {
  badge: string
  title: string
  subtitle: string
}

export default function PageHeader({ badge, title, subtitle }: PageHeaderProps) {
  return (
    <div className="space-y-1.5">
      <span className="inline-block px-2 py-0.5 rounded-md bg-[#66666620] text-muted border border-[#66666640] text-[10px] font-semibold uppercase font-mono tracking-wider">
        {badge}
      </span>
      <h1 className="text-[28px] font-[800] text-foreground leading-tight">
        {title}
      </h1>
      <p className="text-[14px] text-muted">
        {subtitle}
      </p>
    </div>
  )
}
