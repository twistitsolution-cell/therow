import Reveal from './Reveal'

export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = 'center',
  size = 'lg',
  className = '',
}) {
  const alignment =
    align === 'left' ? 'text-left items-start' : align === 'right' ? 'text-right items-end' : 'text-center items-center'

  const titleSize =
    size === 'sm'
      ? 'text-3xl sm:text-4xl'
      : size === 'xl'
        ? 'text-4xl sm:text-6xl lg:text-7xl'
        : 'text-4xl sm:text-5xl lg:text-6xl'

  return (
    <Reveal className={`flex flex-col ${alignment} ${className}`}>
      {eyebrow && (
        <span className="eyebrow mb-4 flex items-center gap-3">
          <span className="h-px w-8 bg-brand" aria-hidden="true" />
          {eyebrow}
          {align === 'center' && <span className="h-px w-8 bg-brand" aria-hidden="true" />}
        </span>
      )}

      <h2 className={`heading-display text-balance ${titleSize}`}>{title}</h2>

      {subtitle && (
        <p
          className={`mt-5 max-w-2xl text-[15px] leading-relaxed text-text-secondary ${
            align === 'center' ? 'mx-auto' : ''
          }`}
        >
          {subtitle}
        </p>
      )}
    </Reveal>
  )
}
