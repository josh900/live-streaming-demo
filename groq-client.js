// No need to import fetch, as it's built into modern browsers

export async function sendChatToGroq(message) {
    console.log('Sending chat to Groq:', message);
    try {
        const response = await fetch('/chat', {  // This will be a route we'll set up on our server
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.body;
    } catch (error) {
        console.error('Error sending chat to Groq:', error);
        throw error;
    }
}

export async function processChat(message) {
    try {
        const response = await sendChatToGroq(message);
        const reader = response.getReader();
        let fullResponse = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split('\n').filter(line => line.trim() !== '');
            for (const line of lines) {
                const trimmedLine = line.replace(/^data: /, '');
                if (trimmedLine === '[DONE]') {
                    return fullResponse.trim();
                }
                try {
                    const parsed = JSON.parse(trimmedLine);
                    const content = parsed.choices[0]?.delta?.content || '';
                    fullResponse += content;
                } catch (error) {
                    console.error('Error parsing JSON:', error);
                }
            }
        }

        return fullResponse.trim();
    } catch (error) {
        console.error('Error processing chat with Groq:', error);
        throw error;
    }
}