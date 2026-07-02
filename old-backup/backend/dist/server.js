"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./db");
const pdf_1 = require("./pdf");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const PORT = process.env.PORT || 5005; // Use 5005 as macOS port 5000 is occupied
const NVAPI_KEY = process.env.NVAPI_KEY;
const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
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
// Helper to extract customer details, dates, destination, and dispatch methods
function extractMetadata(text) {
    const metadata = {
        customerName: null,
        invoiceDate: null,
        destination: null,
        dispatchedThrough: null
    };
    // 1. Customer Name (e.g. "in the name of bha", "customer is raj", "client raj")
    const nameMatch = text.match(/(?:in the name of|customer name is|customer|client|consignee)\s+([a-zA-Z0-9್-೯]+)/i);
    if (nameMatch) {
        const candidate = nameMatch[1].trim();
        const lowerCand = candidate.toLowerCase();
        if (lowerCand !== 'menu' && lowerCand !== 'bill' && lowerCand !== 'invoice') {
            metadata.customerName = candidate;
        }
    }
    // 2. Invoice Date (e.g. "dated 1st June", "dated june 1st", "date is 31st may")
    const dateMatch = text.match(/(?:dated|date is|date)\s+([0-9a-zA-Z\s]+?)(?:to|by|for|$)/i);
    if (dateMatch) {
        metadata.invoiceDate = dateMatch[1].trim();
    }
    // 3. Destination (e.g. "destination Kundapura", "ship to Mulki", "to mulki")
    const destMatch = text.match(/(?:destination is|destination|ship to|to)\s+([a-zA-Z0-9್-೯]+)/i);
    if (destMatch) {
        const cand = destMatch[1].trim();
        const lowerCand = cand.toLowerCase();
        const isFoodKeyword = LOCAL_MENU_DATABASE.some(item => item.keywords.some(kw => lowerCand.includes(kw) || kw.includes(lowerCand)));
        if (!isFoodKeyword && lowerCand !== 'the' && lowerCand !== 'a' && lowerCand !== 'customer' && lowerCand !== 'consignee') {
            metadata.destination = cand;
        }
    }
    // 4. Dispatched Through (e.g. "dispatched through road", "by truck")
    const dispatchMatch = text.match(/(?:dispatched through|dispatch through|by)\s+([a-zA-Z\s]+?)(?:to|for|$)/i);
    if (dispatchMatch) {
        const cand = dispatchMatch[1].trim();
        const lowerCand = cand.toLowerCase();
        const isFoodKeyword = LOCAL_MENU_DATABASE.some(item => item.keywords.some(kw => lowerCand.includes(kw) || kw.includes(lowerCand)));
        if (!isFoodKeyword && lowerCand !== 'the' && lowerCand !== 'a' && lowerCand !== 'customer') {
            metadata.dispatchedThrough = cand;
        }
    }
    return metadata;
}
// Local mock parser fallback that updates items ledger
function fallbackLocalParser(transcript, currentItems) {
    console.log('Using menu-filtered local parser for transcript:', transcript);
    const items = [...currentItems];
    const text = transcript.toLowerCase();
    // Handlers for removal commands
    if (text.includes('remove') || text.includes('delete') || text.includes('ತೆಗೆದುಹಾಕಿ') || text.includes('ಬೇಡ')) {
        for (const menuItem of LOCAL_MENU_DATABASE) {
            if (menuItem.keywords.some(kw => text.includes(kw))) {
                return items.filter(i => i.item_name_en.toLowerCase() !== menuItem.name_en.toLowerCase());
            }
        }
    }
    // Find numeric quantity in the text
    const numberWordMap = {
        ondu: 1, one: 1, "ಒಂದು": 1, "೧": 1,
        eradu: 2, two: 2, "ಎರಡು": 2, "೨": 2,
        mooru: 3, three: 3, "ಮೂರು": 3, "೩": 3,
        naalku: 4, four: 4, "ನಾಲ್ಕು": 4, "೪": 4,
        aidu: 5, five: 5, "ಐದು": 5, "೫": 5
    };
    let qty = 1;
    const words = text.split(/\s+/);
    for (const word of words) {
        if (numberWordMap[word] !== undefined) {
            qty = numberWordMap[word];
            break;
        }
        const num = parseFloat(word);
        if (!isNaN(num)) {
            qty = num;
            break;
        }
    }
    // Scan against the menu database items
    let matched = false;
    for (const menuItem of LOCAL_MENU_DATABASE) {
        if (menuItem.keywords.some(kw => text.includes(kw))) {
            const existingIndex = items.findIndex(i => i.item_name_en.toLowerCase() === menuItem.name_en.toLowerCase());
            if (existingIndex > -1) {
                items[existingIndex].quantity += qty;
            }
            else {
                items.push({
                    item_name_en: menuItem.name_en,
                    item_name_kn: menuItem.name_kn,
                    quantity: qty,
                    unit: menuItem.unit,
                    unit_price: menuItem.price
                });
            }
            matched = true;
            break;
        }
    }
    // STRICT BEHAVIOR: DO NOT fallback to raw transcript insertion.
    // If the dish is NOT present in the menu database, we do not add it!
    if (!matched) {
        console.log(`Ingestion ignored: Command "${transcript}" contains no matched dish in food catalog.`);
    }
    return items;
}
// 1. Process Speech Transcript using NVIDIA NIM or Fallback
app.post('/api/process-voice', async (req, res) => {
    const { rawTranscript, items = [] } = req.body;
    if (!rawTranscript) {
        return res.status(400).json({ error: 'Missing transcript parameters.' });
    }
    // Extract metadata (customer name, date, shipping details)
    const meta = extractMetadata(rawTranscript);
    if (!NVAPI_KEY || NVAPI_KEY.trim() === '') {
        const updatedItems = fallbackLocalParser(rawTranscript, items);
        return res.status(200).json({
            success: true,
            extractedData: {
                items: updatedItems,
                customer_name: meta.customerName,
                invoice_date: meta.invoiceDate,
                destination: meta.destination,
                dispatched_through: meta.dispatchedThrough
            },
            note: 'Processed via local offline parser fallback.'
        });
    }
    try {
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
5. If a customer name is specified (e.g. "in the name of Bha" or "for Bharath"), extract it and output it in the 'customer_name' field.
6. If a date is specified (e.g. "dated 1st June"), extract it and output it in the 'invoice_date' field.
7. If a shipping destination is specified (e.g. "destination Kundapura" or "to Kundapura"), extract it and output it in the 'destination' field.
8. If a shipping mode/dispatcher is specified (e.g. "dispatched through road" or "by truck"), extract it and output it in the 'dispatched_through' field.
9. Return strictly a single valid JSON object matching the specification schema below. Do not wrap the JSON output in markdown fences or include extra conversational explanation text.

Target Schema Specification:
{
  "customer_name": "String or null if unidentified",
  "invoice_date": "String or null if unidentified",
  "destination": "String or null if unidentified",
  "dispatched_through": "String or null if unidentified",
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
        const data = await response.json();
        const rawContent = data.choices[0].message.content.trim();
        let jsonString = rawContent;
        if (jsonString.startsWith('```')) {
            jsonString = jsonString.replace(/^```json\s*/, '').replace(/```$/, '');
        }
        const parsedData = JSON.parse(jsonString);
        res.status(200).json({ success: true, extractedData: parsedData });
    }
    catch (error) {
        console.error('NVIDIA NIM API transaction failure:', error.message);
        const updatedItems = fallbackLocalParser(rawTranscript, items);
        res.status(200).json({
            success: true,
            extractedData: {
                items: updatedItems,
                customer_name: meta.customerName,
                invoice_date: meta.invoiceDate,
                destination: meta.destination,
                dispatched_through: meta.dispatchedThrough
            },
            note: 'Processed via local fallback due to API error: ' + error.message
        });
    }
});
// 2. Fetch Sessions List
app.get('/api/sessions', async (req, res) => {
    try {
        const sessions = await (0, db_1.dbAll)('SELECT * FROM billing_sessions ORDER BY created_at DESC');
        res.status(200).json({ success: true, sessions });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// 3. Create Session
app.post('/api/sessions', async (req, res) => {
    const { id, title } = req.body;
    const sessionId = id || 'sess_' + Math.floor(100000 + Math.random() * 900000);
    const sessionTitle = title || 'Voice Session ' + new Date().toLocaleTimeString();
    const isoDate = new Date().toISOString();
    try {
        await (0, db_1.dbRun)('INSERT INTO billing_sessions (id, session_title, created_at, updated_at) VALUES (?, ?, ?, ?)', [sessionId, sessionTitle, isoDate, isoDate]);
        res.status(200).json({ success: true, sessionId, title: sessionTitle });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// 4. Fetch Session Detail
app.get('/api/sessions/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const session = await (0, db_1.dbGet)('SELECT * FROM billing_sessions WHERE id = ?', [id]);
        if (!session) {
            return res.status(404).json({ error: 'Session not found.' });
        }
        const items = await (0, db_1.dbAll)('SELECT * FROM items_ledger WHERE session_id = ?', [id]);
        const history = await (0, db_1.dbAll)('SELECT * FROM chat_history WHERE session_id = ? ORDER BY created_at ASC', [id]);
        res.status(200).json({ success: true, session, items, history });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// 5. Update/Save Ledger Items and Chat History
app.post('/api/sessions/:id/commit', async (req, res) => {
    const { id } = req.params;
    const { items = [], chatLog = [], title, customerName, invoiceDate, destination, dispatchedThrough, termsOfDelivery, consigneeName, consigneeAddress, consigneeGstin, buyerAddress, buyerGstin } = req.body;
    const isoDate = new Date().toISOString();
    try {
        const session = await (0, db_1.dbGet)('SELECT * FROM billing_sessions WHERE id = ?', [id]);
        if (!session) {
            await (0, db_1.dbRun)(`INSERT INTO billing_sessions (
          id, session_title, created_at, updated_at, 
          customer_name, invoice_date, destination, dispatched_through, terms_of_delivery,
          consignee_name, consignee_address, consignee_gstin, buyer_address, buyer_gstin
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                id, title || 'Voice Session', isoDate, isoDate,
                customerName || '', invoiceDate || '', destination || '', dispatchedThrough || '', termsOfDelivery || '',
                consigneeName || '', consigneeAddress || '', consigneeGstin || '', buyerAddress || '', buyerGstin || ''
            ]);
        }
        else {
            await (0, db_1.dbRun)(`UPDATE billing_sessions SET 
          session_title = ?, 
          updated_at = ?,
          customer_name = ?,
          invoice_date = ?,
          destination = ?,
          dispatched_through = ?,
          terms_of_delivery = ?,
          consignee_name = ?,
          consignee_address = ?,
          consignee_gstin = ?,
          buyer_address = ?,
          buyer_gstin = ?
         WHERE id = ?`, [
                title || session.session_title,
                isoDate,
                customerName !== undefined ? customerName : session.customer_name,
                invoiceDate !== undefined ? invoiceDate : session.invoice_date,
                destination !== undefined ? destination : session.destination,
                dispatchedThrough !== undefined ? dispatchedThrough : session.dispatched_through,
                termsOfDelivery !== undefined ? termsOfDelivery : session.terms_of_delivery,
                consigneeName !== undefined ? consigneeName : session.consignee_name,
                consigneeAddress !== undefined ? consigneeAddress : session.consignee_address,
                consigneeGstin !== undefined ? consigneeGstin : session.consignee_gstin,
                buyerAddress !== undefined ? buyerAddress : session.buyer_address,
                buyerGstin !== undefined ? buyerGstin : session.buyer_gstin,
                id
            ]);
        }
        await (0, db_1.dbRun)('DELETE FROM items_ledger WHERE session_id = ?', [id]);
        for (const item of items) {
            const itemId = 'item_' + Math.floor(100000 + Math.random() * 900000);
            await (0, db_1.dbRun)(`INSERT INTO items_ledger (id, session_id, item_name_en, item_name_kn, quantity, unit, unit_price, total_price) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
                itemId,
                id,
                item.item_name_en,
                item.item_name_kn,
                item.quantity,
                item.unit,
                item.unit_price,
                item.quantity * item.unit_price
            ]);
        }
        await (0, db_1.dbRun)('DELETE FROM chat_history WHERE session_id = ?', [id]);
        for (const chat of chatLog) {
            const chatId = 'chat_' + Math.floor(100000 + Math.random() * 900000);
            const chatTime = chat.created_at || new Date().toISOString();
            await (0, db_1.dbRun)('INSERT INTO chat_history (id, session_id, sender_role, raw_transcript, created_at) VALUES (?, ?, ?, ?, ?)', [chatId, id, chat.role, chat.text, chatTime]);
        }
        res.status(200).json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// 6. Generate Bilingual Invoice PDF Endpoint
app.post('/api/generate-pdf', (req, res) => {
    const { items = [], sessionTitle = 'Invoice Ledger', customerName = '', invoiceDate = '', destination = '', dispatchedThrough = '', termsOfDelivery = '', consigneeName = '', consigneeAddress = '', consigneeGstin = '', buyerAddress = '', buyerGstin = '' } = req.body;
    if (items.length === 0) {
        return res.status(400).json({ error: 'Cannot emit document without billing items.' });
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=Bilingual_Invoice.pdf');
    try {
        (0, pdf_1.compileBilingualInvoicePDF)(items, sessionTitle, res, customerName, invoiceDate, destination, dispatchedThrough, termsOfDelivery, consigneeName, consigneeAddress, consigneeGstin, buyerAddress, buyerGstin);
    }
    catch (error) {
        console.error('PDF Generation pipeline error:', error.message);
        res.status(500).json({ error: 'PDF compilation routine failed.' });
    }
});
// Initialize DB and listen
(0, db_1.initDb)().then(() => {
    app.listen(PORT, () => {
        console.log(`\n======================================================`);
        console.log(`BILINGUAL INFRASTRUCTURE CORE ONLINE`);
        console.log(`Port: ${PORT}`);
        console.log(`API URL: http://localhost:${PORT}`);
        console.log(`NVIDIA Endpoint: ${NVAPI_KEY ? 'Active Service Key Configured' : 'Offline local-regex parser active'}`);
        console.log(`======================================================\n`);
    });
}).catch(err => {
    console.error('Failed to initialize database:', err);
});
