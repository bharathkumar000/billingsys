import { NextResponse } from 'next/server';

interface BillingItem {
  item_name_en: string;
  item_name_kn: string;
  quantity: number;
  unit: string;
  unit_price: number;
}

// Complete local menu items for fallback parser lookup
const LOCAL_MENU_DATABASE = [
  { name_en: 'Paneer Tikka', name_kn: 'ಪನೀರ್ ಟಿಕ್ಕಾ', price: 220, unit: 'Plate', keywords: ['paneer tikka', 'paneer tika', 'ಟಿಕ್ಕಾ', 'ಪನೀರ್'] },
  { name_en: 'Chicken 65', name_kn: 'ಚಿಕನ್ 65', price: 280, unit: 'Plate', keywords: ['chicken 65', 'chiken 65', 'ಚಿಕನ್ 65'] },
  { name_en: 'Gobi Manchurian', name_kn: 'ಗೋಬಿ ಮಂಚೂರಿಯನ್', price: 180, unit: 'Plate', keywords: ['gobi manchurian', 'gobi', 'ಮಂಚೂರಿಯನ್', 'ಗೋಬಿ'] },
  { name_en: 'Veg Spring Roll', name_kn: 'ವೆಜ್ ಸ್ಪ್ರಿಂಗ್ ರೋಲ್', price: 160, unit: 'Plate', keywords: ['spring roll', 'veg roll', 'ಸ್ಪ್ರಿಂಗ್ ರೋಲ್'] },
  { name_en: 'Masala Papad', name_kn: 'ಮಸಾಲ ಪಾಪಡ್', price: 80, unit: 'Plate', keywords: ['masala papad', 'papad', 'ಪಾಪಡ್', 'ಮಸಾಲ ಪಾಪಡ್'] },
  { name_en: 'Butter Chicken', name_kn: 'ಬಟರ್ ಚಿಕನ್', price: 350, unit: 'Plate', keywords: ['butter chicken', 'ಬಟರ್ ಚಿಕನ್'] },
  { name_en: 'Paneer Butter Masala', name_kn: 'ಪನೀರ್ ಬಟರ್ ಮಸಾಲ', price: 280, unit: 'Plate', keywords: ['paneer butter', 'paneer butter masala', 'ಪನೀರ್ ಬಟರ್'] },
  { name_en: 'Dal Makhani', name_kn: 'ದಾಲ್ ಮಖನಿ', price: 220, unit: 'Bowl', keywords: ['dal makhani', 'dal', 'ದಾಲ್', 'ದಾಲ್ ಮಖನಿ'] },
  { name_en: 'Mutton Rogan Josh', name_kn: 'ಮಟನ್ ರೋಗನ್ ಜೋಶ್', price: 420, unit: 'Plate', keywords: ['mutton rogan', 'rogan josh', 'ಮಟನ್ ರೋಗನ್'] },
  { name_en: 'Aloo Gobi', name_kn: 'ಆಲೂ ಗೋಬಿ', price: 180, unit: 'Plate', keywords: ['aloo gobi', 'aloo', 'ಆಲೂ ಗೋಬಿ'] },
  { name_en: 'Chicken Biryani', name_kn: 'ಚಿಕನ್ ಬಿರಿಯಾನಿ', price: 320, unit: 'Plate', keywords: ['chicken biryani', 'biryani', 'ಬಿರಿಯಾನಿ', 'ಚಿಕನ್ ಬಿರಿಯಾನಿ'] },
  { name_en: 'Mutton Biryani', name_kn: 'ಮಟನ್ ಬಿರಿಯಾನಿ', price: 380, unit: 'Plate', keywords: ['mutton biryani', 'ಮಟನ್ ಬಿರಿಯಾನಿ'] },
  { name_en: 'Veg Biryani', name_kn: 'ವೆಜ್ ಬಿರಿಯಾನಿ', price: 240, unit: 'Plate', keywords: ['veg biryani', 'ವೆಜ್ ಬಿರಿಯಾನಿ'] },
  { name_en: 'Jeera Rice', name_kn: 'ಜೀರಾ ರೈಸ್', price: 140, unit: 'Plate', keywords: ['jeera rice', 'jeera', 'ಜೀರಾ ರೈಸ್', 'ಜೀರಾ'] },
  { name_en: 'Curd Rice', name_kn: 'ಮೊಸರನ್ನ', price: 120, unit: 'Bowl', keywords: ['curd rice', 'curd', 'ಮೊಸರನ್ನ'] },
  { name_en: 'Butter Naan', name_kn: 'ಬಟರ್ ನಾನ್', price: 60, unit: 'Piece', keywords: ['butter naan', 'naan', 'ನಾನ್', 'ಬಟರ್ ನಾನ್'] },
  { name_en: 'Garlic Naan', name_kn: 'ಗಾರ್ಲಿಕ್ ನಾನ್', price: 70, unit: 'Piece', keywords: ['garlic naan', 'ಗಾರ್ಲಿಕ್ ನಾನ್'] },
  { name_en: 'Tandoori Roti', name_kn: 'ತಂದೂರಿ ರೊಟ್ಟಿ', price: 40, unit: 'Piece', keywords: ['tandoori roti', 'roti', 'ರೊಟ್ಟಿ', 'ತಂದೂರಿ'] },
  { name_en: 'Laccha Paratha', name_kn: 'ಲಚ್ಚಾ ಪರಾಠ', price: 60, unit: 'Piece', keywords: ['paratha', 'parota', 'ಪರಾಠ'] },
  { name_en: 'Kulcha', name_kn: 'ಕುಲ್ಚಾ', price: 70, unit: 'Piece', keywords: ['kulcha', 'ಕುಲ್ಚಾ'] },
  { name_en: 'Masala Chai', name_kn: 'ಮಸಾಲ ಚಹಾ', price: 40, unit: 'Cup', keywords: ['masala chai', 'chai', 'tea', 'ಚಹಾ', 'ಟೀ', 'ಮಸಾಲ ಚಹಾ'] },
  { name_en: 'Filter Coffee', name_kn: 'ಫಿಲ್ಟರ್ ಕಾಫಿ', price: 50, unit: 'Cup', keywords: ['filter coffee', 'coffee', 'ಕಾಫಿ', 'ಫಿಲ್ಟರ್ ಕಾಫಿ'] },
  { name_en: 'Fresh Lime Soda', name_kn: 'ಲಿಂಬೆ ಸೋಡಾ', price: 60, unit: 'Glass', keywords: ['lime soda', 'lime juice', 'soda', 'ಲಿಂಬೆ ಸೋಡಾ', 'ಸೋಡಾ'] },
  { name_en: 'Mango Lassi', name_kn: 'ಮಾಂಗೋ ಲಸ್ಸಿ', price: 90, unit: 'Glass', keywords: ['mango lassi', 'lassi', 'ಲಸ್ಸಿ', 'ಮಾಂಗೋ ಲಸ್ಸಿ'] },
  { name_en: 'Buttermilk', name_kn: 'ಮಜ್ಜಿಗೆ', price: 40, unit: 'Glass', keywords: ['buttermilk', 'butter milk', 'ಮಜ್ಜಿಗೆ'] },
  { name_en: 'Gulab Jamun', name_kn: 'ಗುಲಾಬ್ ಜಾಮೂನ್', price: 80, unit: 'Plate', keywords: ['gulab jamun', 'jamun', 'ಜಾಮೂನ್', 'ಗುಲಾಬ್ ಜಾಮೂನ್'] },
  { name_en: 'Ras Malai', name_kn: 'ರಸಮಲಾಯಿ', price: 100, unit: 'Plate', keywords: ['ras malai', 'rasmalai', 'ರಸಮಲಾಯಿ'] },
  { name_en: 'Ice Cream', name_kn: 'ಐಸ್ ಕ್ರೀಮ್', price: 120, unit: 'Scoop', keywords: ['ice cream', 'icecream', 'ಐಸ್ ಕ್ರೀಮ್'] },
  { name_en: 'Kesari Bath', name_kn: 'ಕೇಸರಿ ಬಾತ್', price: 70, unit: 'Bowl', keywords: ['kesari bath', 'kesari', 'ಕೇಸರಿ ಬಾತ್'] },
  { name_en: 'Payasam', name_kn: 'ಪಾಯಸ', price: 80, unit: 'Bowl', keywords: ['payasam', 'ಪಾಯಸ'] }
];

// Helper to extract metadata (customer details, dates, destination, and dispatch methods)
function extractMetadata(text: string) {
  const metadata = {
    customerName: null as string | null,
    invoiceDate: null as string | null,
    destination: null as string | null,
    dispatchedThrough: null as string | null,
    buyerAddress: null as string | null,
    buyerGstin: null as string | null,
    consigneeName: null as string | null,
    consigneeAddress: null as string | null,
    consigneeGstin: null as string | null,
    termsOfDelivery: null as string | null
  };

  // Helper function to extract and truncate trailing keywords
  function extractAndClean(regex: RegExp): string | null {
    const match = text.match(regex);
    if (!match) return null;
    let val = match[1].trim();
    const separators = [
      /\b(?:and|add|delete|remove|with|dated|date|to|destination|dispatched|through|by|for|whose|address|is|billing|gstin|gst|consignee|buyer|orders|order|plates|plate|cups|cup|items)\b/i,
      /(?:ಮತ್ತು|ಸೇರಿಸಿ|ಹಾಕಿ|ತೆಗೆದುಹಾಕಿ|ಬೇಡ|ದಿನಾಂಕ|ಸ್ಥಳ|ವಿಳಾಸ|ಜಿಎಸ್ಟಿ|ಹೆಸರು|ಗ್ರಾಹಕರು|ಖರೀದಿದಾರರ|ಸ್ವೀಕರಿಸುವವರ|ರವಾನೆ)/i,
      /[\n\r,，.・!！?？]/
    ];
    for (const sep of separators) {
      const parts = val.split(sep);
      if (parts.length > 0) {
        val = parts[0].trim();
      }
    }
    return val || null;
  }

  // Helper to extract GSTIN (alphanumeric 10-25 char identifiers, ignoring spaces)
  function extractGstin(regex: RegExp): string | null {
    const match = text.match(regex);
    if (!match) return null;
    const clean = match[1].replace(/\s+/g, '').toUpperCase();
    // Convert Kannada numbers to standard digits if any
    const kanNumMap: Record<string, string> = {
      "೧": "1", "೨": "2", "೩": "3", "೪": "4", "೫": "5", "೬": "6", "೭": "7", "೮": "8", "೯": "9", "೦": "0"
    };
    let resolved = '';
    for (const char of clean) {
      resolved += kanNumMap[char] !== undefined ? kanNumMap[char] : char;
    }
    return resolved;
  }

  // 1. Customer/Buyer Name
  let rawName = extractAndClean(/(?:on the name of|in the name of|customer name is|customer name|customer is|buyer name is|buyer name|name is|\bname\b|bill to|for|client|consignee|ಹೆಸರು|ಗ್ರಾಹಕರ ಹೆಸರು|ಹೆಸರಿಗೆ|ಗ್ರಾಹಕರು)\s+([a-zA-Z0-9್-೯\s]{1,40})/i);
  
  if (!rawName) {
    // Try suffix patterns like "Name ಅವರಿಗೆ" or "Name ರವರಿಗೆ" or "Name ನಿಗೆ" or "Name ರಿಗೆ" or "Name ವಿಗೆ"
    const suffixMatch = text.match(/(?:^|\s)([a-zA-Z0-9್-೯\s]{1,30})\s*(?:ಅವರಿಗೆ|ರವರಿಗೆ|ನಿಗೆ|ರಿಗೆ|ವಿಗೆ|ಅವರ ಹೆಸರಿಗೆ|ಹೆಸರಿಗೆ)/i);
    if (suffixMatch) {
      let matchedName = suffixMatch[1].trim();
      const separators = [
        /\b(?:and|add|delete|remove|with|dated|date|to|destination|dispatched|through|by|for|whose|address|is|billing|gstin|gst|consignee|buyer|orders|order|plates|plate|cups|cup|items)\b/i,
        /(?:ಮತ್ತು|ಸೇರಿಸಿ|ಹಾಕಿ|ತೆಗೆದುಹಾಕಿ|ಬೇಡ|ದಿನಾಂಕ|ಸ್ಥಳ|ವಿಳಾಸ|ಜಿಎಸ್ಟಿ|ಹೆಸರು|ಗ್ರಾಹಕರು|ಖರೀದಿದಾರರ|ಸ್ವೀಕರಿಸುವವರ|ರವಾನೆ)/i,
        /[\n\r,，.・!！?？]/
      ];
      for (const sep of separators) {
        const parts = matchedName.split(sep);
        if (parts.length > 0) {
          matchedName = parts[0].trim();
        }
      }
      // If Kannada script, clean possessive 'ನ' (u0CA8)
      if (/[\u0C80-\u0CFF]/.test(matchedName) && matchedName.endsWith('ನ')) {
        matchedName = matchedName.slice(0, -1);
      }
      rawName = matchedName;
    }
  }

  if (rawName) {
    const formattedName = rawName.split(/\s+/).map(word => {
      if (!word) return '';
      if (/^[a-zA-Z]/.test(word)) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
      return word; // Keep Kannada script unchanged
    }).join(' ');
    if (formattedName.toLowerCase() !== 'the' && formattedName.toLowerCase() !== 'a' && formattedName.toLowerCase() !== 'menu' && formattedName.toLowerCase() !== 'bill' && formattedName.toLowerCase() !== 'invoice') {
      metadata.customerName = formattedName;
    }
  }

  // 2. Invoice Date
  metadata.invoiceDate = extractAndClean(/(?:dated|date is|date|ದಿನಾಂಕ)\s+([0-9a-zA-Z\s್-೯]+)/i);

  // 3. Destination
  const rawDest = extractAndClean(/(?:destination is|destination|ship to|to|ತಲುಪುವ ಸ್ಥಳ|ಸ್ಥಳ)\s+([a-zA-Z0-9್-೯\s]+)/i);
  if (rawDest) {
    const lowerCand = rawDest.toLowerCase();
    const isFoodKeyword = LOCAL_MENU_DATABASE.some(item => 
      item.keywords.some(kw => lowerCand.includes(kw) || kw.includes(lowerCand))
    );
    if (!isFoodKeyword && lowerCand !== 'the' && lowerCand !== 'a' && lowerCand !== 'customer' && lowerCand !== 'consignee') {
      metadata.destination = rawDest;
    }
  }

  // 4. Dispatched Through
  const rawDisp = extractAndClean(/(?:dispatched through|dispatch through|by|ರವಾನೆ ವಿಧಾನ)\s+([a-zA-Z\s್-೯]+)/i);
  if (rawDisp) {
    const lowerCand = rawDisp.toLowerCase();
    const isFoodKeyword = LOCAL_MENU_DATABASE.some(item => 
      item.keywords.some(kw => lowerCand.includes(kw) || kw.includes(lowerCand))
    );
    if (!isFoodKeyword && lowerCand !== 'the' && lowerCand !== 'a' && lowerCand !== 'customer') {
      metadata.dispatchedThrough = rawDisp;
    }
  }

  // 5. Buyer Address
  metadata.buyerAddress = extractAndClean(/(?:buyer address is|buyer address|buyer billing address|billing address|whose address is|address is|address|ಖರೀದಿದಾರರ ವಿಳಾಸ)\s+([a-zA-Z0-9್-೯\s,.-]+)/i);

  // 6. Buyer GSTIN
  metadata.buyerGstin = extractGstin(/(?:buyer gstin|buyer gst|buyer gst number|ಖರೀದಿದಾರರ ಜಿಎಸ್ಟಿ)\s+([a-zA-Z0-9್-೯\s]{15,25})/i);

  // 7. Consignee Name
  metadata.consigneeName = extractAndClean(/(?:consignee name is|consignee name|ship to name|ಸ್ವೀಕರಿಸುವವರ ಹೆಸರು)\s+([a-zA-Z0-9್-೯\s]+)/i);

  // 8. Consignee Address
  metadata.consigneeAddress = extractAndClean(/(?:consignee address is|consignee address|shipping address|whose address is|address is|address|ಸ್ವೀಕರಿಸುವವರ ವಿಳಾಸ)\s+([a-zA-Z0-9್-೯\s,.-]+)/i);

  // 9. Consignee GSTIN
  metadata.consigneeGstin = extractGstin(/(?:consignee gstin|consignee gst|gstin|gst number|gst|ಸ್ವೀಕರಿಸುವವರ ಜಿಎಸ್ಟಿ)\s+([a-zA-Z0-9್-೯\s]{15,25})/i);

  // 10. Terms of Delivery
  metadata.termsOfDelivery = extractAndClean(/(?:terms of delivery|terms of delivery is|delivery terms|delivery terms is|terms of delivery are|delivery terms are|ವಿತರಣಾ ನಿಯಮಗಳು)\s+([a-zA-Z0-9್-೯\s]+)/i);

  // CROSS-FILL DEFAULT RULES FOR BILINGUAL INVOICES
  if (metadata.customerName && !metadata.consigneeName) {
    metadata.consigneeName = metadata.customerName;
  }
  if (metadata.consigneeName && !metadata.customerName) {
    metadata.customerName = metadata.consigneeName;
  }
  if (metadata.buyerAddress && !metadata.consigneeAddress) {
    metadata.consigneeAddress = metadata.buyerAddress;
  }
  if (metadata.consigneeAddress && !metadata.buyerAddress) {
    metadata.buyerAddress = metadata.consigneeAddress;
  }

  return metadata;
}

// Local mock parser fallback that updates items ledger
function fallbackLocalParser(transcript: string, currentItems: BillingItem[]): BillingItem[] {
  let items = [...currentItems];
  const text = transcript.toLowerCase();
  
  if (text.includes('remove') || text.includes('delete') || text.includes('ತೆಗೆದುಹಾಕಿ') || text.includes('ಬೇಡ')) {
    for (const menuItem of LOCAL_MENU_DATABASE) {
      if (menuItem.keywords.some(kw => text.includes(kw))) {
        items = items.filter(i => i.item_name_en.toLowerCase() !== menuItem.name_en.toLowerCase());
      }
    }
    return items;
  }

  // Find all matches of menu items in the text
  interface Match {
    menuItem: typeof LOCAL_MENU_DATABASE[0];
    index: number;
    keywordLength: number;
  }
  const matches: Match[] = [];

  for (const menuItem of LOCAL_MENU_DATABASE) {
    for (const keyword of menuItem.keywords) {
      const idx = text.indexOf(keyword);
      if (idx !== -1) {
        matches.push({
          menuItem,
          index: idx,
          keywordLength: keyword.length
        });
        break; // Match this menu item once
      }
    }
  }

  // Sort matches by index (left to right)
  matches.sort((a, b) => a.index - b.index);

  const numberWordMap: Record<string, number> = {
    ondu: 1, one: 1, "ಒಂದು": 1, "೧": 1,
    eradu: 2, two: 2, "ಎರಡು": 2, "೨": 2,
    mooru: 3, three: 3, "ಮೂರು": 3, "೩": 3,
    naalku: 4, four: 4, "ನಾಲ್ಕು": 4, "೪": 4,
    aidu: 5, five: 5, "ಐದು": 5, "೫": 5,
    aaru: 6, six: 6, "ಆರು": 6, "೬": 6,
    elu: 7, seven: 7, "ಏಳು": 7, "೭": 7,
    entu: 8, eight: 8, "ಎಂಟು": 8, "೮": 8,
    ombattu: 9, nine: 9, "ಒಂಬತ್ತು": 9, "೯": 9,
    hattu: 10, ten: 10, "ಹತ್ತು": 10, "೧೦": 10
  };

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    
    // Define search boundaries
    const leftBoundary = i > 0 ? matches[i - 1].index + matches[i - 1].keywordLength : 0;
    const rightBoundary = i < matches.length - 1 ? matches[i + 1].index : text.length;

    const leftSub = text.substring(leftBoundary, match.index);
    const rightSub = text.substring(match.index + match.keywordLength, rightBoundary);

    let qty = 1;
    let foundQty = false;

    // 1. Search in the left substring (last word first - English order)
    const leftWords = leftSub.split(/[\s,，.・!！?？+&]+/);
    for (let w = leftWords.length - 1; w >= 0; w--) {
      const word = leftWords[w].trim();
      if (!word) continue;

      if (numberWordMap[word] !== undefined) {
        qty = numberWordMap[word];
        foundQty = true;
        break;
      }
      const num = parseFloat(word);
      if (!isNaN(num)) {
        qty = num;
        foundQty = true;
        break;
      }
    }

    // 2. If not found in left, search in the right substring (first word first - Kannada order)
    if (!foundQty) {
      const rightWords = rightSub.split(/[\s,，.・!！?？+&]+/);
      for (let w = 0; w < rightWords.length; w++) {
        const word = rightWords[w].trim();
        if (!word) continue;

        if (numberWordMap[word] !== undefined) {
          qty = numberWordMap[word];
          foundQty = true;
          break;
        }
        const num = parseFloat(word);
        if (!isNaN(num)) {
          qty = num;
          foundQty = true;
          break;
        }
      }
    }

    const existingIndex = items.findIndex(i => i.item_name_en.toLowerCase() === match.menuItem.name_en.toLowerCase());
    if (existingIndex > -1) {
      items[existingIndex].quantity += qty;
    } else {
      items.push({
        item_name_en: match.menuItem.name_en,
        item_name_kn: match.menuItem.name_kn,
        quantity: qty,
        unit: match.menuItem.unit,
        unit_price: match.menuItem.price
      });
    }
  }

  return items;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { rawTranscript, items = [] } = body;

    if (!rawTranscript) {
      return NextResponse.json({ error: 'Missing transcript parameters.' }, { status: 400 });
    }

    const meta = extractMetadata(rawTranscript);
    const NVAPI_KEY = process.env.NVAPI_KEY;
    const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';

    if (!NVAPI_KEY || NVAPI_KEY.trim() === '') {
      const updatedItems = fallbackLocalParser(rawTranscript, items);
      return NextResponse.json({
        success: true,
        extractedData: { 
          items: updatedItems,
          customer_name: meta.customerName,
          invoice_date: meta.invoiceDate,
          destination: meta.destination,
          dispatched_through: meta.dispatchedThrough,
          buyer_address: meta.buyerAddress,
          buyer_gstin: meta.buyerGstin,
          consignee_name: meta.consigneeName,
          consignee_address: meta.consigneeAddress,
          consignee_gstin: meta.consigneeGstin,
          terms_of_delivery: meta.termsOfDelivery
        },
        note: 'Processed via local offline parser fallback.'
      });
    }

    const systemPrompt = `You are a professional retail billing backend JSON extraction engine specialized in South Indian grocery and restaurant food semantics.
Your core operational objective is parsing text commands (which can be spoken in English, Kannada, or mixed Code-Switched Kannada spoken phonetically in English script) to maintain and modify a billing invoice items ledger.

Current invoice items list:
${JSON.stringify(items, null, 2)}

Menu Database available:
${JSON.stringify(LOCAL_MENU_DATABASE, null, 2)}

Instructions:
1. Parse the new voice command. It can command you to ADD items (e.g. "Add 2 basmati rice", "ಎರಡು ಮಸಾಲ ಚಹಾ"), REMOVE items (e.g. "Remove tea", "ಬೇಡ"), or MODIFY quantities/prices (e.g. "change coffee rate to 50").
2. Standardize numerical counts to Arabic numerals.
3. Map items to their bilingual representation in the database where available. Always output English name ('item_name_en') AND Kannada script equivalent ('item_name_kn').
4. STRICT INSTRUCTION: Only add items that exist in the provided Menu Database. If the spoken dish is NOT found in the database, DO NOT add it to the items array.
5. If a customer name or buyer name is specified (e.g. "in the name of Bharath" or "customer name is Bharath" or "ಹೆಸರು ಭರತ್"), extract it in 'customer_name'.
6. If a date is specified (e.g. "dated 1st June" or "ದಿನಾಂಕ ಜೂನ್ 1"), extract it in 'invoice_date'.
7. If a shipping destination is specified (e.g. "destination Kundapura" or "to Kundapura" or "ಸ್ಥಳ ಕುಂದಾಪುರ"), extract it in 'destination'.
8. If a shipping mode/dispatcher is specified (e.g. "dispatched through road" or "by truck" or "ರವಾನೆ ರಸ್ತೆ ಮೂಲಕ"), extract it in 'dispatched_through'.
9. If a buyer address is specified (e.g. "buyer address is MG Road" or "ಖರೀದಿದಾರರ ವಿಳಾಸ ಬೆಂಗಳೂರು"), extract it in 'buyer_address'.
10. If a buyer GSTIN is specified (e.g. "buyer GSTIN is 29DAFPD7054C2ZD"), extract it in 'buyer_gstin'.
11. If a consignee name is specified (e.g. "consignee name is Ramesh"), extract it in 'consignee_name'. If consignee name is not specified but customer name is, set 'consignee_name' to customer name (and vice versa).
12. If a consignee address/shipping address is specified (e.g. "shipping address is Udupi"), extract it in 'consignee_address'. If buyer address is specified but consignee address is not, cross-fill consignee address to buyer address (and vice versa).
13. If a consignee GSTIN is specified (e.g. "consignee GST is 29DAFPD7054C2ZD"), extract it in 'consignee_gstin'.
14. If terms of delivery are specified (e.g. "terms of delivery is hand delivery" or "ವಿತರಣಾ ನಿಯಮಗಳು"), extract it in 'terms_of_delivery'.
15. Return strictly a single valid JSON object matching the specification schema below. Do not wrap the JSON output in markdown fences or include extra conversational explanation text.

Target Schema Specification:
{
  "customer_name": "String or null if unidentified",
  "invoice_date": "String or null if unidentified",
  "destination": "String or null if unidentified",
  "dispatched_through": "String or null if unidentified",
  "buyer_address": "String or null if unidentified",
  "buyer_gstin": "String or null if unidentified",
  "consignee_name": "String or null if unidentified",
  "consignee_address": "String or null if unidentified",
  "consignee_gstin": "String or null if unidentified",
  "terms_of_delivery": "String or null if unidentified",
  "items": [
    {
      "item_name_en": "Standardized English Name",
      "item_name_kn": "Standardized Kannada Script Translation",
      "quantity": 1.00,
      "unit": "KG / Litre / Unit / Cup / Plate / Piece / Glass / Bowl / Scoop",
      "unit_price": 60.00
    }
  ]
}`;

    const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NVAPI_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'meta/llama-3.1-70b-instruct',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: rawTranscript }
        ],
        temperature: 0.1,
        max_tokens: 1024,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`NVIDIA API response error (${response.status}): ${errText}`);
    }

    const data: any = await response.json();
    const rawContent = data.choices[0].message.content.trim();
    
    let jsonString = rawContent;
    if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/^```json\s*/, '').replace(/```$/, '');
    }
    
    const parsedData = JSON.parse(jsonString);
    return NextResponse.json({ success: true, extractedData: parsedData });

  } catch (error: any) {
    console.error('NVIDIA NIM API transaction failure:', error.message);
    const body = await req.json().catch(() => ({}));
    const { rawTranscript, items = [] } = body;
    const meta = extractMetadata(rawTranscript || '');
    const updatedItems = fallbackLocalParser(rawTranscript || '', items);
    return NextResponse.json({
      success: true,
      extractedData: { 
        items: updatedItems,
        customer_name: meta.customerName,
        invoice_date: meta.invoiceDate,
        destination: meta.destination,
        dispatched_through: meta.dispatchedThrough,
        buyer_address: meta.buyerAddress,
        buyer_gstin: meta.buyerGstin,
        consignee_name: meta.consigneeName,
        consignee_address: meta.consigneeAddress,
        consignee_gstin: meta.consigneeGstin,
        terms_of_delivery: meta.termsOfDelivery
      },
      note: 'Processed via local fallback due to API error: ' + error.message
    });
  }
}
