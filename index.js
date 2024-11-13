const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const OpenAI = require('openai');
const axios = require('axios');

const client = new Client({
    authStrategy: new LocalAuth(),
});


let lastResponse = "";
let lastPrompt = "";

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('Scan kode QR di atas untuk autentikasi.');
});


client.on('ready', () => {
    console.log('Bot sudah siap digunakan!');
});


client.on("message", async (message) => {
    const chat = await message.getChat();
 
    if (!chat.isGroup) {
        if (message.body.toLowerCase() === "hello") {
            lastResponse = "Hai, saya adalah Tag All bot!";
            console.log("Last response set to:", lastResponse);
            await message.reply(lastResponse);
        }
    } 
   
    else if ((message.body.split(" ").includes("@team") || message.body.split(" ").includes("@everyone")) && chat.isGroup) {
        let text = "";
        let mentions = [];

        for (let participant of chat.participants) {
            const contact = await client.getContactById(participant.id._serialized);
            mentions.push(contact);
            text += `@${participant.id.user} `;
        }

        lastResponse = text;
        console.log("Last response set to:", lastResponse);
        await chat.sendMessage(text, { mentions });
    }
});


client.on("message", async (message) => {
    const chat = await message.getChat();
    if (message.body.toLowerCase() === "hey ridho ulang tahun") {
        lastResponse = "Wah, teman Ivan ulang tahun! Selamat ulang tahun, Ridho! Semoga panjang umur, sehat selalu, dan segala harapan serta impiannya tercapai. Nikmati hari spesialmu!";
        console.log("Last response set to:", lastResponse);
        await message.reply(lastResponse);
    }
});


const openai = new OpenAI({
    apiKey: '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', // Ganti dengan API key OpenAI Anda
    baseURL: 'https://integrate.api.nvidia.com/v1',
});

async function generateAIResponse(prompt) {
    const completion = await openai.chat.completions.create({
        model: "meta/llama3-70b-instruct",
        messages: [{ "role": "user", "content": prompt + " pakai bahasa Indonesia ya responya." }],
        temperature: 0.5,
        top_p: 1,
        max_tokens: 1024,
        stream: true,
    });

    let response = "";
    for await (const chunk of completion) {
        response += chunk.choices[0]?.delta?.content || '';
    }
    lastResponse = response; // Store the last response
    console.log("Last response set to:", lastResponse);
    return response;
}


client.on("message", async (message) => {
    const chat = await message.getChat();
    const lowerCaseMessage = message.body.toLowerCase();

    
    if (lowerCaseMessage === "/imvanz bot mulai") {
        lastResponse = "Saya Imvanz Assistance siap membantu Anda!";
        console.log("Last response set to:", lastResponse);
        await message.reply(lastResponse);
    }
   
    else if (lowerCaseMessage === "/stop") {
        lastResponse = "Bot dihentikan. Terima kasih sudah menggunakan layanan ini.";
        console.log("Last response set to:", lastResponse);
        await message.reply(lastResponse);
        client.destroy(); // Stop the bot
    }
    
    else if (lowerCaseMessage.startsWith("/askai") && chat.isGroup) {
        const prompt = message.body.slice(6).trim(); // Extract question after /askai command
        if (prompt) {
            lastPrompt = prompt; // Save the original prompt for further context
            const aiResponse = await generateAIResponse(prompt);
            await message.reply(aiResponse || "AI tidak memberikan respons, coba lagi.");
        } else {
            await message.reply("Harap berikan pertanyaan setelah /askai untuk mendapatkan respons AI.");
        }
    }
   
    else if (lowerCaseMessage.startsWith("/replay")) {
        const additionalContext = message.body.slice(7).trim(); // Get additional context after /replay
        if (lastPrompt) {
            const combinedPrompt = `${lastPrompt}. Berikut adalah tambahan konteks: ${additionalContext}`;
            const aiResponse = await generateAIResponse(combinedPrompt);
            await message.reply(aiResponse || "AI tidak memberikan respons, coba lagi.");
        } else {
            await message.reply("Tidak ada pertanyaan sebelumnya untuk dijawab ulang.");
        }
    }
});

// Initialize the bot
client.initialize();
