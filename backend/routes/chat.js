const express = require('express');
const router = express.Router();
const axios = require('axios');
const Dish = require('../models/Dish');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

// Build a compact dish catalog string for the prompt
function buildDishCatalog(dishes, isVeg) {
  // Deduplicate by name, apply veg filter
  const seen = new Set();
  const filtered = dishes.filter(d => {
    if (seen.has(d.name)) return false;
    if (isVeg === true && !d.isVeg) return false;
    if (isVeg === false && d.isVeg) return false;
    seen.add(d.name);
    return true;
  });

  // Group by category
  const byCategory = {};
  filtered.forEach(d => {
    if (!byCategory[d.category]) byCategory[d.category] = [];
    byCategory[d.category].push({
      name: d.name,
      isVeg: d.isVeg,
      price: d.pricePerPlate,
    });
  });

  return Object.entries(byCategory)
    .map(([cat, items]) => {
      const itemList = items.map(i => `    - ${i.name} (${i.isVeg ? 'Veg' : 'Non-Veg'}, ₹${i.price}/plate)`).join('\n');
      return `  ${cat}:\n${itemList}`;
    })
    .join('\n');
}

// Match caterers from all dishes given AI-selected dish names
function matchCaterers(allDishes, selectedNames, plates, city) {
  const byCaterer = {};
  allDishes.forEach(dish => {
    const cId = dish.catererId._id.toString();
    if (!byCaterer[cId]) byCaterer[cId] = { caterer: dish.catererId, dishes: [] };
    byCaterer[cId].dishes.push(dish);
  });

  let results = Object.values(byCaterer).map(({ caterer, dishes }) => {
    const matched = dishes.filter(d => selectedNames.includes(d.name));
    const menuPricePerPlate = matched.reduce((s, d) => s + d.pricePerPlate, 0);
    return {
      caterer: {
        _id: caterer._id,
        businessName: caterer.businessName,
        ownerName: caterer.ownerName,
        city: caterer.city,
        phone: caterer.phone,
        email: caterer.email,
        profileImage: caterer.profileImage,
      },
      matched: matched.map(d => ({
        _id: d._id,
        name: d.name,
        category: d.category,
        pricePerPlate: d.pricePerPlate,
        isVeg: d.isVeg,
      })),
      menuPricePerPlate,
      totalPrice: menuPricePerPlate * plates,
    };
  }).filter(r => r.matched.length > 0);

  if (city) {
    results = results.filter(r =>
      r.caterer.city.toLowerCase().includes(city.toLowerCase())
    );
  }

  return results.sort((a, b) => b.matched.length - a.matched.length).slice(0, 5);
}

// POST /api/chat/suggest
router.post('/suggest', async (req, res) => {
  try {
    const { eventType, isVeg, plates, city } = req.body;

    if (!eventType || plates == null) {
      return res.status(400).json({ message: 'eventType and plates are required.' });
    }

    // Fetch all dishes with caterer info
    const allDishes = await Dish.find({ isAvailable: true }).populate('catererId', 'businessName ownerName city phone email profileImage');

    if (allDishes.length === 0) {
      return res.json({ suggestedNames: [], caterers: [] });
    }

    const dishCatalog = buildDishCatalog(allDishes, isVeg === true ? true : isVeg === false ? false : null);
    const vegLabel = isVeg === true ? 'Pure Vegetarian' : isVeg === false ? 'Non-Vegetarian' : 'Mixed (Veg + Non-Veg)';
    const cityNote = city ? `The event is in ${city}.` : 'The event city is not specified.';

    const systemPrompt = `You are a professional Indian catering menu consultant for CaterConnect India, a platform that connects customers with local caterers.

Your job is to suggest the BEST combination of dishes from the available catalog for a given event. You must:
1. Pick a balanced, authentic Indian menu suited to the occasion
2. Choose dishes that complement each other well (e.g., dal + rice + bread together, not three similar mains)
3. Ensure variety across courses (starters, mains, sides, desserts, beverages)
4. Respect the veg/non-veg preference strictly
5. Choose popular, crowd-pleasing dishes for the occasion
6. Return ONLY a valid JSON array of dish names — no explanation, no markdown, no extra text

Example output format: ["Paneer Tikka", "Dal Makhani", "Jeera Rice", "Naan", "Gulab Jamun", "Masala Chai"]`;

    const userPrompt = `Event: ${eventType}
Preference: ${vegLabel}
Guests: ${plates}
${cityNote}

Available Dishes Catalog:
${dishCatalog}

Based on this event and guest count, suggest the IDEAL combination of dishes from the catalog above.
For ${plates} guests at a ${eventType}, pick appropriate quantities:
- Starters: 2-4 items
- Main Course: 3-5 items
- Breads/Rice: 2-3 items
- Sweets/Desserts: 2-3 items
- Beverages: 1-2 items

Return ONLY a JSON array of the selected dish names exactly as they appear in the catalog.`;

    // Call Groq API
    const groqResponse = await axios.post(
      GROQ_API_URL,
      {
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.4,
        max_tokens: 512,
        response_format: { type: 'json_object' },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    const rawContent = groqResponse.data.choices[0].message.content.trim();

    // Parse JSON — Groq returns json_object so we may get { dishes: [...] } or directly [...]
    let suggestedNames = [];
    try {
      const parsed = JSON.parse(rawContent);
      if (Array.isArray(parsed)) {
        suggestedNames = parsed;
      } else {
        // Find the first array value in the object
        const firstArray = Object.values(parsed).find(v => Array.isArray(v));
        suggestedNames = firstArray || [];
      }
    } catch {
      // Fallback: try to extract array from string
      const match = rawContent.match(/\[[\s\S]*\]/);
      if (match) suggestedNames = JSON.parse(match[0]);
    }

    // Validate: only keep names that actually exist in the DB
    const allDishNames = new Set(allDishes.map(d => d.name));
    suggestedNames = suggestedNames.filter(name => allDishNames.has(name));

    // Match caterers
    const caterers = matchCaterers(allDishes, suggestedNames, plates, city);

    res.json({ suggestedNames, caterers });
  } catch (err) {
    console.error('Groq chat error:', err.response?.data || err.message);
    res.status(500).json({ message: 'AI suggestion failed. Please try again.' });
  }
});

module.exports = router;
