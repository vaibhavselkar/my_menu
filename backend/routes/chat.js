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
    const allDishes = await Dish.find({ isAvailable: true })
      .populate('catererId', 'businessName ownerName city phone email profileImage')
      .lean();

    if (allDishes.length === 0) {
      return res.json({ suggestedNames: [], caterers: [] });
    }

    const dishCatalog = buildDishCatalog(allDishes, isVeg === true ? true : isVeg === false ? false : null);
    const vegLabel = isVeg === true ? 'Pure Vegetarian' : isVeg === false ? 'Non-Vegetarian' : 'Mixed (Veg + Non-Veg)';
    const cityNote = city ? `The event is in ${city}.` : 'The event city is not specified.';

    const systemPrompt = `You are a professional Indian catering menu consultant for CaterConnect India.
Your job is to suggest the BEST combination of dishes from the provided catalog for a given event.
Rules:
1. Only pick dishes that appear EXACTLY in the catalog — do not invent names
2. Choose a balanced menu: starters, mains, breads/rice, sweets/desserts, beverages
3. Dishes should complement each other (e.g. dal + rice + bread, not three similar curries)
4. Strictly respect veg/non-veg preference
5. Pick crowd-pleasing choices suited to the occasion and scale
6. Respond with ONLY a JSON object in this exact format: {"dishes": ["Dish One", "Dish Two", ...]}
   No explanation, no markdown, no extra keys.`;

    const userPrompt = `Event: ${eventType}
Preference: ${vegLabel}
Guests: ${plates}
${cityNote}

Available Dishes:
${dishCatalog}

Pick the ideal menu for this event. Target:
- Starters: 2-4 items
- Main Course: 3-5 items
- Breads/Rice: 2-3 items
- Sweets/Desserts: 2-3 items
- Beverages: 1-2 items

Respond ONLY with: {"dishes": ["exact name from catalog", ...]}`;

    // Call Groq API
    const groqResponse = await axios.post(
      GROQ_API_URL,
      {
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 600,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const rawContent = groqResponse.data.choices[0].message.content.trim();
    console.log('Groq raw response:', rawContent);

    // Parse JSON — expect {"dishes": [...]}
    let suggestedNames = [];
    try {
      const parsed = JSON.parse(rawContent);
      if (Array.isArray(parsed)) {
        suggestedNames = parsed;
      } else if (parsed.dishes && Array.isArray(parsed.dishes)) {
        suggestedNames = parsed.dishes;
      } else {
        // Find any array value in the object
        const firstArray = Object.values(parsed).find(v => Array.isArray(v));
        suggestedNames = firstArray || [];
      }
    } catch {
      // Fallback: extract array from raw string if model added extra text
      const match = rawContent.match(/\[[\s\S]*?\]/);
      if (match) {
        try { suggestedNames = JSON.parse(match[0]); } catch { suggestedNames = []; }
      }
    }

    // Validate: only keep names that actually exist in the DB
    const allDishNames = new Set(allDishes.map(d => d.name));
    suggestedNames = suggestedNames.filter(name => allDishNames.has(name));

    // Match caterers
    const caterers = matchCaterers(allDishes, suggestedNames, plates, city);

    res.json({ suggestedNames, caterers });
  } catch (err) {
    const detail = err.response?.data || err.message;
    console.error('Groq chat error:', JSON.stringify(detail, null, 2));
    res.status(500).json({
      message: 'AI suggestion failed. Please try again.',
      detail: process.env.NODE_ENV !== 'production' ? detail : undefined,
    });
  }
});

module.exports = router;
