
import { GoogleGenAI, Type } from "@google/genai";
import { FoodCategory, Language } from "../types";

const API_KEY = process.env.API_KEY || "";

export const parseReceipt = async (base64Image: string, lang: Language) => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const targetLang = {
    fr: "Français",
    en: "English",
    ar: "Arabic (العربية)"
  }[lang];

  const prompt = `Analyse ce ticket de caisse et extrais la liste des produits alimentaires achetés. 
  Réponds strictement en langue : ${targetLang}. 
  Pour chaque produit, estime une catégorie technique (FRUITS_VEGGIES, DAIRY, MEAT_FISH, PANTRY, BEVERAGES, FROZEN, OTHER), 
  une durée de conservation en jours, et une quantité numérique.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              category: { 
                type: Type.STRING,
                description: "Technical category name among: FRUITS_VEGGIES, DAIRY, MEAT_FISH, PANTRY, BEVERAGES, FROZEN, OTHER"
              },
              shelfLifeDays: { type: Type.NUMBER },
              quantity: { type: Type.STRING },
              numericQuantity: { type: Type.NUMBER }
            },
            required: ["name", "category", "shelfLifeDays", "numericQuantity"]
          }
        }
      }
    });

    const results = JSON.parse(response.text || "[]");
    return Array.isArray(results) ? results.filter(r => r && typeof r === 'object' && r.name) : [];
  } catch (e) {
    console.error("Error parsing Gemini response", e);
    return [];
  }
};

export const translateIngredients = async (names: string[], targetLang: Language) => {
  if (!names || names.length === 0) return {};
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const targetLangName = {
    fr: "Français",
    en: "English",
    ar: "Arabic (العربية)"
  }[targetLang];

  const prompt = `Translate exactly these food ingredient names into ${targetLangName}. 
  Return a JSON object where keys are the original names and values are the translations.
  Names: ${names.join(', ')}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const results = JSON.parse(response.text || "{}");
    return typeof results === 'object' ? results : {};
  } catch (e) {
    console.error("Translation failed", e);
    return {};
  }
};

export const generateRecipeImage = async (recipeTitle: string) => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `High-quality close up of ${recipeTitle}, gourmet food photography, soft lighting, 4k.` }]
      },
      config: {
        imageConfig: { aspectRatio: "16:9" }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (e) {
    console.error("Image generation failed", e);
    return null;
  }
};

export const suggestRecipes = async (ingredients: string[], lang: Language) => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const targetLanguageName = {
    fr: "Français",
    en: "English",
    ar: "Arabic (العربية)"
  }[lang] || "Français";

  const prompt = `Ton rôle : Chef expert anti-gaspi.
    
    INGRÉDIENTS DISPONIBLES :
    ${ingredients.join(', ')}

    CONSIGNE DE LANGUE CRITIQUE :
    - Tu DOIS répondre exclusivement en langue : ${targetLanguageName}.
    - TOUS les champs du JSON (titre, description, ingrédients, instructions, temps, difficulté) DOIVENT être traduits dans cette langue cible.
    - NE PAS laisser de texte en anglais.
    - Si la langue est l'arabe, écris de droite à gauche avec un vocabulaire riche.

    FORMAT DE SORTIE : Réponds EXCLUSIVEMENT en JSON valide suivant le schéma fourni.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
              instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
              prepTime: { type: Type.STRING },
              difficulty: { type: Type.STRING }
            },
            required: ["title", "description", "ingredients", "instructions", "prepTime", "difficulty"]
          }
        }
      }
    });

    const results = JSON.parse(response.text || "[]");
    return Array.isArray(results) ? results.filter(r => r && r.title) : [];
  } catch (e) {
    console.error("Error parsing recipe response", e);
    return [];
  }
};
