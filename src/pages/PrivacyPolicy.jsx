import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-bg text-ink">
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 pt-32 pb-24">
        <h1 className="font-display text-4xl md:text-5xl text-navy-deep mb-6">Privacy Policy</h1>
        <p className="text-muted leading-relaxed mb-4">
          J M Rubin Consulting respects your privacy. This site does not collect personal
          information unless you voluntarily provide it through the contact form. Information
          submitted is used solely to respond to your inquiry and is never sold or shared.
        </p>
        <p className="text-muted leading-relaxed mb-8">
          For questions about this policy, please contact jmrubin1@outlook.com.
        </p>
        <Link to="/" className="text-navy hover:text-gold underline underline-offset-4">← Back to home</Link>
      </main>
      <Footer />
    </div>
  );
}
