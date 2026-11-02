"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ChefHat, Flame, BookOpen, X, Utensils } from "lucide-react";

const RECIPES = [
  {
    id: 1,
    title: "Creamy Moringa Penne Pasta",
    category: "Pasta",
    prepTime: "15 mins",
    cookTime: "12 mins",
    difficulty: "Easy",
    servings: "2-3",
    image: "/images/pasta.png",
    description: "A rich, vibrant pasta dish featuring our Moringa Penne tossed in a garlic herb olive oil sauce with cherry tomatoes and fresh parmesan.",
    ingredients: [
      "200g Moringa Pasta Penne",
      "2 tbsp extra virgin olive oil",
      "3 cloves garlic, minced",
      "1 cup cherry tomatoes, halved",
      "Fresh basil leaves & grated parmesan",
      "Salt & freshly cracked black pepper"
    ],
    instructions: [
      "Boil Moringa Penne in salted water for 7-8 minutes until al dente.",
      "Heat olive oil in a skillet and sauté minced garlic until fragrant.",
      "Add cherry tomatoes and cook gently for 3-4 minutes.",
      "Toss in cooked penne pasta with 2 tbsp reserved pasta water.",
      "Garnish with basil and parmesan cheese. Serve hot!"
    ]
  },
  {
    id: 2,
    title: "Vibrant Beetroot Pasta Primavera",
    category: "Pasta",
    prepTime: "10 mins",
    cookTime: "15 mins",
    difficulty: "Easy",
    servings: "2",
    image: "https://images.unsplash.com/photo-1598720290281-9f26ae6d6f81?q=80&w=1080&auto=format&fit=crop",
    description: "A naturally colorful and sweet beetroot pasta dish loaded with sautéed bell peppers, spinach, and goat cheese.",
    ingredients: [
      "200g Beetroot Pasta Penne",
      "1 tbsp olive oil",
      "1/2 cup diced bell peppers",
      "1 cup baby spinach",
      "Feta or goat cheese for topping"
    ],
    instructions: [
      "Cook Beetroot Penne in boiling water for 8 minutes and drain.",
      "Sauté bell peppers in olive oil until soft.",
      "Add baby spinach until wilted.",
      "Combine pasta, season with pepper, and sprinkle crumbled cheese."
    ]
  },
  {
    id: 3,
    title: "Desi Style Spicy Grain Noodles",
    category: "Noodles",
    prepTime: "10 mins",
    cookTime: "10 mins",
    difficulty: "Medium",
    servings: "2",
    image: "/images/noodles.png",
    description: "Flavor-packed stir-fried noodles tossed with crunchy vegetables, soya sauce, and aromatic green chillies.",
    ingredients: [
      "150g Multi Grain Noodles",
      "1/2 cup shredded cabbage",
      "1/2 cup julienned carrots & capsicum",
      "1 tbsp dark soya sauce & chilli sauce",
      "1 tbsp oil & spring onions"
    ],
    instructions: [
      "Boil noodles for 5 minutes, drain and rinse under cold water with a drop of oil.",
      "Stir-fry vegetables in a hot wok for 2-3 minutes.",
      "Add sauces, noodles, and toss vigorously over high heat.",
      "Garnish with fresh spring onions and serve hot."
    ]
  },
  {
    id: 4,
    title: "Traditional Sweet Quinoa Vermicelli Kheer",
    category: "Vermicelli",
    prepTime: "10 mins",
    cookTime: "20 mins",
    difficulty: "Easy",
    servings: "4",
    image: "/images/vermicelli.png",
    description: "A fragrant traditional sweet dessert made with roasted Quinoa vermicelli, milk, cardamom, and toasted nuts.",
    ingredients: [
      "100g Quinoa Vermicelli",
      "1 liter whole milk",
      "1/2 cup jaggery powder or sugar",
      "1/4 tsp cardamom powder",
      "2 tbsp ghee, cashews & raisins"
    ],
    instructions: [
      "Roast vermicelli in ghee until golden brown.",
      "Bring milk to a boil and simmer roasted vermicelli until soft.",
      "Add cardamom powder and jaggery powder.",
      "Top with fried cashews and raisins. Serve warm or chilled."
    ]
  },
  {
    id: 5,
    title: "Crunchy Oats & Jaggery Parfait",
    category: "Cookies",
    prepTime: "5 mins",
    cookTime: "0 mins",
    difficulty: "Super Easy",
    servings: "1",
    image: "/images/cookies.png",
    description: "A refreshing breakfast layer bowl featuring crushed Oats Nutrigen cookies, Greek yogurt, honey, and fresh berries.",
    ingredients: [
      "4 Choco Oats Nutrigen Cookies, crushed",
      "1 cup Greek yogurt",
      "1 tbsp raw honey",
      "Fresh blueberries or strawberries"
    ],
    instructions: [
      "Layer crushed cookies at the bottom of a glass.",
      "Add a layer of honeyed Greek yogurt.",
      "Top with fresh berries and additional cookie crumbles."
    ]
  }
];

export default function RecipesPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedRecipe, setSelectedRecipe] = useState<typeof RECIPES[0] | null>(null);

  const categories = ["All", "Pasta", "Noodles", "Vermicelli", "Cookies"];

  const filteredRecipes = RECIPES.filter(
    (r) => activeCategory === "All" || r.category === activeCategory
  );

  return (
    <div className="bg-brand-cream min-h-screen pb-24">
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6 md:px-12 container mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block py-1.5 px-4 rounded-full border border-brand-primary/30 text-brand-dark font-button text-sm mb-4 bg-white/50 backdrop-blur-sm">
            Rooted in Health, Rich in Flavour
          </span>
          <h1 className="font-heading text-5xl md:text-6xl text-brand-dark mb-6">Delicious Recipes</h1>
          <p className="font-sans text-brand-text/80 text-lg max-w-2xl mx-auto leading-relaxed">
            Discover simple, wholesome, and delicious ways to cook with our products for every meal.
          </p>
        </motion.div>
      </section>

      {/* Filter Category Tabs */}
      <section className="container mx-auto px-6 md:px-12 mb-12 flex justify-center">
        <div className="flex flex-wrap items-center justify-center gap-2 bg-white/80 backdrop-blur-sm p-2 rounded-full border border-brand-border">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2.5 rounded-full font-button text-xs uppercase tracking-wider transition-all ${
                activeCategory === cat
                  ? "bg-brand-primary text-white shadow-md"
                  : "text-brand-dark hover:bg-brand-sand"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Recipe Cards Grid */}
      <section className="container mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredRecipes.map((recipe, index) => (
            <motion.div
              key={recipe.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-3xl overflow-hidden shadow-sm border border-brand-border hover:shadow-xl transition-all duration-300 flex flex-col group"
            >
              <div className="relative h-60 bg-brand-sand overflow-hidden">
                <img
                  src={recipe.image}
                  alt={recipe.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-4 left-4 bg-brand-primary text-white font-button text-xs uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
                  {recipe.category}
                </span>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-4 text-xs font-sans text-brand-text/60 mb-3">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-brand-primary" /> {recipe.cookTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <ChefHat className="w-3.5 h-3.5 text-brand-primary" /> {recipe.difficulty}
                    </span>
                    <span className="flex items-center gap-1">
                      <Utensils className="w-3.5 h-3.5 text-brand-primary" /> {recipe.servings} Servings
                    </span>
                  </div>

                  <h3 className="font-heading text-xl font-bold text-brand-dark mb-2 group-hover:text-brand-primary transition-colors">
                    {recipe.title}
                  </h3>
                  <p className="font-sans text-brand-text/80 text-sm leading-relaxed mb-6 line-clamp-2">
                    {recipe.description}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedRecipe(recipe)}
                  className="w-full py-3 rounded-full bg-brand-cream border border-brand-border text-brand-dark font-button text-xs uppercase tracking-wider hover:bg-brand-primary hover:text-white transition-colors flex items-center justify-center gap-2"
                >
                  <BookOpen className="w-4 h-4" /> View Recipe
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Recipe Details Modal */}
      <AnimatePresence>
        {selectedRecipe && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl relative border border-brand-border"
            >
              <button
                onClick={() => setSelectedRecipe(null)}
                className="absolute top-6 right-6 p-2 rounded-full bg-brand-cream hover:bg-brand-sand transition-colors text-brand-dark"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="h-56 rounded-2xl overflow-hidden mb-6 bg-brand-sand">
                <img
                  src={selectedRecipe.image}
                  alt={selectedRecipe.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <span className="text-brand-primary font-button text-xs uppercase tracking-widest block mb-1">
                {selectedRecipe.category} Recipe
              </span>
              <h2 className="font-heading text-3xl font-bold text-brand-dark mb-4">
                {selectedRecipe.title}
              </h2>

              <div className="flex flex-wrap gap-4 text-xs font-sans text-brand-dark mb-6 bg-brand-cream p-4 rounded-xl">
                <span><strong>Prep:</strong> {selectedRecipe.prepTime}</span>
                <span><strong>Cook:</strong> {selectedRecipe.cookTime}</span>
                <span><strong>Difficulty:</strong> {selectedRecipe.difficulty}</span>
                <span><strong>Servings:</strong> {selectedRecipe.servings}</span>
              </div>

              {/* Ingredients */}
              <div className="mb-6">
                <h4 className="font-heading text-xl font-bold text-brand-dark mb-3">Ingredients</h4>
                <ul className="space-y-2 font-sans text-sm text-brand-text">
                  {selectedRecipe.ingredients.map((ing, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0"></span>
                      <span>{ing}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Instructions */}
              <div>
                <h4 className="font-heading text-xl font-bold text-brand-dark mb-3">Instructions</h4>
                <ol className="space-y-3 font-sans text-sm text-brand-text">
                  {selectedRecipe.instructions.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="font-button font-bold text-brand-primary text-sm shrink-0">{i + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
