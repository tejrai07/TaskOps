const Habit = require('../models/Habit');

exports.getHabits = async (req, res) => {
    try {
        const habits = await Habit.find({ userId: req.user.id });
        res.status(200).json(habits);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch habits' });
    }
};

exports.addHabit = async (req, res) => {
    try {
        const newHabit = new Habit({
            userId: req.user.id,
            name: req.body.name
        });
        await newHabit.save();
        res.status(201).json(newHabit);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add habit' });
    }
};

exports.completeHabit = async (req, res) => {
    try {
        const habit = await Habit.findOne({ _id: req.params.id, userId: req.user.id });
        if (!habit) return res.status(404).json({ error: 'Habit not found' });
        
        const todayIST = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata", year: 'numeric', month: 'numeric', day: 'numeric' });
        
        if (habit.lastCompleted) {
            const lastCompletedIST = new Date(habit.lastCompleted).toLocaleString("en-US", { timeZone: "Asia/Kolkata", year: 'numeric', month: 'numeric', day: 'numeric' });
            if (lastCompletedIST === todayIST) {
                return res.status(400).json({ error: 'Already completed today' });
            }
        }
        
        habit.streak += 1;
        habit.lastCompleted = new Date();
        await habit.save();
        
        res.status(200).json(habit);
    } catch (error) {
        res.status(500).json({ error: 'Failed to complete habit' });
    }
};
