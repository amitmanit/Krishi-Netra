import { MessageSquare } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import translate from "google-translate-open-api";

type Lang = 'en' | 'hi' | 'bn' | 'es';

const translations: Record<string, Record<Lang, string>> = {
  assistant_name: { en: 'Krishi Netra Assistant', hi: 'कृषि नेत्र सहायक', bn: 'কৃষি নেট্রা সহায়ক', es: 'Asistente Krishi Netra' },
  ask_prompt: { en: 'Ask questions about your field', hi: 'अपने खेत के बारे में प्रश्न पूछें', bn: 'আপনার ক্ষেত সম্পর্কে প্রশ্ন করুন', es: 'Pregunte sobre su campo' },
  empty_hint: { en: 'Hi — ask about irrigation, pests, or sensors.', hi: 'नमस्ते — सिंचाई, कीट या सेंसर के बारे में पूछें।', bn: 'হ্যালো — সেচ, পোকামাকড় বা সেন্সর সম্পর্কে জিজ্ঞাসা করুন।', es: 'Hola — pregunte sobre riego, plagas o sensores.' },
  placeholder: { en: 'Ask farmer assistant...', hi: 'सहायक से पूछें...', bn: 'সহায়ককে জিজ্ঞাসা করুন...', es: 'Pregunte al asistente...' },
  close: { en: 'Close', hi: 'बंद करें', bn: 'বন্ধ করুন', es: 'Cerrar' },
  chat: { en: 'Chat', hi: 'चैट', bn: 'চ্যাট', es: 'Chat' },
  reply_water: { en: "It looks like your soil moisture is low in several spots. Consider scheduling irrigation in the morning.", hi: 'ऐसा लगता है कि कई जगहों पर मिट्टी की नमी कम है। सुबह सिंचाई करने पर विचार करें।', bn: 'মাটি আর্দ্রতা অনেক স্থানে কম মনে হচ্ছে। সকালে সেচ করার কথা ভাবুন।', es: 'Parece que la humedad del suelo es baja en varios puntos. Considere programar riego por la mañana.' },
  reply_pest: { en: 'Inspect the lower leaves for spots and yellowing. Apply an organic neem oil spray if pests are visible.', hi: 'निचले पत्तों पर धब्बे और पीला होना देखें। यदि कीट दिखाई दें तो सूक्ष्म नीम का तेल छिड़कें।', bn: 'নিচের পাতা দেখা এবং হলদেটে স্পট পরীক্ষা করুন। পোকামাকড় দেখা গেলে অর্গানিক নিম তেল ব্যবহার করুন।', es: 'Inspeccione las hojas inferiores por manchas y amarillamiento. Aplique un spray de aceite de neem orgánico si hay plagas visibles.' },
  reply_fert: { en: 'A soil test is recommended. For quick correction, consider applying a balanced NPK fertilizer following label rates.', hi: 'मिट्टी की जाँच की सिफारिश की जाती है। तात्कालिक सुधार के लिए, लेबल के अनुसार संतुलित NPK उर्वरक लागू करें।', bn: 'মাটি টেস্টের পরামর্শ দেওয়া হয়। দ্রুত সমাধানের জন্য লেবেল অনুযায়ী ব্যালান্সড NPK সার প্রয়োগ করুন।', es: 'Se recomienda una prueba de suelo. Para corrección rápida, considere aplicar un fertilizante NPK equilibrado siguiendo las indicaciones.' },
  reply_unknown: { en: 'Thanks for your question. I can help with irrigation, sensor readings, and basic crop advice. Could you provide the crop and field area?', hi: 'आपके प्रश्न के लिए धन्यवाद। मैं सिंचाई, सेंसर पढ़ने और बुनियादी फसल सलाह में मदद कर सकता हूँ। क्या आप फसल और क्षेत्र बताएंगे?', bn: 'আপনার প্রশ্নের জন্য ধন্যবাদ। আমি সেচ, সেন্সর পঠিত মান এবং সাধারণ ফসল পরামর্শে সাহায্য করতে পারি। দয়া করে ফসল এবং ক্ষেতের আকার বলুন।', es: 'Gracias por su pregunta. Puedo ayudar con riego, lecturas de sensores y consejos básicos de cultivo. ¿Puede indicar el cultivo y el área del campo?' }
};


export const Chatbot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{from: 'user'|'bot'; text: string;}>>([]);
  const [input, setInput] = useState("");
  const [lang, setLang] = useState<Lang>('en');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, open]);

  const t = (key: string) => {
    return translations[key]?.[lang] ?? translations[key]?.en ?? key;
  };


  const sendMessage = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setMessages(prev => [...prev, { from: 'user', text }] );
    setInput("");
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: text }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch response from server');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { from: 'bot', text: data.reply }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { from: 'bot', text: 'Error: Unable to get response.' }]);
    } finally {
      setLoading(false);
    }
  };

  const generateMockReplyKey = (q: string) => {
    const lower = q.toLowerCase();
    if (lower.includes('water') || lower.includes('irrig') || lower.includes('moist') || lower.includes('paani') ) return 'reply_water';
    if (lower.includes('pest') || lower.includes('disease') || lower.includes('keet') ) return 'reply_pest';
    if (lower.includes('fert') || lower.includes('nitrogen') || lower.includes('n') || lower.includes('uran') ) return 'reply_fert';
    if (lower.includes('hello') || lower.includes('hi') || lower.includes('namaste') || lower.includes('hola')) return 'reply_unknown';
    return 'reply_unknown';
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="flex items-end justify-end">
        {open && (
          <div className="w-80 max-h-96 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border overflow-hidden flex flex-col">
            <div className="flex items-center gap-3 p-3 border-b">
              <Avatar>
                <span className="text-sm font-bold">KN</span>
              </Avatar>
              <div>
                <div className="font-medium">{t('assistant_name')}</div>
                <div className="text-xs text-muted-foreground">{t('ask_prompt')}</div>
              </div>
              <div className="ml-2">
                <select value={lang} onChange={(e) => setLang(e.target.value as Lang)} className="text-sm rounded-md border p-1 bg-transparent">
                  <option value="en">EN</option>
                  <option value="hi">HI</option>
                  <option value="bn">BN</option>
                  <option value="es">ES</option>
                </select>
              </div>
              <div className="ml-auto">
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>{t('close')}</Button>
              </div>
            </div>

            <div ref={listRef} className="p-3 flex-1 overflow-auto space-y-3">
              {messages.length === 0 && (
                <div className="text-sm text-muted-foreground">{t('empty_hint')}</div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`${m.from === 'user' ? 'bg-primary text-white' : 'bg-muted/60'} px-3 py-2 rounded-lg max-w-[70%]`}>{m.text}</div>
                </div>
              ))}
            </div>

            <div className="p-3 border-t">
              <div className="flex gap-2">
                <Input value={input} onChange={(e) => setInput((e.target as HTMLInputElement).value)} placeholder={t('placeholder')} onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }} disabled={loading} />
                <Button onClick={sendMessage} disabled={loading}>{loading ? '...' : t('chat')}</Button>
              </div>
            </div>
          </div>
        )}

        <div className="ml-3">
          <Button onClick={() => setOpen(prev => !prev)} className="rounded-full p-3 shadow-lg bg-[hsl(var(--agro-primary))] text-white">{t('chat')}</Button>
        </div>
      </div>
    </div>
  );
};
