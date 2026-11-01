// 15 real ingredient strings from Indian packaged foods per PRD Section 9 Block 2.

import { parseIngredients } from '../ingredientParser';

describe('Real-world Indian packaged foods ingredient parser test', () => {
  const packs = [
    {
      name: 'Maggi 2-Minute Noodles',
      text: 'Wheat flour (Maida), Palm oil, Salt, Wheat gluten, Mineral (Calcium carbonate), Thickener (508), Acidity regulators (501(i), 500(i)), Humectant (451(i))',
      expectedTopCount: 8,
    },
    {
      name: 'Parle-G Biscuits',
      text: 'Wheat Flour (67%), Sugar, Edible Vegetable Oil (Palm Oil), Invert Sugar Syrup, Raising Agents (503(ii), 500(ii)), Salt, Milk Solids (0.6%), Emulsifier (322), Dough Conditioner (223)',
      expectedTopCount: 9,
    },
    {
      name: 'Lays Magic Masala Chips',
      text: 'Potato (52%), Edible Vegetable Oil (Palmolein), Seasoning (Spices and Condiments, Sugar, Iodised Salt, Maltodextrin, Flavour (Natural and Nature Identical Flavouring Substances), Acidity Regulator (330, 296, 334), Flavour Enhancers (627, 631), Anticaking Agent (551))',
      expectedTopCount: 3,
    },
    {
      name: 'Kurkure Masala Munch',
      text: 'Rice Meal (43.2%), Edible Vegetable Oil (Palmolein), Corn Meal (20%), Gram Meal (3.3%), Spices and Condiments, Iodised Salt, Sugar, Acidity Regulator (330)',
      expectedTopCount: 8,
    },
    {
      name: 'Britannia Bourbon',
      text: 'Refined Wheat Flour (Maida), Sugar (34%), Refined Palm Oil, Cocoa Solids (2.3%), Invert Sugar Syrup, Raising Agents (503(ii), 500(ii)), Iodised Salt, Emulsifier (322)',
      expectedTopCount: 8,
    },
    {
      name: 'Oreo Original Vanilla',
      text: 'Refined Wheat Flour, Sugar, Fractionated Fat, Cocoa Solids (2.3%), Invert Sugar, Leavening Agents (500(ii), 503(ii)), Iodised Salt, Emulsifier (322)',
      expectedTopCount: 8,
    },
    {
      name: 'Haldirams Bhujia',
      text: 'Tepary Beans Flour (Moth Flour) (44%), Edible Vegetable Oil (Cotton Seed, Corn and Palmolein Oil), Bengal Gram Flour (Besan) (12%), Iodised Salt, Red Chilli Powder, Black Pepper, Ginger Powder, Clove, Cardamom, Nutmeg, Bay Leaves',
      expectedTopCount: 11,
    },
    {
      name: 'Coca-Cola',
      text: 'Carbonated Water, Sugar, Acidity Regulator (338), Colour (150d), Flavours (Natural Flavouring Substances), Caffeine',
      expectedTopCount: 6,
    },
    {
      name: 'Thums Up',
      text: 'Carbonated Water, Sugar, Acidity Regulator (338), Colour (150d), Flavours (Natural, Nature-Identical Flavouring Substances), Caffeine',
      expectedTopCount: 6,
    },
    {
      name: 'Amul Butter',
      text: 'Butter, Common Salt, Annatto (Natural Colour)',
      expectedTopCount: 3,
    },
    {
      name: 'Cadbury Dairy Milk',
      text: 'Sugar, Milk Solids (22%), Cocoa Butter, Cocoa Solids, Emulsifiers (442, 476), Flavours (Natural, Nature Identical and Artificial Flavouring Substances)',
      expectedTopCount: 6,
    },
    {
      name: 'Sunfeast Dark Fantasy Choco Fills',
      text: 'Choco Creme (38%) (Sugar, Refined Palm Oil, Cocoa Solids (5.3%), Emulsifier (322)), Refined Wheat Flour (Maida), Hydrogenated Vegetable Oil, Sugar, Invert Syrup, Raising Agents (503(ii), 500(ii)), Iodised Salt',
      expectedTopCount: 7,
    },
    {
      name: 'Kissan Fresh Tomato Ketchup',
      text: 'Water, Tomato Paste (26%), Sugar, Salt, Acidity Regulator (260), Thickening Agents (1422, 415), Preservative (211), Spices and Condiments',
      expectedTopCount: 8,
    },
    {
      name: 'Tropicana 100% Orange Juice',
      text: 'Water, Orange Juice Concentrate (19.6%), Natural Flavours, Vitamin C',
      expectedTopCount: 4,
    },
    {
      name: 'Bikano Aloo Bhujia',
      text: 'Potato Flakes (24%), Edible Vegetable Oil (Palmolein), Gram Flour (18%), Tepary Bean Flour (Moth Flour) (9%), Spices and Condiments, Iodised Salt, Acidity Regulator (330)',
      expectedTopCount: 7,
    },
  ];

  it('correctly parses all 15 real Indian pack ingredient strings', () => {
    let successCount = 0;
    for (const pack of packs) {
      const parsed = parseIngredients(pack.text);
      expect(parsed.length).toBe(pack.expectedTopCount);
      // Validate that each parsed item has non-empty name and normalizedName
      for (const item of parsed) {
        expect(item.name.length).toBeGreaterThan(0);
        expect(item.normalizedName.length).toBeGreaterThan(0);
      }
      successCount++;
    }
    expect(successCount).toBe(15);
  });
});

