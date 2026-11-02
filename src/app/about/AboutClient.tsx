"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Heart, Sparkles } from "lucide-react";

interface AboutClientProps {
  acf?: any;
}

export function AboutClient({ acf }: AboutClientProps) {
  const heroBadge = acf?.hero_badge || "Rooted in Health, Rich in Flavour";
  const heroTitle = acf?.hero_title || "Our Story";
  const heroDescription =
    acf?.hero_description ||
    "Discover the passion and commitment behind Flavor House. We are dedicated to providing wholesome food items, crafted with natural ingredients and uncompromising quality.";

  const mainImage =
    typeof acf?.main_content_image === "string" && acf.main_content_image
      ? acf.main_content_image
      : acf?.main_content_image?.url ||
        "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1974&auto=format&fit=crop";

  const promiseBadge = acf?.main_promise_badge || "Our Core Promise";
  const titlePart1 = acf?.main_title_part_1 || "Delivering Quality Items";
  const titlePart2 = acf?.main_title_part_2 || "To Every Person";
  const mainDesc =
    acf?.main_description ||
    "Quality begins at the source. We are deeply committed to giving top quality food items to people everywhere—crafted with traditional care, natural purity, and rich flavours that nourish both body and soul.";

  const val1Title = acf?.value_1_title || "Pure & Unadulterated";
  const val1Desc =
    acf?.value_1_description || "Made with 100% natural ingredients without artificial preservatives.";

  const val2Title = acf?.value_2_title || "Authentic Taste";
  const val2Desc =
    acf?.value_2_description || "Rich flavors and traditional recipes designed for modern lifestyles.";

  const val3Title = acf?.value_3_title || "Health First";
  const val3Desc =
    acf?.value_3_description || "Nourishing products designed to support a balanced and wholesome diet.";

  return (
    <div className="bg-brand-cream min-h-screen">
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 md:px-12 container mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="inline-block py-1.5 px-4 rounded-full border border-brand-primary/30 text-brand-dark font-button text-sm mb-4 bg-white/50 backdrop-blur-sm">
            {heroBadge}
          </span>
          <h1 className="font-heading text-5xl md:text-6xl text-brand-dark mb-6">
            {heroTitle}
          </h1>
          <p className="font-sans text-brand-text/80 text-lg max-w-2xl mx-auto leading-relaxed">
            {heroDescription}
          </p>
        </motion.div>
      </section>

      {/* Main Content Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 md:px-12 grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="h-[500px] rounded-[2rem] overflow-hidden bg-brand-sand shadow-xl relative"
          >
            <img
              src={mainImage}
              className="w-full h-full object-cover"
              alt="Quality organic produce and ingredients"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/30 to-transparent"></div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <span className="font-button text-sm uppercase tracking-widest text-brand-primary mb-3 block">
              {promiseBadge}
            </span>
            <h2 className="font-heading text-4xl md:text-5xl text-brand-dark mb-6 leading-tight">
              {titlePart1} <br />
              <span className="italic font-subheading font-normal">{titlePart2}</span>
            </h2>
            <p className="font-sans text-brand-text/80 text-lg leading-relaxed mb-8">
              {mainDesc}
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-full bg-brand-primary/10 text-brand-primary mt-1">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-brand-dark text-lg">{val1Title}</h4>
                  <p className="font-sans text-brand-text/70 text-sm">{val1Desc}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 rounded-full bg-brand-primary/10 text-brand-primary mt-1">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-brand-dark text-lg">{val2Title}</h4>
                  <p className="font-sans text-brand-text/70 text-sm">{val2Desc}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 rounded-full bg-brand-primary/10 text-brand-primary mt-1">
                  <Heart className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-brand-dark text-lg">{val3Title}</h4>
                  <p className="font-sans text-brand-text/70 text-sm">{val3Desc}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
