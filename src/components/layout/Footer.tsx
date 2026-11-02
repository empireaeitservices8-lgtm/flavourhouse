import Link from "next/link";
import { MapPin, Phone, Mail } from "lucide-react";

function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function YoutubeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.56 49.56 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <path d="m10 15 5-3-5-3z" />
    </svg>
  );
}

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="bg-[#221c16] text-[#F8F1D8] pt-20 pb-10 border-t border-[#3F3424]">
      <div className="container mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Info */}
          <div className="space-y-6">
            <Link href="/" className="inline-flex">
              <img src="/logo.png" alt="Flavor House Logo" className="h-24 md:h-32 w-auto object-contain opacity-90" />
            </Link>
            <p className="text-[#A17D49] font-sans text-sm leading-relaxed max-w-sm">
              Rooted in Health, Rich in Flavour. Premium food products made with wholesome ingredients and traditional goodness for modern lifestyles.
            </p>
            <div className="flex space-x-3">
              <a
                href="https://www.facebook.com/share/17rmar29kM/?mibextid=wwXIfr"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-10 h-10 rounded-full bg-[#3F3424] flex items-center justify-center hover:bg-brand-primary text-white transition-colors"
              >
                <FacebookIcon className="w-5 h-5" />
              </a>
              <a
                href="https://www.instagram.com/flavorhouse.in?igsh=bGY2aWhpeWM1NHBj&utm_source=qr"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-10 h-10 rounded-full bg-[#3F3424] flex items-center justify-center hover:bg-brand-primary text-white transition-colors"
              >
                <InstagramIcon className="w-5 h-5" />
              </a>
              <a
                href="https://youtube.com/@flavorhousefoods?si=nwsDzLaJsmPDj0rD"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="w-10 h-10 rounded-full bg-[#3F3424] flex items-center justify-center hover:bg-brand-primary text-white transition-colors"
              >
                <YoutubeIcon className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading text-lg text-white mb-6 tracking-wide">Quick Links</h4>
            <ul className="space-y-4 font-sans text-sm text-[#A17D49]">
              <li><Link href="/about" className="hover:text-brand-primary transition-colors">Our Story</Link></li>
              <li><Link href="/products" className="hover:text-brand-primary transition-colors">Shop All Products</Link></li>
              <li><Link href="/combo-offers" className="hover:text-brand-primary transition-colors">Combo Offers</Link></li>
              <li><Link href="/recipes" className="hover:text-brand-primary transition-colors">Recipes</Link></li>
              <li><Link href="/contact" className="hover:text-brand-primary transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-heading text-lg text-white mb-6 tracking-wide">Customer Service</h4>
            <ul className="space-y-4 font-sans text-sm text-[#A17D49]">
              <li><Link href="/contact" className="hover:text-brand-primary transition-colors">Help & Support</Link></li>
              <li><Link href="/contact" className="hover:text-brand-primary transition-colors">Shipping Policy</Link></li>
              <li><Link href="/contact" className="hover:text-brand-primary transition-colors">Returns & Refunds</Link></li>
              <li><Link href="/contact" className="hover:text-brand-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/contact" className="hover:text-brand-primary transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-heading text-lg text-white mb-6 tracking-wide">Contact Us</h4>
            <ul className="space-y-5 font-sans text-sm text-[#A17D49]">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
                <span>11/280 A Medammal Building<br />Ashupathri Padi, Vaniyannur<br />Iringavoor PO, Tirur<br />Malappuram, Kerala – 676103</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-brand-primary shrink-0" />
                <a href="tel:+919446640824" className="hover:text-white transition-colors">+91 94466 40824</a>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-brand-primary shrink-0 mt-1" />
                <div className="flex flex-col gap-1">
                  <a href="mailto:info@flavorhousefoods.com" className="hover:text-white transition-colors">info@flavorhousefoods.com</a>
                  <a href="mailto:sales@flavorhousefoods.com" className="hover:text-white transition-colors">sales@flavorhousefoods.com</a>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[#3F3424] flex flex-col md:flex-row items-center justify-between text-xs font-sans text-[#A17D49] text-center md:text-left gap-4">
          <p>© {new Date().getFullYear()} Flavor House. All Rights Reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 mt-4 md:mt-0 pr-16 md:pr-24">
            <span>Rooted in Health, Rich in Flavour</span>
            <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-brand-primary"></span>
            <span>Crafted for Excellence</span>
          </div>
        </div>
      </div>
    </footer>
  );
}


