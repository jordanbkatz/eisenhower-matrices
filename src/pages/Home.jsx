import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import Hero from '../components/sections/Hero.jsx';
import Services from '../components/sections/Services.jsx';
import About from '../components/sections/About.jsx';
import Experience from '../components/sections/Experience.jsx';
import Contact from '../components/sections/Contact.jsx';

export default function Home() {
  return (
    <div className="min-h-screen bg-bg text-ink">
      <Navbar />
      <main>
        <Hero />
        <Services />
        <About />
        <Experience />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
