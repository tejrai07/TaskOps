const { evaluateTaskWithGemini } = require('./services/geminiService');

async function test() {
    try {
        const result = await evaluateTaskWithGemini("Do my laundry", "Tomorrow", 5);
        console.log("Success:", JSON.stringify(result, null, 2));
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
