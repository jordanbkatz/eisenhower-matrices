import siteData from '../../siteData.js';
import aboutImg from '../../assets/images/about/about.webp';

export default function About() {
  return (
    <section id="about" className="py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-[1fr_1.4fr] gap-12 lg:gap-20 items-start">
        <div className="lg:sticky lg:top-28">
          <div className="relative rounded-2xl overflow-hidden border border-line shadow-xl shadow-navy/10 aspect-[4/5]">
            <img src={aboutImg} alt="About Jeffrey M. Rubin" className="w-full h-full object-cover" />
          </div>
        </div>
        <div>
          <span className="text-xs uppercase tracking-[0.22em] text-gold font-semibold">About</span>
          <h2 className="font-display text-4xl md:text-5xl text-navy-deep mt-3 mb-8 leading-tight">
            A senior executive and trial attorney in equal measure
          </h2>
          <div className="space-y-5 text-muted leading-relaxed">
            {siteData.about.content.split(/(?<=\.)\s+/).reduce((acc, sentence, i) => {
              const idx = Math.floor(i / 3);
              acc[idx] = (acc[idx] || '') + sentence + ' ';
              return acc;
            }, []).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
