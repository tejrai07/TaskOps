const Task = require('../models/Task');
const { evaluateTaskWithGemini } = require('../services/geminiService');

exports.evaluateTask = async (req, res) => {
    try {
        const { description, deadline, userEnergy } = req.body;
        const userId = req.user.id;
        
        if (!description || !deadline || !userEnergy) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Call Gemini Service
        const { structuredOutput, toolCall, error: aiError } = await evaluateTaskWithGemini(description, deadline, userEnergy);
        
        if (!structuredOutput) {
            const reason = aiError || 'Failed to generate structured response from AI';
            return res.status(500).json({ error: reason });
        }

        // Extract from structuredOutput
        const { analysis, routing, execution_payload } = structuredOutput;
        
        let targetTool = routing.target_tool;
        // Verify tool matching
        if (toolCall) {
            targetTool = toolCall.name;
            // Simulated execution
            console.log(`Executing Tool: ${toolCall.name} with arguments`, toolCall.args);
        }

        // Create Task in DB
        const newTask = new Task({
            userId,
            description,
            deadline,
            userEnergy,
            urgencyScore: analysis.calculated_urgency,
            burnoutIndex: analysis.burnout_index,
            aiRationale: analysis.rationale,
            routedAction: routing.action,
            targetTool: targetTool,
            aiMessage: execution_payload.user_message,
            personalizedRecommendation: execution_payload.personalized_recommendation
        });

        await newTask.save();

        res.status(201).json({
            task: newTask,
            structuredOutput: structuredOutput,
            toolExecuted: toolCall ? toolCall.name : null,
            toolArgs: toolCall ? toolCall.args : null
        });

    } catch (error) {
        console.error('Error evaluating task:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};

exports.getTasks = async (req, res) => {
    try {
        const userId = req.user.id;
        const tasks = await Task.find({ userId }).sort({ createdAt: -1 });
        res.status(200).json(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
