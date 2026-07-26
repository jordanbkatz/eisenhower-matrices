import siteData from '../../siteData.js';
import arbitration from '../../assets/images/services/arbitration.webp';
import mediation from '../../assets/images/services/mediation.webp';
import expertwitness from '../../assets/images/services/expertwitness.webp';
import consulting from '../../assets/images/services/consulting.webp';

const imgMap = { arbitration, mediation, expertwitness, consulting };

export default function Services() {
  return (
    <section id="services" className="py-24 md:py-32 bg-surface border-y border-line">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-2xl mb-16">
          <span className="text-xs uppercase tracking-[0.22em] text-gold font-semibold">Practice Areas</span>
          <h2 className="font-display text-4xl md:text-5xl text-navy-deep mt-3 leading-tight">
            Specialized services for complex disputes
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {siteData.services.list.map((s) => (
            <article key={s.name} className="group bg-bg border border-line rounded-2xl p-8 hover:border-navy/30 hover:shadow-xl hover:shadow-navy/5 transition-all duration-300">
              <div className="flex items-start gap-5">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-navy/5 flex-shrink-0 ring-1 ring-line">
                  <img src={imgMap[s.img]} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-2xl text-navy-deep mb-3 group-hover:text-navy transition-colors">{s.name}</h3>
                  <p className="text-sm text-muted leading-relaxed">{s.desc}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
