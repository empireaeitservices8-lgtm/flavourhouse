"use client";

import { motion } from "framer-motion";
import { Leaf, ShieldCheck, Wheat, HeartHandshake } from "lucide-react";

const INDICATORS = [
  {
    icon: Leaf,
    title: "100% Natural",
    description: "Pure ingredients sourced directly from nature",
  },
  {
    icon: ShieldCheck,
    title: "No Preservatives",
    description: "Clean label products with zero artificial additives",
  },
  {
    icon: Wheat,
    title: "Wholesome Nutrition",
    description: "Rich in fiber, protein, and essential minerals",
  },
  {
    icon: HeartHandshake,
    title: "Crafted with Care",
    description: "Authentic recipes crafted with traditional care",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" as const },
  },
};

export function TrustIndicators({ acf }: { acf?: any }) {
  const dynamicIndicators = [
    {
      icon: Leaf,
      image: acf?.trust_indicator_1_image,
      title: acf?.trust_indicator_1_title || "100% Natural",
      description: acf?.trust_indicator_1_description || "Pure ingredients sourced directly from nature",
    },
    {
      icon: ShieldCheck,
      image: acf?.trust_indicator_2_image,
      title: acf?.trust_indicator_2_title || "No Preservatives",
      description: acf?.trust_indicator_2_description || "Clean label products with zero artificial additives",
    },
    {
      icon: Wheat,
      image: acf?.trust_indicator_3_image,
      title: acf?.trust_indicator_3_title || "Wholesome Nutrition",
      description: acf?.trust_indicator_3_description || "Rich in fiber, protein, and essential minerals",
    },
    {
      icon: HeartHandshake,
      image: acf?.trust_indicator_4_image,
      title: acf?.trust_indicator_4_title || "Crafted with Care",
      description: acf?.trust_indicator_4_description || "Authentic recipes crafted with traditional care",
    },
  ];
  return (
    <section className="py-20 bg-white border-b border-brand-border">
      <div className="container mx-auto px-6 md:px-12">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {dynamicIndicators.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                className="flex flex-col items-center text-center p-8 rounded-3xl bg-brand-cream/30 border border-brand-border hover:bg-brand-cream hover:shadow-xl transition-all duration-300 group"
              >
                <div className="w-16 h-16 rounded-full bg-brand-primary/10 flex items-center justify-center mb-6 group-hover:bg-brand-primary group-hover:text-white text-brand-primary transition-colors duration-300 overflow-hidden">
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="w-8 h-8 object-contain" />
                  ) : (
                    <Icon className="w-8 h-8" strokeWidth={1.5} />
                  )}
                </div>
                <h3 className="font-heading text-xl font-bold text-brand-dark mb-3">
                  {item.title}
                </h3>
                <p className="font-sans text-brand-text/80 text-sm">
                  {item.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
