import siteData from '../../siteData.js';

export default function Experience() {
  const items = siteData.products.categories[0].subcategories[0].items;
  return (
    <section id="experience" className="py-24 md:py-32 bg-surface border-y border-line">
      <div className="max-w-5xl mx-auto px-6">
        <div className="mb-16">
          <span className="text-xs uppercase tracking-[0.22em] text-gold font-semibold">Experience</span>
          <h2 className="font-display text-4xl md:text-5xl text-navy-deep mt-3 leading-tight">
            A career of leadership in dispute resolution
          </h2>
        </div>
        <ol className="relative border-l border-line/80 ml-3 space-y-10">
          {items.map((item, i) => (
            <li key={i} className="pl-8 relative">
              <span className="absolute -left-[7px] top-2 w-3 h-3 rounded-full bg-gold ring-4 ring-bg" />
              <p className="text-xs uppercase tracking-wider text-muted mb-1">{item.desc}</p>
              <h3 className="font-display text-xl text-navy-deep leading-snug mb-1">{item.name}</h3>
              <p className="text-sm text-navy/80 italic">{item.value}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
