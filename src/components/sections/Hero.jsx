import siteData from '../../siteData.js';
import heroImg from '../../assets/images/hero/hero.webp';
import { FaArrowRight } from 'react-icons/fa';

export default function Hero() {
  return (
    <section id="hero" className="relative pt-32 md:pt-40 pb-20 md:pb-28 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-gradient-to-br from-navy/5 to-gold/5 blur-3xl rounded-full" />
      </div>
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-20 items-center">
        <div className="reveal">
          <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-navy/70 mb-6">
            <span className="w-8 h-px bg-gold" />
            ARIAS-US · ARIAS-UK · FINRA · NFA
          </span>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.05] text-navy-deep mb-6">
            Jeffrey M. Rubin
            <span className="block text-ink/70 font-normal text-2xl sm:text-3xl lg:text-4xl mt-3 italic">
              Arbitrator · Mediator · Expert Witness
            </span>
          </h1>
          <p className="text-lg text-muted leading-relaxed max-w-xl mb-10">
            Four decades of senior-executive and trial experience resolving the most
            significant reinsurance, insurance, and commercial disputes — in the US and the UK.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href={siteData.hero.cta.main.link.url} target="_blank" rel="noopener noreferrer"
               className="group inline-flex items-center gap-2 bg-navy text-white px-6 py-3.5 rounded-full font-medium hover:bg-navy-deep transition-colors">
              ARIAS-US Profile <FaArrowRight className="text-xs group-hover:translate-x-1 transition-transform" />
            </a>
            <a href={siteData.hero.cta.secondary.link.url} target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center gap-2 border border-navy/20 text-navy px-6 py-3.5 rounded-full font-medium hover:border-navy hover:bg-navy/5 transition-colors">
              ARIAS-UK Profile
            </a>
            <a href={siteData.hero.cta.ghost.link.url} target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center gap-2 text-navy px-6 py-3.5 rounded-full font-medium hover:text-gold transition-colors">
              Resume →
            </a>
          </div>
        </div>
        <div className="reveal relative" style={{ animationDelay: '0.15s' }}>
          <div className="absolute -inset-4 bg-gradient-to-br from-gold/20 to-navy/10 rounded-3xl blur-2xl -z-10" />
          <div className="relative rounded-2xl overflow-hidden border border-line shadow-2xl shadow-navy/10 aspect-[4/5]">
            <img src={heroImg} alt="Jeffrey M. Rubin" className="w-full h-full object-cover" />
          </div>
          <div className="absolute -bottom-6 -left-6 bg-surface border border-line rounded-2xl px-6 py-4 shadow-xl hidden sm:block">
            <p className="text-3xl font-display text-navy-deep font-semibold">40+</p>
            <p className="text-xs uppercase tracking-wider text-muted">years experience</p>
          </div>
        </div>
      </div>
    </section>
  );
}
