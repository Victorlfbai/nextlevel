//Lógica do Chatbot
const btnAbrirChat = document.getElementById('btn-abrir-chat');
const btnFecharChat = document.getElementById('btn-fechar-chat'); 
const janelaChat = document.getElementById('janela-chat');
const corpoChat = document.getElementById('corpo-chat');
const inputChat = document.getElementById('input-chat');
const btnEnviarChat = document.getElementById('btn-enviar-chat');
const seletorAI = document.getElementById('seletor-ai');

//ATUALIZAÇÃO DO CHAT Array para historico de conversa
// Mensagem de sistema para definir a personalidade do chatbot
let historicoConversa = [
    {
        role: "user",
        parts: [{ text: "Você é um assistente virtual amigável, prestativo e divertido. Sempre responda de forma clara, curta e objetiva, educada e com um toque de bom humor." }]
    }
];

const CHAVE_API = {
    gemini: "AIzaSyCl-it6f6V1d7K0_HEhF6o7rwzcwMLAuDg", //Chave Gemini
    claude: ""
};

btnAbrirChat.addEventListener('click', () => {
    janelaChat.classList.add('aberta');
    btnAbrirChat.classList.add('hidden');
}); //abrir chat

btnFecharChat.addEventListener('click', () => {
    janelaChat.classList.remove('aberta');
    btnAbrirChat.classList.remove('hidden');
}); //fechar chat

const enviarMensagem = async () => {
    const mensagemUsario = inputChat.value.trim();
    if (mensagemUsario === '') return;

    adicionarMensagemNaTela(mensagemUsario, 'mensagem-usuario');
    inputChat.value = '';

    historicoConversa.push({ role: "user", parts: [{ text: mensagemUsario }] });
    const divDigitando = adicionarMensagemNaTela('Digitando...', 'mensagem-bot');
    const iaSelecionada = seletorAI.value;

    try {
        const respostaIA = await obterRespostaDaIA(iaSelecionada);
        divDigitando.remove(); // Remove a mensagem de "Digitando..."
        adicionarMensagemNaTela(respostaIA, 'mensagem-bot');    
        historicoConversa.push({ role: "models", parts: [{ text: respostaIA }] });
    } catch (error) {
        console.error("Erro ao obter resposta da IA:", error);
        divDigitando.remove(); // Remove a mensagem de "Digitando..."
        adicionarMensagemNaTela("Erro ao obter resposta da IA. Tente novamente.", 'mensagem-bot');
    }
}

function adicionarMensagemNaTela(texto, classe) {
    const divMensagem = document.createElement('div');
    divMensagem.className = classe;
    // Substitui \n por <br> para exibir quebras de linha corretamente
    const textoFormatado = texto.replace(/\n/g, '<br>');
    divMensagem.innerHTML = `<span>${textoFormatado}</span>`;
    corpoChat.appendChild(divMensagem);
    corpoChat.scrollTop = corpoChat.scrollHeight; // rolar para baixo
    return divMensagem; // Retorna a div para possível remoção posterior
}
async function obterRespostaDaIA(provedor) {
    switch (provedor) {
        case 'gemini':
            return await obterRespostaGemini();
        case 'claude':
            return await obterRespostaClaude();
        default:
            return "Provedor de IA não suportado."; 
    }
}
async function obterRespostaGemini() {
    const apiKey = CHAVE_API.gemini;
    if (!apiKey) {
        return "Chave de API do Gemini não configurada.";
    }
    // Endpoint correto para chat Gemini
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    // O payload correto para Gemini é apenas contents
    // role do bot deve ser "model" e não "models"
    historicoConversa = historicoConversa.map(msg => {
        if (msg.role === "models") return { ...msg, role: "model" };
        return msg;
    });
    const playload = {
        contents: historicoConversa
    };
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(playload)
        });
        if (!response.ok) {
            // Exibe o erro e o corpo da resposta para depuração
            const errorText = await response.text();
            return `Erro na API: ${response.statusText}\n${errorText}`;
        }
        const result = await response.json();
        if (result.candidates && result.candidates.length > 0) {
            const parts = result.candidates[0].content.parts;
            return parts.map(p => p.text).join('\n');
        } else {
            return "Nenhuma resposta encontrada.";
        }
    } catch (error) {
        return "Erro ao conectar à API Gemini.";
    }
}
btnEnviarChat.addEventListener('click', enviarMensagem);
inputChat.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        enviarMensagem();
    }
});