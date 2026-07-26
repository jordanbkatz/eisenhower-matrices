import { Link } from 'react-router-dom';
import { FaLinkedin, FaEnvelope, FaPhoneAlt } from 'react-icons/fa';
import siteData from '../siteData.js';

export default function Footer() {
  return (
    <footer className="bg-navy-deep text-white/85">
      <div className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-12">
        <div>
          <h3 className="font-display text-2xl text-white mb-3">J M Rubin Consulting</h3>
          <p className="text-sm leading-relaxed text-white/65 max-w-xs">
            Arbitration, mediation, expert witness and consulting services with 40+ years
            of insurance, reinsurance, and commercial litigation experience.
          </p>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-[0.18em] text-gold mb-4">Contact</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-3"><FaPhoneAlt className="text-gold" /> {siteData.contactInfo.phoneNumber}</li>
            <li className="flex items-center gap-3"><FaEnvelope className="text-gold" /> {siteData.contactInfo.email}</li>
            <li className="text-white/65 pt-1">{siteData.location.address}</li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-[0.18em] text-gold mb-4">Connect</h4>
          <div className="flex gap-3">
            {siteData.socials.map((s) => (
              <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
                 className="w-10 h-10 rounded-full border border-white/20 hover:border-gold hover:text-gold flex items-center justify-center transition-colors">
                <FaLinkedin />
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between gap-3 text-xs text-white/55">
          <p>© {new Date().getFullYear()} J M Rubin Consulting. All rights reserved.</p>
          <Link to="/privacypolicy" className="hover:text-gold">Privacy Policy</Link>
        </div>
      </div>
    </footer>
  );
}
